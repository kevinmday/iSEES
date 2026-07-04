// ============================================================
// src/investigationControl/ComputePanel.tsx
// P30.2
// INVESTIGATION CONTROL
// COMPUTE PANEL
//
// Compute Mode defines the computational universe.
//
// Responsibilities:
//
//   • Resolve–Dissolve Computation
//   • Computational Layers
//   • Research Profiles
//   • Compute Presets
//   • Recompute
//
// Compute Mode performs no mathematical computation itself.
// It configures the deterministic inputs consumed by RDC.
//
// Full drop-in file.
// ============================================================

import ManifoldLayerSelector
  from "../components/ManifoldLayerSelector";

// ============================================================
// COMPONENT
// ============================================================

export default function ComputePanel() {

  return (

    <>

      {/* ===================================================== */}
      {/* RDC */}
      {/* ===================================================== */}

      <Section title="Resolve–Dissolve Computation">

        <div
          style={{
            color: "#94a3b8",
            fontSize: 12,
            lineHeight: 1.55,
          }}
        >
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

    </>

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

  children: React.ReactNode;

}) {

  return (

    <div
      style={{
        border: "1px solid #1f2937",
        borderRadius: 8,
        padding: 12,
        background: "#08101f",
        marginBottom: 12,
      }}
    >

      <div
        style={{
          fontSize: 11,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 10,
        }}
      >
        {title}
      </div>

      {children}

    </div>

  );

}

// ============================================================
// PLACEHOLDER
// ============================================================

function Placeholder() {

  return (

    <div
      style={{
        color: "#64748b",
        fontSize: 12,
        fontStyle: "italic",
      }}
    >
      Coming in upcoming P30 milestones...
    </div>

  );

}