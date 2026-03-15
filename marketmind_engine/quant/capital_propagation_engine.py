from dataclasses import dataclass
from typing import Dict, List
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
    price_history: List[float] = None


class CapitalPropagationEngine:
    """
    Capital propagation model with normalized signals.

    Converts raw price activity into normalized capital-field variables:

        QFILS  = capital attention strength
        QUCIP  = directional coherence
        QDRIFT = normalized capital flow (-1 → +1)
        QTTCF  = normalized chaos / instability (0 → 1)

    Drift normalization pipeline:

        rolling price window
            → volatility normalization
            → tanh compression
    """

    def __init__(self, decay_lambda: float = 0.12, window: int = 10):

        self._states: Dict[str, CapitalState] = {}
        self._lambda = decay_lambda
        self._window = window

    # -------------------------------------------------
    # MAIN UPDATE
    # -------------------------------------------------

    def update(self, symbol: str, price: float, volume: float = 1.0) -> CapitalState:

        # Guard against missing quotes
        if price is None:
            return self._states.get(symbol, CapitalState())

        state = self._states.get(symbol)

        if not state:
            state = CapitalState(
                last_price=price,
                last_volume=volume,
                price_history=[price]
            )
            self._states[symbol] = state
            return state

        # ---------------------------------------------
        # Update rolling price history
        # ---------------------------------------------

        state.price_history.append(price)

        if len(state.price_history) > self._window:
            state.price_history.pop(0)

        # ---------------------------------------------
        # Price delta
        # ---------------------------------------------

        delta = price - state.last_price

        # ---------------------------------------------
        # Capital attention (QFILS)
        # ---------------------------------------------

        volume_factor = math.sqrt(volume) if volume else 1.0
        attention_impulse = abs(delta) * volume_factor

        state.qfils += attention_impulse

        # ---------------------------------------------
        # Rolling drift calculation
        # ---------------------------------------------

        if len(state.price_history) >= 2:

            reference_price = state.price_history[0]

            if reference_price:
                raw_drift = (price - reference_price) / reference_price
            else:
                raw_drift = 0.0

        else:
            raw_drift = 0.0

        # ---------------------------------------------
        # Volatility estimate
        # ---------------------------------------------

        if len(state.price_history) >= 3:

            diffs = [
                abs(state.price_history[i] - state.price_history[i - 1]) /
                state.price_history[i - 1]
                for i in range(1, len(state.price_history))
                if state.price_history[i - 1]
            ]

            volatility = sum(diffs) / len(diffs) if diffs else 0.0

        else:
            volatility = 0.0

        # ---------------------------------------------
        # Normalize drift vs volatility
        # ---------------------------------------------

        if volatility > 0:
            relative_drift = raw_drift / volatility
        else:
            relative_drift = raw_drift

        # ---------------------------------------------
        # Compress drift to bounded range
        # ---------------------------------------------

        normalized_drift = math.tanh(relative_drift)

        # Smooth with EMA
        state.qdrift = 0.7 * state.qdrift + 0.3 * normalized_drift

        # ---------------------------------------------
        # Capital coherence (QUCIP)
        # ---------------------------------------------

        alignment = 1.0 if delta * state.qdrift > 0 else 0.5
        state.qucip = 0.8 * state.qucip + 0.2 * alignment

        # ---------------------------------------------
        # Chaos / instability (QTTCF)
        # ---------------------------------------------

        volatility_score = min(1.0, abs(relative_drift))
        state.qttcf = 0.7 * state.qttcf + 0.3 * volatility_score

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