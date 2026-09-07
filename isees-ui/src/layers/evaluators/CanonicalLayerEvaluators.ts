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
  const identity=input.evaluation.identity;
  const projection=input.inputProjection;
  const endpointIds=projection.endpoints.map(value=>value.knowledgeObjectId).sort();
  if(projection.candidateId!==identity.candidateId||projection.evaluationId!==identity.evaluationId||endpointIds[0]!==identity.leftKnowledgeObjectId||endpointIds[1]!==identity.rightKnowledgeObjectId) throw new Error("Frozen evaluator input ownership does not match the canonical evaluation.");
  const found = input.evaluation.explanation.dimensions.find(item => item.dimension === dimension);
  if (!found || found.source.dimension !== dimension) throw new Error(`Canonical ${dimension} dimension evidence is missing or malformed.`);
  return found.source;
}

function projectedComponents(input: CanonicalLayerEvaluatorInput, dimension: CanonicalFeatureDimension) {
  const select=(knowledgeObjectId:string)=>{
    const endpoint=input.inputProjection.endpoints.find(value=>value.knowledgeObjectId===knowledgeObjectId);
    if(!endpoint) throw new Error(`Frozen evaluator input is missing endpoint ${knowledgeObjectId}.`);
    return endpoint.components.filter(item => item.componentIdentity.startsWith(`${dimension}.`));
  };
  return [select(input.evaluation.identity.leftKnowledgeObjectId),select(input.evaluation.identity.rightKnowledgeObjectId)] as const;
}

function registration(layerId: string, requiredCanonicalDimension: CanonicalFeatureDimension): CanonicalLayerEvaluatorRegistration {
  const evaluatorKey = layerId;
  const evaluatorVersion = "canonical-similarity/v1";
  const evaluate = (input: CanonicalLayerEvaluatorInput): CanonicalLayerEvaluation => {
    const evidence = dimensionEvidence(input, requiredCanonicalDimension);
    const [leftComponents, rightComponents] = projectedComponents(input, requiredCanonicalDimension);
    const identity = input.evaluation.identity;
    const lineage = freeze({
      evaluationId: identity.evaluationId,
      candidateId: identity.candidateId,
      sourceKnowledgeObjectIds: [identity.leftKnowledgeObjectId, identity.rightKnowledgeObjectId] as [string, string],
      canonicalDimension: requiredCanonicalDimension,
    });
    const availableInputLineage = freeze(identity.leftKnowledgeObjectId < identity.rightKnowledgeObjectId
      ? [identity.leftKnowledgeObjectId, identity.rightKnowledgeObjectId]
      : [identity.rightKnowledgeObjectId, identity.leftKnowledgeObjectId]
    ).map(sourceIdentity => freeze({ inputIdentity: requiredCanonicalDimension, sourceIdentity }));
    return evidence.availability === "UNAVAILABLE"
      ? freeze({ layerId, evaluatorKey, evaluatorVersion, canonicalDimension: requiredCanonicalDimension, availability: "UNAVAILABLE", reason: evidence.reason, missingCanonicalInput: requiredCanonicalDimension, missingInputs: [...leftComponents,...rightComponents].filter(item=>item.availability==="UNAVAILABLE").map(item=>({inputIdentity:item.componentIdentity,subjectKnowledgeObjectId:item.subjectKnowledgeObjectId})), availableInputLineage: [], lineage })
      : freeze({ layerId, evaluatorKey, evaluatorVersion, canonicalDimension: requiredCanonicalDimension, availability: "AVAILABLE", similarity: evidence.similarity, rawLeftSubjectComponents: Object.fromEntries(leftComponents.filter(item=>item.availability==="AVAILABLE").map(item=>[item.componentIdentity,item.rawValue])), rawRightSubjectComponents: Object.fromEntries(rightComponents.filter(item=>item.availability==="AVAILABLE").map(item=>[item.componentIdentity,item.rawValue])), normalizedResult: evidence.similarity, normalization: { normalizationKey: "CANONICAL_DIMENSION_SIMILARITY", normalizationVersion: evaluatorVersion }, canonicalWeight: weights[requiredCanonicalDimension], availableInputLineage, lineage });
  };
  return freeze({ layerId, evaluatorKey, evaluatorVersion, requiredCanonicalDimension, acceptedInputContract: "FROZEN_CANONICAL_LAYER_EVALUATOR_INPUT_PROJECTION", outputContract: "CANONICAL_LAYER_EVALUATION", evaluate });
}

export const CanonicalLayerEvaluatorRegistrations = freeze([
  registration("OBSERVABILITY", CanonicalFeatureDimension.OBSERVABILITY),
  registration("NARRATIVE", CanonicalFeatureDimension.NARRATIVE),
  registration("GEOGRAPHY", CanonicalFeatureDimension.GEOGRAPHY),
  registration("INFRASTRUCTURE", CanonicalFeatureDimension.INFRASTRUCTURE),
] as const);
