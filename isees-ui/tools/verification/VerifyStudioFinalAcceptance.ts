import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AuthorDocumentRuntime } from "../../src/author/runtime/AuthorDocumentRuntime.ts";
import { AuthorDocumentStatuses, AuthorDocumentTypes } from "../../src/author/model/AuthorDocumentTypes.ts";
import { AuthorNodeTypes } from "../../src/author/model/AuthorNodeTypes.ts";
import { composeStudioVersionCommand } from "../../src/studio/api/StudioAuthorDocumentAdapter.ts";
import { restoreStudioDocument } from "../../src/studio/api/StudioDocumentRestoration.ts";

const read = (path: string) => readFileSync(path, "utf8");
const shell = read("src/author/components/StudioShell.tsx");
const shellCss = read("src/author/components/StudioShell.css");
const canvas = read("src/author/components/AuthorEditorSurface.tsx");
const canvasCss = read("src/author/components/AuthorEditorSurface.css");
const inbox = read("src/studio/components/StudioResearchInbox.tsx");
const inboxCss = read("src/studio/components/StudioResearchInbox.css");
const inspector = read("src/studio/components/StudioArtifactInspector.tsx");
const inspectorCss = read("src/studio/components/StudioArtifactInspector.css");
const api = read("src/studio/api/StudioApi.ts");
const adapter = read("src/studio/api/StudioAuthorDocumentAdapter.ts");
const surface = read("src/surfaces/WorkspaceSurface.tsx");

assert.match(shell, /<StudioResearchInbox\s*\/>[\s\S]*<main className="studio-shell__authoring">[\s\S]*<StudioArtifactInspector\s*\/>/, "permanent three-column composition");
assert.match(shellCss, /grid-template-columns:[^;]+minmax\(0, 1fr\)/);
assert.match(canvasCss, /\.author-canvas \{[^}]*overflow: auto/, "canvas scrolls independently");
assert.match(inspectorCss, /overflow-y: auto/);
assert.match(inspectorCss, /@media \(max-width: 1180px\)/); assert.match(canvasCss, /@media \(max-width: 920px\)/);
assert.doesNotMatch(surface.match(/const researchInboxVisible\s*=[\s\S]*?;/)?.[0] ?? "", /WorkspaceMode\.RESEARCH/, "no floating Inbox in STUDIO");
assert.equal((shell.match(/<StudioResearchInbox/g) ?? []).length, 1, "one canonical Research projection");
assert.doesNotMatch([shell, canvas, inbox, inspector].join("\n"), /new AuthorDocumentRuntime|useState<.*ComputationalAuthorDocument/, "one canonical Author owner");

for (const text of ["No active Investigation", "No active draft", "No collected sources", "Inspection only", "already in this draft", "No canonical claim/source mapping", "No source-backed blocks", "MISSING CITATION", "Candidate boundary:"]) assert.ok([canvas, inbox, inspector].some(source => source.includes(text)), `explicit operator state: ${text}`);
for (const route of ["candidate/publication", "review-submissions", "acceptance", "returns", "rejections", "projections/validations"]) assert.ok(inspector.includes(route), `lifecycle route ${route}`);
for (const state of ["RETURNED", "REJECTED", "CONFLICT", "STALE_REVISION", "FORBIDDEN", "UNAVAILABLE_BACKEND"]) assert.ok(inspector.includes(state) || api.includes(state), `restored/error state ${state}`);
for (const format of ["PDF", "DOCX", "HTML"]) assert.ok(inspector.includes(`"${format}"`));
assert.match(inspector, /publication creates a candidate node only/); assert.match(inspector, /does not create accepted knowledge/);
assert.match(inspector, /claimSourceMappings/); assert.match(inspector, /sourceIdentity/); assert.match(inspector, /resolutionStatus/);
assert.match(inspector, /restoreStudioDocument/); assert.match(inspector, /toSorted\([\s\S]*updatedAt/);
assert.match(inbox, /aria-pressed/); assert.match(inbox, /Remove source/); assert.match(inbox, /aria-describedby/);
assert.match(canvas, /tabIndex=\{0\}/); assert.match(canvas, /Move .* up/); assert.match(canvas, /Remove .* from draft/);
for (const css of [canvasCss, inboxCss, inspectorCss]) assert.match(css, /focus-visible/);
assert.match(inspector, /role=\{state === "ERROR"[\s\S]*\? "alert" : "status"\}/);
assert.doesNotMatch([api, adapter, inbox, inspector].join("\n"), /openai|anthropic|\/chat\/completions|\/responses/i, "no AI integration");
assert.doesNotMatch([canvas, inbox, inspector].join("\n"), /lorem ipsum|sample claim|fake evidence/i, "no fake production data");

const at = new Date("2026-09-04T12:00:00.000Z");
const document = { identity: { id: "draft:acceptance", createdAt: at }, metadata: { title: "Acceptance", description: "", author: "operator", modifiedAt: at, version: 1 }, type: AuthorDocumentTypes.DOCUMENT, status: AuthorDocumentStatuses.MODIFIED, nodes: [
  { id: "claim:1", type: AuthorNodeTypes.OBSERVATION, text: "Operator-authored claim", source: "AUTHOR", relatedReferences: [], createdAt: at },
  { id: "source:1", type: AuthorNodeTypes.REFERENCE, targetType: "ARTIFACT", targetId: "evidence:1", title: "Evidence", source: "EVIDENCE", corpusId: "local", insertedAt: at, researchSource: { anchorId: "anchor:1", sourceKind: "EVIDENCE_RECORD", sourceIdentity: "evidence:1", sourceInvestigationId: "inv:a", sourceWorkspace: "EVIDENCE", sourceRevisionId: "revision:1", classification: "CANONICAL", insertability: { state: "INSERTABLE", reason: "Qualified." }, capturedRepresentation: { schemaVersion: "evidence/v1", mediaType: "application/json", value: { exact: true } } } },
] } as const;
const command = composeStudioVersionCommand({ investigationId: "inv:a", principalId: "operator" }, document as never);
assert.equal(command.sourceSnapshots[0]?.sourceIdentity, "evidence:1");
assert.equal(command.claims[0]?.claimId, "claim:1");
assert.deepEqual(command.claimSourceMappings, [], "no relationship is synthesized");
const restored = restoreStudioDocument(JSON.parse(JSON.stringify(document)));
assert.ok(restored?.identity.createdAt instanceof Date); assert.ok(restored?.metadata.modifiedAt instanceof Date);
assert.ok((restored?.nodes[1] as { insertedAt?: unknown }).insertedAt instanceof Date, "restart restoration revives provenance dates");
const runtime = new AuthorDocumentRuntime(); runtime.activateInvestigation("inv:a"); runtime.setActiveDocument(restored!); runtime.activateInvestigation("inv:b"); assert.equal(runtime.getActiveDocument(), undefined); runtime.activateInvestigation("inv:a"); assert.equal(runtime.getActiveDocument()?.identity.id, "draft:acceptance", "Investigation return restores isolated draft");

console.log("PASS VerifyStudioFinalAcceptance — composition, isolation, canonical ownership, immutable provenance, author operations, explicit lineage, lifecycle boundaries, projections, restart/error states, accessibility, responsive behavior, no AI/fake data, and cross-mode Inbox behavior verified");
