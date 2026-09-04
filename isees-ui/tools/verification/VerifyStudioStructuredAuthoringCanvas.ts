import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AuthorDocumentRuntime } from "../../src/author/runtime/AuthorDocumentRuntime.ts";
import { AuthorDocumentStatuses, AuthorDocumentTypes } from "../../src/author/model/AuthorDocumentTypes.ts";
import { AuthorNodeTypes, type ReferenceNode } from "../../src/author/model/AuthorNodeTypes.ts";
import { ResearchBridgeRuntime } from "../../src/research/ResearchBridgeRuntime.ts";
import { createTypedResearchAnchor } from "../../src/research/ResearchAnchorContract.ts";
import { createAuthorReferenceFromResearchAnchor } from "../../src/studio/sources/ResearchAnchorAuthorInsertion.ts";

const read = (path: string) => readFileSync(path, "utf8");
const surface = read("src/author/components/AuthorEditorSurface.tsx");
const shell = read("src/author/components/StudioShell.tsx");
const inbox = read("src/studio/components/StudioResearchInbox.tsx");
const workspace = read("src/surfaces/WorkspaceSurface.tsx");
for (const section of ["Abstract", "Research Question", "Hypothesis / H0 / H1", "Method", "Evidence", "Analysis", "Figures / Tables", "Conclusion", "References / Footnotes"]) assert.ok(surface.includes(section), `${section} is production-composed`);
for (const marker of ["Authoring Canvas", "SOURCE-BACKED EVIDENCE", "FIGURE", "TABLE", "EQUATION", "PROVENANCE CITATION", "Inspect exact provenance", "Empty draft", "No active Investigation", "New authored text section"]) assert.ok(surface.includes(marker), `${marker} is visible`);
assert.match(shell, /useAuthorDocumentRuntime/);
assert.doesNotMatch(surface, /new AuthorDocumentRuntime|useState<.*ComputationalAuthorDocument/);
assert.match(inbox, /authorDocumentRuntime\.insertNode\(createAuthorReferenceFromResearchAnchor/);
assert.match(inbox, /research-reference:\$\{selected\.anchorId\}/);
assert.match(inbox, /already in this draft/);
assert.match(surface, /getLastInsertedNodeId/);
assert.match(workspace, /<ResearchInboxInstrument/);

const at = new Date("2026-09-04T12:00:00.000Z");
const research = new ResearchBridgeRuntime();
const source = createTypedResearchAnchor({ investigationId: "inv:a", kind: "EVIDENCE_RECORD", sourceWorkspace: "EVIDENCE", sourceIdentity: "evidence:typed:1", collectedAt: at, classification: "CANONICAL", sourceRevisionId: "rev:1", sourceExecutionId: "exec:1", sourceProjectionId: "projection:1", display: { title: "Typed evidence", summary: "Exact captured summary" }, insertability: { state: "INSERTABLE", reason: "Qualified evidence." }, capturedRepresentation: { schemaVersion: "evidence/v1", mediaType: "application/json", value: { fact: 42 } } });
const blocked = createTypedResearchAnchor({ ...source, sourceIdentity: "evidence:blocked", anchorId: undefined, insertability: { state: "INSPECTION_ONLY", reason: "Awaiting acceptance." } });
research.createAnchor(source);
research.createAnchor(blocked);
const deskBefore = JSON.stringify(research.getDesk());

const runtime = new AuthorDocumentRuntime();
runtime.activateInvestigation("inv:a");
runtime.setActiveDocument({ identity: { id: "draft:a", createdAt: at }, metadata: { title: "Production draft", description: "", author: "", modifiedAt: at, version: 1 }, type: AuthorDocumentTypes.DOCUMENT, status: AuthorDocumentStatuses.NEW, nodes: [] });
const reference = createAuthorReferenceFromResearchAnchor(source, `research-reference:${source.anchorId}`, at);
assert.equal(runtime.insertNode(reference), "INSERTED");
assert.equal(runtime.getActiveDocument()?.nodes[0], reference, "typed source is immediately visible in canonical draft");
assert.deepEqual(reference.researchSource, { anchorId: source.anchorId, sourceKind: source.kind, sourceIdentity: source.sourceIdentity, sourceInvestigationId: source.investigationId, sourceWorkspace: source.sourceWorkspace, sourceRevisionId: source.sourceRevisionId, sourceExecutionId: source.sourceExecutionId, sourceProjectionId: source.sourceProjectionId, classification: source.classification, insertability: source.insertability, capturedRepresentation: source.capturedRepresentation }, "exact provenance survives insertion");
assert.equal(JSON.stringify(research.getDesk()), deskBefore, "Research Inbox is unchanged by insertion");
assert.throws(() => createAuthorReferenceFromResearchAnchor(blocked, "blocked"), /inspection-only/i);
assert.equal(runtime.insertNode(createAuthorReferenceFromResearchAnchor(source, "another-id", at)), "DUPLICATE", "duplicates deterministically retain the existing block");

runtime.insertNode({ id: "narrative:1", type: AuthorNodeTypes.PARAGRAPH, text: "Authored analysis" } as never);
assert.equal(runtime.moveNode("narrative:1", "UP"), true);
assert.deepEqual(runtime.getActiveDocument()?.nodes.map(node => node.id), ["narrative:1", reference.id]);
assert.equal(runtime.removeNode(reference.id), true);
assert.equal(runtime.getActiveDocument()?.nodes.some(node => node.id === reference.id), false);
assert.equal(research.projectInvestigation({ investigationId: "inv:a" }).entries.find(entry => entry.anchor.anchorId === source.anchorId)?.anchor.sourceIdentity, source.sourceIdentity, "draft removal does not delete canonical Research source");

runtime.activateInvestigation("inv:b");
assert.equal(runtime.getActiveDocument(), undefined, "a fresh Investigation cannot see another draft");
runtime.setActiveDocument({ identity: { id: "draft:b", createdAt: at }, metadata: { title: "B", description: "", author: "", modifiedAt: at, version: 1 }, type: AuthorDocumentTypes.DOCUMENT, status: AuthorDocumentStatuses.NEW, nodes: [] });
assert.equal(runtime.insertNode(createAuthorReferenceFromResearchAnchor(source, "cross-investigation", at)), "INVESTIGATION_MISMATCH");
runtime.activateInvestigation("inv:a");
assert.equal(runtime.getActiveDocument()?.identity.id, "draft:a", "returning to an Investigation restores only its canonical draft");
assert.equal((runtime.getActiveDocument()?.nodes.find(node => node.id === "narrative:1") as { text: string }).text, "Authored analysis");
assert.equal((reference as ReferenceNode).title, "Typed evidence");

console.log("PASS VerifyStudioStructuredAuthoringCanvas — structure, canonical ownership, insertion, exact provenance, duplicate rejection, isolation, editing operations, explicit states and Inbox regression verified");
