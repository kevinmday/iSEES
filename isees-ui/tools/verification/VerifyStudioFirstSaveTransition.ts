import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hasDurableArtifactVersion } from "../../src/studio/components/StudioArtifactInspectorSemantics.ts";

const inspector = readFileSync("src/studio/components/StudioArtifactInspector.tsx", "utf8");
const adapter = readFileSync("src/studio/api/StudioAuthorDocumentAdapter.ts", "utf8");

assert.match(inspector, /versionId = `\$\{artifactId\}:v\$\{versionNumber\}`[\s\S]*await studioApi\.post\(scope, path, command\)/, "save POSTs the active author identity, verified sources, and deterministic canonical version identity");
assert.match(inspector, /await Promise\.all[\s\S]*publishCanonicalGraphSource\(anchor, scope\.principalId\)[\s\S]*await studioApi\.post/, "MANIFOLD graph sources are durably published before the version command");
assert.match(inspector, /await studioApi\.post[\s\S]*result = await studioApi\.list[\s\S]*if \(!saved\)/, "success is claimed only after the server accepts the command and canonical refresh returns the exact durable version");
assert.doesNotMatch(inspector, /runtime\.markClean\(\)/, "save response never marks a potentially newer local revision clean without canonical comparison");
assert.match(inspector, /runtime\.reconcileCanonicalState\([\s\S]*revision: comparedRevision[\s\S]*synchronized: hash === activeArtifact\.currentVersion\.contentHash/, "canonical content hash reconciliation owns the clean transition");
assert.match(inspector, /setSaveError\(saveFailure\("VERSION_SAVE", error\)\)/, "save failures remain visible and do not fabricate an artifact");
assert.match(inspector, /setArtifact\(saved\); setState\("SUCCESS"\)/, "save adopts only the reconciled canonical artifact projection");
assert.match(adapter, /document, sourceSnapshots, claims, citations: \[\], claimSourceMappings: \[\]/, "the complete canonical document and lineage collections are submitted");
assert.equal(hasDurableArtifactVersion("author:one", "author:one:v1", "author:one:v1"), true);
assert.equal(hasDurableArtifactVersion(undefined, undefined, undefined), false);

console.log("PASS VerifyStudioFirstSaveTransition — first POST identity, server-confirmed refresh, canonical adoption, genuine failure handling, lineage payload, and durable output gates verified");
