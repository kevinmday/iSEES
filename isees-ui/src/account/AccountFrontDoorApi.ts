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
    if (response.status === 401) {
      const detail = unauthorized === "AUTHENTICATION" ? "The email or password was not accepted." : "Your session has ended. Please sign in again.";
      throw new AccountFrontDoorError(unauthorized, detail);
    }
    if (response.status === 409) throw new AccountFrontDoorError("VALIDATION", "An account with that email already exists.");
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
