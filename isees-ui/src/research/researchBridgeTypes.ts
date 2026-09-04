import type { ResolveCandidateAggregateIntelligence, ResolveCandidateDimensionIntelligence } from "../resolve/intelligence/ResolveCandidateIntelligenceTypes";
import type { LayersExperimentalPairProjection } from "../layers/projection";

export const RESEARCH_ANCHOR_SCHEMA_VERSION = "research-anchor/v2" as const;
export const ResearchAnchorType = { NODE: "NODE", EDGE: "EDGE", CANDIDATE: "CANDIDATE", EXPERIMENT: "EXPERIMENT" } as const;
export type ResearchAnchorType = typeof ResearchAnchorType[keyof typeof ResearchAnchorType];
export const ResearchAnchorKind = {
  GRAPH: "GRAPH", COMPARE_CANDIDATE: "COMPARE_CANDIDATE", LAYERS_EXPERIMENT: "LAYERS_EXPERIMENT",
  EVIDENCE_RECORD: "EVIDENCE_RECORD", MEDIA: "MEDIA", NARRATIVE_PASSAGE: "NARRATIVE_PASSAGE",
  TIMELINE_MOMENT: "TIMELINE_MOMENT", TIMELINE_CORRESPONDENCE: "TIMELINE_CORRESPONDENCE",
  INTENTION_DERIVATION: "INTENTION_DERIVATION", INTENTION_HYPOTHESIS: "INTENTION_HYPOTHESIS",
} as const;
export type ResearchAnchorKind = typeof ResearchAnchorKind[keyof typeof ResearchAnchorKind];
export type ResearchSourceWorkspace = "MANIFOLD" | "COMPARE" | "LAYERS" | "EVIDENCE" | "MEDIA" | "NARRATIVE" | "TIMELINE" | "INTENTION";
export type ResearchSourceClassification = "CANONICAL" | "RESEARCHER_GENERATED" | "UNDETERMINED";
export type ResearchInsertability = Readonly<{ state: "INSERTABLE" | "INSPECTION_ONLY"; reason: string }>;
export type ResearchDisplayProjection = Readonly<{ title: string; summary: string }>;
export type FrozenCapturedRepresentation = Readonly<{ schemaVersion: string; mediaType: string; value: unknown }>;

interface ResearchAnchorBase<K extends ResearchAnchorKind> {
  readonly schemaVersion: typeof RESEARCH_ANCHOR_SCHEMA_VERSION; readonly kind: K;
  readonly anchorId: string; readonly investigationId: string; readonly sourceWorkspace: ResearchSourceWorkspace;
  readonly sourceIdentity: string; readonly collectedAt: Date; readonly createdAt: Date;
  readonly classification: ResearchSourceClassification; readonly sourceRevisionId?: string;
  readonly sourceExecutionId?: string; readonly sourceProjectionId?: string;
  readonly display: ResearchDisplayProjection; readonly insertability: ResearchInsertability;
  readonly capturedRepresentation: FrozenCapturedRepresentation; readonly notes?: string; readonly pinned: boolean;
}
export interface GraphReference { type: "NODE" | "EDGE"; id: string }
export interface ResearchGraphAnchor extends ResearchAnchorBase<"GRAPH"> { readonly graph: GraphReference; readonly graphRevision: number }
export interface ResearchCandidateAnchor extends ResearchAnchorBase<"COMPARE_CANDIDATE"> {
  readonly candidate: Readonly<{ type: "CANDIDATE"; candidateId: string; evaluationId: string; leftKnowledgeObjectId: string; rightKnowledgeObjectId: string; focusedEventId: string; focusedEventKnowledgeObjectId: string; comparisonEventId: string; comparisonEventKnowledgeObjectId: string; resolveExecutionId?: string; epistemicStatus: string; aggregate: ResolveCandidateAggregateIntelligence; dimensions: readonly ResolveCandidateDimensionIntelligence[]; source: "COMPARE_PAIR_INSPECTION" }>;
}
export interface ResearchExperimentAnchor extends ResearchAnchorBase<"LAYERS_EXPERIMENT"> { readonly experiment: Readonly<{ type: "EXPERIMENT"; caseAEventId: string; caseBEventId: string; projection: LayersExperimentalPairProjection; source: "LAYERS_EXPERIMENTAL_LABORATORY" }> }
export type TypedSourcePayload = Readonly<{ identity: string; representation: unknown }>;
export interface ResearchEvidenceAnchor extends ResearchAnchorBase<"EVIDENCE_RECORD"> { readonly evidence: TypedSourcePayload }
export interface ResearchMediaAnchor extends ResearchAnchorBase<"MEDIA"> { readonly media: TypedSourcePayload }
export interface ResearchNarrativePassageAnchor extends ResearchAnchorBase<"NARRATIVE_PASSAGE"> { readonly passage: TypedSourcePayload }
export interface ResearchTimelineMomentAnchor extends ResearchAnchorBase<"TIMELINE_MOMENT"> { readonly moment: TypedSourcePayload }
export interface ResearchTimelineCorrespondenceAnchor extends ResearchAnchorBase<"TIMELINE_CORRESPONDENCE"> { readonly correspondence: TypedSourcePayload }
export interface ResearchIntentionDerivationAnchor extends ResearchAnchorBase<"INTENTION_DERIVATION"> { readonly derivation: TypedSourcePayload }
export interface ResearchIntentionHypothesisAnchor extends ResearchAnchorBase<"INTENTION_HYPOTHESIS"> { readonly hypothesis: TypedSourcePayload }
export type ResearchAnchor = ResearchGraphAnchor | ResearchCandidateAnchor | ResearchExperimentAnchor | ResearchEvidenceAnchor | ResearchMediaAnchor | ResearchNarrativePassageAnchor | ResearchTimelineMomentAnchor | ResearchTimelineCorrespondenceAnchor | ResearchIntentionDerivationAnchor | ResearchIntentionHypothesisAnchor;
export interface ResearchDeskEntry { anchor: ResearchAnchor; order: number }
export interface ResearchDesk { entries: ResearchDeskEntry[] }
export interface ResearchBridgeRequest { graph: GraphReference; investigationId: string; graphRevision: number }
export interface ResearchInboxQuery { readonly investigationId?: string; readonly selectedAnchorId?: string; readonly searchQuery?: string; readonly sourceWorkspace?: ResearchSourceWorkspace; readonly sourceKind?: ResearchAnchorKind; readonly insertableOnly?: boolean; readonly pinnedFirst?: boolean }
export interface ResearchInboxProjection { readonly status: "AVAILABLE" | "NO_ACTIVE_INVESTIGATION"; readonly investigationId?: string; readonly entries: readonly ResearchDeskEntry[]; readonly selectedAnchorId?: string }
