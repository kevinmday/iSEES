// ============================================================
// src/identity/runtime/OperatorIdentityRuntime.ts
// P56D-I1-G1
// DETERMINISTIC OPERATOR IDENTITY RUNTIME
//
// Canonical mutable owner of operator identity state.
//
// This runtime answers:
//
//   WHO is operating iSEES?
//
// It does NOT own:
//
//   Operator activity
//     -> OperatorSessionRuntime
//
//   Research/computational workspace
//     -> WorkspaceRuntime
//
//   Authentication implementation
//     -> later account phase
//
//   Workspace persistence implementation
//     -> workspace persistence boundary
//
// Architectural invariants:
//
//   Identity != Session
//   Identity != Workspace
//   Account != Capability
//
// Guest operation is the real iSEES application.
// Guest differs from Account only by persistence policy.
//
// P56D-I1-G1:
//
//   Guest identity is persisted for the browser session.
//
//   initialize()
//       -> restore validated Guest identity when present
//
//   continueAsGuest()
//       -> establish + persist Guest identity
//
//   clearIdentity()
//       -> clear persisted Guest identity
//
// ============================================================

import {

  INITIAL_OPERATOR_IDENTITY_STATE,

} from "./OperatorIdentityRuntimeTypes";

import type {

  OperatorIdentity,
  OperatorIdentityState,

} from "./OperatorIdentityRuntimeTypes";

import {

  clearGuestIdentitySession,
  restoreGuestIdentityFromSession,
  saveGuestIdentityToSession,

} from "../persistence/OperatorIdentitySessionPersistence";


// ============================================================
// LISTENER
// ============================================================

export type OperatorIdentityRuntimeListener =
  () => void;


// ============================================================
// RUNTIME
// ============================================================

export class OperatorIdentityRuntime {

  private state:
    OperatorIdentityState;

  private readonly listeners =
    new Set<OperatorIdentityRuntimeListener>();


  constructor() {

    this.state = {

      ...INITIAL_OPERATOR_IDENTITY_STATE,

    };

  }


  // ==========================================================
  // STATE ACCESS
  // ==========================================================

  getState():

    OperatorIdentityState {

    return this.state;

  }


  // ==========================================================
  // SUBSCRIPTION
  // ==========================================================

  subscribe(

    listener:
      OperatorIdentityRuntimeListener,

  ): () => void {

    this.listeners.add(
      listener,
    );

    return () => {

      this.listeners.delete(
        listener,
      );

    };

  }


  // ==========================================================
  // INITIALIZATION
  // ==========================================================
  //
  // Initialization does NOT manufacture a Guest identity.
  //
  // It may, however, restore a Guest identity that the human
  // explicitly established earlier in the SAME browser session.
  //
  // Therefore:
  //
  //   no persisted identity
  //       -> READY / NONE
  //
  //   valid persisted Guest identity
  //       -> READY / GUEST / SESSION
  //
  // Browser storage is validated by the persistence boundary
  // before it can enter runtime state.
  //
  // ==========================================================

  initialize(): void {

    if (

      this.state.status === "READY"

    ) {

      return;

    }


    const restoredGuestIdentity =
      restoreGuestIdentityFromSession();


    if (

      restoredGuestIdentity !== null

    ) {

      this.publish({

        ...this.state,

        status:
          "READY",

        identity:
          restoredGuestIdentity,

        persistence:
          "SESSION",

      });

      return;

    }


    this.publish({

      ...this.state,

      status:
        "READY",

      identity:
        null,

      persistence:
        "NONE",

    });

  }


  // ==========================================================
  // CONTINUE AS GUEST
  // ==========================================================
  //
  // Establishes a real operator identity with SESSION
  // persistence.
  //
  // This does not:
  //
  //   - create a different application mode
  //   - change Workspace semantics
  //   - change OperatorSession semantics
  //   - alter Resolve capability
  //   - alter Knowledge capability
  //
  // ==========================================================

  continueAsGuest(): void {

    if (

      this.state.status !== "READY"

    ) {

      throw new Error(

        "OperatorIdentityRuntime must be READY before establishing Guest identity.",

      );

    }


    if (

      this.state.identity?.kind === "GUEST" &&
      this.state.persistence === "SESSION"

    ) {

      return;

    }


    if (

      this.state.identity !== null

    ) {

      throw new Error(

        "Operator identity is already established.",

      );

    }


    const identity:
      OperatorIdentity = {

      operatorId:
        this.createGuestOperatorId(),

      kind:
        "GUEST",

      establishedAt:
        new Date().toISOString(),

    };


    // Persist before publishing the identity.
    //
    // If browser persistence throws unexpectedly, runtime state
    // must not claim SESSION persistence that was never actually
    // established.

    saveGuestIdentityToSession(
      identity,
    );


    this.publish({

      ...this.state,

      identity,

      persistence:
        "SESSION",

    });

  }


  // ==========================================================
  // CLEAR IDENTITY
  // ==========================================================
  //
  // Returns the runtime to READY / NONE.
  //
  // Persisted Guest identity is removed before runtime state is
  // published as identity-free.
  //
  // Workspace destruction/preservation semantics remain outside
  // this runtime.
  //
  // ==========================================================

  clearIdentity(): void {

    if (

      this.state.identity === null &&
      this.state.persistence === "NONE"

    ) {

      // Defensive cleanup handles stale browser state without
      // creating a runtime revision for an otherwise unchanged
      // identity state.

      clearGuestIdentitySession();

      return;

    }


    clearGuestIdentitySession();


    this.publish({

      ...this.state,

      identity:
        null,

      persistence:
        "NONE",

    });

  }


  // ==========================================================
  // PUBLICATION
  // ==========================================================
  //
  // All mutable runtime-state publication flows through this
  // boundary.
  //
  // revision increments exactly once for each material runtime
  // state transition.
  //
  // Browser persistence itself does not increment revision.
  //
  // ==========================================================

  private publish(

    nextState:
      OperatorIdentityState,

  ): void {

    this.state = {

      ...nextState,

      revision:
        this.state.revision + 1,

    };


    for (

      const listener
      of this.listeners

    ) {

      listener();

    }

  }


  // ==========================================================
  // GUEST OPERATOR IDENTITY
  // ==========================================================
  //
  // A newly established Guest receives a unique operator ID.
  //
  // P56D-I1-G1 then preserves this SAME identity across page
  // refreshes during the browser session.
  //
  // The UUID and timestamp are identity metadata only.
  //
  // They have no computational meaning and must never enter
  // canonical Resolve mathematics.
  //
  // ==========================================================

  private createGuestOperatorId():

    string {

    return `guest:${crypto.randomUUID()}`;

  }

}


// ============================================================
// SINGLETON RUNTIME
// ============================================================
//
// Consistent with the existing iSEES runtime architecture:
//
//   Runtime owns mutable state.
//   React observes runtime publication.
//
// ============================================================

export const operatorIdentityRuntime =
  new OperatorIdentityRuntime();