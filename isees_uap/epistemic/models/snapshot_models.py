# ============================================================
# snapshot_models.py
# IMMUTABLE EPISTEMIC SNAPSHOT MODELS
# ============================================================

"""
Defines immutable cognition snapshot structures.

T0 = original ingestion
Tn = subsequent epistemic layers

Snapshots are append-only.
No retroactive mutation allowed.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, UTC
from enum import Enum
from typing import Any, Dict, List, Optional


# ============================================================
# SNAPSHOT TYPE
# ============================================================

class SnapshotType(str, Enum):
    INGESTION = "INGESTION"
    INVESTIGATION = "INVESTIGATION"
    CORRELATION = "CORRELATION"
    TOPOLOGY_SHIFT = "TOPOLOGY_SHIFT"
    COLLAPSE = "COLLAPSE"
    ESCALATION = "ESCALATION"
    RESOLUTION = "RESOLUTION"
    REPLAY_GENERATED = "REPLAY_GENERATED"


# ============================================================
# EPISTEMIC AUTHORITY
# ============================================================

class EpistemicAuthority(str, Enum):
    HUMAN_INVESTIGATOR = "HUMAN_INVESTIGATOR"
    TOPOLOGY_ENGINE = "TOPOLOGY_ENGINE"
    SENSOR_FUSION_ENGINE = "SENSOR_FUSION_ENGINE"
    EVENT_INFERENCE_ENGINE = "EVENT_INFERENCE_ENGINE"
    MANUAL_OVERRIDE = "MANUAL_OVERRIDE"
    EXTERNAL_INTELLIGENCE = "EXTERNAL_INTELLIGENCE"
    SYSTEM_AUTONOMOUS = "SYSTEM_AUTONOMOUS"


# ============================================================
# TOPOLOGY STATE
# ============================================================

@dataclass(frozen=True)
class TopologyState:
    ambiguity_score: float = 0.0
    contradiction_density: float = 0.0
    residual_score: float = 0.0
    entanglement_score: float = 0.0
    fragmentation_score: float = 0.0
    collapse_detected: bool = False
    topology_notes: List[str] = field(default_factory=list)


# ============================================================
# ONTOLOGY STATE
# ============================================================

@dataclass(frozen=True)
class OntologyState:
    ontology_version: str = "v1"
    extracted_attributes: Dict[str, Any] = field(default_factory=dict)
    semantic_signatures: List[str] = field(default_factory=list)
    narrative_vectors: List[str] = field(default_factory=list)
    active_domains: List[str] = field(default_factory=list)


# ============================================================
# INVESTIGATION STATE
# ============================================================

@dataclass(frozen=True)
class InvestigationState:
    active_vectors: List[str] = field(default_factory=list)
    completed_actions: List[str] = field(default_factory=list)
    pending_actions: List[str] = field(default_factory=list)
    contacted_entities: List[str] = field(default_factory=list)
    investigation_notes: List[str] = field(default_factory=list)


# ============================================================
# DELTA REFERENCE
# ============================================================

@dataclass(frozen=True)
class DeltaReference:
    delta_id: str
    delta_type: str
    description: str
    affected_layers: List[str] = field(default_factory=list)


# ============================================================
# EPISTEMIC SNAPSHOT
# ============================================================

@dataclass(frozen=True)
class EpistemicSnapshot:
    """
    Immutable cognition snapshot.

    Represents:
    what the system believed,
    when it believed it,
    and why that cognition state existed.
    """

    snapshot_id: str
    event_id: str

    snapshot_type: SnapshotType
    epistemic_authority: EpistemicAuthority

    temporal_layer: int = 0

    created_at: datetime = field(
        default_factory=lambda: datetime.now(UTC)
    )

    parent_snapshot_id: Optional[str] = None

    cognition_surface: Dict[str, Any] = field(default_factory=dict)

    topology_state: TopologyState = field(
        default_factory=TopologyState
    )

    ontology_state: OntologyState = field(
        default_factory=OntologyState
    )

    investigation_state: InvestigationState = field(
        default_factory=InvestigationState
    )

    delta_refs: List[DeltaReference] = field(
        default_factory=list
    )

    investigation_refs: List[str] = field(
        default_factory=list
    )

    replay_generated: bool = False

    immutability_hash: Optional[str] = None