from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

from .config import (
    STUDIO_DRAFTING_MAX_GENERATED_TEXT_BYTES, STUDIO_DRAFTING_MAX_INSTRUCTION_CHARS,
    STUDIO_DRAFTING_MAX_NOTES, STUDIO_DRAFTING_MAX_PROPOSAL_BLOCKS,
    STUDIO_DRAFTING_MAX_SOURCES,
)


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


class DraftingBaseIdentity(StrictModel):
    documentRuntimeRevision: int = Field(ge=0)
    artifactId: str | None = None
    artifactVersionId: str | None = None
    artifactRevision: int | None = Field(default=None, ge=0)


class DraftingArtifactDesign(StrictModel):
    designId: Identity
    designVersion: Identity


class DraftingSource(StrictModel):
    anchorId: Identity
    investigationId: Identity
    sourceWorkspace: Identity
    sourceIdentity: Identity
    sourceKind: Identity
    classification: Literal["CANONICAL", "RESEARCHER_GENERATED"]
    insertionState: Literal["INSERTABLE"]
    insertionReason: str
    displayTitle: str
    displaySummary: str
    sourceRevisionId: str | None
    sourceExecutionId: str | None
    sourceProjectionId: str | None
    graphIdentity: str | None
    graphRevision: int | None
    captureSchemaVersion: Identity
    captureMediaType: Identity
    capturedRepresentation: Any
    collectedAt: datetime
    createdAt: datetime
    immutableSourceHash: Annotated[str, StringConstraints(pattern=r"^sha256:[0-9a-f]{64}$")]


class DraftingResearcherNote(StrictModel):
    nodeId: Identity
    nodeType: Identity
    section: str | None
    text: str
    documentOrder: int = Field(ge=0)


class DraftingExclusion(StrictModel):
    anchorId: Identity
    reason: Literal["CROSS_INVESTIGATION", "INSPECTION_ONLY", "UNDETERMINED"]


class DraftingContext(StrictModel):
    contextContractVersion: Literal["studio-drafting-context/v1"]
    investigationId: Identity
    documentId: Identity
    baseIdentity: DraftingBaseIdentity
    sourceSelectionMode: Literal["ALL", "SUBSET"]
    selectedSourceAnchorIds: list[Identity] = Field(max_length=STUDIO_DRAFTING_MAX_SOURCES)
    selectedResearcherNoteNodeIds: list[Identity] = Field(max_length=STUDIO_DRAFTING_MAX_NOTES)
    artifactDesign: DraftingArtifactDesign
    draftingInstruction: Annotated[str, StringConstraints(min_length=1, max_length=STUDIO_DRAFTING_MAX_INSTRUCTION_CHARS)]
    sources: list[DraftingSource] = Field(max_length=STUDIO_DRAFTING_MAX_SOURCES)
    researcherNotes: list[DraftingResearcherNote] = Field(max_length=STUDIO_DRAFTING_MAX_NOTES)
    excludedSources: list[DraftingExclusion] = Field(default_factory=list, max_length=STUDIO_DRAFTING_MAX_SOURCES)


class GenerateDraftProposal(StrictModel):
    requestContractVersion: Literal["studio-drafting-request/v1"]
    investigationId: Identity
    principalId: Identity
    contextHash: Annotated[str, StringConstraints(pattern=r"^sha256:[0-9a-f]{64}$")]
    context: DraftingContext


class ProposalSourceReference(StrictModel):
    anchorId: Identity
    relationship: Literal["SUPPORTS", "CONTRADICTS", "CONTEXT_ONLY", "REQUIRES_RESOLUTION"]


class ProposalBlock(StrictModel):
    blockId: Identity
    blockType: Literal["PARAGRAPH", "HEADING", "QUOTE", "LIST", "CITATION", "OBSERVATION"]
    text: str
    section: str | None = None
    sourceReferences: list[ProposalSourceReference] = Field(default_factory=list)


class DraftProposal(StrictModel):
    proposalId: Identity
    proposalContractVersion: Literal["studio-draft-proposal/v1"]
    contextContractVersion: Literal["studio-drafting-context/v1"]
    investigationId: Identity
    documentId: Identity
    baseIdentity: DraftingBaseIdentity
    contextHash: Annotated[str, StringConstraints(pattern=r"^sha256:[0-9a-f]{64}$")]
    artifactDesign: DraftingArtifactDesign
    providerId: Identity
    modelId: Identity
    outcome: Literal["GENERATED"]
    blocks: list[ProposalBlock] = Field(max_length=STUDIO_DRAFTING_MAX_PROPOSAL_BLOCKS)
    warnings: list[str] = Field(default_factory=list)
    unsupportedClaimDisclosures: list[str] = Field(default_factory=list)
    contradictionDisclosures: list[str] = Field(default_factory=list)
    uncertaintyDisclosures: list[str] = Field(default_factory=list)
    generatedAt: datetime

    @model_validator(mode="after")
    def generated_text_bound(self):
        generated = ([block.text for block in self.blocks] + self.warnings
                     + self.unsupportedClaimDisclosures + self.contradictionDisclosures
                     + self.uncertaintyDisclosures)
        if sum(len(text.encode("utf-8")) for text in generated) > STUDIO_DRAFTING_MAX_GENERATED_TEXT_BYTES:
            raise ValueError("generated proposal text exceeds the byte limit")
        return self
