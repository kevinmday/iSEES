import { readFileSync } from "node:fs";
import { buildKnowledgeBootstrapPopulation } from "../../src/knowledge/ingestion/KnowledgeRuntimeBootstrap";
import { buildCanonicalInvestigationGraph } from "../../src/intelligence/selection/CanonicalInvestigationGraph";
import {
  resolveCoherentInvestigationSelection,
  resolveCurrentInvestigationExecution,
} from "../../src/intelligence/selection/InvestigationSelectionCoherence";
import { resolveCanonicalSelectionIntelligence } from "../../src/intelligence/selection/CanonicalSelectionIntelligence";
import { DEFAULT_INVESTIGATION } from "../../src/investigation/defaultInvestigation";
import { WorkspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntime";
import { WorkspaceMode } from "../../src/workspace/runtime/WorkspaceRuntimeTypes";
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
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) freeze(child);
    Object.freeze(value);
  }
  return value;
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
const rendleshamNodes = operationalInvestigation.revisions[0]!.manifold.graph.nodes.filter(node => node.id === rendleshamSelection.nodeId);
assert(rendleshamNodes.length === 1, "Rendlesham exists exactly once in the active current revision");
assert(rendleshamNodes[0]!.type === "EVENT", "Rendlesham is a canonical EVENT node");
assert(rendleshamNodes[0]!.id === "system:event:E-RENDLESHAM-1980", "Rendlesham retains its exact canonical NODE ID");
assert(resolveCoherentInvestigationSelection(operationalInvestigation, knowledgeObjects, rendleshamSelection) === rendleshamSelection, "revision-owned non-focused EVENT selection returns unchanged");
assert(operationalInvestigation.workspace.focused_event_id === "E-TICTAC-2004", "Rendlesham inspection leaves Nimitz as the focused EVENT");
assert(operationalInvestigation.id === "investigation:fresh-tictac", "Rendlesham inspection leaves the active Investigation identity unchanged");
assert(operationalInvestigation.currentRevisionId === operationalInvestigation.revisions[0]!.id, "Rendlesham inspection leaves currentRevisionId unchanged");
assert(operationalInvestigation.revisions.length === 1, "Rendlesham inspection leaves revision count unchanged");
assert(operationalInvestigation.revisions[0]!.manifold.graph.nodes.length === 16, "Rendlesham inspection leaves node count unchanged");
assert(operationalInvestigation.revisions[0]!.manifold.graph.edges.length === 13, "Rendlesham inspection leaves edge count unchanged");
assert(JSON.stringify(operationalInvestigation) === investigationBeforeSelection, "Rendlesham inspection does not mutate Investigation input");
assert(JSON.stringify(knowledgeObjects) === knowledgeBeforeSelection, "Rendlesham inspection does not mutate Knowledge input");
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
for (const staleSelection of [rafSelection, focusedEdgeSelection]) {
  const atomicRuntime = new WorkspaceRuntime();
  atomicRuntime.activateInvestigation(operationalInvestigation);
  atomicRuntime.setSelection(staleSelection);
  const observations: Array<{ investigationId: string | undefined; selection: unknown }> = [];
  atomicRuntime.subscribe(() => observations.push({
    investigationId: atomicRuntime.getActiveInvestigation()?.id,
    selection: atomicRuntime.getSelection(),
  }));
  atomicRuntime.activateInvestigation(nextInvestigation);
  assert(atomicRuntime.getSelection() === undefined, `new Investigation atomically clears stale ${staleSelection.kind} selection`);
  assert(!observations.some(observation => observation.investigationId === nextInvestigation.id && observation.selection !== undefined), `subscribers never observe the new Investigation with old ${staleSelection.kind} selection`);
}
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
const restoredIntelligence = resolveCanonicalSelectionIntelligence({
  graph: restoredCurrentRevision.manifold.graph,
  selection: rafSelection,
  investigationId: restoredInvestigation!.id,
  manifoldRevisionId: restoredCurrentRevision.id,
});
assert(restoredIntelligence.kind === "NODE", "restored Investigation resolves intelligence from its currentRevisionId graph");
assert(JSON.stringify(restoredResearchRuntime.getDesk()) === sourceResearchDesk, "browser-restored Research Inbox state remains intact");
assert(restoredResearchRuntime.projectInvestigation({ investigationId: operationalInvestigation.id }).entries.length === 1, "reopened Investigation restores its Research projection");
assert(restoredResearchRuntime.projectInvestigation({ investigationId: nextInvestigation.id }).entries.length === 0, "fresh Investigation sees no prior Research anchors");
assert(restoredResearchRuntime.getDesk().entries.length === 1, "hiding prior Research does not delete stored anchors");
assert(restoredResearchRuntime.projectInvestigation({}).status === "NO_ACTIVE_INVESTIGATION", "missing active Investigation yields an explicit empty Research projection");

const oldExecution = { input: { investigation: { ...investigation, id: "investigation:old" } } } as ResolveExecutionRecord;
assert(resolveCurrentInvestigationExecution(investigation, oldExecution) === undefined, "prior Investigation Resolve product is dormant before a fresh Resolve run");
assert(rightPanel.includes("resolveCoherentInvestigationSelection") && rightPanel.includes("resolveCurrentInvestigationExecution"), "Selection Intelligence enforces Investigation and Resolve coherence");
assert(rightPanel.includes('"NOT COMPUTED"') || source("src/manifold/selection/selectionIntelligenceResolver.ts").includes('"NOT COMPUTED"'), "unavailable edge metrics project as NOT COMPUTED");
assert(rightPanel.includes("metricAvailability.confidence") && rightPanel.includes("metricAvailability.geo"), "each edge metric consumes its own structured availability entry");
assert(rightPanel.includes("aria-label={accessibleName}") && rightPanel.includes('<Tooltip text={unavailableExplanation} placement="left">'), "unavailable metric information control is keyboard named and requests leftward placement from the established tooltip primitive");
const tooltip = source("src/components/Tooltip.tsx");
assert(tooltip.includes('placement = "right"') && tooltip.includes('placement?: "left" | "right"'), "shared Tooltip preserves its existing rightward behavior by default");
assert(tooltip.includes("onMouseEnter={() => setHovered(true)}") && tooltip.includes("onMouseLeave={() => setHovered(false)}") && tooltip.includes("onFocus={() => setFocused(true)}") && tooltip.includes("onBlur={() => setFocused(false)}") && tooltip.includes("hovered || focused"), "shared Tooltip remains visible for pointer hover or keyboard focus and closes after both leave");
assert(tooltip.includes("width: opensLeft ? 232 : 340") && tooltip.includes('whiteSpace: "normal"') && tooltip.includes('overflowWrap: "anywhere"'), "leftward Tooltip uses a contained 232px width with normal, safe text wrapping");
assert(tooltip.includes('right: opensLeft ? 0 : "auto"'), "leftward Tooltip remains right-anchored to its information control");
assert(!tooltip.includes("createPortal") && !tooltip.includes("ReactDOM"), "shared Tooltip remains inline and introduces no portal");
for (const forbidden of ["setTimeout", "setInterval", "addEventListener", "removeEventListener", "getBoundingClientRect", "ResizeObserver", "MutationObserver", "fetch(", "XMLHttpRequest", "WebSocket", "localStorage", "sessionStorage", "indexedDB", "setSelection", "runResolve", "executeResolve", "invokeRex", "publishResearch"]) {
  assert(!tooltip.includes(forbidden), `shared Tooltip exposes no ${forbidden} capability`);
}
assert(rightPanel.includes("This metric is unavailable, not zero.") && rightPanel.includes("No completed Resolve computation exists for the active investigation revision."), "unavailable metric guidance distinguishes absent computation from zero with a deterministic reason");
assert(rightPanel.includes("hasUnavailableMetrics &&") && rightPanel.includes("Metric intelligence incomplete"), "metric regrounding message renders only when an edge metric is unavailable");
assert(rightPanel.includes("workspaceRuntime.setActiveMode(WorkspaceMode.COMPARE)") && !rightPanel.includes("setActiveMode(WorkspaceMode.COMPARE);"), "Go to Compare uses the established Workspace mode authority without automatic switching");

const compareRuntime = new WorkspaceRuntime();
compareRuntime.activateInvestigation(operationalInvestigation);
compareRuntime.setSelection(focusedEdgeSelection);
const compareInvestigationBefore = JSON.stringify(compareRuntime.getActiveInvestigation());
const compareSelectionBefore = compareRuntime.getSelection();
const compareResearchBefore = JSON.stringify(sourceResearchRuntime.getDesk());
compareRuntime.setActiveMode(WorkspaceMode.COMPARE);
assert(compareRuntime.getState().operator.activeMode === WorkspaceMode.COMPARE, "Go to Compare authority changes only the established Workspace mode");
assert(compareRuntime.getSelection() === compareSelectionBefore && JSON.stringify(compareRuntime.getActiveInvestigation()) === compareInvestigationBefore, "Go to Compare authority preserves selection, graph, and Investigation state");
assert(JSON.stringify(sourceResearchRuntime.getDesk()) === compareResearchBefore, "Go to Compare authority performs no Research mutation");
const edgeInspectorSource = rightPanel.slice(rightPanel.indexOf("function EdgeInspector"), rightPanel.indexOf("function InspectorSection"));
for (const forbidden of ["runResolve", "executeResolve", "setSelection", "invokeRex", "publishResearch", "fetch(", "localStorage", "sessionStorage", "indexedDB"]) {
  assert(!edgeInspectorSource.includes(forbidden), `Go to Compare and metric feedback expose no ${forbidden} capability`);
}

const currentGraph = operationalInvestigation.revisions[0]!.manifold.graph;
const retainedEdge = currentGraph.edges.find(edge => edge.source === focusedNode.id || edge.target === focusedNode.id)!;
const retainedIds = new Set([retainedEdge.source, retainedEdge.target]);
const staleNode = currentGraph.nodes.find(node => !retainedIds.has(node.id))!;
const staleEdge = currentGraph.edges.find(edge => edge.id !== retainedEdge.id)!;
const narrowedGraph = freeze({
  nodes: currentGraph.nodes.filter(node => retainedIds.has(node.id)),
  edges: [retainedEdge],
  statistics: { ...currentGraph.statistics, nodeCount: 2, edgeCount: 1 },
});
const priorRevision = operationalInvestigation.revisions[0]!;
const laterRevision = freeze({
  id: "REV-0002",
  revisionNumber: 2,
  timestamp: "2026-09-17T12:00:00.000Z",
  operator: "SYSTEM",
  parentRevisionId: priorRevision.id,
  branch: "MAIN" as const,
  message: "Validated narrowed operational graph",
  manifold: {
    ...priorRevision.manifold,
    id: `operational:${encodeURIComponent(operationalInvestigation.id)}:REV-0002`,
    timestamp: "2026-09-17T12:00:00.000Z",
    graph: narrowedGraph,
  },
});
const laterInvestigation = freeze({
  ...operationalInvestigation,
  currentRevisionId: laterRevision.id,
  revisions: [priorRevision, laterRevision],
});
validateOperationalRevisionInvestigation(laterInvestigation);
const revisionRuntime = new WorkspaceRuntime();
revisionRuntime.activateInvestigation(operationalInvestigation);
revisionRuntime.setSelection(rafSelection);
revisionRuntime.activateInvestigation(laterInvestigation);
assert(revisionRuntime.getSelection() === undefined, "later validated revision activation clears prior selection");
assert(resolveCoherentInvestigationSelection(laterInvestigation, knowledgeObjects, { kind: "NODE", nodeId: staleNode.id }) === undefined, "reintroduced stale NODE from an older revision fails closed");
assert(resolveCoherentInvestigationSelection(laterInvestigation, knowledgeObjects, { kind: "EDGE", edgeId: staleEdge.id }) === undefined, "reintroduced stale EDGE from an older revision fails closed");
const retainedNodeSelection = { kind: "NODE" as const, nodeId: retainedEdge.source };
const retainedEdgeSelection = { kind: "EDGE" as const, edgeId: retainedEdge.id };
assert(resolveCoherentInvestigationSelection(laterInvestigation, knowledgeObjects, retainedNodeSelection) === retainedNodeSelection, "retained NODE resolves from the new revision");
assert(resolveCoherentInvestigationSelection(laterInvestigation, knowledgeObjects, retainedEdgeSelection) === retainedEdgeSelection, "retained EDGE resolves from the new revision");

const revisionSpecific = resolveCanonicalSelectionIntelligence({ graph: narrowedGraph, selection: retainedNodeSelection, investigationId: laterInvestigation.id, manifoldRevisionId: laterRevision.id });
const priorSpecific = resolveCanonicalSelectionIntelligence({ graph: currentGraph, selection: retainedNodeSelection, investigationId: laterInvestigation.id, manifoldRevisionId: priorRevision.id });
assert(revisionSpecific.kind === "NODE" && priorSpecific.kind === "NODE" && revisionSpecific.intelligence.connectionCount !== priorSpecific.intelligence.connectionCount, "same Knowledge plus different revision graph produces revision-specific intelligence");
const unchangedByKnowledge = resolveCanonicalSelectionIntelligence({ graph: narrowedGraph, selection: retainedNodeSelection, investigationId: laterInvestigation.id, manifoldRevisionId: laterRevision.id });
assert(JSON.stringify(unchangedByKnowledge) === JSON.stringify(revisionSpecific), "different Knowledge plus the same revision graph cannot change selection intelligence");
assert(resolveCoherentInvestigationSelection(investigation, knowledgeObjects, retainedNodeSelection) === undefined, "revisionless Investigation produces no graph intelligence");

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
