// ============================================================
// src/manifold/components/ResearchInboxInstrument.tsx
// P45A
// RESEARCH INBOX INSTRUMENT
//
// Floating Manifold instrument for collecting investigation
// artifacts for later research and authoring.
//
// Instrument behavior:
//
// • Floats above the Investigation Manifold
// • Defaults to the upper-left instrument position
// • Moves through header-based dragging
// • Owns presentation and local instrument position
// • Preserves body interaction for future artifact collection
//
// Future responsibility:
//
// • Viewport boundary constraints
// • Session position persistence
// • Docking / collapse behavior
//
// ============================================================

import {
  useRef,
  useState,
} from "react";

import type {
  PointerEvent as ReactPointerEvent,
} from "react";

import {
  useResearchDesk,
} from "../../research/ResearchBridgeContext";

// ============================================================
// TYPES
// ============================================================

interface InstrumentPosition {
  x: number;
  y: number;
}

interface DragState {
  pointerId: number;
  offsetX: number;
  offsetY: number;
}

// ============================================================
// DEFAULT POSITION
// ============================================================

const DEFAULT_POSITION: InstrumentPosition = {
  x: 24,
  y: 44,
};

// ============================================================
// COMPONENT
// ============================================================

export default function ResearchInboxInstrument() {

  // ==========================================================
  // CONTEXT
  // ==========================================================

  const researchDesk =
    useResearchDesk();

  // ==========================================================
  // INSTRUMENT STATE
  // ==========================================================

  const [
    position,
    setPosition,
  ] = useState<InstrumentPosition>(
    DEFAULT_POSITION
  );

  const [
    dragging,
    setDragging,
  ] = useState(false);

  const dragState =
    useRef<DragState | null>(
      null
    );

  const instrumentRef =
    useRef<HTMLDivElement | null>(
      null
    );

  // ==========================================================
  // DRAG START
  // ==========================================================

  function handlePointerDown(
    event:
      ReactPointerEvent<HTMLDivElement>,
  ): void {

    if (event.button !== 0) {
      return;
    }

    const instrument =
      instrumentRef.current;

    const parent =
      instrument?.offsetParent;

    if (
      !instrument ||
      !(parent instanceof HTMLElement)
    ) {
      return;
    }

    const parentRect =
      parent.getBoundingClientRect();

    dragState.current = {
      pointerId:
        event.pointerId,

      offsetX:
        event.clientX -
        parentRect.left -
        position.x,

      offsetY:
        event.clientY -
        parentRect.top -
        position.y,
    };

    event.currentTarget.setPointerCapture(
      event.pointerId
    );

    setDragging(true);

    event.preventDefault();
  }
  // ==========================================================
  // DRAG MOVE
  // ==========================================================

  function handlePointerMove(
    event:
      ReactPointerEvent<HTMLDivElement>,
  ): void {

    const activeDrag =
      dragState.current;

    if (
      !activeDrag ||
      activeDrag.pointerId !==
        event.pointerId
    ) {
      return;
    }

    const instrument =
      instrumentRef.current;

    const parent =
      instrument?.offsetParent;

    if (
      !instrument ||
      !(parent instanceof HTMLElement)
    ) {
      return;
    }

    const parentRect =
      parent.getBoundingClientRect();

    const instrumentWidth =
      instrument.offsetWidth;

    const instrumentHeight =
      instrument.offsetHeight;

    const proposedX =
      event.clientX -
      parentRect.left -
      activeDrag.offsetX;

    const proposedY =
      event.clientY -
      parentRect.top -
      activeDrag.offsetY;

    const maxX =
      Math.max(
        0,
        parent.clientWidth -
          instrumentWidth
      );

    const maxY =
      Math.max(
        0,
        parent.clientHeight -
          instrumentHeight
      );

    setPosition({
      x: Math.min(
        Math.max(
          0,
          proposedX
        ),
        maxX
      ),

      y: Math.min(
        Math.max(
          0,
          proposedY
        ),
        maxY
      ),
    });
  }

  // ==========================================================
  // DRAG END
  // ==========================================================

  function handlePointerUp(
    event:
      ReactPointerEvent<HTMLDivElement>,
  ): void {

    const activeDrag =
      dragState.current;

    if (
      !activeDrag ||
      activeDrag.pointerId !==
        event.pointerId
    ) {
      return;
    }

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId
      )
    ) {

      event.currentTarget.releasePointerCapture(
        event.pointerId
      );
    }

    dragState.current =
      null;

    setDragging(false);
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

        <div
      ref={instrumentRef}
      title={
        "Drag investigation artifacts here to collect them for later research and authoring."
      }
      style={{
        position: "absolute",

        top: position.y,
        left: position.x,

        width: 248,

        zIndex: 1000,

        display: "flex",
        flexDirection: "column",

        border:
          "1px solid rgba(148,163,184,0.18)",

        borderRadius: 10,

        background:
          "rgba(2,6,23,0.88)",

        overflow: "hidden",

        boxShadow:
          dragging
            ? "0 22px 52px rgba(0,0,0,0.58)"
            : "0 18px 42px rgba(0,0,0,0.45)",
      }}
    >

      {/* ===================================================== */}
      {/* DRAG HANDLE — HEADER                                  */}
      {/* ===================================================== */}

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
          padding: "12px 18px",

          borderBottom:
            "1px solid rgba(148,163,184,0.14)",

          background:
            "rgba(15,23,42,0.92)",

          color: "#f8fafc",

          fontSize: 13,
          fontWeight: 700,

          cursor:
            dragging
              ? "grabbing"
              : "grab",

          userSelect: "none",

          touchAction: "none",
        }}
      >
        Research Inbox
      </div>

            {/* ===================================================== */}
      {/* RESEARCH CONTENT                                      */}
      {/* ===================================================== */}

      <div
        style={{
          padding: 18,

          background:
            "rgba(2,6,23,0.72)",

          color: "#cbd5e1",

          fontSize: 12,
          lineHeight: 1.6,
        }}
      >

        {researchDesk.entries.length === 0 ? (

          <>

            <div
              style={{
                marginBottom: 16,
                color: "#e2e8f0",
                fontWeight: 600,
              }}
            >
              Nothing collected yet.
            </div>

            <div
              style={{
                color: "#94a3b8",
              }}
            >
              Click interesting investigation
              artifacts to collect them.
            </div>

          </>

        ) : (

          researchDesk.entries.map(
            (entry) => (

              <div
                key={entry.anchor.anchorId}
                style={{
                  padding: "8px 0",
                  borderBottom:
                    "1px solid rgba(148,163,184,0.08)",
                }}
              >

                <div
                  style={{
                    color: "#f8fafc",
                    fontWeight: 600,
                  }}
                >
                  {entry.anchor.graph.type}
                </div>

                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: 11,
                  }}
                >
                  {entry.anchor.graph.id}
                </div>

              </div>

            )

          )

        )}

      </div>

      {/* ===================================================== */}
      {/* FOOTER                                                */}
      {/* ===================================================== */}

      <div
        style={{
          padding: "8px 18px",

          borderTop:
            "1px solid rgba(148,163,184,0.14)",

          background:
            "rgba(15,23,42,0.92)",

          display: "flex",
          justifyContent: "flex-end",

          color: "#94a3b8",

          fontSize: 11,
        }}
      >
        {researchDesk.entries.length} Items
      </div>

    </div>

  );
}