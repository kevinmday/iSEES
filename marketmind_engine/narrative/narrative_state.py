"""
Narrative State Object
----------------------

Represents a persistent narrative entity inside the MarketMind engine.

Narratives are not transient signals. They behave like evolving fields
that can:

    ignite
    propagate
    reinforce
    mutate
    saturate
    decay

NarrativeState objects persist across engine cycles so the propagation
engine can track narrative energy over time.

This module contains no runtime dependencies and is safe to use
throughout the engine.
"""

from dataclasses import dataclass, field
from typing import Set, Optional
import time


# ---------------------------------------------------------
# Narrative Lifecycle States
# ---------------------------------------------------------

NARRATIVE_STATES = (
    "ignition",
    "propagation",
    "reinforcement",
    "mutation",
    "saturation",
    "decay",
)


# ---------------------------------------------------------
# NarrativeState Dataclass
# ---------------------------------------------------------

@dataclass
class NarrativeState:
    """
    Represents a narrative's evolving state in the engine.
    """

    id: str
    domain: Optional[str] = None

    # Assets influenced by the narrative
    assets: Set[str] = field(default_factory=set)

    # Narrative energy / intensity
    force: float = 1.0

    # Decay mechanics
    decay_rate: float = 0.05

    # Reinforcement tracking
    reinforcement_score: float = 0.0

    # Mutation expansion factor
    mutation_factor: float = 0.0

    # Number of newly discovered assets
    discovery_count: int = 0

    # Lifecycle state
    lifecycle_state: str = "ignition"

    # Engine timestamps
    created_at: float = field(default_factory=time.time)
    last_update: float = field(default_factory=time.time)

    # -----------------------------------------------------
    # Asset Management
    # -----------------------------------------------------

    def add_asset(self, symbol: str) -> None:
        """
        Adds an asset influenced by this narrative.
        """
        if symbol not in self.assets:
            self.assets.add(symbol)
            self.discovery_count += 1
            self.lifecycle_state = "mutation"

    # -----------------------------------------------------
    # Reinforcement
    # -----------------------------------------------------

    def apply_reinforcement(self, strength: float) -> None:
        """
        Reinforces narrative force when new mentions appear.
        """

        if strength <= 0:
            return

        self.force += strength
        self.reinforcement_score += strength
        self.lifecycle_state = "reinforcement"
        self.last_update = time.time()

    # -----------------------------------------------------
    # Decay Application
    # -----------------------------------------------------

    def apply_decay(self, decayed_force: float) -> None:
        """
        Updates narrative force after decay calculation.
        """

        self.force = max(decayed_force, 0.0)

        if self.force < 0.05:
            self.lifecycle_state = "decay"
        else:
            self.lifecycle_state = "propagation"

        self.last_update = time.time()

    # -----------------------------------------------------
    # Mutation Handling
    # -----------------------------------------------------

    def apply_mutation(self, mutation_strength: float) -> None:
        """
        Expands propagation potential.
        """

        if mutation_strength <= 0:
            return

        self.mutation_factor += mutation_strength
        self.lifecycle_state = "mutation"
        self.last_update = time.time()

    # -----------------------------------------------------
    # Narrative Age
    # -----------------------------------------------------

    def age(self) -> float:
        """
        Returns narrative age in seconds.
        """
        return time.time() - self.created_at

    # -----------------------------------------------------
    # Snapshot (for engine logging / debugging)
    # -----------------------------------------------------

    def snapshot(self) -> dict:
        """
        Returns structured state for engine logging.
        """

        return {
            "id": self.id,
            "domain": self.domain,
            "assets": list(self.assets),
            "force": self.force,
            "decay_rate": self.decay_rate,
            "reinforcement_score": self.reinforcement_score,
            "mutation_factor": self.mutation_factor,
            "discovery_count": self.discovery_count,
            "lifecycle_state": self.lifecycle_state,
            "age": self.age(),
        }