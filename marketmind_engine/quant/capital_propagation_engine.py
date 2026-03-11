from dataclasses import dataclass
from typing import Dict
import math


@dataclass
class CapitalState:
    qfils: float = 0.0
    qucip: float = 0.0
    qdrift: float = 0.0
    qttcf: float = 0.0
    last_price: float = 0.0
    last_volume: float = 0.0
    age: int = 0


class CapitalPropagationEngine:
    """
    Lightweight capital propagation model.

    Converts raw price activity into capital-field variables:

        QFILS  = capital attention
        QUCIP  = capital coherence
        QDRIFT = directional capital flow
        QTTCF  = capital chaos / instability
    """

    def __init__(self, decay_lambda: float = 0.12):
        self._states: Dict[str, CapitalState] = {}
        self._lambda = decay_lambda

    # -------------------------------------------------
    # MAIN UPDATE
    # -------------------------------------------------

    def update(self, symbol: str, price: float, volume: float = 1.0) -> CapitalState:

        state = self._states.get(symbol)

        if not state:
            state = CapitalState(last_price=price, last_volume=volume)
            self._states[symbol] = state
            return state

        # ---------------------------------------------
        # Price delta
        # ---------------------------------------------

        delta = price - state.last_price

        # ---------------------------------------------
        # Capital attention (QFILS)
        # ---------------------------------------------

        attention_impulse = abs(delta) * volume

        state.qfils += attention_impulse

        # ---------------------------------------------
        # Directional flow (QDRIFT)
        # ---------------------------------------------

        drift = delta / state.last_price if state.last_price else 0.0

        state.qdrift = 0.7 * state.qdrift + 0.3 * drift

        # ---------------------------------------------
        # Capital coherence (QUCIP)
        # ---------------------------------------------

        alignment = 1.0 if delta * state.qdrift > 0 else 0.5

        state.qucip = 0.8 * state.qucip + 0.2 * alignment

        # ---------------------------------------------
        # Chaos / instability (QTTCF)
        # ---------------------------------------------

        volatility = abs(delta)

        state.qttcf = 0.7 * state.qttcf + 0.3 * volatility

        # ---------------------------------------------
        # Decay attention
        # ---------------------------------------------

        state.qfils *= math.exp(-self._lambda)

        # ---------------------------------------------
        # Update history
        # ---------------------------------------------

        state.last_price = price
        state.last_volume = volume
        state.age += 1

        return state

    # -------------------------------------------------
    # EXPORT METRICS
    # -------------------------------------------------

    def get_metrics(self, symbol: str):

        state = self._states.get(symbol)

        if not state:
            return {}

        return {
            "qfils": state.qfils,
            "qucip": state.qucip,
            "qdrift": state.qdrift,
            "qttcf": state.qttcf,
        }