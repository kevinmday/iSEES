from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from marketmind_engine.policy.policy_result import PolicyResult
from marketmind_engine.decision.state import MarketState
from marketmind_engine.execution.capital_snapshot import CapitalSnapshot
from marketmind_engine.execution.position_snapshot import PositionSnapshot


@dataclass(frozen=True)
class ExecutionInput:
    """
    Immutable input snapshot for ExecutionEngine.

    This object represents the complete state required for a
    deterministic execution decision on a single symbol.
    """

    # ---------------------------------------------------------
    # Asset Identity
    # ---------------------------------------------------------

    symbol: str

    # ---------------------------------------------------------
    # Policy + Market Context
    # ---------------------------------------------------------

    policy_result: PolicyResult
    market_state: MarketState

    # ---------------------------------------------------------
    # Portfolio State
    # ---------------------------------------------------------

    capital_snapshot: CapitalSnapshot
    position_snapshot: PositionSnapshot

    # ---------------------------------------------------------
    # Pricing
    # ---------------------------------------------------------

    current_price: float  # REQUIRED for price-based sizing

    # ---------------------------------------------------------
    # Engine Timing
    # ---------------------------------------------------------

    engine_time: datetime  # REQUIRED

    # ---------------------------------------------------------
    # Optional Execution Controls
    # ---------------------------------------------------------

    stop_price: Optional[float] = None  # optional risk control