import type { Investigation } from "../../investigation/investigationTypes";
import type { KnowledgeObject } from "../../knowledge/model/KnowledgeObject";
import type { CanonicalSimilarityCandidateEvaluation } from "../../resolve/evaluation/CanonicalSimilarityCandidateEvaluationTypes";
import type { CanonicalKnowledgeFeatureSet } from "../../resolve/features/CanonicalKnowledgeFeatureTypes";
import type { ResolveCandidateDimensionIntelligence } from "../../resolve/intelligence/ResolveCandidateIntelligenceTypes";
import type { WorkspaceSelection } from "../../workspace/runtime/WorkspaceRuntimeTypes";
import type { ComparePairProjectionReady } from "../../compare/projection/ComparePairProjectionTypes";

export const NarrativeWorkspaceProjectionStatus = { READY: "READY", NO_INVESTIGATION: "NO_INVESTIGATION", NO_FOCUSED_EVENT: "NO_FOCUSED_EVENT", NO_COMPARISON: "NO_COMPARISON", STALE_SELECTION: "STALE_SELECTION", UNAVAILABLE: "UNAVAILABLE" } as const;
export type NarrativeWorkspaceProjectionStatus = (typeof NarrativeWorkspaceProjectionStatus)[keyof typeof NarrativeWorkspaceProjectionStatus];

export interface NarrativeWorkspaceProjectionInput {
  readonly investigation: Investigation | undefined;
  readonly knowledgeObjects: readonly KnowledgeObject[];
  readonly selection: WorkspaceSelection | undefined;
  readonly candidateEvaluations: readonly CanonicalSimilarityCandidateEvaluation[];
}
export interface NarrativeUnavailableValue { readonly availability: "UNAVAILABLE"; readonly reason: string; }
export interface NarrativeAvailableValue<T> { readonly availability: "AVAILABLE"; readonly value: T; }
export type NarrativeAvailability<T> = NarrativeAvailableValue<T> | NarrativeUnavailableValue;

export interface SystemCanonNarrativeProjection {
  readonly canonicalEventId: string;
  readonly knowledgeObjectId: string;
  readonly title: string;
  readonly materialClassification: "System Canon narrative";
  readonly paragraphs: readonly string[];
}
export interface NarrativeCandidateIdentity {
  readonly candidateId: string;
  readonly evaluationId: string;
  readonly leftKnowledgeObjectId: string;
  readonly rightKnowledgeObjectId: string;
}
export interface NarrativeSecondaryExactComparison {
  readonly classification: "SECONDARY_EXACT_CANONICAL_SET_COMPARISON";
  readonly sharedSemanticTraits: readonly string[];
  readonly focusedOnlySemanticTraits: readonly string[];
  readonly comparedOnlySemanticTraits: readonly string[];
  readonly sharedFacilityTypes: NarrativeAvailability<readonly string[]>;
  readonly focusedOnlyFacilityTypes: NarrativeAvailability<readonly string[]>;
  readonly comparedOnlyFacilityTypes: NarrativeAvailability<readonly string[]>;
}
export interface NarrativeNormalizedCenterProjection {
  readonly focusedProfile: CanonicalKnowledgeFeatureSet;
  readonly comparedProfile: CanonicalKnowledgeFeatureSet;
  readonly resolveDimensions: readonly ResolveCandidateDimensionIntelligence[];
  readonly secondaryExactComparison: NarrativeSecondaryExactComparison;
}
export interface NarrativeUnsupportedInformation {
  readonly sourceCitation: NarrativeUnavailableValue;
  readonly sourceDocumentIdentity: NarrativeUnavailableValue;
  readonly narrativeAuthorship: NarrativeUnavailableValue;
  readonly perParagraphProvenance: NarrativeUnavailableValue;
  readonly modeledIncidentDateOrTemporalRange: NarrativeUnavailableValue;
  readonly proseLevelContradictionAnalysis: NarrativeUnavailableValue;
  readonly proseLevelOmissionAnalysis: NarrativeUnavailableValue;
  readonly semanticParaphraseCorrespondence: NarrativeUnavailableValue;
  readonly sentenceOrClauseAlignment: NarrativeUnavailableValue;
  readonly narrativeEvolution: NarrativeUnavailableValue;
}
export interface NarrativeWorkspaceReadyProjection {
  readonly status: typeof NarrativeWorkspaceProjectionStatus.READY;
  readonly investigationId: string;
  readonly currentRevisionId: string;
  readonly candidate: NarrativeCandidateIdentity;
  readonly comparePair: ComparePairProjectionReady;
  readonly focusedNarrative: SystemCanonNarrativeProjection;
  readonly normalizedCenter: NarrativeNormalizedCenterProjection;
  readonly comparedNarrative: SystemCanonNarrativeProjection;
  readonly unsupported: NarrativeUnsupportedInformation;
}
export interface NarrativeWorkspaceNoInvestigationProjection { readonly status: typeof NarrativeWorkspaceProjectionStatus.NO_INVESTIGATION; }
export interface NarrativeWorkspaceNoFocusedEventProjection { readonly status: typeof NarrativeWorkspaceProjectionStatus.NO_FOCUSED_EVENT; readonly investigationId: string; }
export interface NarrativeWorkspaceNoComparisonProjection { readonly status: typeof NarrativeWorkspaceProjectionStatus.NO_COMPARISON; readonly investigationId: string; readonly focusedEventId: string; }
export interface NarrativeWorkspaceStaleSelectionProjection { readonly status: typeof NarrativeWorkspaceProjectionStatus.STALE_SELECTION; readonly investigationId: string; readonly focusedEventId: string; readonly reason: string; }
export interface NarrativeWorkspaceUnavailableProjection { readonly status: typeof NarrativeWorkspaceProjectionStatus.UNAVAILABLE; readonly investigationId?: string; readonly focusedEventId?: string; readonly reason: string; }
export type NarrativeWorkspaceProjection = NarrativeWorkspaceReadyProjection | NarrativeWorkspaceNoInvestigationProjection | NarrativeWorkspaceNoFocusedEventProjection | NarrativeWorkspaceNoComparisonProjection | NarrativeWorkspaceStaleSelectionProjection | NarrativeWorkspaceUnavailableProjection;
