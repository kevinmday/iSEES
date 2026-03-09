from typing import Optional, List

from marketmind_engine.orchestrator.intraday_orchestrator import IntradayOrchestrator
from marketmind_engine.execution.execution_engine import ExecutionEngine
from marketmind_engine.execution.execution_input import ExecutionInput
from marketmind_engine.execution.execution_types import OrderIntent

from marketmind_engine.agents.lifecycle_manager import AgentLifecycleManager
from marketmind_engine.agents.agent_signal import AgentSignal
from marketmind_engine.execution.position_snapshot import PositionSnapshot

from marketmind_engine.narrative.narrative_adapter import NarrativeAdapter

# PsiQuanta Fusion
from marketmind_engine.scoring.psiquanta import (
    compute_psiquant,
    IntentionMetrics,
    QuantMetrics,
)


class TradeCoordinator:
    """
    Phase 13 — Projection Integrated (Controlled)

    Authority hierarchy:
        EXIT > ENTRY

    Projection feeds attention only.

    PsiQuanta Phase:
        Narrative + Quant fusion scoring injected
        before entry evaluation.
    """

    def __init__(
        self,
        orchestrator: IntradayOrchestrator,
        execution_engine: ExecutionEngine,
        narrative_adapter: Optional[NarrativeAdapter] = None,
    ):
        self._orchestrator = orchestrator
        self._execution_engine = execution_engine
        self._lifecycle_manager = AgentLifecycleManager()

        # Optional narrative injection
        self._narrative_adapter = narrative_adapter

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

    def _compute_psiquant(self, execution_input: ExecutionInput):

        """
        Computes PsiQuanta score and attaches it to policy_result.

        Fully safe — never interrupts engine loop.
        """

        try:

            policy = getattr(execution_input, "policy_result", None)
            state = getattr(execution_input, "market_state", None)

            if not policy or not state:
                return

            # ---------------------------
            # Intention metrics
            # ---------------------------

            intention = IntentionMetrics(
                fils=(getattr(policy, "fils", 0.0) or 0.0),
                ucip=(getattr(policy, "ucip", 0.0) or 0.0),
                drift=(getattr(policy, "drift", 0.0) or 0.0),
                ttcf=(getattr(policy, "ttcf", 0.0) or 0.0),
            )

            # ---------------------------
            # Quant metrics
            # ---------------------------

            quant = QuantMetrics(
                quant_drift=(getattr(state, "quant_drift", 0.0) or 0.0),
                momentum_alignment=(getattr(state, "momentum", 0.0) or 0.0),
                liquidity=(getattr(state, "liquidity", 1.0) or 1.0),
                volatility=(getattr(state, "volatility", 1.0) or 1.0),
            )

            psi = compute_psiquant(intention, quant)

            # Attach telemetry to policy result
            setattr(policy, "psiquant_score", psi.psiquant_score)
            setattr(policy, "psi_narrative_force", psi.narrative_force)
            setattr(policy, "psi_capital_force", psi.capital_force)
            setattr(policy, "psi_chaos_filter", psi.chaos_filter)
            setattr(policy, "psi_propagation_strength", psi.propagation_strength)

            # ---------------------------
            # Safe debug output
            # ---------------------------

            symbol = getattr(policy, "symbol", "UNKNOWN")
            print(f"[ΨQ] {symbol} score={psi.psiquant_score:.3f}")

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

        # --------------------------------------------------
        # 0. RSS Polling
        # --------------------------------------------------

        self._poll_narrative()

        # --------------------------------------------------
        # 1. Regime Authority
        # --------------------------------------------------

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

        # --------------------------------------------------
        # 2. Projection Routing
        # --------------------------------------------------

        self._route_projection_events()

        # --------------------------------------------------
        # 3. EXIT Authority
        # --------------------------------------------------

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

        # --------------------------------------------------
        # 4. PsiQuanta Fusion
        # --------------------------------------------------

        self._compute_psiquant(execution_input)

        # --------------------------------------------------
        # 5. ENTRY Authority
        # --------------------------------------------------

        entry_intent: Optional[OrderIntent] = self._execution_engine.evaluate(
            execution_input,
            execution_directive=directive,
        )

        return {
            "regime": regime_result,
            "order_intent": entry_intent,
            "authority": "ENTRY" if entry_intent else None,
        }