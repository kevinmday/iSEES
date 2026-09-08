import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import {
  AccountFrontDoorError, createOwnedInvestigation, listOwnedInvestigations, submitAccount,
} from "../../src/account/AccountFrontDoorApi.ts";
import { API_BASE_URL, resolveApiBaseUrl } from "../../src/api/ApiOrigin.ts";
import { createAccountContinuityApi } from "../../src/investigation/continuity/AccountContinuityApi.ts";

const root = resolve(import.meta.dirname, "../..");
const ui = readFileSync(resolve(root, "src/account/AccountFrontDoor.tsx"), "utf8");
const api = readFileSync(resolve(root, "src/account/AccountFrontDoorApi.ts"), "utf8");
const continuityApi = readFileSync(resolve(root, "src/investigation/continuity/AccountContinuityApi.ts"), "utf8");
const originPolicy = readFileSync(resolve(root, "src/api/ApiOrigin.ts"), "utf8");
const app = readFileSync(resolve(root, "src/App.tsx"), "utf8");
const identityRuntime = readFileSync(resolve(root, "src/identity/runtime/OperatorIdentityRuntime.ts"), "utf8");
const libraryProvider = readFileSync(resolve(root, "src/investigation/library/InvestigationLibraryRuntimeContext.tsx"), "utf8");
const modeBar = readFileSync(resolve(root, "src/components/workspace/WorkspaceModeBar.tsx"), "utf8");
const vite = readFileSync(resolve(root, "vite.config.ts"), "utf8");
function requireText(source: string, text: string, label: string) { if (!source.includes(text)) throw new Error(`Missing ${label}`); }

for (const [text, label] of [
  ["Create account", "account creation"], ["Sign in", "sign in"], ["Researcher account", "identity label"],
  ["Your investigations", "owned library"], ["Create investigation", "creation command"],
  ["Open investigation", "open command"], ["Sign out", "logout command"],
  ["You have no investigations yet", "honest empty state"], ["Restoring your researcher account", "session restoration state"],
  ["Continue as guest", "guest entry choice"],
  ["Explore the complete iSEES workspace. Your work will not be saved after this guest session.", "guest capability and persistence explanation"],
  ["Guest session", "guest status"], ["your work is not being saved", "guest non-persistence warning"],
] as const) requireText(ui, text, label);
for (const forbidden of ["Nimitz", "Tic Tac", "sampleReport", "defaultInvestigation"]) {
  if (ui.includes(forbidden) || api.includes(forbidden)) throw new Error(`Canonical/default injection reference: ${forbidden}`);
}
requireText(ui, "coordinator.openOwnedInvestigation", "continuity opening path");
requireText(ui, "coordinator.restoreLastActiveInvestigation", "reload continuity path");
requireText(ui, "generation.current", "stale completion gate");
requireText(ui, "commandPending.current", "synchronous duplicate-submission gate");
requireText(ui, "useState(() => new AccountWorkspaceContinuityCoordinator", "component-owned coordinator");
requireText(ui, "requestController.current?.abort()", "request cancellation");
requireText(ui, "coordinator.cancelPendingRequests()", "non-destructive unmount request invalidation");
assert.equal((ui.match(/operatorIdentityRuntime\.clearIdentity\(\)/g) ?? []).length, 2,
  "identity teardown must occur only for anonymous/session failure and explicit guest-to-account entry");
assert.ok(!/return \(\) => \{[^}]*operatorIdentityRuntime\.clearIdentity\(\)/s.test(ui),
  "effect cleanup must not clear valid operator identity");
if (/clearAccountState\s*=/.test(ui)) throw new Error("Mutable teardown callback assignment must not occur during render");
requireText(api, 'credentials: "include"', "cookie credentials");
requireText(continuityApi, 'credentials: "include"', "continuity cookie credentials");
requireText(api, '"X-ISEES-CSRF": csrf', "CSRF mutation protection");
requireText(api, "API_BASE_URL", "shared API-origin policy use");
requireText(continuityApi, "resolveApiBaseUrl", "shared continuity API-origin policy use");
requireText(originPolicy, 'VITE_API_BASE_URL ?? ""', "relative same-origin default with optional override");
requireText(vite, "'/api/v1'", "Vite same-origin API proxy");
requireText(vite, "target: 'http://127.0.0.1:8000'", "Vite backend target");
assert.equal(API_BASE_URL, "", "default API base must be relative and same-origin");
assert.equal(resolveApiBaseUrl("https://api.example.test/"), "https://api.example.test");
if (/owner(?:Id|PrincipalId)/.test(api)) throw new Error("Client request must not project an owner identity");
requireText(app, "<AccountFrontDoor>", "application composition");
assert.ok(app.indexOf("<OperatorIdentityRuntimeProvider>") < app.indexOf("<AccountFrontDoor>"), "established identity authority must wrap the account front door");
requireText(app, "<OperatorEntryGate>", "established guest/account application gate");
requireText(ui, "operatorIdentityRuntime.continueAsGuest(recoveredIdentity)", "established atomic continueAsGuest authority invocation");
requireText(ui, 'identityState.identity?.kind === "GUEST"', "guest real-shell branch");
requireText(ui, "guestWorkspaceSessionLifecycle.stop()", "guest-to-account lifecycle isolation");
requireText(ui, "clearGuestWorkspaceSession()", "guest-to-account temporary-state discard");
requireText(ui, "coordinator.beginNewPrincipalEpoch()", "cross-principal stale request isolation");
requireText(libraryProvider, 'authority?.kind === "ACCOUNT" ? authority : null', "account-only owned library authority");
for (const mode of ["OVERVIEW", "MANIFOLD", "COMPARE", "NARRATIVE", "EVIDENCE", "TIMELINE", "LAYERS", "INTENTION", "RESEARCH"]) {
  requireText(modeBar, `WorkspaceMode.${mode}`, `${mode} navigation`);
}
assert.equal((identityRuntime.match(/continueAsGuest\(recoveryIdentity\?: OperatorIdentity\): void/g) ?? []).length, 1, "exactly one guest identity authority must exist");
for (const forbidden of ["demo", "preview", "public-only", "browse-only", "read-only mode"]) {
  if (ui.toLowerCase().includes(forbidden)) throw new Error(`Guest front door must not describe reduced capability: ${forbidden}`);
}

let request: { url: string; init: RequestInit } | undefined;
const reply = (status: number, body: unknown) => {
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    request = { url: String(input), init: init ?? {} };
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
};

reply(200, { researcherId: "acct_server", email: "server@example.test", sessionExpiresAt: "2026-09-09T00:00:00Z" });
const testCredential = "x".repeat(12);
const identity = await submitAccount("signin", "typed@example.test", testCredential);
assert.equal(identity.researcherId, "acct_server", "session identity must come from the server response");
assert.equal(request?.url, "/api/v1/auth/sessions", "auth request must be same-origin by default");
assert.equal(request?.init.credentials, "include");
assert.deepEqual(JSON.parse(String(request?.init.body)), { email: "typed@example.test", password: testCredential });

reply(201, { investigationId: "inv_server", title: "Study", modifiedAt: "2026-09-08T00:00:00Z" });
await createOwnedInvestigation("Study", "idem-1", "csrf-1");
assert.equal(new Headers(request?.init.headers).get("X-ISEES-CSRF"), "csrf-1");
const creationBody = JSON.parse(String(request?.init.body));
assert.deepEqual(creationBody, { title: "Study", objective: null, idempotencyKey: "idem-1" });
assert.equal(Object.keys(creationBody).some(key => /owner/i.test(key)), false);

reply(401, { error: { code: "AUTHENTICATION_REQUIRED" } });
await assert.rejects(listOwnedInvestigations(), (cause: unknown) => cause instanceof AccountFrontDoorError && cause.code === "SESSION");

reply(201, { researcherId: "acct_server", email: "server@example.test" });
await assert.rejects(submitAccount("create", "typed@example.test", testCredential),
  (cause: unknown) => cause instanceof AccountFrontDoorError && cause.code === "SERVER");

let continuityRequest: { url: string; init: RequestInit } | undefined;
const continuity = createAccountContinuityApi({ transport: async (input, init) => {
  continuityRequest = { url: String(input), init };
  return new Response(JSON.stringify({ researcherId: "acct_server", email: "server@example.test", sessionExpiresAt: "2026-09-09T00:00:00Z" }),
    { status: 200, headers: { "Content-Type": "application/json" } });
} });
assert.equal((await continuity.restoreSession()).researcherId, "acct_server");
assert.equal(continuityRequest?.url, "/api/v1/auth/session");
assert.equal(continuityRequest?.init.credentials, "include");

requireText(ui, "if (!restored)", "failed post-authentication restoration terminal branch");
requireText(ui, "secure session could not be restored", "visible post-authentication restoration error");

console.log("PASS VerifyAccountFrontDoor: same-origin policy, authoritative auth schemas, cookie credentials, deterministic restoration failure, CSRF, owner-omission, and session-expiry behavior verified.");
