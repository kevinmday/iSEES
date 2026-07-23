// ============================================================
// src/manifold/components/ManifoldInstrumentPalette.tsx
// P45A-B1
// MANIFOLD INSTRUMENT PALETTE
//
// Generic draggable analytical instrument projected over the
// Investigation Manifold topology viewport.
//
// SC-009:
// MANIFOLD INSTRUMENT ARCHITECTURE
//
// This component owns instrument presentation and local
// floating position.
//
// It does NOT own:
// • Computational semantics
// • Manifold runtime
// • Graph computation
// • Graph projection
// • Docking persistence
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

interface ManifoldInstrumentPaletteProps {
  title: string;
  children: ReactNode;
  defaultPosition: InstrumentPosition;
}

// ============================================================
// COMPONENT
// ============================================================

export default function ManifoldInstrumentPalette({
  title,
  children,
  defaultPosition,
}: ManifoldInstrumentPaletteProps) {

  const paletteRef =
    useRef<HTMLDivElement | null>(null);

  const dragOffsetRef =
    useRef<InstrumentPosition>({
      x: 0,
      y: 0,
    });

  const [
    position,
    setPosition,
  ] = useState<InstrumentPosition>(
    defaultPosition
  );

  const [
    dragging,
    setDragging,
  ] = useState(false);

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

    setDragging(false);

  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      ref={paletteRef}
      style={{
        position: "absolute",

        left: position.x,
        top: position.y,

        width: 126,

        padding: 8,

        border:
          "1px solid rgba(148,163,184,0.22)",

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
            ? 2
            : 1,
      }}
    >

      {/* ===================================================== */}
      {/* DRAG HANDLE                                           */}
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",

          marginBottom: 7,

          color: "#64748b",

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
            color: "#475569",
            fontSize: 12,
            lineHeight: 1,
          }}
        >
          ⠿
        </span>

      </div>

      {/* ===================================================== */}
      {/* INSTRUMENT CONTENT                                    */}
      {/* ===================================================== */}

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

  );

}