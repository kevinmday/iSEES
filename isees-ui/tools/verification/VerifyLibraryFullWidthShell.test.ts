import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const source = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("P57-LIBRARY-I2B full-width shell", () => {
  it("isolates the global-panel exception to the mode-local Overview and Library shells and omits the Library Research Inbox", () => {
    const layout = source("src/layout/MainLayout.tsx");
    const surface = source("src/surfaces/WorkspaceSurface.tsx");
    expect(layout).toContain("const modeLocalFullWidth = overviewMode || libraryMode");
    expect(layout).toContain("!studioMode && !modeLocalFullWidth");
    expect(layout).toContain("padding: modeLocalFullWidth ? 0");
    const inboxVisibility = surface.slice(surface.indexOf("const researchInboxVisible"), surface.indexOf("return (", surface.indexOf("const researchInboxVisible")));
    expect(inboxVisibility).not.toContain("WorkspaceMode.LIBRARY");
    for (const mode of ["MANIFOLD", "COMPARE", "NARRATIVE", "LAYERS", "EVIDENCE", "INTENTION"]) expect(surface).toMatch(new RegExp(`researchInboxVisible[\\s\\S]*WorkspaceMode\\.${mode}`));
  });

  it("uses one mode-local two-panel canvas with a contained preview", () => {
    const workspace = source("src/workspace/surfaces/LibraryWorkspace.tsx");
    const css = source("src/workspace/surfaces/LibraryWorkspace.css");
    expect(workspace).toContain("library-workspace__canvas");
    expect(workspace).toContain("library-workspace__command");
    expect(workspace).toContain("library-workspace__collection");
    expect(workspace).toContain('aria-label="Selected record preview"');
    expect(css).toContain("grid-template-columns:minmax(300px,34fr) minmax(600px,66fr)");
    expect(css).toMatch(/@media\(max-width:900px\).*library-workspace__canvas\{grid-template-columns:minmax\(0,1fr\)\}/);
  });

  it("keeps active and preview identity distinct and removes focused-event semantics from Library", () => {
    const header = source("src/components/workspace/WorkspaceIdentityHeader.tsx");
    expect(header).toContain("No Active Investigation");
    expect(header).toContain("Session-Local Investigation");
    expect(header).toContain("Active Investigation");
    expect(header).toContain("Previewing");
    const libraryBranch = header.slice(header.indexOf("function LibraryWorkspaceIdentity"));
    expect(libraryBranch).not.toMatch(/Focused EVENT/i);
    expect(libraryBranch).toContain("investigation?.name");
    expect(libraryBranch).toContain("selection.kind");
  });

  it("preserves compact unavailable boundaries alongside governed local images", () => {
    const workspace = source("src/workspace/surfaces/LibraryWorkspace.tsx");
    const css = source("src/workspace/surfaces/LibraryWorkspace.css");
    expect(workspace).toContain("resolveLibraryVisualAsset");
    expect(workspace).toContain("asset.deliveryReference");
    expect(workspace).toContain("library-workspace__media-boundary--unavailable");
    expect(workspace).not.toMatch(/https?:\/\//);
    expect(css).toContain("object-fit:contain");
    expect(css).toContain("library-workspace__media-boundary--unavailable");
  });
});
