// ============================================================
// src/components/workspace/WorkspaceModeBar.tsx
// P34B
// OPERATOR WORKSPACE MODE BAR
//
// Persistent operator workspace selector.
//
// The Workspace Mode Bar is the operator's primary mechanism
// for selecting the active Workspace Mode.
//
// The bar owns no state.
//
// All mode ownership resides within the deterministic
// Workspace Runtime.
//
// FULL DROP-IN FILE
// ============================================================

import type {
  CSSProperties,
} from "react";

import {
  useWorkspaceRuntime,
} from "../../workspace/runtime/WorkspaceRuntimeContext";

import {
  WorkspaceMode,
} from "../../workspace/runtime/WorkspaceRuntimeTypes";

// ============================================================
// MODE BUTTON STYLE
// ============================================================

function modeStyle(
  active = false,
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
// MODES
// ============================================================

const MODES = [

  WorkspaceMode.OVERVIEW,

  WorkspaceMode.MANIFOLD,

  WorkspaceMode.COMPARE,

  WorkspaceMode.NARRATIVE,

  WorkspaceMode.EVIDENCE,

  WorkspaceMode.TIMELINE,

  WorkspaceMode.LAYERS,

  WorkspaceMode.INTENTION,

  WorkspaceMode.RESEARCH,

] as const;

// ============================================================
// COMPONENT
// ============================================================

export default function WorkspaceModeBar() {

  const runtime =
    useWorkspaceRuntime();

  const activeMode =
  runtime.getActiveMode();


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
      {MODES.map((mode) => (
        <div
          key={mode}
          style={modeStyle(
            activeMode === mode,
          )}
          onClick={() => {

           
            runtime.setActiveMode(
              mode,
            );

           
          }}
        >
          {mode}
        </div>
      ))}
    </div>

  );

}