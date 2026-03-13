from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class SymbolState:
    symbol: str
    last_fils: float
    last_ucip: float
    last_timestamp: int


class SymbolStateRegistry:
    """
    Deterministic in-memory symbol state store.

    Maintains last known metrics for each symbol
    so delta calculations can be performed.
    """

    def __init__(self):
        self._states: Dict[str, SymbolState] = {}

    def get(self, symbol: str) -> Optional[SymbolState]:
        return self._states.get(symbol)

    def update(self, symbol: str, fils: float, ucip: float, timestamp: int):

        state = self._states.get(symbol)

        if state is None:
            self._states[symbol] = SymbolState(
                symbol=symbol,
                last_fils=fils,
                last_ucip=ucip,
                last_timestamp=timestamp,
            )
            return None

        previous = SymbolState(
            symbol=symbol,
            last_fils=state.last_fils,
            last_ucip=state.last_ucip,
            last_timestamp=state.last_timestamp,
        )

        state.last_fils = fils
        state.last_ucip = ucip
        state.last_timestamp = timestamp

        return previous