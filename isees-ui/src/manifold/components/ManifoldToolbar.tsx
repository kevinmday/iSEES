// ============================================================
// src/manifold/components/ManifoldToolbar.tsx
// P32.1
// MANIFOLD OPERATOR TOOLBAR
//
// The Manifold Toolbar is the operator's primary operational
// interface for interacting with the Investigation Manifold.
//
// Toolbar actions express operator intent only. Computational
// execution is delegated to the owning Investigation and its
// deterministic Resolve–Dissolve Computation (RDC) runtime.
//
// Ownership:
//
// Operator
//      ↓
// Manifold Toolbar
//      ↓
// Primary Investigation Manifold
//      ↓
// Resolve–Dissolve Computation (RDC)
//      ↓
// Deterministic Investigation Manifold
//
// FULL DROP-IN REPLACEMENT
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
        onClick={() => onAction(action)}
        style={{
          background: "#111827",
          border: "1px solid #374151",
          color: "#f3f4f6",
          padding: "8px 14px",
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1,
          cursor: "pointer",
          textTransform: "uppercase",
        }}
      >
        {label}
      </button>
    </Tooltip>
  );
}

// ============================================================
// COMPONENT
// ============================================================

interface ManifoldToolbarProps {
  onAction: (action: ManifoldToolbarAction) => void;
}

export default function ManifoldToolbar({
  onAction,
}: ManifoldToolbarProps) {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: 12,
        border: "1px solid #334155",
        borderRadius: 8,
        background: "#0f172a",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: "#e5e7eb",
        }}
      >
        Investigation Operations
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
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
    </section>
  );
}