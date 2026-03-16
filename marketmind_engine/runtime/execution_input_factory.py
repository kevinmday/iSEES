from typing import Optional

from marketmind_engine.execution.execution_input import ExecutionInput
from marketmind_engine.decision.state import MarketState


class ExecutionInputFactory:
    """
    Responsible for assembling a full ExecutionInput snapshot
    from system services for a given symbol.

    This class performs NO decision logic.
    It strictly constructs immutable execution snapshots.
    """

    def __init__(
        self,
        regime_service,
        policy_engine,
        capital_service,
        position_service,
        price_service,
        clock,
        narrative_adapter=None,
    ):
        self.regime_service = regime_service
        self.policy_engine = policy_engine
        self.capital_service = capital_service
        self.position_service = position_service
        self.price_service = price_service
        self.clock = clock

        # Optional narrative integration
        self.narrative_adapter = narrative_adapter

        # Deterministic memory
        self._last_price_by_symbol = {}
        self._price_history = {}

    # -------------------------------------------------------------
    # Public Entry
    # -------------------------------------------------------------

    def build_for_symbol(self, symbol: str) -> ExecutionInput:
        """
        Build a complete ExecutionInput snapshot for a symbol.
        """

        engine_time = self.clock.now()

        # ---------------------------------------------------------
        # 1️⃣ Build MarketState
        # ---------------------------------------------------------

        market_state = self._build_market_state(symbol, engine_time)

        # ---------------------------------------------------------
        # 2️⃣ Evaluate Policy
        # ---------------------------------------------------------

        policy_result = self.policy_engine.evaluate(market_state)

        # Attach symbol so downstream scoring layers know
        setattr(policy_result, "symbol", symbol)

        # ---------------------------------------------------------
        # 3️⃣ Snapshot Capital
        # ---------------------------------------------------------

        capital_snapshot = self.capital_service.snapshot()

        # ---------------------------------------------------------
        # 4️⃣ Snapshot Position
        # ---------------------------------------------------------

        position_snapshot = self.position_service.snapshot(symbol)

        # ---------------------------------------------------------
        # 5️⃣ Current Price
        # ---------------------------------------------------------

        current_price = self.price_service.get_price(symbol)

        if current_price is None:
            current_price = 0.0

        # ---------------------------------------------------------
        # Construct ExecutionInput
        # ---------------------------------------------------------

        return ExecutionInput(
            symbol=symbol,  # 🔴 FIX: ensure symbol exists on execution_input
            policy_result=policy_result,
            market_state=market_state,
            capital_snapshot=capital_snapshot,
            position_snapshot=position_snapshot,
            current_price=current_price,
            engine_time=engine_time,
            stop_price=None,
        )

    # -------------------------------------------------------------
    # Internal Builders
    # -------------------------------------------------------------

    def _build_market_state(self, symbol: str, engine_time) -> MarketState:
        """
        Construct MarketState using available services.
        """

        current_price = self.price_service.get_price(symbol)

        if current_price is None:
            current_price = 0.0

        regime_state = self.regime_service.current_state()

        # ---------------------------------------------------------
        # Deterministic price delta
        # ---------------------------------------------------------

        previous_price = self._last_price_by_symbol.get(symbol)

        if previous_price is None:
            price_delta = 0.0
        else:
            price_delta = current_price - previous_price

        self._last_price_by_symbol[symbol] = current_price

        # ---------------------------------------------------------
        # Maintain rolling price history
        # ---------------------------------------------------------

        history = self._price_history.setdefault(symbol, [])
        history.append(current_price)

        if len(history) > 20:
            history.pop(0)

        # ---------------------------------------------------------
        # Quant Metrics (deterministic)
        # ---------------------------------------------------------

        if len(history) > 1:
            drift = (history[-1] - history[0]) / max(history[0], 1e-6)
        else:
            drift = 0.0

        if len(history) > 3:
            momentum = (history[-1] - history[-3]) / max(history[-3], 1e-6)
        else:
            momentum = 0.0

        # volatility estimate
        if len(history) > 3:
            mean_price = sum(history) / len(history)
            variance = sum((p - mean_price) ** 2 for p in history) / len(history)
            volatility = (variance ** 0.5) / max(mean_price, 1e-6)
        else:
            volatility = 0.0

        liquidity = 1.0  # placeholder until volume service wired

        # ---------------------------------------------------------
        # Narrative Propagation Metrics
        # ---------------------------------------------------------

        fils = 0.0
        ucip = 0.0
        ttcf = 1.0

        if self.narrative_adapter:

            snapshot = self.narrative_adapter.get_propagation_snapshot()

            symbol_metrics = snapshot.get(symbol)

            if symbol_metrics:
                fils = symbol_metrics.get("FILS", 0.0)
                ucip = symbol_metrics.get("UCIP", 0.0)
                ttcf = symbol_metrics.get("TTCF", 1.0)

        # ---------------------------------------------------------
        # Construct MarketState
        # ---------------------------------------------------------

        return MarketState(
            symbol=symbol,
            domain=regime_state.domain if hasattr(regime_state, "domain") else "unknown",
            narrative=None,

            # Narrative signals
            fils=fils,
            ucip=ucip,
            ttcf=ttcf,

            fractal_levels=None,

            data_source="runtime",
            engine_id="paper-runtime",
            timestamp_utc=None,

            # Engine timing
            engine_time=engine_time,
            ignition_time=0,

            # Quant / price signals
            price_delta=momentum,
            volume_ratio=1.0,

            volatility=volatility,
            liquidity=liquidity,
            responsiveness=drift,
        )