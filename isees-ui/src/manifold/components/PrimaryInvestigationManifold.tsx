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

import ManifoldToolbar, {
  type ManifoldToolbarAction,
} from "./ManifoldToolbar";


import {
  manifoldRuntime,
} from "../engine/manifoldRuntime";


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
      }}
    >

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

        <InvestigationGraph />

      </div>

      {/* ===================================================== */}
      {/* MANIFOLD OPERATOR CONTROLS                            */}
      {/* ===================================================== */}
      {/*
        Operator controls are intentionally projected beneath
        the primary Investigation Manifold.

        The topology remains the dominant analytical surface.
        Controls influence computation and projection without
        visually competing with the manifold itself.
      */}

      <div
        style={{
          flexShrink: 0,

          width: "100%",

          display: "flex",
          alignItems: "center",

          paddingTop: 8,

          borderTop:
            "1px solid rgba(148,163,184,0.12)",
        }}
      >

        <ManifoldToolbar
          onAction={handleToolbarAction}
        />

      </div>

    </section>

  );

}