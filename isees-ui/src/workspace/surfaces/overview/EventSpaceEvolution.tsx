import { useId } from "react";

export type OverviewFlowEmphasis =
  | "IDLE"
  | "SELECT"
  | "CONSTRUCT"
  | "EXAMINE"
  | "PRESERVE"
  | "PRODUCE";

interface EventSpaceEvolutionProps {
  readonly emphasis: OverviewFlowEmphasis;
}

export default function EventSpaceEvolution({ emphasis }: EventSpaceEvolutionProps) {
  const instanceId = useId().replace(/:/g, "");
  const headingId = `event-space-heading-${instanceId}`;
  const titleId = `event-space-title-${instanceId}`;
  const descriptionId = `event-space-description-${instanceId}`;
  const arrowId = `event-space-arrow-${instanceId}`;

  return (
    <figure className="event-space" data-emphasis={emphasis} aria-labelledby={headingId}>
      <figcaption>
        <p className="overview-section-label">Explanatory model</p>
        <h3 id={headingId}>Event-Space Evolution</h3>
        <p className="event-space__disclosure">Diagrammatic explanation — not live investigation output.</p>
      </figcaption>
      <svg
        className="event-space__diagram"
        viewBox="0 0 420 690"
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
        focusable="false"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title id={titleId}>Event-Space Evolution from governed source through conditional recomputation</title>
        <desc id={descriptionId}>A governed source produces a deterministic event-space projection. Noncanonical Research Vectors, Candidate Evidence, and preserved Research Inbox anchors do not change Manifold membership. Studio and .author activity produce separate Candidate Knowledge; drafting, saving, export, and publication do not alter the production Manifold. Only explicit governed acceptance or admission of eligible investigation input could lead to deterministic recomputation. The production connection is currently unavailable, and the researcher governs interpretation, admission, acceptance, and meaning.</desc>
        <defs>
          <marker id={arrowId} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0 8 4 0 8Z" className="event-space__arrowhead" />
          </marker>
        </defs>

        <g className="event-space__layer event-space__layer--initial" data-layer="initial-projection">
          <text x="18" y="28" className="event-space__eyebrow">INITIAL PROJECTION</text>
          <g className="event-space__source">
            <rect x="18" y="45" width="118" height="50" rx="6" />
            <text x="77" y="66" textAnchor="middle">GOVERNED</text>
            <text x="77" y="82" textAnchor="middle">SOURCE RECORD</text>
          </g>
          <path d="M136 70H178" className="event-space__canonical-edge" markerEnd={`url(#${arrowId})`} />
          <g className="event-space__topology" data-topology="initial">
            <path d="M222 54 278 78 244 126 190 106Z M222 54 244 126 M278 78 190 106" />
            <circle cx="222" cy="54" r="8" /><circle cx="278" cy="78" r="8" />
            <circle cx="244" cy="126" r="8" /><circle cx="190" cy="106" r="8" />
          </g>
          <text x="18" y="151" className="event-space__label">Deterministic event-space projection</text>
          <text x="18" y="168" className="event-space__note">Solid canonical topology from governed input</text>
        </g>

        <g className="event-space__layer event-space__layer--research" data-layer="research-expansion">
          <text x="18" y="210" className="event-space__eyebrow">RESEARCH EXPANSION</text>
          <g className="event-space__vectors">
            <path d="M112 264C158 226 214 232 266 256" markerEnd={`url(#${arrowId})`} />
            <path d="M110 274C166 304 218 310 286 286" markerEnd={`url(#${arrowId})`} />
          </g>
          <text x="18" y="236" className="event-space__label">Research Vectors</text>
          <text x="18" y="253" className="event-space__note">Noncanonical investigative directions</text>
          <g className="event-space__candidate-evidence">
            <rect x="266" y="228" width="136" height="58" rx="7" />
            <text x="334" y="251" textAnchor="middle">CANDIDATE EVIDENCE</text>
            <text x="334" y="269" textAnchor="middle">candidate / review-only</text>
          </g>
          <g className="event-space__anchors">
            <path d="M66 298 76 308 66 318 56 308Z" /><path d="M100 318 110 328 100 338 90 328Z" />
            <text x="125" y="325">PRESERVED RESEARCH INBOX ANCHORS</text>
            <text x="125" y="342">Preserved, not promoted</text>
          </g>
          <text x="18" y="371" className="event-space__boundary-note">Candidate material and anchors remain outside Manifold membership.</text>
        </g>

        <g className="event-space__layer event-space__layer--recomputation" data-layer="governed-recomputation">
          <text x="18" y="414" className="event-space__eyebrow">GOVERNED RECOMPUTATION</text>
          <g className="event-space__studio">
            <rect x="18" y="433" width="104" height="48" rx="6" />
            <text x="70" y="453" textAnchor="middle">STUDIO / .author</text>
            <text x="70" y="469" textAnchor="middle">draft · save · export</text>
          </g>
          <path d="M122 457H148" className="event-space__candidate-path" markerEnd={`url(#${arrowId})`} />
          <g className="event-space__candidate-knowledge">
            <rect x="151" y="433" width="112" height="48" rx="6" />
            <text x="207" y="454" textAnchor="middle">CANDIDATE</text>
            <text x="207" y="470" textAnchor="middle">KNOWLEDGE</text>
          </g>
          <path d="M263 457H292" className="event-space__candidate-path" markerEnd={`url(#${arrowId})`} />
          <g className="event-space__gate" data-boundary="acceptance-gate">
            <path d="M300 424V490M312 424V490" />
            <text x="306" y="509" textAnchor="middle">EXPLICIT GOVERNED</text>
            <text x="306" y="524" textAnchor="middle">ACCEPTANCE / ADMISSION</text>
          </g>
          <path d="M316 457H393" className="event-space__conditional-path" markerEnd={`url(#${arrowId})`} />
          <text x="355" y="443" textAnchor="middle" className="event-space__small-label">eligible investigation input</text>
          <text x="18" y="554" className="event-space__unavailable">Governed lifecycle — production connection not currently available.</text>
          <text x="18" y="570" className="event-space__note">Draft, save, export, or candidate publication does not alter the Manifold.</text>
          <path d="M360 574C360 594 323 602 291 610" className="event-space__conditional-path" markerEnd={`url(#${arrowId})`} />
          <g className="event-space__topology event-space__topology--revised" data-topology="revised">
            <path d="M242 588 293 610 268 657 210 650 185 612Z M242 588 268 657 M293 610 210 650 M185 612 268 657" />
            <circle cx="242" cy="588" r="7" /><circle cx="293" cy="610" r="7" /><circle cx="268" cy="657" r="7" />
            <circle cx="210" cy="650" r="7" /><circle cx="185" cy="612" r="7" />
          </g>
          <text x="18" y="586" className="event-space__label">Deterministic recomputation after accepted eligible input.</text>
          <text x="18" y="605" className="event-space__note">May expand, contract, reshape, or reveal relationships;</text>
          <text x="18" y="622" className="event-space__note">it does not guarantee additional nodes.</text>
          <text x="18" y="677" className="event-space__researcher">Researcher governs interpretation · admission · acceptance · meaning</text>
        </g>
      </svg>
    </figure>
  );
}
