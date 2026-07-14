// ============================================================
// src/investigationControl/InvestigationControl.tsx
// P30.2
// INVESTIGATION CONTROL
// PRIMARY OPERATOR CONTROL SURFACE
//
// Investigation Control is the operator's primary interface
// for constructing and computing investigations.
//
// Responsibilities:
//
//   • Own operator mode (Explore / Compute)
//   • Display Investigation header
//   • Route to the active operator panel
//
// It intentionally performs NO computation.
//
// Resolve–Dissolve Computation (RDC) is introduced through
// ComputePanel.
//
// Full drop-in replacement.
// ============================================================

import { useState } from "react";

import {
  InvestigationMode,
} from "./InvestigationMode";

import ExplorePanel from "./ExplorePanel";
import ComputePanel from "./ComputePanel";

// ============================================================
// COMPONENT
// ============================================================

export default function InvestigationControl() {

  const [

    mode,

    setMode,

  ] = useState<InvestigationMode>(

    InvestigationMode.EXPLORE

  );

  return (

    <div
      style={{

        display: "flex",

        flexDirection: "column",

        height: "100%",

      }}
    >

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <div
        style={{

          paddingBottom: "var(--space-sm)",

          marginBottom: "var(--space-md)",

          borderBottom: "var(--surface-border)",

        }}
      >

        <div
          style={{

            fontFamily: "var(--font-family-sans)",

            fontSize: "var(--font-panel)",

            fontWeight: "var(--weight-bold)",

            letterSpacing: "var(--tracking-system)",

            textTransform: "uppercase",

            lineHeight: "var(--line-tight)",

            color: "var(--text-primary)",

          }}
        >
          Investigation Control
        </div>

      </div>

      {/* ===================================================== */}
      {/* MODE TABS */}
      {/* ===================================================== */}

      <div
        style={{

          display: "flex",

          alignItems: "stretch",

          marginBottom: "var(--space-md)",

          borderBottom: "var(--surface-border)",

          gap: 0,

        }}
      >

        <ModeTab

          label="Explore"

          active={
            mode === InvestigationMode.EXPLORE
          }

          onClick={() =>

            setMode(

              InvestigationMode.EXPLORE

            )

          }

        />

        <ModeTab

          label="Compute"

          active={
            mode === InvestigationMode.COMPUTE
          }

          onClick={() =>

            setMode(

              InvestigationMode.COMPUTE

            )

          }

        />

      </div>

      {/* ===================================================== */}
      {/* ACTIVE PANEL */}
      {/* ===================================================== */}

      <div
        style={{

          flex: 1,

          overflowY: "auto",

        }}
      >

        {

          mode === InvestigationMode.EXPLORE

            ? <ExplorePanel />

            : <ComputePanel />

        }

      </div>

    </div>

  );

}

// ============================================================
// MODE TAB
// ============================================================

function ModeTab({

  label,

  active,

  onClick,

}: {

  label: string;

  active: boolean;

  onClick: () => void;

}) {

  return (

    <button

      onClick={onClick}

      style={{

        flex: 1,

        padding: "10px 0",

        cursor: "pointer",

        border: "none",

        borderBottom:

          active

            ? "2px solid #3b82f6"

            : "2px solid transparent",

        background: "transparent",

        color:

          active

            ? "#dbeafe"

            : "#94a3b8",

        fontWeight: 700,

        textTransform: "uppercase",

        letterSpacing: 1,

        transition: "all 120ms ease",

      }}

    >

      {label}

    </button>

  );

}