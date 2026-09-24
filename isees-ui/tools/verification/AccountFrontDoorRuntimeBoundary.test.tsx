// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/identity/runtime/OperatorIdentityRuntimeContext", () => ({
  useOperatorIdentity: () => ({ status: "READY", identity: null }),
}));

vi.mock("../../src/investigation/continuity/AccountWorkspaceContinuityCoordinator", () => ({
  AccountWorkspaceContinuityCoordinator: class {
    cancelPendingRequests() {}
    getState() { return { principal: null }; }
    async restoreSession() { return null; }
  },
}));

import { AccountFrontDoor } from "../../src/account/AccountFrontDoor";
import { workspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntime";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("AccountFrontDoor runtime boundary", () => {
  it("renders the established public top bar without WorkspaceRuntimeProvider", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const pushState = vi.spyOn(window.history, "pushState");
    const replaceState = vi.spyOn(window.history, "replaceState");
    const workspaceBefore = workspaceRuntime.getState();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(
      <MemoryRouter>
        <AccountFrontDoor><div>workspace child</div></AccountFrontDoor>
      </MemoryRouter>,
    )).not.toThrow();

    await waitFor(() => expect(screen.getByText("iSEES-UAP")).toBeTruthy());
    expect(screen.getByRole("navigation", { name: "Operator workspace modes" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "OVERVIEW" }).getAttribute("aria-pressed")).toBe("true");
    expect((screen.getByRole("button", { name: "LIBRARY" }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole("button", { name: "MANIFOLD" }) as HTMLButtonElement).disabled).toBe(true);
    const page = document.body.textContent ?? "";
    const normalizedPage = page.replace(/\s+/g, " ").replace(/: /g, ":").toUpperCase();
    for (const label of [
      "iSEES-UAP",
      "Emergence Detection System",
      "CAPTURE",
      "GUIDE",
      "SYSTEM BRIEFING",
      "STATUS:ACTIVE",
      "MODE: OVERVIEW",
      "MANIFOLD:ONLINE",
    ]) expect(normalizedPage).toContain(label.replace(/: /g, ":").toUpperCase());
    expect(page).not.toMatch(/\?iSEES\s*\?\s*PUBLIC OVERVIEW\?|PUBLIC OVERVIEW/i);

    const capture = screen.getByRole("link", { name: "Learn about iSEES Capture" });
    const guide = screen.getByRole("button", { name: "Open iSEES Guide" });
    expect(capture.classList.contains("capture-global-link")).toBe(true);
    expect(guide.classList.contains("capture-global-link")).toBe(true);
    expect(guide.classList.contains("isees-guide-affordance")).toBe(false);

    const topBar = document.querySelector<HTMLElement>('[data-operational-top-bar="true"]')!;
    const topBarHeight = topBar.style.height;
    const topBarChildren = topBar.childElementCount;
    guide.focus();
    fireEvent.click(guide);
    expect(screen.getByRole("button", { name: "Close iSEES Guide" }).getAttribute("aria-expanded")).toBe("true");
    const dialog = screen.getByRole("dialog", { name: "iSEES Guided Orientation" });
    expect(topBar.contains(dialog)).toBe(false);
    expect(topBar.style.height).toBe(topBarHeight);
    expect(topBar.childElementCount).toBe(topBarChildren);
    expect(document.activeElement).toBe(dialog);

    fireEvent.click(screen.getAllByRole("button", { name: "Exit Orientation" })[0]!);
    await waitFor(() => expect(document.activeElement).toBe(guide));
    expect(screen.queryByRole("dialog", { name: "iSEES Guided Orientation" })).toBeNull();

    const start = screen.getByRole("button", { name: "Start Guided Orientation" });
    start.focus();
    fireEvent.keyDown(start, { key: "Enter" });
    fireEvent.click(start);
    expect(screen.getByRole("dialog", { name: "iSEES Guided Orientation" })).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(document.activeElement).toBe(start));
    expect(screen.queryByRole("dialog", { name: "iSEES Guided Orientation" })).toBeNull();

    expect(fetch).not.toHaveBeenCalled();
    expect(pushState).not.toHaveBeenCalled();
    expect(replaceState).not.toHaveBeenCalled();
    expect(workspaceRuntime.getState()).toBe(workspaceBefore);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
