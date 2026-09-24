import type { WorkspaceRuntime } from "./WorkspaceRuntime";
import { WorkspaceMode, type WorkspaceMode as WorkspaceModeType } from "./WorkspaceRuntimeTypes";

export const WORKSPACE_NAVIGATION_OWNER = "isees.workspace-runtime";
export const WORKSPACE_NAVIGATION_SCHEMA_VERSION = 1;

export interface WorkspaceNavigationState {
  readonly owner: typeof WORKSPACE_NAVIGATION_OWNER;
  readonly version: typeof WORKSPACE_NAVIGATION_SCHEMA_VERSION;
  readonly mode: WorkspaceModeType;
  readonly investigationId?: string;
}

export interface WorkspaceNavigationLocation {
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;
}

export interface WorkspaceNavigationPort {
  readonly location: WorkspaceNavigationLocation;
  readonly state: unknown;
  pushState(state: WorkspaceNavigationState, url: string): void;
  replaceState(state: WorkspaceNavigationState, url: string): void;
  listen(listener: (entry: WorkspaceNavigationPopEntry) => void): () => void;
}

export interface WorkspaceNavigationPopEntry {
  readonly state: unknown;
  /** Browser popstate is same-document; the explicit scope prevents cross-document normalization in other ports. */
  readonly documentScope: "ISEES_SPA" | "CROSS_DOCUMENT";
}

const MODES = new Set<WorkspaceModeType>(Object.values(WorkspaceMode));

function parseMode(value: unknown): WorkspaceModeType | undefined {
  if (typeof value !== "string") return undefined;
  if (value.toLowerCase() === "studio") return WorkspaceMode.RESEARCH;
  const mode = value.toUpperCase() as WorkspaceModeType;
  return MODES.has(mode) ? mode : undefined;
}

export function validateWorkspaceNavigationState(value: unknown): WorkspaceNavigationState | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const candidate = value as Record<string, unknown>;
  const mode = parseMode(candidate.mode);
  if (candidate.owner !== WORKSPACE_NAVIGATION_OWNER || candidate.version !== WORKSPACE_NAVIGATION_SCHEMA_VERSION || mode === undefined) return undefined;
  if (candidate.investigationId !== undefined && (typeof candidate.investigationId !== "string" || !candidate.investigationId.trim())) return undefined;
  return Object.freeze({ owner: WORKSPACE_NAVIGATION_OWNER, version: WORKSPACE_NAVIGATION_SCHEMA_VERSION, mode, ...(candidate.investigationId === undefined ? {} : { investigationId: candidate.investigationId }) });
}

function stateFor(runtime: WorkspaceRuntime, mode = runtime.getActiveMode()): WorkspaceNavigationState {
  const investigationId = runtime.getActiveInvestigation()?.id;
  return Object.freeze({ owner: WORKSPACE_NAVIGATION_OWNER, version: WORKSPACE_NAVIGATION_SCHEMA_VERSION, mode, ...(investigationId === undefined ? {} : { investigationId }) });
}

function urlFor(location: WorkspaceNavigationLocation, mode: WorkspaceModeType): string {
  const params = new URLSearchParams(location.search);
  params.set("mode", mode === WorkspaceMode.RESEARCH ? "studio" : mode.toLowerCase());
  const query = params.toString();
  return `${location.pathname}${query ? `?${query}` : ""}${location.hash}`;
}

function sameState(left: WorkspaceNavigationState | undefined, right: WorkspaceNavigationState): boolean {
  return left?.mode === right.mode && left.investigationId === right.investigationId;
}

export class WorkspaceNavigationHistory {
  private restorationReason: string | undefined;
  private readonly runtime: WorkspaceRuntime;
  private readonly browser: WorkspaceNavigationPort;

  constructor(runtime: WorkspaceRuntime, browser: WorkspaceNavigationPort) {
    this.runtime = runtime;
    this.browser = browser;
  }

  getRestorationReason(): string | undefined { return this.restorationReason; }

  synchronizeInitialNavigation(): () => void {
    const state = validateWorkspaceNavigationState(this.browser.state);
    const queryMode = parseMode(new URLSearchParams(this.browser.location.search).get("mode"));
    const requested = state?.mode ?? queryMode ?? WorkspaceMode.OVERVIEW;
    const effective = this.restore(requested, state?.investigationId);
    this.browser.replaceState(stateFor(this.runtime, effective), urlFor(this.browser.location, effective));
    return this.browser.listen(entry => {
      if (entry.documentScope !== "ISEES_SPA") return;
      const restored = validateWorkspaceNavigationState(entry.state);
      if (restored === undefined) {
        const effective = this.restore(WorkspaceMode.OVERVIEW, undefined);
        this.browser.replaceState(stateFor(this.runtime, effective), urlFor(this.browser.location, effective));
        return;
      }
      const effective = this.restore(restored.mode, restored.investigationId);
      if (effective !== restored.mode) {
        this.browser.replaceState(stateFor(this.runtime, effective), urlFor(this.browser.location, effective));
      }
    });
  }

  recordNavigation(mode: WorkspaceModeType): void {
    const next = stateFor(this.runtime, mode);
    if (sameState(validateWorkspaceNavigationState(this.browser.state), next)) return;
    this.browser.pushState(next, urlFor(this.browser.location, mode));
  }

  private restore(requestedMode: WorkspaceModeType, investigationId: string | undefined): WorkspaceModeType {
    const activeId = this.runtime.getActiveInvestigation()?.id;
    const requiresInvestigation = requestedMode !== WorkspaceMode.OVERVIEW && requestedMode !== WorkspaceMode.LIBRARY;
    if (requiresInvestigation && (activeId === undefined || (investigationId !== undefined && investigationId !== activeId))) {
      this.restorationReason = investigationId && activeId !== investigationId
        ? `The investigation referenced by browser history (${investigationId}) is not active.`
        : "The requested workspace mode requires an active investigation.";
      this.runtime.restoreActiveMode(WorkspaceMode.LIBRARY);
      return WorkspaceMode.LIBRARY;
    }
    this.restorationReason = undefined;
    this.runtime.restoreActiveMode(requestedMode);
    return requestedMode;
  }
}

export function createBrowserWorkspaceNavigationPort(browser: Window): WorkspaceNavigationPort {
  return {
    get location() { return browser.location; },
    get state() { return browser.history.state; },
    pushState(state, url) { browser.history.pushState(state, "", url); },
    replaceState(state, url) { browser.history.replaceState(state, "", url); },
    listen(listener) {
      const handle = (event: PopStateEvent) => listener({ state: event.state, documentScope: "ISEES_SPA" });
      browser.addEventListener("popstate", handle);
      return () => browser.removeEventListener("popstate", handle);
    },
  };
}
