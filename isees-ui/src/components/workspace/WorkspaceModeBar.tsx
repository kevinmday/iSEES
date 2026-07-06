// ============================================================
// src/components/workspace/WorkspaceModeBar.tsx
// P33
// OPERATOR WORKSPACE MODE BAR
//
// Persistent operator workspace selector.
//
// FULL DROP-IN FILE
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// MODE BUTTON STYLE
// ============================================================

function modeStyle(
  active = false
): CSSProperties {

  return {

    minWidth: 118,

    padding: "12px 18px",

    borderRadius: 10,

    border: active
      ? "1px solid #3b82f6"
      : "1px solid #2b3444",

    background: active
      ? "#0b1730"
      : "#08101f",

    color: active
      ? "#f8fafc"
      : "#9ca3af",

    fontSize: 11,

    fontWeight: 700,

    letterSpacing: 1.1,

    textAlign: "center",

    textTransform: "uppercase",

    cursor: "pointer",

    userSelect: "none",

    transition: "all 0.15s ease",
  };

}

// ============================================================
// COMPONENT
// ============================================================

export default function WorkspaceModeBar() {

  return (

    <div
      style={{
        height: 74,
        minHeight: 74,

        borderTop: "1px solid #182235",

        background: "#08101f",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        gap: 14,

        padding: "0 18px",
      }}
    >

      <div style={modeStyle(true)}>
        OVERVIEW
      </div>

      <div style={modeStyle()}>
        MANIFOLD
      </div>

      <div style={modeStyle()}>
        COMPARE
      </div>

      <div style={modeStyle()}>
        NARRATIVE
      </div>

      <div style={modeStyle()}>
        EVIDENCE
      </div>

      <div style={modeStyle()}>
        TIMELINE
      </div>

      <div style={modeStyle()}>
        LAYERS
      </div>

      <div style={modeStyle()}>
        INTENTION
      </div>

      <div style={modeStyle()}>
        RESEARCH
      </div>

    </div>

  );

}