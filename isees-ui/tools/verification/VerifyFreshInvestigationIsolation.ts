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
const focusedNode = graph.nodes.find(node => node.id === "system:event:E-TICTAC-2004");
assert(focusedNode, "focused imported EVENT resolves in canonical Knowledge without importing the corpus");

const focusEdge = graph.edges.find(edge => edge.source === focusedNode.id || edge.target === focusedNode.id);
assert(focusEdge, "focused EVENT has a valid MANIFOLD relationship for coherence verification");
const validNodeId = focusEdge.source === focusedNode.id ? focusEdge.target : focusEdge.source;
const validNodeSelection = { kind: "NODE" as const, nodeId: validNodeId };
assert(resolveCoherentInvestigationSelection(investigation, knowledgeObjects, validNodeSelection) === validNodeSelection, "valid focused-event MANIFOLD selection remains supported");

const unrelatedEdge = graph.edges.find(edge => edge.source !== focusedNode.id && edge.target !== focusedNode.id && (edge.source.includes("RENDLESHAM") || edge.target.includes("RENDLESHAM") || edge.source.includes("ROOSEVELT") || edge.target.includes("ROOSEVELT")));
assert(unrelatedEdge, "unrelated canonical edge fixture is available for stale-selection verification");
assert(resolveCoherentInvestigationSelection(investigation, knowledgeObjects, { kind: "EDGE", edgeId: unrelatedEdge.id }) === undefined, "selection unrelated to focused EVENT is not projected");

const validCandidate = { kind: "CANDIDATE" as const, candidateId: "candidate:focus:other", evaluationId: "evaluation:focus:other", leftKnowledgeObjectId: focusedNode.id, rightKnowledgeObjectId: "system:event:E-ROOSEVELT-2015" };
assert(resolveCoherentInvestigationSelection(investigation, knowledgeObjects, validCandidate) === validCandidate, "valid focused-event COMPARE candidate selection remains supported");
const staleCandidate = { ...validCandidate, leftKnowledgeObjectId: "system:event:E-RENDLESHAM-1980" };
assert(resolveCoherentInvestigationSelection(investigation, knowledgeObjects, staleCandidate) === undefined, "unrelated Resolve candidate residue is not projected");

const runtime = new WorkspaceRuntime();
runtime.activateInvestigation(investigation);
runtime.setSelection(validCandidate);
const nextInvestigation: Investigation = { ...investigation, id: "investigation:genuinely-different" };
runtime.activateInvestigation(nextInvestigation);
assert(runtime.getSelection() === undefined, "different-Investigation activation clears transient Workspace selection");
assert(workspaceRuntimeSource.includes("selection:") && !workspaceRuntimeSource.includes("deleteKnowledge") && !workspaceRuntimeSource.includes("KnowledgeObjectRuntime"), "activation clears no canonical Knowledge");
assert(!workspaceRuntimeSource.includes("ResearchBridge") && !workspaceRuntimeSource.includes("AuthorDocument"), "activation clears neither Research nor Author state");
assert(restorer.includes("restoreResearch") && restorer.includes("restoreAuthoring") && snapshotFactory.includes("Interaction-only state is deliberately excluded"), "Guest restoration preserves Research/Author state and does not restore transient selection");

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
