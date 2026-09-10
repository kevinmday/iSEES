/** A23 I1 domain-only wire contract. Presence here admits vocabulary; it does not assert runtime availability. */
export const STUDIO_V1_CONTRACT_VERSION = "studio-v1/domain-contract/1" as const;
export const ARTIFACT_PROFILES = ["INVESTIGATION_REPORT", "EXECUTIVE_BRIEF", "SCIENTIFIC_PAPER", "INTENTION_HYPOTHESIS_ASSESSMENT"] as const;
export const CITATION_STYLES = ["APA", "CHICAGO", "IEEE"] as const;
export const SEMANTIC_NODE_TYPES = ["HEADING", "SECTION", "PARAGRAPH", "CLAIM", "QUOTATION", "CITATION_REFERENCE", "FOOTNOTE", "EQUATION", "FIGURE", "TABLE", "APPENDIX", "RESEARCHER_NOTE"] as const;
export const PROJECTION_FORMATS = ["PDF", "DOCX", "HTML", "LATEX", "BIBLIOGRAPHY_MANIFEST", "SOURCE_PROVENANCE_MANIFEST"] as const;
export const PROJECTION_STATES = ["NOT_GENERATED", "QUEUED", "REBUILDING", "CURRENT", "STALE", "FAILED", "SUPERSEDED", "PUBLISHED", "RETRACTED"] as const;
export const ASSISTANCE_MODES = ["BUILD_OUTLINE", "DRAFT_SELECTED_SECTIONS", "DRAFT_COMPLETE_ARTIFACT", "REVIEW_SCHOLARLY_INTEGRITY"] as const;
export const GOVERNED_CONCLUSIONS = ["CONSISTENT_WITH", "INSUFFICIENT_EVIDENCE", "NOT_DISTINGUISHABLE", "H0_WEAKENED", "H0_REJECTED_UNDER_DECLARED_TEST", "H1_VIABLE", "FURTHER_INVESTIGATION_REQUIRED"] as const;
export const PROHIBITED_STUDIO_MUTATIONS = ["SYSTEM_CANON", "INVESTIGATION_EVIDENCE", "DETERMINISTIC_RESULTS", "RESEARCH_INBOX", "SOURCE_SYSTEMS", "INTENTION"] as const;
export type ArtifactProfile = typeof ARTIFACT_PROFILES[number];
export type SemanticNodeType = typeof SEMANTIC_NODE_TYPES[number];

export interface SourceLineage { sourceSnapshotId: string; sourceRepresentationId: string; sourceHash: string }
export interface CitationMetadata { citationId: string; authors?: readonly string[]; institutionalAuthor?: string; title: string; container?: string; publisher?: string; publicationDate?: string; accessedDate?: string; volume?: string; issue?: string; edition?: string; pagesOrLocator?: string; doi?: string; url?: string; isbn?: string; reportOrAccessionId?: string; sourceSnapshotId: string; completeness: "COMPLETE" | "INCOMPLETE"; missingRequiredFields: readonly string[] }
export interface CitationStyleConfiguration { style: typeof CITATION_STYLES[number]; styleVersion: string; locale: string }
export interface VariableDefinition { symbol: string; meaning: string; unit?: string }
export interface ScientificNotation { notation: "INLINE" | "DISPLAY"; latexSource: string; equationId: string; equationNumber?: string; variables: readonly VariableDefinition[]; units?: readonly string[]; assumptions: readonly string[]; derivationOrSourceNote?: string; crossReferenceTargets: readonly string[] }
export type SemanticNode =
  | { id: string; type: "HEADING"; level: number; text: string }
  | { id: string; type: "SECTION"; title: string; childNodeIds: readonly string[] }
  | { id: string; type: "PARAGRAPH" | "RESEARCHER_NOTE"; text: string }
  | { id: string; type: "CLAIM"; text: string; sourceSnapshotIds: readonly string[]; supportState: "SUPPORTED" | "UNSUPPORTED" }
  | { id: string; type: "QUOTATION"; text: string; citationId: string; locator: string }
  | { id: string; type: "CITATION_REFERENCE"; citationId: string }
  | { id: string; type: "FOOTNOTE"; text: string; marker: string }
  | ({ id: string; type: "EQUATION" } & ScientificNotation)
  | { id: string; type: "FIGURE"; caption: string; altText: string; assetId: string; sourceAttribution: string; lineage: readonly SourceLineage[] }
  | { id: string; type: "TABLE"; caption: string; altText: string; dataId: string; columns: readonly string[]; rows: readonly (readonly string[])[]; sourceAttribution: string; lineage: readonly SourceLineage[] }
  | { id: string; type: "APPENDIX"; title: string; childNodeIds: readonly string[] };
export interface SemanticDocument { documentId: string; schemaVersion: "studio-author-semantic/v1"; title: string; nodeOrder: readonly string[]; nodes: readonly SemanticNode[]; citations: readonly CitationMetadata[]; citationStyle: CitationStyleConfiguration }

export interface ArtifactIdentity { artifactId: string; investigationId: string; authorPrincipalId: string; profile: ArtifactProfile; profileCapability: "ADMITTED_UNVERIFIED" | "VERIFIED_AVAILABLE"; lifecycleClassification: "CANDIDATE_KNOWLEDGE"; createdAt: string; currentSavedRevisionId?: string; workingDraft: { state: "UNSAVED"; basedOnRevisionId?: string } }
export interface AuthorRevision { artifactId: string; revisionId: string; revisionNumber: number; parentRevisionId?: string; semanticContent: SemanticDocument; contentHash: string; sourceSnapshots: readonly { snapshotId: string; snapshotHash: string }[]; profile: ArtifactProfile; profileVersion: string; createdAt: string; authorPrincipalId: string; immutableStatus: "IMMUTABLE_SAVED_REVISION" }

export interface SensitiveSourceDirectives { includeInAnalysis: boolean; includeInArtifact: boolean; citePublicly: boolean; anonymize: boolean; restrictedAppendix: boolean; excludeFromAiProcessing: boolean }
export interface CapturedSourceRepresentation { representationId: string; mediaType: string; schemaVersion: string; content: string; contentHash: string }
export interface FrozenResearchSourceSnapshot { snapshotId: string; investigationId: string; capturedAt: string; selectionScope: "ENTIRE_RESEARCH_INBOX" | "EXPLICIT_SELECTION"; selectedAnchorIds: readonly string[]; inboxMembershipBasis: "COMPLETE_ELIGIBLE_INBOX_INDEPENDENT_OF_UI" | "EXPLICIT_STABLE_IDENTITIES"; sources: readonly { anchorId: string; classification: "CANONICAL" | "CANDIDATE" | "EXPERIMENTAL" | "EXTERNAL"; availability: "AVAILABLE" | "UNAVAILABLE" | "REDACTED"; provenance: string; sensitivity: SensitiveSourceDirectives; representations: readonly CapturedSourceRepresentation[] }[]; snapshotHash: string; immutableStatus: "FROZEN" }

export interface ProposalOperation { operation: "INSERT_AFTER" | "REPLACE" | "DELETE"; targetNodeId?: string; proposedNode?: SemanticNode }
export interface AiDraftProposal { proposalId: string; artifactId: string; baseRevisionId: string; baseContentHash: string; sourceSnapshots: readonly { snapshotId: string; snapshotHash: string }[]; assistanceMode: typeof ASSISTANCE_MODES[number]; providerProvenance: { providerId: string; modelId: string; modelVersion?: string; configurationHash: string; promptContractVersion: string }; units: readonly { proposalUnitId: string; operation: ProposalOperation; state: "UNAPPLIED"; disposition: "PENDING" | "ACCEPTED" | "REJECTED" }[]; authorityState: "UNAPPLIED_PROPOSAL"; staleBase: { rejected: boolean; reason?: string }; unsupportedClaimFindings: readonly string[]; incompleteCitationFindings: readonly string[] }

export interface ChildProjection { projectionId: string; parentArtifactId: string; parentRevisionId: string; parentContentHash: string; format: typeof PROJECTION_FORMATS[number]; state: typeof PROJECTION_STATES[number]; templateProfileVersion: string; rendererVersion: string; configurationHash: string; outputHash?: string; priorSuccessfulProjectionId?: string; failure?: { code: string; safeMessage: string }; publication?: { publicationId: string; status: "PUBLISHED" | "RETRACTED" } }
export interface StudioAuthorityBoundary { authoritativeSource: "AUTHOR_REVISION"; aiResponseAuthority: "PROHIBITED"; projectionAuthority: "PROHIBITED"; prohibitedMutations: typeof PROHIBITED_STUDIO_MUTATIONS }

export interface IntentionResultReference { resultId: string; executionId: string; projectionId: string; resultHash: string; completionStatus: "COMPLETED"; immutableStatus: "IMMUTABLE"; access: "READ_ONLY" }
export interface GovernedConclusion { conclusion: typeof GOVERNED_CONCLUSIONS[number]; evidenceScope: readonly string[]; assumptions: readonly string[]; unresolvedAlternatives: readonly string[]; declaredTest?: string }
export interface InferenceStatement { id: string; text: string; authorship: "RESEARCHER" | "AI"; epistemicClass: "ABDUCTIVE" }
export interface InferencePackage { inferenceSessionId: string; inferencePackageId: string; invocationOwner: "STUDIO"; intentionCapabilities: { mutation: "PROHIBITED"; testConfiguration: "PROHIBITED"; execution: "PROHIBITED"; navigation: "PROHIBITED"; directInvocation: "PROHIBITED" }; intentionResults: readonly IntentionResultReference[]; h0: InferenceStatement; alternatives: readonly (InferenceStatement & { hypothesisId: "H1" | `H1${string}` })[]; observations: readonly { id: string; text: string; epistemicClass: "DETERMINISTIC_MEASUREMENT"; resultId: string }[]; mathematicalWarrants: readonly InferenceStatement[]; assumptions: readonly InferenceStatement[]; supportingEvidence: readonly InferenceStatement[]; counterevidence: readonly InferenceStatement[]; alternativeExplanations: readonly InferenceStatement[]; predictions: readonly InferenceStatement[]; falsifiers: readonly InferenceStatement[]; unresolvedUncertainties: readonly InferenceStatement[]; outputClassification: readonly ["ABDUCTIVE", "CANDIDATE"]; proposalState: "UNAPPLIED" | "PARTIALLY_ACCEPTED" | "ACCEPTED" | "REJECTED"; governedConclusion: GovernedConclusion }
