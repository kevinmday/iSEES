import assert from "node:assert/strict";
import { OperatorIdentityRuntime } from "../../src/identity/runtime/OperatorIdentityRuntime.ts";
import {
  clearGuestWorkspaceSession,
  createGuestWorkspaceSessionSnapshot,
  hasGuestWorkspaceSession,
  restoreGuestWorkspaceSession,
  saveGuestWorkspaceSession,
} from "../../src/workspace/persistence/GuestWorkspaceSessionPersistence.ts";
import { AccountWorkspaceContinuityCoordinator } from "../../src/investigation/continuity/AccountWorkspaceContinuityCoordinator.ts";

class MemorySessionStorage implements Storage {
  readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const sessionStorage = new MemorySessionStorage();
Object.defineProperty(globalThis, "window", { configurable: true, value: { sessionStorage } });

// Establish through the production identity authority and persist a mutated workspace.
const firstRuntime = new OperatorIdentityRuntime();
firstRuntime.initialize();
firstRuntime.continueAsGuest();
const firstIdentity = firstRuntime.getState().identity!;
const snapshot = createGuestWorkspaceSessionSnapshot({
  ownership: { kind: "GUEST", operatorId: firstIdentity.operatorId, establishedAt: firstIdentity.establishedAt },
  workspace: {
    investigation: { id: "INV-NIMITZ-RELOAD" } as never,
    workspace: { id: "WS-NIMITZ-MANIFOLD" } as never,
    operator: { activeMode: "MANIFOLD" as never, layoutMode: "NORMAL" as never },
    computational: { activeLayers: [], temporalContext: undefined, investigativeScale: undefined },
  },
  research: { desk: { entries: [] } },
  authoring: { activeDocument: undefined },
});
saveGuestWorkspaceSession(snapshot);

// StrictMode/effect teardown is subscription/request cleanup only: storage remains.
assert.equal(hasGuestWorkspaceSession(), true);
assert.equal(firstRuntime.getState().identity?.kind, "GUEST");

// A page reload creates runtime memory again while retaining tab sessionStorage.
const reloadedRuntime = new OperatorIdentityRuntime();
reloadedRuntime.initialize();
assert.equal(reloadedRuntime.getState().identity?.operatorId, firstIdentity.operatorId);
assert.equal(reloadedRuntime.getState().persistence, "SESSION");
const restored = restoreGuestWorkspaceSession();
assert.equal(restored.status, "RESTORED");
if (restored.status !== "RESTORED") throw new Error("Guest workspace was not restored");
assert.equal(restored.snapshot.workspace.investigation?.id, "INV-NIMITZ-RELOAD");
assert.equal(restored.snapshot.workspace.workspace?.id, "WS-NIMITZ-MANIFOLD");
assert.equal(restored.snapshot.workspace.operator.activeMode, "MANIFOLD");

// A stale account restore can be invalidated without blanking the restored guest shell.
let resolveAccount!: (value: never) => void;
const pendingAccount = new Promise<never>(resolve => { resolveAccount = resolve; });
let deactivations = 0;
let accountStateClears = 0;
const coordinator = new AccountWorkspaceContinuityCoordinator(
  { restoreSession: () => pendingAccount, fetchActivation: async () => { throw new Error("unused"); }, logout: async () => undefined },
  { deactivate: () => { deactivations++; }, activateEmptyOwnedInvestigation: () => undefined },
  { read: () => null, write: () => undefined, clear: () => undefined },
  [{ clearAccountState: () => { accountStateClears++; } }],
);
const staleRestore = coordinator.restoreSession();
coordinator.cancelPendingRequests();
resolveAccount({ researcherId: "stale-account", email: "stale@example.test", sessionExpiresAt: "later" } as never);
assert.equal(await staleRestore, null);
assert.equal(deactivations, 0);
assert.equal(accountStateClears, 0);
assert.equal(reloadedRuntime.getState().identity?.kind, "GUEST");
assert.equal(hasGuestWorkspaceSession(), true);

// Only the explicit guest-to-account authority transition destroys guest persistence.
clearGuestWorkspaceSession();
reloadedRuntime.clearIdentity();
reloadedRuntime.establishAuthenticatedAccount("account:verified");
assert.equal(hasGuestWorkspaceSession(), false);
assert.equal(reloadedRuntime.getState().identity?.kind, "ACCOUNT");
reloadedRuntime.clearIdentity();
assert.equal(reloadedRuntime.getState().identity, null, "account logout must remain anonymous");

console.log("PASS VerifyGuestReloadContinuity: guest identity/workspace/mode survive teardown and reload; stale account work is inert; explicit ownership transition clears guest state; logout remains anonymous.");
