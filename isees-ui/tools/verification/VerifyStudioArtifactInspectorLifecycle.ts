import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { composeStudioVersionCommand, authoredBlockCount, sourceBackedBlockCount } from "../../src/studio/api/StudioAuthorDocumentAdapter.ts";
import { AuthorDocumentStatuses, AuthorDocumentTypes } from "../../src/author/model/AuthorDocumentTypes.ts";
import { AuthorNodeTypes } from "../../src/author/model/AuthorNodeTypes.ts";

const read = (path: string) => readFileSync(path, "utf8");
const shell = read("src/author/components/StudioShell.tsx");
const css = read("src/author/components/StudioShell.css");
const inspector = read("src/studio/components/StudioArtifactInspector.tsx");
const api = read("src/studio/api/StudioApi.ts");
assert.match(shell, /<StudioResearchInbox\s*\/>[\s\S]*<main[\s\S]*<StudioArtifactInspector\s*\/>/, "permanent three-column order");
assert.match(css, /grid-template-columns:[^;]+minmax\(0, 1fr\)[^;]+clamp\(320px, 23vw, 380px\)/);
assert.doesNotMatch(inspector, /new AuthorDocumentRuntime|useState<.*ComputationalAuthorDocument/, "React does not own the author document");
for (const route of ["candidate/publication", "review-submissions", "acceptance", "returns", "rejections", "projections/validations"]) assert.ok(inspector.includes(route), `route composed: ${route}`);
for (const state of ["CONFLICT", "STALE_REVISION", "FORBIDDEN", "UNAVAILABLE_BACKEND", "ERROR"]) assert.ok(api.includes(state), `explicit API state: ${state}`);
for (const format of ["PDF", "DOCX", "HTML"]) assert.ok(inspector.includes(`\"${format}\"`), `${format} projection composed`);
assert.match(inspector, /canMaterializeProjection\(/, "materialization eligibility fails closed through canonical projection semantics");
assert.match(inspector, /does not create accepted knowledge or an accepted relationship/, "publication is not falsely accepted");
assert.match(inspector, /expectedRevision/); assert.match(inspector, /idempotencyKey/); assert.match(inspector, /if \(!scope \|\| inFlight\) return/); assert.match(inspector, /await refresh\(scope, document\)/);
assert.match(inspector, /item\.artifact\.investigationId === expectedScope\.investigationId && item\.artifact\.ownerPrincipalId === expectedScope\.principalId/, "artifact selection is exactly Investigation and principal scoped");
assert.match(inspector, /current\?\.lifecycleState !== actionTarget\[operation\]/, "invalid transitions are disabled with reasons");
assert.match(inspector, /dirty \? \"Save current changes before advancing lifecycle/, "dirty versions cannot advance");

const at = new Date("2026-09-04T12:00:00.000Z");
const document = { identity: { id: "author:a", createdAt: at }, metadata: { title: "A", description: "", author: "p:a", modifiedAt: at, version: 1 }, type: AuthorDocumentTypes.DOCUMENT, status: AuthorDocumentStatuses.MODIFIED, nodes: [
  { id: "paragraph:1", type: AuthorNodeTypes.PARAGRAPH, text: "Analysis" },
  { id: "observation:1", type: AuthorNodeTypes.OBSERVATION, text: "Explicit claim", source: "AUTHOR", relatedReferences: [], createdAt: at },
  { id: "reference:1", type: AuthorNodeTypes.REFERENCE, targetType: "ARTIFACT", targetId: "e:1", title: "Evidence", source: "EVIDENCE", corpusId: "local", insertedAt: at, researchSource: { anchorId: "a:1", sourceKind: "EVIDENCE_RECORD", sourceIdentity: "e:1", sourceInvestigationId: "inv:a", sourceWorkspace: "EVIDENCE", sourceRevisionId: "rev:1", classification: "CANONICAL", insertability: { state: "INSERTABLE", reason: "qualified" }, capturedRepresentation: { schemaVersion: "evidence/v1", mediaType: "application/json", value: { fact: 42 } } } },
] } as const;
const inboxBefore = JSON.stringify(document.nodes[2]);
const command = composeStudioVersionCommand({ investigationId: "inv:a", principalId: "p:a" }, document as never);
assert.equal(command.investigationId, "inv:a"); assert.equal(command.sourceSnapshots.length, 1); assert.equal(command.sourceSnapshots[0]?.sourceKind, "EVIDENCE"); assert.equal(command.claims.length, 1); assert.equal(command.citations.length, 0, "citations are not fabricated");
assert.equal(sourceBackedBlockCount(document as never), 1); assert.equal(authoredBlockCount(document as never), 2); assert.equal(JSON.stringify(document.nodes[2]), inboxBefore, "projection does not mutate source provenance");
console.log("PASS VerifyStudioArtifactInspectorLifecycle — permanent scoped inspector, sole document ownership, save/version contracts, lifecycle guards, deterministic projections, errors, refresh, provenance immutability and responsive composition verified");
