import type { ResearchDeskEntry } from "../../research/researchBridgeTypes";
import type { ComputationalAuthorDocument } from "../../author/model/AuthorDocument";

export const STUDIO_DRAFTING_CONTEXT_VERSION = "studio-drafting-context/v1" as const;
export const STUDIO_DRAFTING_REQUEST_VERSION = "studio-drafting-request/v1" as const;
export const STUDIO_DRAFT_PROPOSAL_VERSION = "studio-draft-proposal/v1" as const;

export const STUDIO_DRAFTING_LIMITS = Object.freeze({
  maxSources: 64, maxSourceBytes: 128_000, maxContextBytes: 1_000_000,
  maxNotes: 64, maxNoteBytes: 32_000, maxInstructionChars: 8_000,
  maxProposalBlocks: 64, maxGeneratedTextBytes: 256_000,
});

export type DraftingSelectionMode = "ALL" | "SUBSET";
export interface DraftingBaseIdentity { documentRuntimeRevision: number; artifactId: string | null; artifactVersionId: string | null; artifactRevision: number | null }
export interface DraftingArtifactDesign { designId: string; designVersion: string }
export interface DraftingContextSource { anchorId: string; investigationId: string; sourceWorkspace: string; sourceIdentity: string; sourceKind: string; classification: "CANONICAL" | "RESEARCHER_GENERATED"; insertionState: "INSERTABLE"; insertionReason: string; displayTitle: string; displaySummary: string; sourceRevisionId: string | null; sourceExecutionId: string | null; sourceProjectionId: string | null; graphIdentity: string | null; graphRevision: number | null; captureSchemaVersion: string; captureMediaType: string; capturedRepresentation: unknown; collectedAt: string; createdAt: string; immutableSourceHash: string }
export interface DraftingResearcherNote { nodeId: string; nodeType: string; section: string | null; text: string; documentOrder: number }
export interface DraftingExcludedSource { anchorId: string; reason: "CROSS_INVESTIGATION" | "INSPECTION_ONLY" | "UNDETERMINED" }
export interface StudioDraftingContext { contextContractVersion: typeof STUDIO_DRAFTING_CONTEXT_VERSION; investigationId: string; documentId: string; baseIdentity: DraftingBaseIdentity; sourceSelectionMode: DraftingSelectionMode; selectedSourceAnchorIds: string[]; selectedResearcherNoteNodeIds: string[]; artifactDesign: DraftingArtifactDesign; draftingInstruction: string; sources: DraftingContextSource[]; researcherNotes: DraftingResearcherNote[]; excludedSources: DraftingExcludedSource[] }
export interface StudioDraftingRequest { requestContractVersion: typeof STUDIO_DRAFTING_REQUEST_VERSION; investigationId: string; principalId: string; contextHash: string; context: StudioDraftingContext }
export interface StudioDraftProposalBlock { blockId: string; blockType: "PARAGRAPH" | "HEADING" | "QUOTE" | "LIST" | "CITATION" | "OBSERVATION"; text: string; section: string | null; sourceReferences: Array<{ anchorId: string; relationship: "SUPPORTS" | "CONTRADICTS" | "CONTEXT_ONLY" | "REQUIRES_RESOLUTION" }> }
export interface StudioDraftProposal { proposalId: string; proposalContractVersion: typeof STUDIO_DRAFT_PROPOSAL_VERSION; contextContractVersion: typeof STUDIO_DRAFTING_CONTEXT_VERSION; investigationId: string; documentId: string; baseIdentity: DraftingBaseIdentity; contextHash: string; artifactDesign: DraftingArtifactDesign; providerId: string; modelId: string; outcome: "GENERATED"; blocks: StudioDraftProposalBlock[]; warnings: string[]; unsupportedClaimDisclosures: string[]; contradictionDisclosures: string[]; uncertaintyDisclosures: string[]; generatedAt: string }
export interface AssembleStudioDraftingContextInput { investigationId: string; document: ComputationalAuthorDocument; documentRuntimeRevision: number; durableBase?: { artifactId: string; artifactVersionId: string; artifactRevision: number }; sourceSelectionMode?: DraftingSelectionMode; selectedSourceAnchorIds: readonly string[]; selectedResearcherNoteNodeIds: readonly string[]; researchProjection: { status: string; investigationId?: string; entries: readonly ResearchDeskEntry[] }; artifactDesign: DraftingArtifactDesign; draftingInstruction: string }
export interface AssembledStudioDraftingContext { context: StudioDraftingContext; canonicalContext: string; contextHash: string }

export class StudioDraftingValidationError extends Error {
  readonly code: string;
  constructor(code: string, message: string) { super(message); this.code = code; }
}
