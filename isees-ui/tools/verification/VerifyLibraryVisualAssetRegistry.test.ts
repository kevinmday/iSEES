import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  LIBRARY_VISUAL_ASSET_CLASSES,
  resolveLibraryVisualAsset,
  resolveLibraryVisualAssets,
} from "../../src/investigation/library/LibraryVisualAssetRegistry.ts";

describe("P57-LIBRARY-I2A governed visual assets", () => {
  const root = resolve(import.meta.dirname, "../..");

  it("publishes the exhaustive authoritative class order", () => {
    expect(LIBRARY_VISUAL_ASSET_CLASSES).toEqual([
      "ARCHIVAL", "CONTEXTUAL", "DIAGRAMMATIC", "ILLUSTRATIVE", "INSTITUTIONAL", "UNAVAILABLE",
    ]);
  });

  it("resolves approved archival assets and the Rendlesham illustration with its diagrammatic fallback", () => {
    expect(existsSync(resolve(root, "src/assets/library/canon/rendlesham-forest-1980-illustrative.png"))).toBe(true);
    expect(existsSync(resolve(root, "src/assets/library/canon/rendlesham-forest-1980.svg"))).toBe(true);
    for (const id of ["E-TICTAC-2004", "E-ROOSEVELT-2015"]) {
      const asset = resolveLibraryVisualAsset(id);
      expect(asset.assetClass).toBe("ARCHIVAL");
      expect(asset.rightsReviewStatus).toBe("APPROVED");
      expect(asset.integrityReference).toMatch(/^sha256:/);
      expect(asset.deliveryReference).not.toMatch(/^https?:\/\//);
    }
    const [primary, fallback] = resolveLibraryVisualAssets("E-RENDLESHAM-1980");
    expect(primary).toMatchObject({ associatedRecordId: "E-RENDLESHAM-1980", assetClass: "ILLUSTRATIVE", title: "Rendlesham Forest historical reconstruction", creator: "iSEES / OpenAI image generation", captureOrPublicationDate: "2026-09-23", evidentiaryRole: "CONTEXTUAL", evidenceStatus: "NOT_EVENT_EVIDENCE", sourceType: "ORIGINAL_GENERATED_ASSET", localAsset: true, hotlinked: false, licenseOrUsageAuthority: "original commissioned/generated asset for iSEES", reconstructionOrGeneratedDisclosure: "AI-generated historical reconstruction. Not event evidence.", alternativeText: "Illustrative reconstruction of two anonymous security personnel approaching an unexplained light in a misty pine forest near an airfield." });
    expect(primary?.deliveryReference).toMatch(/rendlesham-forest-1980-illustrative\.png$/);
    expect(fallback).toMatchObject({ associatedRecordId: "E-RENDLESHAM-1980", assetClass: "DIAGRAMMATIC", creator: "iSEES" });
    expect(fallback?.source).toBe("src/assets/library/canon/rendlesham-forest-1980.svg");
    expect(fallback?.deliveryReference).toMatch(/^data:image\/svg\+xml/);
    expect(fallback?.rightsReviewStatus).toBe("RIGHTS_REVIEW_REQUIRED");
    expect(resolveLibraryVisualAsset("E-RENDLESHAM-1980")).toBe(primary);
    for (const id of ["E-TICTAC-2004", "E-ROOSEVELT-2015", "E-RENDLESHAM-1980"]) {
      expect(resolveLibraryVisualAsset(id).contextualVersusEvidentiaryStatus).toBe("CONTEXTUAL_PRESENTATION");
    }
  });

  it("keeps external and unknown records deterministically unavailable", () => {
    const first = resolveLibraryVisualAsset("missing:record");
    const second = resolveLibraryVisualAsset("missing:record");
    expect(first).toEqual(second);
    expect(Object.isFrozen(first)).toBe(true);
    for (const recordId of ["repository:SCU", "repository:AARO", "repository:MUFON", "repository:NUFORC", "repository:Zenodo", "repository:National Archives", "missing:record"]) {
      const asset = resolveLibraryVisualAsset(recordId);
      expect(asset.assetClass).toBe("UNAVAILABLE");
      expect(asset.availabilityState).toBe("UNAVAILABLE");
      expect(asset.deliveryReference).toBeNull();
      expect(asset.source).toBeNull();
      expect(asset.creator).toBeNull();
      expect(asset.licenseOrUsageAuthority).toBeNull();
      expect(asset.captureOrPublicationDate).toBeNull();
      expect(asset.contextualVersusEvidentiaryStatus).toBe("CONTEXTUAL_PRESENTATION");
    }
  });

  it("contains presentation metadata only and no evidence, Inbox, Canon mutation, or computation command", () => {
    const keys = Object.keys(resolveLibraryVisualAsset("E-ROOSEVELT-2015"));
    expect(keys).not.toContain("candidateEvidence");
    expect(keys).not.toContain("investigationEvidence");
    expect(keys).not.toContain("researchInbox");
    expect(keys).not.toContain("canonMutation");
    expect(keys).not.toContain("computation");
    expect(resolveLibraryVisualAsset("E-RENDLESHAM-1980")).toMatchObject({ evidenceStatus: "NOT_EVENT_EVIDENCE", localAsset: true, hotlinked: false });
  });
});
