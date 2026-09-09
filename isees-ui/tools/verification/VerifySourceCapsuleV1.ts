import assert from "node:assert/strict";
import { createSourceCapsuleV1, serializeSourceCapsuleV1 } from "../../src/intake/capture/SourceCapsuleCanonicalization.ts";
import { SOURCE_CAPSULE_LIMITS, SOURCE_CAPSULE_SCHEMA_ID, SOURCE_CAPSULE_SCHEMA_VERSION, type SourceCapsuleV1, type UnsignedSourceCapsuleV1 } from "../../src/intake/capture/SourceCapsuleV1.ts";
import { SourceCapsuleValidationError, assertNoCapsuleIdentityConflict, validateSourceCapsuleV1 } from "../../src/intake/capture/SourceCapsuleValidation.ts";

const base = (): UnsignedSourceCapsuleV1 => ({
  schema: { identity: SOURCE_CAPSULE_SCHEMA_ID, version: SOURCE_CAPSULE_SCHEMA_VERSION }, capsuleId: "capsule:news:revision-1", captureMethod: "ISEES_CAPTURE_EXPLICIT", capturedAt: "2026-09-09T16:00:00.000Z",
  source: { identity: "source:example-news:article-1", requestedUrl: "https://example.test/story", redirectChain: ["https://example.test/story"], finalUrl: "https://news.example.test/story", canonicalUrl: "https://news.example.test/story", pageTitle: "Verified report", publisher: "Example News", authorByline: "Reporter Name", publishedAt: "2026-09-09T12:00:00.000Z", modifiedAt: "2026-09-09T13:00:00.000Z", language: "en", revisionIdentity: "revision:2026-09-09T13:00:00.000Z" },
  rightsClassification: "QUOTATION_PERMITTED", privacyClassification: "PUBLIC",
  passages: [{ passageId: "passage:1", exactText: "First line.\r\nSecond line.\nThird line.", originalHtml: "<p>First line.<br>Second line.<br>Third line.</p>", htmlSanitization: "ISEES_CAPTURE_ALLOWLIST_V1", governingHeading: "Report", prefixContext: "Before.", suffixContext: "After.", documentPosition: { kind: "TEXT_OFFSETS", startOffset: 120, endOffset: 157 }, selection: { selectionId: "selection:1", direction: "FORWARD" } }],
  researcherNotes: [{ noteId: "note:1", researcherId: "researcher:1", createdAt: "2026-09-09T16:01:00.000Z", text: "Check this claim independently.", derivedFromPassageIds: ["passage:1"] }],
});

async function rejection(name: string, mutate: (value: Record<string, unknown>) => void, code?: string): Promise<void> {
  const capsule = await createSourceCapsuleV1(base()); const candidate = structuredClone(capsule) as unknown as Record<string, unknown>; mutate(candidate);
  await assert.rejects(() => validateSourceCapsuleV1(candidate), error => error instanceof SourceCapsuleValidationError && (!code || error.code === code), name);
}

const single = await createSourceCapsuleV1(base());
assert.equal(await validateSourceCapsuleV1(single), single, "valid single-passage news capture");
assert.equal(single.passages[0]!.exactText, "First line.\r\nSecond line.\nThird line.", "multiline text and mixed line endings remain exact");
assert.equal("text" in single.researcherNotes[0]!, true); assert.equal("researcherNotes" in single.passages[0]!, false, "researcher notes remain separate");

const multipleInput = base(); multipleInput.capsuleId = "capsule:news:revision-2"; multipleInput.passages.push({ passageId: "passage:2", exactText: "A later, nonadjacent passage.", documentPosition: { kind: "TEXT_OFFSETS", startOffset: 900, endOffset: 930 } });
const multiple = await createSourceCapsuleV1(multipleInput); await validateSourceCapsuleV1(multiple); assert.equal(multiple.passages.length, 2, "multiple nonadjacent passages validate");

const minimalInput = base(); minimalInput.capsuleId = "capsule:minimal"; minimalInput.source = { identity: "source:minimal", finalUrl: "https://example.test/" }; minimalInput.passages = [{ passageId: "passage:minimal", exactText: "Exact." }]; minimalInput.researcherNotes = [];
const minimal = await createSourceCapsuleV1(minimalInput); await validateSourceCapsuleV1(minimal); assert.deepEqual(Object.keys(minimal.source), ["identity", "finalUrl"], "unknown optional metadata is absent");

const repeated = await createSourceCapsuleV1(structuredClone(base())); assert.equal(serializeSourceCapsuleV1(repeated), serializeSourceCapsuleV1(single)); assert.equal(repeated.integrity.capsuleHash, single.integrity.capsuleHash, "serialization and hashing are deterministic");
const reordered = Object.fromEntries(Object.entries(structuredClone(single)).reverse()); assert.equal(serializeSourceCapsuleV1(reordered as unknown as SourceCapsuleV1), serializeSourceCapsuleV1(single), "property insertion order cannot alter canonical bytes"); await validateSourceCapsuleV1(reordered);
await rejection("unsupported schema", value => ((value.schema as Record<string, unknown>).version = 2), "UNSUPPORTED_SCHEMA");
await rejection("missing passages", value => { value.passages = []; }, "MISSING_PASSAGES");
await rejection("empty source text", value => { ((value.passages as Record<string, unknown>[])[0]!).exactText = ""; }, "INVALID_TEXT");
await rejection("malformed URL", value => { ((value.source as Record<string, unknown>).finalUrl) = "not a URL"; }, "INVALID_URL");
await rejection("non-HTTP URL", value => { ((value.source as Record<string, unknown>).finalUrl) = "file:///secret"; }, "INVALID_URL");
await rejection("excess redirect chain", value => { ((value.source as Record<string, unknown>).redirectChain) = Array.from({ length: SOURCE_CAPSULE_LIMITS.maxRedirects + 1 }, (_, index) => `https://example.test/${index}`); }, "TOO_MANY_REDIRECTS");
await rejection("oversized passage", value => { ((value.passages as Record<string, unknown>[])[0]!).exactText = "x".repeat(SOURCE_CAPSULE_LIMITS.maxPassageTextBytes + 1); }, "TEXT_TOO_LARGE");
await rejection("excess passage count", value => { value.passages = Array.from({ length: SOURCE_CAPSULE_LIMITS.maxPassages + 1 }, (_, index) => ({ ...structuredClone((value.passages as Record<string, unknown>[])[0]), passageId: `passage:${index}` })); }, "TOO_MANY_PASSAGES");
const oversizedInput = base(); oversizedInput.passages = Array.from({ length: 17 }, (_, index) => ({ passageId: `passage:${index}`, exactText: "x".repeat(64_000) })); const oversized = await createSourceCapsuleV1(oversizedInput); await assert.rejects(() => validateSourceCapsuleV1(oversized), (error: unknown) => error instanceof SourceCapsuleValidationError && error.code === "PACKAGE_TOO_LARGE", "oversized package");
await rejection("unexpected properties", value => { value.surprise = true; }, "UNEXPECTED_PROPERTY");
await rejection("executable HTML", value => { ((value.passages as Record<string, unknown>[])[0]!).originalHtml = "<script>alert(1)</script>"; }, "UNSAFE_HTML");
for (const property of ["credentials", "cookie", "accessToken", "requestHeaders", "browserStorage", "sessionIdentifier"]) await rejection(`forbidden ${property}`, value => { (value.source as Record<string, unknown>)[property] = "secret"; }, "FORBIDDEN_MATERIAL");
await rejection("tampered capsule hash", value => { (value.integrity as Record<string, unknown>).capsuleHash = `sha256:${"0".repeat(64)}`; }, "CAPSULE_HASH_MISMATCH");

const conflictInput = base(); conflictInput.passages[0]!.exactText = "Changed webpage content."; conflictInput.source.revisionIdentity = "revision:changed"; const conflict = await createSourceCapsuleV1(conflictInput);
assert.throws(() => assertNoCapsuleIdentityConflict(single, conflict), (error: unknown) => error instanceof SourceCapsuleValidationError && error.code === "CAPSULE_IDENTITY_CONFLICT", "same capsule identity with changed immutable content conflicts");
const changedIdentityInput = base(); changedIdentityInput.capsuleId = "capsule:news:revision-changed"; changedIdentityInput.source.revisionIdentity = "revision:changed"; changedIdentityInput.passages[0]!.exactText = "Changed webpage content."; const changed = await createSourceCapsuleV1(changedIdentityInput); await validateSourceCapsuleV1(changed); assert.notEqual(changed.integrity.capsuleHash, single.integrity.capsuleHash, "changed webpage is a distinct capsule/revision");

for (const forbiddenAuthority of ["researchAnchor", "candidateEvidence", "candidateKnowledge", "canonicalRecord"]) assert.equal(forbiddenAuthority in single, false, `validation creates no ${forbiddenAuthority}`);
assert.equal(await validateSourceCapsuleV1(single), single, "validation is pure and returns the same source-only object");
console.log("VerifySourceCapsuleV1: PASS (18 required scenarios; source-only authority preserved)");
