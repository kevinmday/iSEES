import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const overview = source("../../src/workspace/surfaces/OverviewWorkspace.tsx");
const presentation = source("../../src/workspace/surfaces/overview/OverviewPresentation.tsx");
const frontDoor = source("../../src/account/AccountFrontDoor.tsx");
const css = source("../../src/workspace/surfaces/OverviewWorkspace.css");
const evolution = source("../../src/workspace/surfaces/overview/EventSpaceEvolution.tsx");
const layout = source("../../src/layout/MainLayout.tsx");
const surface = source("../../src/surfaces/WorkspaceSurface.tsx");

describe("P57-OVERVIEW-I2 two-panel orientation workspace", () => {
  it("uses one mode-local orientation and research-flow composition", () => {
    expect(presentation).toContain('className="overview-canvas"');
    expect(presentation).toContain('className="overview-orientation"');
    expect(presentation).toContain('className="overview-flow"');
    expect(css).toMatch(/grid-template-columns:minmax\(320px,2fr\) minmax\(480px,3fr\)/);
    expect(css).toMatch(/@media\(max-width:900px\).*grid-template-columns:1fr/s);
  });

  it("keeps orientation, Guide, briefing, and Library-owned entries on the left", () => {
    for (const copy of ["Integrated Systems Epistemology", "Investigate the record", "Start Guided Orientation", "System Briefing"]) expect(presentation).toContain(copy);
    for (const copy of ["ENTER LIBRARY", "BRING YOUR OWN CASE"]) expect(overview).toContain(copy);
    expect(overview).toContain("guide.openOrientation(invoker)");
    expect(overview).toContain("library.enter(false)");
    expect(overview).toContain("library.enter(true)");
    expect(presentation).not.toMatch(/selectCanonEvent|activateInvestigation|resumeInvestigation|GuestCaseIntake|OverviewInspector/);
  });

  it("owns one Operating Principle in the left panel before Guided Orientation", () => {
    expect(presentation.match(/className="overview-principles"/g)).toHaveLength(1);
    const orientation = presentation.slice(presentation.indexOf('className="overview-orientation"'), presentation.indexOf('className="overview-flow"'));
    expect(orientation).toContain('className="overview-principles"');
    expect(orientation.indexOf('className="overview-proposition"')).toBeLessThan(orientation.indexOf('className="overview-principles"'));
    expect(orientation.indexOf('className="overview-principles"')).toBeLessThan(orientation.indexOf('className="overview-guidance"'));
    const flow = presentation.slice(presentation.indexOf('className="overview-flow"'));
    expect(flow).not.toContain('className="overview-principles"');
    for (const principle of [
      "Deterministic mathematics exposes relationships.",
      "AI does not decide what the evidence means.",
      "The researcher governs interpretation and acceptance.",
      "Unknown remains unknown.",
    ]) expect(presentation).toContain(principle);
    expect(css).toMatch(/overview-principles ul\{[^}]*grid-template-columns:1fr 1fr/);
    expect(css).toMatch(/@media\(max-width:1100px\).*overview-principles ul\{grid-template-columns:1fr\}/s);
  });

  it("retains the guest invitation, both entry actions, and accepted top-bar instruments", () => {
    for (const copy of ["TRY iSEES AS A GUEST", "NO ACCOUNT REQUIRED", "EXPLORE THE NIMITZ INVESTIGATION", "BRING YOUR OWN CASE"]) expect(frontDoor).toContain(copy);
    expect(frontDoor).toContain('<OperationalTopBar status="ACTIVE" mode="OVERVIEW" manifold="ONLINE" guideEntryPoint="orientation"');
    expect(layout.indexOf("<IseesCaptureGlobalLink />")).toBeLessThan(layout.indexOf("<IseesGuideAffordance"));
  });

  it("explains but does not operate the research flow", () => {
    for (const stage of ["SELECT", "CONSTRUCT", "EXAMINE", "PRESERVE", "PRODUCE"]) expect(presentation).toContain(stage);
    expect(presentation).toContain("This is an iterative research cycle, not a required sequence; as governed inputs evolve, the Manifold is recomputed and may expose new research vectors.");
    expect(presentation.match(/className="overview-flow__info"/g)).toHaveLength(1);
    expect(presentation).toContain("RESEARCH_STAGES.map");
    expect(presentation).not.toMatch(/<li[^>]*(onClick|onKeyDown|role=|tabIndex)/);
    expect(presentation).toContain("AI does not decide what the evidence means");
    expect(presentation).toContain("Unknown remains unknown");
  });

  it("keeps tooltip layout bounded and motion optional", () => {
    expect(css).toContain(".overview-flow__info:focus-visible");
    expect(css).toMatch(/@media\(max-width:520px\)/);
    expect(css).toMatch(/@media\(prefers-reduced-motion:reduce\).*shared-tooltip__content\{transition:none\}/s);
  });

  it("adds a responsive 55/45 explanatory split without changing the outer two-panel shell", () => {
    expect(presentation).toContain('className="overview-flow__composition"');
    expect(css).toMatch(/overview-flow__composition\{[^}]*grid-template-columns:minmax\(0,55fr\) minmax\(260px,45fr\)/);
    expect(css).toMatch(/@media\(max-width:1200px\)\{\.overview-flow__composition\{grid-template-columns:1fr\}/);
    expect(css).toContain(".event-space__diagram{display:block;width:100%;height:auto;max-width:100%");
    expect(css).toMatch(/@media\(prefers-reduced-motion:reduce\).*animation:none!important;transition:none!important/s);
    expect(evolution).toContain('viewBox="0 0 420 690"');
    expect(evolution).not.toMatch(/width="420"|height="690"|InvestigationGraph|force-graph|three|fetch\(|pushState|replaceState/);
  });

  it("keeps the evolution diagram presentational and the governed production boundary explicit", () => {
    for (const copy of ["INITIAL PROJECTION", "RESEARCH EXPANSION", "GOVERNED RECOMPUTATION", "CANDIDATE EVIDENCE", "CANDIDATE", "KNOWLEDGE", "Noncanonical investigative directions", "production connection not currently available", "after accepted eligible input", "does not guarantee additional nodes"]) expect(evolution).toContain(copy);
    expect(evolution).toContain('data-boundary="acceptance-gate"');
    expect(evolution).toContain('focusable="false"');
    expect(evolution).not.toMatch(/<a\b|<button\b|tabIndex=|onClick=|onKeyDown=/);
    expect(presentation).not.toMatch(/<li[^>]*(onClick|onKeyDown|role=|tabIndex)/);
  });

  it("shares exactly one presentation between anonymous and operational Overview", () => {
    expect(overview).toContain("<OverviewPresentation");
    expect(frontDoor).toContain("<OverviewPresentation");
    expect(frontDoor).not.toMatch(/className="overview-(canvas|orientation|flow)"/);
    expect(presentation).not.toMatch(/continueAsGuest|operatorIdentityRuntime|useLibraryNavigation|useGuidePresentation|fetch\(|pushState|replaceState/);
  });

  it("places one public research challenge after the unchanged five-step sequence and reuses the governed preview callback", () => {
    for (const copy of [
      "WHAT DO YOU WANT TO KNOW?",
      "UAP events are strange. Are they also connected—and intentional?",
      "Explore the evidence, test relationships, and preserve how you reached your conclusions.",
      "Could seemingly separate events be connected?",
      "What does the evidence support—and what remains unknown?",
      "Could the pattern itself reveal intention?",
      "Don’t just ask the question. Build an investigation that can answer it.",
      "EXPLORE THE NIMITZ INVESTIGATION",
      "No account required · Nothing is saved",
    ]) expect(presentation).toContain(copy);
    expect(presentation.match(/className="overview-flow__sequence-column"/g)).toHaveLength(1);
    const sequenceColumn = presentation.match(/<div className="overview-flow__sequence-column">(<ol className="overview-flow__stages">[\s\S]*?<\/ol>[\s\S]*?<section className="overview-challenge"[\s\S]*?<\/section>})\s*<\/div><EventSpaceEvolution/)?.[1];
    expect(sequenceColumn).toBeDefined();
    expect(sequenceColumn!.indexOf('<ol className="overview-flow__stages">')).toBeLessThan(sequenceColumn!.indexOf('<section className="overview-challenge"'));
    expect(presentation.match(/className="overview-challenge"/g)).toHaveLength(1);
    expect(presentation.match(/id="overview-challenge-title"/g)).toHaveLength(1);
    expect(presentation).toMatch(/<\/div><EventSpaceEvolution emphasis=\{flowEmphasis\} \/><\/div>/);
    expect(frontDoor).toContain("onResearchChallengeAction={onExploreNimitz}");
    expect(frontDoor.match(/function exploreNimitzAsGuest/g)).toHaveLength(1);
    expect(presentation).not.toMatch(/activateInvestigation|selectCanonEvent|Manifold.*(?:add|mutate)|pushState|replaceState/);
    expect(css).toMatch(/@media\(max-width:520px\).*overview-challenge ul\{grid-template-columns:1fr\}/s);
    expect(css).toMatch(/overview-flow__sequence-column\{[^}]*width:100%/);
    expect(css).toMatch(/overview-challenge\{width:100%/);
  });

  it("suppresses global shell instruments only for Overview and Library", () => {
    expect(layout).toContain("const modeLocalFullWidth = overviewMode || libraryMode");
    expect((layout.match(/!modeLocalFullWidth/g) ?? []).length).toBeGreaterThanOrEqual(5);
    expect(surface).toContain('activeMode === WorkspaceMode.OVERVIEW ? " workspace-surface__projection--overview"');
    for (const mode of ["MANIFOLD", "COMPARE", "NARRATIVE", "EVIDENCE", "TIMELINE", "LAYERS", "INTENTION"]) expect(layout).not.toContain(`WorkspaceMode.${mode} || libraryMode`);
  });
});
