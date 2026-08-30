// ============================================================
// src/workspace/persistence/GuestWorkspaceSessionSnapshotFactory.ts
// P56D-I1-G2
// GUEST WORKSPACE SESSION SNAPSHOT FACTORY
//
// Deterministic capture boundary:
//
//   live operational runtime state
//            ↓
//   GuestWorkspaceSessionSnapshot
//
// This module composes state owned by existing runtimes.
//
// It does NOT:
//
//   - own mutable runtime state
//   - write sessionStorage
//   - restore runtime state
//   - authenticate accounts
//   - perform Guest -> Account transition
//   - alter Investigation identity
//   - alter Research identity
//   - alter Author document identity
//   - participate in Resolve computation
//
// Architectural direction:
//
//   Runtime
//      ↓
//   Snapshot Factory
//      ↓
//   Persistence Boundary
//
// NOT:
//
//   Persistence Boundary
//      ↓
//   reaches into Runtime
//
// Governing invariant:
//
//   Authentication changes ownership,
//   not investigative identity.
//
// ============================================================

import type {
  OperatorIdentityState,
} from "../../identity/runtime/OperatorIdentityRuntimeTypes";

import type {
  WorkspaceRuntimeState,
} from "../runtime/WorkspaceRuntimeTypes";

import type {
  ResearchDesk,
} from "../../research/researchBridgeTypes";

import type {
  AuthorDocumentRuntimeState,
} from "../../author/runtime/AuthorDocumentRuntimeTypes";

import type {
  GuestWorkspaceSessionSnapshot,
} from "./GuestWorkspaceSessionPersistenceTypes";

import {
  createGuestWorkspaceSessionSnapshot,
} from "./GuestWorkspaceSessionPersistence";


// ============================================================
// CAPTURE INPUT
// ============================================================
//
// The factory receives state explicitly.
//
// It deliberately does not import singleton runtimes.
//
// This keeps capture deterministic and independently testable:
//
//   same state + same timestamps
//             ↓
//        same snapshot
//
// ============================================================

export interface GuestWorkspaceSessionSnapshotFactoryInput {

  identity:
    OperatorIdentityState;

  workspace:
    WorkspaceRuntimeState;

  researchDesk:
    ResearchDesk;

  authoring:
    AuthorDocumentRuntimeState;

  /**
   * Existing snapshot creation time.
   *
   * Supply this when updating an already-existing Guest session
   * snapshot so createdAt remains stable.
   *
   * Omit it for the first snapshot.
   */
  createdAt?:
    string;

  /**
   * Explicit capture timestamp.
   *
   * Production callers may omit this and allow the persistence
   * factory to use the current time.
   *
   * Verification callers should supply a fixed timestamp.
   */
  updatedAt?:
    string;

}


// ============================================================
// ASSERT GUEST IDENTITY
// ============================================================
//
// Snapshot capture is legal only for an established Guest.
//
// NONE:
//   has no operational ownership identity.
//
// ACCOUNT:
//   belongs to the later durable account persistence boundary.
//
// ============================================================

function requireGuestIdentity(
  state:
    OperatorIdentityState,
) {

  const identity =
    state.identity;

  if (
    identity === null
  ) {
    throw new Error(
      "Cannot capture Guest workspace without an established operator identity.",
    );
  }

  if (
    identity.kind !== "GUEST"
  ) {
    throw new Error(
      "Cannot capture Guest workspace for a non-Guest operator.",
    );
  }

  if (
    state.persistence !== "SESSION"
  ) {
    throw new Error(
      "Guest workspace capture requires SESSION persistence policy.",
    );
  }

  return identity;

}


// ============================================================
// VALIDATE OPTIONAL INVESTIGATION
// ============================================================
//
// Investigation is the persistent identity-bearing container.
//
// WorkspaceRuntime currently exposes Investigation through its
// session.
//
// G2 must never manufacture a replacement Investigation merely
// because a snapshot is being captured.
//
// ============================================================

function validateOptionalInvestigation(
  state:
    WorkspaceRuntimeState,
) {

  const investigation =
    state.session.investigation;

  if (
    investigation !== undefined &&
    (
      typeof investigation.id !== "string" ||
      investigation.id.length === 0
    )
  ) {
    throw new Error(
      "Cannot capture Guest workspace with invalid Investigation identity.",
    );
  }

  return investigation;

}


// ============================================================
// CAPTURE
// ============================================================

export function createGuestWorkspaceSnapshotFromRuntimeState(
  input:
    GuestWorkspaceSessionSnapshotFactoryInput,
): GuestWorkspaceSessionSnapshot {

  const identity =
    requireGuestIdentity(
      input.identity,
    );

  const investigation =
    validateOptionalInvestigation(
      input.workspace,
    );

  // ----------------------------------------------------------
  // Capture only the operational state required to reconstruct
  // the Guest workspace.
  //
  // Runtime lifecycle state is deliberately excluded:
  //
  //   status
  //   revision
  //
  // Interaction-only state is deliberately excluded:
  //
  //   selection
  //
  // Other transient state may be added later only when there is
  // an explicit restoration requirement.
  // ----------------------------------------------------------

  return createGuestWorkspaceSessionSnapshot({

    ownership: {

      kind:
        "GUEST",

      operatorId:
        identity.operatorId,

      establishedAt:
        identity.establishedAt,

    },

    createdAt:
      input.createdAt,

    updatedAt:
      input.updatedAt,

    workspace: {

      workspace:
        input.workspace.session.workspace,

      investigation,

      operator: {

        activeMode:
          input.workspace.operator.activeMode,

        layoutMode:
          input.workspace.operator.layoutMode,

      },

      computational: {

        activeLayers: [
          ...input.workspace.computational.activeLayers,
        ],

        temporalContext:
          input.workspace.computational.temporalContext,

        investigativeScale:
          input.workspace.computational.investigativeScale,

      },

    },

    research: {

      desk:
        input.researchDesk,

    },

    authoring: {

      activeDocument:
        input.authoring.activeDocument,

    },

  });

}


// ============================================================
// SNAPSHOT UPDATE
// ============================================================
//
// Convenience helper for subsequent saves.
//
// The original createdAt is preserved while updatedAt may advance.
//
// This function does not compare snapshots or decide whether a
// save is necessary. Change detection belongs to the orchestration
// layer that eventually subscribes to runtime publications.
//
// ============================================================

export function updateGuestWorkspaceSnapshotFromRuntimeState(
  previous:
    GuestWorkspaceSessionSnapshot,

  input:
    Omit<
      GuestWorkspaceSessionSnapshotFactoryInput,
      "createdAt"
    >,
): GuestWorkspaceSessionSnapshot {

  return createGuestWorkspaceSnapshotFromRuntimeState({

    ...input,

    createdAt:
      previous.createdAt,

  });

}


// ============================================================
// INVESTIGATION IDENTITY ASSERTION
// ============================================================
//
// Useful at future transition/restore boundaries.
//
// This compares the identity-bearing Investigation only.
//
// Ownership metadata, timestamps, runtime revisions, and storage
// location are intentionally irrelevant.
//
// ============================================================

export function assertGuestWorkspaceInvestigationIdentity(
  snapshot:
    GuestWorkspaceSessionSnapshot,

  workspaceState:
    WorkspaceRuntimeState,
): void {

  const investigation =
    validateOptionalInvestigation(
      workspaceState,
    );

  const snapshotInvestigation =
    snapshot.workspace.investigation;

  if (
    snapshotInvestigation === undefined &&
    investigation === undefined
  ) {
    return;
  }

  if (
    snapshotInvestigation === undefined ||
    investigation === undefined ||
    snapshotInvestigation.id !== investigation.id
  ) {
    throw new Error(
      [
        "Guest workspace Investigation identity mismatch.",
        `Snapshot=${snapshotInvestigation?.id ?? "NONE"}`,
        `Runtime=${investigation?.id ?? "NONE"}`,
      ].join(" "),
    );
  }

}


// ============================================================
// OWNERSHIP ASSERTION
// ============================================================
//
// A snapshot must belong to the Guest identity attempting to
// update it.
//
// This prevents one Guest runtime context from accidentally
// overwriting another Guest snapshot merely because both use
// session persistence.
//
// ============================================================

export function assertGuestWorkspaceOwnership(
  snapshot:
    GuestWorkspaceSessionSnapshot,

  identityState:
    OperatorIdentityState,
): void {

  const identity =
    requireGuestIdentity(
      identityState,
    );

  if (
    snapshot.ownership.operatorId !==
    identity.operatorId
  ) {
    throw new Error(
      [
        "Guest workspace ownership mismatch.",
        `Snapshot=${snapshot.ownership.operatorId}`,
        `Runtime=${identity.operatorId}`,
      ].join(" "),
    );
  }

}


// ============================================================
// ARCHITECTURAL INVARIANTS
// ============================================================
//
// CAPTURE MUST PRESERVE:
//
//   Guest operator identity
//   Investigation identity
//   Workspace domain state
//   computational configuration
//   Research Desk state
//   Author document identity
//
// CAPTURE MUST EXCLUDE:
//
//   WorkspaceRuntime.status
//   WorkspaceRuntime.revision
//   AuthorDocumentRuntime.revision
//   AuthorDocumentRuntime.dirty
//   React state
//   listeners
//   storage mechanics
//
// CAPTURE MUST NOT:
//
//   manufacture Investigation identity
//   manufacture Research Anchor identity
//   manufacture Author document identity
//   mutate any supplied runtime state
//   alter Resolve mathematics
//
// Therefore:
//
//   Runtime(I, R, D)
//          |
//          v
//      Snapshot(I, R, D)
//
// where:
//
//   identity(I_before)
//       ===
//   identity(I_snapshot)
//
// ============================================================
