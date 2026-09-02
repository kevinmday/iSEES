import { ArmedLayerClassification } from "../runtime/LayersExperimentRuntimeTypes";
import type { ArmedLayer, LayersExperimentResult, LayersExperimentUnavailableInput } from "../runtime/LayersExperimentRuntimeTypes";
import { CanonicalFeatureDimension } from "../../resolve/features/CanonicalKnowledgeFeatureTypes";
import { DEFAULT_CANONICAL_SIMILARITY_WEIGHTS } from "../../resolve/similarity/CanonicalKnowledgeSimilarityTypes";
import type { CanonicalDimensionSimilarity } from "../../resolve/similarity/CanonicalKnowledgeSimilarityTypes";
import { LayersOperationalMappingStatus, LayersPairAvailability, LayersPairDeltaState } from "./LayersExperimentalPairProjectionTypes";
import type { LayersExperimentalPairProjection, LayersExperimentalPairProjectionInput, LayersLayerContribution, LayersPairRelationshipProjection } from "./LayersExperimentalPairProjectionTypes";

const mapping: Readonly<Record<string, CanonicalFeatureDimension | undefined>> = {
  NARRATIVE: CanonicalFeatureDimension.NARRATIVE,
  OBSERVABILITY: CanonicalFeatureDimension.OBSERVABILITY,
  INFRASTRUCTURE: CanonicalFeatureDimension.INFRASTRUCTURE,
  GEOGRAPHY: CanonicalFeatureDimension.GEOGRAPHY,
  TEMPORAL: undefined,
};
const weights: Readonly<Record<CanonicalFeatureDimension, number>> = {
  NARRATIVE: DEFAULT_CANONICAL_SIMILARITY_WEIGHTS.narrative,
  OBSERVABILITY: DEFAULT_CANONICAL_SIMILARITY_WEIGHTS.observability,
  INFRASTRUCTURE: DEFAULT_CANONICAL_SIMILARITY_WEIGHTS.infrastructure,
  TOPOLOGY: DEFAULT_CANONICAL_SIMILARITY_WEIGHTS.topology,
  GEOGRAPHY: DEFAULT_CANONICAL_SIMILARITY_WEIGHTS.geography,
};

function id(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim() || !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value.trim())) throw new Error(`${label} is missing or malformed.`);
  return value.trim();
}
function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value as object).sort().map(k => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`).join(",")}}`;
}
function hash(text: string): string {
  let value = 0xcbf29ce484222325n;
  for (const c of text) { value ^= BigInt(c.codePointAt(0) ?? 0); value = BigInt.asUintN(64, value * 0x100000001b3n); }
  return value.toString(16).padStart(16, "0");
}
function immutable<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) { for (const child of Object.values(value as object)) immutable(child); Object.freeze(value); }
  return value;
}
function dimensionEvidence(input: LayersExperimentalPairProjectionInput, dimension: CanonicalFeatureDimension): CanonicalDimensionSimilarity {
  const found = input.evaluation.explanation.dimensions.find(item => item.dimension === dimension);
  if (!found || found.source.dimension !== dimension) throw new Error(`Canonical ${dimension} dimension evidence is missing or malformed.`);
  return found.source;
}
function normalizeLayers(layers: readonly ArmedLayer[]): ArmedLayer[] {
  const seen = new Set<string>();
  return [...layers].map(layer => ({ ...layer })).sort((a, b) => a.id.localeCompare(b.id)).filter(layer => !seen.has(layer.id) && !!seen.add(layer.id));
}
function compute(input: LayersExperimentalPairProjectionInput, layers: readonly ArmedLayer[]): LayersPairRelationshipProjection {
  const evaluationId = input.evaluation.identity.evaluationId;
  const preliminary = normalizeLayers(layers).map((layer): LayersLayerContribution => {
    const dimension = mapping[layer.id];
    if (layer.classification !== ArmedLayerClassification.CANONICAL || !layer.operational) return { layerId: layer.id, classification: layer.classification, operationalMappingStatus: LayersOperationalMappingStatus.UNAVAILABLE, availability: LayersPairAvailability.UNAVAILABLE, participatingWeight: 0, weightedContribution: 0, unavailableReason: `${layer.classification} layer is not a registered operational canonical mapping.`, sourceEvaluationId: evaluationId };
    if (!dimension) return { layerId: layer.id, classification: layer.classification, operationalMappingStatus: LayersOperationalMappingStatus.UNAVAILABLE, availability: LayersPairAvailability.UNAVAILABLE, participatingWeight: 0, weightedContribution: 0, unavailableReason: layer.id === "TEMPORAL" ? "Temporal layer mathematics is not implemented in the canonical similarity contract." : "No canonical similarity dimension mapping is implemented for this layer.", sourceEvaluationId: evaluationId };
    const evidence = dimensionEvidence(input, dimension);
    if (evidence.availability === "UNAVAILABLE") return { layerId: layer.id, classification: layer.classification, operationalMappingStatus: LayersOperationalMappingStatus.MAPPED, canonicalDimension: dimension, availability: LayersPairAvailability.UNAVAILABLE, participatingWeight: 0, weightedContribution: 0, unavailableReason: evidence.reason, sourceEvaluationId: evaluationId };
    const canonicalWeight = weights[dimension];
    return { layerId: layer.id, classification: layer.classification, operationalMappingStatus: LayersOperationalMappingStatus.MAPPED, canonicalDimension: dimension, availability: LayersPairAvailability.AVAILABLE, similarity: evidence.similarity, canonicalWeight, participatingWeight: canonicalWeight, weightedContribution: canonicalWeight * evidence.similarity, sourceEvaluationId: evaluationId };
  });
  const participatingWeight = preliminary.reduce((sum, item) => sum + item.participatingWeight, 0);
  const weightedSum = preliminary.reduce((sum, item) => sum + item.weightedContribution, 0);
  const contributions = preliminary.map(item => item.availability === "AVAILABLE" ? { ...item, participatingWeight: item.participatingWeight / participatingWeight, weightedContribution: item.weightedContribution / participatingWeight } : item);
  const participatingLayers = contributions.filter(item => item.availability === "AVAILABLE").map(item => item.layerId);
  const relationship = participatingWeight === 0
    ? { availability: LayersPairAvailability.UNAVAILABLE, reason: "No selected mapped layer has available canonical dimension evidence.", participatingLayers } as const
    : { availability: LayersPairAvailability.AVAILABLE, score: weightedSum / participatingWeight, participatingWeight, participatingLayers } as const;
  return { sourceKnowledgeObjectId: input.pair.leftKnowledgeObjectId, targetKnowledgeObjectId: input.pair.rightKnowledgeObjectId, relationship, contributions };
}

export function projectLayersExperimentalPair(input: LayersExperimentalPairProjectionInput): LayersExperimentResult & { experimentalManifoldSnapshot: LayersExperimentalPairProjection } {
  const investigationId = id(input.investigationId, "Investigation identity");
  const executionId = id(input.executionId, "Execution identity");
  const source = id(input.sourceKnowledgeObjectId, "Source Knowledge Object identity");
  const target = id(input.targetKnowledgeObjectId, "Target Knowledge Object identity");
  if (source === target) throw new Error("Duplicate pair endpoints are not permitted.");
  if (input.laboratoryInput.scope.investigationId !== investigationId || input.laboratoryInput.baseline.investigationId !== investigationId) throw new Error("Investigation identity does not match the Laboratory execution input.");
  const subjects = [...input.laboratoryInput.scope.subjectIds].sort();
  if (subjects.length !== 2 || subjects[0] !== [source, target].sort()[0] || subjects[1] !== [source, target].sort()[1]) throw new Error("Subject identities do not match the Laboratory execution input.");
  const pair = input.pair;
  if (pair.leftKnowledgeObjectId >= pair.rightKnowledgeObjectId) throw new Error("Canonical pair must contain distinct lexically ordered endpoints.");
  const endpoints = [source, target].sort();
  if (pair.leftKnowledgeObjectId !== endpoints[0] || pair.rightKnowledgeObjectId !== endpoints[1]) throw new Error("Canonical pair endpoints do not match source identities.");
  const resolutionEndpoints = [pair.resolution.sourceKnowledgeObjectId, pair.resolution.targetKnowledgeObjectId].sort();
  if (resolutionEndpoints[0] !== endpoints[0] || resolutionEndpoints[1] !== endpoints[1]) throw new Error("Canonical pair resolution lineage is forged.");
  const candidate = input.evaluation.candidate;
  const expectedCandidateId = `similarity-candidate:${pair.leftKnowledgeObjectId}:${pair.rightKnowledgeObjectId}`;
  const evaluationIdentity = input.evaluation.identity;
  if (candidate.id !== expectedCandidateId || evaluationIdentity.candidateId !== candidate.id || evaluationIdentity.evaluationId !== `evaluation:${candidate.id}` || candidate.leftKnowledgeObjectId !== pair.leftKnowledgeObjectId || candidate.rightKnowledgeObjectId !== pair.rightKnowledgeObjectId || evaluationIdentity.leftKnowledgeObjectId !== pair.leftKnowledgeObjectId || evaluationIdentity.rightKnowledgeObjectId !== pair.rightKnowledgeObjectId || canonical(candidate.similarityResolution) !== canonical(pair.resolution)) throw new Error("Candidate/evaluation lineage does not match the canonical pair.");
  const baseline = compute(input, input.baselineLayers);
  const experimental = compute(input, input.experimentalLayers);
  const b = baseline.relationship, e = experimental.relationship;
  const state = b.availability === "UNAVAILABLE" ? (e.availability === "AVAILABLE" ? LayersPairDeltaState.FORMED : LayersPairDeltaState.UNAVAILABLE) : e.availability === "UNAVAILABLE" ? LayersPairDeltaState.DISSOLVED : e.score > b.score ? LayersPairDeltaState.STRENGTHENED : e.score < b.score ? LayersPairDeltaState.WEAKENED : LayersPairDeltaState.UNCHANGED;
  const delta = { state, ...(b.availability === "AVAILABLE" ? { baselineScore: b.score } : {}), ...(e.availability === "AVAILABLE" ? { experimentalScore: e.score } : {}), ...(b.availability === "AVAILABLE" && e.availability === "AVAILABLE" ? { scoreDelta: e.score - b.score } : {}) };
  const allContributions = [...baseline.contributions.map(item => ({ ...item, layerId: `BASELINE:${item.layerId}` })), ...experimental.contributions.map(item => ({ ...item, layerId: `EXPERIMENTAL:${item.layerId}` }))];
  const unavailableInputs: LayersExperimentUnavailableInput[] = allContributions.filter(item => item.availability === "UNAVAILABLE").map(item => ({ code: "LAYER_INPUT_UNAVAILABLE", description: `${item.layerId}: ${item.unavailableReason}` }));
  const pairId = `canonical-pair:${pair.leftKnowledgeObjectId}:${pair.rightKnowledgeObjectId}`;
  const semantic = { governingEquation: "M = g(L,T,S)", executionId, investigationId, pairId, candidateId: candidate.id, evaluationId: evaluationIdentity.evaluationId, subjects: endpoints, baseline, experimental, delta };
  const canonicalRepresentation = canonical(semantic);
  const projectionId = `layers-pair-projection:${hash(canonicalRepresentation)}`;
  const projection: LayersExperimentalPairProjection = { kind: "LAYERS_EXPERIMENTAL_PAIR_PROJECTION", projectionId, investigationId, executionId, pairId, candidateId: candidate.id, evaluationId: evaluationIdentity.evaluationId, subjects: endpoints.map(knowledgeObjectId => ({ kind: "SUBJECT_NODE" as const, knowledgeObjectId })) as unknown as LayersExperimentalPairProjection["subjects"], baseline, experimental, layerContributions: allContributions, unavailableInputs, delta, provenance: { governingEquation: "M = g(L,T,S)", executionId, investigationId, pairId, candidateId: candidate.id, evaluationId: evaluationIdentity.evaluationId, baselineLayerIds: normalizeLayers(input.baselineLayers).map(x => x.id), experimentalLayerIds: normalizeLayers(input.experimentalLayers).map(x => x.id), participatingLayerIds: allContributions.filter(x => x.availability === "AVAILABLE").map(x => x.layerId), unavailableLayerIds: allContributions.filter(x => x.availability === "UNAVAILABLE").map(x => x.layerId), canonicalRepresentation }, createsCanonicalKnowledgeRelationship: false };
  return immutable({ outcome: experimental.relationship.availability === "AVAILABLE" ? "COMPUTED" : "UNAVAILABLE", experimentalManifoldSnapshot: projection, baselineDelta: delta, layerContributions: allContributions, unavailableInputs, provenance: projection.provenance });
}
