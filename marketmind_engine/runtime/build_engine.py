"""
Authoritative Engine Assembly Harness (Injection-Capable)

Builds full runtime stack:

MacroSource
→ IntradayOrchestrator
→ ExecutionEngine
→ TradeCoordinator
→ ExecutionService
→ RuntimeExecutor
→ ExecutionInputFactory
→ EngineController
"""

from typing import Optional

from marketmind_engine.runtime.engine_controller import EngineController
from marketmind_engine.runtime.runtime_executor import RuntimeExecutor
from marketmind_engine.runtime.trade_coordinator import TradeCoordinator
from marketmind_engine.runtime.execution_input_factory import ExecutionInputFactory

from marketmind_engine.execution.execution_engine import ExecutionEngine
from marketmind_engine.execution.execution_service import ExecutionService

from marketmind_engine.orchestrator.intraday_orchestrator import IntradayOrchestrator

from marketmind_engine.regime.macro_sources.injected_source import InjectedMacroSource
from marketmind_engine.broker.paper_adapter import PaperBrokerAdapter
from marketmind_engine.policy.policy_types import PolicyAction

from marketmind_engine.core.engine_clock import EngineClock

# REAL RSS PIPELINE
from marketmind_engine.narrative.narrative_adapter import NarrativeAdapter

# LIVE PRICE PROVIDER
from marketmind_engine.data.alpaca_quote_provider import AlpacaQuoteProvider

# NEW STATE HISTORY REGISTRY
from marketmind_engine.intelligence.symbol_state_registry import SymbolStateRegistry


# ----------------------------------------------------------------------
# Default Stub Services
# ----------------------------------------------------------------------

class StubCapitalService:
    def snapshot(self):
        return type(
            "CapitalSnapshot",
            (),
            {
                "account_equity": 100_000,
                "buying_power": 100_000,
                "max_risk_per_trade": 0.01,
            },
        )()


class StubPositionService:
    def snapshot(self, symbol: str):
        return type("PositionSnapshot", (), {"positions": {}})()


class StubRegimeService:
    def current_state(self):
        return type("RegimeState", (), {"domain": "neutral"})()


class StubPolicyEngine:
    def evaluate(self, market_state):
        return type(
            "PolicyResult",
            (),
            {
                "action": PolicyAction.HOLD,
                "confidence": 0.0,
                "reason": "Stub neutral policy",
            },
        )()


# ----------------------------------------------------------------------
# Build Engine
# ----------------------------------------------------------------------

def build_engine(
    clock=None,
    price_service=None,
    capital_service=None,
    position_service=None,
    regime_service=None,
    policy_engine=None,
    narrative_adapter=None,
    rss_service=None,
) -> EngineController:

    # --------------------------------------------------
    # Core services
    # --------------------------------------------------

    clock = clock or EngineClock()

    # LIVE PRICE PROVIDER (critical runtime dependency)
    price_service = price_service or AlpacaQuoteProvider()

    capital_service = capital_service or StubCapitalService()
    position_service = position_service or StubPositionService()
    regime_service = regime_service or StubRegimeService()
    policy_engine = policy_engine or StubPolicyEngine()

    narrative_adapter = narrative_adapter or NarrativeAdapter()

    # --------------------------------------------------
    # NEW: Symbol State Registry
    # --------------------------------------------------

    symbol_state_registry = SymbolStateRegistry()

    # --------------------------------------------------
    # Macro source
    # --------------------------------------------------

    macro_source = InjectedMacroSource(
        {
            "drawdown_velocity": 0.0,
            "liquidity_stress": 0.0,
            "correlation_spike": 0.0,
            "narrative_shock": 0.0,
            "structural_confirmation": 0.0,
        }
    )

    execution_engine = ExecutionEngine()

    orchestrator = IntradayOrchestrator(
        macro_source=macro_source,
        portfolio=None,
        execution_engine=execution_engine,
        audit_writer=None,
    )

    # --------------------------------------------------
    # Trade Coordinator (PRICE + STATE INJECTION POINT)
    # --------------------------------------------------

    coordinator = TradeCoordinator(
        orchestrator=orchestrator,
        execution_engine=execution_engine,
        narrative_adapter=narrative_adapter,
        price_service=price_service,
        symbol_state_registry=symbol_state_registry,
    )

    # --------------------------------------------------
    # Broker (paper trading)
    # --------------------------------------------------

    broker = PaperBrokerAdapter()

    execution_service = ExecutionService(
        broker=broker
    )

    # --------------------------------------------------
    # Runtime Executor
    # --------------------------------------------------

    runtime_executor = RuntimeExecutor(
        coordinator=coordinator,
        execution_service=execution_service,
        price_service=price_service,
    )

    # --------------------------------------------------
    # Execution Input Factory
    # --------------------------------------------------

    execution_input_factory = ExecutionInputFactory(
        regime_service=regime_service,
        policy_engine=policy_engine,
        capital_service=capital_service,
        position_service=position_service,
        price_service=price_service,
        clock=clock,
        narrative_adapter=narrative_adapter,
    )

    # --------------------------------------------------
    # Engine Controller
    # --------------------------------------------------

    engine_controller = EngineController(
        runtime_executor=runtime_executor,
        execution_input_factory=execution_input_factory,
    )

    engine_controller.provider = price_service
    engine_controller.rss_service = rss_service or narrative_adapter

    return engine_controller