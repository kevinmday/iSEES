"""
Diffusion Graph Engine

Learns narrative propagation relationships between symbols based on
temporal proximity of narrative events.

This module is observational only.
It does not modify propagation physics.

Purpose:
    discover sector diffusion patterns automatically.

Example learned edge:
    NVDA -> SMCI
"""

from collections import defaultdict, deque


class DiffusionGraphEngine:
    """
    Learns directed narrative diffusion edges.

    Example:
        NVDA -> SMCI
        NVDA -> TSM
    """

    def __init__(
        self,
        lookback_window_seconds: float = 30.0,
        edge_decay: float = 0.999,
        min_edge_weight: int = 1,
    ):
        self.lookback_window = lookback_window_seconds
        self.edge_decay = edge_decay
        self.min_edge_weight = min_edge_weight

        # recent event buffer
        self.recent_events = deque()

        # diffusion graph
        # {symbol_A: {symbol_B: weight}}
        self.graph = defaultdict(lambda: defaultdict(float))

    # ---------------------------------------------------------
    # Event Observation
    # ---------------------------------------------------------

    def observe_event(self, event):
        """
        Observe a narrative event and update diffusion graph.

        Event must contain:
            event.symbol
            event.engine_time
            event.source
        """

        # ---------------------------------------------------------
        # Ignore synthetic propagation events
        # ---------------------------------------------------------

        if getattr(event, "source", None) == "diffusion":
            return

        now = event.engine_time
        symbol_b = event.symbol

        # remove old events outside window
        self._prune_old_events(now)

        # learn edges
        for previous in self.recent_events:

            symbol_a = previous.symbol

            if symbol_a == symbol_b:
                continue

            lag = now - previous.engine_time

            if lag <= self.lookback_window:
                self.graph[symbol_a][symbol_b] += 1

        # store event
        self.recent_events.append(event)

    # ---------------------------------------------------------
    # Event Window Management
    # ---------------------------------------------------------

    def _prune_old_events(self, now):
        """Remove events outside lookback window."""

        while self.recent_events:
            age = now - self.recent_events[0].engine_time
            if age > self.lookback_window:
                self.recent_events.popleft()
            else:
                break

    # ---------------------------------------------------------
    # Edge Decay
    # ---------------------------------------------------------

    def decay(self):
        """
        Slowly decay diffusion edges so graph adapts to market changes.
        """

        for source in list(self.graph.keys()):
            for target in list(self.graph[source].keys()):

                self.graph[source][target] *= self.edge_decay

                if self.graph[source][target] < self.min_edge_weight:
                    del self.graph[source][target]

            if not self.graph[source]:
                del self.graph[source]

    # ---------------------------------------------------------
    # Query Functions
    # ---------------------------------------------------------

    def get_neighbors(self, symbol):
        """
        Return learned diffusion neighbors for symbol.
        """

        return self.graph.get(symbol, {})

    def snapshot(self):
        """
        Return full diffusion graph snapshot.
        """

        return {
            source: dict(targets)
            for source, targets in self.graph.items()
        }

    # ---------------------------------------------------------
    # Debug Utility
    # ---------------------------------------------------------

    def print_graph(self):
        """Pretty print graph for debugging."""

        for source, targets in self.graph.items():
            for target, weight in targets.items():
                print(f"{source} -> {target} : {weight:.2f}")