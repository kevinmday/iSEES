// ============================================================
// ManifoldWorkspace.tsx
// P45A
// CANON-DRIVEN WORKSPACE RECOVERY
// PRODUCTION MANIFOLD WORKSPACE
//
// Canonical interactive Investigation Manifold workspace.
//
// Presentation-only.
//
// The active investigation and focused event are owned by
// WorkspaceContext. This surface projects that state into the
// Primary Investigation Manifold.
//
// Owns:
// • Production workspace layout
// • Manifold presentation
//
// Does NOT own:
// • Investigation state
// • Runtime
// • Graph engine
// • Selection logic
// • Manifold computation
//
// Ownership:
//
// Workspace Runtime
//      ↓
// Manifold Workspace
//      ↓
// Workspace Context
//      ↓
// Primary Investigation Manifold
//
// ============================================================

import PrimaryInvestigationManifold
  from "../../manifold/components/PrimaryInvestigationManifold";

import {
  useWorkspace,
} from "../context/WorkspaceContext";

// ============================================================
// COMPONENT
// ============================================================

export default function ManifoldWorkspace() {

  const {
    focusedEventId,
  } = useWorkspace();

  // ==========================================================
  // NO ACTIVE INVESTIGATION FOCUS
  // ==========================================================

  if (!focusedEventId) {

    return (

      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 0,

          color: "#94a3b8",
          fontSize: 16,
        }}
      >
        Awaiting active event selection
      </div>

    );

  }

  // ==========================================================
  // MANIFOLD WORKSPACE
  // ==========================================================

  return (

    <div
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,

        display: "flex",

        overflow: "hidden",
      }}
    >

      <PrimaryInvestigationManifold
        focusedEventId={focusedEventId}
      />

    </div>

  );

}