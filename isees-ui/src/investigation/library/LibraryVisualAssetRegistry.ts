import archivalManifest from "../../assets/library/archival/LibraryArchivalAssetManifest.json";
import nimitzFlirFrame from "../../assets/library/archival/derivatives/nimitz-flir1-frame-00-00-30.000.png";
import rooseveltGimbalFrame from "../../assets/library/archival/derivatives/roosevelt-gimbal-frame-00-00-20.000.png";
import nimitzTicTacVisual from "../../assets/library/canon/nimitz-tic-tac-2004.svg";
import rendleshamForestVisual from "../../assets/library/canon/rendlesham-forest-1980.svg";
import rendleshamForestIllustrativeVisual from "../../assets/library/canon/rendlesham-forest-1980-illustrative.png";
import rooseveltTrainingRangeVisual from "../../assets/library/canon/roosevelt-training-range-2015.svg";

export const LIBRARY_VISUAL_ASSET_CLASSES = Object.freeze(["ARCHIVAL", "CONTEXTUAL", "DIAGRAMMATIC", "ILLUSTRATIVE", "INSTITUTIONAL", "UNAVAILABLE"] as const);
export type LibraryVisualAssetClass = typeof LIBRARY_VISUAL_ASSET_CLASSES[number];
export type LibraryVisualAssetAvailability = "AVAILABLE" | "UNAVAILABLE";
export type LibraryVisualAssetEpistemicStatus = "CONTEXTUAL_PRESENTATION" | "INDEPENDENTLY_GOVERNED_EVIDENCE";
export type LibraryVisualRightsReviewStatus = "APPROVED" | "RIGHTS_REVIEW_REQUIRED" | "NOT_APPLICABLE";
export type LibraryVisualEvidenceStatus = "NOT_EVENT_EVIDENCE";
export type LibraryVisualSourceType = "ARCHIVAL_SOURCE" | "ORIGINAL_GENERATED_ASSET" | "ORIGINAL_DIAGRAMMATIC_ASSET" | "UNAVAILABLE";

export interface LibraryVisualAsset {
  readonly assetId: string; readonly associatedRecordId: string; readonly assetClass: LibraryVisualAssetClass;
  readonly title: string | null; readonly caption: string | null; readonly source: string | null;
  readonly creator: string | null; readonly licenseOrUsageAuthority: string | null; readonly captureOrPublicationDate: string | null;
  readonly alternativeText: string; readonly integrityReference: string | null; readonly contentHash: string | null;
  readonly sourceHash: string | null; readonly sourcePageUrl: string | null; readonly sourceRecordIdentifier: string | null;
  readonly rightsStatementUrl: string | null; readonly attribution: string | null; readonly derivation: string | null;
  readonly contextualVersusEvidentiaryStatus: LibraryVisualAssetEpistemicStatus;
  readonly evidentiaryRole: "CONTEXTUAL"; readonly evidenceStatus: LibraryVisualEvidenceStatus; readonly sourceType: LibraryVisualSourceType;
  readonly localAsset: boolean; readonly hotlinked: false;
  readonly reconstructionOrGeneratedDisclosure: string | null; readonly deliveryReference: string | null;
  readonly availabilityState: LibraryVisualAssetAvailability; readonly rightsReviewStatus: LibraryVisualRightsReviewStatus;
  readonly rightsReviewNote: string | null;
}

interface ApprovedArchivalManifestEntry {
  readonly assetId: string; readonly recordId: string; readonly title: string; readonly sourceAuthority: string;
  readonly sourcePageUrl: string; readonly sourceRecordIdentifier: string; readonly acquiredAtUtc: string;
  readonly rightsBasis: string; readonly rightsStatementUrl: string; readonly attribution: string;
  readonly sourceSha256: string; readonly derivativeSha256: string; readonly localDeliveryReference: string;
  readonly alternativeText: string; readonly caption: string; readonly disclosure: string;
  readonly derivation: { readonly commandDescription: string };
}

const HEX_SHA256 = /^[0-9a-f]{64}$/;
const HTTPS_URL = /^https:\/\//;
function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function validateApprovedArchivalManifestEntry(value: unknown): ApprovedArchivalManifestEntry | null {
  const entry = record(value); const derivation = record(entry?.derivation);
  if (entry === null || derivation === null || entry.schemaVersion !== "1.0.0" || entry.assetClass !== "ARCHIVAL"
    || entry.rightsReviewStatus !== "APPROVED" || entry.redistributionPermitted !== true || entry.derivativePermitted !== true
    || entry.commercialReusePermitted !== true || entry.contextual !== true || entry.evidentiary !== false
    || entry.thirdPartyMaterialStatus !== "NO_THIRD_PARTY_MATERIAL_IDENTIFIED") return null;
  for (const key of ["assetId", "recordId", "title", "sourceAuthority", "sourceRecordIdentifier", "acquiredAtUtc", "rightsBasis", "attribution", "localDeliveryReference", "alternativeText", "caption", "disclosure"] as const) {
    if (typeof entry[key] !== "string" || entry[key].trim().length === 0) return null;
  }
  for (const key of ["sourcePageUrl", "rightsStatementUrl"] as const) if (typeof entry[key] !== "string" || !HTTPS_URL.test(entry[key])) return null;
  if (typeof entry.sourceSha256 !== "string" || !HEX_SHA256.test(entry.sourceSha256)
    || typeof entry.derivativeSha256 !== "string" || !HEX_SHA256.test(entry.derivativeSha256)
    || typeof entry.localDeliveryReference !== "string" || HTTPS_URL.test(entry.localDeliveryReference)
    || typeof derivation.commandDescription !== "string" || derivation.commandDescription.length === 0) return null;
  return entry as unknown as ApprovedArchivalManifestEntry;
}

function unavailable(recordId: string): LibraryVisualAsset {
  return Object.freeze({ assetId: `library-visual:unavailable:${recordId}`, associatedRecordId: recordId, assetClass: "UNAVAILABLE", title: null, caption: null,
    source: null, creator: null, licenseOrUsageAuthority: null, captureOrPublicationDate: null, alternativeText: "No governed visual asset is available for this Library record.",
    integrityReference: null, contentHash: null, sourceHash: null, sourcePageUrl: null, sourceRecordIdentifier: null, rightsStatementUrl: null, attribution: null, derivation: null,
    contextualVersusEvidentiaryStatus: "CONTEXTUAL_PRESENTATION", evidentiaryRole: "CONTEXTUAL", evidenceStatus: "NOT_EVENT_EVIDENCE", sourceType: "UNAVAILABLE", localAsset: false, hotlinked: false,
    reconstructionOrGeneratedDisclosure: null, deliveryReference: null, availabilityState: "UNAVAILABLE",
    rightsReviewStatus: "NOT_APPLICABLE", rightsReviewNote: null });
}

function diagrammatic(recordId: string, recordTitle: string, title: string, source: string, alternativeText: string, deliveryReference: string,
  rightsReviewStatus: LibraryVisualRightsReviewStatus = "NOT_APPLICABLE", rightsReviewNote: string | null = null): LibraryVisualAsset {
  return Object.freeze({ assetId: `library-visual:diagrammatic:${recordId}:v1`, associatedRecordId: recordId, assetClass: "DIAGRAMMATIC", title,
    caption: `Non-evidentiary diagrammatic representation of the ${recordTitle} record.`, source, creator: "iSEES", licenseOrUsageAuthority: "Repository-owned original",
    captureOrPublicationDate: null, alternativeText, integrityReference: null, contentHash: null, sourceHash: null, sourcePageUrl: null, sourceRecordIdentifier: null,
    rightsStatementUrl: null, attribution: "iSEES", derivation: null, contextualVersusEvidentiaryStatus: "CONTEXTUAL_PRESENTATION", evidentiaryRole: "CONTEXTUAL",
    evidenceStatus: "NOT_EVENT_EVIDENCE", sourceType: "ORIGINAL_DIAGRAMMATIC_ASSET", localAsset: true, hotlinked: false,
    reconstructionOrGeneratedDisclosure: "Original diagrammatic reconstruction for contextual orientation only; not eyewitness imagery, sensor evidence, or an assertion of historical reconstruction accuracy.",
    deliveryReference, availabilityState: "AVAILABLE", rightsReviewStatus, rightsReviewNote });
}

function archival(value: unknown, deliveryReference: string): LibraryVisualAsset | null {
  const entry = validateApprovedArchivalManifestEntry(value); if (entry === null) return null;
  return Object.freeze({ assetId: entry.assetId, associatedRecordId: entry.recordId, assetClass: "ARCHIVAL", title: entry.title, caption: entry.caption,
    source: entry.sourcePageUrl, creator: entry.sourceAuthority, licenseOrUsageAuthority: entry.rightsBasis, captureOrPublicationDate: entry.acquiredAtUtc,
    alternativeText: entry.alternativeText, integrityReference: `sha256:${entry.derivativeSha256}`, contentHash: entry.derivativeSha256, sourceHash: entry.sourceSha256,
    sourcePageUrl: entry.sourcePageUrl, sourceRecordIdentifier: entry.sourceRecordIdentifier, rightsStatementUrl: entry.rightsStatementUrl, attribution: entry.attribution,
    derivation: entry.derivation.commandDescription, contextualVersusEvidentiaryStatus: "CONTEXTUAL_PRESENTATION", evidentiaryRole: "CONTEXTUAL",
    evidenceStatus: "NOT_EVENT_EVIDENCE", sourceType: "ARCHIVAL_SOURCE", localAsset: true, hotlinked: false, reconstructionOrGeneratedDisclosure: entry.disclosure,
    deliveryReference, availabilityState: "AVAILABLE", rightsReviewStatus: "APPROVED", rightsReviewNote: null });
}

function illustrative(recordId: string, deliveryReference: string): LibraryVisualAsset {
  return Object.freeze({
    assetId: `library-visual:illustrative:${recordId}:v1`, associatedRecordId: recordId, assetClass: "ILLUSTRATIVE",
    title: "Rendlesham Forest historical reconstruction",
    caption: "Illustrative historical reconstruction for contextual orientation; depicted people, light, positions, weather, forest arrangement, and airfield details are not authenticated.",
    source: "src/assets/library/canon/rendlesham-forest-1980-illustrative.png", creator: "iSEES / OpenAI image generation",
    licenseOrUsageAuthority: "original commissioned/generated asset for iSEES", captureOrPublicationDate: "2026-09-23",
    alternativeText: "Illustrative reconstruction of two anonymous security personnel approaching an unexplained light in a misty pine forest near an airfield.",
    integrityReference: "sha256:bc8aba95d958a18abbba89e004427574a16a8386aeaeb938a1b04773e0a4f955",
    contentHash: "bc8aba95d958a18abbba89e004427574a16a8386aeaeb938a1b04773e0a4f955", sourceHash: null, sourcePageUrl: null,
    sourceRecordIdentifier: recordId, rightsStatementUrl: null, attribution: "iSEES / OpenAI image generation", derivation: "Original AI-generated historical reconstruction commissioned for iSEES.",
    contextualVersusEvidentiaryStatus: "CONTEXTUAL_PRESENTATION", evidentiaryRole: "CONTEXTUAL", evidenceStatus: "NOT_EVENT_EVIDENCE",
    sourceType: "ORIGINAL_GENERATED_ASSET", localAsset: true, hotlinked: false,
    reconstructionOrGeneratedDisclosure: "AI-generated historical reconstruction. Not event evidence.", deliveryReference,
    availabilityState: "AVAILABLE", rightsReviewStatus: "APPROVED", rightsReviewNote: null,
  });
}

const DIAGRAMS: ReadonlyMap<string, LibraryVisualAsset> = new Map([
  ["E-TICTAC-2004", diagrammatic("E-TICTAC-2004", "Nimitz Tic Tac Encounter", "Pacific naval tracking field", "src/assets/library/canon/nimitz-tic-tac-2004.svg", "Diagrammatic Pacific naval field with carrier-group geometry and an anomalous track marker for the Nimitz Tic Tac Encounter.", nimitzTicTacVisual)],
  ["E-ROOSEVELT-2015", diagrammatic("E-ROOSEVELT-2015", "Roosevelt Training Range Encounters", "Atlantic training-area track study", "src/assets/library/canon/roosevelt-training-range-2015.svg", "Diagrammatic Atlantic training-area sensor grid with intersecting tracks for the Roosevelt Training Range Encounters.", rooseveltTrainingRangeVisual)],
  ["E-RENDLESHAM-1980", diagrammatic("E-RENDLESHAM-1980", "Rendlesham Forest Incident", "Forest observation field", "src/assets/library/canon/rendlesham-forest-1980.svg", "Diagrammatic forest and topographic observation geometry with a positional marker for the Rendlesham Forest Incident.", rendleshamForestVisual, "RIGHTS_REVIEW_REQUIRED", "The National Archives document image is not delivered because image-reproduction and crop permission remain unresolved; catalogue reference DEFE 24/1948/1.")],
]);
const ILLUSTRATIONS: ReadonlyMap<string, LibraryVisualAsset> = new Map([
  ["E-RENDLESHAM-1980", illustrative("E-RENDLESHAM-1980", rendleshamForestIllustrativeVisual)],
]);

const rawAssets: unknown[] = Array.isArray(archivalManifest.assets) ? archivalManifest.assets : [];
const deliveryByRecord = new Map<string, string>([["E-TICTAC-2004", nimitzFlirFrame], ["E-ROOSEVELT-2015", rooseveltGimbalFrame]]);
const ARCHIVAL = new Map<string, LibraryVisualAsset>();
for (const raw of rawAssets) {
  const candidate = record(raw); const recordId = typeof candidate?.recordId === "string" ? candidate.recordId : null;
  const delivery = recordId === null ? undefined : deliveryByRecord.get(recordId); const asset = delivery === undefined ? null : archival(raw, delivery);
  if (asset !== null && !ARCHIVAL.has(asset.associatedRecordId)) ARCHIVAL.set(asset.associatedRecordId, asset);
}

function isRenderableRegistration(asset: LibraryVisualAsset, recordId: string): boolean {
  return asset.associatedRecordId === recordId && (asset.assetClass === "ARCHIVAL" || asset.assetClass === "DIAGRAMMATIC" || asset.assetClass === "ILLUSTRATIVE") && asset.availabilityState === "AVAILABLE"
    && asset.contextualVersusEvidentiaryStatus === "CONTEXTUAL_PRESENTATION" && asset.deliveryReference !== null && asset.deliveryReference.length > 0
    && !/^https?:\/\//i.test(asset.deliveryReference) && asset.alternativeText.trim().length > 0 && asset.reconstructionOrGeneratedDisclosure !== null;
}

export function resolveLibraryVisualAssets(recordId: string): readonly LibraryVisualAsset[] {
  return Object.freeze([ARCHIVAL.get(recordId), ILLUSTRATIONS.get(recordId), DIAGRAMS.get(recordId)].filter((asset): asset is LibraryVisualAsset => asset !== undefined && isRenderableRegistration(asset, recordId)));
}
export function resolveLibraryVisualAsset(recordId: string): LibraryVisualAsset { return resolveLibraryVisualAssets(recordId)[0] ?? unavailable(recordId); }
