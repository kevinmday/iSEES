"""
Deterministic Narrative Propagation Engine

Converts ProjectionEvents into intention metrics.

Outputs:
    FILS
    UCIP
    DRIFT
    TTCF

Design Principles
-----------------
deterministic
replay safe
no randomness
engine tick driven
"""

from collections import defaultdict
from typing import Dict


class PropagationEngine:

    def __init__(self, window: int = 300):
        self.window = window

        self.symbol_state = defaultdict(
            lambda: {
                "timestamps": [],
                "weights": [],
                "sources": [],
                "last_mentions": 0,
                "last_fils": 0.0,
            }
        )

    # --------------------------------------------------
    # EVENT INGESTION
    # --------------------------------------------------

    def ingest_event(self, event):
        """
        event fields expected:

        event.symbol
        event.engine_time
        event.source
        event.weight
        """

        state = self.symbol_state[event.symbol]

        state["timestamps"].append(event.engine_time)
        state["weights"].append(event.weight)
        state["sources"].append(event.source)

        self._prune_old(event.symbol, event.engine_time)

    # --------------------------------------------------
    # WINDOW PRUNING
    # --------------------------------------------------

    def _prune_old(self, symbol, current_time):

        cutoff = current_time - self.window

        state = self.symbol_state[symbol]

        timestamps = state["timestamps"]
        weights = state["weights"]
        sources = state["sources"]

        new_t = []
        new_w = []
        new_s = []

        for t, w, s in zip(timestamps, weights, sources):

            if t >= cutoff:
                new_t.append(t)
                new_w.append(w)
                new_s.append(s)

        state["timestamps"] = new_t
        state["weights"] = new_w
        state["sources"] = new_s

    # --------------------------------------------------
    # METRIC COMPUTATION
    # --------------------------------------------------

    def compute_metrics(self, symbol: str) -> Dict:

        state = self.symbol_state.get(symbol)

        if not state:
            return {
                "FILS": 0.0,
                "UCIP": 0.0,
                "DRIFT": 0.0,
                "TTCF": 1.0,
            }

        timestamps = state["timestamps"]
        weights = state["weights"]
        sources = state["sources"]

        mentions = len(timestamps)

        if mentions == 0:
            return {
                "FILS": 0.0,
                "UCIP": 0.0,
                "DRIFT": 0.0,
                "TTCF": 1.0,
            }

        # --------------------------------------------------
        # FREQUENCY
        # --------------------------------------------------

        frequency = mentions / self.window

        # --------------------------------------------------
        # VELOCITY
        # --------------------------------------------------

        recent = timestamps[-5:]
        prev = timestamps[-10:-5]

        velocity = max(len(recent) - len(prev), 0) / 5

        # --------------------------------------------------
        # SOURCE DISPERSION
        # --------------------------------------------------

        unique_sources = len(set(sources))
        dispersion = unique_sources / mentions

        # --------------------------------------------------
        # FILS
        # --------------------------------------------------

        fils = frequency * (1 + velocity) * dispersion
        fils = min(max(fils, 0.0), 1.0)

        # --------------------------------------------------
        # UCIP
        # --------------------------------------------------

        total_weight = sum(weights)

        ucip = (total_weight / self.window) * (1 + velocity)
        ucip = min(max(ucip, 0.0), 1.0)

        # --------------------------------------------------
        # DRIFT
        # --------------------------------------------------
        # Measures propagation acceleration
        # Emerges when narrative begins spreading

        last_mentions = state["last_mentions"]
        last_fils = state["last_fils"]

        mention_delta = max(mentions - last_mentions, 0)
        fils_delta = max(fils - last_fils, 0)

        drift = (mention_delta / 10) * (1 + fils_delta)
        drift = min(max(drift, 0.0), 1.0)

        state["last_mentions"] = mentions
        state["last_fils"] = fils

        # --------------------------------------------------
        # TTCF (chaos filter)
        # --------------------------------------------------

        ttcf = 1 - dispersion
        ttcf = min(max(ttcf, 0.0), 1.0)

        return {
            "FILS": round(fils, 4),
            "UCIP": round(ucip, 4),
            "DRIFT": round(drift, 4),
            "TTCF": round(ttcf, 4),
        }

    # --------------------------------------------------
    # SNAPSHOT
    # --------------------------------------------------

    def snapshot(self):

        metrics = {}

        for symbol in self.symbol_state.keys():
            metrics[symbol] = self.compute_metrics(symbol)

        return metrics