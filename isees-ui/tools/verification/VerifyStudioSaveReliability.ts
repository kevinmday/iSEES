import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { restoreStudioDocument } from "../../src/studio/api/StudioDocumentRestoration.ts";

const at = new Date("2026-09-05T12:00:00.000Z");
const scope = { investigationId: "investigation:a", principalId: "principal:a" };
const anchor = { schemaVersion: "research-anchor/v2", kind: "GRAPH", anchorId: "anchor:graph", investigationId: scope.investigationId, sourceWorkspace: "MANIFOLD", sourceIdentity: "NODE:graph", collectedAt: at, createdAt: at, classification: "CANONICAL", sourceRevisionId: "7", display: { title: "Graph", summary: "Canonical graph" }, insertability: { state: "INSERTABLE", reason: "Canonical" }, capturedRepresentation: { schemaVersion: "research-graph/v1", mediaType: "application/json", value: { graph: { type: "NODE", id: "graph" }, graphRevision: 7 } }, pinned: false, graph: { type: "NODE", id: "graph" }, graphRevision: 7 } as const;
const sourceBlock = { id: "reference:graph", type: "REFERENCE", targetType: "DOCUMENT", targetId: anchor.sourceIdentity, title: anchor.display.title, source: "RESEARCH_BRIDGE", corpusId: anchor.anchorId, insertedAt: at, researchSource: { anchorId: anchor.anchorId, sourceKind: anchor.kind, sourceIdentity: anchor.sourceIdentity, sourceInvestigationId: scope.investigationId, sourceWorkspace: anchor.sourceWorkspace, sourceRevisionId: anchor.sourceRevisionId, collectedAt: at, createdAt: at, display: anchor.display, graph: anchor.graph, graphRevision: anchor.graphRevision, classification: anchor.classification, insertability: anchor.insertability, capturedRepresentation: anchor.capturedRepresentation } };
const document = { identity: { id: "author:a", createdAt: at }, metadata: { title: "Draft", description: "", author: "Researcher", modifiedAt: at, version: 1 }, type: "DOCUMENT", status: "NEW", nodes: [sourceBlock] };
const restored = restoreStudioDocument(JSON.parse(JSON.stringify(document)));
assert.ok(restored);
assert.ok(restored.nodes[0]!.insertedAt instanceof Date, "JSON-restored source insertion timestamp is revived before save extraction");
assert.equal(typeof (restored.nodes[0] as typeof sourceBlock).researchSource.collectedAt, "string", "Author hydration does not revive nested non-Author date fields");
assert.equal(restoreStudioDocument({ ...document, identity: { ...document.identity, createdAt: "bad" } }), undefined, "malformed required Author date fails safely");
assert.equal(restoreStudioDocument({ ...document, nodes: [{ ...sourceBlock, insertedAt: "bad" }] }), undefined, "malformed REFERENCE insertedAt fails safely");

const inspector = readFileSync("src/studio/components/StudioArtifactInspector.tsx", "utf8");
const toolbar = readFileSync("src/author/components/StudioToolbar.tsx", "utf8");
const shell = readFileSync("src/author/components/StudioShell.tsx", "utf8");
assert.match(inspector, /await saveAction\.save\(\)/, "Inspector Save delegates to the governed Studio V1 owner");
assert.doesNotMatch(inspector, /composeStudioVersionCommand/, "Inspector does not compose or post the obsolete legacy save contract");
assert.match(inspector, /Artifact ID[\s\S]*Version[\s\S]*Dirty · unsaved changes[\s\S]*Studio V1 Save Failed/, "canonical identity/version and dirty state coexist with V1 operation failure");
assert.match(inspector, /Your unsaved draft is preserved/, "V1 failure preserves and explains the local draft");
assert.match(inspector, /Retry Save/);
assert.match(inspector, /PDF[\s\S]*do not represent this unsaved draft/, "historical v1 PDF remains available and is clearly distinguished from the dirty draft");
assert.match(inspector, /const mutate[\s\S]*await studioApi\.post[\s\S]*const lifecycleAction/, "unrelated legacy lifecycle mutations remain owned by their existing service");
assert.match(toolbar, /saveAction\.save\(\)/, "toolbar Save delegates to the governed Studio V1 owner");
assert.match(shell, /StudioSaveActionProvider/, "Studio shell scopes the single governed save owner");
console.log("PASS VerifyStudioSaveReliability — narrow Author date hydration, safe malformed dates, isolated legacy lifecycle operations, historical output warning, preserved local failures, and governed Studio V1 Save verified");
