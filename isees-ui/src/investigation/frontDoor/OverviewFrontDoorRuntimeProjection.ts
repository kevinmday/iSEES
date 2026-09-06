import type { OperatorIdentityState } from "../../identity/runtime/OperatorIdentityRuntimeTypes.ts";
import type { OperatorPersistenceKind } from "../../identity/runtime/OperatorIdentityRuntimeTypes.ts";
import type { InvestigationSummary } from "../library/InvestigationLibraryTypes.ts";
import { resolveOverviewFrontDoorProjection } from "./FrontDoorProjection.ts";
import {
  FrontDoorIdentityKind,
  FrontDoorPersistenceCapability,
  GuestRestorableWorkStatus,
  InvestigationLibraryStatus,
  type OverviewFrontDoorProjection,
} from "./FrontDoorProjectionTypes.ts";

export interface OverviewFrontDoorRuntimeFacts {
  readonly identity: OperatorIdentityState;
  readonly guestWorkspaceRestored: boolean;
  readonly activeInvestigationId: string | null;
  readonly library: Readonly<{
    status: InvestigationLibraryStatus;
    summaries: readonly Pick<InvestigationSummary, "investigationId" | "title">[];
  }>;
}

export function normalizeInvestigationLibraryPrincipal(operatorId: unknown): string | null {
  if (typeof operatorId !== "string") return null;
  const normalized = operatorId.trim();
  return normalized.length === 0 ? null : normalized;
}

export interface NormalizedInvestigationLibraryAuthority {
  readonly kind: "GUEST" | "ACCOUNT";
  readonly principalId: string;
  readonly establishedAt: string;
  readonly revision: number;
}

const CANONICAL_IDENTITY_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function isCanonicalIdentityTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !CANONICAL_IDENTITY_TIMESTAMP.test(value)) return false;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === value;
}

function ownDataValues(
  value: unknown,
  expectedKeys: readonly string[],
): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  try {
    if (Object.getPrototypeOf(value) !== Object.prototype) return null;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Reflect.ownKeys(descriptors);
    if (
      keys.length !== expectedKeys.length
      || keys.some(key => typeof key !== "string" || !expectedKeys.includes(key))
    ) return null;
    const result: Record<string, unknown> = Object.create(null);
    for (const key of expectedKeys) {
      const descriptor = descriptors[key];
      if (descriptor === undefined || !("value" in descriptor)) return null;
      result[key] = descriptor.value;
    }
    return result;
  } catch {
    return null;
  }
}

export function normalizeInvestigationLibraryAuthority(
  value: unknown,
): NormalizedInvestigationLibraryAuthority | null {
  try {
    const state = ownDataValues(value, ["status", "identity", "persistence", "revision"]);
    if (state === null) return null;
    if (state.status !== "READY") return null;
    const record = ownDataValues(state.identity, ["operatorId", "kind", "establishedAt"]);
    if (record === null) return null;
    const kind = record.kind;
    if (kind !== "GUEST" && kind !== "ACCOUNT") return null;
    const persistence = state.persistence;
    const expectedPersistence: OperatorPersistenceKind = kind === "GUEST" ? "SESSION" : "PERSISTENT";
    if (persistence !== expectedPersistence) return null;
    const principalId = normalizeInvestigationLibraryPrincipal(record.operatorId);
    const establishedAt = record.establishedAt;
    const revision = state.revision;
    if (
      principalId === null
      || !isCanonicalIdentityTimestamp(establishedAt)
      || typeof revision !== "number"
      || !Number.isSafeInteger(revision)
      || revision < 0
    ) return null;
    return Object.freeze({ kind, principalId, establishedAt, revision });
  } catch {
    return null;
  }
}

export function resolveInvestigationLibraryPrincipal(
  identity: unknown,
): string | null {
  return normalizeInvestigationLibraryAuthority(identity)?.principalId ?? null;
}

export function resolveOverviewFrontDoorRuntimeProjection(
  facts: OverviewFrontDoorRuntimeFacts,
): OverviewFrontDoorProjection | null {
  try {
  const authority = normalizeInvestigationLibraryAuthority(facts.identity);
  if (authority === null) return null;

  const isGuest = authority.kind === "GUEST";
  const activeInvestigationId = facts.activeInvestigationId ?? undefined;
  const publicLibrary = copyRuntimeLibrary(facts.library);
  if (publicLibrary === null) return null;

  return resolveOverviewFrontDoorProjection({
    identity: {
      kind: isGuest ? FrontDoorIdentityKind.GUEST : FrontDoorIdentityKind.ACCOUNT,
      persistence: isGuest
        ? FrontDoorPersistenceCapability.SESSION
        : FrontDoorPersistenceCapability.PERSISTENT,
    },
    library: {
      status: publicLibrary.status,
      summaries: publicLibrary.summaries,
    },
    guestRestorableWork: isGuest
      && facts.guestWorkspaceRestored
      && activeInvestigationId !== undefined
      ? {
          status: GuestRestorableWorkStatus.VALIDATED,
          investigationId: activeInvestigationId,
        }
      : { status: GuestRestorableWorkStatus.NONE },
    activeInvestigation: {
      investigationId: activeInvestigationId,
      claimsOwnedByIdentity: !isGuest
        && activeInvestigationId !== undefined
        && publicLibrary.summaries.some(
          summary => summary.investigationId === activeInvestigationId,
        ),
    },
    caseGateway: {
      canonCards: [],
      repositories: [],
    },
  });
  } catch {
    return null;
  }
}

function copyRuntimeLibrary(value: unknown): OverviewFrontDoorRuntimeFacts["library"] | null {
  const record = ownDataValues(value, ["status", "summaries"]);
  if (record === null || !Object.values(InvestigationLibraryStatus).includes(record.status as InvestigationLibraryStatus)) return null;
  const source = record.summaries;
  if (!Array.isArray(source)) return null;
  try {
    if (Object.getPrototypeOf(source) !== Array.prototype) return null;
    const descriptors = Object.getOwnPropertyDescriptors(source) as unknown as Record<PropertyKey, PropertyDescriptor>;
    const length = descriptors["length"];
    const lengthValue = length?.value;
    if (!Number.isSafeInteger(lengthValue) || (lengthValue as number) < 0) return null;
    if (Reflect.ownKeys(descriptors).length !== (lengthValue as number) + 1) return null;
    const summaries: Array<{ investigationId: string; title: string }> = [];
    const ids = new Set<string>();
    for (let index = 0; index < (lengthValue as number); index += 1) {
      const descriptor = descriptors[String(index)];
      if (descriptor === undefined || !("value" in descriptor)) return null;
      const summary = ownDataValues(descriptor.value, ["investigationId", "title"]);
      if (summary === null) return null;
      const { investigationId, title } = summary;
      if (
        typeof investigationId !== "string" || investigationId.trim().length === 0
        || typeof title !== "string" || title.trim().length === 0
        || ids.has(investigationId)
      ) return null;
      ids.add(investigationId);
      summaries.push(Object.freeze({ investigationId, title }));
    }
    const status = record.status as InvestigationLibraryStatus;
    if (
      (status === InvestigationLibraryStatus.READY && summaries.length === 0)
      || (status !== InvestigationLibraryStatus.READY
        && status !== InvestigationLibraryStatus.STALE
        && summaries.length !== 0)
    ) return null;
    return Object.freeze({ status, summaries: Object.freeze(summaries) });
  } catch {
    return null;
  }
}
