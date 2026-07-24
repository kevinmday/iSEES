// ============================================================
// src/manifold/components/InvestigationViewport.tsx
// P45A-C
// RESPONSIVE INVESTIGATION VIEWPORT
//
// Owns:
// • Viewport presentation
// • Responsive viewport measurement
// • SVG host
// • Instrument coordinate host
// • Camera (future)
// • Zoom (future)
// • Pan (future)
// • Projection (future)
//
// Does NOT own:
// • Graph computation
// • Selection
// • Investigation runtime
// • Intelligence
//
// The viewport measures the physical investigation surface.
// Graph topology remains expressed independently in abstract
// deterministic coordinates.
//
// ============================================================

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

// ============================================================
// TYPES
// ============================================================

export interface InvestigationViewportSize {
  width: number;
  height: number;
}

interface InvestigationViewportProps {
  children:
    | ReactNode
    | ((
        size: InvestigationViewportSize
      ) => ReactNode);
}

// ============================================================
// COMPONENT
// ============================================================

export default function InvestigationViewport({
  children,
}: InvestigationViewportProps) {

  const viewportRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const [
    size,
    setSize,
  ] = useState<InvestigationViewportSize>({
    width: 0,
    height: 0,
  });

  // ==========================================================
  // VIEWPORT MEASUREMENT
  // ==========================================================

  useEffect(
    () => {

      const viewport =
        viewportRef.current;

      if (!viewport) {
        return;
      }

         function measure(): void {

        const currentViewport =
          viewportRef.current;

        if (!currentViewport) {
          return;
        }

        const rect =
          currentViewport.getBoundingClientRect();

        setSize({
          width: rect.width,
          height: rect.height,
        });

      }

      measure();

      const observer =
        new ResizeObserver(
          measure
        );

      observer.observe(
        viewport
      );

      return () => {
        observer.disconnect();
      };

    },
    []
  );

  // ==========================================================
  // CONTENT
  // ==========================================================

  const content =
    typeof children === "function"
      ? children(size)
      : children;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      ref={viewportRef}
      style={{
        flex: 1,

        minWidth: 0,
        minHeight: 0,

        display: "flex",
        justifyContent: "center",
        alignItems: "stretch",

        background: "#050b16",

        border:
          "1px solid rgba(148,163,184,0.12)",

        borderRadius: 12,

        overflow: "hidden",

        position: "relative",
      }}
    >

      {content}

    </div>

  );

}