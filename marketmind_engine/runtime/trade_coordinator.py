from typing import Optional, List, Dict

from marketmind_engine.orchestrator.intraday_orchestrator import IntradayOrchestrator
from marketmind_engine.execution.execution_engine import ExecutionEngine
from marketmind_engine.execution.execution_input import ExecutionInput
from marketmind_engine.execution.execution_types import OrderIntent

from marketmind_engine.agents.lifecycle_manager import AgentLifecycleManager
from marketmind_engine.agents.agent_signal import AgentSignal
from marketmind_engine.execution.position_snapshot import PositionSnapshot

from marketmind_engine.narrative.narrative_adapter import NarrativeAdapter

from marketmind_engine.scoring.psiquanta import (
    compute_psiquant,
    IntentionMetrics,
    QuantMetrics,
)

# Capital propagation engine
from marketmind_engine.quant.capital_propagation_engine import CapitalPropagationEngine

# Symbol state registry
from marketmind_engine.intelligence.symbol_state_registry import SymbolStateRegistry


class TradeCoordinator:

    def __init__(
        self,
        orchestrator: IntradayOrchestrator,
        execution_engine: ExecutionEngine,
        narrative_adapter: Optional[NarrativeAdapter] = None,
        price_service=None,
        symbol_state_registry: Optional[SymbolStateRegistry] = None,
    ):
        self._orchestrator = orchestrator
        self._execution_engine = execution_engine
        self._lifecycle_manager = AgentLifecycleManager()

        self._narrative_adapter = narrative_adapter
        self._price_service = price_service

        self._capital_engine = CapitalPropagationEngine()

        # Symbol state history
        self._symbol_state_registry = symbol_state_registry

    # --------------------------------------------------
    # RSS POLLING
    # --------------------------------------------------

    def _poll_narrative(self):

        if not self._narrative_adapter:
            return

        try:
            self._narrative_adapter.worker.poll_once()
            self._narrative_adapter._update_projection()
        except Exception as e:
            print(f"[RSS] polling failure: {e}")

    # --------------------------------------------------
    # PROJECTION ROUTING
    # --------------------------------------------------

    def _route_projection_events(self):

        if not self._narrative_adapter:
            return

        events = self._narrative_adapter.get_projection_events()

        for event in events:

            self._lifecycle_manager.route_rss_event(
                {
                    "symbol": event.symbol,
                    "engine_time": event.engine_time,
                    "source": event.source,
                    "sentiment": event.sentiment,
                }
            )

    # --------------------------------------------------
    # PROPAGATION METRICS INJECTION
    # --------------------------------------------------

    def _inject_propagation_metrics(self, execution_input: ExecutionInput):

        if not self._narrative_adapter:
            return

        policy = getattr(execution_input, "policy_result", None)

        if not policy:
            return

        symbol = getattr(policy, "symbol", None)

        if not symbol:
            return

        try:

            snapshot = self._narrative_adapter.get_propagation_snapshot()

            if not snapshot:
                return

            metrics = snapshot.get(symbol)

            if not metrics:
                return

            fils = metrics.get("FILS", 0.0)
            ucip = metrics.get("UCIP", 0.0)
            drift = metrics.get("DRIFT", 0.0)
            ttcf = metrics.get("TTCF", 1.0)

            # --------------------------------------------------
            # STATE HISTORY DRIFT UPDATE
            # --------------------------------------------------

            if self._symbol_state_registry:

                previous = self._symbol_state_registry.update(
                    symbol,
                    fils,
                    ucip,
                )

                if previous:

                    delta_fils = fils - previous.last_fils
                    drift = delta_fils * ucip

            policy.fils = fils
            policy.ucip = ucip
            policy.drift = drift
            policy.ttcf = ttcf

        except Exception as e:

            print(f"[PROPAGATION] injection failure: {e}")

    # --------------------------------------------------
    # CAPITAL FIELD (Quant Propagation)
    # --------------------------------------------------

    def _fetch_quant_metrics(self, execution_input: ExecutionInput) -> Dict:

        if not self._price_service:
            return {}

        policy = getattr(execution_input, "policy_result", None)

        if not policy:
            return {}

        symbol = getattr(policy, "symbol", None)

        if not symbol:
            return {}

        try:

            quote = self._price_service.get_quote(symbol)

            if not quote:
                return {}

            price = quote.get("ap") or quote.get("bp")

            if not price:
                return {}

            print(f"[PRICE] {symbol} {quote}")

            self._capital_engine.update(symbol, price)

            metrics = self._capital_engine.get_metrics(symbol)

            return metrics

        except Exception as e:

            print(f"[PRICE] fetch failure {symbol}: {e}")
            return {}

    # --------------------------------------------------
    # EXIT AUTHORITY
    # --------------------------------------------------

    def _resolve_exit_intent(
        self,
        position_snapshot: PositionSnapshot,
        market_context_map: dict,
    ) -> Optional[OrderIntent]:

        self._lifecycle_manager.sync_with_portfolio(position_snapshot)

        signals: List[AgentSignal] = self._lifecycle_manager.evaluate_all(
            market_context_map
        )

        for signal in signals:

            if signal.action == "EXIT":

                position = position_snapshot.positions.get(signal.symbol)

                if not position:
                    continue

                return OrderIntent(
                    symbol=signal.symbol,
                    side="sell",
                    order_type="market",
                    quantity=position.quantity,
                    rationale=signal.reason,
                    confidence=signal.confidence,
                )

        return None

    # --------------------------------------------------
    # PSIQUANTA FUSION
    # --------------------------------------------------

    def _compute_psiquant(self, execution_input: ExecutionInput, quant_metrics: Dict):

        try:

            policy = getattr(execution_input, "policy_result", None)

            if not policy:
                return

            intention = IntentionMetrics(
                fils=(getattr(policy, "fils", 0.0) or 0.0),
                ucip=(getattr(policy, "ucip", 0.0) or 0.0),
                drift=(getattr(policy, "drift", 0.0) or 0.0),
                ttcf=(getattr(policy, "ttcf", 0.0) or 0.0),
            )

            quant = QuantMetrics(
                quant_drift=quant_metrics.get("qdrift", 0.0),
                momentum_alignment=quant_metrics.get("qucip", 0.0),
                liquidity=quant_metrics.get("qfils", 0.0),
                volatility=quant_metrics.get("qttcf", 0.0),
            )

            psi = compute_psiquant(intention, quant)

            setattr(policy, "psiquant_score", psi.psiquant_score)
            setattr(policy, "psi_narrative_force", psi.narrative_force)
            setattr(policy, "psi_capital_force", psi.capital_force)
            setattr(policy, "psi_chaos_filter", psi.chaos_filter)
            setattr(policy, "psi_propagation_strength", psi.propagation_strength)

            symbol = getattr(policy, "symbol", "UNKNOWN")

            print(
                f"[ΨQ] {symbol} score={psi.psiquant_score:.3f} "
                f"(FILS={intention.fils} UCIP={intention.ucip} DRIFT={intention.drift})"
            )

        except Exception as e:

            print(f"[PsiQuanta] scoring failure: {e}")

    # --------------------------------------------------
    # MAIN RUN LOOP
    # --------------------------------------------------

    def run(
        self,
        execution_input: ExecutionInput,
        market_context_map: Optional[dict] = None,
    ) -> dict:

        self._poll_narrative()

        regime_result = self._orchestrator.run_cycle()

        execution_block = regime_result.get("execution")

        directive = None

        if execution_block:

            from marketmind_engine.execution.policy.base import ExecutionDirective

            directive = ExecutionDirective(
                allow_entries=execution_block["allow_entries"],
                size_multiplier=execution_block["size_multiplier"],
                risk_level=execution_block["risk_level"],
            )

        self._route_projection_events()

        exit_intent = None

        if market_context_map:

            exit_intent = self._resolve_exit_intent(
                execution_input.position_snapshot,
                market_context_map,
            )

        if exit_intent:

            return {
                "regime": regime_result,
                "order_intent": exit_intent,
                "authority": "EXIT",
            }

        self._inject_propagation_metrics(execution_input)

        quant_metrics = self._fetch_quant_metrics(execution_input)

        self._compute_psiquant(execution_input, quant_metrics)

        entry_intent: Optional[OrderIntent] = self._execution_engine.evaluate(
            execution_input,
            execution_directive=directive,
        )

        return {
            "regime": regime_result,
            "order_intent": entry_intent,
            "authority": "ENTRY" if entry_intent else None,
        }