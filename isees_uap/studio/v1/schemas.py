from __future__ import annotations
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator
from .contracts import ARTIFACT_PROFILES, GOVERNED_CONCLUSIONS
from .hashing import canonical_sha256

Identity = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
Sha256 = Annotated[str, StringConstraints(pattern=r"^sha256:[0-9a-f]{64}$")]
UtcTimestamp = Annotated[str, StringConstraints(pattern=r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$")]

class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

class SourceLineage(StrictModel):
    sourceSnapshotId: Identity; sourceRepresentationId: Identity; sourceHash: Sha256
class VariableDefinition(StrictModel):
    symbol: Identity; meaning: Identity; unit: Identity | None = None
class CitationMetadata(StrictModel):
    citationId: Identity; authors: tuple[Identity, ...] | None = None; institutionalAuthor: Identity | None = None
    title: Identity; container: Identity | None = None; publisher: Identity | None = None; publicationDate: Identity | None = None
    accessedDate: Identity | None = None; volume: Identity | None = None; issue: Identity | None = None; edition: Identity | None = None
    pagesOrLocator: Identity | None = None; doi: Identity | None = None; url: Identity | None = None; isbn: Identity | None = None
    reportOrAccessionId: Identity | None = None; sourceSnapshotId: Identity
    completeness: Literal["COMPLETE", "INCOMPLETE"]; missingRequiredFields: tuple[Identity, ...]
    @model_validator(mode="after")
    def complete_and_attributed(self):
        if not self.authors and not self.institutionalAuthor: raise ValueError("citation requires authors or institutional author")
        if len(set(self.missingRequiredFields)) != len(self.missingRequiredFields): raise ValueError("duplicate missing fields")
        if self.completeness == "COMPLETE" and self.missingRequiredFields: raise ValueError("complete citation cannot have missing fields")
        if self.completeness == "INCOMPLETE" and not self.missingRequiredFields: raise ValueError("incomplete citation must identify missing fields")
        return self
class CitationStyleConfiguration(StrictModel):
    style: Literal["APA", "CHICAGO", "IEEE"]; styleVersion: Identity; locale: Identity
class WorkingDraftState(StrictModel): state: Literal["UNSAVED"]; basedOnRevisionId: Identity | None = None
class ArtifactIdentity(StrictModel):
    artifactId: Identity; investigationId: Identity; authorPrincipalId: Identity
    profile: Literal["INVESTIGATION_REPORT", "EXECUTIVE_BRIEF", "SCIENTIFIC_PAPER", "INTENTION_HYPOTHESIS_ASSESSMENT"]
    profileCapability: Literal["ADMITTED_UNVERIFIED", "VERIFIED_AVAILABLE"]
    lifecycleClassification: Literal["CANDIDATE_KNOWLEDGE"]; createdAt: UtcTimestamp
    currentSavedRevisionId: Identity | None = None; workingDraft: WorkingDraftState
class HeadingNode(StrictModel): id: Identity; type: Literal["HEADING"]; level: int = Field(ge=1, le=6); text: Identity
class SectionNode(StrictModel): id: Identity; type: Literal["SECTION"]; title: Identity; childNodeIds: tuple[Identity, ...]
class TextNode(StrictModel): id: Identity; type: Literal["PARAGRAPH", "RESEARCHER_NOTE"]; text: Identity
class ClaimNode(StrictModel): id: Identity; type: Literal["CLAIM"]; text: Identity; sourceSnapshotIds: tuple[Identity, ...]; supportState: Literal["SUPPORTED", "UNSUPPORTED"]
class QuotationNode(StrictModel): id: Identity; type: Literal["QUOTATION"]; text: Identity; citationId: Identity; locator: Identity
class CitationReferenceNode(StrictModel): id: Identity; type: Literal["CITATION_REFERENCE"]; citationId: Identity
class FootnoteNode(StrictModel): id: Identity; type: Literal["FOOTNOTE"]; text: Identity; marker: Identity
class EquationNode(StrictModel):
    id: Identity; type: Literal["EQUATION"]; notation: Literal["INLINE", "DISPLAY"]; latexSource: Identity; equationId: Identity
    equationNumber: Identity | None = None; variables: tuple[VariableDefinition, ...]; units: tuple[Identity, ...] | None = None
    assumptions: tuple[Identity, ...]; derivationOrSourceNote: Identity | None = None; crossReferenceTargets: tuple[Identity, ...]
class FigureNode(StrictModel): id: Identity; type: Literal["FIGURE"]; caption: Identity; altText: Identity; assetId: Identity; sourceAttribution: Identity; lineage: tuple[SourceLineage, ...]
class TableNode(StrictModel): id: Identity; type: Literal["TABLE"]; caption: Identity; altText: Identity; dataId: Identity; columns: tuple[Identity, ...]; rows: tuple[tuple[str, ...], ...]; sourceAttribution: Identity; lineage: tuple[SourceLineage, ...]
class AppendixNode(StrictModel): id: Identity; type: Literal["APPENDIX"]; title: Identity; childNodeIds: tuple[Identity, ...]
SemanticNode = Annotated[HeadingNode | SectionNode | TextNode | ClaimNode | QuotationNode | CitationReferenceNode | FootnoteNode | EquationNode | FigureNode | TableNode | AppendixNode, Field(discriminator="type")]
class SemanticDocument(StrictModel):
    documentId: Identity; schemaVersion: Literal["studio-author-semantic/v1"]; title: Identity; nodeOrder: tuple[Identity, ...]
    nodes: tuple[SemanticNode, ...]; citations: tuple[CitationMetadata, ...]; citationStyle: CitationStyleConfiguration
    @model_validator(mode="after")
    def identities(self):
        ids = tuple(node.id for node in self.nodes)
        if len(set(ids)) != len(ids): raise ValueError("duplicate semantic IDs")
        if self.nodeOrder != ids: raise ValueError("nodeOrder must exactly match node serialization order")
        return self
class SnapshotReference(StrictModel): snapshotId: Identity; snapshotHash: Sha256
class AuthorRevision(StrictModel):
    artifactId: Identity; revisionId: Identity; revisionNumber: int = Field(ge=1); parentRevisionId: Identity | None = None
    semanticContent: SemanticDocument; contentHash: Sha256; sourceSnapshots: tuple[SnapshotReference, ...]
    profile: Literal["INVESTIGATION_REPORT", "EXECUTIVE_BRIEF", "SCIENTIFIC_PAPER", "INTENTION_HYPOTHESIS_ASSESSMENT"]; profileVersion: Identity; createdAt: UtcTimestamp; authorPrincipalId: Identity
    immutableStatus: Literal["IMMUTABLE_SAVED_REVISION"]
    @model_validator(mode="after")
    def invariant(self):
        if (self.revisionNumber == 1) == (self.parentRevisionId is not None): raise ValueError("revision parent invariant")
        if self.contentHash != canonical_sha256(self.semanticContent.model_dump(exclude_none=True)): raise ValueError("contentHash mismatch")
        ids = [x.snapshotId for x in self.sourceSnapshots]
        if len(set(ids)) != len(ids): raise ValueError("duplicate snapshot references")
        return self
class SensitiveSourceDirectives(StrictModel):
    includeInAnalysis: bool; includeInArtifact: bool; citePublicly: bool; anonymize: bool; restrictedAppendix: bool; excludeFromAiProcessing: bool
class CapturedSourceRepresentation(StrictModel): representationId: Identity; mediaType: Identity; schemaVersion: Identity; content: str; contentHash: Sha256
class FrozenSource(StrictModel):
    anchorId: Identity; classification: Literal["CANONICAL", "CANDIDATE", "EXPERIMENTAL", "EXTERNAL"]
    availability: Literal["AVAILABLE", "UNAVAILABLE", "REDACTED"]; provenance: Identity; sensitivity: SensitiveSourceDirectives
    representations: tuple[CapturedSourceRepresentation, ...]
class FrozenResearchSourceSnapshot(StrictModel):
    snapshotId: Identity; investigationId: Identity; capturedAt: UtcTimestamp; selectionScope: Literal["ENTIRE_RESEARCH_INBOX", "EXPLICIT_SELECTION"]
    selectedAnchorIds: tuple[Identity, ...]; inboxMembershipBasis: Literal["COMPLETE_ELIGIBLE_INBOX_INDEPENDENT_OF_UI", "EXPLICIT_STABLE_IDENTITIES"]
    sources: tuple[FrozenSource, ...]; snapshotHash: Sha256; immutableStatus: Literal["FROZEN"]
    @model_validator(mode="after")
    def frozen_invariants(self):
        ids = tuple(x.anchorId for x in self.sources)
        if len(set(ids)) != len(ids) or len(set(self.selectedAnchorIds)) != len(self.selectedAnchorIds): raise ValueError("duplicate snapshot identities")
        if ids != self.selectedAnchorIds: raise ValueError("selected anchors must match frozen source order")
        expected = "COMPLETE_ELIGIBLE_INBOX_INDEPENDENT_OF_UI" if self.selectionScope == "ENTIRE_RESEARCH_INBOX" else "EXPLICIT_STABLE_IDENTITIES"
        if self.inboxMembershipBasis != expected: raise ValueError("selection basis")
        domain = self.model_dump(exclude={"snapshotHash"}, exclude_none=True)
        if self.snapshotHash != canonical_sha256(domain): raise ValueError("snapshotHash mismatch")
        return self
class ProviderProvenance(StrictModel): providerId: Identity; modelId: Identity; modelVersion: Identity | None = None; configurationHash: Sha256; promptContractVersion: Identity
class ProposalOperation(StrictModel): operation: Literal["INSERT_AFTER", "REPLACE", "DELETE"]; targetNodeId: Identity | None = None; proposedNode: SemanticNode | None = None
class ProposalUnit(StrictModel): proposalUnitId: Identity; operation: ProposalOperation; state: Literal["UNAPPLIED"]; disposition: Literal["PENDING", "ACCEPTED", "REJECTED"]
class StaleBase(StrictModel): rejected: bool; reason: Identity | None = None
class AiDraftProposal(StrictModel):
    proposalId: Identity; artifactId: Identity; baseRevisionId: Identity; baseContentHash: Sha256; sourceSnapshots: tuple[SnapshotReference, ...]
    assistanceMode: Literal["BUILD_OUTLINE", "DRAFT_SELECTED_SECTIONS", "DRAFT_COMPLETE_ARTIFACT", "REVIEW_SCHOLARLY_INTEGRITY"]
    providerProvenance: ProviderProvenance; units: tuple[ProposalUnit, ...]; authorityState: Literal["UNAPPLIED_PROPOSAL"]
    staleBase: StaleBase; unsupportedClaimFindings: tuple[str, ...]; incompleteCitationFindings: tuple[str, ...]
    @model_validator(mode="after")
    def unique_units(self):
        if len({x.proposalUnitId for x in self.units}) != len(self.units): raise ValueError("duplicate proposal units")
        return self
class FailureDetails(StrictModel): code: Identity; safeMessage: Identity
class Publication(StrictModel): publicationId: Identity; status: Literal["PUBLISHED", "RETRACTED"]
class ChildProjection(StrictModel):
    projectionId: Identity; parentArtifactId: Identity; parentRevisionId: Identity; parentContentHash: Sha256
    format: Literal["PDF", "DOCX", "HTML", "LATEX", "BIBLIOGRAPHY_MANIFEST", "SOURCE_PROVENANCE_MANIFEST"]
    state: Literal["NOT_GENERATED", "QUEUED", "REBUILDING", "CURRENT", "STALE", "FAILED", "SUPERSEDED", "PUBLISHED", "RETRACTED"]
    templateProfileVersion: Identity; rendererVersion: Identity; configurationHash: Sha256; outputHash: Sha256 | None = None
    priorSuccessfulProjectionId: Identity | None = None; failure: FailureDetails | None = None; publication: Publication | None = None
class IntentionCapabilities(StrictModel): mutation: Literal["PROHIBITED"]; testConfiguration: Literal["PROHIBITED"]; execution: Literal["PROHIBITED"]; navigation: Literal["PROHIBITED"]; directInvocation: Literal["PROHIBITED"]
class IntentionResultReference(StrictModel): resultId: Identity; executionId: Identity; projectionId: Identity; resultHash: Sha256; completionStatus: Literal["COMPLETED"]; immutableStatus: Literal["IMMUTABLE"]; access: Literal["READ_ONLY"]
class InferenceStatement(StrictModel): id: Identity; text: Identity; authorship: Literal["RESEARCHER", "AI"]; epistemicClass: Literal["ABDUCTIVE"]
class Alternative(InferenceStatement): hypothesisId: Identity
class Observation(StrictModel): id: Identity; text: Identity; epistemicClass: Literal["DETERMINISTIC_MEASUREMENT"]; resultId: Identity
class GovernedConclusion(StrictModel):
    conclusion: Literal["CONSISTENT_WITH", "INSUFFICIENT_EVIDENCE", "NOT_DISTINGUISHABLE", "H0_WEAKENED", "H0_REJECTED_UNDER_DECLARED_TEST", "H1_VIABLE", "FURTHER_INVESTIGATION_REQUIRED"]; evidenceScope: tuple[Identity, ...]; assumptions: tuple[Identity, ...]; unresolvedAlternatives: tuple[Identity, ...]; declaredTest: Identity | None = None
    @model_validator(mode="after")
    def complete(self):
        if not self.evidenceScope or not self.assumptions or not self.unresolvedAlternatives: raise ValueError("conclusion scope, assumptions, and alternatives required")
        if self.conclusion == "H0_REJECTED_UNDER_DECLARED_TEST" and not self.declaredTest: raise ValueError("H0 rejection requires declared test")
        return self
class InferencePackage(StrictModel):
    inferenceSessionId: Identity; inferencePackageId: Identity; invocationOwner: Literal["STUDIO"]; intentionCapabilities: IntentionCapabilities
    intentionResults: tuple[IntentionResultReference, ...]; h0: InferenceStatement; alternatives: tuple[Alternative, ...]; observations: tuple[Observation, ...]
    mathematicalWarrants: tuple[InferenceStatement, ...]; assumptions: tuple[InferenceStatement, ...]; supportingEvidence: tuple[InferenceStatement, ...]
    counterevidence: tuple[InferenceStatement, ...]; alternativeExplanations: tuple[InferenceStatement, ...]; predictions: tuple[InferenceStatement, ...]
    falsifiers: tuple[InferenceStatement, ...]; unresolvedUncertainties: tuple[InferenceStatement, ...]
    outputClassification: tuple[Literal["ABDUCTIVE"], Literal["CANDIDATE"]]; proposalState: Literal["UNAPPLIED", "PARTIALLY_ACCEPTED", "ACCEPTED", "REJECTED"]
    governedConclusion: GovernedConclusion
    @model_validator(mode="after")
    def hypotheses(self):
        ids = {x.hypothesisId for x in self.alternatives}
        if not {"H1a", "H1b"}.issubset(ids): raise ValueError("H1a and H1b required")
        return self
