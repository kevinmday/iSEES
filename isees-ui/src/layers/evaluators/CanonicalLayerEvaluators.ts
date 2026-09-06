import { CanonicalFeatureDimension } from "../../resolve/features/CanonicalKnowledgeFeatureTypes.ts";
import { DEFAULT_CANONICAL_SIMILARITY_WEIGHTS } from "../../resolve/similarity/CanonicalKnowledgeSimilarityTypes.ts";
import type { CanonicalDimensionSimilarity } from "../../resolve/similarity/CanonicalKnowledgeSimilarityTypes.ts";
import type { CanonicalLayerEvaluation, CanonicalLayerEvaluatorInput, CanonicalLayerEvaluatorRegistration } from "./CanonicalLayerEvaluatorTypes.ts";

const weights: Readonly<Record<CanonicalFeatureDimension, number>> = Object.freeze({
  NARRATIVE: DEFAULT_CANONICAL_SIMILARITY_WEIGHTS.narrative,
  OBSERVABILITY: DEFAULT_CANONICAL_SIMILARITY_WEIGHTS.observability,
  INFRASTRUCTURE: DEFAULT_CANONICAL_SIMILARITY_WEIGHTS.infrastructure,
  TOPOLOGY: DEFAULT_CANONICAL_SIMILARITY_WEIGHTS.topology,
  GEOGRAPHY: DEFAULT_CANONICAL_SIMILARITY_WEIGHTS.geography,
});

function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as object).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function dimensionEvidence(input: CanonicalLayerEvaluatorInput, dimension: CanonicalFeatureDimension): CanonicalDimensionSimilarity {
  const found = input.evaluation.explanation.dimensions.find(item => item.dimension === dimension);
  if (!found || found.source.dimension !== dimension) throw new Error(`Canonical ${dimension} dimension evidence is missing or malformed.`);
  return found.source;
}

function registration(layerId: string, requiredCanonicalDimension: CanonicalFeatureDimension): CanonicalLayerEvaluatorRegistration {
  const evaluatorKey = layerId;
  const evaluatorVersion = "canonical-similarity/v1";
  const evaluate = (input: CanonicalLayerEvaluatorInput): CanonicalLayerEvaluation => {
    const evidence = dimensionEvidence(input, requiredCanonicalDimension);
    const identity = input.evaluation.identity;
    const lineage = freeze({
      evaluationId: identity.evaluationId,
      candidateId: identity.candidateId,
      sourceKnowledgeObjectIds: [identity.leftKnowledgeObjectId, identity.rightKnowledgeObjectId] as [string, string],
      canonicalDimension: requiredCanonicalDimension,
    });
    return evidence.availability === "UNAVAILABLE"
      ? freeze({ layerId, evaluatorKey, evaluatorVersion, canonicalDimension: requiredCanonicalDimension, availability: "UNAVAILABLE", reason: evidence.reason, missingCanonicalInput: requiredCanonicalDimension, lineage })
      : freeze({ layerId, evaluatorKey, evaluatorVersion, canonicalDimension: requiredCanonicalDimension, availability: "AVAILABLE", similarity: evidence.similarity, canonicalWeight: weights[requiredCanonicalDimension], lineage });
  };
  return freeze({ layerId, evaluatorKey, evaluatorVersion, requiredCanonicalDimension, acceptedInputContract: "CANONICAL_SIMILARITY_CANDIDATE_EVALUATION", outputContract: "CANONICAL_LAYER_EVALUATION", evaluate });
}

export const CanonicalLayerEvaluatorRegistrations = freeze([
  registration("OBSERVABILITY", CanonicalFeatureDimension.OBSERVABILITY),
  registration("NARRATIVE", CanonicalFeatureDimension.NARRATIVE),
  registration("GEOGRAPHY", CanonicalFeatureDimension.GEOGRAPHY),
  registration("INFRASTRUCTURE", CanonicalFeatureDimension.INFRASTRUCTURE),
] as const);
