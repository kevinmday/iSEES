// ============================================================
// src/identity/runtime/OperatorIdentityRuntimeTypes.ts
// P56D-I1
// OPERATOR IDENTITY RUNTIME TYPES
//
// Canonical identity contract for the human operating iSEES.
//
// Identity answers:
//
//   WHO is operating iSEES?
//
// It does NOT answer:
//
//   WHAT is the operator doing?
//     -> OperatorSessionRuntime
//
//   WHAT is the operator working on?
//     -> WorkspaceRuntime
//
// Architectural invariants:
//
//   Identity != Session
//   Identity != Workspace
//   Account != Capability
//
// Guest operators use the real iSEES application.
// Accounts add durable persistence, not computational power.
//
// ============================================================


// ============================================================
// RUNTIME STATUS
// ============================================================

export type OperatorIdentityRuntimeStatus =
  | "INITIALIZING"
  | "READY";


// ============================================================
// IDENTITY KIND
// ============================================================
//
// NONE
//   No operator identity has been established yet.
//   The application should present the entry experience.
//
// GUEST
//   Full iSEES operator using session-scoped persistence.
//
// ACCOUNT
//   Authenticated operator using persistent account storage.
//
// ACCOUNT is part of the canonical vocabulary now even though
// account authentication is implemented in a later phase.
//
// ============================================================

export type OperatorIdentityKind =
  | "NONE"
  | "GUEST"
  | "ACCOUNT";


// ============================================================
// PERSISTENCE KIND
// ============================================================
//
// NONE
//   No active operator workspace persistence policy.
//
// SESSION
//   Browser-session persistence.
//   Intended for Guest operation.
//
// PERSISTENT
//   Durable account-backed persistence.
//   Implemented by the account persistence phase.
//
// Persistence describes durability.
// It does NOT describe application capability.
//
// ============================================================

export type OperatorPersistenceKind =
  | "NONE"
  | "SESSION"
  | "PERSISTENT";


// ============================================================
// OPERATOR IDENTITY
// ============================================================
//
// Identity is intentionally independent of Workspace.
//
// A Guest identity is real runtime identity even though it is
// ephemeral.
//
// operatorId gives the active operator context a stable identity
// for the lifetime of that context.
//
// Account identity will later carry an authenticated account
// identity through this same contract.
//
// ============================================================

export type OperatorIdentity = {

  operatorId:
    string;

  kind:
    Exclude<
      OperatorIdentityKind,
      "NONE"
    >;

  establishedAt:
    string;

};


// ============================================================
// OPERATOR IDENTITY STATE
// ============================================================
//
// React and other consumers observe this state.
//
// Mutable ownership remains inside OperatorIdentityRuntime.
//
// revision provides deterministic publication semantics
// consistent with the existing iSEES runtime architecture.
//
// ============================================================

export type OperatorIdentityState = {

  status:
    OperatorIdentityRuntimeStatus;

  identity:
    OperatorIdentity | null;

  persistence:
    OperatorPersistenceKind;

  revision:
    number;

};


// ============================================================
// CANONICAL EMPTY STATE
// ============================================================
//
// No identity exists until the operator deliberately chooses
// an entry path.
//
// Guest must therefore never be silently inferred merely from
// the absence of an authenticated account.
//
// ============================================================

export const INITIAL_OPERATOR_IDENTITY_STATE:
  OperatorIdentityState = {

  status:
    "INITIALIZING",

  identity:
    null,

  persistence:
    "NONE",

  revision:
    0,

};


// ============================================================
// SEMANTIC HELPERS
// ============================================================

export function getOperatorIdentityKind(

  state:
    OperatorIdentityState,

): OperatorIdentityKind {

  return state.identity?.kind ?? "NONE";

}


export function hasOperatorIdentity(

  state:
    OperatorIdentityState,

): boolean {

  return state.identity !== null;

}


export function isGuestOperator(

  state:
    OperatorIdentityState,

): boolean {

  return state.identity?.kind === "GUEST";

}


export function isAccountOperator(

  state:
    OperatorIdentityState,

): boolean {

  return state.identity?.kind === "ACCOUNT";

}


// ============================================================
// INVARIANT HELPERS
// ============================================================
//
// These helpers make the persistence semantics explicit.
//
// They do not perform persistence.
//
// ============================================================

export function isSessionPersistent(

  state:
    OperatorIdentityState,

): boolean {

  return state.persistence === "SESSION";

}


export function isDurablyPersistent(

  state:
    OperatorIdentityState,

): boolean {

  return state.persistence === "PERSISTENT";

}