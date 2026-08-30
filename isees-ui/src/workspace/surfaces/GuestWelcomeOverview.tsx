// ============================================================
// src/workspace/surfaces/GuestWelcomeOverview.tsx
// P57-UI-A6-I2C
// CANONICAL FRESH GUEST WELCOME
//
// Presentation only.
//
// This surface creates no Investigation, Workspace, selection,
// computational configuration, or persistence state.
// ============================================================

import "./GuestWelcomeOverview.css";

interface WorkflowStep {
  readonly number: string;
  readonly title: string;
  readonly description: string;
}

const WORKFLOW_STEPS:
  readonly WorkflowStep[] = [
    {
      number: "01",
      title: "Choose a case",
      description:
        "Browse the Case Library, preview a canonical event, and explicitly import it.",
    },
    {
      number: "02",
      title: "Inspect the manifold",
      description:
        "Study deterministic relationships, configuration, lineage, and Resolve availability.",
    },
    {
      number: "03",
      title: "Develop the record",
      description:
        "Compare cases, inspect evidence, collect Research, and develop Knowledge in Studio.",
    },
    {
      number: "04",
      title: "Resolve again",
      description:
        "Recompute from the canonical record and inspect what changed, what held, and why.",
    },
  ];

export default function GuestWelcomeOverview() {
  return (
    <div className="guest-welcome">

      <section className="guest-welcome__hero">
        <div className="guest-welcome__eyebrow">
          Fresh Guest Workspace
        </div>

        <h1 className="guest-welcome__title">
          Welcome to iSEES
        </h1>

        <p className="guest-welcome__lead">
          A deterministic research workstation for building
          inspectable, reproducible, and falsifiable
          investigations.
        </p>

        <div className="guest-welcome__start">
          <div className="guest-welcome__start-label">
            Start here
          </div>

          <div>
            Open <strong>System Canon</strong> in the Case
            Library at left, select a case, inspect its preview,
            and import it when you are ready.
          </div>
        </div>
      </section>

      <section
        className="guest-welcome__workflow"
        aria-labelledby="guest-workflow-title"
      >
        <div className="guest-welcome__section-heading">
          <div className="guest-welcome__eyebrow">
            Investigation Workflow
          </div>

          <h2 id="guest-workflow-title">
            From source case to resolved knowledge
          </h2>
        </div>

        <div className="guest-welcome__steps">
          {
            WORKFLOW_STEPS.map((step) => (
              <article
                className="guest-welcome__step"
                key={step.number}
              >
                <div className="guest-welcome__step-number">
                  {step.number}
                </div>

                <h3>{step.title}</h3>

                <p>{step.description}</p>
              </article>
            ))
          }
        </div>
      </section>

      <section
        className="guest-welcome__orientation"
        aria-labelledby="guest-orientation-title"
      >
        <div className="guest-welcome__section-heading">
          <div className="guest-welcome__eyebrow">
            Workspace Orientation
          </div>

          <h2 id="guest-orientation-title">
            What the primary modes do
          </h2>
        </div>

        <div className="guest-welcome__mode-grid">
          <ModeGuide
            name="MANIFOLD"
            description="Inspect the canonical investigative graph and its deterministic configuration."
          />

          <ModeGuide
            name="COMPARE"
            description="Evaluate cases and evidence without manufacturing missing observations."
          />

          <ModeGuide
            name="RESEARCH"
            description="Collect source-grounded material for the active investigation."
          />

          <ModeGuide
            name="STUDIO"
            description="Develop research into explicit, revisable Knowledge."
          />

          <ModeGuide
            name="RESOLVE"
            description="Publish deterministic availability, comparability, and investigative results."
          />
        </div>
      </section>

      <section className="guest-welcome__paths">
        <article className="guest-welcome__path guest-welcome__path--primary">
          <div className="guest-welcome__path-status">
            Available now
          </div>

          <h2>Explore the Case Library</h2>

          <p>
            Browse repository-held cases in the left panel.
            Selecting a case opens its preview without importing
            or changing your workspace.
          </p>
        </article>

        <article className="guest-welcome__path">
          <div className="guest-welcome__path-status">
            Guided case
          </div>

          <h2>Tic Tac / Nimitz</h2>

          <p>
            The canonical demonstration remains available in
            System Canon as an explicit choice. It is never
            installed automatically for a fresh Guest.
          </p>
        </article>

        <article className="guest-welcome__path guest-welcome__path--pending">
          <div className="guest-welcome__path-status">
            Not yet available
          </div>

          <h2>Create an empty investigation</h2>

          <p>
            Manual investigation creation will appear here after
            its canonical identity and provenance contract is
            implemented.
          </p>
        </article>
      </section>

    </div>
  );
}

function ModeGuide({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return (
    <article className="guest-welcome__mode">
      <h3>{name}</h3>
      <p>{description}</p>
    </article>
  );
}