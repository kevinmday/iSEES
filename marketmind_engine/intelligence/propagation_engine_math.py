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

from marketmind_engine.intelligence.diffusion_graph_engine import DiffusionGraphEngine


class PropagationEngine:

    def __init__(self, window: int = 300):

        self.window = window

        # narrative decay factor
        self.decay = 0.92

        # narrative reinforcement force
        self.symbol_force = defaultdict(float)

        # learned diffusion engine
        self.diffusion_engine = DiffusionGraphEngine()

        # optional deterministic diffusion seed map
        self.diffusion_map = {
            "NVDA": ["SMCI", "TSM", "AVGO"],
            "AMD": ["TSM", "ARM"],
            "LMT": ["RTX", "NOC"],
            "AMZN": ["SHOP", "MELI"],
        }

        self.symbol_state = defaultdict(
            lambda: {
                "timestamps": [],
                "weights": [],
                "sources": [],
                "last_mentions": 0,
                "last_fils": 0.0,
                "last_force": 0.0,
            }
        )

    # --------------------------------------------------
    # EVENT INGESTION
    # --------------------------------------------------

    def ingest_event(self, event):

        symbol = event.symbol

        # diffusion learning
        self.diffusion_engine.observe_event(event)

        # reinforcement physics
        previous_force = self.symbol_force[symbol]
        reinforced_force = previous_force * self.decay + event.weight
        self.symbol_force[symbol] = reinforced_force

        reinforced_weight = reinforced_force

        # store event
        state = self.symbol_state[symbol]

        state["timestamps"].append(event.engine_time)
        state["weights"].append(reinforced_weight)
        state["sources"].append(event.source)

        self._prune_old(symbol, event.engine_time)

        # diffusion propagation
        neighbors = self.diffusion_map.get(symbol)

        if neighbors:
            for neighbor in neighbors:

                if neighbor == symbol:
                    continue

                n_state = self.symbol_state[neighbor]

                n_state["timestamps"].append(event.engine_time)
                n_state["weights"].append(reinforced_weight * 0.35)
                n_state["sources"].append("diffusion")

                self._prune_old(neighbor, event.engine_time)

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
        # VELOCITY (event acceleration)
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
        # DRIFT  (FIXED — continuous force sensitivity)
        # --------------------------------------------------

        last_mentions = state["last_mentions"]
        last_fils = state["last_fils"]
        last_force = state["last_force"]

        current_force = self.symbol_force[symbol]

        # 🔥 FIX 1: allow continuous force sensitivity (not just positive jumps)
        force_velocity = abs(current_force - last_force) / self.window

        # 🔥 FIX 2: allow symmetric FILS movement
        fils_velocity = abs(fils - last_fils)

        # 🔥 FIX 3: mention velocity still directional (true bursts)
        mention_delta = max(mentions - last_mentions, 0)
        mention_velocity = mention_delta / 10

        # 🔥 NEW weighting — force dominates sustained movement
        drift = (
            0.3 * mention_velocity +
            0.2 * fils_velocity +
            0.5 * force_velocity
        )

        drift = min(max(drift, 0.0), 1.0)

        # update state memory
        state["last_mentions"] = mentions
        state["last_fils"] = fils
        state["last_force"] = current_force

        # --------------------------------------------------
        # TTCF
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

    # --------------------------------------------------
    # DIFFUSION GRAPH SNAPSHOT
    # --------------------------------------------------

    def diffusion_snapshot(self):

        return self.diffusion_engine.snapshot()