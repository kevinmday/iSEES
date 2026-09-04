import assert from "node:assert/strict";
import { createTypedResearchAnchor } from "../../src/research/ResearchAnchorContract.ts";
import { assembleStudioDraftingContext, canonicalSerializeDraftingContext } from "../../src/studio/drafting/StudioDraftingContext.ts";
import { STUDIO_DRAFTING_LIMITS } from "../../src/studio/drafting/StudioDraftingTypes.ts";

const at = new Date("2026-01-02T03:04:05.000Z");
const source = (identity: string, changes: Record<string, unknown> = {}) => createTypedResearchAnchor({ investigationId: "investigation:A", kind: "EVIDENCE_RECORD", sourceWorkspace: "EVIDENCE", sourceIdentity: identity, collectedAt: at, classification: "CANONICAL", sourceRevisionId: "revision:1", display: { title: identity, summary: `summary:${identity}` }, insertability: { state: "INSERTABLE", reason: "Qualified." }, capturedRepresentation: { schemaVersion: "evidence/v1", mediaType: "application/json", value: { z: 2, a: 1 } }, ...changes } as never);
const a = source("zeta"); const b = source("alpha");
const document = { identity: { id: "document:1", createdAt: at }, nodes: [
  { id: "note:2", type: "PARAGRAPH", section: "Findings", text: " exact second " },
  { id: "reference:1", type: "REFERENCE", title: "not a note" },
  { id: "note:1", type: "OBSERVATION", text: "exact first", source: "AUTHOR", relatedReferences: [], createdAt: at },
] } as never;
const base = { investigationId: "investigation:A", document, documentRuntimeRevision: 7, selectedSourceAnchorIds: [a.anchorId, b.anchorId], selectedResearcherNoteNodeIds: ["note:1", "note:2"], researchProjection: { status: "AVAILABLE", investigationId: "investigation:A", entries: [{ anchor: a, order: 99 }, { anchor: b, order: 1 }] }, artifactDesign: { designId: "report", designVersion: "1" }, draftingInstruction: "Draft findings." } as const;

const first = await assembleStudioDraftingContext(base);
const second = await assembleStudioDraftingContext({ ...base, researchProjection: { ...base.researchProjection, entries: [...base.researchProjection.entries].reverse() } });
assert.equal(first.canonicalContext, second.canonicalContext, "equivalent projection order is canonicalized");
assert.equal(first.contextHash, second.contextHash, "equivalent input hashes match");
assert.deepEqual(first.context.sources.map(item => item.sourceIdentity), ["alpha", "zeta"]);
assert.deepEqual(first.context.researcherNotes.map(item => [item.nodeId, item.text]), [["note:2", " exact second "], ["note:1", "exact first"]], "notes retain document order and exact text");
assert.equal(canonicalSerializeDraftingContext({ z: 1, a: { y: 2, x: 3 } }), canonicalSerializeDraftingContext({ a: { x: 3, y: 2 }, z: 1 }), "object insertion order is immaterial");

const subset = await assembleStudioDraftingContext({ ...base, selectedSourceAnchorIds: [b.anchorId], selectedResearcherNoteNodeIds: [] });
assert.deepEqual(subset.context.sources.map(item => item.anchorId), [b.anchorId], "SUBSET includes exactly requested source");
const inspection = source("inspection", { insertability: { state: "INSPECTION_ONLY", reason: "Review only." } });
const undetermined = source("unknown", { classification: "UNDETERMINED" });
const all = await assembleStudioDraftingContext({ ...base, sourceSelectionMode: "ALL", selectedSourceAnchorIds: [], selectedResearcherNoteNodeIds: [], researchProjection: { status: "AVAILABLE", investigationId: "investigation:A", entries: [{ anchor: inspection, order: 0 }, { anchor: a, order: 10 }, { anchor: undetermined, order: 20 }, { anchor: b, order: 30 }] } });
assert.deepEqual(all.context.sources.map(item => item.sourceIdentity), ["alpha", "zeta"], "ALL ignores presentation order/filtering and includes every eligible source");
assert.deepEqual(all.context.excludedSources.map(item => item.reason).sort(), ["INSPECTION_ONLY", "UNDETERMINED"]);

await assert.rejects(() => assembleStudioDraftingContext({ ...base, selectedSourceAnchorIds: ["missing"] }), /not in the active Investigation/);
await assert.rejects(() => assembleStudioDraftingContext({ ...base, selectedSourceAnchorIds: [a.anchorId, a.anchorId] }), /unique/);
await assert.rejects(() => assembleStudioDraftingContext({ ...base, selectedSourceAnchorIds: [], selectedResearcherNoteNodeIds: [] }), /At least one/);
await assert.rejects(() => assembleStudioDraftingContext({ ...base, draftingInstruction: "" }), /Enter drafting instructions/);
await assert.rejects(() => assembleStudioDraftingContext({ ...base, draftingInstruction: "x".repeat(STUDIO_DRAFTING_LIMITS.maxInstructionChars + 1) }), /exceed 8000/, "over-limit instructions are rejected without truncation");
await assert.rejects(() => assembleStudioDraftingContext({ ...base, draftingInstruction: "", selectedSourceAnchorIds: [], selectedResearcherNoteNodeIds: [] }), /At least one/, "empty context is the actionable blocker before a blank instruction");
await assert.rejects(() => assembleStudioDraftingContext({ ...base, selectedSourceAnchorIds: [], selectedResearcherNoteNodeIds: ["reference:1"] }), /REFERENCE/);
await assert.rejects(() => assembleStudioDraftingContext({ ...base, researchProjection: { status: "AVAILABLE", investigationId: "investigation:A", entries: [{ anchor: source("cross", { investigationId: "investigation:B" }), order: 0 }] } }), /cross-Investigation/);
await assert.rejects(() => assembleStudioDraftingContext({ ...base, selectedSourceAnchorIds: [], selectedResearcherNoteNodeIds: ["note:2"], document: { identity: { id: "document:1", createdAt: at }, nodes: [{ id: "note:2", type: "PARAGRAPH", text: "x".repeat(32_001) }] } as never }), /byte limit/);
console.log("VerifyStudioDraftingContextDeterminism: PASS");
