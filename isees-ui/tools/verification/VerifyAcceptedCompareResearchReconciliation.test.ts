import assert from "node:assert/strict";

import type { KnowledgeObject } from "../../src/knowledge/model/KnowledgeObject.ts";
import { KnowledgeObjectType } from "../../src/knowledge/model/KnowledgeObjectTypes.ts";
import { ComparePairProjectionStatus, type ComparePairProjectionReady } from "../../src/compare/projection/ComparePairProjectionTypes.ts";
import {
  publishCompareCandidateToResearch,
  reconcilePublishedCompareCandidates,
} from "../../src/compare/research/CompareCandidateResearchPublication.ts";
import { materializeAcceptedResolveCandidate } from "../../src/resolve/acceptance/ResolveCandidateAcceptance.ts";
import type { ResolveCandidateIntelligence } from "../../src/resolve/intelligence/ResolveCandidateIntelligenceTypes.ts";
import { ResearchBridgeRuntime, type ResearchBridgeMutation } from "../../src/research/ResearchBridgeRuntime.ts";
import { ResearchAnchorType, type ResearchAnchor } from "../../src/research/researchBridgeTypes.ts";
import { createAuthorReferenceFromResearchAnchor } from "../../src/studio/sources/ResearchAnchorAuthorInsertion.ts";
import { mapResearchAnchorToStudioSourceSnapshot } from "../../src/studio/sources/StudioSourceSnapshotMapper.ts";

const knowledge = (id: string): KnowledgeObject => ({
  identity: { id, type: KnowledgeObjectType.EVENT, canonicalKey: id },
  epistemicStatus: "ESTABLISHED",
  provenance: { sources: [], derivation: "SYSTEM_CANON", createdAt: new Date(0), updatedAt: new Date(0) },
  layers: [], temporalBounds: {}, relationships: [], payload: {},
} as KnowledgeObject);

const projection = {
  status: ComparePairProjectionStatus.READY,
  candidateId: "candidate:left:right",
  evaluationId: "evaluation:candidate:left:right",
  leftKnowledgeObjectId: "left",
  rightKnowledgeObjectId: "right",
  focusedEventId: "event-right",
  focusedEventKnowledgeObjectId: "right",
  comparisonEventId: "event-left",
  comparisonEventKnowledgeObjectId: "left",
  caseAKnowledgeObjectId: "right",
  caseBKnowledgeObjectId: "left",
  aggregate: { aggregateSimilarity: 0.5, participatingDimensionCount: 1, totalDimensionCount: 1 },
  dimensions: [],
  epistemicStatus: "POTENTIAL_RELATIONSHIP",
} as ComparePairProjectionReady;

const intelligence = {
  identity: { candidateId: projection.candidateId, evaluationId: projection.evaluationId, leftKnowledgeObjectId: "left", rightKnowledgeObjectId: "right" },
  candidate: { id: projection.candidateId, leftKnowledgeObjectId: "left", rightKnowledgeObjectId: "right" },
  sourceEvaluation: {
    identity: { candidateId: projection.candidateId, evaluationId: projection.evaluationId, leftKnowledgeObjectId: "left", rightKnowledgeObjectId: "right" },
    candidate: { id: projection.candidateId, leftKnowledgeObjectId: "left", rightKnowledgeObjectId: "right" },
  },
} as unknown as ResolveCandidateIntelligence;

const potentialKnowledge = [knowledge("left"), knowledge("right")];
const runtime = new ResearchBridgeRuntime();
const mutations: ResearchBridgeMutation[] = [];
runtime.subscribe(mutation => mutations.push(mutation));
const published = publishCompareCandidateToResearch({ investigationId: "investigation", projection, resolveExecutionId: "resolve-7", researchBridgeRuntime: runtime, knowledgeObjects: potentialKnowledge });
assert.equal(runtime.getDesk().entries.length, 1);
assert.equal(published.insertability.state, "INSPECTION_ONLY");
assert.throws(() => createAuthorReferenceFromResearchAnchor(published, "reference:blocked", "Analysis"), /inspection-only/);

const unpublishedRuntime = new ResearchBridgeRuntime();
const accepted = materializeAcceptedResolveCandidate(intelligence, potentialKnowledge);
const acceptedKnowledge = [accepted.knowledgeObject, potentialKnowledge[1]!];
assert.equal(unpublishedRuntime.getDesk().entries.length, 0, "acceptance never publishes");

runtime.pinAnchor(published.anchorId, true);
const before = runtime.getDesk().entries[0]!;
assert.equal(reconcilePublishedCompareCandidates(runtime, acceptedKnowledge, "investigation"), 1);
const upgradedEntry = runtime.getDesk().entries[0]!;
assert.equal(upgradedEntry.anchor.anchorId, published.anchorId);
assert.equal(upgradedEntry.anchor.createdAt, before.anchor.createdAt);
assert.equal(upgradedEntry.anchor.collectedAt, before.anchor.collectedAt);
assert.equal(upgradedEntry.anchor.pinned, true);
assert.equal(upgradedEntry.order, before.order);
assert.equal(upgradedEntry.anchor.insertability.state, "INSERTABLE");
assert.equal(upgradedEntry.anchor.classification, "CANONICAL");
assert.equal(upgradedEntry.anchor.kind, "COMPARE_CANDIDATE");
assert.equal(upgradedEntry.anchor.candidate.acceptedRelationshipId, accepted.relationship.id);
assert.equal(reconcilePublishedCompareCandidates(runtime, acceptedKnowledge, "investigation"), 0);
assert.equal(runtime.getDesk().entries.length, 1);
assert.equal(mutations.filter(mutation => mutation.kind === "REPLACE").length, 1);

const capture = upgradedEntry.anchor.capturedRepresentation.value as Record<string, unknown>;
assert.equal(capture.researchAnchorId, published.anchorId);
assert.equal(capture.candidateId, projection.candidateId);
assert.equal(capture.evaluationId, projection.evaluationId);
assert.equal(capture.acceptedRelationshipId, accepted.relationship.id);
assert.deepEqual(capture.acceptedRelationship, accepted.relationship);
assert.equal(capture.leftKnowledgeObjectId, "left");
assert.equal(capture.rightKnowledgeObjectId, "right");
assert.equal(capture.resolveExecutionId, "resolve-7");
assert.equal(capture.collectedAt, published.collectedAt.toISOString());
const authorReference = createAuthorReferenceFromResearchAnchor(upgradedEntry.anchor, "reference:accepted", "Analysis");
const sourceSnapshot = mapResearchAnchorToStudioSourceSnapshot(upgradedEntry.anchor);
assert.equal(authorReference.researchSource?.anchorId, published.anchorId);
assert.equal(sourceSnapshot.sourceExecutionId, "resolve-7");
assert.deepEqual(sourceSnapshot.capturedRepresentation, capture);

const acceptedAtPublication = new ResearchBridgeRuntime();
const immediate = publishCompareCandidateToResearch({ investigationId: "investigation", projection, resolveExecutionId: "resolve-7", researchBridgeRuntime: acceptedAtPublication, knowledgeObjects: acceptedKnowledge });
assert.equal(immediate.insertability.state, "INSERTABLE");
assert.equal(acceptedAtPublication.getDesk().entries.length, 1);

const restored = new ResearchBridgeRuntime();
restored.restoreDesk(runtime.getDesk());
assert.equal(reconcilePublishedCompareCandidates(restored, acceptedKnowledge, "investigation"), 0);
assert.equal(restored.getDesk().entries[0]?.anchor.insertability.state, "INSERTABLE");

assert.equal(reconcilePublishedCompareCandidates(restored, potentialKnowledge, "investigation"), 1, "removed canonical acceptance fails closed");
assert.equal(restored.getDesk().entries[0]?.anchor.insertability.state, "INSPECTION_ONLY");
assert.equal((restored.getDesk().entries[0]?.anchor as typeof published).candidate.acceptedRelationshipId, undefined);
assert.equal(reconcilePublishedCompareCandidates(restored, [], "investigation"), 1, "missing endpoints are governed closed");
assert.equal(restored.getDesk().entries[0]?.anchor.classification, "UNDETERMINED");

const conflictingLeft = knowledge("left");
conflictingLeft.relationships.push({ id: accepted.relationship.id, type: "CONFLICTING", targetId: "right" });
assert.equal(reconcilePublishedCompareCandidates(restored, [conflictingLeft, knowledge("right")], "investigation"), 1);
assert.equal(restored.getDesk().entries[0]?.anchor.insertability.state, "INSPECTION_ONLY");

const researchOnly = new ResearchBridgeRuntime();
researchOnly.restoreDesk(runtime.getDesk());
reconcilePublishedCompareCandidates(researchOnly, potentialKnowledge, "investigation");
assert.equal(researchOnly.getDesk().entries[0]?.anchor.insertability.state, "INSPECTION_ONLY", "Research data never manufactures acceptance");

const unrelated: ResearchAnchor = {
  anchorId: "node", investigationId: "investigation", graph: { type: ResearchAnchorType.NODE, id: "node-1" }, graphRevision: 1, createdAt: new Date(0), pinned: false,
};
restored.createAnchor(unrelated);
const unrelatedBefore = restored.getDesk().entries.find(entry => entry.anchor.anchorId === "node")!;
reconcilePublishedCompareCandidates(restored, acceptedKnowledge, "investigation");
assert.deepEqual(restored.getDesk().entries.find(entry => entry.anchor.anchorId === "node"), unrelatedBefore);

console.log("PASS VerifyAcceptedCompareResearchReconciliation");
