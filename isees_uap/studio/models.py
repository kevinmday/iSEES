from __future__ import annotations

from dataclasses import dataclass, field, replace
from datetime import datetime
from enum import Enum
from types import MappingProxyType
from typing import Any, Mapping

from .hashing import hash_snapshot
from .lifecycle import StudioLifecycle


def freeze(value: Any) -> Any:
    if isinstance(value, Mapping):
        return MappingProxyType({key: freeze(item) for key, item in value.items()})
    if isinstance(value, (list, tuple)):
        return tuple(freeze(item) for item in value)
    return value


def _utc(value: datetime) -> None:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("timestamp must be timezone-aware")


class SourceClassification(str, Enum):
    CANONICAL = "CANONICAL"
    RESEARCHER_GENERATED = "RESEARCHER_GENERATED"


class SourceKind(str, Enum):
    EVENT_NODE = "EVENT_NODE"
    EVIDENCE = "EVIDENCE"
    NARRATIVE_PASSAGE = "NARRATIVE_PASSAGE"
    TIMELINE_MOMENT = "TIMELINE_MOMENT"
    MEDIA = "MEDIA"
    CORRESPONDENCE_EDGE = "CORRESPONDENCE_EDGE"
    HYPOTHESIS = "HYPOTHESIS"
    DERIVATION = "DERIVATION"
    OTHER = "OTHER"


class ResolutionStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    STALE = "STALE"
    MISSING = "MISSING"
    REDACTED = "REDACTED"
    UNAVAILABLE = "UNAVAILABLE"
    UNKNOWN = "UNKNOWN"


class ClaimReviewState(str, Enum):
    UNREVIEWED = "UNREVIEWED"
    ACCEPTED = "ACCEPTED"
    RETURNED = "RETURNED"
    REJECTED = "REJECTED"


class LineageState(str, Enum):
    SUPPORTED = "SUPPORTED"
    UNRESOLVED = "UNRESOLVED"
    CONTRADICTED = "CONTRADICTED"
    ORPHANED = "ORPHANED"


class RelationshipType(str, Enum):
    SUPPORTS = "SUPPORTS"
    CONTRADICTS = "CONTRADICTS"
    CONTEXT_ONLY = "CONTEXT_ONLY"
    REQUIRES_RESOLUTION = "REQUIRES_RESOLUTION"


class ContradictionOrigin(str, Enum):
    COMPUTED = "COMPUTED"
    RESEARCHER_DECLARED = "RESEARCHER_DECLARED"


class ReadinessState(str, Enum):
    READY = "READY"
    READY_WITH_WARNINGS = "READY_WITH_WARNINGS"
    NOT_READY = "NOT_READY"


class ProjectionFormat(str, Enum):
    HTML = "HTML"
    PDF = "PDF"
    DOCX = "DOCX"


class MaterializationState(str, Enum):
    NOT_MATERIALIZED = "NOT_MATERIALIZED"
    MATERIALIZED = "MATERIALIZED"
    FAILED = "FAILED"


class ReviewTargetScope(str, Enum):
    CLAIM = "CLAIM"
    ARTIFACT = "ARTIFACT"


class ReviewDecisionType(str, Enum):
    ACCEPT = "ACCEPT"
    RETURN = "RETURN"
    REJECT = "REJECT"


@dataclass(frozen=True)
class StudioSourceSnapshot:
    snapshot_id: str
    source_identity: str
    source_investigation_id: str
    source_workspace: str
    source_kind: SourceKind
    classification: SourceClassification
    captured_at: datetime
    representation_schema_version: str
    media_type: str
    captured_representation: Any
    snapshot_hash: str = ""
    source_revision_id: str | None = None
    source_execution_id: str | None = None
    source_projection_id: str | None = None
    resolution_status: ResolutionStatus = ResolutionStatus.UNKNOWN
    resolution_metadata: Mapping[str, Any] = field(default_factory=dict)
    anchor_id: str | None = None
    graph_identity: str | None = None
    graph_revision: int | None = None
    immutable_source_hash: str | None = None
    insertion_state: str | None = None
    insertion_reason: str | None = None

    def __post_init__(self) -> None:
        _utc(self.captured_at)
        object.__setattr__(self, "captured_representation", freeze(self.captured_representation))
        object.__setattr__(self, "resolution_metadata", freeze(self.resolution_metadata))
        calculated = hash_snapshot(self)
        if self.snapshot_hash and self.snapshot_hash != calculated:
            raise ValueError("snapshot_hash does not match immutable capture fields")
        object.__setattr__(self, "snapshot_hash", calculated)

    def with_resolution(self, status: ResolutionStatus, metadata: Mapping[str, Any]) -> StudioSourceSnapshot:
        return replace(self, resolution_status=status, resolution_metadata=metadata)


@dataclass(frozen=True)
class StudioClaim:
    claim_id: str
    artifact_version_id: str
    review_state: ClaimReviewState
    lineage_state: LineageState
    claim_text: str | None = None
    span_identity: str | None = None

    def __post_init__(self) -> None:
        if bool(self.claim_text) == bool(self.span_identity):
            raise ValueError("exactly one of claim_text or span_identity is required")


@dataclass(frozen=True)
class StudioCitation:
    citation_id: str
    artifact_version_id: str
    source_snapshot_id: str
    locator_metadata: Mapping[str, Any] | None = None

    def __post_init__(self) -> None:
        object.__setattr__(self, "locator_metadata", freeze(self.locator_metadata))


@dataclass(frozen=True)
class StudioClaimSourceMapping:
    mapping_id: str
    artifact_version_id: str
    claim_id: str
    source_snapshot_id: str
    relationship_type: RelationshipType
    citation_id: str | None = None
    contradiction_origin: ContradictionOrigin | None = None
    attributed_actor_id: str | None = None
    attributed_process: str | None = None

    def __post_init__(self) -> None:
        if self.relationship_type == RelationshipType.CONTRADICTS and self.contradiction_origin is None:
            raise ValueError("contradiction_origin is required for CONTRADICTS")
        if self.relationship_type != RelationshipType.CONTRADICTS and self.contradiction_origin is not None:
            raise ValueError("contradiction_origin is valid only for CONTRADICTS")


@dataclass(frozen=True)
class StudioArtifactVersion:
    version_id: str
    artifact_id: str
    version_number: int
    parent_version_id: str | None
    author_schema_version: str
    document: Any
    source_snapshot_ids: tuple[str, ...]
    claims: tuple[StudioClaim, ...]
    citations: tuple[StudioCitation, ...]
    claim_source_mappings: tuple[StudioClaimSourceMapping, ...]
    comparison_context: Mapping[str, Any] | None
    content_hash: str
    created_by_principal_id: str
    created_at: datetime

    def __post_init__(self) -> None:
        _utc(self.created_at)
        if self.version_number < 1:
            raise ValueError("version_number must be positive")
        object.__setattr__(self, "document", freeze(self.document))
        object.__setattr__(self, "source_snapshot_ids", tuple(self.source_snapshot_ids))
        object.__setattr__(self, "claims", tuple(self.claims))
        object.__setattr__(self, "citations", tuple(self.citations))
        object.__setattr__(self, "claim_source_mappings", tuple(self.claim_source_mappings))
        object.__setattr__(self, "comparison_context", freeze(self.comparison_context))


@dataclass(frozen=True)
class CandidateKnowledgeArtifact:
    candidate_artifact_id: str
    artifact_id: str
    artifact_version_id: str
    readiness_state: ReadinessState
    validation_warnings: tuple[str, ...]
    created_by_principal_id: str
    created_at: datetime

    def __post_init__(self) -> None:
        _utc(self.created_at)
        object.__setattr__(self, "validation_warnings", tuple(self.validation_warnings))


@dataclass(frozen=True)
class StudioProjectionRecord:
    projection_id: str
    artifact_id: str
    artifact_version_id: str
    projection_format: ProjectionFormat
    citation_style_configuration: Mapping[str, Any]
    readiness_state: ReadinessState
    validation_warnings: tuple[str, ...]
    materialization_state: MaterializationState
    validator_version: str
    validated_at: datetime
    materializer_version: str | None = None
    output_identity: str | None = None
    output_location: str | None = None
    output_hash: str | None = None
    materialized_at: datetime | None = None

    def __post_init__(self) -> None:
        _utc(self.validated_at)
        if self.materialized_at is not None:
            _utc(self.materialized_at)
        object.__setattr__(self, "citation_style_configuration", freeze(self.citation_style_configuration))
        object.__setattr__(self, "validation_warnings", tuple(self.validation_warnings))


@dataclass(frozen=True)
class StudioReviewDecision:
    decision_id: str
    artifact_id: str
    candidate_artifact_id: str
    target_scope: ReviewTargetScope
    claim_id: str | None
    decision: ReviewDecisionType
    reason: str
    actor_principal_id: str
    prior_revision: int
    resulting_revision: int
    decided_at: datetime

    def __post_init__(self) -> None:
        _utc(self.decided_at)
        if (self.target_scope == ReviewTargetScope.CLAIM) != (self.claim_id is not None):
            raise ValueError("claim_id is required exactly for CLAIM review scope")


@dataclass(frozen=True)
class StudioArtifact:
    artifact_id: str
    investigation_id: str
    owner_principal_id: str
    revision: int
    lifecycle_state: StudioLifecycle
    current_version_number: int
    current_version_id: str
    created_at: datetime
    updated_at: datetime
    candidate_artifact_id: str | None = None
    manifold_candidate_node_id: str | None = None

    def __post_init__(self) -> None:
        _utc(self.created_at)
        _utc(self.updated_at)
        if self.revision < 0 or self.current_version_number < 1:
            raise ValueError("artifact revision and version number are invalid")
