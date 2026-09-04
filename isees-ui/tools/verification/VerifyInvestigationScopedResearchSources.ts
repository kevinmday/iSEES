import assert from "node:assert/strict";
import { ResearchBridgeRuntime } from "../../src/research/ResearchBridgeRuntime.ts";
import { createTypedResearchAnchor, migrateResearchAnchor, researchAnchorId } from "../../src/research/ResearchAnchorContract.ts";
import { createAuthorReferenceFromResearchAnchor } from "../../src/studio/sources/ResearchAnchorAuthorInsertion.ts";
import { mapResearchAnchorToStudioSourceSnapshot } from "../../src/studio/sources/StudioSourceSnapshotMapper.ts";
import type { ResearchAnchor, ResearchAnchorKind } from "../../src/research/researchBridgeTypes.ts";

const at = new Date("2026-09-04T12:00:00.000Z");
const kinds: readonly Exclude<ResearchAnchorKind, "GRAPH" | "COMPARE_CANDIDATE" | "LAYERS_EXPERIMENT">[] = ["EVIDENCE_RECORD", "MEDIA", "NARRATIVE_PASSAGE", "TIMELINE_MOMENT", "TIMELINE_CORRESPONDENCE", "INTENTION_DERIVATION", "INTENTION_HYPOTHESIS"];
const workspace = (kind: typeof kinds[number]) => kind.startsWith("TIMELINE") ? "TIMELINE" as const : kind.startsWith("INTENTION") ? "INTENTION" as const : kind === "EVIDENCE_RECORD" ? "EVIDENCE" as const : kind === "NARRATIVE_PASSAGE" ? "NARRATIVE" as const : "MEDIA" as const;
const anchors = kinds.map((kind, index) => createTypedResearchAnchor({ investigationId: "investigation:A", kind, sourceWorkspace: workspace(kind), sourceIdentity: `exact:${kind}:${index}`, collectedAt: at, classification: kind === "EVIDENCE_RECORD" ? "CANONICAL" : "RESEARCHER_GENERATED", sourceRevisionId: "revision:1", sourceExecutionId: "execution:1", sourceProjectionId: "projection:1", display: { title: `Title ${kind}`, summary: `Summary ${kind}` }, insertability: kind.includes("CORRESPONDENCE") || kind.includes("HYPOTHESIS") ? { state: "INSPECTION_ONLY", reason: "Not accepted." } : { state: "INSERTABLE", reason: "Qualified." }, capturedRepresentation: { schemaVersion: `${kind}/v1`, mediaType: "application/json", value: { exact: kind } } }));

assert.equal(new Set(anchors.map(anchor => anchor.kind)).size, 7);
assert.equal(researchAnchorId("investigation:A", "MEDIA", "media:1"), researchAnchorId("investigation:A", "MEDIA", "media:1"));
assert.notEqual(researchAnchorId("investigation:A", "MEDIA", "media:1"), researchAnchorId("investigation:B", "MEDIA", "media:1"));
assert.throws(() => createTypedResearchAnchor({ ...anchors[0], sourceIdentity: "" }));
assert.throws(() => createTypedResearchAnchor({ ...anchors[2], sourceProjectionId: undefined }));

const runtime = new ResearchBridgeRuntime();
for (const anchor of anchors) { runtime.createAnchor(anchor); runtime.createAnchor(anchor); }
runtime.createAnchor(createTypedResearchAnchor({ ...anchors[1], investigationId: "investigation:B", anchorId: undefined }));
assert.equal(runtime.getDesk().entries.length, 8, "recollection is idempotent while another Investigation remains distinct");
const before = JSON.stringify(runtime.getDesk());
const a = runtime.projectInvestigation({ investigationId: "investigation:A", selectedAnchorId: anchors[0].anchorId, searchQuery: "summary", sourceWorkspace: "EVIDENCE" });
assert.equal(a.entries.length, 1); assert.equal(a.selectedAnchorId, anchors[0].anchorId); assert.equal(JSON.stringify(runtime.getDesk()), before, "search/filter do not mutate anchors");
assert.equal(runtime.projectInvestigation({ investigationId: "investigation:B", selectedAnchorId: anchors[0].anchorId }).selectedAnchorId, undefined, "selection cannot leak");
assert.equal(runtime.projectInvestigation({ investigationId: "investigation:C" }).entries.length, 0, "fresh Investigation is empty");
assert.equal(runtime.projectInvestigation({}).status, "NO_ACTIVE_INVESTIGATION");
assert.equal(runtime.projectInvestigation({ investigationId: "investigation:A", insertableOnly: true }).entries.length, 5);

const insertable = anchors[0];
const reference = createAuthorReferenceFromResearchAnchor(insertable, "author-reference:1", at);
assert.equal(reference.researchSource?.sourceIdentity, insertable.sourceIdentity); assert.equal(reference.researchSource?.sourceInvestigationId, "investigation:A");
assert.equal(reference.type, "REFERENCE"); assert.equal("citation" in reference, false); assert.equal("claim" in reference, false);
assert.throws(() => createAuthorReferenceFromResearchAnchor(anchors[4], "author-reference:2"));
const snapshot = mapResearchAnchorToStudioSourceSnapshot(insertable);
assert.equal(snapshot.sourceIdentity, insertable.sourceIdentity); assert.equal(snapshot.sourceInvestigationId, "investigation:A"); assert.deepEqual(snapshot.capturedRepresentation, { exact: "EVIDENCE_RECORD" });
assert.throws(() => mapResearchAnchorToStudioSourceSnapshot(anchors[4]));

const legacy: readonly Record<string, unknown>[] = [
  { anchorId: "research:i:NODE:n", investigationId: "i", graph: { type: "NODE", id: "n" }, graphRevision: 1, createdAt: at, pinned: false },
  { anchorId: "research:i:CANDIDATE:c:e", investigationId: "i", candidate: { type: "CANDIDATE", candidateId: "c", evaluationId: "e", leftKnowledgeObjectId: "l", rightKnowledgeObjectId: "r", focusedEventId: "f", focusedEventKnowledgeObjectId: "fk", comparisonEventId: "c", comparisonEventKnowledgeObjectId: "ck", epistemicStatus: "POTENTIAL_RELATIONSHIP", aggregate: {}, dimensions: [], source: "COMPARE_PAIR_INSPECTION" }, createdAt: at, pinned: false },
  { anchorId: "research:i:EXPERIMENT:p", investigationId: "i", experiment: { type: "EXPERIMENT", caseAEventId: "a", caseBEventId: "b", projection: { projectionId: "p", executionId: "x" }, source: "LAYERS_EXPERIMENTAL_LABORATORY" }, createdAt: at, pinned: false },
];
assert.deepEqual(legacy.map(item => migrateResearchAnchor(item).kind), ["GRAPH", "COMPARE_CANDIDATE", "LAYERS_EXPERIMENT"]);
const roundTrip = new ResearchBridgeRuntime(); roundTrip.restoreDesk(JSON.parse(JSON.stringify(runtime.getDesk())));
assert.deepEqual(roundTrip.projectInvestigation({ investigationId: "investigation:A" }).entries.map(entry => entry.anchor.kind), runtime.projectInvestigation({ investigationId: "investigation:A" }).entries.map(entry => entry.anchor.kind));
assert.throws(() => migrateResearchAnchor({ anchorId: "bad", investigationId: "i", createdAt: at, pinned: false }));
console.log("P57-UI-A16-I2A research source contracts VERIFIED");
