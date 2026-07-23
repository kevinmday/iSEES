// ============================================================
// src/manifold/components/InvestigationViewport.tsx
// P45A
// INVESTIGATION VIEWPORT
//
// Owns
// • Viewport presentation
// • Responsive viewport host
// • SVG host
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
// The viewport expands to consume the space provided by the
// Manifold workspace. Topology scale remains independently
// controlled by the projection / SVG coordinate system.
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

      {children}

    </div>

  );

}