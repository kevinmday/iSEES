import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ARTIFACT_PROFILES, ASSISTANCE_MODES, CITATION_STYLES, GOVERNED_CONCLUSIONS, PROHIBITED_STUDIO_MUTATIONS, PROJECTION_FORMATS, PROJECTION_STATES, SEMANTIC_NODE_TYPES, type SensitiveSourceDirectives } from "../../src/studio/contracts/StudioV1Contract.ts";
import { canonicalSerialize, canonicalSha256, effectiveSensitivity, validateAuthorRevision, validateInference, validateProjection, validateProjectionTransition, validateProposal, validateSnapshot } from "../../src/studio/contracts/StudioCanonicalSerialization.ts";

const fixturePath = fileURLToPath(new URL("../../../contracts/studio-v1/fixtures/studio-v1-contract-fixtures.json", import.meta.url));
const fixtures = JSON.parse(readFileSync(fixturePath, "utf8"));
const clone = <T>(value: T): T => structuredClone(value);
// Fixtures are deliberately mutated into invalid wire shapes at this verifier boundary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rejects = (mutate: (value: any) => void, root: "scientificRevision" | "inferenceAssessment" = "scientificRevision") => {
  const value = clone(fixtures[root]); mutate(value); assert.throws(() => root === "scientificRevision" ? validateAuthorRevision(value) : validateInference(value));
};

assert.deepEqual(fixtures.vocabulary.artifactProfiles, ARTIFACT_PROFILES);
assert.deepEqual(fixtures.vocabulary.citationStyles, CITATION_STYLES);
assert.deepEqual(fixtures.vocabulary.semanticNodeTypes, SEMANTIC_NODE_TYPES);
assert.deepEqual(fixtures.vocabulary.projectionFormats, PROJECTION_FORMATS);
assert.deepEqual(fixtures.vocabulary.projectionStates, PROJECTION_STATES);
assert.deepEqual(fixtures.vocabulary.assistanceModes, ASSISTANCE_MODES);
assert.deepEqual(fixtures.vocabulary.governedConclusions, GOVERNED_CONCLUSIONS);
assert.equal(fixtures.invalidFixtures.length, 10);
assert.deepEqual(PROHIBITED_STUDIO_MUTATIONS, ["SYSTEM_CANON", "INVESTIGATION_EVIDENCE", "DETERMINISTIC_RESULTS", "RESEARCH_INBOX", "SOURCE_SYSTEMS", "INTENTION"]);
validateAuthorRevision(fixtures.scientificRevision);
validateSnapshot(fixtures.entireInboxSnapshot);
validateInference(fixtures.inferenceAssessment);
validateProposal(fixtures.proposal);
validateProjection(fixtures.projections[0], fixtures.scientificRevision.contentHash);
validateProjection(fixtures.projections[1], fixtures.projections[1].parentContentHash);
validateProjection(fixtures.projections[2], fixtures.scientificRevision.contentHash);
validateProjectionTransition("CURRENT", "STALE"); validateProjectionTransition("FAILED", "QUEUED"); assert.throws(() => validateProjectionTransition("PUBLISHED", "CURRENT"));
assert.equal(canonicalSha256(fixtures.scientificRevision.semanticContent), fixtures.scientificRevision.contentHash);
const snapshotDomain = clone(fixtures.entireInboxSnapshot); delete snapshotDomain.snapshotHash;
assert.equal(canonicalSha256(snapshotDomain), fixtures.entireInboxSnapshot.snapshotHash);
assert.equal(canonicalSerialize({ z: 1, a: ["é", true] }), '{"a":["é",true],"z":1}');

rejects(v => { v.artifactId = " "; });
rejects(v => { v.semanticContent.nodes[1].id = v.semanticContent.nodes[0].id; v.semanticContent.nodeOrder[1] = v.semanticContent.nodeOrder[0]; });
rejects(v => { v.unknownField = true; });
rejects(v => { v.semanticContent.citations[0].completeness = "COMPLETE"; v.semanticContent.citations[0].missingRequiredFields = ["publisher"]; });
rejects(v => { v.governedConclusion.conclusion = "PROVEN"; }, "inferenceAssessment");
rejects(v => { v.governedConclusion.conclusion = "H0_REJECTED_UNDER_DECLARED_TEST"; delete v.governedConclusion.declaredTest; }, "inferenceAssessment");
rejects(v => { v.intentionResults[0].completionStatus = "RUNNING"; }, "inferenceAssessment");
rejects(v => { v.confidence = 0.9; }, "inferenceAssessment");
assert.throws(() => validateProjection(fixtures.projections[0], "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"));
assert.throws(() => validateProposal(fixtures.proposal, "artifact-paper-1.r2", fixtures.scientificRevision.contentHash));
const restricted = fixtures.entireInboxSnapshot.sources[1].sensitivity as SensitiveSourceDirectives;
const effective = effectiveSensitivity([fixtures.entireInboxSnapshot.sources[0].sensitivity, restricted]);
assert.equal(effective.excludeFromAiProcessing, true); assert.equal(effective.includeInAnalysis, false); assert.equal(effective.citePublicly, false); assert.equal(effective.restrictedAppendix, true);
assert.equal(fixtures.proposal.authorityState, "UNAPPLIED_PROPOSAL");
assert.ok(fixtures.proposal.units.every((unit: { state: unknown }) => unit.state === "UNAPPLIED"));
assert.equal(fixtures.inferenceAssessment.invocationOwner, "STUDIO");
assert.ok(Object.values(fixtures.inferenceAssessment.intentionCapabilities).every(value => value === "PROHIBITED"));
console.log("P57-UI-A23-I1 TypeScript contract verification passed");
