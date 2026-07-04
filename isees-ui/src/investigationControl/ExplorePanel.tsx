// ============================================================
// src/investigationControl/ExplorePanel.tsx
// P30.2
// INVESTIGATION CONTROL
// EXPLORE PANEL
//
// Explore Mode is responsible for constructing an investigation.
//
// Responsibilities:
//
//   • Browse federated repositories
//   • Preview investigations
//   • Review graph diagnostics
//   • Review corpus resolution
//   • Import investigations via Event Radar
//
// Explore performs NO computation.
//
// Resolve–Dissolve Computation is introduced separately through
// Compute Mode.
//
// Full drop-in file.
// ============================================================

import CorpusBrowser
  from "../corpus/components/CorpusBrowser";

import FederationPreviewPanel
  from "../federation/components/FederationPreviewPanel";

import GraphDiagnostics
  from "../graph/GraphDiagnostics";

import CorpusResolutionPanel
  from "../corpus/components/CorpusResolutionPanel";

import EventRadar
  from "../components/EventRadar";

// ============================================================
// COMPONENT
// ============================================================

export default function ExplorePanel() {

  return (

    <>

      {/* ===================================================== */}
      {/* FEDERATED KNOWLEDGE */}
      {/* ===================================================== */}

      <CorpusBrowser />

      {/* ===================================================== */}
      {/* PREVIEW */}
      {/* ===================================================== */}

      <FederationPreviewPanel />

      {/* ===================================================== */}
      {/* GRAPH */}
      {/* ===================================================== */}

      <GraphDiagnostics />

      {/* ===================================================== */}
      {/* CORPUS RESOLUTION */}
      {/* ===================================================== */}

      <CorpusResolutionPanel />

      {/* ===================================================== */}
      {/* EVENT RADAR */}
      {/* ===================================================== */}

      <EventRadar />

    </>

  );

}