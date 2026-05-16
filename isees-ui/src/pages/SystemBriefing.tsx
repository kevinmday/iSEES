// ============================================================
// src/pages/SystemBriefing.tsx
// iSEES SYSTEM BRIEFING
// FULL DROP-IN REPLACEMENT
// ============================================================

import { Link } from "react-router-dom";

export default function SystemBriefing() {
  return (
    <div
      style={{
        background: "#05070a",
        color: "#d7dde5",
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <div
        style={{
          borderBottom: "1px solid #1b2735",
          paddingBottom: "20px",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            color: "#7aa2f7",
            fontSize: "13px",
            letterSpacing: "2px",
            marginBottom: "10px",
          }}
        >
          iSEES-UAP // SYSTEM BRIEFING
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "34px",
            fontWeight: 600,
          }}
        >
          Emergence Detection System
        </h1>

        <div
          style={{
            marginTop: "14px",
            color: "#8b9bb0",
            maxWidth: "950px",
            lineHeight: 1.7,
            fontSize: "15px",
          }}
        >
          Deterministic operational cognition architecture
          for anomalous event reconstruction, observability
          normalization, topology propagation, and immutable
          epistemic lineage preservation.
        </div>

        <div
          style={{
            marginTop: "24px",
          }}
        >
          <Link
            to="/"
            style={{
              color: "#7aa2f7",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            ← Return to Operator Console
          </Link>
        </div>
      </div>

      {/* ===================================================== */}
      {/* CONTENT */}
      {/* ===================================================== */}

      <div
        style={{
          maxWidth: "1050px",
          lineHeight: 1.8,
          fontSize: "15px",
        }}
      >
        {/* ------------------------------------------------- */}
        {/* WHAT iSEES IS */}
        {/* ------------------------------------------------- */}

        <Section title="WHAT iSEES IS">
          <p>
            iSEES is not another UFO database.
          </p>

          <p>
            It is a deterministic operational cognition
            system designed to model anomalous events
            across space, time, observability,
            infrastructure, and semantic topology.
          </p>

          <p>
            Most systems treat reports as isolated
            stories.
          </p>

          <p>
            iSEES treats reports as constrained
            epistemic structures embedded inside a
            real-world event-space manifold.
          </p>
        </Section>

        {/* ------------------------------------------------- */}
        {/* OBSERVABILITY */}
        {/* ------------------------------------------------- */}

        <Section title="OBSERVABILITY NORMALIZATION">
          <p>
            Raw report density does not equal anomaly
            density.
          </p>

          <p>
            Most systems fail to account for:
          </p>

          <BulletList
            items={[
              "observer opportunity",
              "terrain masking",
              "sensor availability",
              "aviation density",
              "population distribution",
              "weather conditions",
              "reporting likelihood",
            ]}
          />

          <p>
            iSEES attempts to normalize those distortions
            before evaluating emergence significance.
          </p>

          <CodeBlock>
            Emergence ≈ Reports / Observability
          </CodeBlock>
        </Section>

        {/* ------------------------------------------------- */}
        {/* MANIFOLD */}
        {/* ------------------------------------------------- */}

        <Section title="EVENT-SPACE MANIFOLD MODEL">
          <p>
            iSEES models observations as nodes embedded
            inside a constrained event-space manifold.
          </p>

          <p>
            Each event exists simultaneously across:
          </p>

          <BulletList
            items={[
              "spatial geometry",
              "temporal geometry",
              "semantic geometry",
              "observability geometry",
              "infrastructure geometry",
              "interpretive topology",
            ]}
          />

          <p>
            The system attempts to reconstruct:
          </p>

          <CodeBlock>
            what reality should have looked like
            at that location
            at that moment in time
          </CodeBlock>
        </Section>

        {/* ------------------------------------------------- */}
        {/* DETERMINISTIC */}
        {/* ------------------------------------------------- */}

        <Section title="DETERMINISTIC VS PROBABILISTIC">
          <p>
            Most modern AI systems operate
            probabilistically.
          </p>

          <p>
            iSEES instead attempts deterministic
            reconstruction of constrained reality
            surfaces using:
          </p>

          <BulletList
            items={[
              "observability normalization",
              "known-object deconfliction",
              "semantic convergence",
              "topology propagation",
              "temporal correlation",
              "infrastructure-aware reasoning",
            ]}
          />
        </Section>

        {/* ------------------------------------------------- */}
        {/* IMMUTABILITY */}
        {/* ------------------------------------------------- */}

        <Section title="IMMUTABLE EPISTEMIC ARCHITECTURE">
          <p>
            Historical cognition inside iSEES remains
            immutable.
          </p>

          <p>
            Most investigative systems overwrite prior
            interpretation with newer information.
          </p>

          <p>
            iSEES preserves:
          </p>

          <BulletList
            items={[
              "what the system believed",
              "when it believed it",
              "why cognition changed",
              "how contradiction propagated",
              "how ambiguity evolved",
              "which systems participated",
            ]}
          />

          <p>
            through append-only epistemic lineage.
          </p>
        </Section>

        {/* ------------------------------------------------- */}
        {/* REPLAY */}
        {/* ------------------------------------------------- */}

        <Section title="LIVE MODE VS REPLAY MODE">
          <p>
            Replay in iSEES is not event playback.
          </p>

          <p>
            Replay reconstructs:
          </p>

          <CodeBlock>
            historical knowability
          </CodeBlock>

          <p>
            at each moment in time.
          </p>

          <p>
            Replay attempts to preserve:
          </p>

          <BulletList
            items={[
              "ambiguity",
              "contradictions",
              "partial observability",
              "incomplete topology",
            ]}
          />

          <p>
            without contaminating earlier cognition
            with future knowledge.
          </p>
        </Section>

        {/* ------------------------------------------------- */}
        {/* STATUS */}
        {/* ------------------------------------------------- */}

        <Section title="CURRENT STATUS">
          <p>
            The platform is currently under active
            engineering development.
          </p>

          <p>
            Active architecture includes:
          </p>

          <BulletList
            items={[
              "observability normalization",
              "topology propagation",
              "known-object deconfliction",
              "semantic convergence",
              "immutable epistemic lineage",
              "temporal cognition replay infrastructure",
              "operator intelligence systems",
            ]}
          />
        </Section>
      </div>
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
    <section
      style={{
        marginBottom: "52px",
      }}
    >
      <h2
        style={{
          color: "#7aa2f7",
          fontSize: "16px",
          letterSpacing: "1px",
          marginBottom: "18px",
        }}
      >
        {title}
      </h2>

      <div
        style={{
          color: "#c9d4df",
        }}
      >
        {children}
      </div>
    </section>
  );
}


// ============================================================
// BULLET LIST
// ============================================================

function BulletList({
  items,
}: {
  items: string[];
}) {
  return (
    <ul
      style={{
        paddingLeft: "22px",
        marginTop: "12px",
        marginBottom: "18px",
      }}
    >
      {items.map((item) => (
        <li
          key={item}
          style={{
            marginBottom: "8px",
            color: "#9fb0c3",
          }}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}


// ============================================================
// CODE BLOCK
// ============================================================

function CodeBlock({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#0d1117",
        border: "1px solid #1f2b3a",
        borderRadius: "6px",
        padding: "18px",
        marginTop: "16px",
        marginBottom: "22px",
        whiteSpace: "pre-line",
        fontFamily: "monospace",
        color: "#7ee787",
      }}
    >
      {children}
    </div>
  );
}