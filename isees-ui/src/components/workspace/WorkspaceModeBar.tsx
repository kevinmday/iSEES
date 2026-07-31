// ============================================================
// src/components/workspace/WorkspaceModeBar.tsx
// Canon v1
// OPERATOR WORKSPACE MODE BAR
//
// Persistent operator workspace selector.
//
// Presentation governed by Canon v1.
//
// Runtime ownership remains external.
//
// Full drop-in.
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

    borderRadius: "var(--surface-radius)",

    border: active
      ? "1px solid var(--color-information)"
      : "var(--surface-border)",

    background: active
      ? "var(--surface-2)"
      : "var(--surface-1)",

    color: active
      ? "var(--text-primary)"
      : "var(--text-caption)",

    fontFamily: "var(--font-family-sans)",

    fontSize: "var(--font-micro)",

    fontWeight: "var(--weight-semibold)",

    letterSpacing: "var(--tracking-system)",

    textAlign: "center",

    textTransform: "uppercase",

    cursor: "pointer",

    userSelect: "none",

    transition: "var(--transition-fast)",

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

const MODE_LABELS: Record<WorkspaceMode, string> = {

  [WorkspaceMode.OVERVIEW]: "OVERVIEW",

  [WorkspaceMode.MANIFOLD]: "MANIFOLD",

  [WorkspaceMode.COMPARE]: "COMPARE",

  [WorkspaceMode.NARRATIVE]: "NARRATIVE",

  [WorkspaceMode.EVIDENCE]: "EVIDENCE",

  [WorkspaceMode.TIMELINE]: "TIMELINE",

  [WorkspaceMode.LAYERS]: "LAYERS",

  [WorkspaceMode.INTENTION]: "INTENTION",

  [WorkspaceMode.RESEARCH]: "STUDIO",

};

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

        height: "var(--modebar-height)",

        minHeight: "var(--modebar-height)",

        borderTop: "var(--surface-border)",

        background: "var(--surface-1)",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        gap: "var(--space-sm)",

        padding: "0 var(--space-lg)",

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
          {MODE_LABELS[mode]}
        </div>

      ))}

    </div>

  );

}