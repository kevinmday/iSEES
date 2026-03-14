"""
Drift Engine
------------

Measures the velocity of narrative state changes over time.

Drift represents the rate of change of narrative energy and
propagation behavior across engine cycles.

Mathematically:

    Drift = weighted derivative of narrative state over time

This module maintains a small in-memory registry of previous
NarrativeState snapshots so velocity can be calculated between
engine cycles.

This module is deterministic and safe for use inside the runtime
execution loop.
"""

from typing import Dict
import time

from marketmind_engine.narrative.narrative_state import NarrativeState


class DriftEngine:
    """
    Computes narrative drift values.

    Drift represents the *velocity of narrative change* and is
    used by downstream scoring systems to identify accelerating
    narratives.
    """

    def __init__(self):

        # previous narrative snapshots
        self._previous_states: Dict[str, dict] = {}

    # ---------------------------------------------------------
    # Drift Calculation
    # ---------------------------------------------------------

    def compute_drift(self, state: NarrativeState) -> float:
        """
        Calculates drift for a narrative state.
        """

        current_time = time.time()

        snapshot = {
            "force": state.force,
            "reinforcement_score": state.reinforcement_score,
            "discovery_count": state.discovery_count,
            "time": current_time,
        }

        # First observation → no drift yet
        if state.id not in self._previous_states:
            self._previous_states[state.id] = snapshot
            return 0.0

        prev = self._previous_states[state.id]

        dt = current_time - prev["time"]

        if dt <= 0:
            return 0.0

        # -------------------------------------------------
        # Component velocities
        # -------------------------------------------------

        force_velocity = (snapshot["force"] - prev["force"]) / dt
        reinforcement_velocity = (
            snapshot["reinforcement_score"] - prev["reinforcement_score"]
        ) / dt
        discovery_velocity = (
            snapshot["discovery_count"] - prev["discovery_count"]
        ) / dt

        # -------------------------------------------------
        # Weighted drift score
        # -------------------------------------------------

        drift = (
            0.5 * force_velocity
            + 0.3 * reinforcement_velocity
            + 0.2 * discovery_velocity
        )

        # Update stored snapshot
        self._previous_states[state.id] = snapshot

        return drift