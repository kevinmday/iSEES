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

// ============================================================
// CREATE REVISION
// ============================================================

export function createRevision(
  investigation: Investigation,
  manifold: ManifoldRevision,
  operator: string,
  message: string
): InvestigationRevision {

  const revisionNumber =
    investigation.revisions.length + 1;

  const revisionId =
    `REV-${revisionNumber
      .toString()
      .padStart(4, "0")}`;

  return {

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

    manifold,
  };
}

// ============================================================
// COMMIT REVISION
// ============================================================

export function commitRevision(
  investigation: Investigation,
  revision: InvestigationRevision
): Investigation {

  return {

    ...investigation,

    updatedAt:
      revision.timestamp,

    currentRevisionId:
      revision.id,

    revisions: [

      ...investigation.revisions,

      revision,
    ],
  };
}

// ============================================================
// CURRENT REVISION
// ============================================================

export function getCurrentRevision(
  investigation: Investigation
): InvestigationRevision | undefined {

  return investigation.revisions.find(

    revision =>

      revision.id ===
      investigation.currentRevisionId
  );
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