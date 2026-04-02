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

from marketmind_engine.intelligence.signal_classifier import classify_signal

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

        self._last_price: Dict[str, float] = {}

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
    # 🔥 FIXED: ALWAYS EMIT FIELD SIGNAL
    # --------------------------------------------------

    def _inject_propagation_metrics(self, execution_input: ExecutionInput):

        policy = getattr(execution_input, "policy_result", None)
        if not policy:
            return

        symbol = getattr(policy, "symbol", None)
        if not symbol:
            return

        try:
            fils = 0.0
            ucip = 0.0
            drift = 0.0
            ttcf = 1.0
            delta_fils = 0.0

            # Try to pull real propagation data (if available)
            if self._narrative_adapter:
                snapshot = self._narrative_adapter.get_propagation_snapshot()
                if snapshot and symbol in snapshot:
                    metrics = snapshot.get(symbol, {})
                    fils = metrics.get("FILS", 0.0)
                    ucip = metrics.get("UCIP", 0.0)
                    drift = metrics.get("DRIFT", 0.0)
                    ttcf = metrics.get("TTCF", 1.0)

            # State tracking (delta)
            if self._symbol_state_registry:
                timestamp = getattr(execution_input, "engine_time", None)

                previous = self._symbol_state_registry.update(
                    symbol,
                    fils,
                    ucip,
                    timestamp,
                    drift,
                )

                if previous:
                    delta_fils = fils - previous.last_fils

            # --------------------------------------------------
            # FIELD STATE (ALWAYS BUILT)
            # --------------------------------------------------

            state = {
                "delta_field": delta_fils,
                "drift": drift,
                "drift_slope": 0.0,
                "propagation_score": abs(fils * drift),
                "lifespan": getattr(policy, "life", 0),
            }

            field_signal = classify_signal(symbol, state)

            # Attach to policy
            policy.fils = fils
            policy.ucip = ucip
            policy.drift = drift
            policy.ttcf = ttcf
            policy.delta_fils = delta_fils
            policy.field_signal = field_signal

            # 🔥 GUARANTEED OUTPUT
            print(
                f"[FIELD_SIGNAL] {symbol} → {field_signal} "
                f"Δ={delta_fils:.5f} d={drift:.5f} "
                f"life={state['lifespan']}"
            )

        except Exception as e:
            print(f"[PROPAGATION] injection failure: {e}")

    # --------------------------------------------------

    def _fetch_quant_metrics(self, execution_input: ExecutionInput) -> Dict:

        policy = getattr(execution_input, "policy_result", None)
        if not policy:
            return {}

        symbol = getattr(policy, "symbol", None)
        if not symbol:
            return {}

        try:
            price = None

            if self._price_service:
                try:
                    quote = self._price_service.get_quote(symbol)
                    if isinstance(quote, dict):
                        candidate = quote.get("ap") or quote.get("bp")
                        if isinstance(candidate, (int, float)) and candidate > 0:
                            price = candidate
                except Exception:
                    pass

            if price is None:
                prev = self._last_price.get(symbol, 100.0)
                price = prev * 1.002
                print(f"[SYNTHETIC_PRICE] {symbol} {price:.4f}")

            self._last_price[symbol] = price

            self._capital_engine.update(symbol, price)
            return self._capital_engine.get_metrics(symbol)

        except Exception as e:
            print(f"[PRICE] fetch failure {symbol}: {e}")
            return {}

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

        self._route_projection_events()

        # 🔥 THIS IS THE CRITICAL CALL
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