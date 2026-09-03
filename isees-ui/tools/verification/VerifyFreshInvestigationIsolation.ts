import { readFileSync } from "node:fs";
import { buildKnowledgeBootstrapPopulation } from "../../src/knowledge/ingestion/KnowledgeRuntimeBootstrap";
import { buildCanonicalInvestigationGraph } from "../../src/intelligence/selection/CanonicalInvestigationGraph";
import {
  resolveCoherentInvestigationSelection,
  resolveCurrentInvestigationExecution,
} from "../../src/intelligence/selection/InvestigationSelectionCoherence";
import { DEFAULT_INVESTIGATION } from "../../src/investigation/defaultInvestigation";
import { WorkspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntime";
import type { Investigation } from "../../src/investigation/investigationTypes";
import type { ResolveExecutionRecord } from "../../src/resolve/runtime/ResolveRuntimeTypes";
import {
  materializeInitialOperationalRevision,
  resolveCurrentOperationalRevision,
  validateOperationalRevisionInvestigation,
} from "../../src/investigation/revision/OperationalGraphRevision";
import { ResearchBridgeRuntime } from "../../src/research/ResearchBridgeRuntime";
import { AuthorDocumentRuntime } from "../../src/author/runtime/AuthorDocumentRuntime";
import { createGuestWorkspaceSnapshotFromRuntimeState } from "../../src/workspace/persistence/GuestWorkspaceSessionSnapshotFactory";
import { restoreGuestWorkspaceSessionIntoRuntimes } from "../../src/workspace/persistence/GuestWorkspaceSessionRestorer";

let passes = 0;
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(`VERIFICATION FAILED: ${message}`);
  console.log(`PASS ${++passes} — ${message}`);
}

const source = (path: string) => readFileSync(path, "utf8");
const explore = source("src/investigationControl/ExplorePanel.tsx");
const radar = source("src/components/EventRadar.tsx");
const overview = source("src/workspace/surfaces/OverviewWorkspace.tsx");
const workspaceRuntimeSource = source("src/workspace/runtime/WorkspaceRuntime.ts");
const restorer = source("src/workspace/persistence/GuestWorkspaceSessionRestorer.ts");
const snapshotFactory = source("src/workspace/persistence/GuestWorkspaceSessionSnapshotFactory.ts");
const rightPanel = source("src/components/RightPanel.tsx");
const note = source("docs/cognitive-canon/SC-004_Investigation_Control.md");

assert(!explore.includes("EventRadar") && !explore.includes("Live Event Intake"), "V1 Explore composition mounts no active monitoring fixtures");
assert(radar.includes("e.active") && !explore.includes("<EventRadar"), "legacy fixture ACTIVE state remains dormant and cannot appear by default");
assert(!overview.includes("LIVE WATCH") && !explore.includes("LIVE WATCH"), "Live Watch is absent from the operational V1 presentation");
assert(overview.includes('label="Imported Cases"') && overview.includes("imported_events"), "Imported Cases remains authoritative Investigation membership");
assert(!explore.includes("monitored event") && !explore.includes("Radar Summary"), "canonical corpus events are not presented as monitored or active");
assert(!explore.includes("GraphDiagnostics") && !explore.includes("CorpusResolutionPanel") && !explore.includes("RESOLUTION ANALYSIS"), "legacy corpus analysis remains dormant until explicit Resolve");

const knowledgeObjects = buildKnowledgeBootstrapPopulation();
const investigation: Investigation = {
  ...DEFAULT_INVESTIGATION,
  id: "investigation:fresh-tictac",
  workspace: {
    ...DEFAULT_INVESTIGATION.workspace,
    imported_events: [{ event_id: "E-TICTAC-2004", source: "SYSTEM_CANON" }],
    focused_event_id: "E-TICTAC-2004",
  },
};
const graph = buildCanonicalInvestigationGraph(knowledgeObjects, "system:event:E-TICTAC-2004");
assert(graph.nodes.length === 16 && graph.edges.length === 13 && graph.nodes.filter(node => node.type === "EVENT").length === 3, "operational graph remains 16 nodes, 13 edges, and 3 events");
const focusedNode = graph.nodes.find(node => node.id === "system:event:E-TICTAC-2004");
assert(focusedNode, "focused imported EVENT resolves in canonical Knowledge without importing the corpus");

const operationalInvestigation = materializeInitialOperationalRevision(investigation, knowledgeObjects);
const investigationBeforeSelection = JSON.stringify(operationalInvestigation);
const knowledgeBeforeSelection = JSON.stringify(knowledgeObjects);
const revisionBeforeSelection = JSON.stringify(operationalInvestigation.revisions[0]);
const graphBeforeSelection = JSON.stringify(graph);

const rafNodes = operationalInvestigation.revisions[0]!.manifold.graph.nodes.filter(node => node.id === "system:entity:raf-bentwaters");
assert(rafNodes.length === 1, "RAF Bentwaters exists exactly once in the current operational revision");
const rafSelection = { kind: "NODE" as const, nodeId: "system:entity:raf-bentwaters" };
assert(resolveCoherentInvestigationSelection(operationalInvestigation, knowledgeObjects, rafSelection) === rafSelection, "RAF selection returns the unchanged canonical NODE ID");

const nimitzSelection = { kind: "NODE" as const, nodeId: "system:entity:uss-nimitz-carrier-group" };
assert(resolveCoherentInvestigationSelection(operationalInvestigation, knowledgeObjects, nimitzSelection) === nimitzSelection, "Nimitz selection still works");
const hawkeyeSelection = { kind: "NODE" as const, nodeId: "system:entity:e2-hawkeye-sensor-grid" };
assert(resolveCoherentInvestigationSelection(operationalInvestigation, knowledgeObjects, hawkeyeSelection) === hawkeyeSelection, "E2 Hawkeye Sensor Grid selection still works");
const rendleshamSelection = { kind: "NODE" as const, nodeId: "system:event:E-RENDLESHAM-1980" };
assert(resolveCoherentInvestigationSelection(operationalInvestigation, knowledgeObjects, rendleshamSelection) === undefined, "Rendlesham Forest Incident remains rejected as a non-focused EVENT");
assert(resolveCoherentInvestigationSelection(operationalInvestigation, knowledgeObjects, { kind: "NODE", nodeId: "system:entity:missing" }) === undefined, "missing node IDs fail closed");
assert(resolveCoherentInvestigationSelection(investigation, knowledgeObjects, rafSelection) === undefined, "missing operational revision state fails closed");
assert(resolveCoherentInvestigationSelection({ ...operationalInvestigation, currentRevisionId: "REV-STALE" }, knowledgeObjects, rafSelection) === undefined, "stale operational revision state fails closed");

const focusEdge = graph.edges.find(edge => edge.source === focusedNode.id || edge.target === focusedNode.id);
assert(focusEdge, "focused EVENT has a valid MANIFOLD relationship for coherence verification");
const validNodeId = focusEdge.source === focusedNode.id ? focusEdge.target : focusEdge.source;
const validNodeSelection = { kind: "NODE" as const, nodeId: validNodeId };
assert(resolveCoherentInvestigationSelection(operationalInvestigation, knowledgeObjects, validNodeSelection) === validNodeSelection, "valid focused-event MANIFOLD selection remains supported");

const unrelatedEdge = graph.edges.find(edge => edge.source !== focusedNode.id && edge.target !== focusedNode.id && (edge.source.includes("RENDLESHAM") || edge.target.includes("RENDLESHAM") || edge.source.includes("ROOSEVELT") || edge.target.includes("ROOSEVELT")));
assert(unrelatedEdge, "unrelated canonical edge fixture is available for stale-selection verification");
assert(resolveCoherentInvestigationSelection(operationalInvestigation, knowledgeObjects, { kind: "EDGE", edgeId: unrelatedEdge.id }) === undefined, "EDGE behavior is unchanged for selection unrelated to focused EVENT");
const focusedEdgeSelection = { kind: "EDGE" as const, edgeId: focusEdge.id };
assert(resolveCoherentInvestigationSelection(operationalInvestigation, knowledgeObjects, focusedEdgeSelection) === focusedEdgeSelection, "EDGE behavior is unchanged for selection connected to focused EVENT");

const validCandidate = { kind: "CANDIDATE" as const, candidateId: "candidate:focus:other", evaluationId: "evaluation:focus:other", leftKnowledgeObjectId: focusedNode.id, rightKnowledgeObjectId: "system:event:E-ROOSEVELT-2015" };
assert(resolveCoherentInvestigationSelection(operationalInvestigation, knowledgeObjects, validCandidate) === validCandidate, "CANDIDATE behavior is unchanged for a focused-event pair");
const staleCandidate = { ...validCandidate, leftKnowledgeObjectId: "system:event:E-RENDLESHAM-1980" };
assert(resolveCoherentInvestigationSelection(operationalInvestigation, knowledgeObjects, staleCandidate) === undefined, "CANDIDATE behavior is unchanged for unrelated Resolve residue");

assert(JSON.stringify(operationalInvestigation) === investigationBeforeSelection, "selection resolution does not mutate Investigation input");
assert(JSON.stringify(knowledgeObjects) === knowledgeBeforeSelection, "selection resolution does not mutate Knowledge input");
assert(JSON.stringify(operationalInvestigation.revisions[0]) === revisionBeforeSelection, "selection resolution does not mutate the current revision");
assert(JSON.stringify(graph) === graphBeforeSelection, "selection resolution does not mutate the graph input");

const runtimeInvestigation = operationalInvestigation;
const runtime = new WorkspaceRuntime();
runtime.activateInvestigation(runtimeInvestigation);
runtime.setSelection(validCandidate);
const nextInvestigation = materializeInitialOperationalRevision(
  { ...investigation, id: "investigation:genuinely-different" },
  knowledgeObjects,
);
runtime.activateInvestigation(nextInvestigation);
assert(runtime.getSelection() === undefined, "different-Investigation activation clears transient Workspace selection");
assert(workspaceRuntimeSource.includes("selection:") && !workspaceRuntimeSource.includes("deleteKnowledge") && !workspaceRuntimeSource.includes("KnowledgeObjectRuntime"), "activation clears no canonical Knowledge");
assert(!workspaceRuntimeSource.includes("ResearchBridge") && !workspaceRuntimeSource.includes("AuthorDocument"), "activation clears neither Research nor Author state");
assert(restorer.includes("restoreResearch") && restorer.includes("restoreAuthoring") && snapshotFactory.includes("Interaction-only state is deliberately excluded"), "Guest restoration preserves Research/Author state and does not restore transient selection");

const guestIdentity = {
  status: "READY" as const,
  identity: {
    operatorId: "guest:fresh-investigation-isolation",
    kind: "GUEST" as const,
    establishedAt: "2026-09-03T12:00:00.000Z",
  },
  persistence: "SESSION" as const,
  revision: 1,
};
const sourceWorkspaceRuntime = new WorkspaceRuntime();
const sourceResearchRuntime = new ResearchBridgeRuntime();
const sourceAuthorRuntime = new AuthorDocumentRuntime();
sourceWorkspaceRuntime.activateInvestigation(operationalInvestigation);
sourceWorkspaceRuntime.setSelection(nimitzSelection);
sourceResearchRuntime.bridge({
  investigationId: operationalInvestigation.id,
  graph: { type: "NODE", id: rafSelection.nodeId },
  graphRevision: operationalInvestigation.revisions[0]!.revisionNumber,
});
const sourceResearchDesk = JSON.stringify(sourceResearchRuntime.getDesk());
const guestSnapshot = createGuestWorkspaceSnapshotFromRuntimeState({
  identity: guestIdentity,
  workspace: sourceWorkspaceRuntime.getState(),
  researchDesk: sourceResearchRuntime.getDesk(),
  authoring: sourceAuthorRuntime.getState(),
  createdAt: "2026-09-03T12:00:00.000Z",
  updatedAt: "2026-09-03T12:00:00.000Z",
});
const browserRestoredSnapshot = JSON.parse(JSON.stringify(guestSnapshot)) as typeof guestSnapshot;
const restoredWorkspaceRuntime = new WorkspaceRuntime();
const restoredResearchRuntime = new ResearchBridgeRuntime();
const restoredAuthorRuntime = new AuthorDocumentRuntime();
restoreGuestWorkspaceSessionIntoRuntimes({
  snapshot: browserRestoredSnapshot,
  identity: guestIdentity,
  workspaceRuntime: restoredWorkspaceRuntime,
  researchBridgeRuntime: restoredResearchRuntime,
  authorDocumentRuntime: restoredAuthorRuntime,
});
assert(restoredWorkspaceRuntime.getSelection() === undefined, "browser-restored Guest workspace excludes transient selection");
restoredWorkspaceRuntime.setSelection(rafSelection);
const restoredInvestigation = restoredWorkspaceRuntime.getActiveInvestigation();
const restoredRafSelection = resolveCoherentInvestigationSelection(
  restoredInvestigation,
  knowledgeObjects,
  restoredWorkspaceRuntime.getSelection(),
);
assert(restoredRafSelection === rafSelection, "browser-restored RAF selection remains admitted by RightPanel coherence");
validateOperationalRevisionInvestigation(restoredInvestigation!);
const restoredCurrentRevision = resolveCurrentOperationalRevision(restoredInvestigation!);
assert(restoredCurrentRevision.id === restoredInvestigation!.currentRevisionId, "browser-restored current operational revision passes validation");
assert(restoredCurrentRevision.manifold.graph.nodes.filter(node => node.id === rafSelection.nodeId).length === 1, "RAF Bentwaters exists exactly once in the browser-restored current revision");
assert(JSON.stringify(restoredResearchRuntime.getDesk()) === sourceResearchDesk, "browser-restored Research Inbox state remains intact");

const oldExecution = { input: { investigation: { ...investigation, id: "investigation:old" } } } as ResolveExecutionRecord;
assert(resolveCurrentInvestigationExecution(investigation, oldExecution) === undefined, "prior Investigation Resolve product is dormant before a fresh Resolve run");
assert(rightPanel.includes("resolveCoherentInvestigationSelection") && rightPanel.includes("resolveCurrentInvestigationExecution"), "Selection Intelligence enforces Investigation and Resolve coherence");

for (const path of ["src/investigationControl/ExplorePanel.tsx", "src/intelligence/selection/InvestigationSelectionCoherence.ts", "src/components/RightPanel.tsx", "src/components/workspace/ManifoldProjectionStatus.tsx", "src/compare/components/CompareSetController.tsx", "src/compare/components/CompareWorkspace.tsx", "src/manifold/components/PrimaryInvestigationManifold.tsx", "src/workspace/surfaces/OverviewWorkspace.tsx"]) {
  const text = source(path);
  assert(!/setInterval|setTimeout|\bfetch\s*\(|WebSocket|XMLHttpRequest/.test(text), `${path} adds no monitoring, timer, polling, or network call`);
}

for (const phrase of ["opt-in subsystem", "explicit", "Import into Investigation", "never become canonical Knowledge automatically", "never trigger", "no operational implementation is authorized"]) {
  assert(note.includes(phrase), `Live Watch future note contains boundary: ${phrase}`);
}
assert(note.includes("Close/Restart Investigation") && note.includes("unsaved Studio work"), "future note records the remaining safe lifecycle gap");
assert(source("tools/verification/VerifyLayersResponsiveWorkspace.ts").length > 0 && source("tools/verification/VerifyLayersNavigatorCounts.ts").length > 0 && source("src/layers/components/LayersNavigatorCounts.ts").length > 0, "authorized A11 responsive and navigator-count work remains intact");

console.log(`P57-UI-A11-I5B VERIFIED — ${passes} PASS`);
