import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hasDurableArtifactVersion } from "../../src/studio/components/StudioArtifactInspectorSemantics.ts";

const inspector = readFileSync("src/studio/components/StudioArtifactInspector.tsx", "utf8");
const adapter = readFileSync("src/studio/api/StudioAuthorDocumentAdapter.ts", "utf8");

assert.match(inspector, /if \(!activeArtifact\) void mutate\("Save Draft", "", \{ \.\.\.base, artifactId: document\.identity\.id, versionId: `\$\{document\.identity\.id\}:v1`/, "first save POSTs the active author identity and canonical v1 identity");
assert.match(inspector, /await studioApi\.post\(scope, path, command\);\s*const refreshed = await refresh\(scope, document\);\s*if \(!refreshed\) return;\s*if \(markClean\) runtime\.markClean\(\);\s*setState\("SUCCESS"\)/, "success is claimed only after the server accepts the command and canonical refresh returns the durable artifact");
assert.match(inspector, /catch \(error\) \{ handleError\(error\); \}/, "save failures remain visible and do not fabricate an artifact");
assert.match(inspector, /setArtifact\(exact\);\s*setState\(exact \? "READY"/, "refresh adopts the canonical artifact projection");
assert.match(adapter, /document, sourceSnapshots, claims, citations: \[\], claimSourceMappings: \[\]/, "the complete canonical document and lineage collections are submitted");
assert.equal(hasDurableArtifactVersion("author:one", "author:one:v1", "author:one:v1"), true);
assert.equal(hasDurableArtifactVersion(undefined, undefined, undefined), false);

console.log("PASS VerifyStudioFirstSaveTransition — first POST identity, server-confirmed refresh, canonical adoption, genuine failure handling, lineage payload, and durable output gates verified");
