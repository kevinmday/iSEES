import type { Investigation } from "../../investigation/investigationTypes";
import type { KnowledgeObject } from "../../knowledge/model/KnowledgeObject";
import type { ResolveExecutionRecord } from "../../resolve/runtime/ResolveRuntimeTypes";
import type { WorkspaceSelection } from "../../workspace/runtime/WorkspaceRuntimeTypes";

export const TimelineTemporalSemantic = {
  OCCURRENCE: "OCCURRENCE",
  OBSERVATION: "OBSERVATION",
  CAPTURE: "CAPTURE",
  CREATION: "CREATION",
  PUBLICATION: "PUBLICATION",
  KNOWLEDGE_STATE: "KNOWLEDGE_STATE",
} as const;
export type TimelineTemporalSemantic = typeof TimelineTemporalSemantic[keyof typeof TimelineTemporalSemantic];

export const TimelineTemporalPrecision = {
  EXACT: "EXACT",
  DATE_ONLY: "DATE_ONLY",
  APPROXIMATE: "APPROXIMATE",
  INFERRED: "INFERRED",
  DISPUTED: "DISPUTED",
  SEQUENCE_ONLY: "SEQUENCE_ONLY",
  UNKNOWN: "UNKNOWN",
} as const;
export type TimelineTemporalPrecision = typeof TimelineTemporalPrecision[keyof typeof TimelineTemporalPrecision];

export type TimelineIntervalEndpoint = Readonly<{
  sourceValue: string;
  inclusive: boolean;
}>;

export type TimelineTemporalValue =
  | Readonly<{ kind: "INSTANT"; sourceValue: string; normalizedEpochMilliseconds: number; timezone: "UTC" | "OFFSET" }>
  | Readonly<{ kind: "DATE"; sourceValue: string; calendarOrder: number }>
  | Readonly<{ kind: "INTERVAL"; start: TimelineIntervalEndpoint; end: TimelineIntervalEndpoint; normalizedStart: number; normalizedEnd: number }>
  | Readonly<{ kind: "OPEN_INTERVAL"; start?: TimelineIntervalEndpoint; end?: TimelineIntervalEndpoint; normalizedStart?: number; normalizedEnd?: number }>
  | Readonly<{ kind: "DURATION"; value: number; unit: "MILLISECONDS" | "SECONDS" | "MINUTES" | "HOURS" | "DAYS" }>
  | Readonly<{ kind: "SEQUENCE"; ordinal: number }>
  | Readonly<{ kind: "UNKNOWN"; reason: string }>;

export type TimelineSubjectReference =
  | Readonly<{ availability: "AVAILABLE"; type: "NODE" | "EDGE"; id: string }>
  | Readonly<{ availability: "UNAVAILABLE"; reason: string }>;

export type TimelineQualification = Readonly<{
  confidence?: number;
  rationale?: string;
}>;

export type TimelineItemProvenance = Readonly<{
  sourceType: string;
  sourceId: string;
  sourceField: string;
  sourceValue?: string;
}>;

/** Admitted temporal input only. Callers must not derive these records from prose or identity text. */
export interface TimelineSourceRecord {
  readonly itemId: string;
  readonly investigationId: string;
  readonly eventId: string;
  readonly semantic: TimelineTemporalSemantic;
  readonly precision: TimelineTemporalPrecision;
  readonly temporal:
    | Readonly<{ kind: "INSTANT"; value: string }>
    | Readonly<{ kind: "DATE"; value: string }>
    | Readonly<{ kind: "INTERVAL"; start: TimelineIntervalEndpoint; end: TimelineIntervalEndpoint }>
    | Readonly<{ kind: "OPEN_INTERVAL"; start?: TimelineIntervalEndpoint; end?: TimelineIntervalEndpoint }>
    | Readonly<{ kind: "DURATION"; value: number; unit: "MILLISECONDS" | "SECONDS" | "MINUTES" | "HOURS" | "DAYS" }>
    | Readonly<{ kind: "SEQUENCE"; ordinal: number }>
    | Readonly<{ kind: "UNKNOWN"; reason: string }>;
  readonly subject?: Readonly<{ type: "NODE" | "EDGE"; id: string }>;
  readonly provenance: TimelineItemProvenance;
  readonly qualification?: TimelineQualification;
  readonly evidenceReferenceIds?: readonly string[];
  readonly mediaReferenceIds?: readonly string[];
  readonly sequence?: number;
}

export interface TimelineTemporalItem {
  readonly itemId: string;
  readonly investigationId: string;
  readonly eventId: string;
  readonly semantic: TimelineTemporalSemantic;
  readonly precision: TimelineTemporalPrecision;
  readonly temporal: TimelineTemporalValue;
  readonly subject: TimelineSubjectReference;
  readonly provenance: TimelineItemProvenance;
  readonly qualification?: TimelineQualification;
  readonly evidenceReferenceIds: readonly string[];
  readonly mediaReferenceIds: readonly string[];
  readonly sequence?: number;
  readonly orderKey: string;
  readonly validity: "VALID";
}

export const TimelineTemporalProjectionStatus = {
  NO_ACTIVE_INVESTIGATION: "NO_ACTIVE_INVESTIGATION",
  NO_WORKSPACE: "NO_WORKSPACE",
  NO_FOCUSED_EVENT: "NO_FOCUSED_EVENT",
  FOCUSED_EVENT_UNAVAILABLE: "FOCUSED_EVENT_UNAVAILABLE",
  NO_CURRENT_RESOLVE_EXECUTION: "NO_CURRENT_RESOLVE_EXECUTION",
  NO_QUALIFIED_COMPARISON: "NO_QUALIFIED_COMPARISON",
  INVALID_COMPARISON_SELECTION: "INVALID_COMPARISON_SELECTION",
  NO_TEMPORAL_RECORDS: "NO_TEMPORAL_RECORDS",
  INVALID_SOURCE_TEMPORAL_RECORD: "INVALID_SOURCE_TEMPORAL_RECORD",
  READY: "READY",
} as const;
export type TimelineTemporalProjectionStatus = typeof TimelineTemporalProjectionStatus[keyof typeof TimelineTemporalProjectionStatus];

export interface TimelineTemporalProjectionInput {
  readonly investigation?: Investigation;
  readonly workspaceAvailable?: boolean;
  readonly knowledgeObjects: readonly KnowledgeObject[];
  readonly selection?: WorkspaceSelection;
  readonly currentExecution?: ResolveExecutionRecord;
  readonly comparisonRequested?: boolean;
  readonly records: readonly TimelineSourceRecord[];
}

export type TimelineTemporalProjectionResult =
  | Readonly<{ status: Exclude<TimelineTemporalProjectionStatus, "READY" | "INVALID_SOURCE_TEMPORAL_RECORD">; investigationId?: string; focusedEventId?: string; reason?: string }>
  | Readonly<{ status: "INVALID_SOURCE_TEMPORAL_RECORD"; investigationId: string; focusedEventId: string; issues: readonly string[] }>
  | Readonly<{ status: "READY"; investigationId: string; focusedEventId: string; comparedEventId?: string; focusedItems: readonly TimelineTemporalItem[]; comparedItems: readonly TimelineTemporalItem[] }>;
