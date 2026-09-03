// ============================================================
// src/investigation/engine/revisionEngine.ts
// P29A
// INVESTIGATION LIFECYCLE FOUNDATION
// REVISION ENGINE
//
// Deterministic revision creation.
// No React.
// No persistence.
// No side effects.
//
// FULL DROP-IN FILE
// ============================================================

import type {
  Investigation,
  InvestigationRevision,
  ManifoldRevision,
} from "../investigationTypes";

function requireRevisionHistoryCoherence(
  investigation: Investigation,
): void {
  const revisions = investigation.revisions;
  if (revisions.length === 0) {
    if (investigation.currentRevisionId !== undefined) {
      throw new Error("An empty revision history cannot have a current revision.");
    }
    return;
  }
  if (!investigation.currentRevisionId) {
    throw new Error("A non-empty revision history requires a current revision.");
  }
  const ids = new Set<string>();
  const numbers = new Set<number>();
  revisions.forEach((revision, index) => {
    if (!revision.id.trim() || ids.has(revision.id)) throw new Error("Revision identities must be non-empty and unique.");
    if (!Number.isSafeInteger(revision.revisionNumber) || revision.revisionNumber <= 0 || numbers.has(revision.revisionNumber)) throw new Error("Revision numbers must be unique positive safe integers.");
    if (revision.revisionNumber !== index + 1) throw new Error("Revision numbers must be strictly monotonic and contiguous.");
    if (index === 0 ? revision.parentRevisionId !== undefined : revision.parentRevisionId !== revisions[index - 1]!.id) throw new Error("Revision parent lineage is broken.");
    ids.add(revision.id);
    numbers.add(revision.revisionNumber);
  });
  if (revisions[revisions.length - 1]!.id !== investigation.currentRevisionId) {
    throw new Error("The current revision must identify the latest revision.");
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) return value.map(cloneValue) as T;
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, cloneValue(child)]),
    ) as T;
  }
  return value;
}

// ============================================================
// CREATE REVISION
// ============================================================

export function createRevision(
  investigation: Investigation,
  manifold: ManifoldRevision,
  operator: string,
  message: string
): InvestigationRevision {

  requireRevisionHistoryCoherence(investigation);

  const revisionNumber =
    investigation.revisions.length + 1;

  const revisionId =
    `REV-${revisionNumber
      .toString()
      .padStart(4, "0")}`;

  return deepFreeze({

    id:
      revisionId,

    revisionNumber,

    timestamp:
      manifold.timestamp,

    operator,

    parentRevisionId:
      investigation.currentRevisionId,

    branch:
      "MAIN",

    message,

    manifold: deepFreeze(cloneValue(manifold)),
  });
}

// ============================================================
// COMMIT REVISION
// ============================================================

export function commitRevision(
  investigation: Investigation,
  revision: InvestigationRevision
): Investigation {

  requireRevisionHistoryCoherence(investigation);
  const expectedNumber = investigation.revisions.length + 1;
  const expectedId = `REV-${expectedNumber.toString().padStart(4, "0")}`;
  if (revision.revisionNumber !== expectedNumber || revision.id !== expectedId) {
    throw new Error("Revision identity and number must extend the current history monotonically.");
  }
  if (revision.parentRevisionId !== investigation.currentRevisionId) {
    throw new Error("Revision parent must be the current revision.");
  }
  if (investigation.revisions.some(existing => existing.id === revision.id || existing.revisionNumber === revision.revisionNumber)) {
    throw new Error("Revision commit would duplicate history.");
  }

  const immutableRevision = deepFreeze(cloneValue(revision));

  return {

    ...investigation,

    updatedAt:
      revision.timestamp,

    currentRevisionId:
      revision.id,

    revisions: Object.freeze([

      ...investigation.revisions,

      immutableRevision,
    ]) as InvestigationRevision[],
  };
}

// ============================================================
// CURRENT REVISION
// ============================================================

export function getCurrentRevision(
  investigation: Investigation
): InvestigationRevision | undefined {
  const matches = investigation.revisions.filter(revision => revision.id === investigation.currentRevisionId);
  if (matches.length > 1) throw new Error("Current revision identity is ambiguous.");
  return matches[0];
}

// ============================================================
// LIST REVISIONS
// ============================================================

export function listRevisions(
  investigation: Investigation
): InvestigationRevision[] {

  return [

    ...investigation.revisions,

  ].sort(

    (
      a,
      b
    ) =>

      a.revisionNumber -
      b.revisionNumber
  );
}
