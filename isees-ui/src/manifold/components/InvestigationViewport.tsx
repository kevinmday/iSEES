// ============================================================
// src/manifold/components/InvestigationViewport.tsx
// P41B
// INVESTIGATION VIEWPORT
//
// Owns
// • Viewport presentation
// • Responsive viewport host
// • SVG host (future)
// • Camera (future)
// • Zoom (future)
// • Pan (future)
// • Projection (future)
//
// Does NOT own
// • Graph computation
// • Selection
// • Runtime
// • Intelligence
//
// NOTE
// This is the initial viewport shell. The SVG topology
// rendering will be migrated here incrementally during
// subsequent P41B checkpoints.
//
// ============================================================

import type {
  ReactNode,
} from "react";

// ============================================================
// TYPES
// ============================================================

interface InvestigationViewportProps {

  children: ReactNode;

}

// ============================================================
// COMPONENT
// ============================================================

export default function InvestigationViewport({
  children,
}: InvestigationViewportProps) {

  return (

    <div
      style={{
        flex: 1,
        minHeight: 560,

        display: "flex",
        justifyContent: "center",
        alignItems: "stretch",

        padding: 20,

        background: "#050b16",
        border: "1px solid rgba(148,163,184,0.12)",
        borderRadius: 12,

        overflow: "hidden",

        position: "relative",
      }}
    >

      {children}

    </div>

  );

}