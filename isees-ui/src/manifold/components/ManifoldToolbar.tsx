// ============================================================
// src/manifold/components/ManifoldToolbar.tsx
// P31A
// MANIFOLD OPERATOR TOOLBAR
//
// The Manifold Toolbar is the operator's primary operational
// interface for interacting with the Investigation Manifold.
//
// The toolbar intentionally exposes investigation operations
// rather than implementation details.
//
// The toolbar never performs computation directly.
// Instead, it emits operator intent back to the owning
// Primary Investigation Manifold, which delegates execution to
// the deterministic Manifold Runtime.
//
// Ownership:
//
// Toolbar
//     ↓
// Primary Investigation Manifold
//     ↓
// Manifold Runtime
//     ↓
// Manifold Engine
//     ↓
// Deterministic Projection
//
// Future:
//
// • Resolve
// • Dissolve
// • Collapse
// • Temporal Playback
// • History Navigation
// • Snapshot Management
// • Layout Modes
// • Collaboration
//
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
    <button
      title={tooltip}
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
        Manifold Operations
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
          tooltip="Expand the investigation by deterministically recomputing evidence-supported relationships."
        />

        <ToolbarButton
          label="Dissolve"
          action="DISSOLVE"
          onAction={onAction}
          tooltip="Remove inferred or weak relationships and recompute the investigation manifold."
        />

        <ToolbarButton
          label="Collapse"
          action="COLLAPSE"
          onAction={onAction}
          tooltip="Commit the current investigation interpretation while preserving deterministic history."
        />

        <ToolbarButton
          label="2D"
          action="VIEW_2D"
          onAction={onAction}
          tooltip="Display the deterministic two-dimensional investigation manifold."
        />

        <ToolbarButton
          label="3D"
          action="VIEW_3D"
          onAction={onAction}
          tooltip="Display the deterministic three-dimensional investigation manifold."
        />
      </div>
    </section>
  );
}