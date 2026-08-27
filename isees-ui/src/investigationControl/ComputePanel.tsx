// ============================================================
// src/investigationControl/ComputePanel.tsx
// P57-UI-A4
// INVESTIGATION LIBRARY
// COMPUTE PROJECTION
//
// Configure the deterministic inputs consumed by RDC.
//
// Presentation and composition only.
// No mathematical computation occurs in this component.
// ============================================================

import type {
  ReactNode,
} from "react";

import ManifoldLayerSelector
  from "../components/ManifoldLayerSelector";

// ============================================================
// COMPONENT
// ============================================================

export default function ComputePanel() {
  return (
    <div className="investigation-library__compute">

      {/* ===================================================== */}
      {/* RDC */}
      {/* ===================================================== */}

      <Section title="Resolve–Dissolve Computation">
        <div className="investigation-library__compute-copy">
          Configure the computational universe used to
          deterministically construct the Investigation
          Manifold.
        </div>
      </Section>

      {/* ===================================================== */}
      {/* LAYERS */}
      {/* ===================================================== */}

      <ManifoldLayerSelector />

      {/* ===================================================== */}
      {/* RESEARCH PROFILES */}
      {/* ===================================================== */}

      <Section title="Research Profiles">
        <Placeholder />
      </Section>

      {/* ===================================================== */}
      {/* COMPUTE PRESETS */}
      {/* ===================================================== */}

      <Section title="Compute Presets">
        <Placeholder />
      </Section>

      {/* ===================================================== */}
      {/* RECOMPUTE */}
      {/* ===================================================== */}

      <Section title="Recompute">
        <Placeholder />
      </Section>

    </div>
  );
}

// ============================================================
// SECTION
// ============================================================

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="investigation-library__compute-section">
      <div className="investigation-library__compute-title">
        {title}
      </div>

      {children}
    </section>
  );
}

// ============================================================
// PLACEHOLDER
// ============================================================

function Placeholder() {
  return (
    <div className="investigation-library__placeholder">
      Coming in an upcoming milestone.
    </div>
  );
}