import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hasDurableArtifactVersion, isExpectedUnsavedArtifact, STUDIO_ARTIFACT_EMPTY_ACTION, STUDIO_ARTIFACT_EMPTY_MESSAGE, STUDIO_PROJECTION_EMPTY_MESSAGE } from "../../src/studio/components/StudioArtifactInspectorSemantics.ts";

const inspector = readFileSync("src/studio/components/StudioArtifactInspector.tsx", "utf8");
const api = readFileSync("src/studio/api/StudioApi.ts", "utf8");
const notFound = { kind: "ERROR", code: "STUDIO_ARTIFACT_NOT_FOUND", message: "Studio artifact was not found" };

assert.equal(isExpectedUnsavedArtifact(notFound, true), true, "canonical not-found for a valid active document is expected empty state");
assert.equal(isExpectedUnsavedArtifact(notFound, false), false, "not-found without a valid active document remains fail-closed");
for (const failure of [{ kind: "UNAVAILABLE_BACKEND" }, { kind: "ERROR", code: "UNEXPECTED" }, { kind: "FORBIDDEN", code: "STUDIO_ARTIFACT_FORBIDDEN" }]) assert.equal(isExpectedUnsavedArtifact(failure, true), false, "network, unexpected, and ownership failures remain errors");
assert.equal(hasDurableArtifactVersion(undefined, undefined, undefined), false);
assert.equal(hasDurableArtifactVersion("artifact:1", "version:1", "version:1"), true);
assert.equal(hasDurableArtifactVersion("artifact:1", "version:1", "version:2"), false, "mismatched version cannot enable projections");
assert.ok(inspector.includes('setState("NOT_CREATED"); setMessage(STUDIO_ARTIFACT_EMPTY_MESSAGE)'), "expected not-found renders neutral NOT CREATED");
assert.ok(inspector.includes('setState(exact ? "READY" : expectedDocument ? "NOT_CREATED" : "EMPTY")'), "an empty artifact list for an active document uses the same neutral state");
assert.ok(inspector.includes(STUDIO_ARTIFACT_EMPTY_MESSAGE) || inspector.includes("STUDIO_ARTIFACT_EMPTY_MESSAGE"));
assert.ok(inspector.includes("STUDIO_ARTIFACT_EMPTY_ACTION"));
assert.ok(inspector.includes("STUDIO_PROJECTION_EMPTY_MESSAGE"));
assert.match(inspector, /setArtifact\(undefined\);\s*setPreview\(undefined\);[\s\S]*setState\("LOADING"\)/, "refresh and identity changes clear stale artifact, preview, and error state");
assert.match(inspector, /disabled=\{!durableVersionExists \|\| dirty \|\| Boolean\(inFlight\)\}[\s\S]*?>Validate/);
assert.match(inspector, /disabled=\{!durableVersionExists\}[\s\S]*?>Preview/);
assert.match(inspector, /\{durableVersionExists && preview === format &&/, "empty state cannot expose stale browser-only preview");
assert.equal((inspector.match(/>Preview<\/button>/g) ?? []).length, 1, "one shared durable-version rule covers PDF, DOCX, and HTML");
assert.match(inspector, /const saveReason = !scope[\s\S]*activeArtifact && !dirty[\s\S]*Versions may be saved only/, "Save Draft prerequisites remain intact");
assert.match(api, /const code = body\?\.error\?\.code/); assert.match(api, /new StudioApiError\(kind, message, code, body\?\.error\?\.requestId\)/, "canonical API code and canonical-envelope request identity remain available without changing HTTP semantics");
assert.doesNotMatch(inspector, /STUDIO_ARTIFACT_NOT_FOUND[\s\S]*FORBIDDEN/, "classification does not weaken ownership handling");
for (const copy of [STUDIO_ARTIFACT_EMPTY_MESSAGE, STUDIO_ARTIFACT_EMPTY_ACTION, STUDIO_PROJECTION_EMPTY_MESSAGE]) assert.ok(copy.length > 0);

console.log("PASS VerifyStudioArtifactInspectorEmptyState — canonical unsaved-artifact classification, fail-closed errors, identity reset, durable-version projection gates, empty copy, preview suppression, and unchanged save prerequisites verified");
