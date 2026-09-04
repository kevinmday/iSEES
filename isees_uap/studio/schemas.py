from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator


Identity = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
IdempotencyKey = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class Mutation(StrictModel):
    schemaVersion: Literal["studio-command/v1"] = "studio-command/v1"
    investigationId: Identity
    idempotencyKey: IdempotencyKey
    principalId: Identity


class ExistingMutation(Mutation):
    artifactId: Identity
    expectedRevision: int = Field(ge=0)


class SourceSnapshotInput(StrictModel):
    snapshotId: Identity
    sourceIdentity: Identity
    sourceInvestigationId: Identity
    sourceWorkspace: Identity
    sourceKind: Literal["EVENT_NODE", "EVIDENCE", "NARRATIVE_PASSAGE", "TIMELINE_MOMENT", "MEDIA", "CORRESPONDENCE_EDGE", "HYPOTHESIS", "DERIVATION", "OTHER"]
    classification: Literal["CANONICAL", "RESEARCHER_GENERATED"]
    sourceRevisionId: str | None = None
    sourceExecutionId: str | None = None
    sourceProjectionId: str | None = None
    capturedAt: datetime
    representationSchemaVersion: Identity
    mediaType: Identity
    capturedRepresentation: Any


class ClaimInput(StrictModel):
    claimId: Identity
    claimText: str | None = None
    spanIdentity: str | None = None
    reviewState: Literal["UNREVIEWED", "ACCEPTED", "RETURNED", "REJECTED"] = "UNREVIEWED"

    @model_validator(mode="after")
    def exactly_one_content(self):
        if bool(self.claimText) == bool(self.spanIdentity):
            raise ValueError("exactly one of claimText or spanIdentity is required")
        return self


class CitationInput(StrictModel):
    citationId: Identity
    sourceSnapshotId: Identity
    locatorMetadata: dict[str, Any] | None = None


class ClaimSourceMappingInput(StrictModel):
    mappingId: Identity
    claimId: Identity
    sourceSnapshotId: Identity
    relationshipType: Literal["SUPPORTS", "CONTRADICTS", "CONTEXT_ONLY", "REQUIRES_RESOLUTION"]
    citationId: str | None = None
    contradictionOrigin: Literal["COMPUTED", "RESEARCHER_DECLARED"] | None = None
    attributedActorId: str | None = None
    attributedProcess: str | None = None


class CreateStudioDraft(Mutation):
    artifactId: Identity | None = None
    versionId: Identity | None = None
    authorSchemaVersion: Identity
    document: Any
    sourceSnapshots: list[SourceSnapshotInput] = Field(default_factory=list)
    claims: list[ClaimInput] = Field(default_factory=list)
    citations: list[CitationInput] = Field(default_factory=list)
    claimSourceMappings: list[ClaimSourceMappingInput] = Field(default_factory=list)
    comparisonContext: dict[str, Any] | None = None


class SaveStudioArtifactVersion(ExistingMutation):
    versionId: Identity | None = None
    authorSchemaVersion: Identity
    document: Any
    sourceSnapshots: list[SourceSnapshotInput] = Field(default_factory=list)
    claims: list[ClaimInput] = Field(default_factory=list)
    citations: list[CitationInput] = Field(default_factory=list)
    claimSourceMappings: list[ClaimSourceMappingInput] = Field(default_factory=list)
    comparisonContext: dict[str, Any] | None = None


class CreateCandidateKnowledgeArtifact(ExistingMutation):
    candidateArtifactId: Identity | None = None


class PublishStudioCandidateNode(ExistingMutation):
    candidateArtifactId: Identity


class SubmitStudioForReview(ExistingMutation):
    candidateArtifactId: Identity


class ReviewCommand(ExistingMutation):
    candidateArtifactId: Identity
    targetScope: Literal["CLAIM", "ARTIFACT"]
    claimId: str | None = None
    reason: Identity

    @model_validator(mode="after")
    def scope_claim(self):
        if (self.targetScope == "CLAIM") != (self.claimId is not None):
            raise ValueError("claimId is required exactly for CLAIM scope")
        return self


class AcceptStudioArtifact(ReviewCommand):
    pass


class ReturnStudioArtifact(ReviewCommand):
    pass


class RejectStudioArtifact(ReviewCommand):
    pass


class ValidateStudioProjection(ExistingMutation):
    projectionId: Identity | None = None
    artifactVersionId: Identity
    projectionFormat: Literal["HTML", "PDF", "DOCX"]
    citationStyleConfiguration: dict[str, Any] = Field(default_factory=dict)
    validatorVersion: Identity


class RecordMaterializedProjection(ExistingMutation):
    projectionId: Identity
    materializerVersion: Identity
    outputIdentity: Identity
    outputLocation: Identity
    outputHash: Annotated[str, StringConstraints(pattern=r"^sha256:[0-9a-f]{64}$")]


class StudioCommandResult(StrictModel):
    artifactId: str
    investigationId: str
    revision: int
    lifecycleState: str
    currentVersionId: str
    replayed: bool = False
    candidateArtifactId: str | None = None
    manifoldCandidateNodeId: str | None = None
    projectionId: str | None = None
    readinessState: str | None = None
    warnings: list[str] = Field(default_factory=list)
    receiptId: str | None = None
