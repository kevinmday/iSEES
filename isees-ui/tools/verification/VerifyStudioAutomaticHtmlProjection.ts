import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AuthorDocumentRuntime } from "../../src/author/runtime/AuthorDocumentRuntime.ts";
import type { ComputationalAuthorDocument } from "../../src/author/model/AuthorDocument.ts";
import { projectCurrentDraftHtml } from "../../src/studio/projection/StudioHtmlProjection.ts";

const marker = "<script>alert('x')</script><img src=x onerror=alert(1)> javascript:alert(2)";
const base = (): ComputationalAuthorDocument => ({
  identity: { id: "author:preview", createdAt: new globalThis.Date("2026-01-01T00:00:00.000Z") },
  metadata: { title: `Preview & ${marker}`, description: marker, author: "Researcher", modifiedAt: new globalThis.Date("2026-01-02T00:00:00.000Z"), version: 1 },
  type: "DOCUMENT", status: "MODIFIED", nodes: [
    { id: "p", type: "PARAGRAPH", text: `Paragraph ${marker}` },
    { id: "h", type: "HEADING", level: 2, text: "Heading" },
    { id: "q", type: "QUOTE", text: marker },
    { id: "l", type: "LIST", items: ["One", { text: marker }] } as never,
    { id: "c", type: "CODE", code: marker } as never,
    { id: "t", type: "TABLE", rows: 2, columns: 3 },
    { id: "i", type: "IMAGE", source: marker },
    { id: "ci", type: "CITATION", citation: marker },
    { id: "r", type: "REFERENCE", targetType: "DOCUMENT", targetId: marker, title: marker, source: marker, corpusId: marker, insertedAt: new globalThis.Date("2026-01-01T00:00:00.000Z") },
    { id: "o", type: "OBSERVATION", text: marker, source: "AUTHOR", relatedReferences: [], createdAt: new globalThis.Date("2026-01-01T00:00:00.000Z") },
    { id: "d", type: "DIVIDER" } as never,
    { id: "x", type: "CUSTOM", label: marker } as never,
  ],
});

const one = base(), two = base();
const a = projectCurrentDraftHtml(one), b = projectCurrentDraftHtml(two);
assert.deepEqual(a, b, "identical content has byte-identical projection output and identities");
const reordered = { ...two, metadata: { version: 1, author: "Researcher", description: marker, title: `Preview & ${marker}`, modifiedAt: two.metadata.modifiedAt } } as ComputationalAuthorDocument;
assert.equal(projectCurrentDraftHtml(reordered).sourceHash, a.sourceHash, "object insertion order is not identity");
let cursor = -1;
for (const rendered of ["Paragraph", "Heading", "<blockquote>", "<ul>", "<pre><code>", "Table", "Image", "Citation", "reference", "Researcher observation", "<hr>", "Custom authored content"]) { const next = a.html.indexOf(rendered, cursor + 1); assert.ok(next > cursor, `${rendered} renders in authoritative node order`); cursor = next; }
assert.ok(!a.html.includes(marker), "researcher markup is never emitted raw");
assert.ok(a.html.includes("&lt;script&gt;") && !a.html.includes("<script>"), "script content is escaped");
assert.ok(!/<[^>]+\son(?:error|load|click)=/i.test(a.html), "no inline handler attribute is emitted");
assert.ok(!/href=["']?javascript:/i.test(a.html), "no executable URL is emitted");
const malformed = base(); malformed.nodes = [{ id: "broken", type: "PARAGRAPH" } as never];
assert.match(projectCurrentDraftHtml(malformed).html, /Unsupported or malformed PARAGRAPH content/, "malformed authoritative content is explicit");
const empty = base(); empty.nodes = [];
assert.match(projectCurrentDraftHtml(empty).html, /contains no authored blocks/, "empty document is honest");
const edited = base(); (edited.nodes[0] as { text: string }).text = "Changed";
assert.notEqual(projectCurrentDraftHtml(edited).sourceHash, a.sourceHash); assert.notEqual(projectCurrentDraftHtml(edited).html, a.html);
const retitled = base(); retitled.metadata.title = "Changed title";
assert.notEqual(projectCurrentDraftHtml(retitled).sourceHash, a.sourceHash); assert.notEqual(projectCurrentDraftHtml(retitled).html, a.html);
const clean = base(); clean.status = "SAVED";
assert.equal(projectCurrentDraftHtml(clean).projectionId, a.projectionId, "clean/dirty lifecycle does not affect content identity");
assert.ok(!a.html.includes("2026-"), "timestamps do not appear in generated output");

const runtime = new AuthorDocumentRuntime(); runtime.activateInvestigation("investigation:preview"); runtime.setActiveDocument(one);
const beforeDocument = JSON.stringify(one), beforeIdentity = one.identity, beforeRevision = runtime.getRevision(), beforeDirty = runtime.isDirty();
const first = projectCurrentDraftHtml(runtime.getActiveDocument()!); runtime.markDirty(); const triggerRevision = runtime.getRevision(); const second = projectCurrentDraftHtml(runtime.getActiveDocument()!);
assert.ok(triggerRevision > beforeRevision, "runtime observation revision advances"); assert.equal(first.projectionId, second.projectionId, "runtime revision is not content identity");
assert.equal(JSON.stringify(one), beforeDocument); assert.equal(one.identity, beforeIdentity); assert.equal(runtime.isDirty(), true); assert.equal(runtime.getActiveDocument(), one);
assert.equal(beforeDirty, false, "fixture began clean before independently exercising observation");

const projectionSource = readFileSync(new URL("../../src/studio/projection/StudioHtmlProjection.ts", import.meta.url), "utf8");
for (const forbidden of ["Date" + ".", "new " + "Date", "Math" + ".random", "crypto" + ".randomUUID", "fetch" + "(", "provider", "Candidate" + " Knowledge", "MANI" + "FOLD", "REX", "AI drafting"]) assert.ok(!projectionSource.includes(forbidden), `projection excludes ${forbidden}`);
const component = readFileSync(new URL("../../src/studio/components/StudioHtmlProjectionPreview.tsx", import.meta.url), "utf8");
assert.match(component, /HTML PROJECTION — CURRENT DRAFT/); assert.match(component, /Disposable preview derived from the active \.author document\./); assert.match(component, /Not an authority record\./);
assert.match(component, /useAuthorDocumentRevision/); assert.match(component, /sandbox=""/); assert.doesNotMatch(component, /dangerouslySetInnerHTML|fetch\(|studioApi/);
const inspector = readFileSync(new URL("../../src/studio/components/StudioArtifactInspector.tsx", import.meta.url), "utf8"); assert.match(inspector, /<StudioHtmlProjectionPreview \/>/);
const save = readFileSync(new URL("../../src/studio/v1/runtime/StudioV1SaveOrchestrator.ts", import.meta.url), "utf8"); assert.match(save, /projections:\[\]/, "explicit Save still requests no projections");
console.log("PASS VerifyStudioAutomaticHtmlProjection — deterministic local current-draft HTML, complete node vocabulary, escaping, sandboxing, runtime isolation, and Save boundary verified");
