import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import IseesGuideAffordance from "../../src/guide/components/IseesGuideAffordance.tsx";
import IseesGuidePanel from "../../src/guide/components/IseesGuidePanel.tsx";
import { GuidePresentationProvider } from "../../src/guide/presentation/GuidePresentationContext.tsx";
import { resolveGuideDefinition } from "../../src/guide/registry/GuideDefinitionRegistry.ts";
import { GUIDE_CONTEXT_SNAPSHOT_SCHEMA_ID, GUIDE_CONTEXT_SNAPSHOT_SCHEMA_VERSION, GuideIdentityClassification, GuideLayoutClassification, GuideLayersExperimentClassification, GuidePresentationClassification, GuideResearchInboxClassification, GuideResolveClassification, GuideSelectionClassification, GuideWorkspaceStatus, type GuideContextSnapshot } from "../../src/guide/contracts/index.ts";
import { WorkspaceMode } from "../../src/workspace/runtime/WorkspaceRuntimeTypes.ts";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const snapshot: GuideContextSnapshot = { schemaId: GUIDE_CONTEXT_SNAPSHOT_SCHEMA_ID, schemaVersion: GUIDE_CONTEXT_SNAPSHOT_SCHEMA_VERSION, route: "/", identity: GuideIdentityClassification.GUEST, workspaceStatus: GuideWorkspaceStatus.ACTIVE, activeMode: WorkspaceMode.LAYERS, layout: GuideLayoutClassification.NORMAL, selection: { classification: GuideSelectionClassification.NONE }, comparison: { classification: "NONE" }, resolve: { classification: GuideResolveClassification.UNRESOLVED }, activeLayerIds: [], layersExperiment: { classification: GuideLayersExperimentClassification.EMPTY }, researchInbox: { classification: GuideResearchInboxClassification.EMPTY, newLeadCount: 0, incomingSourceCount: 0, collectedFindingCount: 0 }, guidePresentation: GuidePresentationClassification.CLOSED };

describe("iSEES Guide interaction", () => {
  it("renders operational Start Here and global advisory once while retaining the mode boundary", () => {
    const operational = { ...snapshot, activeMode: WorkspaceMode.COMPARE };
    render(<GuidePresentationProvider><IseesGuideAffordance /><IseesGuidePanel resolution={resolveGuideDefinition(operational)} /></GuidePresentationProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Open iSEES Guide" }));
    expect(screen.getAllByText("Choose a comparison event from CHANGE COMPARISON.")).toHaveLength(1);
    expect(screen.getAllByText("Guide is advisory. It does not select controls, run computations, publish research, or modify System Canon.")).toHaveLength(1);
    expect(screen.getByText("COMPARE does not accept or reject relationships; acceptance belongs to the existing MANIFOLD/Resolve workflow.")).toBeTruthy();
    expect(screen.getByText("Confirm whether the relationship is already accepted.")).toBeTruthy();
  });

  it("opens explicitly, spotlights without activation, then Escape clears spotlight before closing", () => {
    const click = vi.fn();
    render(<GuidePresentationProvider><IseesGuideAffordance /><IseesGuidePanel resolution={resolveGuideDefinition(snapshot)} /><button data-guide-id="layers.prerequisite.run-resolve" onClick={click}>Run Resolve target</button></GuidePresentationProvider>);
    const guide = screen.getByRole("button", { name: "Open iSEES Guide" });
    expect(screen.queryByRole("complementary")).toBeNull();
    fireEvent.click(guide);
    expect(screen.getByRole("button", { name: "Close iSEES Guide" })).toBe(guide);
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "iSEES Guide" }));
    const target = screen.getByRole("button", { name: "Run Resolve target" });
    vi.spyOn(target, "getClientRects").mockReturnValue({ length: 1 } as DOMRectList);
    target.scrollIntoView = vi.fn();
    fireEvent.click(screen.getByRole("button", { name: "Show Me" }));
    expect(click).not.toHaveBeenCalled(); expect(target.dataset.guideSpotlight).toBe("true");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("complementary")).toBeTruthy(); expect(target.dataset.guideSpotlight).toBeUndefined();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("complementary")).toBeNull(); expect(document.activeElement).toBe(guide);
  });

  it("falls back to textual guidance when a Show Me target is missing", () => {
    render(<GuidePresentationProvider><IseesGuideAffordance /><IseesGuidePanel resolution={resolveGuideDefinition(snapshot)} /></GuidePresentationProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Open iSEES Guide" }));
    fireEvent.click(screen.getByRole("button", { name: "Show Me" }));
    expect(screen.getByText("The requested control is not currently available. Follow the textual guidance instead.")).toBeTruthy();
    expect(screen.getByRole("complementary")).toBeTruthy();
  });
});
