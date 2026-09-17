import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";

import ManifoldInstrumentLayer, {
  instrumentRectsIntersect,
  resolveInstrumentHomePosition,
  resolveInstrumentLayout,
} from "../../src/manifold/components/ManifoldInstrumentLayer";
import ManifoldInstrumentPalette from "../../src/manifold/components/ManifoldInstrumentPalette";

const sizes = {
  computation: { width: 142, height: 250 },
  camera: { width: 142, height: 150 },
  projection: { width: 142, height: 80 },
  "manifold-map": { width: 238, height: 190 },
};

function rectangles(layout: Readonly<Record<string, { x: number; y: number }>>) {
  return Object.entries(layout).map(([id, point]) => ({ id, ...point, ...sizes[id as keyof typeof sizes] }));
}

describe("MANIFOLD shared floatable instrument placement", () => {
  it("right-anchors Camera responsively with a safe inset", () => {
    expect(resolveInstrumentHomePosition({ right: 12, top: 12 }, 900, sizes.camera.width))
      .toEqual({ x: 746, y: 12 });
    expect(resolveInstrumentHomePosition({ right: 12, top: 12 }, 360, sizes.camera.width))
      .toEqual({ x: 206, y: 12 });
    expect(resolveInstrumentHomePosition({ right: 12, top: 12 }, 120, sizes.camera.width))
      .toEqual({ x: 0, y: 12 });
    expect(resolveInstrumentHomePosition({ x: 12, y: 12 }, 900, sizes.computation.width))
      .toEqual({ x: 12, y: 12 });
    expect(resolveInstrumentHomePosition({ x: 12, y: 154 }, 900, sizes.projection.width))
      .toEqual({ x: 12, y: 154 });
  });

  it("places expanded Resolve feedback, projection, camera, and minimap without intersection", () => {
    const instruments = [
      { id: "computation", preferred: { x: 12, y: 12 }, size: sizes.computation },
      { id: "projection", preferred: { x: 12, y: 154 }, size: sizes.projection },
      { id: "camera", preferred: { x: 166, y: 12 }, size: sizes.camera },
      { id: "manifold-map", preferred: { x: 310, y: 12 }, size: sizes["manifold-map"] },
    ];
    const viewport = { width: 900, height: 600 };
    const first = resolveInstrumentLayout(instruments, viewport, "computation");
    const second = resolveInstrumentLayout(instruments, viewport, "computation");
    expect(second).toEqual(first);

    const rects = rectangles(first);
    for (let index = 0; index < rects.length; index += 1) {
      const rect = rects[index]!;
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width);
      expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height);
      for (const other of rects.slice(index + 1)) {
        expect(instrumentRectsIntersect(rect, other)).toBe(false);
      }
    }
    expect(instrumentRectsIntersect(rects.find(rect => rect.id === "computation")!, rects.find(rect => rect.id === "projection")!)).toBe(false);
  });

  it("re-clamps deterministically for viewport and projection changes without touching domain state", () => {
    const domainState = Object.freeze({ graph: Object.freeze({ nodes: ["n1"], edges: ["e1"] }), resolve: Object.freeze({ revision: 7 }) });
    const before = JSON.stringify(domainState);
    const instruments = [
      { id: "computation", preferred: { x: 700, y: 500 }, size: sizes.computation },
      { id: "projection", preferred: { x: 760, y: 530 }, size: sizes.projection },
    ];
    const twoD = resolveInstrumentLayout(instruments, { width: 900, height: 600 });
    const threeD = resolveInstrumentLayout(instruments, { width: 520, height: 360 });
    expect(twoD).not.toEqual(threeD);
    for (const rect of rectangles(threeD).filter(item => item.id !== "camera" && item.id !== "manifold-map")) {
      expect(rect.x + rect.width).toBeLessThanOrEqual(520);
      expect(rect.y + rect.height).toBeLessThanOrEqual(360);
    }
    expect(JSON.stringify(domainState)).toBe(before);
  });
});

class TestResizeObserver {
  static callbacks: ResizeObserverCallback[] = [];
  constructor(callback: ResizeObserverCallback) { TestResizeObserver.callbacks.push(callback); }
  observe() { /* test-owned geometry */ }
  disconnect() { /* no external resource */ }
  unobserve() { /* test-owned geometry */ }
}

function DragHarness({ onCollapse = vi.fn() }: { onCollapse?: () => void }) {
  const [mode, setMode] = useState<"2D" | "3D">("2D");
  const [expanded, setExpanded] = useState(true);
  return <div>
    <button onClick={() => setMode(value => value === "2D" ? "3D" : "2D")}>mode</button>
    <button onClick={() => { setExpanded(false); onCollapse(); }}>collapse feedback</button>
    <ManifoldInstrumentLayer viewport={{ width: mode === "2D" ? 500 : 360, height: 320 }} projectionMode={mode}>
      <ManifoldInstrumentPalette instrumentId="computation" title="Computation" defaultPosition={{ x: 12, y: 12 }}>
        <div>{expanded ? "RESOLVE COMPLETED DETAILS" : "collapsed"}</div>
      </ManifoldInstrumentPalette>
      <ManifoldInstrumentPalette instrumentId="projection" title="Projection" defaultPosition={{ x: 12, y: 154 }}>
        <button>2D</button><button>3D</button>
      </ManifoldInstrumentPalette>
    </ManifoldInstrumentLayer>
  </div>;
}

describe("MANIFOLD floatable interaction", () => {
  beforeEach(() => {
    TestResizeObserver.callbacks = [];
    vi.stubGlobal("ResizeObserver", TestResizeObserver);
    Object.defineProperties(HTMLElement.prototype, {
      setPointerCapture: { configurable: true, value: vi.fn() },
      releasePointerCapture: { configurable: true, value: vi.fn() },
      hasPointerCapture: { configurable: true, value: vi.fn(() => true) },
    });
    window.localStorage.clear();
    Object.defineProperties(HTMLElement.prototype, {
      offsetWidth: { configurable: true, get() { return this.dataset.manifoldInstrument === "computation" ? 142 : 142; } },
      offsetHeight: { configurable: true, get() { return this.dataset.manifoldInstrument === "computation" ? 250 : 80; } },
      clientWidth: { configurable: true, get() { return 500; } },
      clientHeight: { configurable: true, get() { return 320; } },
    });
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("preserves dragging and persists the collision-resolved position", () => {
    render(<DragHarness />);
    const computation = document.querySelector<HTMLElement>('[data-manifold-instrument="computation"]')!;
    const handle = screen.getByText("Computation").parentElement!;
    Object.defineProperty(computation, "offsetParent", { configurable: true, get: () => document.body });
    Object.defineProperty(computation, "offsetLeft", { configurable: true, get: () => Number.parseFloat(computation.style.left) || 0 });
    Object.defineProperty(computation, "offsetTop", { configurable: true, get: () => Number.parseFloat(computation.style.top) || 0 });
    act(() => { for (const callback of TestResizeObserver.callbacks) callback([], {} as ResizeObserver); });
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 20, clientY: 20 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 430, clientY: 290 });
    fireEvent.pointerUp(handle, { pointerId: 1, clientX: 430, clientY: 290 });
    expect(Number.parseFloat(computation.style.left)).toBeLessThanOrEqual(358);
    expect(Number.parseFloat(computation.style.top)).toBeLessThanOrEqual(70);
    expect(window.localStorage.getItem("isees.manifold.instrument.computation")).toContain("FLOATING");
  });

  it("collapse changes only computation presentation and mode change keeps instruments available", () => {
    const collapse = vi.fn();
    render(<DragHarness onCollapse={collapse} />);
    expect(screen.getByText("RESOLVE COMPLETED DETAILS")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "collapse feedback" }));
    expect(screen.queryByText("RESOLVE COMPLETED DETAILS")).toBeNull();
    expect(screen.getByText("collapsed")).toBeTruthy();
    expect(screen.getByRole("button", { name: "2D" })).toBeTruthy();
    expect(collapse).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "mode" }));
    expect(document.querySelectorAll("[data-manifold-instrument]")).toHaveLength(2);
  });
});
