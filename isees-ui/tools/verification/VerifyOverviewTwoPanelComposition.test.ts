import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const overview = source("../../src/workspace/surfaces/OverviewWorkspace.tsx");
const css = source("../../src/workspace/surfaces/OverviewWorkspace.css");
const evolution = source("../../src/workspace/surfaces/overview/EventSpaceEvolution.tsx");
const layout = source("../../src/layout/MainLayout.tsx");
const surface = source("../../src/surfaces/WorkspaceSurface.tsx");

describe("P57-OVERVIEW-I2 two-panel orientation workspace", () => {
  it("uses one mode-local orientation and research-flow composition", () => {
    expect(overview).toContain('className="overview-canvas"');
    expect(overview).toContain('className="overview-orientation"');
    expect(overview).toContain('className="overview-flow"');
    expect(css).toMatch(/grid-template-columns:minmax\(320px,2fr\) minmax\(480px,3fr\)/);
    expect(css).toMatch(/@media\(max-width:900px\).*grid-template-columns:1fr/s);
  });

  it("keeps orientation, Guide, briefing, and Library-owned entries on the left", () => {
    for (const copy of ["Integrated Systems Epistemology", "Investigate the record", "Start Guided Orientation", "System Briefing", "Enter Library", "Bring Your Own Case"]) expect(overview).toContain(copy);
    expect(overview).toContain("guide.openOrientation(event.currentTarget)");
    expect(overview).toContain("library.enter(false)");
    expect(overview).toContain("library.enter(true)");
    expect(overview).not.toMatch(/selectCanonEvent|activateInvestigation|resumeInvestigation|GuestCaseIntake|OverviewInspector/);
  });

  it("explains but does not operate the research flow", () => {
    for (const stage of ["SELECT", "CONSTRUCT", "EXAMINE", "PRESERVE", "PRODUCE"]) expect(overview).toContain(stage);
    expect(overview).toContain("This is an iterative research cycle, not a required sequence; as governed inputs evolve, the Manifold is recomputed and may expose new research vectors.");
    expect(overview.match(/className="overview-flow__info"/g)).toHaveLength(1);
    expect(overview).toContain("RESEARCH_STAGES.map");
    expect(overview).not.toMatch(/<li[^>]*(onClick|onKeyDown|role=|tabIndex)/);
    expect(overview).toContain("AI does not decide what the evidence means");
    expect(overview).toContain("Unknown remains unknown");
  });

  it("keeps tooltip layout bounded and motion optional", () => {
    expect(css).toContain(".overview-flow__info:focus-visible");
    expect(css).toMatch(/@media\(max-width:520px\)/);
    expect(css).toMatch(/@media\(prefers-reduced-motion:reduce\).*shared-tooltip__content\{transition:none\}/s);
  });

  it("adds a responsive 55/45 explanatory split without changing the outer two-panel shell", () => {
    expect(overview).toContain('className="overview-flow__composition"');
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
    expect(overview).not.toMatch(/<li[^>]*(onClick|onKeyDown|role=|tabIndex)/);
  });

  it("suppresses global shell instruments only for Overview and Library", () => {
    expect(layout).toContain("const modeLocalFullWidth = overviewMode || libraryMode");
    expect((layout.match(/!modeLocalFullWidth/g) ?? []).length).toBeGreaterThanOrEqual(5);
    expect(surface).toContain('activeMode === WorkspaceMode.OVERVIEW ? " workspace-surface__projection--overview"');
    for (const mode of ["MANIFOLD", "COMPARE", "NARRATIVE", "EVIDENCE", "TIMELINE", "LAYERS", "INTENTION"]) expect(layout).not.toContain(`WorkspaceMode.${mode} || libraryMode`);
  });
});
