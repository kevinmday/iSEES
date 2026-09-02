import { resolveCurrentInvestigationExecution } from "../../intelligence/selection/InvestigationSelectionCoherence";
import type { KnowledgeObject } from "../../knowledge/model/KnowledgeObject";
import { KnowledgeObjectType } from "../../knowledge/model/KnowledgeObjectTypes";
import { resolveComparePairProjection } from "../../compare/projection/ComparePairProjectionResolver";
import { ComparePairProjectionStatus } from "../../compare/projection/ComparePairProjectionTypes";
import { resolveCandidateIntelligenceCollection } from "../../resolve/intelligence/ResolveCandidateIntelligenceResolver";
import { WorkspaceSelectionKind } from "../../workspace/runtime/WorkspaceRuntimeTypes";
import {
  TimelineTemporalPrecision,
  TimelineTemporalProjectionStatus,
  type TimelineIntervalEndpoint,
  type TimelineSourceRecord,
  type TimelineTemporalItem,
  type TimelineTemporalProjectionInput,
  type TimelineTemporalProjectionResult,
  type TimelineTemporalValue,
} from "./TimelineTemporalProjectionTypes";

const UNSPECIFIED_SENTINELS = new Set(["1970-01-01T00:00:00.000Z", "1970-01-01T00:00:00Z"]);
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function lexical(left: string, right: string): number { return left < right ? -1 : left > right ? 1 : 0; }
function requireIdentity(value: string, label: string): string | undefined { return value.trim() ? undefined : `${label} must not be blank.`; }

function normalizeInstant(value: string): { epoch: number; timezone: "UTC" | "OFFSET" } | string {
  if (UNSPECIFIED_SENTINELS.has(value)) return `Timestamp ${value} is an unsupported unspecified sentinel.`;
  const match = INSTANT.exec(value);
  if (!match) return `Malformed exact ISO timestamp: ${value}.`;
  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch)) return `Invalid exact ISO timestamp: ${value}.`;
  return { epoch, timezone: match[1] === "Z" ? "UTC" : "OFFSET" };
}

function normalizeDate(value: string): number | string {
  const match = DATE.exec(value);
  if (!match) return `Malformed calendar date: ${value}.`;
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return `Invalid calendar date: ${value}.`;
  return year * 10000 + month * 100 + day;
}

function endpoint(endpoint: TimelineIntervalEndpoint): { value: number; normalized: TimelineIntervalEndpoint } | string {
  const instant = normalizeInstant(endpoint.sourceValue);
  if (typeof instant === "string") return instant;
  return { value: instant.epoch, normalized: Object.freeze({ ...endpoint }) };
}

function validatePrecision(record: TimelineSourceRecord): string | undefined {
  if (record.temporal.kind === "DATE" && record.precision !== TimelineTemporalPrecision.DATE_ONLY && record.precision !== TimelineTemporalPrecision.APPROXIMATE && record.precision !== TimelineTemporalPrecision.INFERRED && record.precision !== TimelineTemporalPrecision.DISPUTED) return "DATE values require DATE_ONLY or an uncertainty precision.";
  if (record.temporal.kind === "SEQUENCE" && record.precision !== TimelineTemporalPrecision.SEQUENCE_ONLY) return "SEQUENCE values require SEQUENCE_ONLY precision.";
  if (record.temporal.kind === "UNKNOWN" && record.precision !== TimelineTemporalPrecision.UNKNOWN) return "UNKNOWN values require UNKNOWN precision.";
  if (record.precision === TimelineTemporalPrecision.EXACT && record.temporal.kind !== "INSTANT") return "EXACT precision is valid only for an INSTANT.";
  if (record.precision === TimelineTemporalPrecision.SEQUENCE_ONLY && record.temporal.kind !== "SEQUENCE") return "SEQUENCE_ONLY precision requires a SEQUENCE value.";
  if (record.precision === TimelineTemporalPrecision.UNKNOWN && record.temporal.kind !== "UNKNOWN") return "UNKNOWN precision requires an UNKNOWN value.";
  return undefined;
}

function normalizeTemporal(record: TimelineSourceRecord): TimelineTemporalValue | string {
  const precisionIssue = validatePrecision(record); if (precisionIssue) return precisionIssue;
  const value = record.temporal;
  if (value.kind === "INSTANT") { const normalized = normalizeInstant(value.value); return typeof normalized === "string" ? normalized : Object.freeze({ kind: "INSTANT", sourceValue: value.value, normalizedEpochMilliseconds: normalized.epoch, timezone: normalized.timezone }); }
  if (value.kind === "DATE") { const order = normalizeDate(value.value); return typeof order === "string" ? order : Object.freeze({ kind: "DATE", sourceValue: value.value, calendarOrder: order }); }
  if (value.kind === "INTERVAL") { const start = endpoint(value.start); const end = endpoint(value.end); if (typeof start === "string") return start; if (typeof end === "string") return end; if (start.value > end.value) return "Interval start must not follow interval end."; if (start.value === end.value && (!start.normalized.inclusive || !end.normalized.inclusive)) return "An empty open interval is incoherent."; return Object.freeze({ kind: "INTERVAL", start: start.normalized, end: end.normalized, normalizedStart: start.value, normalizedEnd: end.value }); }
  if (value.kind === "OPEN_INTERVAL") { if ((value.start === undefined) === (value.end === undefined)) return "OPEN_INTERVAL requires exactly one bound."; const start = value.start && endpoint(value.start); const end = value.end && endpoint(value.end); if (typeof start === "string") return start; if (typeof end === "string") return end; return Object.freeze({ kind: "OPEN_INTERVAL", ...(start ? { start: start.normalized, normalizedStart: start.value } : {}), ...(end ? { end: end.normalized, normalizedEnd: end.value } : {}) }); }
  if (value.kind === "DURATION") { if (!Number.isFinite(value.value) || value.value < 0) return "Duration must be a finite non-negative number."; return Object.freeze({ ...value }); }
  if (value.kind === "SEQUENCE") { if (!Number.isSafeInteger(value.ordinal) || value.ordinal < 0) return "Sequence ordinal must be a non-negative safe integer."; return Object.freeze({ ...value }); }
  if (!value.reason.trim()) return "Unknown time requires a reason.";
  return Object.freeze({ ...value });
}

function temporalRank(value: TimelineTemporalValue): number { return value.kind === "INSTANT" ? 0 : value.kind === "DATE" ? 1 : value.kind === "INTERVAL" ? 2 : value.kind === "OPEN_INTERVAL" ? 3 : value.kind === "SEQUENCE" ? 4 : value.kind === "DURATION" ? 5 : 6; }
function primaryOrder(value: TimelineTemporalValue): number { if (value.kind === "INSTANT") return value.normalizedEpochMilliseconds; if (value.kind === "DATE") return value.calendarOrder; if (value.kind === "INTERVAL") return value.normalizedStart; if (value.kind === "OPEN_INTERVAL") return value.normalizedStart ?? value.normalizedEnd ?? 0; if (value.kind === "SEQUENCE") return value.ordinal; return value.kind === "DURATION" ? value.value : 0; }
function secondaryOrder(value: TimelineTemporalValue): number { if (value.kind === "INTERVAL") return value.normalizedEnd; if (value.kind === "OPEN_INTERVAL") return value.normalizedEnd ?? value.normalizedStart ?? 0; return 0; }
function padded(value: number): string { return `${value < 0 ? "-" : "+"}${Math.abs(value).toString().padStart(16, "0")}`; }
export function createTimelineOrderKey(value: TimelineTemporalValue, sequence: number | undefined, itemId: string): string { return `${temporalRank(value)}:${padded(primaryOrder(value))}:${padded(secondaryOrder(value))}:${sequence === undefined ? "~" : padded(sequence)}:${itemId}`; }
export function compareTimelineTemporalItems(left: TimelineTemporalItem, right: TimelineTemporalItem): number { return temporalRank(left.temporal) - temporalRank(right.temporal) || primaryOrder(left.temporal) - primaryOrder(right.temporal) || secondaryOrder(left.temporal) - secondaryOrder(right.temporal) || (left.sequence ?? Number.MAX_SAFE_INTEGER) - (right.sequence ?? Number.MAX_SAFE_INTEGER) || lexical(left.itemId, right.itemId); }

function systemEvent(eventId: string, objects: readonly KnowledgeObject[]): KnowledgeObject[] { return objects.filter(object => object.type === KnowledgeObjectType.EVENT && object.provenance.sourceType === "SYSTEM_CANON" && object.provenance.sourceId === eventId); }
function uniqueReferences(values: readonly string[] | undefined, label: string): readonly string[] | string { const copy = [...(values ?? [])]; for (const value of copy) if (!value.trim()) return `${label} contains a blank identity.`; if (new Set(copy).size !== copy.length) return `${label} contains duplicate identities.`; return Object.freeze(copy); }

function projectRecord(record: TimelineSourceRecord, input: TimelineTemporalProjectionInput, allowedEvents: ReadonlySet<string>): TimelineTemporalItem | readonly string[] {
  const issues: string[] = [];
  for (const issue of [requireIdentity(record.itemId, "Timeline item identity"), requireIdentity(record.investigationId, "Investigation identity"), requireIdentity(record.eventId, "Event identity"), requireIdentity(record.provenance.sourceType, "Provenance source type"), requireIdentity(record.provenance.sourceId, "Provenance source identity"), requireIdentity(record.provenance.sourceField, "Provenance source field")]) if (issue) issues.push(issue);
  if (record.investigationId !== input.investigation!.id) issues.push(`Timeline item ${record.itemId} crosses Investigation ownership.`);
  if (!allowedEvents.has(record.eventId)) issues.push(`Timeline item ${record.itemId} has a mismatched source Event identity.`);
  if (record.sequence !== undefined && (!Number.isSafeInteger(record.sequence) || record.sequence < 0)) issues.push("Tie-break sequence must be a non-negative safe integer.");
  if (record.qualification?.confidence !== undefined && (!Number.isFinite(record.qualification.confidence) || record.qualification.confidence < 0 || record.qualification.confidence > 1)) issues.push("Confidence must be between zero and one.");
  const temporal = normalizeTemporal(record); if (typeof temporal === "string") issues.push(temporal);
  const evidence = uniqueReferences(record.evidenceReferenceIds, "Evidence references"); if (typeof evidence === "string") issues.push(evidence);
  const media = uniqueReferences(record.mediaReferenceIds, "Media references"); if (typeof media === "string") issues.push(media);
  let subject: TimelineTemporalItem["subject"] = Object.freeze({ availability: "UNAVAILABLE", reason: "No canonical NODE or EDGE subject was supplied." });
  if (record.subject) {
    const graph = input.investigation!.revisions.find(revision => revision.id === input.investigation!.currentRevisionId)?.manifold.graph;
    const matches = record.subject.type === "NODE" ? graph?.nodes.filter(node => node.id === record.subject!.id).length ?? 0 : graph?.edges.filter(edge => edge.id === record.subject!.id).length ?? 0;
    if (!record.subject.id.trim()) issues.push("Subject identity must not be blank."); else if (matches !== 1) issues.push(`Canonical ${record.subject.type} subject ${record.subject.id} resolved ${matches} times.`); else subject = Object.freeze({ availability: "AVAILABLE", ...record.subject });
  }
  if (issues.length || typeof temporal === "string" || typeof evidence === "string" || typeof media === "string") return Object.freeze(issues);
  const provenance = Object.freeze({ ...record.provenance });
  const qualification = record.qualification ? Object.freeze({ ...record.qualification }) : undefined;
  return Object.freeze({ itemId: record.itemId, investigationId: record.investigationId, eventId: record.eventId, semantic: record.semantic, precision: record.precision, temporal, subject, provenance, ...(qualification ? { qualification } : {}), evidenceReferenceIds: evidence, mediaReferenceIds: media, ...(record.sequence === undefined ? {} : { sequence: record.sequence }), orderKey: createTimelineOrderKey(temporal, record.sequence, record.itemId), validity: "VALID" });
}

export function projectTimelineTemporal(input: TimelineTemporalProjectionInput): TimelineTemporalProjectionResult {
  const investigation = input.investigation;
  if (!investigation) return Object.freeze({ status: TimelineTemporalProjectionStatus.NO_ACTIVE_INVESTIGATION });
  if (input.workspaceAvailable === false || !investigation.workspace) return Object.freeze({ status: TimelineTemporalProjectionStatus.NO_WORKSPACE, investigationId: investigation.id });
  const focusedEventId = investigation.workspace.focused_event_id;
  if (!focusedEventId?.trim()) return Object.freeze({ status: TimelineTemporalProjectionStatus.NO_FOCUSED_EVENT, investigationId: investigation.id });
  if (!investigation.workspace.imported_events.some(reference => reference.event_id === focusedEventId) || systemEvent(focusedEventId, input.knowledgeObjects).length !== 1) return Object.freeze({ status: TimelineTemporalProjectionStatus.FOCUSED_EVENT_UNAVAILABLE, investigationId: investigation.id, focusedEventId });
  let comparedEventId: string | undefined;
  if (input.comparisonRequested) {
    const execution = resolveCurrentInvestigationExecution(investigation, input.currentExecution);
    if (!execution?.result) return Object.freeze({ status: TimelineTemporalProjectionStatus.NO_CURRENT_RESOLVE_EXECUTION, investigationId: investigation.id, focusedEventId });
    if (input.selection?.kind !== WorkspaceSelectionKind.CANDIDATE) return Object.freeze({ status: TimelineTemporalProjectionStatus.NO_QUALIFIED_COMPARISON, investigationId: investigation.id, focusedEventId });
    try {
      const intelligence = resolveCandidateIntelligenceCollection(execution.result.candidateEvaluations.evaluations).intelligence;
      const pair = resolveComparePairProjection(focusedEventId, input.knowledgeObjects, input.selection, intelligence);
      if (pair.status !== ComparePairProjectionStatus.READY) return Object.freeze({ status: TimelineTemporalProjectionStatus.NO_QUALIFIED_COMPARISON, investigationId: investigation.id, focusedEventId, reason: pair.status });
      comparedEventId = pair.comparisonEventId;
    } catch (error) { return Object.freeze({ status: TimelineTemporalProjectionStatus.INVALID_COMPARISON_SELECTION, investigationId: investigation.id, focusedEventId, reason: error instanceof Error ? error.message : "Malformed comparison selection." }); }
  }
  if (input.records.length === 0) return Object.freeze({ status: TimelineTemporalProjectionStatus.NO_TEMPORAL_RECORDS, investigationId: investigation.id, focusedEventId });
  const duplicates = new Set<string>(); const seen = new Set<string>();
  for (const record of input.records) { if (seen.has(record.itemId)) duplicates.add(record.itemId); seen.add(record.itemId); }
  const issues = [...duplicates].sort(lexical).map(id => `Duplicate timeline item identity: ${id}.`);
  const items: TimelineTemporalItem[] = []; const allowedEvents = new Set([focusedEventId, ...(comparedEventId ? [comparedEventId] : [])]);
  for (const record of input.records) { const projected = projectRecord(record, input, allowedEvents); if (Array.isArray(projected)) issues.push(...projected.map(issue => `${record.itemId || "<blank>"}: ${issue}`)); else items.push(projected as TimelineTemporalItem); }
  if (issues.length) return Object.freeze({ status: TimelineTemporalProjectionStatus.INVALID_SOURCE_TEMPORAL_RECORD, investigationId: investigation.id, focusedEventId, issues: Object.freeze(issues) });
  const focusedItems = Object.freeze(items.filter(item => item.eventId === focusedEventId).sort(compareTimelineTemporalItems));
  const comparedItems = Object.freeze(items.filter(item => item.eventId === comparedEventId).sort(compareTimelineTemporalItems));
  if (focusedItems.length === 0 && comparedItems.length === 0) return Object.freeze({ status: TimelineTemporalProjectionStatus.NO_TEMPORAL_RECORDS, investigationId: investigation.id, focusedEventId });
  return Object.freeze({ status: TimelineTemporalProjectionStatus.READY, investigationId: investigation.id, focusedEventId, ...(comparedEventId ? { comparedEventId } : {}), focusedItems, comparedItems });
}
