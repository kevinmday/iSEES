import type { AccountSessionProjection } from "../investigation/continuity/OwnedInvestigationContinuity";
import { API_BASE_URL } from "../api/ApiOrigin.ts";


export class AccountFrontDoorError extends Error {
  readonly code: "AUTHENTICATION" | "VALIDATION" | "SESSION" | "SERVER" | "NETWORK";
  constructor(code: "AUTHENTICATION" | "VALIDATION" | "SESSION" | "SERVER" | "NETWORK", message: string) {
    super(message); this.name = "AccountFrontDoorError"; this.code = code;
  }
}

async function request(path: string, init: RequestInit, unauthorized: "AUTHENTICATION" | "SESSION" = "SESSION"): Promise<unknown> {
  let response: Response;
  try { response = await fetch(`${API_BASE_URL}${path}`, { ...init, credentials: "include" }); }
  catch (cause) {
    if (init.signal?.aborted) throw new AccountFrontDoorError("NETWORK", "The account request was cancelled. Please try again.");
    throw new AccountFrontDoorError("NETWORK", "iSEES could not reach the account service. Please try again.");
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const errorCode = (body as { error?: { code?: unknown } } | null)?.error?.code;
    if (response.status === 401) {
      const detail = unauthorized === "AUTHENTICATION" ? "The email or password was not accepted." : "Your session has ended. Please sign in again.";
      throw new AccountFrontDoorError(unauthorized, detail);
    }
    if (response.status === 409 && errorCode === "ACCOUNT_UNAVAILABLE")
      throw new AccountFrontDoorError("VALIDATION", "Account registration is unavailable for these details. Check your invitation or sign in if you may already have an account.");
    if (response.status === 422 || response.status === 400) throw new AccountFrontDoorError("VALIDATION", "Please check the information you entered.");
    throw new AccountFrontDoorError("SERVER", "The account request could not be completed. Please try again.");
  }
  return body;
}

function identity(value: unknown): AccountSessionProjection {
  const item = value as Partial<AccountSessionProjection>;
  if (typeof item?.researcherId !== "string" || !item.researcherId || typeof item.email !== "string" || typeof item.sessionExpiresAt !== "string")
    throw new AccountFrontDoorError("SERVER", "The account response was not valid.");
  return Object.freeze({ researcherId: item.researcherId, email: item.email, sessionExpiresAt: item.sessionExpiresAt });
}

export async function submitAccount(mode: "create" | "signin", email: string, password: string, signal?: AbortSignal): Promise<AccountSessionProjection> {
  const path = mode === "create" ? "/api/v1/auth/accounts" : "/api/v1/auth/sessions";
  return identity(await request(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }), signal }, "AUTHENTICATION"));
}

export function readCsrfCookie(): string {
  const prefix = "isees_csrf=";
  const value = document.cookie.split(";").map(part => part.trim()).find(part => part.startsWith(prefix))?.slice(prefix.length);
  if (!value) throw new AccountFrontDoorError("SESSION", "Your secure session could not be verified. Please sign in again.");
  return decodeURIComponent(value);
}

export interface OwnedInvestigationSummary { readonly investigationId: string; readonly title: string; readonly modifiedAt: string; }

export interface PasswordRecoveryAccepted {
  readonly schemaVersion: "isees-password-recovery-request/v1";
  readonly status: "ACCEPTED";
  readonly message: "If an account exists for that email, we sent recovery instructions.";
}

export interface PasswordResetResult {
  readonly schemaVersion: "isees-password-reset/v1";
  readonly status: "COMPLETED" | "INVALID";
  readonly message: "Your password has been reset. Sign in with your new password." | "This password reset link is invalid or has expired.";
}

const RECOVERY_MESSAGE = "If an account exists for that email, we sent recovery instructions." as const;
const RESET_COMPLETE_MESSAGE = "Your password has been reset. Sign in with your new password." as const;
const RESET_INVALID_MESSAGE = "This password reset link is invalid or has expired." as const;

async function recoveryRequest(path: string, body: object, signal?: AbortSignal): Promise<{ response: Response; body: unknown }> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), credentials: "include", signal,
    });
  } catch {
    throw new AccountFrontDoorError("NETWORK", "The recovery service could not be reached. Please try again.");
  }
  return { response, body: await response.json().catch(() => null) };
}

export async function requestPasswordRecovery(email: string, signal?: AbortSignal): Promise<PasswordRecoveryAccepted> {
  const result = await recoveryRequest("/api/v1/auth/password-recovery/request", { email }, signal);
  const body = result.body as Partial<PasswordRecoveryAccepted> | null;
  if (result.response.status !== 202 || body?.schemaVersion !== "isees-password-recovery-request/v1" ||
      body.status !== "ACCEPTED" || body.message !== RECOVERY_MESSAGE) {
    throw new AccountFrontDoorError("SERVER", "Recovery instructions could not be requested. Please try again.");
  }
  return Object.freeze({ schemaVersion: body.schemaVersion, status: body.status, message: body.message });
}

export async function resetPassword(token: string, newPassword: string, signal?: AbortSignal): Promise<PasswordResetResult> {
  const result = await recoveryRequest("/api/v1/auth/password-recovery/reset", { token, newPassword }, signal);
  const body = result.body as Partial<PasswordResetResult> | null;
  const completed = result.response.status === 200 && body?.schemaVersion === "isees-password-reset/v1" &&
    body.status === "COMPLETED" && body.message === RESET_COMPLETE_MESSAGE;
  const invalid = result.response.status === 400 && body?.schemaVersion === "isees-password-reset/v1" &&
    body.status === "INVALID" && body.message === RESET_INVALID_MESSAGE;
  if (!completed && !invalid) {
    throw new AccountFrontDoorError("SERVER", "The password could not be reset. Please try again.");
  }
  return Object.freeze({ schemaVersion: body!.schemaVersion!, status: body!.status!, message: body!.message! });
}

export async function listOwnedInvestigations(signal?: AbortSignal): Promise<readonly OwnedInvestigationSummary[]> {
  const body = await request("/api/v1/investigations", { method: "GET", signal }) as { items?: unknown };
  if (!Array.isArray(body?.items)) throw new AccountFrontDoorError("SERVER", "Your investigations could not be read.");
  return Object.freeze(body.items.map((raw: unknown) => {
    const item = raw as Record<string, unknown>;
    if (typeof item.investigationId !== "string" || typeof item.title !== "string" || typeof item.modifiedAt !== "string")
      throw new AccountFrontDoorError("SERVER", "Your investigations could not be read.");
    return Object.freeze({ investigationId: item.investigationId, title: item.title, modifiedAt: item.modifiedAt });
  }));
}

export async function createOwnedInvestigation(title: string, idempotencyKey: string, csrf: string, signal?: AbortSignal): Promise<OwnedInvestigationSummary> {
  const body = await request("/api/v1/investigations", { method: "POST", headers: { "Content-Type": "application/json", "X-ISEES-CSRF": csrf }, body: JSON.stringify({ title, objective: null, idempotencyKey }), signal }) as Record<string, unknown>;
  if (typeof body.investigationId !== "string" || typeof body.title !== "string" || typeof body.modifiedAt !== "string")
    throw new AccountFrontDoorError("SERVER", "The created investigation response was not valid.");
  return Object.freeze({ investigationId: body.investigationId, title: body.title, modifiedAt: body.modifiedAt });
}
