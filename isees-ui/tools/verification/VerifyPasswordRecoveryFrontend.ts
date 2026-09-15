import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { requestPasswordRecovery, resetPassword, AccountFrontDoorError } from "../../src/account/AccountFrontDoorApi.ts";

const root = resolve(import.meta.dirname, "../..");
const ui = readFileSync(resolve(root, "src/account/AccountFrontDoor.tsx"), "utf8");
const api = readFileSync(resolve(root, "src/account/AccountFrontDoorApi.ts"), "utf8");
const css = readFileSync(resolve(root, "src/account/AccountFrontDoor.css"), "utf8");
const app = readFileSync(resolve(root, "src/App.tsx"), "utf8");
const delivery = readFileSync(resolve(root, "../isees_uap/authentication/recovery_delivery.py"), "utf8");

function has(source: string, value: string, label: string): void {
  assert.ok(source.includes(value), `Missing ${label}`);
}

has(ui, "Forgot email or password?", "exact sign-in recovery action");
assert.match(ui, /mode === "signin" && <button[^>]+type="button"[^>]*>[^<]*Forgot email or password\?<\/button>/s);
assert.equal((ui.match(/Forgot email or password\?/g) ?? []).length, 1, "recovery action must exist only in its sign-in gate");
has(ui, "Recover your iSEES account", "recovery title");
has(ui, "Send recovery instructions", "recovery primary action");
has(ui, "Back to sign in", "recovery return action");
has(ui + api, "If an account exists for that email, we sent recovery instructions.", "neutral completion contract");
has(ui, "Your iSEES login is the email address used to create your researcher account.", "forgotten-email guidance");
has(ui, "pendingRef.current", "synchronous duplicate submission gate");
has(ui, "controller.current?.abort()", "unmount abort");
has(delivery, 'return f"{origin}/reset-password#token=', "backend-owned reset path and fragment");
has(ui, 'const RESET_PATH = "/reset-password"', "matching frontend reset path");
has(ui, 'window.location.hash', "fragment capture");
has(ui, 'window.history.replaceState(null, "", window.location.pathname)', "immediate fragment and noncanonical query scrub");
has(ui, "let bootResetCapability = captureResetCapability()", "Strict Mode-safe pre-render capture");
has(ui, "bootResetCapability = null", "bootstrap capability clearing");
assert.doesNotMatch(ui + api, /(?:localStorage|sessionStorage)/, "recovery must not use browser storage");
assert.doesNotMatch(ui + api, /[?&](?:token|recoveryToken)=|URLSearchParams/, "token must not use a query string");
const resetSurface = ui.slice(ui.indexOf("function PasswordResetDoor"));
assert.doesNotMatch(resetSurface.slice(0, resetSurface.indexOf("async function submit")), /resetPassword\(/, "opening route must not consume capability");
assert.equal((resetSurface.match(/resetPassword\(token, password/g) ?? []).length, 1, "reset occurs only in explicit form submission");
has(ui, 'if (password !== confirmation)', "local mismatch gate");
assert.ok(ui.indexOf('if (password !== confirmation)') < ui.indexOf('await resetPassword(token, password'), "mismatch must precede API submission");
has(ui, "setToken(null); setPassword(\"\"); setConfirmation(\"\")", "secret clearing");
has(ui, "Your password has been reset. Sign in with your new password.", "persistent reset confirmation");
assert.doesNotMatch(resetSurface, /submitAccount\(|establishAuthenticatedAccount/, "reset surface must not sign in automatically");
for (const accessibility of ['htmlFor="recovery-email"', 'htmlFor="new-password"', 'htmlFor="confirm-new-password"', 'role="status"', 'role="alert"', 'heading.current?.focus()', 'aria-describedby=', 'aria-invalid=']) has(ui, accessibility, `accessibility contract ${accessibility}`);
has(css, ":focus-visible", "visible keyboard focus");
has(css, "button:disabled", "visual disabled state");
has(css, "@media(max-width:600px)", "narrow-width rule");
has(css, "overflow-wrap:anywhere", "narrow heading overflow protection");
has(app, 'path="/*"', "SPA fallback route ownership");

let observed: { url: string; init: RequestInit } | undefined;
function reply(status: number, body: unknown): void {
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    observed = { url: String(input), init: init ?? {} };
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
}

reply(202, { schemaVersion: "isees-password-recovery-request/v1", status: "ACCEPTED", message: "If an account exists for that email, we sent recovery instructions." });
const abort = new AbortController();
const accepted = await requestPasswordRecovery("synthetic@invalid.example", abort.signal);
assert.equal(accepted.status, "ACCEPTED");
assert.equal(observed?.url, "/api/v1/auth/password-recovery/request");
assert.equal(observed?.init.credentials, "include");
assert.equal(observed?.init.signal, abort.signal);
assert.deepEqual(JSON.parse(String(observed?.init.body)), { email: "synthetic@invalid.example" });

for (const nonNeutral of [
  { schemaVersion: "isees-password-recovery-request/v1", status: "FOUND", message: "Account found" },
  { schemaVersion: "wrong", status: "ACCEPTED", message: "If an account exists for that email, we sent recovery instructions." },
]) {
  reply(202, nonNeutral);
  await assert.rejects(requestPasswordRecovery("synthetic@invalid.example"), AccountFrontDoorError);
}

reply(200, { schemaVersion: "isees-password-reset/v1", status: "COMPLETED", message: "Your password has been reset. Sign in with your new password." });
const completed = await resetPassword("synthetic-capability", "synthetic-password-value");
assert.equal(completed.status, "COMPLETED");
assert.equal(observed?.url, "/api/v1/auth/password-recovery/reset");
assert.deepEqual(JSON.parse(String(observed?.init.body)), { token: "synthetic-capability", newPassword: "synthetic-password-value" });

reply(400, { schemaVersion: "isees-password-reset/v1", status: "INVALID", message: "This password reset link is invalid or has expired." });
assert.equal((await resetPassword("synthetic-capability", "synthetic-password-value")).status, "INVALID");
reply(400, { schemaVersion: "isees-password-reset/v1", status: "INVALID", message: "different" });
await assert.rejects(resetPassword("synthetic-capability", "synthetic-password-value"), AccountFrontDoorError);

console.log("PASS VerifyPasswordRecoveryFrontend: canonical routes/contracts, neutral disclosure, fragment security, lifecycle, validation, success transition, accessibility, and responsive styling verified.");
