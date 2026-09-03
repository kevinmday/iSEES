import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CANONICAL_EVENTS } from "../../src/canonical/runtimeCorpus";
import { publishCompareCandidateToResearch } from "../../src/compare/research/CompareCandidateResearchPublication";
import { materializeInitialOperationalRevision } from "../../src/investigation/revision/OperationalGraphRevision";
import type { Investigation } from "../../src/investigation/investigationTypes";
import { adaptSystemCanonToKnowledge } from "../../src/knowledge/ingestion/SystemCanonKnowledgeAdapter";
import { KnowledgeObjectType } from "../../src/knowledge/model/KnowledgeObjectTypes";
import { resolveNarrativeWorkspaceProjection } from "../../src/narrative/projection/NarrativeWorkspaceProjection";
import { NarrativeWorkspaceProjectionStatus } from "../../src/narrative/projection/NarrativeWorkspaceProjectionTypes";
import { ResearchBridgeRuntime } from "../../src/research/ResearchBridgeRuntime";
import { ResearchAnchorType } from "../../src/research/researchBridgeTypes";
import { generateCanonicalSimilarityCandidates } from "../../src/resolve/candidates/CanonicalSimilarityCandidateGenerator";
import { evaluateCanonicalSimilarityCandidates } from "../../src/resolve/evaluation/CanonicalSimilarityCandidateEvaluator";
import { extractCanonicalEventFeatureSets } from "../../src/resolve/features/CanonicalKnowledgeFeatureExtractor";
import { resolveCandidateIntelligence } from "../../src/resolve/intelligence/ResolveCandidateIntelligenceResolver";
import { createWorkspaceCandidateSelection } from "../../src/resolve/intelligence/ResolveCandidateSelection";
import { computeCanonicalKnowledgeSimilarityMatrix } from "../../src/resolve/similarity/CanonicalKnowledgeSimilarityMatrix";
import { createGuestWorkspaceSessionSnapshot, isGuestWorkspaceSessionSnapshot } from "../../src/workspace/persistence/GuestWorkspaceSessionPersistence";

let passCount = 0;
function pass(condition: unknown, message: string): asserts condition {
  assert(condition, message); passCount += 1; console.log(`PASS ${passCount} — ${message}`);
}

const NIMITZ = "E-TICTAC-2004";
const ROOSEVELT = "E-ROOSEVELT-2015";
const knowledge = adaptSystemCanonToKnowledge(CANONICAL_EVENTS);
const eventObject = (eventId: string) => knowledge.find(object => object.type === KnowledgeObjectType.EVENT && object.provenance.sourceId === eventId)!;
const evaluations = evaluateCanonicalSimilarityCandidates(generateCanonicalSimilarityCandidates(computeCanonicalKnowledgeSimilarityMatrix(extractCanonicalEventFeatureSets(knowledge))).candidates).evaluations;
const nimitz = eventObject(NIMITZ);
const roosevelt = eventObject(ROOSEVELT);
const evaluation = evaluations.find(item => {
  const ids = [item.identity.leftKnowledgeObjectId, item.identity.rightKnowledgeObjectId];
  return ids.includes(nimitz.identity.id) && ids.includes(roosevelt.identity.id);
})!;
const selection = createWorkspaceCandidateSelection(resolveCandidateIntelligence(evaluation));
const baseInvestigation: Investigation = {
  id: "investigation:narrative-publication", name: "Nimitz Investigation", description: "NARRATIVE publication verification",
  createdAt: "2026-09-03T00:00:00.000Z", updatedAt: "2026-09-03T00:00:00.000Z", createdBy: "VERIFIER", status: "ACTIVE",
  workspace: { id: "workspace:narrative-publication", investigation_id: "investigation:narrative-publication", active_layers: [], imported_events: [{ event_id: NIMITZ, source: "SYSTEM_CANON" }], focused_event_id: NIMITZ, created_at: "2026-09-03T00:00:00.000Z", updated_at: "2026-09-03T00:00:00.000Z" },
  revisions: [],
};
const investigation = materializeInitialOperationalRevision(baseInvestigation, knowledge);
const inputsBefore = JSON.stringify({ investigation, knowledge, evaluations, selection });
const investigationBefore = JSON.stringify(investigation);
const knowledgeBefore = JSON.stringify(knowledge);
const selectionBefore = JSON.stringify(selection);
const evaluationBefore = JSON.stringify(evaluation);
const projection = resolveNarrativeWorkspaceProjection({ investigation, knowledgeObjects: knowledge, selection, candidateEvaluations: evaluations });
pass(projection.status === NarrativeWorkspaceProjectionStatus.READY, "NARRATIVE projection is READY");
if (projection.status !== NarrativeWorkspaceProjectionStatus.READY) throw new Error("unreachable");
pass(projection.focusedNarrative.canonicalEventId === NIMITZ && investigation.workspace.focused_event_id === NIMITZ, "Nimitz remains focused");
pass(projection.comparedNarrative.canonicalEventId === ROOSEVELT, "Roosevelt remains compared");
pass(projection.comparePair.status === "READY", "READY NARRATIVE result supplies the established COMPARE pair");
pass(projection.comparePair.candidateId === evaluation.identity.candidateId && projection.comparePair.evaluationId === evaluation.identity.evaluationId, "candidate and evaluation identities are preserved");
pass(projection.comparePair.leftKnowledgeObjectId === evaluation.identity.leftKnowledgeObjectId && projection.comparePair.rightKnowledgeObjectId === evaluation.identity.rightKnowledgeObjectId, "canonical Knowledge identities are preserved");
pass(projection.comparePair.focusedEventId === NIMITZ && projection.comparePair.comparisonEventId === ROOSEVELT, "focused and compared EVENT identities are preserved");

const runtime = new ResearchBridgeRuntime();
const resolveExecutionId = "resolve:narrative-publication";
const expectedAnchorId = ["research", investigation.id, "CANDIDATE", projection.comparePair.candidateId, projection.comparePair.evaluationId].join(":");
const first = publishCompareCandidateToResearch({ investigationId: investigation.id, projection: projection.comparePair, resolveExecutionId, researchBridgeRuntime: runtime });
pass(first.anchorId === expectedAnchorId, "deterministic anchor ID exactly matches COMPARE");
pass(first.candidate.type === ResearchAnchorType.CANDIDATE && first.candidate.source === "COMPARE_PAIR_INSPECTION", "publication produces the established COMPARE CANDIDATE anchor");
pass(first.candidate.resolveExecutionId === resolveExecutionId, "Resolve execution identity is preserved");
pass(first.candidate.epistemicStatus === projection.comparePair.epistemicStatus && first.candidate.epistemicStatus === "POTENTIAL_RELATIONSHIP", "epistemic status remains POTENTIAL_RELATIONSHIP");
pass(first.candidate.aggregate === projection.comparePair.aggregate, "aggregate result is preserved by reference");
pass(first.candidate.dimensions === projection.comparePair.dimensions && first.candidate.dimensions.length === 5, "five dimension results are preserved by reference");
pass(first.candidate.dimensions.every((item, index) => JSON.stringify(item) === JSON.stringify(projection.comparePair.dimensions[index])), "dimension availability, unavailable reasons, lineage, and values are preserved");
pass(!("graph" in first) && !("nodeId" in first.candidate) && !("edgeId" in first.candidate), "no NODE, EDGE, or accepted relationship is created");
pass(runtime.getDesk().entries.length === 1 && runtime.getRevision() === 1, "first publication advances only Research runtime state once");
const second = publishCompareCandidateToResearch({ investigationId: investigation.id, projection: projection.comparePair, resolveExecutionId, researchBridgeRuntime: runtime });
pass(second.anchorId === first.anchorId && runtime.getDesk().entries.length === 1, "two publication attempts yield one Research entry");
pass(runtime.getRevision() === 1, "duplicate publication does not increment Research runtime revision");

const snapshot = createGuestWorkspaceSessionSnapshot({ ownership: { kind: "GUEST", operatorId: "guest-narrative", establishedAt: "2026-09-03T00:00:00.000Z" }, workspace: { operator: { activeMode: "OVERVIEW" as any, layoutMode: "NORMAL" as any }, computational: { activeLayers: [] } }, research: { desk: runtime.getDesk() }, authoring: {} });
const roundTrip: unknown = JSON.parse(JSON.stringify(snapshot));
pass(isGuestWorkspaceSessionSnapshot(roundTrip), "Guest snapshot validation and JSON round-trip preserve the anchor contract");
if (!isGuestWorkspaceSessionSnapshot(roundTrip)) throw new Error("unreachable");
const restored = new ResearchBridgeRuntime(); restored.restoreDesk(roundTrip.research.desk);
pass(JSON.stringify(restored.getDesk()) === JSON.stringify(runtime.getDesk()), "restoration preserves the Research entry");
pass(restored.getDesk().entries[0]?.anchor.anchorId === expectedAnchorId, "restoration preserves deterministic anchor identity");

pass(JSON.stringify(investigation) === investigationBefore, "Investigation identity, operational revision, and graph topology remain unchanged");
pass(JSON.stringify(knowledge) === knowledgeBefore, "canonical Knowledge objects remain unchanged");
pass(JSON.stringify(selection) === selectionBefore, "active selection remains unchanged");
pass(JSON.stringify(evaluation) === evaluationBefore, "Resolve evaluation and execution inputs remain unchanged");
pass(JSON.stringify({ investigation, knowledge, evaluations, selection }) === inputsBefore, "all caller-owned inputs remain immutable");
const workspaceSurface = readFileSync("src/surfaces/WorkspaceSurface.tsx", "utf8");
pass(/useState\(false\)/.test(workspaceSurface) && !/publishCompareCandidateToResearch[\s\S]*setResearchInboxExpanded/.test(readFileSync("src/narrative/components/NarrativeWorkspace.tsx", "utf8")), "Research dock remains collapsed until explicitly opened");
pass(investigation.currentRevisionId === investigation.revisions[0]?.id && investigation.revisions.length === 1, "current operational revision remains exact");

console.log(`\nPASS VerifyNarrativeResearchPublication — ${passCount} assertions verified`);
