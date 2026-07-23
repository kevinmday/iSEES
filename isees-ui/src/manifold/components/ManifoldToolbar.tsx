// ============================================================
// src/manifold/components/ManifoldToolbar.tsx
// P45A
// MANIFOLD OPERATOR CONTROL RAIL
//
// Compact operational control surface for the Investigation
// Manifold.
//
// Actions express operator intent only. Computational execution
// remains delegated to the owning Investigation and its
// deterministic Resolve–Dissolve Computation (RDC) runtime.
//
// Ownership:
//
// Operator
//      ↓
// Manifold Operator Control Rail
//      ↓
// Primary Investigation Manifold
//      ↓
// Resolve–Dissolve Computation (RDC)
//      ↓
// Deterministic Investigation Manifold
//
// ============================================================

import Tooltip from "../../components/Tooltip";

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
// BUTTON
// ============================================================

interface ToolbarButtonProps {
  label: string;
  tooltip: string;
  action: ManifoldToolbarAction;
  onAction: (action: ManifoldToolbarAction) => void;
}

function ToolbarButton({
  label,
  tooltip,
  action,
  onAction,
}: ToolbarButtonProps) {

  return (

    <Tooltip text={tooltip}>

      <button
        onClick={() =>
          onAction(action)
        }
        style={{
          background: "#111827",

          border:
            "1px solid rgba(148,163,184,0.24)",

          color: "#e5e7eb",

          padding: "6px 11px",

          borderRadius: 6,

          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.8,

          cursor: "pointer",

          textTransform: "uppercase",

          whiteSpace: "nowrap",
        }}
      >
        {label}
      </button>

    </Tooltip>

  );

}

// ============================================================
// GROUP LABEL
// ============================================================

interface ControlGroupLabelProps {
  children: string;
}

function ControlGroupLabel({
  children,
}: ControlGroupLabelProps) {

  return (

    <div
      style={{
        color: "#64748b",

        fontSize: 9,
        fontWeight: 700,

        letterSpacing: 1.2,
        textTransform: "uppercase",

        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>

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

  return (

    <div
      style={{
        width: "100%",

        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",

        gap: 18,

        padding: "6px 2px",
      }}
    >

      {/* ===================================================== */}
      {/* COMPUTATION                                           */}
      {/* ===================================================== */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >

        <ControlGroupLabel>
          Computation
        </ControlGroupLabel>

        <ToolbarButton
          label="Resolve"
          action="RESOLVE"
          onAction={onAction}
          tooltip="Execute Resolve–Dissolve Computation (RDC) using the current computational universe. The Investigation Manifold is rebuilt deterministically."
        />

        <ToolbarButton
          label="Dissolve"
          action="DISSOLVE"
          onAction={onAction}
          tooltip="Remove the current manifold solution and return the Investigation to an unresolved computational state."
        />

        <ToolbarButton
          label="Collapse"
          action="COLLAPSE"
          onAction={onAction}
          tooltip="Collapse the current Investigation Manifold according to the selected deterministic collapse strategy while preserving reproducibility."
        />

      </div>

      {/* ===================================================== */}
      {/* DIVIDER                                               */}
      {/* ===================================================== */}

      <div
        style={{
          width: 1,
          height: 22,

          background:
            "rgba(148,163,184,0.18)",

          flexShrink: 0,
        }}
      />

      {/* ===================================================== */}
      {/* PROJECTION                                            */}
      {/* ===================================================== */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >

        <ControlGroupLabel>
          Projection
        </ControlGroupLabel>

        <ToolbarButton
          label="2D"
          action="VIEW_2D"
          onAction={onAction}
          tooltip="Display the current Investigation Manifold using a two-dimensional projection. No recomputation occurs."
        />

        <ToolbarButton
          label="3D"
          action="VIEW_3D"
          onAction={onAction}
          tooltip="Display the current Investigation Manifold using a three-dimensional projection. No recomputation occurs."
        />

      </div>

    </div>

  );

}