import assert from "node:assert/strict";
import { createTypedResearchAnchor } from "../../src/research/ResearchAnchorContract.ts";
import { STUDIO_ARTIFACT_DESIGNS } from "../../src/studio/drafting/StudioArtifactDesigns.ts";
import { assembleStudioDraftingContext } from "../../src/studio/drafting/StudioDraftingContext.ts";

const at = new Date("2026-01-02T03:04:05Z");
const anchor = createTypedResearchAnchor({ investigationId: "investigation:A", kind: "EVIDENCE_RECORD", sourceWorkspace: "EVIDENCE", sourceIdentity: "evidence:1", collectedAt: at, classification: "CANONICAL", display: { title: "Evidence", summary: "Exact" }, insertability: { state: "INSERTABLE", reason: "Qualified." }, capturedRepresentation: { schemaVersion: "evidence/v1", mediaType: "application/json", value: { exact: true } } } as never);
const document = { identity: { id: "document:1", createdAt: at }, nodes: [] } as never;
const design = STUDIO_ARTIFACT_DESIGNS[0]!;
const input = { investigationId: "investigation:A", document, documentRuntimeRevision: 1, selectedSourceAnchorIds: [anchor.anchorId], selectedResearcherNoteNodeIds: [], researchProjection: { status: "AVAILABLE", investigationId: "investigation:A", entries: [{ anchor, order: 0 }] }, artifactDesign: design, draftingInstruction: "Draft findings." } as const;

const first = await assembleStudioDraftingContext(input);
assert.deepEqual(Object.keys(first.context.artifactDesign).sort(), ["designId", "designVersion"]);
for (const key of ["label", "purpose", "sectionPlan", "draftingGuidance", "provenanceExpectations"] as const) {
  assert.ok(key in design, `${key} remains in the trusted local catalog`);
  assert.equal(key in first.context.artifactDesign, false, `${key} is not transmitted`);
}
const relabeled = await assembleStudioDraftingContext({ ...input, artifactDesign: { ...design, label: "Presentation-only relabel" } });
assert.equal(relabeled.canonicalContext, first.canonicalContext, "presentation labels do not alter canonical request context");
assert.equal(relabeled.contextHash, first.contextHash, "presentation labels do not alter the context hash");
console.log("VerifyStudioDraftingRequestParity: PASS");
