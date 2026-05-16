# ============================================================
# delta_models.py
# EPISTEMIC DELTA MODELS
# ============================================================

"""
Represents ontology changes
between cognition layers.

Deltas NEVER mutate snapshots.

Snapshots preserve immutable cognition state.

Deltas describe:

    why cognition changed
    what changed
    how interpretation evolved
    whether ambiguity increased or collapsed
    whether contradiction propagated
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, UTC
from enum import Enum
from typing import Any, Dict, List, Optional


# ============================================================
# DELTA TYPE
# ============================================================

class DeltaType(str, Enum):
    OBSERVATIONAL = "OBSERVATIONAL"
    INFERENTIAL = "INFERENTIAL"
    TOPOLOGICAL = "TOPOLOGICAL"
    ONTOLOGICAL = "ONTOLOGICAL"
    CONTRADICTION = "CONTRADICTION"
    INVESTIGATIVE = "INVESTIGATIVE"
    CORRELATIONAL = "CORRELATIONAL"
    ESCALATION = "ESCALATION"
    COLLAPSE = "COLLAPSE"
    REPLAY_SYNTHESIS = "REPLAY_SYNTHESIS"


# ============================================================
# DELTA SOURCE
# ============================================================

class DeltaSource(str, Enum):
    HUMAN_INVESTIGATOR = "HUMAN_INVESTIGATOR"
    SENSOR_FUSION_ENGINE = "SENSOR_FUSION_ENGINE"
    TOPOLOGY_ENGINE = "TOPOLOGY_ENGINE"
    EVENT_INFERENCE_ENGINE = "EVENT_INFERENCE_ENGINE"
    EXTERNAL_INTELLIGENCE = "EXTERNAL_INTELLIGENCE"
    REPLAY_ENGINE = "REPLAY_ENGINE"
    SYSTEM_AUTONOMOUS = "SYSTEM_AUTONOMOUS"


# ============================================================
# CONFIDENCE SHIFT
# ============================================================

@dataclass(frozen=True)
class ConfidenceShift:
    previous_confidence: float = 0.0
    new_confidence: float = 0.0
    delta: float = 0.0


# ============================================================
# AMBIGUITY SHIFT
# ============================================================

@dataclass(frozen=True)
class AmbiguityShift:
    previous_ambiguity: float = 0.0
    new_ambiguity: float = 0.0
    delta: float = 0.0
    collapse_detected: bool = False


# ============================================================
# CONTRADICTION SHIFT
# ============================================================

@dataclass(frozen=True)
class ContradictionShift:
    previous_density: float = 0.0
    new_density: float = 0.0
    delta: float = 0.0
    propagation_detected: bool = False
    affected_domains: List[str] = field(default_factory=list)


# ============================================================
# ONTOLOGY CHANGE
# ============================================================

@dataclass(frozen=True)
class OntologyChange:
    added_attributes: Dict[str, Any] = field(
        default_factory=dict
    )

    removed_attributes: List[str] = field(
        default_factory=list
    )

    modified_attributes: Dict[str, Any] = field(
        default_factory=dict
    )

    semantic_changes: List[str] = field(
        default_factory=list
    )


# ============================================================
# TOPOLOGY CHANGE
# ============================================================

@dataclass(frozen=True)
class TopologyChange:
    affected_clusters: List[str] = field(
        default_factory=list
    )

    entanglement_shift: float = 0.0
    fragmentation_shift: float = 0.0
    residual_shift: float = 0.0

    topology_notes: List[str] = field(
        default_factory=list
    )


# ============================================================
# EPISTEMIC DELTA
# ============================================================

@dataclass(frozen=True)
class EpistemicDelta:
    """
    Describes transition between two immutable
    cognition layers.
    """

    delta_id: str

    event_id: str

    source_snapshot_id: str
    target_snapshot_id: str

    delta_type: DeltaType
    delta_source: DeltaSource

    created_at: datetime = field(
        default_factory=lambda: datetime.now(UTC)
    )

    summary: str = ""

    rationale: str = ""

    triggering_systems: List[str] = field(
        default_factory=list
    )

    affected_layers: List[str] = field(
        default_factory=list
    )

    confidence_shift: Optional[
        ConfidenceShift
    ] = None

    ambiguity_shift: Optional[
        AmbiguityShift
    ] = None

    contradiction_shift: Optional[
        ContradictionShift
    ] = None

    ontology_change: Optional[
        OntologyChange
    ] = None

    topology_change: Optional[
        TopologyChange
    ] = None

    investigation_notes: List[str] = field(
        default_factory=list
    )

    replay_generated: bool = False