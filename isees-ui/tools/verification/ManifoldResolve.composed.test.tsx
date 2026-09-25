import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ComputePanel from "../../src/investigationControl/ComputePanel";
import ManifoldCameraInstrument from "../../src/manifold/components/ManifoldCameraInstrument";
import ManifoldInstrumentLayer, { instrumentRectsIntersect } from "../../src/manifold/components/ManifoldInstrumentLayer";
import ManifoldMapInstrument from "../../src/manifold/components/ManifoldMapInstrument";
import ManifoldToolbar from "../../src/manifold/components/ManifoldToolbar";
import ManifoldProjectionStatus from "../../src/components/workspace/ManifoldProjectionStatus";
import { resolveActiveOperationalGraphProjection } from "../../src/investigation/revision/OperationalGraphRevision";
import { KnowledgeObjectRuntimeProvider } from "../../src/knowledge/runtime/KnowledgeObjectRuntimeContext";
import { bootstrapKnowledgeRuntime, buildKnowledgeBootstrapPopulation } from "../../src/knowledge/ingestion/KnowledgeRuntimeBootstrap";
import { createBlankNativeCaseDraftContent, restoreNativeCaseDraftContent, suppliedEnvelope } from "../../src/nativeCaseDraft/NativeCaseDraftFieldState";
import { ResolveRuntime } from "../../src/resolve/runtime/ResolveRuntime";
import { ResolveRuntimeProvider } from "../../src/resolve/runtime/ResolveRuntimeContext";
import { createGuestCandidateInvestigation } from "../../src/workspace/guestCase/GuestCaseIntake";
import { workspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntime";
import { WorkspaceRuntimeProvider } from "../../src/workspace/runtime/WorkspaceRuntimeContext";
import { WorkspaceSelectionKind } from "../../src/workspace/runtime/WorkspaceRuntimeTypes";

const recordedAt = "2026-09-12T12:00:00.000Z";
const identity = { status: "READY" as const, identity: { kind: "GUEST" as const, operatorId: "guest:composed-resolve", establishedAt: recordedAt }, persistence: "SESSION" as const, revision: 1 };

class TestResizeObserver {
  static callbacks: ResizeObserverCallback[] = [];
  constructor(callback: ResizeObserverCallback) { TestResizeObserver.callbacks.push(callback); }
  observe() { /* composed test controls notification */ }
  disconnect() { /* no external resource */ }
  unobserve() { /* no external resource */ }
}

function establishPair() {
  const canonical = buildKnowledgeBootstrapPopulation();
  const blank = restoreNativeCaseDraftContent(createBlankNativeCaseDraftContent());
  const form = Object.freeze({
    ...blank,
    workingTitle: suppliedEnvelope("Case #39 Medford Geomagnetic Observation"),
    observationNarrative: suppliedEnvelope("Eight witnesses observed a luminous oval before rapid westward departure."),
  });
  const created = createGuestCandidateInvestigation(form, identity, recordedAt, "composed-resolve");
  if (created.status !== "CREATED") throw new Error(created.message);
  const target = canonical.find(object => object.type === "EVENT" && object.provenance.sourceId === "E-TICTAC-2004");
  if (!target) throw new Error("Nimitz comparison fixture unavailable.");
  workspaceRuntime.activateGuestCandidateInvestigation(created.investigation);
  workspaceRuntime.setSelection({ kind: WorkspaceSelectionKind.COMPARISON_TARGET, eventId: target.provenance.sourceId, knowledgeObjectId: target.identity.id });
  return { created, target };
}

function ComposedWorkspace() {
  const investigation = workspaceRuntime.getActiveInvestigation();
  if (!investigation) throw new Error("Active investigation unavailable.");
  const graph = resolveActiveOperationalGraphProjection(investigation);
  return <>
    <aside><ComputePanel /></aside>
    <main>
      <ManifoldProjectionStatus />
      <ManifoldInstrumentLayer viewport={{ width: 900, height: 600 }} projectionMode="2D">
        <ManifoldToolbar onAction={() => undefined} />
        <ManifoldCameraInstrument onAction={() => undefined} />
        <ManifoldMapInstrument nodes={[...graph.nodes]} edges={[...graph.edges]} focusedEventId={graph.centerNodeId} selection={workspaceRuntime.getSelection()} camera={null} />
      </ManifoldInstrumentLayer>
    </main>
  </>;
}

function providers() {
  return <KnowledgeObjectRuntimeProvider><WorkspaceRuntimeProvider><ResolveRuntimeProvider><ComposedWorkspace /></ResolveRuntimeProvider></WorkspaceRuntimeProvider></KnowledgeObjectRuntimeProvider>;
}

function instrumentRect(element: HTMLElement) {
  return {
    id: element.dataset.manifoldInstrument!,
    x: Number.parseFloat(element.style.left),
    y: Number.parseFloat(element.style.top),
    width: element.offsetWidth,
    height: element.offsetHeight,
  };
}

describe("composed MANIFOLD Resolve workspace", () => {
  beforeEach(() => {
    workspaceRuntime.deactivate();
    bootstrapKnowledgeRuntime();
    TestResizeObserver.callbacks = [];
    vi.stubGlobal("ResizeObserver", TestResizeObserver);
    Object.defineProperties(HTMLElement.prototype, {
      offsetParent: { configurable: true, get() { return this.parentElement; } },
      clientWidth: { configurable: true, get() { return 900; } },
      clientHeight: { configurable: true, get() { return 600; } },
      offsetWidth: { configurable: true, get() { return this.dataset.manifoldInstrument === "manifold-map" ? 238 : 142; } },
      offsetHeight: { configurable: true, get() {
        if (this.dataset.manifoldInstrument === "computation") return this.querySelector("[data-computation-feedback]")?.textContent?.includes("RESULT CURRENT") ? 250 : 160;
        if (this.dataset.manifoldInstrument === "manifold-map") return 190;
        return this.dataset.manifoldInstrument === "camera" ? 150 : 80;
      } },
    });
  });
  afterEach(() => { cleanup(); workspaceRuntime.deactivate(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("exposes one authoritative Resolve control in the canvas Computation instrument", async () => {
    const { created, target } = establishPair();
    const graphBefore = resolveActiveOperationalGraphProjection(created.investigation);
    const execution = vi.spyOn(ResolveRuntime.prototype, "execute");
    render(providers());
    const navigator = document.querySelector("aside")!;
    const computation = document.querySelector<HTMLElement>('[data-manifold-instrument="computation"]')!;
    expect(within(navigator).queryByRole("button", { name: /resolve/i })).toBeNull();
    expect(within(navigator).getByText(/Configure the deterministic context/)).toBeTruthy();
    expect(within(navigator).getByText(/Compute non-canonical relationship candidates for inspection/)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "COMPUTE RELATIONSHIPS" })).toHaveLength(1);
    expect(within(computation).getByRole("button", { name: "COMPUTE RELATIONSHIPS" })).toBeTruthy();
    expect(screen.getByText("ANALYSIS READY")).toBeTruthy();
    expect(screen.getAllByText(/· ANALYSIS READY/)).toHaveLength(2);
    expect(within(computation).getByRole("button", { name: "CLEAR MANIFOLD RESULT" })).toBeTruthy();
    const projection = document.querySelector<HTMLElement>('[data-manifold-instrument="projection"]')!;
    expect(within(projection).getByText("VIEW")).toBeTruthy();
    expect(within(projection).getByRole("button", { name: "COLLAPSE" })).toBeTruthy();

    await userEvent.click(within(computation).getByRole("button", { name: "COMPUTE RELATIONSHIPS" }));
    await waitFor(() => expect(screen.getByText("RESULT CURRENT")).toBeTruthy());
    expect(execution).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText(/· RESULT CURRENT/)).toHaveLength(2);
    expect(screen.getByText(/Candidates produced: 6/)).toBeTruthy();
    expect(screen.getByText(`Comparison case: ${target.metadata.title}`)).toBeTruthy();
    expect(resolveActiveOperationalGraphProjection(workspaceRuntime.getActiveInvestigation()!).nodes).toHaveLength(graphBefore.nodes.length);
    expect(resolveActiveOperationalGraphProjection(workspaceRuntime.getActiveInvestigation()!).edges).toHaveLength(graphBefore.edges.length);

    const layersBefore = workspaceRuntime.getActiveLayers();
    const temporalBefore = workspaceRuntime.getTemporalContext();
    const scaleBefore = workspaceRuntime.getInvestigativeScale();
    for (const [change, restore] of [
      [() => workspaceRuntime.setActiveLayers([...layersBefore, "TEMPORAL"]), () => workspaceRuntime.setActiveLayers(layersBefore)],
      [() => workspaceRuntime.setTemporalContext({ verification: "changed" }), () => workspaceRuntime.setTemporalContext(temporalBefore)],
      [() => workspaceRuntime.setInvestigativeScale({ verification: "changed" }), () => workspaceRuntime.setInvestigativeScale(scaleBefore)],
    ] as const) {
      act(change);
      await waitFor(() => expect(screen.getAllByText(/· RESULT OUT OF DATE/)).toHaveLength(2));
      expect(execution).toHaveBeenCalledTimes(1);
      act(restore);
      await waitFor(() => expect(screen.getAllByText(/· RESULT CURRENT/)).toHaveLength(2));
    }

    const notificationsBefore = TestResizeObserver.callbacks.length;
    act(() => { for (const callback of TestResizeObserver.callbacks) callback([], {} as ResizeObserver); });
    expect(TestResizeObserver.callbacks.length).toBe(notificationsBefore);
    await waitFor(() => {
      const rectangles = [...document.querySelectorAll<HTMLElement>("[data-manifold-instrument]")].map(instrumentRect);
      expect(rectangles).toHaveLength(4);
      for (let index = 0; index < rectangles.length; index += 1) {
        for (const other of rectangles.slice(index + 1)) expect(instrumentRectsIntersect(rectangles[index]!, other)).toBe(false);
      }
    });

    const graphSnapshot = JSON.stringify(resolveActiveOperationalGraphProjection(workspaceRuntime.getActiveInvestigation()!));
    await userEvent.click(screen.getByRole("button", { name: "COLLAPSE" }));
    expect(screen.queryByText("RESULT CURRENT")).toBeNull();
    expect(JSON.stringify(resolveActiveOperationalGraphProjection(workspaceRuntime.getActiveInvestigation()!))).toBe(graphSnapshot);
    expect(workspaceRuntime.getSelection()).toMatchObject({ kind: WorkspaceSelectionKind.CANDIDATE, rightKnowledgeObjectId: target.identity.id });
  });
});
