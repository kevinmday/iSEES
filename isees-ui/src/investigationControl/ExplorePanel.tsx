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
//
// Live Watch is a future subsystem and is intentionally not
// mounted in the V1 Investigation Library.
//
// Composition and presentation only.
// Child runtime behavior and ownership remain unchanged.
// ============================================================

import CorpusBrowser
  from "../corpus/components/CorpusBrowser";

import FederationPreviewPanel
  from "../federation/components/FederationPreviewPanel";

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

    </div>
  );
}
