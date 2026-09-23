import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { WorkspaceMode } from "../../src/workspace/runtime/WorkspaceRuntimeTypes.ts";
import { OPERATIONAL_GUIDE_CONTENT } from "../../src/guide/registry/OperationalGuideDefinitions.ts";

const root = resolve(import.meta.dirname, "../..");
const source = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("P57-LIBRARY-I1A foundation retained through I1B migration", () => {
  it("routes Library through both established workspace projections", () => {
    expect(source("src/surfaces/WorkspaceSurface.tsx")).toMatch(/case WorkspaceMode\.LIBRARY:[\s\S]*?<LibraryWorkspace \/>/);
    expect(source("src/workspace/runtime/WorkspaceProjection.tsx")).toMatch(/case WorkspaceMode\.LIBRARY:[\s\S]*?<LibraryWorkspace \/>/);
    expect(source("src/layout/MainLayout.tsx")).toContain("libraryMode");
  });

  it("composes migrated operational owners without creating replacements", () => {
    const library = source("src/workspace/surfaces/LibraryWorkspace.tsx");
    expect(library).toContain("Investigation Library");
    expect(library).toContain("useOverviewSelection");
    expect(library).toContain("OverviewInspector");
    expect(library).toContain("GuestCaseIntake");
    expect(library).toMatch(/Selection alone never activates/i);
    expect(library).toContain("MANIFOLD");
    expect(library).not.toMatch(/new WorkspaceRuntime|executeResolve|ResolveRuntime|<video|<audio|<img|<svg/i);
  });

  it("provides distinct, bounded and actionable Library guidance", () => {
    const guide = OPERATIONAL_GUIDE_CONTENT[WorkspaceMode.LIBRARY];
    expect(guide.purpose).toMatch(/Choose, preview, create, or resume/);
    expect(guide.startHere).toMatch(/preview-only/);
    expect(guide.steps.join(" ")).toMatch(/preview.*explicitly open or resume.*MANIFOLD/i);
    expect(guide.boundary).toMatch(/protected Canon.*Resolve.*compute relationships/);
    expect(guide.authenticationNote).toMatch(/browser-session.*existing account.*persistence/);
  });

  it("moves shared operational providers to Overview and Library while keeping one owner", () => {
    const app = source("src/App.tsx");
    expect(app).toMatch(/mode === WorkspaceMode\.OVERVIEW \|\| mode === WorkspaceMode\.LIBRARY[\s\S]*?<InvestigationLibraryRuntimeProvider>[\s\S]*?<OverviewSelectionProvider>[\s\S]*?<OverviewCanonicalActivationProvider>/);
    expect((app.match(/<InvestigationLibraryRuntimeProvider>/g) ?? [])).toHaveLength(1);
  });
});
