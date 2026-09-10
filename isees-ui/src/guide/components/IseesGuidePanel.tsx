import { useCallback, useEffect, useRef, useState } from "react";
import type { GuideResolution } from "../contracts/index.ts";
import GuideSpotlight from "./GuideSpotlight.tsx";
import {
  GUIDE_PANEL_HEADING_ID,
  GUIDE_PANEL_ID,
  useGuidePresentation,
} from "../presentation/GuidePresentationContext.tsx";

export default function IseesGuidePanel({ resolution }: { readonly resolution: GuideResolution }) {
  const { isOpen, closeGuide } = useGuidePresentation();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [spotlightTarget, setSpotlightTarget] = useState<string>();
  const [targetFailure, setTargetFailure] = useState<string>();
  const clearSpotlight = useCallback(() => setSpotlightTarget(undefined), []);
  const reportMissing = useCallback((message: string) => { setSpotlightTarget(undefined); setTargetFailure(message); }, []);

  useEffect(() => {
    if (!isOpen) return;

    headingRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (spotlightTarget) clearSpotlight(); else closeGuide();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [clearSpotlight, closeGuide, isOpen, spotlightTarget]);

  if (!isOpen) return null;

  return (
    <aside
      id={GUIDE_PANEL_ID}
      className="isees-guide-panel"
      role="complementary"
      aria-labelledby={GUIDE_PANEL_HEADING_ID}
    >
      <header className="isees-guide-panel__header">
        <div>
          <p className="isees-guide-panel__context">Contextual visual guidance</p>
          <h2 id={GUIDE_PANEL_HEADING_ID} ref={headingRef} tabIndex={-1}>iSEES Guide</h2>
        </div>
        <button
          className="isees-guide-panel__close"
          type="button"
          aria-label="Close Guide"
          onClick={closeGuide}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <div className="isees-guide-panel__body">
        {resolution.status === "RESOLVED" ? <Briefing briefing={resolution.definition.briefing} onShowMe={targetId => { setTargetFailure(undefined); setSpotlightTarget(targetId); }} /> : <p role="status">{resolution.message}</p>}
        {spotlightTarget && <GuideSpotlight targetId={spotlightTarget} onMissing={reportMissing} onRemoved={clearSpotlight} />}
        {targetFailure && <p className="isees-guide-panel__target-failure" role="status">{targetFailure}</p>}
        <section className="isees-guide-panel__boundary" aria-labelledby="isees-guide-boundary-heading">
          <h3 id="isees-guide-boundary-heading">Advisory boundary</h3>
          <p>Guide is advisory. It does not select controls, run computations, publish research, or modify System Canon.</p>
        </section>
      </div>
    </aside>
  );
}

function Briefing({ briefing, onShowMe }: { readonly briefing: import("../contracts/index.ts").GuideBriefing; readonly onShowMe: (targetId: string) => void }) {
  return <div className="isees-guide-briefing">
    <Section title="Where you are"><p>{briefing.location}</p></Section>
    <Section title="Current situation"><p>{briefing.situation}</p></Section>
    <Section title="Why it matters"><p>{briefing.significance}</p></Section>
    {briefing.recommendedAction && <Section title="Recommended next action"><strong>{briefing.recommendedAction.label}</strong></Section>}
    {briefing.alternatives.length > 0 && <Section title="Alternatives"><ul>{briefing.alternatives.map(item => <li key={item.id}>{item.label}</li>)}</ul></Section>}
    {briefing.consequences.length > 0 && <Section title="What will happen"><ul>{briefing.consequences.map(item => <li key={item.description}>{item.description}</li>)}</ul></Section>}
    {briefing.protectedBoundaries.length > 0 && <Section title="Protected boundaries"><ul>{briefing.protectedBoundaries.map(item => <li key={item.description}>{item.description}</li>)}</ul></Section>}
    {briefing.blockers.length > 0 && <Section title="Blockers"><ul>{briefing.blockers.map(item => <li key={item.code}><strong>{item.missing}</strong> — {item.remedy}</li>)}</ul></Section>}
    {briefing.showMeTargetId && <button className="isees-guide-panel__show-me" type="button" onClick={() => onShowMe(briefing.showMeTargetId!)}>Show Me</button>}
  </div>;
}

function Section({ title, children }: { readonly title: string; readonly children: import("react").ReactNode }) {
  return <section className="isees-guide-briefing__section"><h3>{title}</h3>{children}</section>;
}
