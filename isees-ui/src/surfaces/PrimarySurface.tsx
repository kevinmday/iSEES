// ============================================================
// src/surfaces/PrimarySurface.tsx
// P26.2
// PRIMARY SURFACE
//
// The Primary Surface owns the center investigation region.
//
// It decides which major investigation surface the operator
// should see.
//
// Current implementation:
//
//   Intelligence Brief
//          OR
//   Investigation Workspace
//
// Future:
//
//   Timeline
//   Comparative Analysis
//   Narrative Reconstruction
//   Investigation Graph
//   3D Manifold
//   Hypothesis Workspace
//
// ============================================================

import InvestigationWorkspace from "../components/InvestigationWorkspace";

import IntelligenceBrief from "../intel/components/IntelligenceBrief";

import {
  useIntelligenceBrief,
} from "../intel/context/IntelligenceBriefContext";


// ============================================================
// COMPONENT
// ============================================================

export default function PrimarySurface() {

  const {

    brief,

  } = useIntelligenceBrief();


  // ==========================================================
  // INTELLIGENCE BRIEF
  // ==========================================================

  if (

    brief

  ) {

    return (

      <IntelligenceBrief />

    );

  }


  // ==========================================================
  // DEFAULT
  // ==========================================================

  return (

    <InvestigationWorkspace />

  );

}