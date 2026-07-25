// ============================================================
// src/manifold/components/PrimaryInvestigationManifold.tsx
// P34C
// PRIMARY INVESTIGATION WORKSPACE
//
// The Primary Investigation Workspace is the central projection
// host for an Investigation Session.
//
// The Workspace Runtime owns the active Workspace Mode.
// This component renders the deterministic projection
// associated with that mode.
//
// Every workspace mode is a projection of the same underlying
// Investigation Session.
//
// Ownership:
//
// Operator
//      ↓
// Workspace Runtime
//      ↓
// Active Workspace Mode
//      ↓
// Primary Investigation Workspace
//      ↓
// Projection Surface
//      ↓
// Manifold Runtime
//      ↓
// Resolve–Dissolve Computation (RDC)
//
// ============================================================
import InvestigationGraph from "./InvestigationGraph";

import type {
  ManifoldToolbarAction,
} from "./ManifoldToolbar";

import {
  manifoldRuntime,
} from "../engine/manifoldRuntime";

import {
  useResearchDesk,
} from "../../research/ResearchBridgeContext";
// ============================================================
// TYPES
// ============================================================

interface PrimaryInvestigationManifoldProps {
  focusedEventId: string;
}

// ============================================================
// COMPONENT
// ============================================================

export default function PrimaryInvestigationManifold({
  focusedEventId: _focusedEventId,
}: PrimaryInvestigationManifoldProps) {

  // ==========================================================
  // CONTEXT
  // ==========================================================

  const researchDesk =
    useResearchDesk();

  // ==========================================================
  // OPERATOR ACTIONS
  // ==========================================================

  function handleToolbarAction(
    action: ManifoldToolbarAction,
  ): void {

    // --------------------------------------------------------
    // The Primary Investigation Manifold owns operator intent.
    //
    // The Manifold Runtime performs the deterministic
    // orchestration of the requested operation.
    // --------------------------------------------------------

    manifoldRuntime.dispatch(action);

  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <section
      style={{
        width: "100%",
        height: "100%",

        flex: 1,
        minWidth: 0,
        minHeight: 0,

        display: "flex",
        flexDirection: "column",
        gap: 16,

        overflow: "hidden",

        position: "relative",
      }}
    >

      {/* ===================================================== */}
      {/* RESEARCH DESK                                         */}
      {/* ===================================================== */}

      <div
        title={
          "Drag investigation artifacts here to collect them for later research and authoring."
        }
        style={{
          position: "absolute",

          top: 44,
          left: 24,

          width: 248,

          zIndex: 1000,

          display: "flex",
          flexDirection: "column",

          border: "1px solid rgba(148,163,184,0.18)",
          borderRadius: 10,

          background: "rgba(2,6,23,0.88)",

          overflow: "hidden",

          boxShadow:
            "0 18px 42px rgba(0,0,0,0.45)",
        }}
      >

        {/* ============================================== */}
        {/* HEADER                                         */}
        {/* ============================================== */}

        <div
          style={{
            padding: "12px 18px",

            borderBottom:
              "1px solid rgba(148,163,184,0.14)",

            background:
              "rgba(15,23,42,0.92)",

            color: "#f8fafc",

            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Research Inbox
        </div>

        {/* ============================================== */}
        {/* EMPTY STATE                                    */}
        {/* ============================================== */}

        <div
          style={{
            padding: 18,

            background:
              "rgba(2,6,23,0.72)",

            color: "#cbd5e1",

            fontSize: 12,
            lineHeight: 1.65,
          }}
        >

          <div
            style={{
              marginBottom: 16,

              color: "#e2e8f0",

              fontWeight: 600,
            }}
          >
            Nothing collected yet.
          </div>

          <div
            style={{
              color: "#94a3b8",
            }}
          >
            Drag interesting investigation
            artifacts here.
          </div>

          <div
            style={{
              marginTop: 10,

              color: "#64748b",

              fontSize: 11,
            }}
          >
            Hover for collection guidance.
          </div>

        </div>

        {/* ============================================== */}
        {/* FOOTER                                         */}
        {/* ============================================== */}

        <div
          style={{
            padding: "8px 18px",

            borderTop:
              "1px solid rgba(148,163,184,0.14)",

            background:
              "rgba(15,23,42,0.92)",

            display: "flex",
            justifyContent: "flex-end",

            color: "#94a3b8",

            fontSize: 11,
          }}
        >
          {researchDesk.entries.length} Items
        </div>

      </div>
      {/* ===================================================== */}
      {/* INVESTIGATION MANIFOLD                                */}
      {/* ===================================================== */}

      <div
        style={{
          flex: 1,
          width: "100%",

          minWidth: 0,
          minHeight: 0,

          display: "flex",
          flexDirection: "column",

          overflow: "hidden",

          border:
            "1px solid rgba(148,163,184,0.12)",

          borderRadius: 12,

          background: "#020617",
        }}
      >

        <InvestigationGraph
          onAction={handleToolbarAction}
        />

      </div>

    </section>

  );

}