// ============================================================
// src/manifold/components/ManifoldInstrumentPalette.tsx
// P45A-B2
// MANIFOLD INSTRUMENT PALETTE
//
// Generic dockable / draggable analytical instrument projected
// over the Investigation Manifold topology viewport.
//
// SC-009:
// MANIFOLD INSTRUMENT ARCHITECTURE
//
// This component owns:
// • Instrument presentation
// • Local floating position
// • Drag interaction
// • Canonical dock position
// • Dock / float state
// • Snap-to-dock behavior
//
// It does NOT own:
// • Computational semantics
// • Manifold runtime
// • Graph computation
// • Graph projection
// • Persistent workspace state
//
// ============================================================

import {
  useRef,
  useState,
} from "react";

import type {
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";

// ============================================================
// TYPES
// ============================================================

interface InstrumentPosition {
  x: number;
  y: number;
}

type InstrumentDockState =
  | "DOCKED"
  | "FLOATING";

interface PersistedInstrumentState {
  position: InstrumentPosition;
  dockState: InstrumentDockState;
}

const INSTRUMENT_STORAGE_PREFIX =
  "isees.manifold.instrument.";

interface ManifoldInstrumentPaletteProps {
  instrumentId: string;
  title: string;
  children: ReactNode;
  defaultPosition: InstrumentPosition;
  width?: number;
}

// ============================================================
// CONSTANTS
// ============================================================

const DOCK_SNAP_TOLERANCE = 32;

// ============================================================
// PERSISTENCE
// ============================================================

function loadInstrumentState(
  instrumentId: string,
  defaultPosition: InstrumentPosition,
): PersistedInstrumentState {

  const fallback: PersistedInstrumentState = {
    position: defaultPosition,
    dockState: "DOCKED",
  };

  try {

    const raw =
      window.localStorage.getItem(
        `${INSTRUMENT_STORAGE_PREFIX}${instrumentId}`
      );

    if (!raw) {
      return fallback;
    }

    const parsed =
      JSON.parse(raw) as
        Partial<PersistedInstrumentState>;

    const x =
      parsed.position?.x;

    const y =
      parsed.position?.y;

    const dockState =
      parsed.dockState;

    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      (
        dockState !== "DOCKED" &&
        dockState !== "FLOATING"
      )
    ) {
      return fallback;
    }

    if (dockState === "DOCKED") {

      return {
        position: defaultPosition,
        dockState: "DOCKED",
      };

    }

    return {
      position: {
        x,
        y,
      },
      dockState: "FLOATING",
    };

  } catch {

    return fallback;

  }

}

function saveInstrumentState(
  instrumentId: string,
  state: PersistedInstrumentState,
): void {

  try {

    window.localStorage.setItem(
      `${INSTRUMENT_STORAGE_PREFIX}${instrumentId}`,
      JSON.stringify(state)
    );

  } catch {

    // Browser persistence is optional.
    // Instrument interaction remains functional if storage
    // is unavailable.

  }

}


// ============================================================
// COMPONENT
// ============================================================

export default function ManifoldInstrumentPalette({
  instrumentId,
  title,
  children,
  defaultPosition,
  width = 126,
}: ManifoldInstrumentPaletteProps) {

  const paletteRef =
    useRef<HTMLDivElement | null>(null);

  const dragOffsetRef =
    useRef<InstrumentPosition>({
      x: 0,
      y: 0,
    });

    // ==========================================================
  // INITIAL STATE
  // ==========================================================

  const initialStateRef =
    useRef<PersistedInstrumentState | null>(
      null
    );

  if (!initialStateRef.current) {

    initialStateRef.current =
      loadInstrumentState(
        instrumentId,
        defaultPosition
      );

  }

  const [
    position,
    setPosition,
  ] = useState<InstrumentPosition>(
    initialStateRef.current.position
  );

  const [
    dragging,
    setDragging,
  ] = useState(false);

  const [
    dockState,
    setDockState,
  ] = useState<InstrumentDockState>(
    initialStateRef.current.dockState
  );

  // ==========================================================
  // DOCK PROXIMITY
  // ==========================================================

  const distanceFromDock =
    Math.hypot(
      position.x -
        defaultPosition.x,
      position.y -
        defaultPosition.y
    );

  const nearDock =
    dragging &&
    distanceFromDock <=
      DOCK_SNAP_TOLERANCE;

  // ==========================================================
  // DRAG START
  // ==========================================================

  function handlePointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
  ): void {

    event.preventDefault();
    event.stopPropagation();

    const palette =
      paletteRef.current;

    if (!palette) {
      return;
    }

    dragOffsetRef.current = {
      x:
        event.clientX -
        palette.offsetLeft,
      y:
        event.clientY -
        palette.offsetTop,
    };

    event.currentTarget.setPointerCapture(
      event.pointerId
    );

    setDragging(true);

  }

  // ==========================================================
  // DRAG MOVE
  // ==========================================================

  function handlePointerMove(
    event: ReactPointerEvent<HTMLDivElement>,
  ): void {

    if (!dragging) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const palette =
      paletteRef.current;

    const viewport =
      palette?.offsetParent as
        HTMLElement | null;

    if (!palette || !viewport) {
      return;
    }

    const requestedX =
      event.clientX -
      dragOffsetRef.current.x;

    const requestedY =
      event.clientY -
      dragOffsetRef.current.y;

    const maxX =
      Math.max(
        0,
        viewport.clientWidth -
        palette.offsetWidth
      );

    const maxY =
      Math.max(
        0,
        viewport.clientHeight -
        palette.offsetHeight
      );

    const nextX =
      Math.min(
        Math.max(0, requestedX),
        maxX
      );

    const nextY =
      Math.min(
        Math.max(0, requestedY),
        maxY
      );

    setPosition({
      x: nextX,
      y: nextY,
    });

    if (
      nextX !== defaultPosition.x ||
      nextY !== defaultPosition.y
    ) {
      setDockState("FLOATING");
    }

  }

  // ==========================================================
  // DRAG END
  // ==========================================================

  function handlePointerUp(
    event: ReactPointerEvent<HTMLDivElement>,
  ): void {

    if (!dragging) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      );
    }

    const shouldDock =
      Math.hypot(
        position.x -
          defaultPosition.x,
        position.y -
          defaultPosition.y
      ) <= DOCK_SNAP_TOLERANCE;

       if (shouldDock) {

      const nextState: PersistedInstrumentState = {
        position: defaultPosition,
        dockState: "DOCKED",
      };

      setPosition(
        nextState.position
      );

      setDockState(
        nextState.dockState
      );

      saveInstrumentState(
        instrumentId,
        nextState
      );

    } else {

      const nextState: PersistedInstrumentState = {
        position,
        dockState: "FLOATING",
      };

      setDockState(
        nextState.dockState
      );

      saveInstrumentState(
        instrumentId,
        nextState
      );

    }

    setDragging(false);

  }
  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <>
      {/* ===================================================== */}
      {/* DOCK TARGET                                           */}
      {/* ===================================================== */}

      {nearDock && (

        <div
          aria-hidden="true"
          style={{
            position: "absolute",

            left: defaultPosition.x,
            top: defaultPosition.y,

            width: width + 16,
            height:
              paletteRef.current
                ?.offsetHeight ?? 80,

            border:
              "1px dashed rgba(96,165,250,0.65)",

            borderRadius: 8,

            background:
              "rgba(59,130,246,0.06)",

            boxSizing: "border-box",

            pointerEvents: "none",
          }}
        />

      )}

      {/* ===================================================== */}
      {/* INSTRUMENT                                            */}
      {/* ===================================================== */}

      <div
        ref={paletteRef}
        data-dock-state={dockState}
        style={{
          position: "absolute",

          left: position.x,
          top: position.y,

          width,

          padding: 8,

          border:
            nearDock
              ? "1px solid rgba(96,165,250,0.65)"
              : "1px solid rgba(148,163,184,0.22)",

          borderRadius: 8,

          background:
            "rgba(2,6,23,0.90)",

          boxShadow:
            dragging
              ? "0 12px 32px rgba(0,0,0,0.42)"
              : "0 8px 24px rgba(0,0,0,0.28)",

          backdropFilter: "blur(8px)",

          pointerEvents: "auto",

          zIndex:
            dragging
              ? 3
              : 2,
        }}
      >

        {/* =================================================== */}
        {/* DRAG HANDLE                                         */}
        {/* =================================================== */}

        <div
          onPointerDown={
            handlePointerDown
          }
          onPointerMove={
            handlePointerMove
          }
          onPointerUp={
            handlePointerUp
          }
          onPointerCancel={
            handlePointerUp
          }
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",

            marginBottom: 7,

            color:
              nearDock
                ? "#93c5fd"
                : "#64748b",

            fontSize: 9,
            fontWeight: 700,

            letterSpacing: 1.2,
            textTransform: "uppercase",

            cursor:
              dragging
                ? "grabbing"
                : "grab",

            userSelect: "none",
            touchAction: "none",
          }}
        >

          <span>
            {title}
          </span>

          <span
            aria-hidden="true"
            style={{
              color:
                nearDock
                  ? "#93c5fd"
                  : "#475569",

              fontSize: 12,
              lineHeight: 1,
            }}
          >
            ⠿
          </span>

        </div>

        {/* =================================================== */}
        {/* INSTRUMENT CONTENT                                  */}
        {/* =================================================== */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {children}
        </div>

      </div>

    </>

  );

}