import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const inspector=readFileSync("src/studio/components/StudioArtifactInspector.tsx","utf8");
assert.match(inspector,/v1Durable \? <section[\s\S]*Authoritative immutable AuthorRevision/,"saved V1 revision owns authority presentation");
assert.match(inspector,/Saved \.author revision \{saveAction\.state\.revisionNumber\}/,"inspector truthfully names the saved revision");
assert.match(inspector,/Saving does not register Candidate Knowledge or publish, promote, or submit this revision/,"save boundary is explicit");
assert.doesNotMatch(inspector,/lifecycleClassification === "CANDIDATE_KNOWLEDGE"/,"legacy label is never treated as registration proof");
assert.match(inspector,/v1Durable \? <section[\s\S]*Authoritative \.author revision \{saveAction\.state\.revisionNumber\}/,"saved lineage identifies the exact immutable V1 revision");
assert.match(inspector,/saveAction\.state\.sourceSnapshotCount[\s\S]*saveAction\.state\.citationCount[\s\S]*saveAction\.state\.claimCount/,"saved lineage counts derive from Studio V1 state");
assert.match(inspector,/No source-backed lineage is recorded for \.author revision \{saveAction\.state\.revisionNumber\}/,"zero snapshots describe exact saved revision rather than absence of authority");
assert.match(inspector,/These counts describe the last saved revision[\s\S]*local changes remain unsaved/,"dirty state preserves last-saved lineage");
assert.match(inspector,/v1AuthorityUnavailable[\s\S]*Studio V1 authority cannot be established/,"missing or failed V1 authority fails closed");
assert.match(inspector,/v1Durable[\s\S]*requires a future governed Studio V1 lifecycle command/,"V1 lifecycle actions are honestly disabled");
assert.match(inspector,/v1Durable \?[\s\S]*: <section className="studio-inspector__card"><h3>Knowledge lifecycle/,"legacy lifecycle is only the no-V1 fallback");
assert.match(inspector,/v1Durable \?[\s\S]*: <section className="studio-inspector__card"><h3>Source &amp; claim lineage/,"legacy lineage is only the no-V1 fallback");
assert.doesNotMatch(inspector,/v1Durable \?[^:]*Create and save a draft first/,"saved V1 branch never renders legacy unsaved guidance");
assert.doesNotMatch(inspector,/v1Durable \?[^:]*until a canonical artifact version is saved/,"saved V1 branch never denies its canonical revision");
console.log("PASS VerifyStudioV1InspectorAuthority — saved AuthorRevision authority, exact lineage, no-registration boundary, dirty preservation, failure, and legacy-isolation checks passed.");
