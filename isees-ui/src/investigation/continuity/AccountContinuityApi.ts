import { ContinuityError, parseOwnedActivationAggregate, type AccountSessionProjection, type OwnedActivationAggregate } from "./OwnedInvestigationContinuity.ts";

export interface AccountContinuityApi {
  restoreSession(signal?: AbortSignal): Promise<AccountSessionProjection>;
  fetchActivation(investigationId: string, signal?: AbortSignal): Promise<OwnedActivationAggregate>;
  logout(csrfToken: string, signal?: AbortSignal): Promise<void>;
}

export function createAccountContinuityApi(options: { baseUrl?: string; transport?: typeof fetch } = {}): AccountContinuityApi {
  const environment = (import.meta as ImportMeta & { readonly env?: Readonly<Record<string, string | undefined>> }).env;
  const base = (options.baseUrl ?? environment?.VITE_API_BASE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
  const transport = options.transport ?? fetch;
  async function request(path: string, init: RequestInit): Promise<Response> {
    try { return await transport(`${base}${path}`, { ...init, credentials: "include" }); }
    catch { throw new ContinuityError("NETWORK_FAILURE", "The account continuity service is unavailable."); }
  }
  function failure(status: number, body: unknown): never {
    const code = (body as { error?: { code?: unknown } })?.error?.code;
    if (status === 401) throw new ContinuityError("SESSION_EXPIRED", "The authenticated session is unavailable.");
    if (status === 404 && code === "INVESTIGATION_NOT_FOUND") throw new ContinuityError("INVESTIGATION_NOT_FOUND", "Investigation was not found.");
    throw new ContinuityError("ACTIVATION_INVALID", "The account continuity request failed.");
  }
  return Object.freeze({
    async restoreSession(signal?: AbortSignal) {
      const response = await request("/api/v1/auth/session", { method: "GET", signal });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) failure(response.status, body);
      const item = body as Partial<AccountSessionProjection>;
      if (typeof item.researcherId !== "string" || !item.researcherId.trim() || typeof item.email !== "string" || typeof item.sessionExpiresAt !== "string")
        throw new ContinuityError("ACTIVATION_INVALID", "Session response is invalid.");
      return Object.freeze({ researcherId: item.researcherId, email: item.email, sessionExpiresAt: item.sessionExpiresAt });
    },
    async fetchActivation(investigationId: string, signal?: AbortSignal) {
      const id = investigationId.trim();
      if (!id) throw new ContinuityError("ACTIVATION_INVALID", "Investigation identity is invalid.");
      const response = await request(`/api/v1/investigations/${encodeURIComponent(id)}/activation`, { method: "GET", signal });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) failure(response.status, body);
      return parseOwnedActivationAggregate(body, id);
    },
    async logout(csrfToken: string, signal?: AbortSignal) {
      const response = await request("/api/v1/auth/logout", { method: "POST", headers: { "X-ISEES-CSRF": csrfToken }, signal });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) failure(response.status, body);
    },
  });
}
