// ============================================================
// src/workspace/persistence/GuestWorkspaceSessionPersistence.ts
// P56D-I1-G2
// GUEST WORKSPACE SESSION PERSISTENCE
//
// Browser-session persistence boundary for Guest operational
// workspace state.
//
// G1:
//
//   Guest identity
//       -> sessionStorage
//
// G2:
//
//   Guest operational workspace
//       -> sessionStorage
//
// This module owns storage mechanics only.
//
// It does NOT:
//
//   - own WorkspaceRuntime state
//   - own operator identity
//   - authenticate accounts
//   - perform Guest -> Account transition
//   - mutate ResearchRuntime
//   - mutate AuthorDocumentRuntime
//   - participate in Resolve computation
//
// Browser storage is untrusted input.
//
// Therefore:
//
//   SAVE
//       validated runtime-produced snapshot
//           -> JSON
//           -> sessionStorage
//
//   RESTORE
//       sessionStorage
//           -> JSON.parse
//           -> structural validation
//           -> snapshot or INVALID
//
//   CLEAR
//       remove persisted workspace snapshot
//
// ============================================================

import {
  GUEST_WORKSPACE_SESSION_SCHEMA_VERSION,
  isGuestWorkspaceSessionSchemaVersion,
} from "./GuestWorkspaceSessionPersistenceTypes";

import type {
  GuestWorkspaceSessionRestoreResult,
  GuestWorkspaceSessionSnapshot,
} from "./GuestWorkspaceSessionPersistenceTypes";
import { migrateResearchAnchor } from "../../research/ResearchAnchorContract.ts";


// ============================================================
// STORAGE KEY
// ============================================================
//
// Identity persistence intentionally uses its own key.
//
// Workspace persistence must remain independently removable and
// independently evolvable.
//
// ============================================================

export const GUEST_WORKSPACE_SESSION_STORAGE_KEY =
  "isees.guest.workspace.session";


// ============================================================
// GENERIC STRUCTURAL HELPERS
// ============================================================

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {

  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );

}


function isString(
  value:
    unknown,
): value is string {

  return (
    typeof value === "string"
  );

}


// ============================================================
// SESSION STORAGE AVAILABILITY
// ============================================================
//
// Persistence is browser infrastructure.
//
// Tests, verification programs, SSR-like environments, or other
// non-browser execution contexts may not expose window.
//
// ============================================================

function hasSessionStorage():
  boolean {

  return (
    typeof window !== "undefined" &&
    typeof window.sessionStorage !== "undefined"
  );

}


// ============================================================
// OWNERSHIP VALIDATION
// ============================================================

function isGuestOwnership(
  value:
    unknown,
): boolean {

  if (
    !isRecord(value)
  ) {
    return false;
  }

  return (
    value.kind === "GUEST" &&
    isString(
      value.operatorId,
    ) &&
    value.operatorId.length > 0 &&
    isString(
      value.establishedAt,
    ) &&
    value.establishedAt.length > 0
  );

}


// ============================================================
// WORKSPACE OPERATOR VALIDATION
// ============================================================
//
// activeMode/layoutMode are canonical string-valued runtime
// vocabulary.
//
// Their exact semantic validity remains owned by WorkspaceRuntime.
//
// Here we enforce only the persistence boundary's structural
// contract.
//
// ============================================================

function isPersistedWorkspaceOperator(
  value:
    unknown,
): value is {
  activeMode: string;
  layoutMode: string;
} {

  if (
    !isRecord(value)
  ) {
    return false;
  }

  return (
    isString(
      value.activeMode,
    ) &&
    value.activeMode.length > 0 &&
    isString(
      value.layoutMode,
    ) &&
    value.layoutMode.length > 0
  );

}


// ============================================================
// INVESTIGATION VALIDATION
// ============================================================
//
// G2's most important persisted invariant is investigation
// identity preservation.
//
// We therefore require an Investigation object with a non-empty
// string identity before a snapshot may enter runtime restoration.
//
// Full Investigation semantic validation remains owned by the
// Investigation domain.
//
// ============================================================

function isPersistedInvestigation(
  value:
    unknown,
): boolean {

  if (
    !isRecord(value)
  ) {
    return false;
  }

  return (
    isString(
      value.id,
    ) &&
    value.id.length > 0
  );

}


// ============================================================
// WORKSPACE STATE VALIDATION
// ============================================================
//
// The persistence layer performs conservative structural
// validation.
//
// It deliberately does not duplicate the complete validators for
// Workspace, Investigation, or computational configuration.
//
// Those domains remain authoritative for their own semantics.
//
// ============================================================

function isPersistedWorkspaceState(
  value:
    unknown,
): boolean {

  if (
    !isRecord(value)
  ) {
    return false;
  }

  if (
    value.investigation !== undefined &&
    !isPersistedInvestigation(
      value.investigation,
    )
  ) {
    return false;
  }

  // A Workspace is owned by an Investigation. Persisting one
  // without the other would create an ownerless domain object.
  if (
    value.workspace !== undefined &&
    value.investigation === undefined
  ) {
    return false;
  }

  if (
    !isPersistedWorkspaceOperator(
      value.operator,
    )
  ) {
    return false;
  }

  if (
    !isRecord(
      value.computational,
    )
  ) {
    return false;
  }

  // A canonical empty Guest session is an OVERVIEW/normal shell
  // with no computational configuration. It is not a partially
  // active investigation.
  if (
    value.investigation === undefined &&
    (
      value.operator.activeMode !== "OVERVIEW" ||
      value.operator.layoutMode !== "NORMAL" ||
      !Array.isArray(value.computational.activeLayers) ||
      value.computational.activeLayers.length !== 0 ||
      value.computational.temporalContext !== undefined ||
      value.computational.investigativeScale !== undefined
    )
  ) {
    return false;
  }

  if (
    value.workspace !== undefined &&
    !isRecord(
      value.workspace,
    )
  ) {
    return false;
  }

  return true;

}


// ============================================================
// RESEARCH STATE VALIDATION
// ============================================================
//
// ResearchDesk currently consists of an entries collection.
//
// We validate the persistence shape without attempting to
// reinterpret Research Anchor semantics.
//
// ============================================================

function isPersistedResearchState(
  value:
    unknown,
): boolean {

  if (
    !isRecord(value)
  ) {
    return false;
  }

  if (
    !isRecord(
      value.desk,
    )
  ) {
    return false;
  }

  if (!Array.isArray(value.desk.entries)) return false;

  return value.desk.entries.every(entry => {
    if (!isRecord(entry) || typeof entry.order !== "number" || !isRecord(entry.anchor)) return false;
    const anchor = entry.anchor;
    if (!isString(anchor.anchorId) || !isString(anchor.investigationId) || typeof anchor.pinned !== "boolean") return false;
    if (anchor.schemaVersion === "research-anchor/v2") {
      try { migrateResearchAnchor(anchor); return true; } catch { return false; }
    }
    if (isRecord(anchor.graph)) {
      return (anchor.graph.type === "NODE" || anchor.graph.type === "EDGE") && isString(anchor.graph.id) && typeof anchor.graphRevision === "number";
    }
    if (isRecord(anchor.experiment)) {
      const experiment = anchor.experiment;
      const projection = experiment.projection;
      return experiment.type === "EXPERIMENT" && experiment.source === "LAYERS_EXPERIMENTAL_LABORATORY" &&
        isString(experiment.caseAEventId) && isString(experiment.caseBEventId) && isRecord(projection) &&
        projection.kind === "LAYERS_EXPERIMENTAL_PAIR_PROJECTION" && isString(projection.projectionId) &&
        isString(projection.executionId) && projection.createsCanonicalKnowledgeRelationship === false &&
        isRecord(projection.provenance) && isString(projection.provenance.canonicalRepresentation) &&
        Array.isArray(projection.layerContributions) && Array.isArray(projection.unavailableInputs);
    }
    if (!isRecord(anchor.candidate) || anchor.candidate.type !== "CANDIDATE") return false;
    const candidate = anchor.candidate;
    const identities = [candidate.candidateId, candidate.evaluationId, candidate.leftKnowledgeObjectId, candidate.rightKnowledgeObjectId, candidate.focusedEventId, candidate.focusedEventKnowledgeObjectId, candidate.comparisonEventId, candidate.comparisonEventKnowledgeObjectId];
    return identities.every(isString) && candidate.source === "COMPARE_PAIR_INSPECTION" && isRecord(candidate.aggregate) && Array.isArray(candidate.dimensions) && candidate.dimensions.length === 5;
  });

}


// ============================================================
// AUTHORING STATE VALIDATION
// ============================================================
//
// An active document is optional.
//
// If present, require an object.
//
// Artifact/domain-specific validation remains owned by the Author
// model and later restoration integration.
//
// ============================================================

function isPersistedAuthoringState(
  value:
    unknown,
): boolean {

  if (
    !isRecord(value)
  ) {
    return false;
  }

  if (
    value.activeDocument !== undefined &&
    !isRecord(
      value.activeDocument,
    )
  ) {
    return false;
  }

  return true;

}


// ============================================================
// SNAPSHOT VALIDATION
// ============================================================
//
// Browser storage is untrusted.
//
// No parsed object is allowed to cross this boundary merely
// because TypeScript says it has a particular compile-time type.
//
// ============================================================

export function isGuestWorkspaceSessionSnapshot(
  value:
    unknown,
): value is GuestWorkspaceSessionSnapshot {

  if (
    !isRecord(value)
  ) {
    return false;
  }

  if (
    !isGuestWorkspaceSessionSchemaVersion(
      value.schemaVersion,
    )
  ) {
    return false;
  }

  if (
    !isGuestOwnership(
      value.ownership,
    )
  ) {
    return false;
  }

  if (
    !isString(
      value.createdAt,
    ) ||
    value.createdAt.length === 0
  ) {
    return false;
  }

  if (
    !isString(
      value.updatedAt,
    ) ||
    value.updatedAt.length === 0
  ) {
    return false;
  }

  if (
    !isPersistedWorkspaceState(
      value.workspace,
    )
  ) {
    return false;
  }

  if (
    !isPersistedResearchState(
      value.research,
    )
  ) {
    return false;
  }

  if (
    !isPersistedAuthoringState(
      value.authoring,
    )
  ) {
    return false;
  }

  return true;

}


// ============================================================
// SAVE
// ============================================================
//
// The caller constructs the canonical snapshot.
//
// This boundary verifies the schema before serialization.
//
// SAVE intentionally does not manufacture timestamps or identity.
//
// Those values belong to the snapshot construction/integration
// layer.
//
// ============================================================

export function saveGuestWorkspaceSession(
  snapshot:
    GuestWorkspaceSessionSnapshot,
): void {

  if (
    !isGuestWorkspaceSessionSnapshot(
      snapshot,
    )
  ) {
    throw new Error(
      "Cannot persist invalid Guest workspace session snapshot.",
    );
  }

  if (
    !hasSessionStorage()
  ) {
    return;
  }

  window.sessionStorage.setItem(
    GUEST_WORKSPACE_SESSION_STORAGE_KEY,
    JSON.stringify(
      snapshot,
    ),
  );

}


// ============================================================
// RESTORE
// ============================================================
//
// Restoration has three explicit outcomes:
//
// EMPTY
//   No Guest workspace snapshot exists.
//
// RESTORED
//   Snapshot exists and passes structural validation.
//
// INVALID
//   Storage existed but could not safely become runtime state.
//
// INVALID storage is cleared immediately.
//
// This prevents repeatedly attempting to restore malformed state.
//
// ============================================================

export function restoreGuestWorkspaceSession():
  GuestWorkspaceSessionRestoreResult {

  if (
    !hasSessionStorage()
  ) {
    return {
      status:
        "EMPTY",
    };
  }

  const serialized =
    window.sessionStorage.getItem(
      GUEST_WORKSPACE_SESSION_STORAGE_KEY,
    );

  if (
    serialized === null
  ) {
    return {
      status:
        "EMPTY",
    };
  }

  let parsed:
    unknown;

  try {

    parsed =
      JSON.parse(
        serialized,
      );

  } catch {

    clearGuestWorkspaceSession();

    return {
      status:
        "INVALID",

      reason:
        "Guest workspace session contained invalid JSON.",
    };

  }

  if (
    !isGuestWorkspaceSessionSnapshot(
      parsed,
    )
  ) {

    clearGuestWorkspaceSession();

    return {
      status:
        "INVALID",

      reason:
        "Guest workspace session failed structural validation.",
    };

  }

  return {
    status:
      "RESTORED",

    snapshot:
      parsed,
  };

}


// ============================================================
// CLEAR
// ============================================================

export function clearGuestWorkspaceSession():
  void {

  if (
    !hasSessionStorage()
  ) {
    return;
  }

  window.sessionStorage.removeItem(
    GUEST_WORKSPACE_SESSION_STORAGE_KEY,
  );

}


// ============================================================
// EXISTS
// ============================================================
//
// Convenience inspection helper.
//
// This does NOT imply validity.
//
// Call restoreGuestWorkspaceSession() when validated state is
// required.
//
// ============================================================

export function hasGuestWorkspaceSession():
  boolean {

  if (
    !hasSessionStorage()
  ) {
    return false;
  }

  return (
    window.sessionStorage.getItem(
      GUEST_WORKSPACE_SESSION_STORAGE_KEY,
    ) !== null
  );

}


// ============================================================
// CREATE EMPTY SNAPSHOT FACTORY
// ============================================================
//
// This factory intentionally requires all domain state from the
// caller.
//
// Persistence must not reach into singleton runtimes itself.
//
// That keeps:
//
//   Runtime -> snapshot construction -> persistence
//
// rather than:
//
//   Persistence -> reaches into Runtime
//
// which preserves clean ownership boundaries.
//
// ============================================================

export function createGuestWorkspaceSessionSnapshot(
  input:
    Omit<
      GuestWorkspaceSessionSnapshot,
      | "schemaVersion"
      | "createdAt"
      | "updatedAt"
    > & {
      createdAt?:
        string;

      updatedAt?:
        string;
    },
): GuestWorkspaceSessionSnapshot {

  const now =
    new Date().toISOString();

  const snapshot:
    GuestWorkspaceSessionSnapshot = {

    ...input,

    schemaVersion:
      GUEST_WORKSPACE_SESSION_SCHEMA_VERSION,

    createdAt:
      input.createdAt ??
      now,

    updatedAt:
      input.updatedAt ??
      now,

  };

  if (
    !isGuestWorkspaceSessionSnapshot(
      snapshot,
    )
  ) {
    throw new Error(
      "Failed to construct valid Guest workspace session snapshot.",
    );
  }

  return snapshot;

}


// ============================================================
// ARCHITECTURAL INVARIANTS
// ============================================================
//
// This persistence boundary must remain computationally inert.
//
// It may:
//
//   serialize
//   validate
//   restore
//   clear
//
// It may NOT:
//
//   create Investigation identity
//   replace Investigation identity
//   create Knowledge identity
//   replace Knowledge identity
//   create Research Anchor identity
//   replace Research Anchor identity
//   create Author Document identity
//   replace Author Document identity
//   alter Resolve inputs
//   alter Resolve mathematics
//
// Therefore:
//
//   persist(I) -> restore(I)
//
// must preserve:
//
//   identity(I_before) === identity(I_after)
//
// Authentication and account ownership transition are deliberately
// implemented outside this storage module.
//
// ============================================================
