import type { ArmedLayer, LayersExperimentExecutionInput, LayersExperimentUnavailableInput } from "../runtime/LayersExperimentRuntimeTypes";
import type { CanonicalSimilarityCandidateEvaluation } from "../../resolve/evaluation/CanonicalSimilarityCandidateEvaluationTypes";
import type { CanonicalFeatureDimension } from "../../resolve/features/CanonicalKnowledgeFeatureTypes";
import type { CanonicalKnowledgeSimilarityPair } from "../../resolve/similarity/CanonicalKnowledgeSimilarityMatrixTypes";

export const LayersPairAvailability = { AVAILABLE: "AVAILABLE", UNAVAILABLE: "UNAVAILABLE" } as const;
export type LayersPairAvailability = (typeof LayersPairAvailability)[keyof typeof LayersPairAvailability];

export const LayersOperationalMappingStatus = { MAPPED: "MAPPED", UNAVAILABLE: "UNAVAILABLE" } as const;
export type LayersOperationalMappingStatus = (typeof LayersOperationalMappingStatus)[keyof typeof LayersOperationalMappingStatus];

export const LayersPairDeltaState = {
  FORMED: "FORMED", RETAINED: "RETAINED", STRENGTHENED: "STRENGTHENED",
  WEAKENED: "WEAKENED", DISSOLVED: "DISSOLVED", UNAVAILABLE: "UNAVAILABLE", UNCHANGED: "UNCHANGED",
} as const;
export type LayersPairDeltaState = (typeof LayersPairDeltaState)[keyof typeof LayersPairDeltaState];

export interface LayersExperimentalPairProjectionInput {
  executionId: string;
  laboratoryInput: LayersExperimentExecutionInput;
  investigationId: string;
  sourceKnowledgeObjectId: string;
  targetKnowledgeObjectId: string;
  pair: CanonicalKnowledgeSimilarityPair;
  evaluation: CanonicalSimilarityCandidateEvaluation;
  baselineLayers: readonly ArmedLayer[];
  experimentalLayers: readonly ArmedLayer[];
}

export interface LayersSubjectNodeProjection {
  kind: "SUBJECT_NODE";
  knowledgeObjectId: string;
}

export interface LayersLayerContribution {
  layerId: string;
  classification: ArmedLayer["classification"];
  operationalMappingStatus: LayersOperationalMappingStatus;
  canonicalDimension?: CanonicalFeatureDimension;
  availability: LayersPairAvailability;
  similarity?: number;
  canonicalWeight?: number;
  participatingWeight: number;
  weightedContribution: number;
  unavailableReason?: string;
  sourceEvaluationId: string;
}

export interface LayersPairRelationshipAvailable {
  availability: "AVAILABLE";
  score: number;
  participatingWeight: number;
  participatingLayers: readonly string[];
}
export interface LayersPairRelationshipUnavailable { availability: "UNAVAILABLE"; reason: string; participatingLayers: readonly string[]; }
export type LayersPairRelationship = LayersPairRelationshipAvailable | LayersPairRelationshipUnavailable;

export interface LayersPairRelationshipProjection {
  sourceKnowledgeObjectId: string;
  targetKnowledgeObjectId: string;
  relationship: LayersPairRelationship;
  contributions: readonly LayersLayerContribution[];
}

export interface LayersPairDelta {
  state: LayersPairDeltaState;
  baselineScore?: number;
  experimentalScore?: number;
  scoreDelta?: number;
}

export interface LayersExperimentalPairProjectionProvenance {
  governingEquation: "M = g(L,T,S)";
  executionId: string;
  investigationId: string;
  pairId: string;
  candidateId: string;
  evaluationId: string;
  baselineLayerIds: readonly string[];
  experimentalLayerIds: readonly string[];
  participatingLayerIds: readonly string[];
  unavailableLayerIds: readonly string[];
  canonicalRepresentation: string;
}

export interface LayersExperimentalPairProjection {
  kind: "LAYERS_EXPERIMENTAL_PAIR_PROJECTION";
  projectionId: string;
  investigationId: string;
  executionId: string;
  pairId: string;
  candidateId: string;
  evaluationId: string;
  subjects: readonly [LayersSubjectNodeProjection, LayersSubjectNodeProjection];
  baseline: LayersPairRelationshipProjection;
  experimental: LayersPairRelationshipProjection;
  layerContributions: readonly LayersLayerContribution[];
  unavailableInputs: readonly LayersExperimentUnavailableInput[];
  delta: LayersPairDelta;
  provenance: LayersExperimentalPairProjectionProvenance;
  createsCanonicalKnowledgeRelationship: false;
}
