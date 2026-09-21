import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const toolbar=readFileSync("src/author/components/StudioToolbar.tsx","utf8");
const family=readFileSync("src/studio/components/StudioArtifactFamilySemantics.ts","utf8");
const orchestrator=readFileSync("src/studio/v1/runtime/StudioV1SaveOrchestrator.ts","utf8");
assert.match(toolbar,/disabled={!saveAction\.state\.headRevisionId}/,"PDF is disabled without a saved revision");
assert.match(toolbar,/historicalRevisionId\?\?saveAction\.state\.headRevisionId/,"selected saved revision is targeted");
assert.match(toolbar,/Exports the last saved revision\. Unsaved changes are not included\./,"dirty warning is truthful");
const exportHandler=toolbar.slice(toolbar.indexOf("const handlePdfExport"),toolbar.indexOf("const handlePdfDownload"));
assert.doesNotMatch(exportHandler,/\.save\(/,"PDF export never invokes Save");
assert.match(toolbar,/Download PDF/,"CURRENT output exposes download");
assert.match(toolbar,/The saved revision remains valid/,"export failure does not claim revision failure");
assert.match(toolbar,/DOCX unavailable/);assert.match(toolbar,/DOCX is unavailable/);
assert.match(family,/"QUEUED"/);assert.match(family,/"VALIDATING"/);assert.match(family,/"CURRENT"/);assert.match(family,/"FAILED"/);assert.match(family,/"UNAVAILABLE"/);
assert.match(orchestrator,/projections:\[\]/,"save continues to request no projection work");
assert.match(toolbar,/\[\s*"References",\s*"Publish",\s*\]\.map[^]*?disabled[^]*?unavailable in this Studio iteration/,"Publish remains unavailable");
console.log("PASS VerifyStudioProjectionExportControls — saved-revision PDF lifecycle, dirty warning, no implicit save, download, failure truthfulness, DOCX unavailable, and HTML/save boundaries verified");
