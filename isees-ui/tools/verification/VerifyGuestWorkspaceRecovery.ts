import assert from "node:assert/strict";
import { OperatorIdentityRuntime } from "../../src/identity/runtime/OperatorIdentityRuntime.ts";
import { createGuestWorkspaceSessionSnapshot } from "../../src/workspace/persistence/GuestWorkspaceSessionPersistence.ts";
import { decideGuestWorkspaceRestoration, guestIdentityFromValidatedSnapshot } from "../../src/workspace/persistence/GuestWorkspaceRestorationPolicy.ts";

class MemorySessionStorage implements Storage {
  readonly values = new Map<string, string>(); get length() { return this.values.size; }
  clear() { this.values.clear(); } getItem(k: string) { return this.values.get(k) ?? null; }
  key(i: number) { return [...this.values.keys()][i] ?? null; } removeItem(k: string) { this.values.delete(k); }
  setItem(k: string, v: string) { this.values.set(k, v); }
}
Object.defineProperty(globalThis, "window", { configurable: true, value: { sessionStorage: new MemorySessionStorage() } });
Object.defineProperty(globalThis, "crypto", { configurable: true, value: { randomUUID: () => "runtime" } });

const owner = { kind: "GUEST" as const, operatorId: "guest:owner", establishedAt: "2026-09-08T00:00:00.000Z" };
const snapshot = createGuestWorkspaceSessionSnapshot({
  ownership: owner,
  workspace: { investigation: { id: "INV-NIMITZ" } as never, workspace: { id: "WS-NIMITZ" } as never,
    operator: { activeMode: "MANIFOLD", layoutMode: "NORMAL" }, computational: { activeLayers: [] } },
  research: { desk: { entries: [] } }, authoring: {},
});
const restored = { status: "RESTORED" as const, snapshot };
const missing = new OperatorIdentityRuntime(); missing.initialize();
const recovered = guestIdentityFromValidatedSnapshot(restored);
assert.deepEqual(recovered, owner, "validated snapshot ownership must be the exact recovery identity");
missing.continueAsGuest(recovered);
assert.equal(decideGuestWorkspaceRestoration(restored, missing.getState()).kind, "RESTORE");

window.sessionStorage.clear();
const mismatched = new OperatorIdentityRuntime(); mismatched.initialize(); mismatched.continueAsGuest();
const rejection = decideGuestWorkspaceRestoration(restored, mismatched.getState());
assert.deepEqual(rejection, { kind: "RECOVER_CLEAN", diagnostic: "OWNERSHIP_MISMATCH" });
assert.equal("snapshot" in rejection, false, "rejection must not expose stale state to hydration");
assert.deepEqual(decideGuestWorkspaceRestoration({ status: "INVALID", reason: "malformed" }, mismatched.getState()), { kind: "RECOVER_CLEAN", diagnostic: "INVALID_SNAPSHOT" });
assert.deepEqual(decideGuestWorkspaceRestoration({ status: "EMPTY" }, mismatched.getState()), { kind: "EMPTY" });
assert.equal(guestIdentityFromValidatedSnapshot({ status: "INVALID", reason: "unsupported" }), undefined);
assert.equal(mismatched.getState().identity?.operatorId, "guest:runtime", "current Guest identity must survive mismatch rejection");

console.log("PASS VerifyGuestWorkspaceRecovery: production atomic policy restores only matching ownership; missing identity is reestablished from a validated envelope; mismatch/invalid/unsupported state cannot reach hydration.");
