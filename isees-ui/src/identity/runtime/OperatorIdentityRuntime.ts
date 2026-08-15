// ============================================================
// src/identity/runtime/OperatorIdentityRuntime.ts
// P56D-I1
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
//     -> persistence boundary
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
// ============================================================

import {

  INITIAL_OPERATOR_IDENTITY_STATE,

} from "./OperatorIdentityRuntimeTypes";

import type {

  OperatorIdentity,
  OperatorIdentityState,

} from "./OperatorIdentityRuntimeTypes";


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
  // Initialization deliberately does NOT create a Guest.
  //
  // Absence of an authenticated account must not silently mean
  // Guest operation.
  //
  // The human explicitly chooses an entry path.
  //
  // ==========================================================

  initialize(): void {

    if (

      this.state.status === "READY"

    ) {

      return;

    }

    this.publish({

      ...this.state,

      status:
        "READY",

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
  // This is identity-state cleanup only.
  //
  // It does NOT currently destroy or persist Workspace state.
  // Those semantics belong to the persistence boundary.
  //
  // ==========================================================

  clearIdentity(): void {

    if (

      this.state.identity === null &&
      this.state.persistence === "NONE"

    ) {

      return;

    }


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
  // All mutable state publication flows through this boundary.
  //
  // revision increments exactly once for each material state
  // transition.
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
  // Guest identity needs to remain stable for the lifetime of
  // the active Guest context.
  //
  // Persistence/restoration of that identity across browser
  // refresh belongs to the session persistence phase.
  //
  // crypto.randomUUID() supplies identity uniqueness.
  //
  // The UUID has no computational meaning and must never enter
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