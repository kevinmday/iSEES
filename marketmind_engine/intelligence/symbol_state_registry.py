from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class SymbolState:
    symbol: str
    last_fils: float
    last_ucip: float
    last_drift: float
    last_timestamp: int


class SymbolStateRegistry:
    """
    Deterministic in-memory symbol state store.

    Maintains last known metrics for each symbol
    so delta calculations can be performed.

    UPDATED:
    - Added drift tracking (last_drift)
    """

    def __init__(self):
        self._states: Dict[str, SymbolState] = {}

    def get(self, symbol: str) -> Optional[SymbolState]:
        return self._states.get(symbol)

    def update(
        self,
        symbol: str,
        fils: float,
        ucip: float,
        timestamp: int,
        drift: float = 0.0,   # ← backward compatible default
    ):
        """
        Update symbol state and return previous snapshot (if exists).
        """

        state = self._states.get(symbol)

        # FIRST INSERT (no previous state)
        if state is None:
            self._states[symbol] = SymbolState(
                symbol=symbol,
                last_fils=fils,
                last_ucip=ucip,
                last_drift=drift,
                last_timestamp=timestamp,
            )
            return None

        # COPY PREVIOUS STATE (full snapshot, including drift)
        previous = SymbolState(
            symbol=symbol,
            last_fils=state.last_fils,
            last_ucip=state.last_ucip,
            last_drift=state.last_drift,
            last_timestamp=state.last_timestamp,
        )

        # UPDATE CURRENT STATE
        state.last_fils = fils
        state.last_ucip = ucip
        state.last_drift = drift
        state.last_timestamp = timestamp

        return previous

    def all_states(self) -> Dict[str, SymbolState]:
        """
        Return all tracked symbol states.
        Useful for drift ranking / debugging.
        """
        return self._states