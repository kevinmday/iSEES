// ============================================================
// src/surfaces/PrimarySurface.tsx
// P37A
// PRIMARY WORKSPACE PROJECTION
//
// Canonical projection surface for the Workspace Runtime.
//
// The Workspace Runtime deterministically owns the active
// Workspace Mode. PrimarySurface performs no computation
// and owns no application state.
//
// It simply projects the appropriate workspace surface
// selected by the Workspace Projection subsystem.
//
// Ownership:
//
// Operator
//      ↓
// Workspace Runtime
//      ↓
// Workspace Projection
//      ↓
// PrimarySurface
//      ↓
// Active Workspace Surface
//
// PrimarySurface owns no state.
// PrimarySurface performs no computation.
// It is the deterministic projection boundary between the
// runtime and the visible operator workspace.
//
// FULL DROP-IN REPLACEMENT
// ============================================================

import WorkspaceProjection
  from "../workspace/runtime/WorkspaceProjection";

import WorkspaceSurface
  from "./WorkspaceSurface";

// ============================================================
// COMPONENT
// ============================================================

export default function PrimarySurface() {

  return (

    <WorkspaceProjection
      fallback={
        <WorkspaceSurface />
      }
    />

  );

}