// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WorkspaceModeBarPresentation } from "../../src/components/workspace/WorkspaceModeBar";
import { WorkspaceMode } from "../../src/workspace/runtime/WorkspaceRuntimeTypes";

afterEach(cleanup);

describe("public front-door MODE navigation", () => {
  it("renders the canonical order with Overview active, Library operable, and investigation modes disabled", () => {
    const navigate = vi.fn();
    render(<WorkspaceModeBarPresentation
      activeMode={WorkspaceMode.OVERVIEW}
      getModeAvailability={(mode) => mode === WorkspaceMode.OVERVIEW || mode === WorkspaceMode.LIBRARY
        ? { available: true }
        : { available: false, reason: "Import or activate an investigation before entering this workspace mode." }}
      onNavigate={navigate}
    />);

    const buttons = screen.getAllByRole("button");
    expect(buttons.map(button => button.textContent)).toEqual(["OVERVIEW", "LIBRARY", "MANIFOLD", "COMPARE", "NARRATIVE", "EVIDENCE", "TIMELINE", "LAYERS", "INTENTION", "STUDIO"]);
    expect(screen.getByRole("button", { name: "OVERVIEW" }).getAttribute("aria-pressed")).toBe("true");
    const library = screen.getByRole("button", { name: "LIBRARY" });
    expect((library as HTMLButtonElement).disabled).toBe(false);
    library.focus();
    expect(document.activeElement).toBe(library);
    fireEvent.keyDown(library, { key: "Enter" });
    fireEvent.click(library);
    expect(navigate).toHaveBeenCalledWith(WorkspaceMode.LIBRARY);
    for (const label of ["MANIFOLD", "COMPARE", "NARRATIVE", "EVIDENCE", "TIMELINE", "LAYERS", "INTENTION", "STUDIO"]) expect((screen.getByRole("button", { name: label }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("is a pure presentation: rendering performs no navigation or request", () => {
    const navigate = vi.fn();
    const request = vi.spyOn(globalThis, "fetch");
    render(<WorkspaceModeBarPresentation activeMode={WorkspaceMode.OVERVIEW} getModeAvailability={() => ({ available: true })} onNavigate={navigate} />);
    expect(navigate).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
    request.mockRestore();
  });
});
