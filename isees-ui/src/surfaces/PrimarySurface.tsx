// ============================================================
// src/surfaces/PrimarySurface.tsx
// P36 DIAGNOSTIC
// PRIMARY SURFACE
//
// Temporary diagnostic.
//
// Force the application to render only the Workspace Surface.
//
// If Workspace Modes still do not change after this file,
// the problem is NOT inside PrimarySurface.
//
// FULL DROP-IN REPLACEMENT
// ============================================================

import WorkspaceSurface
  from "./WorkspaceSurface";

// ============================================================
// COMPONENT
// ============================================================

export default function PrimarySurface() {

  console.log(
    "PrimarySurface render"
  );

  return (

    <WorkspaceSurface />

  );

}