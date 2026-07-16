// ============================================================
// ManifoldWorkspace.tsx
// P39B
// PRODUCTION MANIFOLD WORKSPACE
//
// Canonical interactive investigation manifold.
//
// Presentation-only.
//
// Owns:
// • Production workspace layout
// • Manifold presentation
//
// Does NOT own:
// • Runtime
// • Graph engine
// • Selection logic
// • Manifold computation
//
// ============================================================

import PrimaryInvestigationManifold from "../../manifold/components/PrimaryInvestigationManifold";

export default function ManifoldWorkspace() {

  return (

    <div
      style={{
        height: "100%",
        display: "flex",
        overflow: "hidden",
      }}
    >

      <PrimaryInvestigationManifold
        focusedEventId="E-TICTAC-2004"
      />

    </div>

  );

}