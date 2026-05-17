# ============================================================
# replay_types.py
# PHASE: CANONICAL EVENT LOADER + REPLAY CONTRACT NORMALIZATION
# ============================================================

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List


# ============================================================
# TOPOLOGY PROFILE
# ============================================================

@dataclass
class TopologyProfile:
    """
    Canonical replay topology weighting profile.
    """

    observability_density: float = 0.0
    infrastructure_saturation: float = 0.0
    semantic_cohesion: float = 0.0
    contradiction_pressure: float = 0.0
    sensor_participation: float = 0.0
    environmental_visibility: float = 0.0
    witness_distribution: float = 0.0
    temporal_dispersion: float = 0.0


# ============================================================
# TEMPORAL LAYER
# ============================================================

@dataclass
class TemporalLayer:
    """
    Immutable replay cognition layer.
    """

    layer_id: str
    layer_index: int

    timestamp: str = ""
    title: str = ""
    summary: str = ""

    epistemic_delta: Dict[str, Any] = field(
        default_factory=dict
    )

    topology_changes: Dict[str, Any] = field(
        default_factory=dict
    )

    contradictions: List[Dict[str, Any]] = field(
        default_factory=list
    )

    supporting_vectors: List[Dict[str, Any]] = field(
        default_factory=list
    )

    observability_shift: Dict[str, Any] = field(
        default_factory=dict
    )

    immutable: bool = True


# ============================================================
# EPISTEMIC STATE
# ============================================================

@dataclass
class EpistemicState:
    """
    Immutable cognition progression state.
    """

    current_layer: int = 0
    total_layers: int = 0

    state_version: int = 1

    immutable: bool = True


# ============================================================
# CORE EVENT STRUCTURE
# ============================================================

@dataclass
class CoreEvent:
    """
    Canonical manifold event structure.
    """

    event_id: str
    event_name: str
    classification: str

    initial_timestamp: str = ""

    location: Dict[str, Any] = field(
        default_factory=dict
    )

    observer_topology: Dict[str, Any] = field(
        default_factory=dict
    )

    observability_profile: Dict[str, Any] = field(
        default_factory=dict
    )

    semantic_signature: Dict[str, Any] = field(
        default_factory=dict
    )

    infrastructure_context: Dict[str, Any] = field(
        default_factory=dict
    )

    sensor_domains: List[str] = field(
        default_factory=list
    )


# ============================================================
# TOPOLOGY STATE
# ============================================================

@dataclass
class TopologyState:
    """
    Dynamic topology propagation state.
    """

    contradiction_load: Dict[str, Any] = field(
        default_factory=dict
    )

    topology_state: Dict[str, Any] = field(
        default_factory=dict
    )


# ============================================================
# TEMPORAL REPLAY
# ============================================================

@dataclass
class TemporalReplay:
    """
    Replay cognition timeline container.
    """

    layers: List[TemporalLayer] = field(
        default_factory=list
    )

    timeline_initialized: bool = False

    immutable_progression: bool = True


# ============================================================
# REPLAY METADATA
# ============================================================

@dataclass
class ReplayMetadata:
    """
    Replay cognition metadata container.
    """

    generated_utc: str = ""

    source_event: str = ""

    replay_ready: bool = True

    contract_version: int = 1


# ============================================================
# REPLAY CONTRACT
# ============================================================

@dataclass
class ReplayContract:
    """
    Top-level replay cognition contract.
    """

    event_id: str
    event_name: str
    classification: str

    epistemic_state: EpistemicState

    core_event: CoreEvent

    topology: TopologyState

    temporal_replay: TemporalReplay

    replay_metadata: ReplayMetadata


# ============================================================
# MANIFOLD REPLAY STATE
# ============================================================

@dataclass
class ManifoldReplayState:
    """
    Runtime replay cognition state.

    Used later by:
    - replay engines
    - visualization systems
    - cognition timelines
    - manifold reconstruction rendering
    """

    active_event_id: str = ""

    active_layer: int = 0

    replay_running: bool = False

    replay_paused: bool = False

    replay_speed: float = 1.0

    topology_visible: bool = True

    observability_visible: bool = True

    contradiction_visible: bool = True

    historical_mode: bool = True

    immutable_mode: bool = True


# ============================================================
# DEVELOPMENT TEST
# ============================================================

if __name__ == "__main__":

    profile = TopologyProfile(
        observability_density=0.92,
        infrastructure_saturation=0.88,
        semantic_cohesion=0.74,
    )

    layer = TemporalLayer(
        layer_id="T0",
        layer_index=0,
        title="Initial Emergence",
        summary="Initial witness observation"
    )

    replay_state = ManifoldReplayState(
        active_event_id="UAP-TICTAC-2004",
        replay_running=True,
    )

    print("\n================================================")
    print("REPLAY TYPES TEST")
    print("================================================\n")

    print(profile)

    print("\n")

    print(layer)

    print("\n")

    print(replay_state)