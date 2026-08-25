// ============================================================
// src/identity/transition/GuestToAccountOwnershipTransitionTypes.ts
// P56D-I2-A
// GUEST-TO-ACCOUNT OWNERSHIP TRANSITION TYPES
//
// Canonical contract for transferring an existing Guest-owned
// operational workspace to an authenticated Account.
//
// Authentication is an external precondition.
//
// This contract does NOT:
//
//   - authenticate an operator
//   - create an account
//   - select an authentication provider
//   - create a new Investigation
//   - replace Workspace state
//   - replace Research state
//   - replace Author state
//   - replace Knowledge identity
//   - alter computational capability
//
// Architectural invariants:
//
//   Identity != Session
//   Identity != Workspace
//   Account != Capability
//
//   Authentication changes ownership,
//   not investigative identity.
//
// Canonical transition:
//
//   Guest(G) / SESSION
//          |
//          v
//   authenticated Account(A)
//          |
//          v
//   Account(A) / PERSISTENT
//
// while:
//
//   Investigation I -> Investigation I
//   Workspace W     -> Workspace W
//   Research R      -> Research R
//   Author D        -> Author D
//
// ============================================================

import type {

  OperatorIdentity,

} from "../runtime/OperatorIdentityRuntimeTypes";

import type {

  GuestWorkspaceOwnershipProvenance,
  GuestWorkspaceSessionSnapshot,

} from "../../workspace/persistence/GuestWorkspaceSessionPersistenceTypes";


// ============================================================
// SCHEMA VERSION
// ============================================================
//
// Account-owned persistence has its own schema identity.
//
// It must not pretend that an Account-owned durable snapshot is
// still a Guest browser-session snapshot.
//
// ============================================================

export const ACCOUNT_WORKSPACE_SNAPSHOT_SCHEMA_VERSION =
  1 as const;

export type AccountWorkspaceSnapshotSchemaVersion =
  typeof ACCOUNT_WORKSPACE_SNAPSHOT_SCHEMA_VERSION;


// ============================================================
// AUTHENTICATED ACCOUNT IDENTITY
// ============================================================
//
// Authentication occurs outside this transition contract.
//
// Therefore an Account identity supplied here is already
// authoritative.
//
// The transition may validate and consume it.
//
// It may not manufacture it.
//
// ============================================================

export type AuthenticatedAccountIdentity =
  OperatorIdentity & {

    kind:
      "ACCOUNT";

  };


// ============================================================
// ACCOUNT OWNERSHIP PROVENANCE
// ============================================================
//
// Ownership provenance records:
//
//   who owns the durable workspace now
//
// and:
//
//   which Guest identity previously owned the operational state.
//
// The previous Guest provenance remains attached for auditability.
//
// Investigation, Knowledge, Research, and Author identities are
// not embedded into ownership identity.
//
// ============================================================

export interface AccountWorkspaceOwnershipProvenance {

  kind:
    "ACCOUNT";

  operatorId:
    string;

  establishedAt:
    string;

  acquiredAt:
    string;

  previousOwnership:
    GuestWorkspaceOwnershipProvenance;

}


// ============================================================
// ACCOUNT-OWNED WORKSPACE SNAPSHOT
// ============================================================
//
// The operational payload deliberately reuses the canonical
// workspace, research, and authoring shapes already proven by
// Guest session persistence.
//
// Their identities and contents survive the ownership transfer.
//
// The storage boundary changes:
//
//   Guest sessionStorage
//       ->
//   Account durable persistence
//
// The operational application does not.
//
// ============================================================

export interface AccountOwnedWorkspaceSnapshot {

  schemaVersion:
    AccountWorkspaceSnapshotSchemaVersion;

  ownership:
    AccountWorkspaceOwnershipProvenance;

  createdAt:
    string;

  updatedAt:
    string;

  workspace:
    GuestWorkspaceSessionSnapshot["workspace"];

  research:
    GuestWorkspaceSessionSnapshot["research"];

  authoring:
    GuestWorkspaceSessionSnapshot["authoring"];

}


// ============================================================
// TRANSITION REQUEST
// ============================================================
//
// transitionedAt is supplied by the caller.
//
// This keeps the transition materializer deterministic for a
// given complete input.
//
// ============================================================

export interface GuestToAccountOwnershipTransitionRequest {

  guestSnapshot:
    GuestWorkspaceSessionSnapshot;

  authenticatedAccount:
    AuthenticatedAccountIdentity;

  transitionedAt:
    string;

}


// ============================================================
// TRANSITION IDENTITY RECORD
// ============================================================
//
// This record makes the ownership change inspectable without
// confusing operator identity with Investigation identity.
//
// ============================================================

export interface GuestToAccountIdentityTransition {

  fromOperatorId:
    string;

  fromKind:
    "GUEST";

  fromPersistence:
    "SESSION";

  toOperatorId:
    string;

  toKind:
    "ACCOUNT";

  toPersistence:
    "PERSISTENT";

  transitionedAt:
    string;

}


// ============================================================
// PRESERVATION RECORD
// ============================================================
//
// These values describe the canonical artifact identity that must
// survive the transition.
//
// The transition implementation must derive these values from the
// before and after snapshots and reject any mismatch.
//
// ============================================================

export interface GuestToAccountPreservationRecord {

  investigationId:
    string;

  activeAuthorDocumentId:
    string | null;

  researchAnchorIds:
    ReadonlyArray<string>;

}


// ============================================================
// TRANSITION RESULT
// ============================================================
//
// A successful result contains:
//
//   - the explicit identity/persistence transition
//   - the Account-owned durable snapshot
//   - the preserved artifact-identity record
//
// The result does not contain authentication credentials.
//
// ============================================================

export interface GuestToAccountOwnershipTransitionResult {

  identityTransition:
    GuestToAccountIdentityTransition;

  accountSnapshot:
    AccountOwnedWorkspaceSnapshot;

  preservation:
    GuestToAccountPreservationRecord;

}


// ============================================================
// SEMANTIC HELPERS
// ============================================================

export function isAuthenticatedAccountIdentity(

  identity:
    OperatorIdentity,

): identity is AuthenticatedAccountIdentity {

  return (
    identity.kind ===
    "ACCOUNT"
  );

}


export function isAccountWorkspaceOwnership(

  ownership:
    AccountWorkspaceOwnershipProvenance,

): boolean {

  return (
    ownership.kind ===
    "ACCOUNT"
  );

}


export function isAccountWorkspaceSnapshotSchemaVersion(

  value:
    unknown,

): value is AccountWorkspaceSnapshotSchemaVersion {

  return (
    value ===
    ACCOUNT_WORKSPACE_SNAPSHOT_SCHEMA_VERSION
  );

}


// ============================================================
// ARCHITECTURAL ASSERTION
// ============================================================
//
// This helper validates only the identity/persistence transition.
//
// Complete operational-state preservation belongs to the
// transition materializer and its verifier.
//
// ============================================================

export function assertGuestToAccountIdentityTransition(

  transition:
    GuestToAccountIdentityTransition,

): void {

  if (
    transition.fromKind !== "GUEST" ||
    transition.fromPersistence !== "SESSION"
  ) {

    throw new Error(
      "Guest-to-Account transition must originate from GUEST / SESSION.",
    );

  }

  if (
    transition.toKind !== "ACCOUNT" ||
    transition.toPersistence !== "PERSISTENT"
  ) {

    throw new Error(
      "Guest-to-Account transition must terminate at ACCOUNT / PERSISTENT.",
    );

  }

  if (
    transition.fromOperatorId.length === 0 ||
    !transition.fromOperatorId.startsWith(
      "guest:",
    )
  ) {

    throw new Error(
      "Guest-to-Account transition requires a canonical Guest operator identity.",
    );

  }

  if (
    transition.toOperatorId.length === 0
  ) {

    throw new Error(
      "Guest-to-Account transition requires an authenticated Account operator identity.",
    );

  }

  if (
    transition.fromOperatorId ===
    transition.toOperatorId
  ) {

    throw new Error(
      "Guest and Account operator identities must remain distinct.",
    );

  }

  if (
    transition.transitionedAt.length === 0
  ) {

    throw new Error(
      "Guest-to-Account transition requires an explicit transition timestamp.",
    );

  }

}


// ============================================================
// GOVERNING INVARIANT
// ============================================================
//
//   Ownership(G, I, W, R, D)
//              |
//              v
//   Authenticate(A)
//              |
//              v
//   Ownership(A, I, W, R, D)
//
// The owner changes.
//
// The investigation does not.
//
// The application capability does not.
//
// ============================================================