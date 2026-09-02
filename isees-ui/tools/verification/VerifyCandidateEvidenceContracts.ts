import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CANDIDATE_LIFECYCLE_TRANSITIONS,
  createCandidateEvidence,
  immutable,
  observeAvailability,
  transitionAcquisition,
  transitionArchive,
  transitionCandidate,
} from "../../src/evidence/candidates/CandidateEvidenceLifecycle.ts";
import { buildCandidateEvidenceQuery, CANDIDATE_QUERY_SCHEMA_VERSION } from "../../src/evidence/candidates/CandidateEvidenceQuery.ts";
import type { CandidateEvidence, CandidateLifecycleState } from "../../src/evidence/candidates/CandidateEvidenceTypes.ts";
import type { AdmitCandidateCommand, CandidateAdmissionReceipt } from "../../src/evidence/candidates/CandidateEvidenceMaterializationTypes.ts";

const human = { actorId: "reviewer-1", kind: "HUMAN" } as const;
const automation = { actorId: "connector-1", kind: "AUTOMATION" } as const;
const allStates: readonly CandidateLifecycleState[] = ["DISCOVERED", "SUBMITTED", "REFERENCED", "ACQUIRED", "IN_REVIEW", "ADMITTED", "DEFERRED", "EXCLUDED"];
function discovered(): CandidateEvidence {
  return createCandidateEvidence({ candidateId: "candidate-opaque-1", investigationId: "investigation-1", origin: "DISCOVERY", originIdentity: "result-7", lineage: { kind: "DISCOVERY", discoveredAt: "2026-09-02T00:00:00.000Z", querySpecification: { schemaVersion: "v1", query: "exact" }, connector: "ZENODO", connectorVersion: "1.2.3" }, source: { originalLocator: "https://Example.test/a", normalizedUrl: "https://example.test/a" }, association: { kind: "NODE", canonicalIdentity: "node-7", basis: "EXACT_CANONICAL_ID" } });
}
function atState(state: CandidateLifecycleState): CandidateEvidence {
  const base = discovered();
  const paths: Record<CandidateLifecycleState, readonly CandidateLifecycleState[]> = { DISCOVERED: [], SUBMITTED: [], REFERENCED: ["REFERENCED"], ACQUIRED: [], IN_REVIEW: ["REFERENCED", "IN_REVIEW"], ADMITTED: ["REFERENCED", "IN_REVIEW", "ADMITTED"], DEFERRED: ["REFERENCED", "IN_REVIEW", "DEFERRED"], EXCLUDED: ["REFERENCED", "IN_REVIEW", "EXCLUDED"] };
  if (state === "SUBMITTED") return createCandidateEvidence({ candidateId: "candidate-opaque-2", investigationId: "investigation-1", origin: "SUBMISSION", originIdentity: "submission-1", lineage: { kind: "SUBMISSION", submittedAt: "2026-09-02T00:00:00.000Z", submitterId: "researcher-1", submissionIdentity: "submission-1" } });
  if (state === "ACQUIRED") {
    const referenced = transitionCandidate(base, { expectedRevision: 0, to: "REFERENCED", actor: human, occurredAt: "2026-09-02T00:00:00.000Z", eventId: "acquired-reference" });
    const queued = transitionAcquisition(referenced, { expectedRevision: 1, to: "QUEUED", actor: automation, occurredAt: "2026-09-02T00:00:01.000Z", eventId: "acquired-queue" });
    const acquiring = transitionAcquisition(queued, { expectedRevision: 2, to: "ACQUIRING", actor: automation, occurredAt: "2026-09-02T00:00:02.000Z", eventId: "acquired-start" });
    const observed = transitionAcquisition(acquiring, { expectedRevision: 3, to: "ACQUIRED", actor: automation, occurredAt: "2026-09-02T00:00:03.000Z", eventId: "acquired-bytes", acquiredContent: { objectIdentity: "object-acquired", byteLength: 1, digest: { algorithm: "SHA-256", contentHash: "00" } } });
    return transitionCandidate(observed, { expectedRevision: 4, to: "ACQUIRED", actor: human, occurredAt: "2026-09-02T00:00:04.000Z", eventId: "acquired-lifecycle" });
  }
  return paths[state].reduce((candidate, to, index) => transitionCandidate(candidate, { expectedRevision: candidate.revision, to, actor: human, occurredAt: `2026-09-02T00:00:0${index}.000Z`, eventId: `event-${index}`, reviewDecision: to === "ADMITTED" ? { decision: "ADMITTED", reviewerId: human.actorId, decidedAt: "2026-09-02T00:00:02.000Z", reason: "Include reference in investigative record", admissionReceiptIdentity: "receipt-1", admittedArtifactId: "artifact-separate-1" } : to === "DEFERRED" || to === "EXCLUDED" ? { decision: to, reviewerId: human.actorId, decidedAt: "2026-09-02T00:00:02.000Z", reason: "Attributable review reason" } : undefined }), base);
}
function acquisitionReadyReferenced(): CandidateEvidence {
  const referenced = transitionCandidate(discovered(), { expectedRevision: 0, to: "REFERENCED", actor: human, occurredAt: "2026-09-02T00:00:00.000Z", eventId: "ready-reference" });
  const queued = transitionAcquisition(referenced, { expectedRevision: 1, to: "QUEUED", actor: automation, occurredAt: "2026-09-02T00:00:01.000Z", eventId: "ready-queue" });
  const acquiring = transitionAcquisition(queued, { expectedRevision: 2, to: "ACQUIRING", actor: automation, occurredAt: "2026-09-02T00:00:02.000Z", eventId: "ready-start" });
  return transitionAcquisition(acquiring, { expectedRevision: 3, to: "ACQUIRED", actor: automation, occurredAt: "2026-09-02T00:00:03.000Z", eventId: "ready-bytes", acquiredContent: { objectIdentity: "object-ready", byteLength: 1, digest: { algorithm: "SHA-256", contentHash: "01" } } });
}

for (const from of allStates) for (const to of allStates) {
  const candidate = from === "REFERENCED" && to === "ACQUIRED" ? acquisitionReadyReferenced() : atState(from);
  const valid = CANDIDATE_LIFECYCLE_TRANSITIONS[from].includes(to);
  const request = { expectedRevision: candidate.revision, to, actor: human, occurredAt: "2026-09-02T01:00:00.000Z", eventId: `test-${from}-${to}`, reviewDecision: to === "ADMITTED" ? { decision: "ADMITTED" as const, reviewerId: human.actorId, decidedAt: "2026-09-02T01:00:00.000Z", reason: "Human inclusion decision", admissionReceiptIdentity: "receipt-2", admittedArtifactId: "artifact-2" } : to === "DEFERRED" || to === "EXCLUDED" ? { decision: to, reviewerId: human.actorId, decidedAt: "2026-09-02T01:00:00.000Z", reason: "Human review reason" } : undefined };
  if (valid) assert.equal(transitionCandidate(candidate, request).lifecycleState, to, `${from} -> ${to} should be valid`);
  else assert.throws(() => transitionCandidate(candidate, request), /Prohibited/, `${from} -> ${to} should fail closed`);
}

const original = discovered();
assert.equal(original.availability, "UNKNOWN");
for (const state of ["UNAVAILABLE", "MISSING", "REDACTED", "AVAILABLE"] as const) assert.notEqual(observeAvailability(original, { expectedRevision: 0, to: state, actor: automation, occurredAt: "2026-09-02T02:00:00.000Z", eventId: `availability-${state}` }).availability, "UNKNOWN");
const queued = transitionAcquisition(original, { expectedRevision: 0, to: "QUEUED", actor: automation, occurredAt: "2026-09-02T02:00:00.000Z", eventId: "acq-1" });
const acquiring = transitionAcquisition(queued, { expectedRevision: 1, to: "ACQUIRING", actor: automation, occurredAt: "2026-09-02T02:01:00.000Z", eventId: "acq-2" });
assert.throws(() => transitionAcquisition(acquiring, { expectedRevision: 2, to: "ACQUIRED", actor: automation, occurredAt: "now", eventId: "bad" }), /object identity/);
const acquired = transitionAcquisition(acquiring, { expectedRevision: 2, to: "ACQUIRED", actor: automation, occurredAt: "2026-09-02T02:02:00.000Z", eventId: "acq-3", acquiredContent: { objectIdentity: "object-1", byteLength: 12, digest: { algorithm: "SHA-256", contentHash: "abc123" } } });
assert.equal(acquired.lifecycleState, original.lifecycleState); assert.equal(acquired.archiveState, original.archiveState); assert.equal(acquired.availability, original.availability);
const archiveQueued = transitionArchive(original, { expectedRevision: 0, to: "QUEUED", actor: automation, occurredAt: "2026-09-02T02:00:00.000Z", eventId: "archive-1" });
assert.equal(archiveQueued.lifecycleState, original.lifecycleState); assert.equal(archiveQueued.acquisitionState, original.acquisitionState); assert.equal(archiveQueued.availability, original.availability);
assert.throws(() => transitionCandidate(atState("IN_REVIEW"), { expectedRevision: 2, to: "ADMITTED", actor: automation, occurredAt: "now", eventId: "auto", reviewDecision: { decision: "ADMITTED", reviewerId: automation.actorId, decidedAt: "now", reason: "reason", admissionReceiptIdentity: "receipt", admittedArtifactId: "artifact" } }), /Automation cannot admit/);
assert.throws(() => transitionCandidate(atState("IN_REVIEW"), { expectedRevision: 2, to: "EXCLUDED", actor: human, occurredAt: "now", eventId: "exclude" }), /human review decision/);
assert.equal(atState("DEFERRED").lifecycleState, "DEFERRED"); assert.equal(transitionCandidate(atState("DEFERRED"), { expectedRevision: 3, to: "IN_REVIEW", actor: human, occurredAt: "now", eventId: "rereview" }).lifecycleState, "IN_REVIEW");
assert.throws(() => transitionCandidate(original, { expectedRevision: 0, to: "REFERENCED", actor: human, occurredAt: "now", eventId: "x", reviewDecision: { decision: "EXCLUDED", reviewerId: "x", decidedAt: "now", reason: "x" } }), /only valid/);
const referencedForContradiction = transitionCandidate(original, { expectedRevision: 0, to: "REFERENCED", actor: human, occurredAt: "now", eventId: "reference-only" });
assert.throws(() => transitionCandidate(referencedForContradiction, { expectedRevision: 1, to: "ACQUIRED", actor: human, occurredAt: "now", eventId: "contradictory-acquired" }), /completed acquisition/);
assert.throws(() => transitionCandidate(referencedForContradiction, { expectedRevision: 0, to: "IN_REVIEW", actor: human, occurredAt: "now", eventId: "replay" }), /revision conflict/, "equivalent stale replay was not explicitly rejected");
assert(Object.isFrozen(original) && Object.isFrozen(original.lineage) && Object.isFrozen(original.provenanceEvents));
assert.throws(() => { (original as unknown as { investigationId: string }).investigationId = "rewritten"; }, TypeError);
assert.equal(original.candidateId, "candidate-opaque-1"); assert.notEqual(original.candidateId, original.source.normalizedUrl); assert.notEqual(original.candidateId, acquired.acquiredContent?.digest.contentHash); assert.notEqual(original.candidateId, "artifact-separate-1");
assert.throws(() => createCandidateEvidence({ candidateId: "x", investigationId: "i", origin: "DISCOVERY", originIdentity: "o", lineage: { kind: "SUBMISSION", submittedAt: "now", submitterId: "s", submissionIdentity: "o" } }), /lineage kind/);

const queryInput = { investigationId: "investigation-1", targetConnector: "ZENODO", eventNames: ["  Event   Name ", "Event Name"], aliases: [{ canonicalIdentity: "node-1", value: "Alias \"A\"" }], dates: [{ start: "2004-11-14", end: "2004-11-15" }], locations: ["Pacific Ocean", "Pacific Ocean"], entities: [{ kind: "SENSOR" as const, canonicalIdentity: "sensor-1", value: "AN/SPY-1" }], citations: ["Citation \\ One"], dois: ["10.1/exact"], repositoryIdentifiers: [{ repository: "ZENODO", identifier: "123" }] };
const query = buildCandidateEvidenceQuery(queryInput);
const reordered = buildCandidateEvidenceQuery({ ...queryInput, eventNames: [...queryInput.eventNames].reverse(), locations: [...queryInput.locations].reverse() });
assert.equal(query.query, reordered.query); assert.equal(query.schemaVersion, CANDIDATE_QUERY_SCHEMA_VERSION); assert(Object.isFrozen(query) && Object.isFrozen(query.lineage) && Object.isFrozen(query.clauses));
assert.equal(JSON.stringify(query), JSON.stringify(reordered), "equivalent reordered inputs did not produce a byte-identical specification");
assert.equal(query.clauses.filter((v) => v.kind === "EVENT").length, 1); assert.deepEqual(query.clauses.map((v) => v.kind), ["EVENT", "ALIAS", "DATE", "LOCATION", "ENTITY", "CITATION", "DOI", "REPOSITORY_ID"]);
assert(query.query.includes('alias:"node-1"="Alias \\"A\\""')); assert(query.query.includes('citation:"Citation \\\\ One"'));
for (const forbidden of ["inferred", "geocode", "translated", "broadened", "semantic"]) assert(!query.query.toLowerCase().includes(forbidden));
assert.deepEqual(new Set(query.lineage.eventNames), new Set(queryInput.eventNames), "exact original query values were not retained");

const command: AdmitCandidateCommand = immutable({ candidateId: original.candidateId, investigationId: original.investigationId, expectedCandidateRevision: 2, expectedInvestigationRevision: 9, reviewerId: "reviewer-1", decisionReason: "Include reference", idempotencyKey: "admit-1", artifactDraft: { title: "Declared title", source: original.source, association: original.association } });
const receipt: CandidateAdmissionReceipt = immutable({ receiptIdentity: "receipt-1", candidateId: command.candidateId, investigationId: command.investigationId, artifactId: "artifact-separate-1", reviewerId: command.reviewerId, decidedAt: "2026-09-02T03:00:00.000Z", committedCandidateRevision: 3, committedInvestigationRevision: 10, idempotencyKey: command.idempotencyKey, originLineage: original.lineage, admissionProvenance: [{ eventId: "admission-1" }] });
assert(Object.isFrozen(command) && Object.isFrozen(command.artifactDraft) && Object.isFrozen(receipt) && Object.isFrozen(receipt.admissionProvenance));

const contractPaths = ["src/evidence/candidates/CandidateEvidenceTypes.ts", "src/evidence/candidates/CandidateEvidenceLifecycle.ts", "src/evidence/candidates/CandidateEvidenceQuery.ts", "src/evidence/candidates/CandidateEvidenceMaterializationTypes.ts"];
const source = contractPaths.map((path) => readFileSync(path, "utf8")).join("\n");
assert.doesNotMatch(source, /\b(fetch|XMLHttpRequest|WebSocket|WorkspaceRuntime|WorkspaceContext|EvidenceReservoir|useEvidenceAuthority|addArtifact|Artifact\[\])\b/);
assert.doesNotMatch(source, /\b(SUPPORTS|CONTRADICTS|AUTHENTIC|CREDIBLE|TRUTH)\b/);
const investigationTypes = readFileSync("src/investigation/investigationTypes.ts", "utf8"); assert(investigationTypes.includes("workspace: Workspace"));

console.log("PASS VerifyCandidateEvidenceContracts — immutable Candidate Evidence lifecycle, query, and materialization contracts verified");
