import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ISEES_V1_INTRODUCTION, ONBOARDING_RESEARCHER_GUIDE_TARGET_ID } from "../content/IseesIntroductionContent";
import { acknowledgeIseesIntroduction, hasAcknowledgedIseesIntroduction } from "../runtime/OnboardingAcknowledgement";
import "./IseesIntroductionGate.css";

export default function IseesIntroductionGate({ identityKind, children, onEntered }: { readonly identityKind: "GUEST" | "ACCOUNT"; readonly children: ReactNode; readonly onEntered?: () => void }) {
  const [entered, setEntered] = useState(() => hasAcknowledgedIseesIntroduction());
  const headingRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    if (!entered) headingRef.current?.focus();
  }, [entered]);

  if (entered) return <>{children}</>;

  const content = ISEES_V1_INTRODUCTION;
  function enterIsees(): void {
    acknowledgeIseesIntroduction();
    onEntered?.();
    setEntered(true);
  }

  return <main className="isees-introduction" aria-labelledby="isees-introduction-title">
    <div className="isees-introduction__veil" aria-hidden="true" />
    <article className="isees-introduction__content">
      <header className="isees-introduction__identity">
        <p>{content.productClass}</p>
        <h1 id="isees-introduction-title" ref={headingRef} tabIndex={-1}>Welcome to <span>{content.productName}</span></h1>
        <h2>{content.expandedName}</h2>
      </header>
      <section className="isees-introduction__principles" aria-label="What iSEES is">
        <p className="isees-introduction__lead">{content.explanation}</p>
        <p>{content.deterministicBoundary}</p>
        <p>{content.researcherRole}</p>
      </section>
      <section className="isees-introduction__workflow" aria-labelledby="isees-introduction-workflow-title">
        <h2 id="isees-introduction-workflow-title">A simple research path</h2>
        <ol>{content.workflow.map(step => <li key={step}>{step}</li>)}</ol>
      </section>
      <section className="isees-introduction__trust" aria-labelledby="isees-introduction-trust-title">
        <h2 id="isees-introduction-trust-title">Your work remains deliberate</h2>
        <ul>{content.trustBoundaries.map(boundary => <li key={boundary}>{boundary}</li>)}</ul>
        <p>{identityKind === "GUEST" ? "Guest work is temporary and is not saved after the guest session." : "Private investigations you save belong to your signed-in researcher account."}</p>
      </section>
      <footer className="isees-introduction__actions">
        <button type="button" onClick={enterIsees}>Enter iSEES</button>
        <p data-guide-id={ONBOARDING_RESEARCHER_GUIDE_TARGET_ID}>V1 Researcher Guide PDF is being prepared.</p>
      </footer>
    </article>
  </main>;
}
