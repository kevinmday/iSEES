import type { CanonicalReplayEvent } from "../../adapters/canonicalEventAdapter";
import { resolveComparePairProjection } from "../../compare/projection/ComparePairProjectionResolver";
import { ComparePairProjectionStatus } from "../../compare/projection/ComparePairProjectionTypes";
import { resolveCoherentInvestigationSelection } from "../../intelligence/selection/InvestigationSelectionCoherence";
import { resolveCurrentOperationalRevision } from "../../investigation/revision/OperationalGraphRevision";
import type { KnowledgeObject } from "../../knowledge/model/KnowledgeObject";
import { KnowledgeObjectType } from "../../knowledge/model/KnowledgeObjectTypes";
import { extractCanonicalKnowledgeFeatures } from "../../resolve/features/CanonicalKnowledgeFeatureExtractor";
import type { CanonicalFeatureValue, CanonicalInfrastructureEntityFeature } from "../../resolve/features/CanonicalKnowledgeFeatureTypes";
import { resolveCandidateIntelligenceCollection } from "../../resolve/intelligence/ResolveCandidateIntelligenceResolver";
import { WorkspaceSelectionKind } from "../../workspace/runtime/WorkspaceRuntimeTypes";
import { NarrativeWorkspaceProjectionStatus, type NarrativeAvailability, type NarrativeUnsupportedInformation, type NarrativeWorkspaceProjection, type NarrativeWorkspaceProjectionInput, type SystemCanonNarrativeProjection } from "./NarrativeWorkspaceProjectionTypes";

interface SystemCanonEventPayload { readonly source: "SYSTEM_CANON"; readonly sourceKind: "CANONICAL_REPLAY_EVENT"; readonly canonicalEvent: CanonicalReplayEvent; }
const unavailable = (reason: string) => ({ availability: "UNAVAILABLE", reason } as const);
const UNSUPPORTED: NarrativeUnsupportedInformation = Object.freeze({
  sourceCitation: unavailable("System Canon narrative paragraphs do not supply source citations."),
  sourceDocumentIdentity: unavailable("System Canon narrative paragraphs do not supply source document identities."),
  narrativeAuthorship: unavailable("System Canon narrative paragraphs do not supply narrative authorship."),
  perParagraphProvenance: unavailable("System Canon narrative paragraphs do not supply per-paragraph provenance."),
  modeledIncidentDateOrTemporalRange: unavailable("System Canon EVENT payloads do not model an incident date or temporal range."),
  proseLevelContradictionAnalysis: unavailable("No production prose-level contradiction contract exists."),
  proseLevelOmissionAnalysis: unavailable("No production prose-level omission contract exists."),
  semanticParaphraseCorrespondence: unavailable("No production semantic paraphrase correspondence contract exists."),
  sentenceOrClauseAlignment: unavailable("No production sentence or clause alignment contract exists."),
  narrativeEvolution: unavailable("No production narrative evolution contract exists."),
});

function isSystemCanonEventPayload(payload: unknown): payload is SystemCanonEventPayload {
  if (typeof payload !== "object" || payload === null) return false;
  const value = payload as Partial<SystemCanonEventPayload>;
  return value.source === "SYSTEM_CANON" && value.sourceKind === "CANONICAL_REPLAY_EVENT" && typeof value.canonicalEvent === "object" && value.canonicalEvent !== null;
}
function exactSetComparison(left: readonly string[], right: readonly string[]) {
  const leftSet = new Set(left); const rightSet = new Set(right);
  return { shared: left.filter(value => rightSet.has(value)), leftOnly: left.filter(value => !rightSet.has(value)), rightOnly: right.filter(value => !leftSet.has(value)) };
}
function resolveUniqueSystemCanonEvent(objects: readonly KnowledgeObject[], eventId: string): KnowledgeObject | undefined {
  const matches = objects.filter(object => object.type === KnowledgeObjectType.EVENT && object.provenance.sourceType === "SYSTEM_CANON" && object.provenance.sourceId === eventId);
  return matches.length === 1 ? matches[0] : undefined;
}
function narrativeProjection(object: KnowledgeObject): SystemCanonNarrativeProjection | undefined {
  if (!isSystemCanonEventPayload(object.payload)) return undefined;
  const event = object.payload.canonicalEvent; const paragraphs = event.core_event?.semantic_signature?.narratives;
  if (!Array.isArray(paragraphs) || paragraphs.length === 0 || paragraphs.some(value => typeof value !== "string" || value.length === 0)) return undefined;
  return { canonicalEventId: event.event_id, knowledgeObjectId: object.identity.id, title: event.event_name, materialClassification: "System Canon narrative", paragraphs: [...paragraphs] };
}
function featureStrings(feature: CanonicalFeatureValue<readonly string[]>): NarrativeAvailability<readonly string[]> {
  return feature.availability === "AVAILABLE" ? { availability: "AVAILABLE", value: feature.value } : unavailable(feature.reason);
}
function facilityTypes(feature: CanonicalFeatureValue<readonly CanonicalInfrastructureEntityFeature[]>): NarrativeAvailability<readonly string[]> {
  return feature.availability === "AVAILABLE" ? { availability: "AVAILABLE", value: feature.value.map(entity => entity.facilityType) } : unavailable(feature.reason);
}

export function resolveNarrativeWorkspaceProjection(input: NarrativeWorkspaceProjectionInput): NarrativeWorkspaceProjection {
  const { investigation, knowledgeObjects, selection, candidateEvaluations } = input;
  if (!investigation) return { status: NarrativeWorkspaceProjectionStatus.NO_INVESTIGATION };
  const focusedEventId = investigation.workspace.focused_event_id;
  if (!focusedEventId?.trim()) return { status: NarrativeWorkspaceProjectionStatus.NO_FOCUSED_EVENT, investigationId: investigation.id };
  let revision;
  try { revision = resolveCurrentOperationalRevision(investigation); }
  catch (error) { return { status: NarrativeWorkspaceProjectionStatus.UNAVAILABLE, investigationId: investigation.id, focusedEventId, reason: error instanceof Error ? error.message : "Current operational revision is unavailable." }; }
  const focusedObject = resolveUniqueSystemCanonEvent(knowledgeObjects, focusedEventId);
  if (!focusedObject || !revision.manifold.graph.nodes.some(node => node.id === focusedObject.identity.id)) return { status: NarrativeWorkspaceProjectionStatus.UNAVAILABLE, investigationId: investigation.id, focusedEventId, reason: "Focused EVENT is unavailable in canonical Knowledge or the current operational revision." };
  if (!selection || selection.kind !== WorkspaceSelectionKind.CANDIDATE) return { status: NarrativeWorkspaceProjectionStatus.NO_COMPARISON, investigationId: investigation.id, focusedEventId };
  const coherentSelection = resolveCoherentInvestigationSelection(investigation, knowledgeObjects, selection);
  if (!coherentSelection || coherentSelection.kind !== WorkspaceSelectionKind.CANDIDATE) return { status: NarrativeWorkspaceProjectionStatus.STALE_SELECTION, investigationId: investigation.id, focusedEventId, reason: "Selected CANDIDATE is not coherent with the active Investigation focus." };
  const focusedIsLeft = selection.leftKnowledgeObjectId === focusedObject.identity.id; const focusedIsRight = selection.rightKnowledgeObjectId === focusedObject.identity.id;
  if (focusedIsLeft === focusedIsRight) return { status: NarrativeWorkspaceProjectionStatus.STALE_SELECTION, investigationId: investigation.id, focusedEventId, reason: "Selected CANDIDATE does not contain the focused EVENT on exactly one side." };
  const comparedKnowledgeObjectId = focusedIsLeft ? selection.rightKnowledgeObjectId : selection.leftKnowledgeObjectId;
  const comparedObject = knowledgeObjects.find(object => object.identity.id === comparedKnowledgeObjectId);
  if (!comparedObject || comparedObject.type !== KnowledgeObjectType.EVENT || comparedObject.provenance.sourceType !== "SYSTEM_CANON" || !revision.manifold.graph.nodes.some(node => node.id === comparedKnowledgeObjectId)) return { status: NarrativeWorkspaceProjectionStatus.UNAVAILABLE, investigationId: investigation.id, focusedEventId, reason: "Compared EVENT is unavailable in canonical Knowledge or the current operational revision." };
  let pair;
  try { pair = resolveComparePairProjection(focusedEventId, knowledgeObjects, coherentSelection, resolveCandidateIntelligenceCollection(candidateEvaluations).intelligence); }
  catch (error) { return { status: NarrativeWorkspaceProjectionStatus.STALE_SELECTION, investigationId: investigation.id, focusedEventId, reason: error instanceof Error ? error.message : "Selected CANDIDATE is stale." }; }
  if (pair.status !== ComparePairProjectionStatus.READY) return { status: NarrativeWorkspaceProjectionStatus.STALE_SELECTION, investigationId: investigation.id, focusedEventId, reason: "Selected CANDIDATE could not be resolved by the established COMPARE pair contract." };
  const focusedNarrative = narrativeProjection(pair.focusedEventKnowledgeObject); const comparedNarrative = narrativeProjection(pair.comparisonEventKnowledgeObject);
  if (!focusedNarrative || !comparedNarrative) return { status: NarrativeWorkspaceProjectionStatus.UNAVAILABLE, investigationId: investigation.id, focusedEventId, reason: "Canonical EVENT payload or narrative paragraphs are unavailable." };
  const focusedProfile = extractCanonicalKnowledgeFeatures(pair.focusedEventKnowledgeObject, knowledgeObjects);
  const comparedProfile = extractCanonicalKnowledgeFeatures(pair.comparisonEventKnowledgeObject, knowledgeObjects);
  const focusedTraits = featureStrings(focusedProfile.narrative.traits); const comparedTraits = featureStrings(comparedProfile.narrative.traits);
  const traits = focusedTraits.availability === "AVAILABLE" && comparedTraits.availability === "AVAILABLE" ? exactSetComparison(focusedTraits.value, comparedTraits.value) : { shared: [], leftOnly: [], rightOnly: [] };
  const focusedFacilities = facilityTypes(focusedProfile.infrastructure.entities); const comparedFacilities = facilityTypes(comparedProfile.infrastructure.entities);
  const facilities = focusedFacilities.availability === "AVAILABLE" && comparedFacilities.availability === "AVAILABLE" ? exactSetComparison(focusedFacilities.value, comparedFacilities.value) : undefined;
  const facilityReason = "Canonical facility types are not mutually available.";
  return { status: NarrativeWorkspaceProjectionStatus.READY, investigationId: investigation.id, currentRevisionId: revision.id,
    candidate: { candidateId: pair.candidateId, evaluationId: pair.evaluationId, leftKnowledgeObjectId: pair.leftKnowledgeObjectId, rightKnowledgeObjectId: pair.rightKnowledgeObjectId },
    comparePair: pair,
    focusedNarrative,
    normalizedCenter: { focusedProfile, comparedProfile, resolveDimensions: pair.dimensions,
      secondaryExactComparison: { classification: "SECONDARY_EXACT_CANONICAL_SET_COMPARISON", sharedSemanticTraits: traits.shared, focusedOnlySemanticTraits: traits.leftOnly, comparedOnlySemanticTraits: traits.rightOnly,
        sharedFacilityTypes: facilities ? { availability: "AVAILABLE", value: facilities.shared } : unavailable(facilityReason), focusedOnlyFacilityTypes: facilities ? { availability: "AVAILABLE", value: facilities.leftOnly } : unavailable(facilityReason), comparedOnlyFacilityTypes: facilities ? { availability: "AVAILABLE", value: facilities.rightOnly } : unavailable(facilityReason) } },
    comparedNarrative, unsupported: UNSUPPORTED };
}
