// ============================================================
// src/manifold/components/ManifoldToolbar.tsx
// P45A-B1
// MANIFOLD INSTRUMENT COLLECTION
//
// Defines the analytical instruments currently available over
// the Investigation Manifold.
//
// Generic instrument presentation and drag behavior are owned
// by ManifoldInstrumentPalette.
//
// SC-009:
// MANIFOLD INSTRUMENT ARCHITECTURE
//
// Actions express operator intent only. Computational execution
// remains delegated to the owning Investigation and its
// deterministic Resolve-Dissolve Computation (RDC) runtime.
//
// ============================================================

import ManifoldInstrumentPalette
from "./ManifoldInstrumentPalette";

import { useState }
from "react";

import { useResolveExecutionCommand }
from "../../resolve/runtime/useResolveExecutionCommand";

import {
  ManifoldProjectionStatusValue,
  useManifoldProjectionStatus,
} from "../../components/workspace/ManifoldProjectionStatus";

// ============================================================
// ACTIONS
// ============================================================

export type ManifoldToolbarAction =
  | "RESOLVE"
  | "DISSOLVE"
  | "COLLAPSE"
  | "VIEW_2D"
  | "VIEW_3D";

// ============================================================
// INSTRUMENT BUTTON
// ============================================================

interface InstrumentButtonProps {
  label: string;
  tooltip: string;
  action: ManifoldToolbarAction;
  onAction: (
    action: ManifoldToolbarAction,
  ) => void;
  disabled?: boolean;
  beforeAction?: () => void;
}

function InstrumentButton({
  label,
  tooltip,
  action,
  onAction,
  disabled = false,
  beforeAction,
}: InstrumentButtonProps) {

  return (

    <button
        type="button"
        disabled={disabled}
        title={tooltip}
        onClick={() => {
          beforeAction?.();
          onAction(action);
        }}
        style={{
          width: "100%",

          background:
            "rgba(15,23,42,0.94)",

          border:
            "1px solid rgba(148,163,184,0.22)",

          color: "#e5e7eb",

          padding: "7px 10px",

          borderRadius: 6,

          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.8,

          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.62 : 1,

          textAlign: "left",
          textTransform: "uppercase",

          whiteSpace: "nowrap",
        }}
      >
        {label}
      </button>

  );

}

// ============================================================
// COMPONENT
// ============================================================

interface ManifoldToolbarProps {
  onAction: (
    action: ManifoldToolbarAction,
  ) => void;
}

export default function ManifoldToolbar({
  onAction,
}: ManifoldToolbarProps) {

  const resolveCommand =
    useResolveExecutionCommand();

  const projection =
    useManifoldProjectionStatus();

  const [feedbackCollapsed, setFeedbackCollapsed] =
    useState(false);

  return (

    <>
      {/* ===================================================== */}
      {/* COMPUTATION INSTRUMENT                                */}
      {/* ===================================================== */}

   <ManifoldInstrumentPalette
  instrumentId="computation"
  title="Computation"
  defaultPosition={{
    x: 12,
    y: 12,
  }}
>

        <InstrumentButton
          label={projection.status === ManifoldProjectionStatusValue.STALE
            ? "RECOMPUTE RELATIONSHIPS"
            : "COMPUTE RELATIONSHIPS"}
          action="RESOLVE"
          onAction={() => resolveCommand.execute()}
          beforeAction={() => setFeedbackCollapsed(false)}
          disabled={resolveCommand.disabled}
          tooltip={resolveCommand.disabled ? resolveCommand.statusText : "Compute deterministic candidate relationships for the current context."}
        />

        {!feedbackCollapsed && <div
          data-computation-feedback="true"
          role={resolveCommand.feedback.phase === "RESOLVE_FAILED" || resolveCommand.feedback.phase === "BLOCKED" ? "alert" : "status"}
          aria-live={resolveCommand.feedback.phase === "RESOLVE_FAILED" || resolveCommand.feedback.phase === "BLOCKED" ? "assertive" : "polite"}
          style={{ marginTop: 8, padding: 8, border: "1px solid rgba(125,211,252,.3)", borderRadius: 6, background: "rgba(2,6,23,.92)", color: resolveCommand.feedback.phase === "RESOLVE_FAILED" || resolveCommand.feedback.phase === "BLOCKED" ? "#fca5a5" : "#bae6fd", fontSize: 10, lineHeight: 1.5, pointerEvents: "auto" }}
        >
          <strong>{resolveFeedbackLabel(resolveCommand.feedback.phase)}</strong>
          <div>{resolveCommand.feedback.message}</div>
          {resolveCommand.feedback.phase === "RESOLVE_COMPLETED" && <>
            <div>Focused case: {resolveCommand.feedback.focusedLabel}</div>
            <div>Comparison case: {resolveCommand.feedback.comparisonLabel}</div>
            <div>Candidates produced: {resolveCommand.feedback.candidateCount}</div>
          </>}
        </div>}

        <InstrumentButton
          label="CLEAR MANIFOLD RESULT"
          action="DISSOLVE"
          onAction={onAction}
          tooltip="Removes only the legacy manifold runtime result. Computed relationship candidates and accepted relationships remain unchanged."
        />

      </ManifoldInstrumentPalette>

      {/* ===================================================== */}
      {/* PROJECTION INSTRUMENT                                 */}
      {/* ===================================================== */}

  <ManifoldInstrumentPalette
  instrumentId="projection"
  title="Projection"
  defaultPosition={{
    x: 12,
    y: 154,
  }}
>
        <div style={{ marginBottom: 6, color: "#94a3b8", fontSize: 9, fontWeight: 700, letterSpacing: 1.1 }}>
          VIEW
        </div>
        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "1fr 1fr",

            gap: 6,
          }}
        >

          <InstrumentButton
            label="2D"
            action="VIEW_2D"
            onAction={onAction}
            tooltip="Display the current Investigation Manifold using a two-dimensional projection. No recomputation occurs."
          />

          <InstrumentButton
            label="3D"
            action="VIEW_3D"
            onAction={onAction}
            tooltip="Display the current Investigation Manifold using a three-dimensional projection. No recomputation occurs."
          />

        </div>

        <div style={{ marginTop: 6 }}>
          <InstrumentButton
            label="COLLAPSE"
            action="COLLAPSE"
            onAction={() => setFeedbackCollapsed(true)}
            tooltip="Collapse only the relationship-analysis feedback. The Investigation Manifold, computed candidates, and accepted relationships remain unchanged."
          />
        </div>

      </ManifoldInstrumentPalette>

    </>

  );

}

function resolveFeedbackLabel(
  phase: ReturnType<typeof useResolveExecutionCommand>["feedback"]["phase"],
): string {
  switch (phase) {
    case "READY_TO_RESOLVE":
      return "ANALYSIS READY";
    case "RESOLVING":
      return "COMPUTING";
    case "RESOLVE_COMPLETED":
      return "RESULT CURRENT";
    case "RESOLVE_FAILED":
      return "RESOLVE FAILED";
    case "BLOCKED":
      return "BLOCKED";
  }
}
