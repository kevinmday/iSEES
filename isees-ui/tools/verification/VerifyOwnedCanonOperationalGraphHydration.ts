import assert from "node:assert/strict";
import { CANONICAL_EVENTS } from "../../src/canonical/runtimeCorpus.ts";
import { SystemCanonAdapter } from "../../src/federation/adapters/SystemCanonAdapter.ts";
import { adaptSystemCanonToKnowledge } from "../../src/knowledge/ingestion/SystemCanonKnowledgeAdapter.ts";
import { importCanonEventIntoOwnedInvestigation } from "../../src/investigation/continuity/OwnedCanonEventImport.ts";
import { AccountWorkspaceContinuityCoordinator } from "../../src/investigation/continuity/AccountWorkspaceContinuityCoordinator.ts";
import { ContinuityError, materializeEmptyOwnedInvestigation, parseOwnedActivationAggregate } from "../../src/investigation/continuity/OwnedInvestigationContinuity.ts";
import { resolveActiveOperationalGraphProjection } from "../../src/investigation/revision/OperationalGraphRevision.ts";
import { ResearchBridgeRuntime } from "../../src/research/ResearchBridgeRuntime.ts";
import { WorkspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntime.ts";
import { WorkspaceMode } from "../../src/workspace/runtime/WorkspaceRuntimeTypes.ts";
import type { AccountContinuityApi } from "../../src/investigation/continuity/AccountContinuityApi.ts";

const investigationId = "inv:owned-canon-hydration";
const eventId = "E-TICTAC-2004";
const timestamp = "2026-09-15T12:00:00.000Z";
const adapter = new SystemCanonAdapter();
const event = (await adapter.load()).find(item => item.canonical_event.event_id === eventId)!;
const knowledge = adaptSystemCanonToKnowledge(CANONICAL_EVENTS);
const canonBefore = JSON.stringify(CANONICAL_EVENTS);
let persisted: unknown;
let rexRequests = 0;

Object.defineProperty(globalThis, "document", { configurable: true, value: { cookie: "isees_csrf=owned-canon-token" } });

const emptyAggregate = {
  activationSchemaVersion: "owned-investigation-activation/v1", investigationId,
  title: "REX Local Browser Acceptance", objective: null, lifecycle: "ACTIVE",
  createdAt: timestamp, modifiedAt: timestamp, version: 0,
  aggregateSchemaVersion: "investigation-aggregate/v1", aggregateState: "EMPTY", aggregateRevision: 0,
  access: { kind: "RESEARCHER_OWNED" }, freshnessToken: "0:0",
  operationalState: { kind: "EMPTY", workspaceId: `workspace:${investigationId}`, focusedEventId: null, nodes: [], edges: [] },
};
const empty = materializeEmptyOwnedInvestigation(parseOwnedActivationAggregate(emptyAggregate, investigationId) as ReturnType<typeof parseOwnedActivationAggregate> & { aggregateState: "EMPTY" });
assert.equal(empty.id, investigationId);
assert.equal(empty.revisions.length, 0);
assert.deepEqual(empty.workspace.imported_events, []);

const transport: typeof fetch = async (input, init) => {
  const url = String(input);
  if (url.includes("/rex")) rexRequests += 1;
  const command = JSON.parse(String(init?.body)) as Record<string, unknown>;
  const workspace = command.workspace as Record<string, unknown>;
  const activation = {
    ...emptyAggregate, modifiedAt: timestamp, version: 1, aggregateState: "ADOPTED", aggregateRevision: 1, freshnessToken: "1:1",
    operationalState: {
      kind: "ADOPTED", workspaceId: `workspace:${investigationId}`, schemaVersion: "canon-event-import/v1",
      source: { kind: "SYSTEM_CANON", eventId, importedAt: timestamp }, title: emptyAggregate.title, objective: null,
      workspace, researchInbox: [{ anchorId: "research:preserved", order: 0, title: "Preserved source", canonicalSourceId: `NODE:${(workspace.nodes as { id: string }[])[1]!.id}` }], artifacts: [],
      viewState: command.viewState,
    },
  };
  if (!persisted) persisted = activation;
  return new Response(JSON.stringify({ investigationId, aggregateRevision: 1, duplicate: persisted !== activation, replayed: persisted !== activation, activation: persisted }), { status: persisted === activation ? 201 : 200, headers: { "Content-Type": "application/json" } });
};

const first = await importCanonEventIntoOwnedInvestigation({ investigation: empty, event, repository: adapter.repository, knowledge, expectedAggregateRevision: 0, idempotencyKey: "import-one", transport });
const activated = first.activation.investigation;
assert.equal(activated.id, investigationId);
assert.deepEqual(activated.workspace.imported_events, [{ event_id: eventId, source: "SYSTEM_CANON" }]);
assert.equal(activated.workspace.focused_event_id, eventId);
assert.equal(activated.revisions.length, 1);
assert.equal(activated.currentRevisionId, "REV-0001");
const graph = resolveActiveOperationalGraphProjection(activated);
assert.ok(graph.nodes.length > 1, "governed related nodes must be hydrated");
assert.ok(graph.edges.length > 0, "governed edges must be hydrated");
assert.equal(graph.nodes.filter(node => node.type === "EVENT" && node.metadata?.sourceId === eventId).length, 1);
const nodeIds = new Set(graph.nodes.map(node => node.id));
for (const edge of graph.edges) assert.ok(nodeIds.has(edge.source) && nodeIds.has(edge.target), `edge ${edge.id} endpoint must resolve`);

const inboxBefore = JSON.stringify(first.activation.researchDesk);
const runtime = new WorkspaceRuntime();
const research = new ResearchBridgeRuntime();
runtime.activateOwnedInvestigation(first.activation, () => research.activateOwnedInvestigation(first.activation));
assert.equal(resolveActiveOperationalGraphProjection(runtime.getActiveInvestigation()!).centerNodeId, graph.centerNodeId);
for (let cycle = 0; cycle < 3; cycle += 1) { runtime.setActiveMode(WorkspaceMode.MANIFOLD); assert.equal(runtime.getActiveMode(), WorkspaceMode.MANIFOLD); runtime.setActiveMode(WorkspaceMode.OVERVIEW); }

let principal = "account:a";
const api: AccountContinuityApi = {
  async restoreSession() { return { researcherId: principal, email: `${principal}@example.test`, sessionExpiresAt: "2026-09-16T12:00:00.000Z" }; },
  async fetchActivation(id) { if (principal !== "account:a" || id !== investigationId) throw new ContinuityError("INVESTIGATION_NOT_FOUND", "not found"); return parseOwnedActivationAggregate(persisted, id); },
  async logout() {},
};
const references = new Map([["account:a", investigationId]]);
const store = { read: (owner: string) => references.get(owner) ?? null, write: (owner: string, id: string) => { references.set(owner, id); } };
const refreshedRuntime = new WorkspaceRuntime();
const refreshedResearch = new ResearchBridgeRuntime();
const coordinator = new AccountWorkspaceContinuityCoordinator(api, refreshedRuntime, store, [refreshedResearch]);
await coordinator.restoreSession();
await coordinator.restoreLastActiveInvestigation();
const restoredGraph = resolveActiveOperationalGraphProjection(refreshedRuntime.getActiveInvestigation()!);
assert.equal(JSON.stringify(restoredGraph), JSON.stringify(graph));
refreshedRuntime.setActiveMode(WorkspaceMode.MANIFOLD);
assert.equal(refreshedRuntime.getActiveMode(), WorkspaceMode.MANIFOLD);
assert.equal(JSON.stringify(refreshedResearch.projectInvestigation({ investigationId }).entries), JSON.stringify(first.activation.researchDesk.entries));

const duplicate = await importCanonEventIntoOwnedInvestigation({ investigation: activated, event, repository: adapter.repository, knowledge, expectedAggregateRevision: 1, idempotencyKey: "import-two", transport });
assert.equal(duplicate.activation.investigation.revisions.length, 1);
assert.equal(JSON.stringify(resolveActiveOperationalGraphProjection(duplicate.activation.investigation)), JSON.stringify(graph));

principal = "account:b";
await coordinator.restoreSession();
await assert.rejects(() => coordinator.openOwnedInvestigation(investigationId), (error: unknown) => error instanceof ContinuityError && error.code === "INVESTIGATION_NOT_FOUND");
assert.equal(refreshedRuntime.getActiveInvestigation(), undefined);
assert.equal(JSON.stringify(CANONICAL_EVENTS), canonBefore);
assert.equal(JSON.stringify(first.activation.researchDesk), inboxBefore);
assert.equal(rexRequests, 0);

console.log(`PASS VerifyOwnedCanonOperationalGraphHydration — 20 invariants; focused EVENT 1, nodes ${graph.nodes.length}, edges ${graph.edges.length}; initial activation, refresh restoration, repeated navigation, idempotency, ownership/isolation, Inbox/Canon immutability, and zero automatic REX requests verified.`);
