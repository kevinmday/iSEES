// ============================================================
// src/manifold/components/ManifoldToolbar.tsx
// P30C
// MANIFOLD OPERATOR TOOLBAR
//
// The Manifold Toolbar is the operator's primary interface for
// interacting with the Investigation Manifold.
//
// The toolbar exposes investigation operations rather than
// implementation details. The deterministic manifold engine
// automatically recomputes the topology whenever an operation
// changes investigation state.
//
// Current Operations:
//
// • Resolve
// • Dissolve
// • Collapse
// • 2D View
// • 3D View
//
// Future:
//
// • Temporal Playback
// • Layout Modes
// • History Navigation
// • Export
// • Collaboration
//
// ============================================================

function ToolbarButton({
  label,
  tooltip,
}: {
  label: string;
  tooltip: string;
}) {
  return (
    <button
      title={tooltip}
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

export default function ManifoldToolbar() {
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
          tooltip="Expand the investigation by discovering additional evidence-supported relationships."
        />

        <ToolbarButton
          label="Dissolve"
          tooltip="Remove inferred or weak relationships to expose alternative manifold structures."
        />

        <ToolbarButton
          label="Collapse"
          tooltip="Commit the investigation to the current interpretation while preserving alternate possibilities in investigation history."
        />

        <ToolbarButton
          label="2D"
          tooltip="Display the investigation manifold using the deterministic two-dimensional layout."
        />

        <ToolbarButton
          label="3D"
          tooltip="Display the investigation manifold using the three-dimensional topology view."
        />
      </div>
    </section>
  );
}