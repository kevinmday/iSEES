import { ArmedLayerClassification } from "../runtime/LayersExperimentRuntimeTypes";
import type { ArmedLayer, LayersExperimentResult, LayersExperimentUnavailableInput } from "../runtime/LayersExperimentRuntimeTypes";
import { getCanonicalLayerEvaluator } from "../evaluators/CanonicalLayerEvaluatorRegistry";
import { LayersContributionSet, LayersOperationalMappingStatus, LayersPairAvailability, LayersPairDeltaState, layersContributionId } from "./LayersExperimentalPairProjectionTypes";
import type { LayersExperimentalPairProjection, LayersExperimentalPairProjectionInput, LayersLayerContribution, LayersPairRelationshipProjection } from "./LayersExperimentalPairProjectionTypes";
import { CANONICAL_LAYER_CATALOG_VERSION, LAYERS_EXPERIMENT_SCHEMA_VERSION } from "../catalog/CanonicalLayerCatalogTypes";
import { projectCanonicalLayerEvaluatorInput, type CanonicalLayerEvaluatorInputProjection } from "../evaluators/CanonicalLayerEvaluatorInputProjection";

// Canonical evaluator registrations own DEFAULT_CANONICAL_SIMILARITY_WEIGHTS;
// this projection preserves weightedContribution, weightedSum / participatingWeight, and scoreDelta mathematics.

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
function normalizeLayers(layers: readonly ArmedLayer[]): ArmedLayer[] {
  const seen = new Set<string>();
  return [...layers].map(layer => ({ ...layer })).sort((a, b) => a.id.localeCompare(b.id)).filter(layer => !seen.has(layer.id) && !!seen.add(layer.id));
}
function compute(input: LayersExperimentalPairProjectionInput, layers: readonly ArmedLayer[], inputProjection: CanonicalLayerEvaluatorInputProjection): LayersPairRelationshipProjection {
  const evaluationId = input.evaluation.identity.evaluationId;
  const preliminary = normalizeLayers(layers).map((layer): LayersLayerContribution => {
    if (layer.classification !== ArmedLayerClassification.CANONICAL || !layer.operational) return { layerId: layer.id, classification: layer.classification, operationalMappingStatus: LayersOperationalMappingStatus.UNAVAILABLE, availability: LayersPairAvailability.UNAVAILABLE, participatingWeight: 0, weightedContribution: 0, unavailableReason: `${layer.classification} layer is not a registered operational canonical mapping.`, sourceEvaluationId: evaluationId };
    const evaluator = getCanonicalLayerEvaluator(layer.id);
    if (!evaluator) return { layerId: layer.id, classification: layer.classification, operationalMappingStatus: LayersOperationalMappingStatus.UNAVAILABLE, availability: LayersPairAvailability.UNAVAILABLE, participatingWeight: 0, weightedContribution: 0, unavailableReason: layer.id === "TEMPORAL" ? "Temporal layer mathematics is not implemented in the canonical similarity contract." : "No canonical similarity dimension mapping is implemented for this layer.", sourceEvaluationId: evaluationId };
    const result = evaluator.evaluate({ evaluation: input.evaluation, inputProjection });
    if (result.availability === "UNAVAILABLE") return { layerId: layer.id, classification: layer.classification, operationalMappingStatus: LayersOperationalMappingStatus.MAPPED, canonicalDimension: result.canonicalDimension, evaluatorKey: result.evaluatorKey, evaluatorVersion: result.evaluatorVersion, evaluationLineage: result.lineage, missingCanonicalInput: result.missingCanonicalInput, missingInputs: result.missingInputs ?? [{ inputIdentity: result.missingCanonicalInput }], availableInputLineage: result.availableInputLineage, availability: LayersPairAvailability.UNAVAILABLE, participatingWeight: 0, weightedContribution: 0, unavailableReason: result.reason, sourceEvaluationId: evaluationId };
    return { layerId: layer.id, classification: layer.classification, operationalMappingStatus: LayersOperationalMappingStatus.MAPPED, canonicalDimension: result.canonicalDimension, evaluatorKey: result.evaluatorKey, evaluatorVersion: result.evaluatorVersion, evaluationLineage: result.lineage, rawLeftSubjectComponents: result.rawLeftSubjectComponents, rawRightSubjectComponents: result.rawRightSubjectComponents, normalization: result.normalization, normalizedResult: result.normalizedResult ?? result.similarity, availableInputLineage: result.availableInputLineage, availability: LayersPairAvailability.AVAILABLE, similarity: result.similarity, canonicalWeight: result.canonicalWeight, participatingWeight: result.canonicalWeight, weightedContribution: result.canonicalWeight * result.similarity, sourceEvaluationId: evaluationId };
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
  const pairId = `canonical-pair:${pair.leftKnowledgeObjectId}:${pair.rightKnowledgeObjectId}`;
  const scope=input.laboratoryInput.scope;
  if(scope.compareOrigin.pairId!==pairId||scope.compareOrigin.candidateId!==candidate.id||scope.compareOrigin.evaluationId!==evaluationIdentity.evaluationId) throw new Error("Laboratory comparison ownership does not match the canonical pair/candidate/evaluation.");
  const caseIds=[id(input.caseAKnowledgeObjectId,"Case A Knowledge Object identity"),id(input.caseBKnowledgeObjectId,"Case B Knowledge Object identity")].sort();
  if(caseIds[0]!==endpoints[0]||caseIds[1]!==endpoints[1]) throw new Error("Case endpoint ownership does not match the canonical pair.");
  const evaluatorInput=projectCanonicalLayerEvaluatorInput({investigationId,pairId,candidateId:candidate.id,evaluationId:evaluationIdentity.evaluationId,executionId,caseA:{subjectIdentity:scope.focusedEventId,knowledgeObjectId:input.caseAKnowledgeObjectId},caseB:{subjectIdentity:scope.comparisonEventId,knowledgeObjectId:input.caseBKnowledgeObjectId},knowledgeObjects:input.knowledgeObjects});
  const baseline = compute(input, input.baselineLayers, evaluatorInput);
  const experimental = compute(input, input.experimentalLayers, evaluatorInput);
  const b = baseline.relationship, e = experimental.relationship;
  const state = b.availability === "UNAVAILABLE" ? (e.availability === "AVAILABLE" ? LayersPairDeltaState.FORMED : LayersPairDeltaState.UNAVAILABLE) : e.availability === "UNAVAILABLE" ? LayersPairDeltaState.DISSOLVED : e.score > b.score ? LayersPairDeltaState.STRENGTHENED : e.score < b.score ? LayersPairDeltaState.WEAKENED : LayersPairDeltaState.UNCHANGED;
  const delta = { state, ...(b.availability === "AVAILABLE" ? { baselineScore: b.score } : {}), ...(e.availability === "AVAILABLE" ? { experimentalScore: e.score } : {}), ...(b.availability === "AVAILABLE" && e.availability === "AVAILABLE" ? { scoreDelta: e.score - b.score } : {}) };
  const allContributions = [...baseline.contributions.map(item => ({ ...item, layerId: layersContributionId(LayersContributionSet.BASELINE, item.layerId) })), ...experimental.contributions.map(item => ({ ...item, layerId: layersContributionId(LayersContributionSet.EXPERIMENTAL, item.layerId) }))];
  const unavailableInputs: LayersExperimentUnavailableInput[] = allContributions.filter(item => item.availability === "UNAVAILABLE").map(item => ({ code: "LAYER_INPUT_UNAVAILABLE", description: `${item.layerId}: ${item.unavailableReason}` }));
  const baselineLayerIds = normalizeLayers(input.baselineLayers).map(x => x.id);
  const experimentalLayerIds = normalizeLayers(input.experimentalLayers).map(x => x.id);
  const selectedLayerIds = [...new Set([...baselineLayerIds, ...experimentalLayerIds])].sort();
  const semantic = { experimentSchemaVersion: LAYERS_EXPERIMENT_SCHEMA_VERSION, catalogVersion: CANONICAL_LAYER_CATALOG_VERSION, governingEquation: "M = g(L,T,S)", executionId, investigationId, pairId, candidateId: candidate.id, evaluationId: evaluationIdentity.evaluationId, subjects: endpoints, evaluatorInput, baseline, experimental, delta };
  const canonicalRepresentation = canonical(semantic);
  const projectionId = `layers-pair-projection:${hash(canonicalRepresentation)}`;
  const projection: LayersExperimentalPairProjection = { kind: "LAYERS_EXPERIMENTAL_PAIR_PROJECTION", projectionId, investigationId, executionId, pairId, candidateId: candidate.id, evaluationId: evaluationIdentity.evaluationId, evaluatorInput, subjects: endpoints.map(knowledgeObjectId => ({ kind: "SUBJECT_NODE" as const, knowledgeObjectId })) as unknown as LayersExperimentalPairProjection["subjects"], baseline, experimental, layerContributions: allContributions, unavailableInputs, delta, provenance: { experimentSchemaVersion: LAYERS_EXPERIMENT_SCHEMA_VERSION, catalogVersion: CANONICAL_LAYER_CATALOG_VERSION, governingEquation: "M = g(L,T,S)", executionId, investigationId, pairId, candidateId: candidate.id, evaluationId: evaluationIdentity.evaluationId, baselineLayerIds, experimentalLayerIds, selectedLayerIds, participatingLayerIds: allContributions.filter(x => x.availability === "AVAILABLE").map(x => x.layerId), unavailableLayerIds: allContributions.filter(x => x.availability === "UNAVAILABLE").map(x => x.layerId), canonicalRepresentation }, createsCanonicalKnowledgeRelationship: false };
  return immutable({ outcome: experimental.relationship.availability === "AVAILABLE" ? "COMPUTED" : "UNAVAILABLE", experimentalManifoldSnapshot: projection, baselineDelta: delta, layerContributions: allContributions, unavailableInputs, provenance: projection.provenance });
}
