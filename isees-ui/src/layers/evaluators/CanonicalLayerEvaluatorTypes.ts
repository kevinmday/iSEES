import type { CanonicalSimilarityCandidateEvaluation } from "../../resolve/evaluation/CanonicalSimilarityCandidateEvaluationTypes.ts";
import type { CanonicalFeatureDimension } from "../../resolve/features/CanonicalKnowledgeFeatureTypes.ts";

export const CanonicalLayerEvaluationAvailability = { AVAILABLE: "AVAILABLE", UNAVAILABLE: "UNAVAILABLE" } as const;

export interface CanonicalLayerEvaluatorInput {
  readonly evaluation: CanonicalSimilarityCandidateEvaluation;
}

export interface CanonicalLayerEvaluationLineage {
  readonly evaluationId: string;
  readonly candidateId: string;
  readonly sourceKnowledgeObjectIds: readonly [string, string];
  readonly canonicalDimension: CanonicalFeatureDimension;
}

interface CanonicalLayerEvaluationBase {
  readonly layerId: string;
  readonly evaluatorKey: string;
  readonly evaluatorVersion: string;
  readonly canonicalDimension: CanonicalFeatureDimension;
  readonly lineage: CanonicalLayerEvaluationLineage;
}

export interface AvailableCanonicalLayerEvaluation extends CanonicalLayerEvaluationBase {
  readonly availability: "AVAILABLE";
  readonly similarity: number;
  readonly canonicalWeight: number;
}

export interface UnavailableCanonicalLayerEvaluation extends CanonicalLayerEvaluationBase {
  readonly availability: "UNAVAILABLE";
  readonly reason: string;
  readonly missingCanonicalInput: CanonicalFeatureDimension;
}

export type CanonicalLayerEvaluation = AvailableCanonicalLayerEvaluation | UnavailableCanonicalLayerEvaluation;

export interface CanonicalLayerEvaluatorRegistration {
  readonly layerId: string;
  readonly evaluatorKey: string;
  readonly evaluatorVersion: string;
  readonly requiredCanonicalDimension: CanonicalFeatureDimension;
  readonly acceptedInputContract: "CANONICAL_SIMILARITY_CANDIDATE_EVALUATION";
  readonly outputContract: "CANONICAL_LAYER_EVALUATION";
  readonly evaluate: (input: CanonicalLayerEvaluatorInput) => CanonicalLayerEvaluation;
}

export interface CanonicalLayerEvaluatorRegistryValidation {
  readonly valid: true;
  readonly registeredLayerIds: readonly string[];
}
