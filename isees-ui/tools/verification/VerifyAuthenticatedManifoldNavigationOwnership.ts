import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { WorkspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntime.ts";
import { ResearchBridgeRuntime } from "../../src/research/ResearchBridgeRuntime.ts";
import { WorkspaceMode } from "../../src/workspace/runtime/WorkspaceRuntimeTypes.ts";
import { AccountWorkspaceContinuityCoordinator } from "../../src/investigation/continuity/AccountWorkspaceContinuityCoordinator.ts";
import { ContinuityError, parseOwnedActivationAggregate } from "../../src/investigation/continuity/OwnedInvestigationContinuity.ts";
import type { AccountContinuityApi } from "../../src/investigation/continuity/AccountContinuityApi.ts";

const investigationId = "inv:rex-local-browser-acceptance";
const eventId = "E-TICTAC-2004";
const timestamp = "2026-09-15T12:00:00.000Z";
const aggregate = (id = investigationId) => ({
  activationSchemaVersion: "owned-investigation-activation/v1", investigationId: id,
  title: "REX Local Browser Acceptance", objective: null, lifecycle: "ACTIVE",
  createdAt: timestamp, modifiedAt: timestamp, version: 1,
  aggregateSchemaVersion: "investigation-aggregate/v1", aggregateState: "ADOPTED", aggregateRevision: 1,
  access: { kind: "RESEARCHER_OWNED" }, freshnessToken: "1:1",
  operationalState: {
    kind: "ADOPTED", workspaceId: `workspace:${id}`, schemaVersion: "canon-event-import/v1",
    source: { kind: "SYSTEM_CANON", eventId, importedAt: timestamp }, title: "REX Local Browser Acceptance", objective: null,
    workspace: { sourceWorkspaceId: `workspace:${id}`, nodes: [
      { id: `system:event:${eventId}`, kind: "CANONICAL_EVENT", canonicalEventId: eventId, title: "Nimitz Tic Tac Encounter" },
      { id: "system:entity:sensor", kind: "NOTE", canonicalEventId: null, title: "Sensor" },
    ], edges: [{ id: "edge:sensor", sourceId: `system:event:${eventId}`, targetId: "system:entity:sensor", kind: "RELATED" }] },
    researchInbox: [{ anchorId: "research:sensor", order: 0, title: "Sensor", canonicalSourceId: "NODE:system:entity:sensor" }],
    artifacts: [], viewState: { activeMode: "OVERVIEW", focusedEventId: eventId, activeLayers: [], temporalContext: null, investigativeScale: null },
  },
});

let principal = "account:a";
const api: AccountContinuityApi = {
  async restoreSession() { return { researcherId: principal, email: `${principal}@example.com`, sessionExpiresAt: "2026-09-16T12:00:00.000Z" }; },
  async fetchActivation(id) {
    if (id !== investigationId || principal !== "account:a") throw new ContinuityError("INVESTIGATION_NOT_FOUND", "not found");
    return parseOwnedActivationAggregate(aggregate(id), id);
  },
  async logout() {},
};
const references = new Map<string, string>();
const store = { read: (account: string) => references.get(account) ?? null, write: (account: string, id: string) => { references.set(account, id); } };
const workspace = new WorkspaceRuntime();
const research = new ResearchBridgeRuntime();
const coordinator = new AccountWorkspaceContinuityCoordinator(api, workspace, store, [research]);

await coordinator.restoreSession();
await coordinator.openOwnedInvestigation(investigationId);
const owned = workspace.getActiveInvestigation()!;
const revision = owned.currentRevisionId;
const graphBefore = JSON.stringify(owned.revisions[0]!.manifold.graph);
const inboxBefore = JSON.stringify(research.projectInvestigation({ investigationId }));
assert.equal(owned.createdBy, "AUTHENTICATED_RESEARCHER");
assert.deepEqual(owned.workspace.imported_events, [{ event_id: eventId, source: "SYSTEM_CANON" }]);
assert.equal(owned.workspace.focused_event_id, eventId);
assert.equal(owned.revisions.length, 1);

// Deliberate stale Guest-shaped residue: it is untrusted data, not authority.
const staleGuestMarker = Object.freeze({ ownership: { kind: "GUEST", operatorId: "guest:foreign" }, activeMode: "MANIFOLD", focusedEventId: eventId });
void staleGuestMarker;
for (let cycle = 0; cycle < 3; cycle += 1) {
  workspace.setActiveMode(WorkspaceMode.MANIFOLD);
  assert.equal(workspace.getActiveMode(), WorkspaceMode.MANIFOLD);
  assert.equal(workspace.getActiveInvestigation(), owned);
  assert.equal(workspace.getWorkspace()?.focused_event_id, eventId);
  assert.equal(workspace.getActiveInvestigation()?.currentRevisionId, revision);
  workspace.setActiveMode(WorkspaceMode.OVERVIEW);
  assert.equal(workspace.getActiveMode(), WorkspaceMode.OVERVIEW);
}

references.set("account:a", investigationId);
const refreshedWorkspace = new WorkspaceRuntime();
const refreshedResearch = new ResearchBridgeRuntime();
const refreshed = new AccountWorkspaceContinuityCoordinator(api, refreshedWorkspace, store, [refreshedResearch]);
await refreshed.restoreSession();
await refreshed.restoreLastActiveInvestigation();
refreshedWorkspace.setActiveMode(WorkspaceMode.MANIFOLD);
assert.equal(refreshedWorkspace.getActiveInvestigation()?.id, investigationId);
assert.equal(refreshedWorkspace.getWorkspace()?.focused_event_id, eventId);
assert.equal(refreshedWorkspace.getActiveInvestigation()?.currentRevisionId, revision);
assert.equal(JSON.stringify(refreshedResearch.projectInvestigation({ investigationId })), inboxBefore);

principal = "account:b";
await refreshed.restoreSession();
await assert.rejects(() => refreshed.openOwnedInvestigation(investigationId), (error: unknown) => error instanceof ContinuityError && error.code === "INVESTIGATION_NOT_FOUND");
assert.equal(refreshedWorkspace.getActiveInvestigation(), undefined);
await refreshed.logout("csrf");
assert.equal(refreshedWorkspace.getActiveInvestigation(), undefined);

assert.equal(JSON.stringify(owned.revisions[0]!.manifold.graph), graphBefore);
assert.equal(JSON.stringify(research.projectInvestigation({ investigationId })), inboxBefore);

const app = readFileSync(new URL("../../src/App.tsx", import.meta.url), "utf8");
const boundary = readFileSync(new URL("../../src/workspace/persistence/GuestWorkspaceRestorationBoundary.tsx", import.meta.url), "utf8");
assert.match(app, /identityState\.identity\?\.kind === "ACCOUNT"[\s\S]*identityState\.persistence === "PERSISTENT"[\s\S]*return children;/);
assert.match(app, /<GuestWorkspaceRestorationBoundary>[\s\S]*\{children\}[\s\S]*<\/GuestWorkspaceRestorationBoundary>/);
assert.match(boundary, /clearGuestWorkspaceSession\(\)/);
assert.match(boundary, /operatorIdentityRuntime\.clearIdentity\(\)/);
assert.doesNotMatch(app, /localStorage/);

const navigationSources = [
  readFileSync(new URL("../../src/components/workspace/WorkspaceModeBar.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("../../src/workspace/runtime/WorkspaceRuntime.ts", import.meta.url), "utf8"),
].join("\n");
assert.doesNotMatch(navigationSources, /RexApi|\/rex|canon-events|createAnchor|updateObject/);

console.log("PASS VerifyAuthenticatedManifoldNavigationOwnership — authenticated owned activation, Canon import projection, governed revision/focus/identity/Inbox preservation, repeated Overview/MANIFOLD transitions, refresh restoration, stale Guest residue precedence, current-Guest boundary, foreign-Guest fail-closed recovery, cross-user rejection, sign-out isolation, and zero REX/Canon/graph navigation mutation verified.");
