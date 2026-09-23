import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const overview = source("../../src/workspace/surfaces/OverviewWorkspace.tsx");
const css = source("../../src/workspace/surfaces/OverviewWorkspace.css");
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
    expect(overview).toContain("not an automatic sequence");
    expect(overview).toContain("AI does not decide what the evidence means");
    expect(overview).toContain("Unknown remains unknown");
  });

  it("suppresses global shell instruments only for Overview and Library", () => {
    expect(layout).toContain("const modeLocalFullWidth = overviewMode || libraryMode");
    expect((layout.match(/!modeLocalFullWidth/g) ?? []).length).toBeGreaterThanOrEqual(5);
    expect(surface).toContain('activeMode === WorkspaceMode.OVERVIEW ? " workspace-surface__projection--overview"');
    for (const mode of ["MANIFOLD", "COMPARE", "NARRATIVE", "EVIDENCE", "TIMELINE", "LAYERS", "INTENTION"]) expect(layout).not.toContain(`WorkspaceMode.${mode} || libraryMode`);
  });
});
