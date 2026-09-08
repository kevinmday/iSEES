import assert from "node:assert/strict";
import { AccountWorkspaceContinuityCoordinator } from "../../src/investigation/continuity/AccountWorkspaceContinuityCoordinator.ts";
import { ContinuityError, parseOwnedActivationAggregate } from "../../src/investigation/continuity/OwnedInvestigationContinuity.ts";
import type { AccountContinuityApi } from "../../src/investigation/continuity/AccountContinuityApi.ts";

const aggregate = (id: string, revision = 0) => ({
  activationSchemaVersion: "owned-investigation-activation/v1", investigationId: id, title: "Empty Study", objective: null,
  lifecycle: "ACTIVE", createdAt: "2026-09-08T00:00:00Z", modifiedAt: "2026-09-08T00:00:00Z", version: revision,
  aggregateSchemaVersion: "investigation-aggregate/v1", aggregateState: "EMPTY", aggregateRevision: revision,
  access: { kind: "RESEARCHER_OWNED" }, operationalState: { kind: "EMPTY", workspaceId: `workspace:${id}`, focusedEventId: null, nodes: [], edges: [] },
  freshnessToken: `${revision}:${revision}`,
});

assert.throws(() => parseOwnedActivationAggregate({ ...aggregate("i"), activationSchemaVersion: "v2" }, "i"), /invalid/);
assert.throws(() => parseOwnedActivationAggregate(aggregate("foreign"), "i"), /invalid/);
assert.throws(() => parseOwnedActivationAggregate({ ...aggregate("i"), operationalState: { ...aggregate("i").operationalState, nodes: [{}] } }, "i"), /invalid/);

let principal = "acct_a"; let pending: ((value: never) => void) | undefined; let notFound = false; let malformed = false;
const api: AccountContinuityApi = {
  async restoreSession() { return { researcherId: principal, email: `${principal}@test`, sessionExpiresAt: "2026-09-09T00:00:00Z" }; },
  async fetchActivation(id) {
    if (notFound) throw new ContinuityError("INVESTIGATION_NOT_FOUND", "missing");
    if (malformed) throw new ContinuityError("ACTIVATION_INVALID", "malformed");
    if (id === "late") return await new Promise(resolve => { pending = resolve; });
    return parseOwnedActivationAggregate(aggregate(id), id);
  },
  async logout() {},
};
const values = new Map<string, string>();
const store = { read: (account: string) => values.get(account) ?? null, write: (account: string, id: string) => { values.set(account, id); } };
let subordinate = "sensitive"; const teardown = { clearAccountState() { subordinate = ""; } };
let active: ReturnType<typeof parseOwnedActivationAggregate> | undefined;
let activeInvestigation: unknown;
const workspace = {
  deactivate() { active = undefined; activeInvestigation = undefined; },
  activateEmptyOwnedInvestigation(investigation: unknown) { activeInvestigation = investigation; },
  getActiveInvestigation() { return activeInvestigation as { id: string; workspace: { focused_event_id: null; imported_events: unknown[]; active_layers: unknown[] } } | undefined; },
  getActiveWorkspace() { return this.getActiveInvestigation()?.workspace; },
  getComputationalConfiguration() { return { activeLayers: this.getActiveWorkspace()?.active_layers ?? [] }; },
};
const coordinator = new AccountWorkspaceContinuityCoordinator(api, workspace, store, [teardown]);

await coordinator.restoreSession();
const receipt = await coordinator.openOwnedInvestigation("owned-empty");
assert.equal(receipt.code, "ACTIVATION_READY");
assert.equal(workspace.getActiveInvestigation()?.id, "owned-empty");
assert.equal(workspace.getActiveWorkspace()?.focused_event_id, null);
assert.deepEqual(workspace.getActiveWorkspace()?.imported_events, []);
assert.deepEqual(workspace.getComputationalConfiguration().activeLayers, []);
assert.equal(store.read("acct_a"), "owned-empty"); assert.equal(subordinate, "");

const before = workspace.getActiveInvestigation();
malformed = true; await assert.rejects(() => coordinator.openOwnedInvestigation("malformed")); malformed = false;
assert.equal(workspace.getActiveInvestigation(), before, "failed fetch preserves valid state");

store.write("acct_a", "missing"); notFound = true;
assert.equal(await coordinator.restoreLastActiveInvestigation(), null);
assert.equal(workspace.getActiveInvestigation(), undefined, "missing remembered item leaves no active Investigation");
notFound = false; store.write("acct_a", "owned-empty"); principal = "acct_b";
await coordinator.restoreSession();
assert.equal(workspace.getActiveInvestigation(), undefined, "account switch tears down old workspace first");
assert.equal(store.read("acct_b"), null, "last active is account scoped");

principal = "acct_a"; await coordinator.restoreSession();
const late = coordinator.openOwnedInvestigation("late");
principal = "acct_b"; await coordinator.restoreSession();
pending?.(parseOwnedActivationAggregate(aggregate("late"), "late") as never);
await assert.rejects(late, (error: unknown) => error instanceof ContinuityError && error.code === "ACTIVATION_STALE");
assert.equal(workspace.getActiveInvestigation(), undefined, "late prior-account response cannot activate");

await coordinator.openOwnedInvestigation("b-owned"); await coordinator.logout("csrf");
assert.equal(workspace.getActiveInvestigation(), undefined); assert.equal(coordinator.getState().code, "AUTHENTICATION_REQUIRED");

console.log("PASS VerifyOwnedInvestigationContinuity");
