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

import Tooltip from "../../components/Tooltip";

import ManifoldInstrumentPalette
from "./ManifoldInstrumentPalette";

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
}

function InstrumentButton({
  label,
  tooltip,
  action,
  onAction,
}: InstrumentButtonProps) {

  return (

    <Tooltip text={tooltip}>

      <button
        onClick={() =>
          onAction(action)
        }
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

          cursor: "pointer",

          textAlign: "left",
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
          label="Resolve"
          action="RESOLVE"
          onAction={onAction}
          tooltip="Execute Resolve-Dissolve Computation (RDC) using the current computational universe. The Investigation Manifold is rebuilt deterministically."
        />

        <InstrumentButton
          label="Dissolve"
          action="DISSOLVE"
          onAction={onAction}
          tooltip="Remove the current manifold solution and return the Investigation to an unresolved computational state."
        />

        <InstrumentButton
          label="Collapse"
          action="COLLAPSE"
          onAction={onAction}
          tooltip="Collapse the current Investigation Manifold according to the selected deterministic collapse strategy while preserving reproducibility."
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

      </ManifoldInstrumentPalette>

    </>

  );

}