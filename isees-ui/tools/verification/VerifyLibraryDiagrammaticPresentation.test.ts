import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const source = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("P57-LIBRARY-I2C diagrammatic card and preview presentation", () => {
  it("renders card and preview visuals only through the registry resolver", () => {
    const workspace = source("src/workspace/surfaces/LibraryWorkspace.tsx");
    expect(workspace).toContain("resolveLibraryVisualAsset(recordId)");
    expect(workspace).toContain("<LibraryVisualBoundary recordId={item.eventId}");
    expect(workspace).toContain("Math.min(index + 1, assets.length - 1)");
    expect(workspace).toContain("<LibraryVisualPreview recordId={overview.selection.eventId}");
    expect(workspace).not.toMatch(/E-TICTAC-2004|E-ROOSEVELT-2015|E-RENDLESHAM-1980/);
    expect(workspace).not.toMatch(/https?:\/\//);
  });

  it("keeps artwork inside the selectable card and preserves explicit opening actions", () => {
    const workspace = source("src/workspace/surfaces/LibraryWorkspace.tsx");
    const inspector = source("src/workspace/surfaces/overview/OverviewInspector.tsx");
    expect(workspace).toMatch(/<button className="library-workspace__canon-card" key=\{item\.eventId\}[\s\S]*?<LibraryVisualBoundary[\s\S]*?<\/button>/);
    expect(workspace).not.toMatch(/<a[^>]*library-workspace__media-boundary/);
    expect(inspector).toContain("Open Event in Workspace");
    expect(inspector).toContain("Preview only. Importing or opening requires a separate explicit action.");
  });

  it("exposes accessibility, classification, provenance, disclosure, and responsive behavior", () => {
    const workspace = source("src/workspace/surfaces/LibraryWorkspace.tsx");
    const css = source("src/workspace/surfaces/LibraryWorkspace.css");
    expect(workspace).toContain("alt={asset.alternativeText}");
    expect(workspace).toContain("asset.assetClass} · {asset.evidentiaryRole}");
    expect(workspace).toContain("not admitted Investigation Evidence");
    expect(workspace).toContain("asset.reconstructionOrGeneratedDisclosure");
    expect(workspace).toContain("asset.evidentiaryRole");
    expect(workspace).toContain('<Metadata label="Evidence status" value={asset.evidenceStatus}');
    expect(workspace).toContain('<Metadata label="Source type" value={asset.sourceType}');
    expect(workspace).toContain("asset.sourcePageUrl");
    expect(css).toContain("button:focus-visible");
    expect(css).toMatch(/@media\(max-width:900px\).*library-workspace__canvas\{grid-template-columns:minmax\(0,1fr\)\}/);
  });
});
