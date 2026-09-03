import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CANONICAL_EVENTS } from "../../src/canonical/runtimeCorpus.ts";
import { SystemCanonAdapter } from "../../src/federation/adapters/SystemCanonAdapter.ts";
import { importInvestigationIntoWorkspace } from "../../src/federation/services/importInvestigation.ts";
import { adaptSystemCanonToKnowledge } from "../../src/knowledge/ingestion/SystemCanonKnowledgeAdapter.ts";
import { resolveCurrentOperationalRevision } from "../../src/investigation/revision/OperationalGraphRevision.ts";
import { WorkspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntime.ts";

function snapshot(runtime: WorkspaceRuntime): string {
  return JSON.stringify(runtime.getState());
}

function assertRejectedWithoutMutation(investigation: Parameters<WorkspaceRuntime["activateInvestigation"]>[0]): void {
  const runtime = new WorkspaceRuntime();
  const before = snapshot(runtime);
  let notifications = 0;
  runtime.subscribe(() => { notifications += 1; });
  assert.throws(() => runtime.activateInvestigation(investigation));
  assert.equal(snapshot(runtime), before);
  assert.equal(notifications, 0);
}

async function run(): Promise<void> {
  const adapter = new SystemCanonAdapter();
  const knowledge = adaptSystemCanonToKnowledge(CANONICAL_EVENTS);
  const knowledgeBefore = JSON.stringify(knowledge);
  const runtime = new WorkspaceRuntime();
  const before = snapshot(runtime);
  assert.equal(runtime.getActiveInvestigation(), undefined);
  assert.equal(runtime.getWorkspace(), undefined);
  runtime.setSelection({ kind: "NODE", nodeId: "STALE-NODE" });

  let notifications = 0;
  let incompleteObserved = false;
  const unsubscribe = runtime.subscribe(() => {
    notifications += 1;
    const active = runtime.getActiveInvestigation();
    if (active && (active.revisions.length === 0 || active.currentRevisionId === undefined)) incompleteObserved = true;
  });

  const result = await importInvestigationIntoWorkspace(adapter, "E-TICTAC-2004", runtime, knowledge);
  unsubscribe();
  const active = runtime.getActiveInvestigation();
  assert.equal(active, result.investigation);
  assert.equal(runtime.getWorkspace(), active!.workspace);
  assert.equal(notifications, 1);
  assert.equal(incompleteObserved, false);
  assert.equal(active!.revisions.length, 1);
  assert.equal(active!.currentRevisionId, "REV-0001");
  const revision = resolveCurrentOperationalRevision(active!);
  assert.equal(revision.id, "REV-0001");
  assert.equal(revision.revisionNumber, 1);
  assert.equal(revision.timestamp, active!.updatedAt);
  assert.equal(revision.manifold.graph.nodes.length, 16);
  assert.equal(revision.manifold.graph.edges.length, 13);
  assert.equal(revision.manifold.graph.nodes.filter(node => node.type === "EVENT" && node.metadata?.sourceId === "E-TICTAC-2004").length, 1);
  assert.equal(active!.workspace.focused_event_id, "E-TICTAC-2004");
  assert.equal(runtime.getSelection(), undefined);
  assert.equal(JSON.stringify(knowledge), knowledgeBefore);

  const secondRuntime = new WorkspaceRuntime();
  const second = await importInvestigationIntoWorkspace(adapter, "E-TICTAC-2004", secondRuntime, [...knowledge].reverse());
  assert.equal(second.investigation.id, result.investigation.id);
  assert.equal(second.investigation.currentRevisionId, result.investigation.currentRevisionId);
  assert.deepEqual(second.investigation.revisions[0]!.manifold.graph, result.investigation.revisions[0]!.manifold.graph);
  secondRuntime.activateInvestigation(second.investigation);
  assert.equal(secondRuntime.getActiveInvestigation()!.revisions.length, 1);

  const revisionless = { ...result.investigation, currentRevisionId: undefined, revisions: [] };
  assertRejectedWithoutMutation(revisionless);
  const unknownPointer = Object.freeze({ ...result.investigation, currentRevisionId: "REV-UNKNOWN" });
  assertRejectedWithoutMutation(unknownPointer);

  const malformedGraph = JSON.parse(JSON.stringify(result.investigation));
  malformedGraph.revisions[0].manifold.graph.edges[0].source = "NODE-MISSING";
  Object.freeze(malformedGraph.revisions[0].manifold.graph.nodes);
  Object.freeze(malformedGraph.revisions[0].manifold.graph.edges);
  Object.freeze(malformedGraph.revisions[0].manifold.graph);
  Object.freeze(malformedGraph.revisions[0].manifold.activeLayers);
  Object.freeze(malformedGraph.revisions[0].manifold);
  Object.freeze(malformedGraph.revisions[0]);
  Object.freeze(malformedGraph.revisions);
  assertRejectedWithoutMutation(malformedGraph);
  assert.notEqual(before.length, 0);

  const serviceSource = readFileSync(new URL("../../src/federation/services/importInvestigation.ts", import.meta.url), "utf8");
  const runtimeSource = readFileSync(new URL("../../src/workspace/runtime/WorkspaceRuntime.ts", import.meta.url), "utf8");
  assert.match(serviceSource, /materializeInitialOperationalRevision/);
  assert.doesNotMatch(serviceSource, /Nimitz-specific|if\s*\([^)]*E-TICTAC-2004/);
  assert.doesNotMatch(serviceSource, /node\.label|investigation\.name|Date\.now|new Date/);
  assert.match(runtimeSource, /Legacy Guest restoration compatibility boundary/);

  console.log("VerifyRevisionCompleteInvestigationActivation: PASS");
}

void run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
