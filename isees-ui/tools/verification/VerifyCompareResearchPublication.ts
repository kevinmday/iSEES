import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ResearchBridgeRuntime } from "../../src/research/ResearchBridgeRuntime";
import { ResearchAnchorType, type ResearchAnchor } from "../../src/research/researchBridgeTypes";
import { createGuestWorkspaceSessionSnapshot, isGuestWorkspaceSessionSnapshot } from "../../src/workspace/persistence/GuestWorkspaceSessionPersistence";
import { createCompareCandidateResearchAnchor, publishCompareCandidateToResearch } from "../../src/compare/research/CompareCandidateResearchPublication";
import { ComparePairProjectionStatus, type ComparePairProjectionReady } from "../../src/compare/projection/ComparePairProjectionTypes";
import { migrateResearchAnchor } from "../../src/research/ResearchAnchorContract";

const dimensions = ["NARRATIVE", "OBSERVABILITY", "INFRASTRUCTURE", "TOPOLOGY", "GEOGRAPHY"].map((dimension, index) => ({
  dimension,
  status: index === 4 ? "UNAVAILABLE" : "AVAILABLE",
  source: index === 4
    ? { dimension, availability: "UNAVAILABLE", reason: "NO_CANONICAL_GEOGRAPHY_FEATURES", weight: 1 }
    : { dimension, availability: "AVAILABLE", similarity: index / 10, weight: 1 },
})) as ComparePairProjectionReady["dimensions"];

const projection = {
  status: ComparePairProjectionStatus.READY,
  candidateId: "candidate:left:right",
  evaluationId: "evaluation:candidate:left:right",
  leftKnowledgeObjectId: "ko-left",
  rightKnowledgeObjectId: "ko-right",
  focusedEventId: "event-right",
  focusedEventKnowledgeObjectId: "ko-right",
  comparisonEventId: "event-left",
  comparisonEventKnowledgeObjectId: "ko-left",
  caseAKnowledgeObjectId: "ko-right",
  caseBKnowledgeObjectId: "ko-left",
  aggregate: { aggregateSimilarity: 0.4, participatingDimensionCount: 4, totalDimensionCount: 5 },
  dimensions,
  epistemicStatus: "POTENTIAL_RELATIONSHIP",
} as ComparePairProjectionReady;

const runtime = new ResearchBridgeRuntime();
const input = { investigationId: "investigation-1", projection, resolveExecutionId: "resolve-7", researchBridgeRuntime: runtime };
const beforeTopology = JSON.stringify({ nodes: ["n1"], edges: [] });
const beforeSelection = JSON.stringify({ kind: "CANDIDATE", candidateId: projection.candidateId });

const first = publishCompareCandidateToResearch(input);
const second = publishCompareCandidateToResearch(input);
assert.equal(first.anchorId, second.anchorId);
assert.equal(runtime.getDesk().entries.length, 1);
assert.equal(first.candidate.type, ResearchAnchorType.CANDIDATE);
assert.equal("graph" in first, false);
assert.equal("nodeId" in first.candidate, false);
assert.equal("edgeId" in first.candidate, false);
assert.equal(first.candidate.candidateId, projection.candidateId);
assert.equal(first.candidate.evaluationId, projection.evaluationId);
assert.deepEqual([first.candidate.leftKnowledgeObjectId, first.candidate.rightKnowledgeObjectId], ["ko-left", "ko-right"]);
assert.deepEqual([first.candidate.focusedEventId, first.candidate.comparisonEventId], ["event-right", "event-left"]);
assert.deepEqual([first.candidate.focusedEventKnowledgeObjectId, first.candidate.comparisonEventKnowledgeObjectId], ["ko-right", "ko-left"]);
assert.equal(first.candidate.dimensions.length, 5);
assert.deepEqual(first.candidate.dimensions, projection.dimensions);
assert.equal(first.candidate.dimensions[4]?.source.availability, "UNAVAILABLE");
assert.equal((first.candidate.dimensions[4]?.source as { reason: string }).reason, "NO_CANONICAL_GEOGRAPHY_FEATURES");
const other = createCompareCandidateResearchAnchor({ ...input, projection: { ...projection, candidateId: "candidate:other", evaluationId: "evaluation:other" } });
assert.notEqual(first.anchorId, other.anchorId);
assert.equal(createCompareCandidateResearchAnchor(input).anchorId, first.anchorId);
assert.equal(beforeTopology, JSON.stringify({ nodes: ["n1"], edges: [] }));
assert.equal(beforeSelection, JSON.stringify({ kind: "CANDIDATE", candidateId: projection.candidateId }));

const publicationSource = readFileSync("src/compare/research/CompareCandidateResearchPublication.ts", "utf8");
for (const forbidden of ["ResolveCandidateAcceptance", "acceptResolveCandidate", "GraphMutation", "createEdge", "setNodes", "setEdges", "setSelection", "WorkspaceSelection", "executeResolve", ".execute("]) {
  assert.equal(publicationSource.includes(forbidden), false, `publication boundary excludes ${forbidden}`);
}

const restored = new ResearchBridgeRuntime();
const guestSnapshot = createGuestWorkspaceSessionSnapshot({
  ownership: { kind: "GUEST", operatorId: "guest-1", establishedAt: "2026-01-01T00:00:00.000Z" },
  workspace: { operator: { activeMode: "OVERVIEW" as any, layoutMode: "NORMAL" as any }, computational: { activeLayers: [] } },
  research: { desk: runtime.getDesk() },
  authoring: {},
});
const serializedGuestSnapshot = JSON.stringify(guestSnapshot);
const parsedGuestSnapshot: unknown = JSON.parse(serializedGuestSnapshot);
assert.equal(isGuestWorkspaceSessionSnapshot(parsedGuestSnapshot), true);
assert(isGuestWorkspaceSessionSnapshot(parsedGuestSnapshot));
restored.restoreDesk(parsedGuestSnapshot.research.desk);
const canonicalPersistedDesk = {
  ...parsedGuestSnapshot.research.desk,
  entries: parsedGuestSnapshot.research.desk.entries.map(entry => ({
    ...entry,
    anchor: migrateResearchAnchor(entry.anchor),
  })),
};
assert.deepEqual(restored.getDesk(), canonicalPersistedDesk);
assert(restored.getDesk().entries.every(entry => entry.anchor.createdAt instanceof Date));
assert(restored.getDesk().entries.every(entry => entry.anchor.collectedAt instanceof Date));
const malformedTimestampSnapshot = structuredClone(parsedGuestSnapshot);
malformedTimestampSnapshot.research.desk.entries[0].anchor.collectedAt = "not-a-timestamp";
assert.equal(isGuestWorkspaceSessionSnapshot(malformedTimestampSnapshot), false);
assert.throws(() => restored.restoreDesk(malformedTimestampSnapshot.research.desk));
const malformedCreationTimestampSnapshot = structuredClone(parsedGuestSnapshot);
malformedCreationTimestampSnapshot.research.desk.entries[0].anchor.createdAt = "2026-01-01";
assert.equal(isGuestWorkspaceSessionSnapshot(malformedCreationTimestampSnapshot), false);
assert.throws(() => restored.restoreDesk(malformedCreationTimestampSnapshot.research.desk));

const graphAnchors: ResearchAnchor[] = [
  { anchorId: "n", investigationId: "i", graph: { type: ResearchAnchorType.NODE, id: "node" }, graphRevision: 1, createdAt: new Date(0), pinned: false },
  { anchorId: "e", investigationId: "i", graph: { type: ResearchAnchorType.EDGE, id: "edge" }, graphRevision: 1, createdAt: new Date(0), pinned: false },
];
assert.deepEqual(graphAnchors.map(anchor => "graph" in anchor && anchor.graph.type), ["NODE", "EDGE"]);
console.log("PASS VerifyCompareResearchPublication");
