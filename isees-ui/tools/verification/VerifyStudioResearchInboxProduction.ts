import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ResearchBridgeRuntime } from "../../src/research/ResearchBridgeRuntime.ts";
import { createTypedResearchAnchor } from "../../src/research/ResearchAnchorContract.ts";
import { createAuthorReferenceFromResearchAnchor } from "../../src/studio/sources/ResearchAnchorAuthorInsertion.ts";
import type { ResearchAnchorKind, ResearchSourceWorkspace } from "../../src/research/researchBridgeTypes.ts";

const read = (path: string) => readFileSync(path, "utf8");
const component = read("src/studio/components/StudioResearchInbox.tsx");
const studio = read("src/author/components/StudioShell.tsx");
const studioCss = read("src/author/components/StudioShell.css");
const surface = read("src/surfaces/WorkspaceSurface.tsx");
const compact = read("src/manifold/components/ResearchInboxInstrument.tsx");
const runtimeSource = read("src/research/ResearchBridgeRuntime.ts");

assert.match(studio, /<StudioResearchInbox\s*\/>/);
assert.match(studioCss, /grid-template-columns:[^;]+minmax\(0, 1fr\)/, "permanent column reserves authoring width");
assert.match(component, /data-permanent="true"/);
assert.match(surface, /<ResearchInboxInstrument/);
const visibility = surface.match(/const researchInboxVisible\s*=[\s\S]*?;/)?.[0] ?? "";
assert.doesNotMatch(visibility, /WorkspaceMode\.RESEARCH/, "floating Inbox is absent in STUDIO");
for (const mode of ["MANIFOLD", "COMPARE", "NARRATIVE", "LAYERS", "EVIDENCE", "INTENTION"]) assert.match(visibility, new RegExp(`WorkspaceMode\\.${mode}`), `compact Inbox remains in ${mode}`);
assert.match(compact, /aria-expanded/);

const at = new Date("2026-09-04T12:00:00.000Z");
const runtime = new ResearchBridgeRuntime();
function anchor(input: { investigationId: string; kind: ResearchAnchorKind; sourceWorkspace: ResearchSourceWorkspace; identity: string; title: string; summary: string; insertable?: boolean }) {
  return createTypedResearchAnchor({ investigationId: input.investigationId, kind: input.kind as Exclude<ResearchAnchorKind, "GRAPH" | "COMPARE_CANDIDATE" | "LAYERS_EXPERIMENT">, sourceWorkspace: input.sourceWorkspace, sourceIdentity: input.identity, collectedAt: at, classification: "CANONICAL", sourceRevisionId: "revision:exact", sourceExecutionId: "execution:exact", sourceProjectionId: "projection:exact", display: { title: input.title, summary: input.summary }, insertability: input.insertable === false ? { state: "INSPECTION_ONLY", reason: "Source has not been accepted." } : { state: "INSERTABLE", reason: "Qualified source." }, capturedRepresentation: { schemaVersion: "fixture/v1", mediaType: "application/json", value: { identity: input.identity } } });
}
const evidence = anchor({ investigationId: "inv:a", kind: "EVIDENCE_RECORD", sourceWorkspace: "EVIDENCE", identity: "evidence:exact:1", title: "Signal report", summary: "Primary observation" });
const narrative = anchor({ investigationId: "inv:a", kind: "NARRATIVE_PASSAGE", sourceWorkspace: "NARRATIVE", identity: "passage:exact:1", title: "Market passage", summary: "Researcher context" });
const inspection = anchor({ investigationId: "inv:a", kind: "INTENTION_HYPOTHESIS", sourceWorkspace: "INTENTION", identity: "hypothesis:exact:1", title: "Working theory", summary: "Theoretical candidate", insertable: false });
const other = anchor({ investigationId: "inv:b", kind: "MEDIA", sourceWorkspace: "MEDIA", identity: "media:other", title: "Other investigation", summary: "Must stay isolated" });
for (const value of [evidence, narrative, inspection, other]) runtime.createAnchor(value);

assert.deepEqual(runtime.projectInvestigation({ investigationId: "inv:a" }).entries.map(entry => entry.anchor.anchorId), [evidence.anchorId, narrative.anchorId, inspection.anchorId], "projection is Investigation scoped");
assert.equal(runtime.projectInvestigation({}).status, "NO_ACTIVE_INVESTIGATION");
const deskBeforeSearch = JSON.stringify(runtime.getDesk());
assert.equal(runtime.projectInvestigation({ investigationId: "inv:a", searchQuery: "evidence" }).entries.length, 1, "search covers workspace");
assert.equal(runtime.projectInvestigation({ investigationId: "inv:a", searchQuery: "exact:1" }).entries.length, 3, "search covers exact source identity");
assert.equal(JSON.stringify(runtime.getDesk()), deskBeforeSearch, "search does not mutate anchors");
assert.equal(runtime.projectInvestigation({ investigationId: "inv:a", sourceWorkspace: "NARRATIVE" }).entries[0]?.anchor.anchorId, narrative.anchorId);
assert.equal(runtime.projectInvestigation({ investigationId: "inv:a", sourceKind: "INTENTION_HYPOTHESIS" }).entries[0]?.anchor.anchorId, inspection.anchorId);
assert.deepEqual(runtime.projectInvestigation({ investigationId: "inv:a", insertableOnly: true }).entries.map(entry => entry.anchor.anchorId), [evidence.anchorId, narrative.anchorId]);

runtime.pinAnchor(narrative.anchorId, true);
assert.equal(runtime.projectInvestigation({ investigationId: "inv:a", pinnedFirst: true }).entries[0]?.anchor.anchorId, narrative.anchorId, "pinned first ordering");
assert.equal(runtime.projectInvestigation({ investigationId: "inv:a", selectedAnchorId: evidence.anchorId }).selectedAnchorId, evidence.anchorId);
assert.equal(runtime.projectInvestigation({ investigationId: "inv:b", selectedAnchorId: evidence.anchorId }).selectedAnchorId, undefined, "selection cannot cross Investigations");
runtime.pinAnchor(narrative.anchorId, false);
assert.equal(runtime.projectInvestigation({ investigationId: "inv:a" }).entries.find(entry => entry.anchor.anchorId === narrative.anchorId)?.anchor.pinned, false, "unpin persists");

const beforeInsert = JSON.stringify(runtime.getDesk());
assert.throws(() => createAuthorReferenceFromResearchAnchor(inspection, "reference:blocked"), /inspection-only/i);
const reference = createAuthorReferenceFromResearchAnchor(evidence, "reference:explicit", at);
assert.equal(reference.researchSource?.sourceIdentity, evidence.sourceIdentity);
assert.equal(reference.researchSource?.sourceWorkspace, evidence.sourceWorkspace);
assert.equal(reference.researchSource?.sourceProjectionId, "projection:exact");
assert.equal(JSON.stringify(runtime.getDesk()), beforeInsert, "reference creation does not mutate Research or implicitly insert another source");
assert.match(component, /Insert into Draft/);
assert.match(component, /selected\.insertability\.state !== "INSERTABLE"/);

runtime.removeAnchor(evidence.anchorId);
assert.equal(runtime.projectInvestigation({ investigationId: "inv:a" }).entries.some(entry => entry.anchor.anchorId === evidence.anchorId), false);
assert.equal(runtime.projectInvestigation({ investigationId: "inv:b" }).entries[0]?.anchor.anchorId, other.anchorId, "removal leaves another Investigation intact");
assert.equal(reference.researchSource?.sourceIdentity, "evidence:exact:1", "removal does not delete referenced canonical identity");

for (const text of ["No active Investigation", "No collected sources", "No matching sources", "Selected source removed", "Inspection only"]) assert.ok(component.includes(text), `distinct state is visible: ${text}`);
for (const token of ["sourceWorkspace", "sourceKind", "insertableOnly", "pinnedFirst", "pinAnchor", "removeAnchor", "createAuthorReferenceFromResearchAnchor"]) assert.ok(component.includes(token), `production control is wired: ${token}`);
assert.ok(runtimeSource.includes("entry.anchor.sourceWorkspace"), "runtime search includes source workspace");

console.log("PASS VerifyStudioResearchInboxProduction — permanent composition, scoped discovery, controls, selection, removal and explicit provenance insertion verified");
