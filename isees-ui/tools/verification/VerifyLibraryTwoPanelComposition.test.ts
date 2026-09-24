import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const source = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("P57-LIBRARY-I2E two-panel Library command and collection workspace", () => {
  const workspace = source("src/workspace/surfaces/LibraryWorkspace.tsx");
  const css = source("src/workspace/surfaces/LibraryWorkspace.css");
  const layout = source("src/layout/MainLayout.tsx");
  const surface = source("src/surfaces/WorkspaceSurface.tsx");

  it("composes command and collection as Library-local regions", () => {
    expect(workspace).toContain("library-workspace__canvas");
    expect(workspace).toContain("library-workspace__command");
    expect(workspace).toContain("library-workspace__collection");
    expect(css).toContain("grid-template-columns:minmax(300px,34fr) minmax(600px,66fr)");
    expect(layout).toContain("const modeLocalFullWidth = overviewMode || libraryMode");
    expect(layout).toContain("!studioMode && !modeLocalFullWidth");
    expect(surface).toContain("workspace-surface__projection--library");
    expect(workspace).not.toMatch(/Navigator|Selection Intelligence|Research Inbox dock/);
  });

  it("keeps status, intake, resume, search, and authority filters in command", () => {
    const command = workspace.slice(workspace.indexOf('className="library-workspace__command"'), workspace.indexOf('className="library-workspace__collection"'));
    for (const value of ["Current investigation", "Start or Bring a New Case", "Resume Current Investigation", "library-search", "SYSTEM CANON", "EXTERNAL"]) expect(command).toContain(value);
    expect(workspace).toContain("GuestCaseIntake");
  });

  it("keeps Canon, preview, and compact external records in collection", () => {
    const collection = workspace.slice(workspace.indexOf('className="library-workspace__collection"'));
    expect(collection).toContain("library-workspace__canon-cards");
    expect(collection).toContain("Selected record preview");
    expect(collection).toContain("EXTERNAL RESEARCH");
    expect(collection).toContain("ExternalResearchTile");
    expect(css).toContain("grid-template-columns:repeat(3,minmax(0,1fr))");
  });

  it("preserves preview-only selection and explicit activation", () => {
    expect(workspace).toContain("useOverviewSelection");
    expect(workspace).toContain("overview.selectCanonEvent(item)");
    expect(workspace).not.toContain("overview.selectRepository(item)");
    expect(workspace).toContain("overview.clearSelection");
    expect(workspace).toContain("scrollTo({ top: 0 })");
    expect(workspace).toMatch(/Selection alone never activates/i);
    expect(workspace).not.toMatch(/new WorkspaceRuntime|new OverviewSelection|executeResolve|canonMutation|candidateEvidence/);
  });

  it("uses governed local visuals and exposes provenance without runtime hotlinks", () => {
    expect(workspace).toContain("resolveLibraryVisualAsset");
    expect(workspace).toContain("resolveLibraryVisualAssets");
    expect(workspace).toContain("Source institution");
    expect(workspace).toContain("Reuse basis");
    expect(workspace).toContain("Integrity");
    expect(workspace).toContain("not admitted Investigation Evidence");
    expect(workspace).not.toMatch(/https?:\/\//);
    expect(workspace).not.toMatch(/mockup|generated design|conversation screenshot/i);
  });

  it("stacks without overflow and preserves bottom-bar clearance", () => {
    expect(css).toContain("min-width:0");
    expect(css).toMatch(/@media\(max-width:900px\).*library-workspace__canvas\{grid-template-columns:minmax\(0,1fr\)\}/);
    expect(css).toContain("margin-bottom:calc(var(--modebar-height) + 12px)");
    expect(css).not.toMatch(/overflow-x:\s*(scroll|auto)/);
  });
});
