// ============================================================
// src/surfaces/PrimarySurface.tsx
// P39A
// PRIMARY WORKSPACE SURFACE
//
// Canonical runtime projection boundary.
//
// The Workspace Runtime owns the active Workspace Mode.
// PrimarySurface owns no state and performs no computation.
//
// P39A completes the migration from the legacy
// WorkspaceProjection router to the canonical
// WorkspaceSurface runtime router.
//
// Ownership:
//
// Operator
//      ↓
// Workspace Runtime
//      ↓
// WorkspaceSurface
//      ↓
// Active Workspace
//
// FULL DROP-IN REPLACEMENT
// ============================================================

import WorkspaceSurface
  from "./WorkspaceSurface";

// ============================================================
// COMPONENT
// ============================================================

export default function PrimarySurface() {

  return (

    <WorkspaceSurface />

  );

}