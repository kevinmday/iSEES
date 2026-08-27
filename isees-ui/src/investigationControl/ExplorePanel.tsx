// ============================================================
// src/investigationControl/ExplorePanel.tsx
// P57-UI-A4
// INVESTIGATION LIBRARY
// EXPLORE WORKFLOW
//
// Responsibilities:
//
//   • Browse repository-held cases
//   • Preview a selected case
//   • Review active-investigation status
//   • Access the live event intake path
//
// Composition and presentation only.
// Child runtime behavior and ownership remain unchanged.
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
    <div className="investigation-library__explore">

      {/* ===================================================== */}
      {/* PRIMARY CASE LIBRARY WORKFLOW */}
      {/* ===================================================== */}

      <section
        className={[
          "investigation-library__section",
          "investigation-library__section--primary",
        ].join(" ")}
        aria-labelledby="case-library-heading"
      >
        <h2
          id="case-library-heading"
          className="investigation-library__section-heading"
        >
          Case Library
        </h2>

        <p className="investigation-library__section-description">
          Browse available repositories and inspect a case
          before importing it.
        </p>

        <CorpusBrowser />

        <FederationPreviewPanel />
      </section>

      {/* ===================================================== */}
      {/* ACTIVE INVESTIGATION STATUS */}
      {/* ===================================================== */}

      <section
        className={[
          "investigation-library__section",
          "investigation-library__section--secondary",
        ].join(" ")}
        aria-labelledby="investigation-status-heading"
      >
        <h2
          id="investigation-status-heading"
          className="investigation-library__section-heading"
        >
          Investigation Status
        </h2>

        <p className="investigation-library__section-description">
          Inspect the active graph and available legacy
          resolution records.
        </p>

        <GraphDiagnostics />

        <CorpusResolutionPanel />
      </section>

      {/* ===================================================== */}
      {/* LIVE EVENT INTAKE */}
      {/* ===================================================== */}

      <section
        className={[
          "investigation-library__section",
          "investigation-library__section--secondary",
        ].join(" ")}
        aria-labelledby="live-intake-heading"
      >
        <h2
          id="live-intake-heading"
          className="investigation-library__section-heading"
        >
          Live Event Intake
        </h2>

        <p className="investigation-library__section-description">
          Select a monitored event and import it directly into
          the active investigation.
        </p>

        <EventRadar />
      </section>

    </div>
  );
}