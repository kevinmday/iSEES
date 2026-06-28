// ============================================================
// src/intel/components/IntelligenceBrief.tsx
// P26.1
// INTELLIGENCE BRIEF
// UNIVERSAL INSPECTION SURFACE
//
// This component renders the currently selected
// Intelligence Brief.
//
// It is intentionally repository agnostic.
//
// Future:
// - Rich metadata
// - Provenance graph
// - Similarity analysis
// - Relationship explorer
// - Artifact previews
// ============================================================

import {

  useIntelligenceBrief,

} from "../context/IntelligenceBriefContext";


// ============================================================
// COMPONENT
// ============================================================

export default function IntelligenceBrief() {

  const {

    brief,

  } = useIntelligenceBrief();


  // ==========================================================
  // EMPTY
  // ==========================================================

  if (!brief) {

    return (

      <div
        style={{

          height: "100%",

          display: "flex",

          flexDirection: "column",

          justifyContent: "center",

          alignItems: "center",

          color: "#888",

          textAlign: "center",

          padding: "32px",

        }}
      >

        <div
          style={{

            fontSize: "18px",

            fontWeight: 700,

            marginBottom: "12px",

            letterSpacing: ".08em",

          }}
        >
          INTELLIGENCE BRIEF
        </div>

        <div>

          Select an object from the Federated Knowledge
          browser to begin.

        </div>

      </div>

    );

  }


  // ==========================================================
  // RESULT
  // ==========================================================

  return (

    <div
      style={{

        padding: "16px",

        overflowY: "auto",

        height: "100%",

      }}
    >

      {/* ================================================ */}
      {/* TITLE */}
      {/* ================================================ */}

      <div
        style={{

          fontSize: "20px",

          fontWeight: 700,

          marginBottom: "4px",

        }}
      >
        {brief.title}
      </div>

      <div
        style={{

          opacity: 0.7,

          marginBottom: "18px",

          fontSize: "13px",

        }}
      >

        {brief.objectType}

        {" • "}

        {brief.repositorySource}

      </div>


      {/* ================================================ */}
      {/* SUMMARY */}
      {/* ================================================ */}

      <Section title="SUMMARY">

        {

          brief.summary ??

          "No summary available."

        }

      </Section>


      {/* ================================================ */}
      {/* RELATIONSHIPS */}
      {/* ================================================ */}

      <Section title="RELATIONSHIPS">

        Coming Soon

      </Section>


      {/* ================================================ */}
      {/* METADATA */}
      {/* ================================================ */}

      <Section title="METADATA">

        Coming Soon

      </Section>


      {/* ================================================ */}
      {/* PROVENANCE */}
      {/* ================================================ */}

      <Section title="PROVENANCE">

        Coming Soon

      </Section>


      {/* ================================================ */}
      {/* ACTIONS */}
      {/* ================================================ */}

      <Section title="ACTIONS">

        <div
          style={{

            display: "flex",

            gap: "10px",

            marginTop: "8px",

          }}
        >

          <button>

            Open Original

          </button>

          <button>

            Import Investigation

          </button>

        </div>

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

  children: React.ReactNode;

}) {

  return (

    <div
      style={{

        marginBottom: "24px",

      }}
    >

      <div
        style={{

          fontWeight: 700,

          fontSize: "12px",

          letterSpacing: ".08em",

          opacity: 0.7,

          marginBottom: "8px",

        }}
      >

        {title}

      </div>

      <div
        style={{

          border: "1px solid #333",

          borderRadius: "6px",

          padding: "12px",

          minHeight: "56px",

        }}
      >

        {children}

      </div>

    </div>

  );

}