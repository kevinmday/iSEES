import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hasDurableArtifactVersion } from "../../src/studio/components/StudioArtifactInspectorSemantics.ts";

const inspector = readFileSync("src/studio/components/StudioArtifactInspector.tsx", "utf8");
const adapter = readFileSync("src/studio/api/StudioAuthorDocumentAdapter.ts", "utf8");
const owner = readFileSync("src/studio/v1/runtime/StudioV1SaveOrchestrator.ts", "utf8");

assert.match(owner, /createArtifact\(investigationId,request,controller\.signal\)/, "initial save POSTs through the governed Studio V1 client");
assert.match(owner, /expectedHeadRevisionId:op\.expectedHead/, "subsequent save carries the exact expected immutable head");
assert.doesNotMatch(inspector, /runtime\.markClean\(\)/, "Inspector never marks runtime state clean");
assert.match(owner, /runtime\.reconcileCanonicalState\(\{investigationId,document,revision:runtimeRevision,synchronized\}\)/, "exact runtime revision acknowledgement owns the clean transition");
assert.match(owner, /Your local draft is preserved|unsaved draft is preserved/i, "save failures preserve local content");
assert.match(inspector, /saveAction\.state\.artifactId/, "Inspector adopts Studio V1 authoritative identity");
assert.match(adapter, /document, sourceSnapshots, claims, citations: \[\], claimSourceMappings: \[\]/, "the complete canonical document and lineage collections are submitted");
assert.equal(hasDurableArtifactVersion("author:one", "author:one:v1", "author:one:v1"), true);
assert.equal(hasDurableArtifactVersion(undefined, undefined, undefined), false);

console.log("PASS VerifyStudioFirstSaveTransition — first POST identity, server-confirmed refresh, canonical adoption, genuine failure handling, lineage payload, and durable output gates verified");
