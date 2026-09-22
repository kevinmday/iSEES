import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GOVERNED_ORIENTATIONS, GOVERNED_ORIENTATION_V1, formatOrientationSpokenTranscript } from "../../src/guide/registry/GovernedOrientationV1.ts";
import { GUIDED_ORIENTATION_SCHEMA_ID, GUIDED_ORIENTATION_SCHEMA_VERSION } from "../../src/guide/contracts/GuidedOrientationContracts.ts";
import { WorkspaceMode } from "../../src/workspace/runtime/WorkspaceRuntimeTypes.ts";
import { getWorkspaceModeLabel } from "../../src/workspace/presentation/WorkspaceModePresentation.ts";

assert.equal(GOVERNED_ORIENTATIONS.length, 1, "exactly one governed orientation must exist");
assert.equal(GOVERNED_ORIENTATION_V1.schemaId, GUIDED_ORIENTATION_SCHEMA_ID);
assert.equal(GOVERNED_ORIENTATION_V1.schemaVersion, GUIDED_ORIENTATION_SCHEMA_VERSION);
assert.equal(GOVERNED_ORIENTATION_V1.chapters.length, 8, "v1 must contain exactly eight chapters");
assert.deepEqual(GOVERNED_ORIENTATION_V1.chapters.map(chapter => chapter.title), [
  "Welcome to iSEES", "How an Investigation Works", "Understanding the Manifold", "The Analytical Workspaces",
  "Evidence and Authority", "The Research Inbox", "The `.author` Research Product", "Your First Research Mission",
]);

const ids = GOVERNED_ORIENTATION_V1.chapters.map(chapter => chapter.chapterId);
assert.equal(new Set(ids).size, 8, "chapter IDs must be unique");
GOVERNED_ORIENTATION_V1.chapters.forEach((chapter, index) => {
  assert.match(chapter.chapterId, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, "chapter IDs must be deterministic slugs");
  assert.ok(chapter.visibleTranscript.length > 0 && chapter.visibleTranscript.every(Boolean), `${chapter.title} needs visible content`);
  assert.equal(chapter.spokenTranscript, formatOrientationSpokenTranscript(chapter.visibleTranscript), `${chapter.title} audible content must derive from visible content`);
  assert.equal(chapter.previousChapterId, index === 0 ? undefined : ids[index - 1]);
  assert.equal(chapter.nextChapterId, index === ids.length - 1 ? undefined : ids[index + 1]);
  assert.equal(chapter.permitsAuthoritativeMutation, false);
  if (chapter.recommendedMode) assert.ok(Object.values(WorkspaceMode).includes(chapter.recommendedMode));
});
assert.equal(getWorkspaceModeLabel(WorkspaceMode.RESEARCH), "STUDIO", "authoritative RESEARCH to STUDIO presentation mapping must remain intact");
assert.match(GOVERNED_ORIENTATION_V1.authorityBoundary, /explicit governed researcher actions/);
assert.match(GOVERNED_ORIENTATION_V1.advisoryBoundary, /never executes/);

const dialog = readFileSync("src/guide/components/GuidedOrientationDialog.tsx", "utf8");
const invitation = readFileSync("src/workspace/surfaces/GuestWelcomeOverview.tsx", "utf8");
const adapter = readFileSync("src/guide/context/OperationalGuideContextAdapter.tsx", "utf8");
assert.doesNotMatch(dialog, /\.listen\([^)]*\)[\s;]*\}\s*,\s*\[|autoPlay/i, "orientation must not autoplay");
assert.match(dialog, /sessionStorage/, "guest progress must use browser-session persistence");
assert.doesNotMatch(dialog + invitation, /useOperatorIdentity|authenticated|sign.?in|account required/i, "orientation access must not depend on authentication");
assert.match(adapter, /setActiveMode\(WorkspaceMode\.OVERVIEW\)/, "final mission action must use Workspace Runtime navigation");
assert.doesNotMatch(adapter, /beginExecution|publish|accept|setSelection|activateInvestigation/);
for (const action of ["Start Guided Orientation", "Read Instead", "Explore on My Own"]) assert.ok(invitation.includes(action));
console.log("VerifyGuidedOrientation: PASS (single governed v1, eight chapters, sequencing, authority, guest access, navigation, and mode alignment verified)");
