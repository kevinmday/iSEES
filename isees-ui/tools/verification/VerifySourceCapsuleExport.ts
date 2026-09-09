import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { exportSourceCapsule, SourceCapsuleExportError } from "../../src/intake/capture/SourceCapsuleExport.ts";
import type { SourceCapsuleExportRequest } from "../../src/intake/capture/SourceCapsuleExportTypes.ts";
import { capsuleHashBasis, canonicalizeSourceCapsuleJson } from "../../src/intake/capture/SourceCapsuleCanonicalization.ts";
import { validateSourceCapsuleV1 } from "../../src/intake/capture/SourceCapsuleValidation.ts";

const request = (): SourceCapsuleExportRequest => ({
  confirmed: true,
  capsuleId: "capsule:explicit:2026-09-09",
  capturedAt: "2026-09-09T20:00:00.000Z",
  source: { identity: "source:example:article", requestedUrl: "https://example.test/start", redirectChain: ["https://example.test/start"], finalUrl: "https://example.test/article", pageTitle: "A report", publisher: "Example", authorByline: "A. Researcher", publishedAt: "2026-09-08T10:00:00.000Z", modifiedAt: "2026-09-09T10:00:00.000Z", language: "en", revisionIdentity: "revision:1" },
  rightsClassification: "QUOTATION_PERMITTED",
  privacyClassification: "PUBLIC",
  passages: [{ passageId: "passage:1", exactText: "Line one.\r\nLine two.\nLine three.", originalHtml: "<p>Line one.<br>Line two.<br>Line three.</p>", htmlSanitization: "ISEES_CAPTURE_ALLOWLIST_V1", governingHeading: "Findings", prefixContext: "Before.", suffixContext: "After.", documentPosition: { kind: "TEXT_OFFSETS", startOffset: 10, endOffset: 43 }, selection: { selectionId: "selection:1", direction: "FORWARD" } }],
  researcherNotes: [{ noteId: "note:1", researcherId: "researcher:1", createdAt: "2026-09-09T20:01:00.000Z", text: "Verify independently.", derivedFromPassageIds: ["passage:1"] }],
  filenameStem: "explicit-capture",
});

async function rejects(candidate: unknown, code: string, validationCode?: string): Promise<void> {
  await assert.rejects(() => exportSourceCapsule(candidate), error => error instanceof SourceCapsuleExportError && error.code === code && (!validationCode || error.validationCode === validationCode));
}

const original = request();
const snapshot = structuredClone(original);
const single = await exportSourceCapsule(original);
assert.deepEqual(original, snapshot, "caller input is not mutated");
assert.equal(single.capsule.passages[0]!.exactText, "Line one.\r\nLine two.\nLine three.", "mixed line endings remain exact");
assert.equal(single.capsule.researcherNotes[0]!.text, "Verify independently.", "notes remain separate");
assert.equal("researcherNotes" in single.capsule.passages[0]!, false);
assert.equal(single.filename, "explicit-capture.isees-source.json");
assert.ok(single.filename.length <= 140 && !/[\\/:*?\"<>|\u0000-\u001f]/.test(single.filename), "filename is safe and bounded");
assert.equal(single.mediaType, "application/json", "generic JSON is used because v1 defines no specific media type");
assert.equal(single.byteLength, single.utf8Bytes().byteLength);
assert.equal(new TextDecoder().decode(single.utf8Bytes()), single.canonicalJson);
const reparsed = JSON.parse(single.canonicalJson);
const validatedReparse = await validateSourceCapsuleV1(reparsed);
assert.deepEqual(validatedReparse, reparsed, "output reparses and validates");
const basisHash = `sha256:${createHash("sha256").update(canonicalizeSourceCapsuleJson(capsuleHashBasis(validatedReparse))).digest("hex")}`;
assert.equal(basisHash, single.capsuleHash, "output hash equals capsule hash");

const multipleRequest = request();
multipleRequest.passages.push({ passageId: "passage:2", exactText: "A second exact passage." });
const multiple = await exportSourceCapsule(multipleRequest);
assert.equal(multiple.capsule.passages.length, 2, "multiple passages export");

const minimalRequest = request();
minimalRequest.source = { identity: "source:minimal", finalUrl: "https://example.test/" };
minimalRequest.researcherNotes = [];
delete minimalRequest.filenameStem;
const minimal = await exportSourceCapsule(minimalRequest);
assert.deepEqual(Object.keys(minimal.capsule.source), ["identity", "finalUrl"], "unknown optional metadata stays absent");
assert.match(minimal.filename, /^source-capsule-[0-9a-f]{24}\.isees-source\.json$/, "missing stem uses hash fallback");

const repeat = await exportSourceCapsule(structuredClone(original));
assert.equal(repeat.canonicalJson, single.canonicalJson);
assert.deepEqual(repeat.utf8Bytes(), single.utf8Bytes());
assert.equal(repeat.filename, single.filename, "same request is byte- and filename-deterministic");
const reordered = Object.fromEntries(Object.entries(structuredClone(original)).reverse());
const reorderedArtifact = await exportSourceCapsule(reordered);
assert.equal(reorderedArtifact.canonicalJson, single.canonicalJson, "input property insertion order is irrelevant");

assert.ok(Object.isFrozen(single) && Object.isFrozen(single.capsule) && Object.isFrozen(single.capsule.source) && Object.isFrozen(single.capsule.passages));
assert.throws(() => { (single.capsule.source as { identity: string }).identity = "changed"; }, TypeError, "capsule is deeply immutable");
const exposed = single.utf8Bytes(); exposed.fill(0);
assert.equal(new TextDecoder().decode(single.utf8Bytes()), single.canonicalJson, "byte access is defensive");

await rejects({ ...request(), confirmed: false }, "CAPTURE_NOT_CONFIRMED");
const noConfirmation = structuredClone(request()) as unknown as Record<string, unknown>; delete noConfirmation.confirmed;
await rejects(noConfirmation, "CAPTURE_NOT_CONFIRMED");
await rejects({ ...request(), capsuleId: "" }, "SOURCE_CAPSULE_VALIDATION_FAILED", "INVALID_TEXT");
await rejects({ ...request(), extra: true }, "MALFORMED_EXPORT_REQUEST");
await rejects({ ...request(), cookie: "secret" }, "FORBIDDEN_MATERIAL");
await rejects({ ...request(), researchAnchor: { id: "authority" } }, "FORBIDDEN_MATERIAL");
await rejects({ ...request(), filenameStem: "../secret" }, "UNSAFE_FILENAME");
await rejects({ ...request(), filenameStem: "CON" }, "UNSAFE_FILENAME");
const injectedHash = structuredClone(request()) as unknown as Record<string, unknown>;
(injectedHash.passages as Record<string, unknown>[])[0]!.passageHash = `sha256:${"0".repeat(64)}`;
await rejects(injectedHash, "MALFORMED_EXPORT_REQUEST");
for (const key of ["researchAnchor", "candidateEvidence", "candidateKnowledge", "systemCanon", "canonicalAuthority"]) assert.equal(key in single.capsule, false, `no ${key} authority created`);

console.log("VerifySourceCapsuleExport: PASS (21 required exporter behaviors; pure explicit-capture boundary preserved)");
