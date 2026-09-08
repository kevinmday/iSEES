import type { Investigation } from "../investigationTypes.ts";
import type { AccountContinuityApi } from "./AccountContinuityApi.ts";
import { ContinuityError, materializeOwnedActivation, type AccountSessionProjection, type ActivationReceipt, type ContinuityStateCode, type MaterializedOwnedActivation } from "./OwnedInvestigationContinuity.ts";
import type { LastActiveStore } from "./LastActiveInvestigationStore.ts";

export interface AccountSensitiveRuntimeTeardown { clearAccountState(): void; activateOwnedInvestigation?(activation: MaterializedOwnedActivation): void; }
export interface AccountWorkspaceRuntime { deactivate(): void; activateOwnedInvestigation(activation: MaterializedOwnedActivation, installAccountState: () => void): void; activateEmptyOwnedInvestigation?(investigation: Investigation): void; }
export interface ContinuityState { readonly code: ContinuityStateCode; readonly principal: AccountSessionProjection | null; readonly activeInvestigationId: string | null; }

export class AccountWorkspaceContinuityCoordinator {
  readonly #api: AccountContinuityApi; readonly #workspace: AccountWorkspaceRuntime;
  readonly #lastActive: LastActiveStore; readonly #teardowns: readonly AccountSensitiveRuntimeTeardown[];
  #epoch = 0; #request = 0; #principal: AccountSessionProjection | null = null;
  #state: ContinuityState = Object.freeze({ code: "SESSION_INITIALIZING", principal: null, activeInvestigationId: null });
  #controller?: AbortController; #revisions = new Map<string, number>();
  constructor(api: AccountContinuityApi, workspace: AccountWorkspaceRuntime,
    lastActive: LastActiveStore, teardowns: readonly AccountSensitiveRuntimeTeardown[]) {
    this.#api = api; this.#workspace = workspace; this.#lastActive = lastActive; this.#teardowns = teardowns;
  }
  getState(): ContinuityState { return this.#state; }
  #publish(code: ContinuityStateCode, active: string | null = null): void { this.#state = Object.freeze({ code, principal: this.#principal, activeInvestigationId: active }); }
  cancelPendingRequests(): void { this.#epoch++; this.#request++; this.#controller?.abort(); }
  #boundary(code: "ACCOUNT_BOUNDARY_RESET" | "AUTHENTICATION_REQUIRED" | "SESSION_EXPIRED"): void {
    this.#epoch++; this.#request++; this.#controller?.abort(); this.#workspace.deactivate();
    for (const runtime of this.#teardowns) runtime.clearAccountState();
    this.#revisions.clear(); this.#principal = null; this.#publish(code);
  }
  beginNewPrincipalEpoch(): void { this.#boundary("ACCOUNT_BOUNDARY_RESET"); }
  async restoreSession(): Promise<AccountSessionProjection | null> {
    const epoch = ++this.#epoch; this.#controller?.abort(); const controller = new AbortController(); this.#controller = controller;
    try {
      const principal = await this.#api.restoreSession(controller.signal);
      if (epoch !== this.#epoch) return null;
      if (this.#principal?.researcherId !== principal.researcherId) { this.#workspace.deactivate(); for (const runtime of this.#teardowns) runtime.clearAccountState(); this.#revisions.clear(); }
      this.#principal = principal; this.#publish("NO_ACTIVE_INVESTIGATION"); return principal;
    } catch (error) {
      if (epoch !== this.#epoch) return null;
      const code = error instanceof ContinuityError && error.code === "SESSION_EXPIRED" ? "SESSION_EXPIRED" : "AUTHENTICATION_REQUIRED";
      this.#boundary(code); return null;
    }
  }
  async openOwnedInvestigation(investigationId: string): Promise<ActivationReceipt> {
    const principal = this.#principal; if (!principal) throw new ContinuityError("AUTHENTICATION_REQUIRED", "Authentication is required.");
    const epoch = this.#epoch; const request = ++this.#request; this.#controller?.abort(); const controller = new AbortController(); this.#controller = controller;
    let aggregate;
    try { aggregate = await this.#api.fetchActivation(investigationId, controller.signal); }
    catch (error) {
      if (epoch === this.#epoch && error instanceof ContinuityError && error.code === "SESSION_EXPIRED") this.#boundary("SESSION_EXPIRED");
      throw error;
    }
    if (epoch !== this.#epoch || request !== this.#request || this.#principal?.researcherId !== principal.researcherId) throw new ContinuityError("ACTIVATION_STALE", "Activation response is stale.");
    const known = this.#revisions.get(aggregate.investigationId); if (known !== undefined && aggregate.aggregateRevision < known) throw new ContinuityError("ACTIVATION_STALE", "Activation revision is stale.");
    const activation = materializeOwnedActivation(aggregate);
    this.#workspace.activateOwnedInvestigation(activation, () => {
      for (const runtime of this.#teardowns) runtime.activateOwnedInvestigation?.(activation);
    });
    this.#revisions.set(aggregate.investigationId, aggregate.aggregateRevision);
    this.#lastActive.write(principal.researcherId, aggregate.investigationId);
    this.#publish("ACTIVATION_READY", aggregate.investigationId);
    return Object.freeze({ code: "ACTIVATION_READY", researcherId: principal.researcherId, investigationId: aggregate.investigationId, aggregateRevision: aggregate.aggregateRevision, requestGeneration: request });
  }
  async restoreLastActiveInvestigation(): Promise<ActivationReceipt | null> {
    const principal = this.#principal; if (!principal) return null;
    const reference = this.#lastActive.read(principal.researcherId); if (!reference) { this.#publish("NO_ACTIVE_INVESTIGATION"); return null; }
    this.#publish("RESTORING_LAST_ACTIVE");
    try { return await this.openOwnedInvestigation(reference); }
    catch (error) { if (error instanceof ContinuityError && (error.code === "INVESTIGATION_NOT_FOUND" || error.code === "ACTIVATION_INVALID")) { this.#workspace.deactivate(); this.#publish(error.code); return null; } throw error; }
  }
  async logout(csrfToken: string): Promise<void> {
    this.#publish("LOGOUT_IN_PROGRESS", this.#state.activeInvestigationId);
    try { await this.#api.logout(csrfToken); } finally { this.#boundary("AUTHENTICATION_REQUIRED"); }
  }
}
