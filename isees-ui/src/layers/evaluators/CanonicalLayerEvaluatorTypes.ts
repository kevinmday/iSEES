import type { CanonicalSimilarityCandidateEvaluation } from "../../resolve/evaluation/CanonicalSimilarityCandidateEvaluationTypes.ts";
import type { CanonicalFeatureDimension } from "../../resolve/features/CanonicalKnowledgeFeatureTypes.ts";
import type { CanonicalLayerEvaluatorInputProjection } from "./CanonicalLayerEvaluatorInputProjection.ts";

export const CanonicalLayerEvaluationAvailability = { AVAILABLE: "AVAILABLE", UNAVAILABLE: "UNAVAILABLE" } as const;

export interface CanonicalLayerEvaluatorInput {
  readonly evaluation: CanonicalSimilarityCandidateEvaluation;
  readonly inputProjection: CanonicalLayerEvaluatorInputProjection;
}

export interface CanonicalLayerEvaluationLineage {
  readonly evaluationId: string;
  readonly candidateId: string;
  readonly sourceKnowledgeObjectIds: readonly [string, string];
  readonly canonicalDimension: CanonicalFeatureDimension;
}

export interface CanonicalLayerInputLineageIdentity {
  readonly inputIdentity: string;
  readonly sourceIdentity: string;
  readonly sourceVersion?: string;
  readonly sourceRevision?: string;
}

export interface CanonicalLayerMissingInputIdentity {
  readonly inputIdentity: string;
  readonly subjectKnowledgeObjectId?: string;
}

export interface CanonicalLayerNormalizationIdentity {
  readonly normalizationKey: string;
  readonly normalizationVersion: string;
}

interface CanonicalLayerEvaluationBase {
  readonly layerId: string;
  readonly evaluatorKey: string;
  readonly evaluatorVersion: string;
  readonly canonicalDimension: CanonicalFeatureDimension;
  readonly lineage: CanonicalLayerEvaluationLineage;
  readonly availableInputLineage?: readonly CanonicalLayerInputLineageIdentity[];
}

export interface AvailableCanonicalLayerEvaluation extends CanonicalLayerEvaluationBase {
  readonly availability: "AVAILABLE";
  readonly similarity: number;
  readonly canonicalWeight: number;
  readonly rawLeftSubjectComponents?: Readonly<Record<string, unknown>>;
  readonly rawRightSubjectComponents?: Readonly<Record<string, unknown>>;
  readonly normalization?: CanonicalLayerNormalizationIdentity;
  readonly normalizedResult?: number;
}

export interface UnavailableCanonicalLayerEvaluation extends CanonicalLayerEvaluationBase {
  readonly availability: "UNAVAILABLE";
  readonly reason: string;
  readonly missingCanonicalInput: CanonicalFeatureDimension;
  readonly missingInputs?: readonly CanonicalLayerMissingInputIdentity[];
}

export type CanonicalLayerEvaluation = AvailableCanonicalLayerEvaluation | UnavailableCanonicalLayerEvaluation;

export interface CanonicalLayerEvaluatorRegistration {
  readonly layerId: string;
  readonly evaluatorKey: string;
  readonly evaluatorVersion: string;
  readonly requiredCanonicalDimension: CanonicalFeatureDimension;
  readonly acceptedInputContract: "FROZEN_CANONICAL_LAYER_EVALUATOR_INPUT_PROJECTION";
  readonly outputContract: "CANONICAL_LAYER_EVALUATION";
  readonly evaluate: (input: CanonicalLayerEvaluatorInput) => CanonicalLayerEvaluation;
}

export interface CanonicalLayerEvaluatorRegistryValidation {
  readonly valid: true;
  readonly registeredLayerIds: readonly string[];
}
