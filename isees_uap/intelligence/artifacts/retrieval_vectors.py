# ============================================================
# retrieval_vectors.py
# iSEES-UAP — RETRIEVAL VECTOR GOVERNANCE
# ============================================================

"""
Defines canonical retrieval vector structures.

Retrieval vectors are NOT prompts.

Retrieval vectors represent:
directed cognition pressure coordinates
used to retrieve external artifact-space surfaces.

These vectors originate from:
- topology pressure
- investigation state
- ontology extraction
- operator focus
- replay reconstruction
- contextual inference

Examples:
- "FAA radar outage near Medford 2004"
- "Nimitz SPY-1 anomalous track"
- "Tic Tac CAP point witness"
- "KMAX weather inversion"

Vectors are:
bounded,
deterministic,
and provenance-aware.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Dict, List, Optional

from isees_uap.intelligence.artifacts.artifact_types import (
    ArtifactDomain,
    RetrievalMode,
    SemanticClass,
)


# ============================================================
# VECTOR ORIGIN
# ============================================================

class RetrievalVectorOrigin(str, Enum):

    TOPOLOGY = "TOPOLOGY"

    INVESTIGATION = "INVESTIGATION"

    ONTOLOGY = "ONTOLOGY"

    REPLAY = "REPLAY"

    OPERATOR = "OPERATOR"

    MEMORY = "MEMORY"

    ENTANGLEMENT = "ENTANGLEMENT"

    CONTEXTUAL_INTELLIGENCE = (
        "CONTEXTUAL_INTELLIGENCE"
    )

    SYSTEM_AUTONOMOUS = (
        "SYSTEM_AUTONOMOUS"
    )

    UNKNOWN = "UNKNOWN"


# ============================================================
# VECTOR PRIORITY
# ============================================================

class RetrievalPriority(str, Enum):

    CRITICAL = "CRITICAL"

    HIGH = "HIGH"

    MEDIUM = "MEDIUM"

    LOW = "LOW"

    BACKGROUND = "BACKGROUND"


# ============================================================
# VECTOR STATE
# ============================================================

class RetrievalVectorState(str, Enum):

    GENERATED = "GENERATED"

    ACTIVE = "ACTIVE"

    RETRIEVING = "RETRIEVING"

    ATTACHED = "ATTACHED"

    EXPIRED = "EXPIRED"

    REJECTED = "REJECTED"

    ARCHIVED = "ARCHIVED"


# ============================================================
# TOPOLOGY PRESSURE
# ============================================================

@dataclass(frozen=True)
class TopologyPressure:

    ambiguity_pressure: float = 0.0

    contradiction_pressure: float = 0.0

    residual_pressure: float = 0.0

    entanglement_pressure: float = 0.0

    topology_weight: float = 0.0


# ============================================================
# RETRIEVAL VECTOR
# ============================================================

@dataclass(frozen=True)
class RetrievalVector:

    """
    Canonical artifact retrieval vector.

    Represents:
    deterministic retrieval coordinates
    directed into external artifact-space.
    """

    vector_id: str

    vector_phrase: str

    origin: RetrievalVectorOrigin

    retrieval_mode: RetrievalMode

    priority: RetrievalPriority = (
        RetrievalPriority.MEDIUM
    )

    state: RetrievalVectorState = (
        RetrievalVectorState.GENERATED
    )

    event_id: Optional[str] = None

    cluster_id: Optional[str] = None

    snapshot_id: Optional[str] = None

    temporal_reference: Optional[
        datetime
    ] = None

    target_domains: List[
        ArtifactDomain
    ] = field(default_factory=list)

    semantic_classes: List[
        SemanticClass
    ] = field(default_factory=list)

    ontology_tags: List[str] = field(
        default_factory=list
    )

    contextual_domains: List[str] = field(
        default_factory=list
    )

    topology_pressure: TopologyPressure = (
        field(default_factory=TopologyPressure)
    )

    vector_weight: float = 0.0

    retrieval_depth: int = 1

    replay_visible: bool = True

    operator_visible: bool = True

    replay_generated: bool = False

    synthetic: bool = False

    generated_by: str = "SYSTEM"

    generated_at: datetime = field(
        default_factory=lambda: datetime.now(UTC)
    )

    metadata: Dict[str, str] = field(
        default_factory=dict
    )


# ============================================================
# VECTOR COLLECTION
# ============================================================

@dataclass
class RetrievalVectorCollection:

    """
    Runtime retrieval vector aggregation layer.

    Represents:
    active retrieval pressure
    currently operating inside runtime cognition.
    """

    collection_id: str

    vectors: List[RetrievalVector] = (
        field(default_factory=list)
    )

    generated_at: datetime = field(
        default_factory=lambda: datetime.now(UTC)
    )

    active_domains: List[str] = field(
        default_factory=list
    )

    source_runtime_id: Optional[str] = None


# ============================================================
# EXPORTS
# ============================================================

__all__ = [

    "RetrievalVectorOrigin",

    "RetrievalPriority",

    "RetrievalVectorState",

    "TopologyPressure",

    "RetrievalVector",

    "RetrievalVectorCollection",
]