# ============================================================
# artifact_contracts.py
# iSEES-UAP — CANONICAL ARTIFACT CONTRACTS
# ============================================================

"""
Defines canonical artifact-space contracts.

Artifacts are bounded cognition surfaces.

Artifacts are NOT:
- truth
- event authority
- topology authority
- ontology authority

Artifacts represent:
externally sourced observational/contextual
surfaces attached to runtime cognition.

This layer exists to normalize:
- artifact identity
- provenance
- retrieval lineage
- semantic attachment
- topology linkage
- runtime attachment
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, Dict, List, Optional

from isees_uap.intelligence.artifacts.artifact_types import (
    ArtifactAuthority,
    ArtifactDomain,
    ArtifactState,
    ArtifactType,
    RetrievalMode,
    SemanticClass,
)


# ============================================================
# RETRIEVAL VECTOR REFERENCE
# ============================================================

@dataclass(frozen=True)
class RetrievalVectorReference:

    vector_id: str

    vector_phrase: str

    retrieval_mode: RetrievalMode

    vector_weight: float = 0.0

    generated_at: datetime = field(
        default_factory=lambda: datetime.now(UTC)
    )


# ============================================================
# PROVENANCE CONTRACT
# ============================================================

@dataclass(frozen=True)
class ArtifactProvenance:

    authority: ArtifactAuthority

    domain: ArtifactDomain

    source_name: str

    source_uri: Optional[str] = None

    provenance_score: float = 0.0

    retrieved_at: datetime = field(
        default_factory=lambda: datetime.now(UTC)
    )

    retrieval_mode: RetrievalMode = (
        RetrievalMode.UNKNOWN
    )

    operator_id: Optional[str] = None

    synthetic: bool = False

    replay_generated: bool = False


# ============================================================
# SEMANTIC SURFACE
# ============================================================

@dataclass(frozen=True)
class ArtifactSemanticSurface:

    semantic_classes: List[SemanticClass] = (
        field(default_factory=list)
    )

    ontology_tags: List[str] = (
        field(default_factory=list)
    )

    narrative_vectors: List[str] = (
        field(default_factory=list)
    )

    semantic_signatures: List[str] = (
        field(default_factory=list)
    )

    contextual_domains: List[str] = (
        field(default_factory=list)
    )


# ============================================================
# TOPOLOGY ATTACHMENT
# ============================================================

@dataclass(frozen=True)
class ArtifactTopologyAttachment:

    linked_event_ids: List[str] = (
        field(default_factory=list)
    )

    linked_cluster_ids: List[str] = (
        field(default_factory=list)
    )

    linked_snapshot_ids: List[str] = (
        field(default_factory=list)
    )

    contradiction_pressure: float = 0.0

    ambiguity_pressure: float = 0.0

    residual_pressure: float = 0.0

    topology_weight: float = 0.0


# ============================================================
# ARTIFACT REFERENCE
# ============================================================

@dataclass(frozen=True)
class ArtifactReference:

    """
    Canonical runtime artifact reference.

    Represents:
    an externally retrieved cognition surface
    attached to runtime investigation state.
    """

    artifact_id: str

    artifact_type: ArtifactType

    title: str

    state: ArtifactState = ArtifactState.DISCOVERED

    description: Optional[str] = None

    source_uri: Optional[str] = None

    local_path: Optional[str] = None

    temporal_reference: Optional[datetime] = None

    provenance: ArtifactProvenance = field(
        default_factory=lambda:
            ArtifactProvenance(
                authority=ArtifactAuthority.UNKNOWN,
                domain=ArtifactDomain.UNKNOWN,
                source_name="UNKNOWN"
            )
    )

    semantic_surface: ArtifactSemanticSurface = (
        field(
            default_factory=ArtifactSemanticSurface
        )
    )

    topology_attachment: ArtifactTopologyAttachment = (
        field(
            default_factory=ArtifactTopologyAttachment
        )
    )

    retrieval_vectors: List[
        RetrievalVectorReference
    ] = field(default_factory=list)

    metadata: Dict[str, Any] = (
        field(default_factory=dict)
    )

    created_at: datetime = field(
        default_factory=lambda: datetime.now(UTC)
    )

    runtime_attached: bool = False

    replay_visible: bool = True

    operator_visible: bool = True


# ============================================================
# ARTIFACT COLLECTION
# ============================================================

@dataclass
class ArtifactCollection:

    """
    Runtime artifact aggregation surface.

    Represents:
    active externally sourced cognition surfaces
    attached to runtime state.
    """

    collection_id: str

    artifacts: List[ArtifactReference] = (
        field(default_factory=list)
    )

    active_vectors: List[str] = (
        field(default_factory=list)
    )

    imported_notebooks: List[str] = (
        field(default_factory=list)
    )

    created_at: datetime = field(
        default_factory=lambda: datetime.now(UTC)
    )


# ============================================================
# EXPORTS
# ============================================================

__all__ = [

    "RetrievalVectorReference",

    "ArtifactProvenance",

    "ArtifactSemanticSurface",

    "ArtifactTopologyAttachment",

    "ArtifactReference",

    "ArtifactCollection",
]