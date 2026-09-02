import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CANONICAL_EVENTS } from "../../src/canonical/runtimeCorpus.ts";
import { adaptSystemCanonToKnowledge } from "../../src/knowledge/ingestion/SystemCanonKnowledgeAdapter.ts";
import type { Investigation } from "../../src/investigation/investigationTypes.ts";
import type { ResolveExecutionRecord } from "../../src/resolve/runtime/ResolveRuntimeTypes.ts";
import type { CanonicalSimilarityCandidate } from "../../src/resolve/candidates/CanonicalSimilarityCandidateTypes.ts";
import { CanonicalCandidateEvaluationDimensionStatus, type CanonicalSimilarityCandidateEvaluation } from "../../src/resolve/evaluation/CanonicalSimilarityCandidateEvaluationTypes.ts";
import { resolveCandidateIntelligence } from "../../src/resolve/intelligence/ResolveCandidateIntelligenceResolver.ts";
import { createWorkspaceCandidateSelection } from "../../src/resolve/intelligence/ResolveCandidateSelection.ts";
import { projectTimelineTemporal, TimelineTemporalPrecision, TimelineTemporalProjectionStatus, TimelineTemporalSemantic, type TimelineSourceRecord } from "../../src/timeline/projection/index.ts";
import { ResearchAnchorType } from "../../src/research/researchBridgeTypes.ts";

const FOCUSED = "E-TICTAC-2004";
const COMPARED = "E-ROOSEVELT-2015";
const knowledge = adaptSystemCanonToKnowledge(CANONICAL_EVENTS.filter(event => event.event_id === FOCUSED || event.event_id === COMPARED));
const focusedKnowledgeId = "system:event:E-TICTAC-2004";
const comparedKnowledgeId = "system:event:E-ROOSEVELT-2015";
const graph = { nodes: [{ id: focusedKnowledgeId, label: FOCUSED, type: "EVENT" as const }, { id: comparedKnowledgeId, label: COMPARED, type: "EVENT" as const }], edges: [{ id: "edge:observed", source: focusedKnowledgeId, target: comparedKnowledgeId, relationship: "ASSOCIATED_WITH" as const, weight: 1, rationale: [] }], statistics: { nodeCount: 2, edgeCount: 1, eventCount: 2, facilityCount: 0, artifactCount: 0, personCount: 0, organizationCount: 0, locationCount: 0, narrativeCount: 0, hypothesisCount: 0 } };
const investigation: Investigation = { id: "INV-TIMELINE", name: "Timeline verification", description: "", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-02T00:00:00Z", createdBy: "verify", status: "ACTIVE", workspace: { id: "WS-TIMELINE", name: "", description: "", imported_events: [{ event_id: FOCUSED, source: "SYSTEM_CANON" }, { event_id: COMPARED, source: "SYSTEM_CANON" }], focused_event_id: FOCUSED, investigations: [], artifacts: [{ id: "artifact:1", title: "2004 prose is not time", artifact_type: "SOURCE", repository: "SYSTEM_CANON", derived_from: [], created_at: "2025-01-01T00:00:00Z" }], active_layers: [], created_at: "2024-01-01T00:00:00Z" }, currentRevisionId: "revision:1", revisions: [{ id: "revision:1", revisionNumber: 1, timestamp: "2026-01-01T00:00:00Z", operator: "verify", branch: "MAIN", message: "", manifold: { id: "manifold:1", timestamp: "2026-01-01T00:00:00Z", algorithmVersion: "1", activeLayers: [], graph } }] };

const candidate = { identity: { candidateId: `candidate:${focusedKnowledgeId}::${comparedKnowledgeId}`, leftKnowledgeObjectId: focusedKnowledgeId, rightKnowledgeObjectId: comparedKnowledgeId } } as unknown as CanonicalSimilarityCandidate;
const evaluation: CanonicalSimilarityCandidateEvaluation = { identity: { evaluationId: `evaluation:${candidate.identity.candidateId}`, candidateId: candidate.identity.candidateId, leftKnowledgeObjectId: focusedKnowledgeId, rightKnowledgeObjectId: comparedKnowledgeId }, candidate, explanation: { aggregate: { aggregateSimilarity: 0.5, participatingDimensionCount: 1, totalDimensionCount: 1 }, evidence: { availableDimensions: ["NARRATIVE"], unavailableDimensions: [], availableDimensionCount: 1, unavailableDimensionCount: 0, totalDimensionCount: 1 }, dimensions: [{ dimension: "NARRATIVE", status: CanonicalCandidateEvaluationDimensionStatus.AVAILABLE, source: { availability: "AVAILABLE", dimension: "NARRATIVE", similarity: 0.5, weight: 1 } }], similarityRationale: ["verification"] } };
const selection = createWorkspaceCandidateSelection(resolveCandidateIntelligence(evaluation));
const execution = { executionId: "execution:1", startedAt: new Date("2026-01-01T00:00:00Z"), completedAt: new Date("2026-01-01T00:00:01Z"), input: { investigation }, result: { candidateEvaluations: { evaluations: [evaluation] } } } as unknown as ResolveExecutionRecord;

const provenance = { sourceType: "VERIFIED_RECORD", sourceId: "source:1", sourceField: "occurrence_time" } as const;
function record(itemId: string, temporal: TimelineSourceRecord["temporal"], precision: TimelineSourceRecord["precision"] = TimelineTemporalPrecision.EXACT, overrides: Partial<TimelineSourceRecord> = {}): TimelineSourceRecord { return { itemId, investigationId: investigation.id, eventId: FOCUSED, semantic: TimelineTemporalSemantic.OCCURRENCE, precision, temporal, provenance, ...overrides }; }
const records: readonly TimelineSourceRecord[] = [
  record("instant-offset", { kind: "INSTANT", value: "2025-01-01T01:00:00+01:00" }, TimelineTemporalPrecision.EXACT, { evidenceReferenceIds: ["evidence:1"], mediaReferenceIds: ["media:1"] }),
  record("instant-z", { kind: "INSTANT", value: "2025-01-01T00:00:00Z" }, TimelineTemporalPrecision.EXACT, { sequence: 2 }),
  record("date-only", { kind: "DATE", value: "2025-01-02" }, TimelineTemporalPrecision.DATE_ONLY),
  record("approximate", { kind: "DATE", value: "2025-01-03" }, TimelineTemporalPrecision.APPROXIMATE),
  record("inferred", { kind: "INSTANT", value: "2025-01-04T00:00:00Z" }, TimelineTemporalPrecision.INFERRED),
  record("disputed", { kind: "INSTANT", value: "2025-01-05T00:00:00Z" }, TimelineTemporalPrecision.DISPUTED),
  record("interval", { kind: "INTERVAL", start: { sourceValue: "2025-01-06T00:00:00Z", inclusive: true }, end: { sourceValue: "2025-01-07T00:00:00Z", inclusive: false } }, TimelineTemporalPrecision.APPROXIMATE),
  record("open-start", { kind: "OPEN_INTERVAL", start: { sourceValue: "2025-01-08T00:00:00Z", inclusive: true } }, TimelineTemporalPrecision.APPROXIMATE),
  record("open-end", { kind: "OPEN_INTERVAL", end: { sourceValue: "2025-01-09T00:00:00Z", inclusive: false } }, TimelineTemporalPrecision.DISPUTED),
  record("sequence-2", { kind: "SEQUENCE", ordinal: 2 }, TimelineTemporalPrecision.SEQUENCE_ONLY),
  record("sequence-1", { kind: "SEQUENCE", ordinal: 1 }, TimelineTemporalPrecision.SEQUENCE_ONLY),
  record("duration", { kind: "DURATION", value: 300, unit: "MINUTES" }, TimelineTemporalPrecision.APPROXIMATE),
  record("unknown", { kind: "UNKNOWN", reason: "No admitted semantic timestamp." }, TimelineTemporalPrecision.UNKNOWN),
];
const base = { investigation, knowledgeObjects: knowledge, records };
const ready = projectTimelineTemporal(base);
assert.equal(ready.status, TimelineTemporalProjectionStatus.READY);
if (ready.status !== "READY") throw new Error("Expected READY projection.");

assert.deepEqual(projectTimelineTemporal(base), ready, "same input must be structurally equivalent");
assert.equal(JSON.stringify(records), JSON.stringify([...records]), "source records remain unmodified");
assert.equal((ready.focusedItems.find(item => item.itemId === "instant-z")!.temporal as { normalizedEpochMilliseconds: number }).normalizedEpochMilliseconds, (ready.focusedItems.find(item => item.itemId === "instant-offset")!.temporal as { normalizedEpochMilliseconds: number }).normalizedEpochMilliseconds);
assert.equal((ready.focusedItems.find(item => item.itemId === "instant-offset")!.temporal as { sourceValue: string }).sourceValue, "2025-01-01T01:00:00+01:00");
assert.equal(ready.focusedItems.find(item => item.itemId === "date-only")!.temporal.kind, "DATE");
assert.equal(ready.focusedItems.find(item => item.itemId === "approximate")!.precision, "APPROXIMATE");
assert.equal(ready.focusedItems.find(item => item.itemId === "inferred")!.precision, "INFERRED");
assert.equal(ready.focusedItems.find(item => item.itemId === "disputed")!.precision, "DISPUTED");
assert.deepEqual(ready.focusedItems.find(item => item.itemId === "interval")!.temporal, { kind: "INTERVAL", start: { sourceValue: "2025-01-06T00:00:00Z", inclusive: true }, end: { sourceValue: "2025-01-07T00:00:00Z", inclusive: false }, normalizedStart: 1736121600000, normalizedEnd: 1736208000000 });
assert.equal(ready.focusedItems.find(item => item.itemId === "open-start")!.temporal.kind, "OPEN_INTERVAL");
assert.equal(ready.focusedItems.find(item => item.itemId === "open-end")!.temporal.kind, "OPEN_INTERVAL");
assert.equal(ready.focusedItems.find(item => item.itemId === "duration")!.temporal.kind, "DURATION");
assert.deepEqual(ready.focusedItems.filter(item => item.temporal.kind === "SEQUENCE").map(item => item.itemId), ["sequence-1", "sequence-2"]);
assert.equal(ready.focusedItems.at(-1)!.temporal.kind, "UNKNOWN", "unknown policy places unknown last");
assert.deepEqual(ready.focusedItems.slice(0, 2).map(item => item.itemId), ["instant-z", "instant-offset"], "equal instants place explicit sequence before an unspecified tie-break sequence");

function invalid(extra: TimelineSourceRecord): readonly string[] { const result = projectTimelineTemporal({ ...base, records: [extra] }); assert.equal(result.status, "INVALID_SOURCE_TEMPORAL_RECORD"); return result.status === "INVALID_SOURCE_TEMPORAL_RECORD" ? result.issues : []; }
assert.ok(invalid(record("bad-time", { kind: "INSTANT", value: "not-a-time" })).some(issue => issue.includes("Malformed")));
assert.ok(invalid(record("bad-interval", { kind: "INTERVAL", start: { sourceValue: "2025-02-02T00:00:00Z", inclusive: true }, end: { sourceValue: "2025-01-01T00:00:00Z", inclusive: true } }, TimelineTemporalPrecision.APPROXIMATE)).some(issue => issue.includes("start")));
assert.equal(projectTimelineTemporal({ ...base, records: [records[0]!, records[0]!] }).status, "INVALID_SOURCE_TEMPORAL_RECORD");
assert.ok(invalid(record("bad-subject", { kind: "DATE", value: "2025-01-01" }, TimelineTemporalPrecision.DATE_ONLY, { subject: { type: "NODE", id: "missing" } })).some(issue => issue.includes("resolved 0 times")));
assert.equal(projectTimelineTemporal({ ...base, records: [] }).status, "NO_TEMPORAL_RECORDS");
assert.equal(projectTimelineTemporal({ ...base, investigation: { ...investigation, workspace: { ...investigation.workspace, focused_event_id: null } } }).status, "NO_FOCUSED_EVENT");
assert.ok(invalid(record("sentinel", { kind: "INSTANT", value: "1970-01-01T00:00:00.000Z" })).some(issue => issue.includes("sentinel")));
assert.equal(ready.focusedItems.some(item => item.provenance.sourceValue === investigation.createdAt || item.provenance.sourceValue === investigation.workspace.created_at), false);
assert.equal(ready.focusedItems.some(item => item.provenance.sourceValue === investigation.workspace.artifacts[0]!.created_at), false);
assert.equal(ready.focusedItems.some(item => item.temporal.kind === "DATE" && item.temporal.sourceValue === "2004-01-01"), false, "identity and prose are not parsed");

const compared = projectTimelineTemporal({ ...base, comparisonRequested: true, currentExecution: execution, selection, records: [...records, record("compared", { kind: "UNKNOWN", reason: "No admitted time" }, TimelineTemporalPrecision.UNKNOWN, { eventId: COMPARED })] });
assert.equal(compared.status, "READY"); if (compared.status === "READY") { assert.equal(compared.comparedEventId, COMPARED); assert.equal(compared.comparedItems.length, 1); }
assert.equal(projectTimelineTemporal({ ...base, comparisonRequested: true, currentExecution: execution }).status, "NO_QUALIFIED_COMPARISON");
assert.equal(projectTimelineTemporal({ ...base, comparisonRequested: true, currentExecution: { ...execution, input: { ...execution.input, investigation: { ...investigation, id: "STALE" } } } }).status, "NO_CURRENT_RESOLVE_EXECUTION");
assert.deepEqual(ready.focusedItems.find(item => item.itemId === "instant-offset")!.evidenceReferenceIds, ["evidence:1"]);
assert.deepEqual(ready.focusedItems.find(item => item.itemId === "instant-offset")!.mediaReferenceIds, ["media:1"]);
assert.deepEqual(Object.keys(ResearchAnchorType).sort(), ["CANDIDATE", "EDGE", "EXPERIMENT", "NODE"]);
const surface = readFileSync("src/surfaces/WorkspaceSurface.tsx", "utf8");
assert.match(surface, /case WorkspaceMode\.TIMELINE:[\s\S]*?<PlaceholderSurface[\s\S]*?title="Timeline Workspace"/);

console.log("PASS VerifyTimelineTemporalProjection — 28 deterministic temporal projection contracts verified");
