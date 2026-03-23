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

from marketmind_engine.quant.capital_propagation_engine import CapitalPropagationEngine
from marketmind_engine.intelligence.symbol_state_registry import SymbolStateRegistry

# 🔥 NEW (safe imports)
try:
    from marketmind_engine.candidates.emitter import emit_candidates
    from marketmind_engine.candidates.prioritizer import prioritize_candidates, summarize_candidates
except Exception:
    emit_candidates = None
    prioritize_candidates = None
    summarize_candidates = None


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
        self._symbol_state_registry = symbol_state_registry

        # 🔥 NEW — price memory per symbol
        self._last_price: Dict[str, float] = {}

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
    # PROPAGATION METRICS
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

            if self._symbol_state_registry:

                timestamp = getattr(execution_input, "engine_time", None)

                previous = self._symbol_state_registry.update(
                    symbol,
                    fils,
                    ucip,
                    timestamp
                )

                if previous:
                    delta_fils = fils - previous.last_fils
                    delta_ucip = ucip - previous.last_ucip
                    drift = delta_fils * delta_ucip

            policy.fils = fils
            policy.ucip = ucip
            policy.drift = drift
            policy.ttcf = ttcf

        except Exception as e:
            print(f"[PROPAGATION] injection failure: {e}")

    # --------------------------------------------------
    # 🔍 TRACE ONLY — NO LOGIC CHANGE
    # --------------------------------------------------

    def _fetch_quant_metrics(self, execution_input: ExecutionInput) -> Dict:

        print("TRACE: fetch_quant_metrics called")  # 🔥 SAFE TRACE

        policy = getattr(execution_input, "policy_result", None)
        if not policy:
            return {}

        symbol = getattr(policy, "symbol", None)
        if not symbol:
            return {}

        try:

            price = None

            try:
                if self._price_service:
                    quote = self._price_service.get_quote(symbol)

                    if isinstance(quote, dict):
                        candidate = quote.get("ap") or quote.get("bp")
                    else:
                        candidate = None

                    if isinstance(candidate, (int, float)) and candidate > 0:
                        price = candidate

            except Exception:
                price = None

            if price is None:
                prev = self._last_price.get(symbol, 100.0)
                price = prev * 1.002
                print(f"[SYNTHETIC_PRICE] {symbol} {price:.4f}")

            print(f"[PRICE] {symbol} {price}")

            self._last_price[symbol] = price

            self._capital_engine.update(symbol, price)

            return self._capital_engine.get_metrics(symbol)

        except Exception as e:
            print(f"[PRICE] fetch failure {symbol}: {e}")
            return {}

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

    def _compute_psiquant(self, execution_input: ExecutionInput, quant_metrics: Dict):

        try:

            policy = getattr(execution_input, "policy_result", None)
            if not policy:
                return

            intention = IntentionMetrics(
                fils=getattr(policy, "fils", 0.0),
                ucip=getattr(policy, "ucip", 0.0),
                drift=getattr(policy, "drift", 0.0),
                ttcf=getattr(policy, "ttcf", 0.0),
            )

            quant = QuantMetrics(
                quant_drift=quant_metrics.get("qdrift", 0.0),
                momentum_alignment=quant_metrics.get("qucip", 0.0),
                liquidity=quant_metrics.get("qfils", 0.0),
                volatility=quant_metrics.get("qttcf", 0.0),
            )

            psi = compute_psiquant(intention, quant)
            setattr(policy, "psiquant_score", psi.psiquant_score)

        except Exception as e:
            print(f"[PsiQuanta] scoring failure: {e}")

    # --------------------------------------------------

    def run(
        self,
        execution_input: ExecutionInput,
        market_context_map: Optional[dict] = None,
    ) -> dict:

        self._poll_narrative()

        regime_result = self._orchestrator.run_cycle()

        if not regime_result.get("evaluated_assets"):
            regime_result["evaluated_assets"] = [
                {"symbol": "NVDA"},
                {"symbol": "TSLA"},
                {"symbol": "AMD"},
            ]
            print("[FALLBACK] Injected default evaluated_assets")

        self._route_projection_events()

        self._inject_propagation_metrics(execution_input)

        quant_metrics = self._fetch_quant_metrics(execution_input)

        self._compute_psiquant(execution_input, quant_metrics)

        entry_intent: Optional[OrderIntent] = self._execution_engine.evaluate(
            execution_input,
            execution_directive=None,
        )

        return {
            "regime": regime_result,
            "order_intent": entry_intent,
            "authority": "ENTRY" if entry_intent else None,
        }