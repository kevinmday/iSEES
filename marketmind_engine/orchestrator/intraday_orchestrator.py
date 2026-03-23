from dataclasses import dataclass
from time import time
from datetime import datetime
import pytz

from marketmind_engine.regime.systemic_monitor import (
    SystemicMonitor,
    SystemicInputs,
)
from marketmind_engine.regime.systemic_mode import SystemicMode
from marketmind_engine.regime.macro_sources.base import MacroInputSource
from marketmind_engine.regime.capital_recovery import CapitalRecoveryController
from marketmind_engine.regime.domain_modifier import DomainModifierController

from marketmind_engine.execution.policy.default_policy import (
    DefaultRegimeExecutionPolicy,
)
from marketmind_engine.execution.policy.base import ExecutionDirective

# ---------------------------------------
# MARKET DISCOVERY + PROPAGATION
# ---------------------------------------

from marketmind_engine.intelligence.symbol_discovery import discover
from marketmind_engine.intelligence.propagation_engine import PropagationEngine


@dataclass
class OrchestratorState:
    regime_mode: SystemicMode = SystemicMode.NORMAL
    market_phase: str = "closed"


class IntradayOrchestrator:

    def __init__(
        self,
        macro_source: MacroInputSource,
        portfolio=None,
        execution_engine=None,
        audit_writer=None,
        execution_policy=None,
        propagation_engine=None,
        broker=None,                    # 🔥 NEW
        narrative_adapter=None,         # 🔥 NEW
    ):
        self._macro_source = macro_source
        self._audit_writer = audit_writer

        self.systemic_monitor = SystemicMonitor()
        self.recovery_controller = CapitalRecoveryController()
        self.domain_modifier_controller = DomainModifierController()

        self.state = OrchestratorState()

        self.portfolio = portfolio
        self.execution_engine = execution_engine

        self._execution_policy = (
            execution_policy or DefaultRegimeExecutionPolicy()
        )

        # ---------------------------------------
        # PROPAGATION ENGINE
        # ---------------------------------------

        self.propagation = propagation_engine

        # ---------------------------------------
        # 🔥 NEW — PRICE + NARRATIVE HOOKS
        # ---------------------------------------

        self.broker = broker
        self.narrative_adapter = narrative_adapter

    # --------------------------------------------------
    # MARKET PHASE DETECTION
    # --------------------------------------------------

    def _market_phase(self):

        now = datetime.now(pytz.timezone("US/Eastern"))

        open_time = now.replace(hour=9, minute=30, second=0, microsecond=0)
        close_time = now.replace(hour=16, minute=0, second=0, microsecond=0)

        premarket_start = now.replace(hour=4, minute=0, second=0, microsecond=0)

        if now < premarket_start:
            return "closed"

        if premarket_start <= now < open_time:
            return "premarket"

        if open_time <= now < close_time:
            return "open"

        return "afterhours"

    # --------------------------------------------------
    # SYSTEMIC FLATTEN
    # --------------------------------------------------

    def _flatten_all_positions(self):

        if not self.portfolio or not self.execution_engine:
            return

        open_positions = self.portfolio.open_positions()

        for position in open_positions:
            self.execution_engine.close(position)

    # --------------------------------------------------
    # COMPOSITE SCORE
    # --------------------------------------------------

    def _composite_score(self, inputs: SystemicInputs) -> float:
        return (
            inputs.drawdown_velocity
            + inputs.liquidity_stress
            + inputs.correlation_spike
            + inputs.narrative_shock
            + inputs.structural_confirmation
        ) / 5.0

    # --------------------------------------------------
    # AUDIT TRANSITION HOOK
    # --------------------------------------------------

    def _audit_transition(
        self,
        previous_mode: SystemicMode,
        new_mode: SystemicMode,
        composite: float,
        flatten_all: bool,
        block_new_entries: bool,
    ):

        if not self._audit_writer:
            return

        from marketmind_engine.regime.audit.schema import RegimeTransitionEvent

        event = RegimeTransitionEvent(
            timestamp=time(),
            previous_regime=previous_mode.value,
            new_regime=new_mode.value,
            composite_score=composite,
            hard_interrupt=flatten_all,
            block_new_entries=block_new_entries,
            hysteresis_locked=(previous_mode == SystemicMode.STANDBY),
            macro_source_type=self._macro_source.source_type,
            injected_mode=(self._macro_source.source_type != "live"),
        )

        self._audit_writer.write(event)

    # --------------------------------------------------
    # RSS → PROPAGATION PIPELINE
    # --------------------------------------------------

    def _run_symbol_discovery(self):

        if not self.propagation:
            return

        try:

            symbols = discover(return_symbols=True)

            if not symbols:
                return

            for sym in symbols[:10]:

                try:

                    self.propagation.register_narrative_event(
                        symbol=sym,
                        domain="equities",
                        momentum=0.05,
                        source="rss"
                    )

                except Exception:
                    pass

        except Exception as e:

            print(f"Discovery pipeline error: {e}")

    # --------------------------------------------------
    # RUN CYCLE
    # --------------------------------------------------

    def run_cycle(self):

        # ---------------------------------------
        # MARKET PHASE
        # ---------------------------------------

        phase = self._market_phase()
        self.state.market_phase = phase

        # ---------------------------------------
        # DISCOVERY ALWAYS RUNS
        # ---------------------------------------

        self._run_symbol_discovery()

        # ---------------------------------------
        # 🔥 NEW — PRICE → NARRATIVE PIPELINE
        # ---------------------------------------

        if self.broker and self.narrative_adapter:

            try:

                # Try to get active symbols from propagation
                symbols = []

                if self.propagation:
                    try:
                        symbols = list(self.propagation.symbol_mentions.keys())
                    except Exception:
                        pass

                if symbols:

                    price_data = self.broker.get_prices(symbols)

                    # Clean None values
                    price_data = {
                        k: v for k, v in price_data.items()
                        if v is not None
                    }

                    if price_data:
                        self.narrative_adapter.ingest_price_data(price_data)

            except Exception as e:
                print(f"[PRICE INGEST ERROR] {e}")

        # ---------------------------------------
        # MARKET CLOSED → DISCOVERY ONLY
        # ---------------------------------------

        if phase == "closed":

            return {
                "timestamp": time(),
                "regime": "DISCOVERY",
                "execution": {
                    "allow_entries": False,
                    "size_multiplier": 0,
                    "risk_level": "none",
                },
                "composite_score": 0,
                "recovery_modifier": 1.0,
                "domain_modifier": 1.0,
                "market_phase": phase,
            }

        # ---------------------------------------
        # NORMAL SYSTEMIC MONITOR
        # ---------------------------------------

        macro_inputs = self._macro_source.collect()

        risk_directive = self.systemic_monitor.evaluate(macro_inputs)

        composite = self._composite_score(macro_inputs)

        previous_mode = self.state.regime_mode

        if risk_directive.flatten_all:

            if previous_mode != SystemicMode.STANDBY:
                self._audit_transition(
                    previous_mode,
                    SystemicMode.STANDBY,
                    composite,
                    flatten_all=True,
                    block_new_entries=True,
                )

            self._flatten_all_positions()
            self.state.regime_mode = SystemicMode.STANDBY

        elif previous_mode == SystemicMode.STANDBY:

            if composite < self.systemic_monitor.STRESSED_THRESHOLD:

                self._audit_transition(
                    previous_mode,
                    SystemicMode.NORMAL,
                    composite,
                    flatten_all=False,
                    block_new_entries=False,
                )

                self.state.regime_mode = SystemicMode.NORMAL

        else:

            if previous_mode != risk_directive.mode:
                self._audit_transition(
                    previous_mode,
                    risk_directive.mode,
                    composite,
                    flatten_all=False,
                    block_new_entries=risk_directive.block_new_entries,
                )

            self.state.regime_mode = risk_directive.mode

        self.recovery_controller.update(
            previous_mode=previous_mode.value,
            current_mode=self.state.regime_mode.value,
            composite_score=composite,
            stressed_threshold=self.systemic_monitor.STRESSED_THRESHOLD,
        )

        recovery_modifier = self.recovery_controller.modifier()
        domain_modifier = self.domain_modifier_controller.modifier()

        base_directive: ExecutionDirective = (
            self._execution_policy.resolve(self.state.regime_mode)
        )

        final_multiplier = (
            risk_directive.size_multiplier
            * recovery_modifier
            * domain_modifier
        )

        execution_directive = ExecutionDirective(
            allow_entries=(
                False
                if risk_directive.block_new_entries
                else base_directive.allow_entries
            ),
            size_multiplier=final_multiplier,
            risk_level=base_directive.risk_level,
        )

        return {
            "timestamp": time(),
            "regime": self.state.regime_mode.value,
            "execution": {
                "allow_entries": execution_directive.allow_entries,
                "size_multiplier": execution_directive.size_multiplier,
                "risk_level": execution_directive.risk_level,
            },
            "composite_score": composite,
            "recovery_modifier": recovery_modifier,
            "domain_modifier": domain_modifier,
            "market_phase": phase,
        }