import { useState } from "react";
import { Link } from "react-router-dom";
import Tooltip from "../../components/Tooltip";
import { useGuidePresentation } from "../../guide/presentation/GuidePresentationContext";
import { useLibraryNavigation } from "./LibraryWorkspace";
import EventSpaceEvolution, { type OverviewFlowEmphasis } from "./overview/EventSpaceEvolution";
import "./OverviewWorkspace.css";

export interface OverviewResearchStage {
  readonly number: string;
  readonly verb: Exclude<OverviewFlowEmphasis, "IDLE">;
  readonly mode: string;
  readonly detail: string;
  readonly tooltip: string;
  readonly tooltipLabel: string;
}

export const RESEARCH_STAGES: readonly OverviewResearchStage[] = [
  { number: "01", verb: "SELECT", mode: "Library", detail: "Choose, preview, create, or resume an investigation.", tooltip: "Choose, preview, create, or resume an investigation. Library selection does not itself activate, compute, or change an investigation.", tooltipLabel: "About Library" },
  { number: "02", verb: "CONSTRUCT", mode: "Manifold", detail: "Construct the deterministic event-space projection.", tooltip: "Compute the Investigation Manifold from governed inputs. It is deterministic and recomputable, and may expand or reshape after approved evidence or relationship changes.", tooltipLabel: "About Manifold" },
  { number: "03", verb: "EXAMINE", mode: "Analytical modes", detail: "Compare, Narrative, Evidence, Timeline, Layers, and Intention.", tooltip: "Examine evidence and computed structure through different projections. Results and research vectors guide inquiry; they do not establish truth.", tooltipLabel: "About analytical modes" },
  { number: "04", verb: "PRESERVE", mode: "Research Inbox", detail: "Preserve researcher-selected, governed research anchors.", tooltip: "Deliberately preserve selected research material with its identity and provenance. Preservation does not make it true, canonical, or part of the active Manifold.", tooltipLabel: "About Research Inbox" },
  { number: "05", verb: "PRODUCE", mode: "Studio", detail: "Draft and export governed research products.", tooltip: "Create governed research products from selected material. AI may assist with drafting, but the researcher controls interpretation, meaning, and final authorship.", tooltipLabel: "About Studio" },
] as const;

export default function OverviewWorkspace() {
  const library = useLibraryNavigation();
  const guide = useGuidePresentation();
  const [flowEmphasis, setFlowEmphasis] = useState<OverviewFlowEmphasis>("IDLE");

  return (
    <main className="overview-workspace" aria-labelledby="overview-title">
      <div className="overview-canvas">
        <section className="overview-orientation" aria-labelledby="overview-title">
          <header className="overview-product">
            <p className="overview-kicker">iSEES</p>
            <p className="overview-expansion">Integrated Systems Epistemology &amp; Evaluation System</p>
            <p className="overview-descriptor">Deterministic investigative research environment</p>
          </header>
          <div className="overview-proposition">
            <h2 id="overview-title">Investigate the record. Preserve how you know.</h2>
            <p>Trace evidence and relationships while preserving provenance and the limits of what the record can establish.</p>
          </div>
          <section className="overview-guidance" aria-labelledby="overview-guidance-title">
            <p className="overview-section-label">Guided orientation</p>
            <h3 id="overview-guidance-title">Understand the research flow</h3>
            <p>Follow the existing Guide, or read the System Briefing at your own pace.</p>
            <div className="overview-guidance__actions">
              <button type="button" onClick={(event) => guide.openOrientation(event.currentTarget)}>Start Guided Orientation</button>
              <Link to="/briefing">System Briefing</Link>
            </div>
          </section>
          <nav className="overview-entry" aria-label="Begin research">
            <button className="overview-entry__primary" type="button" onClick={() => library.enter(false)}>Enter Library</button>
            <button className="overview-entry__secondary" type="button" onClick={() => library.enter(true)}>Bring Your Own Case</button>
          </nav>
          <p className="overview-boundary">Browsing, preview, intake, activation, resumption, and investigation management remain in Library.</p>
        </section>

        <section className="overview-flow" aria-labelledby="overview-flow-title">
          <header className="overview-flow__header">
            <div>
              <p className="overview-section-label">Research flow</p>
              <h2 id="overview-flow-title">From governed record to research product</h2>
            </div>
            <span className="overview-flow__mark" aria-label="iSEES">iSEES</span>
          </header>
          <p className="overview-flow__intro">This is an iterative research cycle, not a required sequence; as governed inputs evolve, the Manifold is recomputed and may expose new research vectors.</p>
          <div className="overview-flow__composition">
            <ol className="overview-flow__stages">
              {RESEARCH_STAGES.map((stage) => (
                <li
                  key={stage.verb}
                  onPointerEnter={() => setFlowEmphasis(stage.verb)}
                  onPointerLeave={() => setFlowEmphasis("IDLE")}
                  onFocusCapture={() => setFlowEmphasis(stage.verb)}
                  onBlurCapture={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setFlowEmphasis("IDLE");
                  }}
                >
                  <span className="overview-flow__number" aria-hidden="true">{stage.number}</span>
                  <div><strong>{stage.verb}</strong><span className="overview-flow__mode">{stage.mode}</span><Tooltip text={stage.tooltip}><button type="button" className="overview-flow__info" aria-label={stage.tooltipLabel}>?</button></Tooltip><p>{stage.detail}</p></div>
                </li>
              ))}
            </ol>
            <EventSpaceEvolution emphasis={flowEmphasis} />
          </div>
          <aside className="overview-principles" aria-labelledby="overview-principles-title">
            <p className="overview-section-label">Operating principle</p>
            <h3 id="overview-principles-title">Mathematics exposes relationships. The researcher governs meaning.</h3>
            <ul>
              <li>Deterministic mathematics exposes relationships.</li>
              <li>The researcher governs interpretation and acceptance.</li>
              <li>AI does not decide what the evidence means.</li>
              <li>Unknown remains unknown.</li>
            </ul>
          </aside>
        </section>
      </div>
    </main>
  );
}
