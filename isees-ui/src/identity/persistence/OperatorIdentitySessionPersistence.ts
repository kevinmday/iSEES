// ============================================================
// src/identity/persistence/OperatorIdentitySessionPersistence.ts
// P56D-I1-G1
// OPERATOR IDENTITY SESSION PERSISTENCE
//
// Browser-session persistence boundary for Guest identity.
//
// Responsibilities:
//
//   SAVE
//     Guest identity -> sessionStorage
//
//   RESTORE
//     sessionStorage -> validated Guest identity
//
//   CLEAR
//     remove persisted Guest identity
//
// This module does NOT:
//
//   - persist Workspace state
//   - authenticate accounts
//   - persist account identity
//   - alter application capability
//   - participate in Resolve computation
//
// Browser storage is treated as untrusted input.
// Persisted state must be validated before restoration.
//
// ============================================================

import type {

  OperatorIdentity,

} from "../runtime/OperatorIdentityRuntimeTypes";


// ============================================================
// STORAGE CONTRACT
// ============================================================

const OPERATOR_IDENTITY_SESSION_STORAGE_KEY =
  "isees.operatorIdentity.guest.v1";


// ============================================================
// SERIALIZED CONTRACT
// ============================================================
//
// Keep the persisted representation deliberately smaller than
// OperatorIdentityState.
//
// Runtime status and revision are runtime concerns and should
// not be restored from browser storage.
//
// ============================================================

type PersistedGuestIdentity = {

  version:
    1;

  identity: {

    operatorId:
      string;

    kind:
      "GUEST";

    establishedAt:
      string;

  };

};


// ============================================================
// ENVIRONMENT
// ============================================================

function hasSessionStorage():

  boolean {

  return (

    typeof window !== "undefined" &&
    typeof window.sessionStorage !== "undefined"

  );

}


// ============================================================
// VALIDATION
// ============================================================

function isPersistedGuestIdentity(

  value:
    unknown,

): value is PersistedGuestIdentity {

  if (

    typeof value !== "object" ||
    value === null

  ) {

    return false;

  }


  const candidate =
    value as Partial<PersistedGuestIdentity>;


  if (

    candidate.version !== 1 ||
    typeof candidate.identity !== "object" ||
    candidate.identity === null

  ) {

    return false;

  }


  const identity =
    candidate.identity as Partial<
      PersistedGuestIdentity["identity"]
    >;


  if (

    identity.kind !== "GUEST" ||
    typeof identity.operatorId !== "string" ||
    identity.operatorId.length === 0 ||
    !identity.operatorId.startsWith("guest:") ||
    typeof identity.establishedAt !== "string" ||
    identity.establishedAt.length === 0

  ) {

    return false;

  }


  return true;

}


// ============================================================
// SAVE
// ============================================================

export function saveGuestIdentityToSession(

  identity:
    OperatorIdentity,

): void {

  if (

    identity.kind !== "GUEST"

  ) {

    throw new Error(

      "OperatorIdentitySessionPersistence only persists Guest identity.",

    );

  }


  if (

    !hasSessionStorage()

  ) {

    return;

  }


  const persisted:
    PersistedGuestIdentity = {

    version:
      1,

    identity: {

      operatorId:
        identity.operatorId,

      kind:
        "GUEST",

      establishedAt:
        identity.establishedAt,

    },

  };


  window.sessionStorage.setItem(

    OPERATOR_IDENTITY_SESSION_STORAGE_KEY,

    JSON.stringify(
      persisted,
    ),

  );

}


// ============================================================
// RESTORE
// ============================================================

export function restoreGuestIdentityFromSession():

  OperatorIdentity | null {

  if (

    !hasSessionStorage()

  ) {

    return null;

  }


  const serialized =
    window.sessionStorage.getItem(

      OPERATOR_IDENTITY_SESSION_STORAGE_KEY,

    );


  if (

    serialized === null

  ) {

    return null;

  }


  let parsed:
    unknown;


  try {

    parsed =
      JSON.parse(
        serialized,
      );

  } catch {

    clearGuestIdentitySession();

    return null;

  }


  if (

    !isPersistedGuestIdentity(
      parsed,
    )

  ) {

    clearGuestIdentitySession();

    return null;

  }


  return {

    operatorId:
      parsed.identity.operatorId,

    kind:
      "GUEST",

    establishedAt:
      parsed.identity.establishedAt,

  };

}


// ============================================================
// CLEAR
// ============================================================

export function clearGuestIdentitySession():

  void {

  if (

    !hasSessionStorage()

  ) {

    return;

  }


  window.sessionStorage.removeItem(

    OPERATOR_IDENTITY_SESSION_STORAGE_KEY,

  );

}