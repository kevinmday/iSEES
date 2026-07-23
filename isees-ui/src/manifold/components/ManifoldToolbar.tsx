// ============================================================
// src/manifold/components/ManifoldToolbar.tsx
// P45A
// MANIFOLD INSTRUMENT SYSTEM
//
// Static P45A instrument presentation.
//
// Manifold controls are analytical instruments layered over
// the investigation surface rather than permanent layout
// regions surrounding the surface.
//
// SC-009:
// MANIFOLD INSTRUMENT ARCHITECTURE
//
// Actions express operator intent only. Computational execution
// remains delegated to the owning Investigation and its
// deterministic Resolve-Dissolve Computation (RDC) runtime.
//
// Ownership:
//
// Operator
//      ↓
// Manifold Instrument
//      ↓
// Primary Investigation Manifold
//      ↓
// Resolve-Dissolve Computation (RDC)
//      ↓
// Deterministic Investigation Manifold
//
// ============================================================

import type {
  ReactNode,
} from "react";

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
// GENERIC INSTRUMENT PALETTE
// ============================================================

interface ManifoldInstrumentPaletteProps {
  title: string;
  children: ReactNode;
}

function ManifoldInstrumentPalette({
  title,
  children,
}: ManifoldInstrumentPaletteProps) {

  return (

    <div
      style={{
        width: 126,

        padding: 8,

        border:
          "1px solid rgba(148,163,184,0.22)",

        borderRadius: 8,

        background:
          "rgba(2,6,23,0.90)",

        boxShadow:
          "0 8px 24px rgba(0,0,0,0.28)",

        backdropFilter: "blur(8px)",

        pointerEvents: "auto",
      }}
    >

      {/* ===================================================== */}
      {/* INSTRUMENT HEADER                                     */}
      {/* ===================================================== */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",

          marginBottom: 7,

          color: "#64748b",

          fontSize: 9,
          fontWeight: 700,

          letterSpacing: 1.2,
          textTransform: "uppercase",
        }}
      >

        <span>
          {title}
        </span>

        <span
          aria-hidden="true"
          style={{
            color: "#475569",
            fontSize: 12,
            lineHeight: 1,

            cursor: "grab",

            userSelect: "none",
          }}
        >
          ⠿
        </span>

      </div>

      {/* ===================================================== */}
      {/* INSTRUMENT CONTENT                                    */}
      {/* ===================================================== */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {children}
      </div>

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
        display: "flex",
        flexDirection: "column",

        gap: 8,

        pointerEvents: "none",
      }}
    >

      {/* ===================================================== */}
      {/* COMPUTATION INSTRUMENT                                */}
      {/* ===================================================== */}

      <ManifoldInstrumentPalette
        title="Computation"
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
        title="Projection"
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

    </div>

  );

}