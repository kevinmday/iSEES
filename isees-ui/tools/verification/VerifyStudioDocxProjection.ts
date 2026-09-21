import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { decodeExportStatus } from "../../src/studio/v1/api/StudioV1AuthorDecoders.ts";

const toolbar = readFileSync(new URL("../../src/author/components/StudioToolbar.tsx", import.meta.url), "utf8");
const client = readFileSync(new URL("../../src/studio/v1/api/StudioV1AuthorApiClient.ts", import.meta.url), "utf8");
const adapter = readFileSync(new URL("../../src/studio/v1/runtime/StudioV1AuthorAdapter.ts", import.meta.url), "utf8");
const mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const decoded = decodeExportStatus({exportId:"e",projectionId:"p",artifactId:"a",revisionId:"r",revisionNumber:1,
  sourceHash:`sha256:${"0".repeat(64)}`,format:"DOCX",state:"CURRENT",rendererVersion:"studio-v1-python-docx/1",
  templateProfileVersion:"investigation-report-docx/1",configurationHash:`sha256:${"1".repeat(64)}`,
  exportedAt:"2026-09-21T18:00:00.000Z",outputHash:`sha256:${"2".repeat(64)}`,mediaType:mime,
  filename:"safe.docx",byteLength:100,failureCode:null,failureMessage:null,downloadAvailable:true});
assert.equal(decoded.format,"DOCX");
assert.match(toolbar,/Export Current Draft DOCX/);
assert.match(toolbar,/Export Saved Revision DOCX/);
assert.match(toolbar,/disabled=\{!saveAction\.state\.headRevisionId\}/);
assert.match(toolbar,/URL\.revokeObjectURL\(url\)/);
assert.match(toolbar,/Unsaved changes are not included/);
assert.match(client,new RegExp(mime.replaceAll(".","\\.")));
assert.match(client,/current-draft\/exports\/docx/);
assert.match(adapter,/adaptCurrentDraftDocxRequest/);
assert.doesNotMatch(adapter,/PDF bytes|convert.*PDF/i);
console.log("PASS VerifyStudioDocxProjection — contracts, availability, MIME, download cleanup, and independent request path verified");
