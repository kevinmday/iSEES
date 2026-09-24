import { describe, expect, it, vi } from "vitest";
import type { Investigation } from "../../src/investigation/investigationTypes";
import { WorkspaceNavigationHistory, type WorkspaceNavigationPopEntry, type WorkspaceNavigationPort, type WorkspaceNavigationState } from "../../src/workspace/runtime/WorkspaceNavigationHistory";
import { WorkspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntime";
import { WorkspaceMode } from "../../src/workspace/runtime/WorkspaceRuntimeTypes";

class MemoryBrowser implements WorkspaceNavigationPort {
  entries: Array<{ state: unknown; url: string }>;
  index = 0;
  listeners = new Set<(entry: WorkspaceNavigationPopEntry) => void>();
  pushes = 0;
  replaces = 0;

  constructor(url = "/") { this.entries = [{ state: null, url }]; }
  get state(): unknown { return this.entries[this.index]?.state; }
  get location() {
    const url = new URL(this.entries[this.index]?.url ?? "/", "https://isees.test");
    return { pathname: url.pathname, search: url.search, hash: url.hash };
  }
  pushState(state: WorkspaceNavigationState, url: string): void {
    this.entries.splice(this.index + 1, Number.POSITIVE_INFINITY, { state, url });
    this.index += 1; this.pushes += 1;
  }
  replaceState(state: WorkspaceNavigationState, url: string): void {
    this.entries[this.index] = { state, url }; this.replaces += 1;
  }
  listen(listener: (entry: WorkspaceNavigationPopEntry) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  back(): void { if (this.index === 0) return; this.index -= 1; this.emit(); }
  forward(): void { if (this.index >= this.entries.length - 1) return; this.index += 1; this.emit(); }
  emitCrossDocument(state: unknown): void { for (const listener of this.listeners) listener({ state, documentScope: "CROSS_DOCUMENT" }); }
  private emit(): void { for (const listener of this.listeners) listener({ state: this.state, documentScope: "ISEES_SPA" }); }
}

function active(runtime: WorkspaceRuntime, id = "investigation:guest"): Investigation {
  const investigation = { id } as Investigation;
  runtime.setActiveInvestigation(investigation);
  return investigation;
}

function connected(url = "/", withInvestigation = false) {
  const runtime = new WorkspaceRuntime();
  const investigation = withInvestigation ? active(runtime) : undefined;
  const browser = new MemoryBrowser(url);
  const navigation = new WorkspaceNavigationHistory(runtime, browser);
  runtime.attachNavigationRecorder(mode => navigation.recordNavigation(mode));
  const stop = navigation.synchronizeInitialNavigation();
  return { runtime, investigation, browser, navigation, stop };
}

describe("Workspace browser navigation", () => {
  it("pushes one OVERVIEW to LIBRARY entry, restores Back/Forward, and deduplicates", () => {
    const { runtime, browser } = connected();
    expect(browser.replaces).toBe(1);
    expect(browser.pushes).toBe(0);
    runtime.navigateToMode(WorkspaceMode.LIBRARY);
    runtime.navigateToMode(WorkspaceMode.LIBRARY);
    expect(browser.pushes).toBe(1);
    browser.back(); expect(runtime.getActiveMode()).toBe(WorkspaceMode.OVERVIEW);
    expect(browser.pushes).toBe(1);
    browser.forward(); expect(runtime.getActiveMode()).toBe(WorkspaceMode.LIBRARY);
  });

  it("retains one investigation across LIBRARY to MANIFOLD history", () => {
    const { runtime, browser, investigation } = connected("/?mode=library", true);
    runtime.navigateToMode(WorkspaceMode.MANIFOLD);
    expect(browser.pushes).toBe(1);
    browser.back();
    expect(runtime.getActiveMode()).toBe(WorkspaceMode.LIBRARY);
    expect(runtime.getActiveInvestigation()).toBe(investigation);
    browser.forward();
    expect(runtime.getActiveMode()).toBe(WorkspaceMode.MANIFOLD);
    expect(runtime.getActiveInvestigation()).toBe(investigation);
  });

  it("orders analytical entries without invoking computation or mutating session state", () => {
    const { runtime, browser, investigation } = connected("/?mode=manifold", true);
    const session = runtime.getState().session;
    const resolve = vi.fn();
    runtime.navigateToMode(WorkspaceMode.COMPARE);
    runtime.navigateToMode(WorkspaceMode.EVIDENCE);
    browser.back(); expect(runtime.getActiveMode()).toBe(WorkspaceMode.COMPARE);
    browser.back(); expect(runtime.getActiveMode()).toBe(WorkspaceMode.MANIFOLD);
    browser.forward(); expect(runtime.getActiveMode()).toBe(WorkspaceMode.COMPARE);
    browser.forward(); expect(runtime.getActiveMode()).toBe(WorkspaceMode.EVIDENCE);
    expect(runtime.getState().session).toBe(session);
    expect(runtime.getActiveInvestigation()).toBe(investigation);
    expect(resolve).not.toHaveBeenCalled();
  });

  it("preserves Studio-owned references when View in Manifold is reversed", () => {
    const { runtime, browser } = connected("/?mode=studio", true);
    const author = { document: { id: "author:1" } };
    const researchInbox = [{ id: "lead:1" }];
    const candidateKnowledge = { id: "candidate:1" };
    runtime.navigateToMode(WorkspaceMode.MANIFOLD);
    browser.back();
    expect(runtime.getActiveMode()).toBe(WorkspaceMode.RESEARCH);
    expect(author.document.id).toBe("author:1");
    expect(researchInbox).toEqual([{ id: "lead:1" }]);
    expect(candidateKnowledge.id).toBe("candidate:1");
  });

  it("restores valid deep links and fails closed for unavailable or malformed navigation", () => {
    expect(connected("/?mode=compare", true).runtime.getActiveMode()).toBe(WorkspaceMode.COMPARE);
    const unavailable = connected("/?mode=evidence");
    expect(unavailable.runtime.getActiveMode()).toBe(WorkspaceMode.LIBRARY);
    expect(unavailable.navigation.getRestorationReason()).toMatch(/active investigation/);
    expect(unavailable.browser.pushes).toBe(0);
    const malformed = connected("/?mode=not-a-mode");
    expect(malformed.runtime.getActiveMode()).toBe(WorkspaceMode.OVERVIEW);
    expect(malformed.browser.pushes).toBe(0);
  });

  it("fails stale investigation entries to LIBRARY without substitution or requests", () => {
    const { runtime, browser, navigation } = connected("/?mode=library", true);
    const request = vi.fn();
    browser.pushState({ owner: "isees.workspace-runtime", version: 1, mode: WorkspaceMode.MANIFOLD, investigationId: "missing" }, "/?mode=manifold");
    browser.back(); browser.forward();
    expect(runtime.getActiveMode()).toBe(WorkspaceMode.LIBRARY);
    expect(runtime.getActiveInvestigation()?.id).toBe("investigation:guest");
    expect(navigation.getRestorationReason()).toMatch(/missing/);
    expect(request).not.toHaveBeenCalled();
  });

  it("normalizes a malformed same-document entry without pushing or looping", () => {
    const { runtime, browser } = connected();
    browser.pushState({ owner: "other-application", version: 99, mode: "broken" } as never, "/?mode=broken");
    const pushes = browser.pushes;
    browser.back(); browser.forward();
    expect(runtime.getActiveMode()).toBe(WorkspaceMode.OVERVIEW);
    expect(browser.pushes).toBe(pushes);
    expect(browser.state).toMatchObject({ owner: "isees.workspace-runtime", version: 1, mode: WorkspaceMode.OVERVIEW });
    expect(browser.location.search).toBe("?mode=overview");
  });

  it("does not manufacture entries at the browser exit boundary", () => {
    const { runtime, browser } = connected();
    runtime.navigateToMode(WorkspaceMode.LIBRARY);
    browser.back();
    expect(browser.index).toBe(0);
    expect(browser.entries).toHaveLength(2);
    browser.back();
    expect(browser.index).toBe(0);
    expect(browser.entries).toHaveLength(2);
  });

  it("does not restore or rewrite a cross-document destination", () => {
    const { runtime, browser } = connected();
    runtime.navigateToMode(WorkspaceMode.LIBRARY);
    const before = { mode: runtime.getActiveMode(), state: browser.state, url: browser.entries[browser.index]?.url, replaces: browser.replaces };
    browser.emitCrossDocument({ owner: "foreign-document", mode: "broken" });
    expect(runtime.getActiveMode()).toBe(before.mode);
    expect(browser.state).toBe(before.state);
    expect(browser.entries[browser.index]?.url).toBe(before.url);
    expect(browser.replaces).toBe(before.replaces);
  });
});
