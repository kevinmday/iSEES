import type { Investigation } from "../investigationTypes.ts";

export const OWNED_ACTIVATION_SCHEMA_VERSION = "owned-investigation-activation/v1";

export type ContinuityStateCode =
  | "SESSION_INITIALIZING" | "AUTHENTICATION_REQUIRED" | "SESSION_EXPIRED"
  | "OWNED_LIBRARY_EMPTY" | "NO_ACTIVE_INVESTIGATION" | "RESTORING_LAST_ACTIVE"
  | "ACTIVATION_READY" | "ACTIVATION_STALE" | "ACTIVATION_INVALID"
  | "INVESTIGATION_NOT_FOUND" | "LOGOUT_IN_PROGRESS" | "ACCOUNT_BOUNDARY_RESET";

export interface AccountSessionProjection {
  readonly researcherId: string;
  readonly email: string;
  readonly sessionExpiresAt: string;
}

export interface OwnedActivationAggregate {
  readonly activationSchemaVersion: typeof OWNED_ACTIVATION_SCHEMA_VERSION;
  readonly investigationId: string;
  readonly title: string;
  readonly objective: string | null;
  readonly lifecycle: "ACTIVE";
  readonly createdAt: string;
  readonly modifiedAt: string;
  readonly version: number;
  readonly aggregateSchemaVersion: "investigation-aggregate/v1";
  readonly aggregateState: "EMPTY";
  readonly aggregateRevision: number;
  readonly access: Readonly<{ kind: "RESEARCHER_OWNED" }>;
  readonly operationalState: Readonly<{
    kind: "EMPTY";
    workspaceId: string;
    focusedEventId: null;
    nodes: readonly never[];
    edges: readonly never[];
  }>;
  readonly freshnessToken: string;
}

export interface ActivationReceipt {
  readonly code: "ACTIVATION_READY";
  readonly researcherId: string;
  readonly investigationId: string;
  readonly aggregateRevision: number;
  readonly requestGeneration: number;
}

export class ContinuityError extends Error {
  readonly code: ContinuityStateCode | "NETWORK_FAILURE";
  constructor(code: ContinuityStateCode | "NETWORK_FAILURE", message: string) {
    super(message);
    this.code = code;
  }
}

function record(value: unknown): Readonly<Record<string, unknown>> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Readonly<Record<string, unknown>> : null;
}

function exact(value: Readonly<Record<string, unknown>>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function timestamp(value: unknown): value is string {
  return typeof value === "string" && value.trim() === value && Number.isFinite(Date.parse(value));
}

export function parseOwnedActivationAggregate(value: unknown, expectedId: string): OwnedActivationAggregate {
  const item = record(value);
  const keys = ["activationSchemaVersion", "investigationId", "title", "objective", "lifecycle",
    "createdAt", "modifiedAt", "version", "aggregateSchemaVersion", "aggregateState",
    "aggregateRevision", "access", "operationalState", "freshnessToken"];
  const access = record(item?.access);
  const operational = record(item?.operationalState);
  const valid = item !== null && exact(item, keys)
    && item.activationSchemaVersion === OWNED_ACTIVATION_SCHEMA_VERSION
    && item.investigationId === expectedId && expectedId.trim().length > 0
    && typeof item.title === "string" && item.title.trim().length > 0
    && (item.objective === null || typeof item.objective === "string")
    && item.lifecycle === "ACTIVE" && timestamp(item.createdAt) && timestamp(item.modifiedAt)
    && Number.isSafeInteger(item.version) && (item.version as number) >= 0
    && item.aggregateSchemaVersion === "investigation-aggregate/v1" && item.aggregateState === "EMPTY"
    && Number.isSafeInteger(item.aggregateRevision) && (item.aggregateRevision as number) >= 0
    && access !== null && exact(access, ["kind"]) && access.kind === "RESEARCHER_OWNED"
    && operational !== null && exact(operational, ["kind", "workspaceId", "focusedEventId", "nodes", "edges"])
    && operational.kind === "EMPTY" && typeof operational.workspaceId === "string" && operational.workspaceId.trim().length > 0
    && operational.focusedEventId === null && Array.isArray(operational.nodes) && operational.nodes.length === 0
    && Array.isArray(operational.edges) && operational.edges.length === 0
    && item.freshnessToken === `${item.version}:${item.aggregateRevision}`;
  if (!valid) throw new ContinuityError("ACTIVATION_INVALID", "Owned activation aggregate is invalid.");
  return Object.freeze(item) as unknown as OwnedActivationAggregate;
}

export function materializeEmptyOwnedInvestigation(aggregate: OwnedActivationAggregate): Investigation {
  return Object.freeze({
    id: aggregate.investigationId,
    name: aggregate.title,
    description: aggregate.objective ?? "",
    createdAt: aggregate.createdAt,
    updatedAt: aggregate.modifiedAt,
    createdBy: "AUTHENTICATED_RESEARCHER",
    status: "ACTIVE",
    workspace: Object.freeze({
      id: aggregate.operationalState.workspaceId,
      name: aggregate.title,
      description: aggregate.objective ?? "",
      imported_events: Object.freeze([]),
      focused_event_id: null,
      investigations: Object.freeze([]),
      artifacts: Object.freeze([]),
      active_layers: Object.freeze([]),
      created_at: aggregate.createdAt,
    }),
    revisions: Object.freeze([]),
  }) as unknown as Investigation;
}
