import { CANONICAL_EVENTS } from "../../src/canonical/runtimeCorpus";
import { materializeInitialOperationalRevision } from "../../src/investigation/revision/OperationalGraphRevision";
import type { Investigation } from "../../src/investigation/investigationTypes";
import { adaptSystemCanonToKnowledge } from "../../src/knowledge/ingestion/SystemCanonKnowledgeAdapter";
import type { KnowledgeObject } from "../../src/knowledge/model/KnowledgeObject";
import { KnowledgeObjectType } from "../../src/knowledge/model/KnowledgeObjectTypes";
import { resolveNarrativeWorkspaceProjection } from "../../src/narrative/projection/NarrativeWorkspaceProjection";
import { NarrativeWorkspaceProjectionStatus, type NarrativeWorkspaceReadyProjection } from "../../src/narrative/projection/NarrativeWorkspaceProjectionTypes";
import { generateCanonicalSimilarityCandidates } from "../../src/resolve/candidates/CanonicalSimilarityCandidateGenerator";
import { evaluateCanonicalSimilarityCandidates } from "../../src/resolve/evaluation/CanonicalSimilarityCandidateEvaluator";
import { extractCanonicalEventFeatureSets } from "../../src/resolve/features/CanonicalKnowledgeFeatureExtractor";
import { extractCanonicalKnowledgeFeatures } from "../../src/resolve/features/CanonicalKnowledgeFeatureExtractor";
import { resolveCandidateIntelligence } from "../../src/resolve/intelligence/ResolveCandidateIntelligenceResolver";
import { createWorkspaceCandidateSelection } from "../../src/resolve/intelligence/ResolveCandidateSelection";
import { computeCanonicalKnowledgeSimilarityMatrix } from "../../src/resolve/similarity/CanonicalKnowledgeSimilarityMatrix";
import { WorkspaceSelectionKind } from "../../src/workspace/runtime/WorkspaceRuntimeTypes";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(`VERIFY FAILED: ${message}`);
  passCount += 1;
  console.log(`PASS ${passCount} — ${message}`);
}

function equal(actual: unknown, expected: unknown, message: string): void {
  assert(JSON.stringify(actual) === JSON.stringify(expected), message);
}

let passCount = 0;
const NIMITZ = "E-TICTAC-2004";
const ROOSEVELT = "E-ROOSEVELT-2015";
const RENDLESHAM = "E-RENDLESHAM-1980";

const knowledge = adaptSystemCanonToKnowledge(CANONICAL_EVENTS);
const matrix = computeCanonicalKnowledgeSimilarityMatrix(extractCanonicalEventFeatureSets(knowledge));
const candidates = generateCanonicalSimilarityCandidates(matrix);
const evaluations = evaluateCanonicalSimilarityCandidates(candidates.candidates).evaluations;

const baseInvestigation: Investigation = {
  id: "investigation:narrative-verification",
  name: "Nimitz Investigation",
  description: "NARRATIVE projection verification",
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-03T00:00:00.000Z",
  createdBy: "VERIFIER",
  status: "ACTIVE",
  workspace: {
    id: "workspace:narrative-verification",
    investigation_id: "investigation:narrative-verification",
    active_layers: [],
    imported_events: [{ event_id: NIMITZ, source: "SYSTEM_CANON" }],
    focused_event_id: NIMITZ,
    created_at: "2026-09-03T00:00:00.000Z",
    updated_at: "2026-09-03T00:00:00.000Z",
  },
  revisions: [],
};
const investigation = materializeInitialOperationalRevision(baseInvestigation, knowledge);

const eventObject = (eventId: string) => knowledge.find(object =>
  object.type === KnowledgeObjectType.EVENT && object.provenance.sourceId === eventId,
)!;
const nimitzObject = eventObject(NIMITZ);

function evaluationFor(eventId: string) {
  const oppositeId = eventObject(eventId).identity.id;
  return evaluations.find(evaluation => {
    const ids = [evaluation.identity.leftKnowledgeObjectId, evaluation.identity.rightKnowledgeObjectId];
    return ids.includes(nimitzObject.identity.id) && ids.includes(oppositeId);
  })!;
}

const rooseveltEvaluation = evaluationFor(ROOSEVELT);
const rendleshamEvaluation = evaluationFor(RENDLESHAM);
const selectionFor = (evaluation: typeof rooseveltEvaluation) =>
  createWorkspaceCandidateSelection(resolveCandidateIntelligence(evaluation));

function project(evaluation: typeof rooseveltEvaluation): NarrativeWorkspaceReadyProjection {
  const result = resolveNarrativeWorkspaceProjection({
    investigation,
    knowledgeObjects: knowledge,
    selection: selectionFor(evaluation),
    candidateEvaluations: evaluations,
  });
  assert(result.status === NarrativeWorkspaceProjectionStatus.READY, `real-corpus ${evaluation.identity.candidateId} projection is READY`);
  return result;
}

const before = JSON.stringify({ investigation, knowledge, evaluations });
const roosevelt = project(rooseveltEvaluation);
const rendlesham = project(rendleshamEvaluation);

assert(roosevelt.comparePair.status === "READY", "READY result exposes the established READY COMPARE pair");
assert(roosevelt.comparePair.candidateId === roosevelt.candidate.candidateId && roosevelt.comparePair.evaluationId === roosevelt.candidate.evaluationId, "candidate and evaluation identity are unchanged in the exposed pair");
assert(roosevelt.comparePair.focusedEventId === NIMITZ && roosevelt.comparePair.comparisonEventId === ROOSEVELT, "focused and compared EVENT identity are unchanged in the exposed pair");
assert(
  roosevelt.comparePair.aggregate ===
    roosevelt.comparePair.sourceCandidateIntelligence.explanation.aggregate,
  "aggregate retains the established COMPARE reference",
);
equal(
  roosevelt.comparePair.aggregate,
  roosevelt.comparePair.sourceCandidateIntelligence.sourceEvaluation.explanation.aggregate,
  "aggregate remains structurally equal to its authoritative source evaluation",
);
assert(
  roosevelt.comparePair.epistemicStatus ===
    roosevelt.comparePair.sourceCandidateIntelligence.epistemicStatus,
  "epistemic status retains the established COMPARE value",
);
assert(roosevelt.comparePair.dimensions === roosevelt.normalizedCenter.resolveDimensions && roosevelt.comparePair.dimensions.length === 5, "all five dimension results retain the exact established COMPARE array");
assert(roosevelt.comparePair.sourceCandidateIntelligence.sourceEvaluation === rooseveltEvaluation, "Resolve lineage retains the exact source evaluation without recomputation or transformation");

assert(roosevelt.focusedNarrative.canonicalEventId === NIMITZ && roosevelt.comparedNarrative.canonicalEventId === ROOSEVELT, "Nimitz-focused Roosevelt-compared identities are exact");
assert(rendlesham.focusedNarrative.canonicalEventId === NIMITZ && rendlesham.comparedNarrative.canonicalEventId === RENDLESHAM, "Nimitz-focused Rendlesham-compared identities are exact");
assert(roosevelt.focusedNarrative.canonicalEventId === rendlesham.focusedNarrative.canonicalEventId, "focused EVENT remains E-TICTAC-2004 across candidate changes");
assert(roosevelt.candidate.candidateId === rooseveltEvaluation.identity.candidateId && rendlesham.candidate.candidateId === rendleshamEvaluation.identity.candidateId, "comparison identity follows the selected coherent CANDIDATE");
equal(roosevelt.focusedNarrative, rendlesham.focusedNarrative, "switching candidates preserves all focused-event narrative output");
equal(roosevelt.normalizedCenter.focusedProfile, rendlesham.normalizedCenter.focusedProfile, "switching candidates preserves the focused normalized profile");
assert(roosevelt.comparedNarrative.canonicalEventId !== rendlesham.comparedNarrative.canonicalEventId, "switching candidates changes comparison-derived output");

for (const [eventId, projection] of [[NIMITZ, roosevelt.focusedNarrative], [ROOSEVELT, roosevelt.comparedNarrative], [RENDLESHAM, rendlesham.comparedNarrative]] as const) {
  const source = CANONICAL_EVENTS.find(event => event.event_id === eventId)!;
  equal(projection.paragraphs, source.core_event!.semantic_signature!.narratives!, `${eventId} narrative paragraphs remain exact and ordered`);
  assert(projection.paragraphs !== source.core_event!.semantic_signature!.narratives, `${eventId} paragraph array is newly allocated`);
  assert(projection.materialClassification === "System Canon narrative", `${eventId} prose is truthfully classified`);
}

const rooseveltExact = roosevelt.normalizedCenter.secondaryExactComparison;
const rendleshamExact = rendlesham.normalizedCenter.secondaryExactComparison;
equal(rooseveltExact.sharedSemanticTraits, ["multi-sensor"], "Nimitz/Roosevelt shared traits contain exactly multi-sensor");
equal(rendleshamExact.sharedSemanticTraits, [], "Nimitz/Rendlesham fabricates no shared traits");
equal(rooseveltExact.focusedOnlySemanticTraits, ["cross-domain-maneuver", "instant-acceleration", "object-anticipation", "silent", "stationary-hover", "tic-tac"], "focused-only Roosevelt-pair traits are canonical and ordered by authoritative extraction");
equal(rooseveltExact.comparedOnlySemanticTraits, ["cube-inside-sphere", "daily-contact", "formation-behavior", "near-collision", "persistent-incursion", "training-range-presence"], "compared-only Roosevelt traits are canonical and ordered by authoritative extraction");

assert(rooseveltExact.sharedFacilityTypes.availability === "AVAILABLE", "facility comparison is available for Nimitz/Roosevelt");
if (rooseveltExact.sharedFacilityTypes.availability === "AVAILABLE") equal(rooseveltExact.sharedFacilityTypes.value, ["AIRBORNE SENSOR", "NAVAL STRIKE GROUP"], "Nimitz/Roosevelt exact shared facility type is preserved");
if (rooseveltExact.focusedOnlyFacilityTypes.availability === "AVAILABLE") equal(rooseveltExact.focusedOnlyFacilityTypes.value, ["AEGIS RADAR"], "focused-only facility types derive from authoritative infrastructure features");
if (rooseveltExact.comparedOnlyFacilityTypes.availability === "AVAILABLE") equal(rooseveltExact.comparedOnlyFacilityTypes.value, ["TARGETING POD", "MILITARY AIRSPACE"], "compared-only facility types derive from authoritative infrastructure features");
assert(rendleshamExact.sharedFacilityTypes.availability === "AVAILABLE" && rendleshamExact.sharedFacilityTypes.value.length === 0, "Nimitz/Rendlesham fabricates no facility overlap");

const directNimitz = extractCanonicalKnowledgeFeatures(eventObject(NIMITZ), knowledge);
const directRoosevelt = extractCanonicalKnowledgeFeatures(eventObject(ROOSEVELT), knowledge);
const directRendlesham = extractCanonicalKnowledgeFeatures(eventObject(RENDLESHAM), knowledge);
equal(roosevelt.normalizedCenter.focusedProfile, directNimitz, "focused normalized profile equals direct authoritative Nimitz extraction");
equal(roosevelt.normalizedCenter.comparedProfile, directRoosevelt, "compared normalized profile equals direct authoritative Roosevelt extraction");
equal(rendlesham.normalizedCenter.comparedProfile, directRendlesham, "compared normalized profile equals direct authoritative Rendlesham extraction");
for (const dimension of ["NARRATIVE", "OBSERVABILITY", "INFRASTRUCTURE", "TOPOLOGY", "GEOGRAPHY"] as const) {
  const source = resolveCandidateIntelligence(rooseveltEvaluation).explanation.dimensions.find(item => item.dimension === dimension)!;
  const projected = roosevelt.normalizedCenter.resolveDimensions.find(item => item.dimension === dimension)!;
  equal(projected, source, `${dimension} identity, status/availability, similarity, configured weight, unavailable reason, and source lineage are preserved without recomputation`);
}
assert(roosevelt.normalizedCenter.resolveDimensions.length === 5, "all five existing Resolve dimensions are exposed");
assert(directNimitz.observability.confidence.availability === "AVAILABLE" && directNimitz.observability.durationMinutes.availability === "AVAILABLE", "normalized observability values are present");
assert(directNimitz.infrastructure.entities.availability === "AVAILABLE" && directNimitz.infrastructure.entities.value.every(entity => entity.knowledgeObjectId && entity.facilityType), "normalized infrastructure identities and types are present");
assert(directNimitz.geography.location.availability === "AVAILABLE", "normalized geography values are present");
assert(directNimitz.topology.state.availability === "AVAILABLE", "normalized topology values are present");
assert(directNimitz.narrative.traits.availability === "AVAILABLE" && "lineage" in directNimitz.narrative.traits, "feature availability and lineage are preserved");
assert(rooseveltExact.classification === "SECONDARY_EXACT_CANONICAL_SET_COMPARISON", "exact comparisons are explicitly secondary");

const unavailableKeys = Object.keys(roosevelt.unsupported);
equal(unavailableKeys, ["sourceCitation", "sourceDocumentIdentity", "narrativeAuthorship", "perParagraphProvenance", "modeledIncidentDateOrTemporalRange", "proseLevelContradictionAnalysis", "proseLevelOmissionAnalysis", "semanticParaphraseCorrespondence", "sentenceOrClauseAlignment", "narrativeEvolution"], "all required unsupported information is explicit");
assert(Object.values(roosevelt.unsupported).every(value => value.availability === "UNAVAILABLE" && value.reason.length > 0), "unsupported information never receives fabricated values");

const baseInput = { investigation, knowledgeObjects: knowledge, candidateEvaluations: evaluations };
for (const selection of [undefined, { kind: WorkspaceSelectionKind.NONE }, { kind: WorkspaceSelectionKind.NODE, nodeId: nimitzObject.identity.id }, { kind: WorkspaceSelectionKind.EDGE, edgeId: investigation.revisions[0]!.manifold.graph.edges[0]!.id }] as const) {
  const result = resolveNarrativeWorkspaceProjection({ ...baseInput, selection });
  assert(result.status === NarrativeWorkspaceProjectionStatus.NO_COMPARISON, `${selection?.kind ?? "undefined"} selection fails closed as NO_COMPARISON`);
}

const validSelection = selectionFor(rooseveltEvaluation);
assert(resolveNarrativeWorkspaceProjection({ ...baseInput, selection: { ...validSelection, evaluationId: "evaluation:stale" } }).status === NarrativeWorkspaceProjectionStatus.STALE_SELECTION, "stale CANDIDATE fails closed");
assert(resolveNarrativeWorkspaceProjection({ ...baseInput, investigation: { ...investigation, workspace: { ...investigation.workspace, focused_event_id: null } }, selection: validSelection }).status === NarrativeWorkspaceProjectionStatus.NO_FOCUSED_EVENT, "missing focused EVENT fails closed");
const withoutCompared = knowledge.filter(object => object.identity.id !== eventObject(ROOSEVELT).identity.id);
assert(resolveNarrativeWorkspaceProjection({ ...baseInput, knowledgeObjects: withoutCompared, selection: validSelection }).status === NarrativeWorkspaceProjectionStatus.UNAVAILABLE, "missing compared EVENT fails closed");
assert(resolveNarrativeWorkspaceProjection({ ...baseInput, investigation: { ...investigation, currentRevisionId: "REV-MISSING" }, selection: validSelection }).status === NarrativeWorkspaceProjectionStatus.UNAVAILABLE, "invalid current revision fails closed");

const missingPayloadKnowledge = knowledge.map(object => object === nimitzObject ? { ...object, payload: undefined } : object);
assert(resolveNarrativeWorkspaceProjection({ ...baseInput, knowledgeObjects: missingPayloadKnowledge, selection: validSelection }).status === NarrativeWorkspaceProjectionStatus.UNAVAILABLE, "missing canonical EVENT payload fails closed");
const payload = nimitzObject.payload as any;
const missingNarrativesObject: KnowledgeObject = { ...nimitzObject, payload: { ...payload, canonicalEvent: { ...payload.canonicalEvent, core_event: { ...payload.canonicalEvent.core_event, semantic_signature: { ...payload.canonicalEvent.core_event.semantic_signature, narratives: [] } } } } };
assert(resolveNarrativeWorkspaceProjection({ ...baseInput, knowledgeObjects: knowledge.map(object => object === nimitzObject ? missingNarrativesObject : object), selection: validSelection }).status === NarrativeWorkspaceProjectionStatus.UNAVAILABLE, "missing narrative paragraphs fail closed");

const missingFocused = knowledge.filter(object => object !== nimitzObject);
assert(resolveNarrativeWorkspaceProjection({ ...baseInput, knowledgeObjects: missingFocused, selection: validSelection }).status === NarrativeWorkspaceProjectionStatus.UNAVAILABLE, "missing focused EVENT Knowledge fails closed");
assert(resolveNarrativeWorkspaceProjection({ ...baseInput, investigation: undefined, selection: validSelection }).status === NarrativeWorkspaceProjectionStatus.NO_INVESTIGATION, "absent Investigation fails closed");

equal(JSON.stringify({ investigation, knowledge, evaluations }), before, "Investigation, Knowledge, and Resolve evaluations remain byte-equivalent");
assert(investigation === baseInput.investigation && knowledge === baseInput.knowledgeObjects && evaluations === baseInput.candidateEvaluations, "caller-owned input references remain intact");
const selectionBefore = JSON.stringify(validSelection);
resolveNarrativeWorkspaceProjection({ ...baseInput, selection: validSelection });
equal(JSON.stringify(validSelection), selectionBefore, "Workspace selection remains unmodified");

const reordered = resolveNarrativeWorkspaceProjection({ investigation, knowledgeObjects: [...knowledge].reverse(), selection: validSelection, candidateEvaluations: [...evaluations].reverse() });
equal(reordered, roosevelt, "equivalent Knowledge and evaluation ordering produces equivalent output");
const serialized = JSON.stringify(roosevelt).toLowerCase();
for (const forbidden of ["original testimony", "witness transcript", "verbatim source", "source quotation", "original report", "verified quotation"]) {
  assert(!serialized.includes(forbidden), `projection contains no fabricated ${forbidden} claim`);
}

console.log("");
console.log(`PASS VerifyNarrativeWorkspaceProjection — ${passCount} assertions verified`);
