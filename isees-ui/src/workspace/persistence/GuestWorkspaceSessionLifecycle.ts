// ============================================================
// src/workspace/persistence/GuestWorkspaceSessionLifecycle.ts
// P56D-I1-G2
// GUEST WORKSPACE SESSION LIFECYCLE
//
// Deterministic orchestration boundary connecting:
//
//   Operator Identity
//          │
//          ▼
//   Guest Workspace Session
//          │
//     ┌────┴────┐
//     ▼         ▼
//   RESTORE    CAPTURE
//     │         │
//     ▼         ▼
// Workspace   sessionStorage
// Research
// Author
//
// This lifecycle does NOT own:
//
//   - operator identity
//   - Workspace runtime state
//   - Research Desk state
//   - Author document state
//   - browser persistence representation
//
// It coordinates the already-established deterministic
// persistence boundaries.
//
// Architectural invariant:
//
//   Runtime(I,R,D)
//       -> Snapshot(I,R,D)
//       -> Runtime(I,R,D)
//
// Authentication changes ownership,
// not investigative identity.
//
// ============================================================

import {
  operatorIdentityRuntime,
} from "../../identity/runtime/OperatorIdentityRuntime";

import {
  workspaceRuntime,
} from "../runtime/WorkspaceRuntime";

import {
  researchBridgeRuntime,
} from "../../research/ResearchBridgeRuntime";

import {
  authorDocumentRuntime,
} from "../../author/runtime/AuthorDocumentRuntime";

import {
  createGuestWorkspaceSnapshotFromRuntimeState,
} from "./GuestWorkspaceSessionSnapshotFactory";

import {
  restoreGuestWorkspaceSessionIntoRuntimes,
} from "./GuestWorkspaceSessionRestorer";

import {
  restoreGuestWorkspaceSession,
  saveGuestWorkspaceSession,
} from "./GuestWorkspaceSessionPersistence";

import type {
  GuestWorkspaceSessionSnapshot,
} from "./GuestWorkspaceSessionPersistenceTypes";


// ============================================================
// TYPES
// ============================================================

export type GuestWorkspaceSessionLifecycleStatus =
  | "IDLE"
  | "STARTING"
  | "ACTIVE"
  | "STOPPED";


export interface GuestWorkspaceSessionLifecycleState {

  status:
    GuestWorkspaceSessionLifecycleStatus;

  restored:
    boolean;

  revision:
    number;

}


// ============================================================
// LISTENER
// ============================================================

export type GuestWorkspaceSessionLifecycleListener =
  () => void;


// ============================================================
// RUNTIME
// ============================================================

export class GuestWorkspaceSessionLifecycle {

  private state:
    GuestWorkspaceSessionLifecycleState = {

      status:
        "IDLE",

      restored:
        false,

      revision:
        0,

    };


  private readonly listeners =
    new Set<
      GuestWorkspaceSessionLifecycleListener
    >();


  private unsubscribeWorkspace:
    (() => void) | null =
      null;


  private unsubscribeResearch:
    (() => void) | null =
      null;


  private unsubscribeAuthor:
    (() => void) | null =
      null;


  private captureSuppressed =
    false;


  // ==========================================================
  // STATE
  // ==========================================================

  getState():
    GuestWorkspaceSessionLifecycleState {

    return this.state;

  }


  // ==========================================================
  // SUBSCRIPTION
  // ==========================================================

  subscribe(
    listener:
      GuestWorkspaceSessionLifecycleListener,
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
  // START
  // ==========================================================
  //
  // Lifecycle activation requires an already-established
  // Guest identity.
  //
  // Identity establishment remains owned exclusively by
  // OperatorIdentityRuntime.
  //
  // Startup order:
  //
  //   1. assert Guest / SESSION identity
  //   2. enter STARTING
  //   3. inspect persisted Guest workspace state
  //   4. restore only a valid RESTORED snapshot
  //   5. attach runtime subscriptions
  //   6. enter ACTIVE
  //
  // EMPTY:
  //
  //   Fresh Guest session. Continue without restoration.
  //
  // INVALID:
  //
  //   Persistence boundary already cleared malformed storage.
  //   Continue with fresh runtime state.
  //
  // RESTORED:
  //
  //   Restore the validated canonical snapshot.
  //
  // Subscriptions are attached AFTER restoration so restoration
  // publications cannot write partially-restored intermediate
  // states back into browser persistence.
  //
  // ==========================================================

  start(): void {

    if (
      this.state.status === "ACTIVE"
    ) {
      return;
    }


    if (
      this.state.status === "STARTING"
    ) {
      return;
    }


    this.assertGuestSessionIdentity();


    this.publish({

      ...this.state,

      status:
        "STARTING",

    });


    let restored =
      false;


    const restoreResult =
      restoreGuestWorkspaceSession();


    if (
      restoreResult.status === "RESTORED"
    ) {

      this.restoreSnapshot(
        restoreResult.snapshot,
      );

      restored =
        true;

    }


    this.attachRuntimeSubscriptions();


    this.publish({

      ...this.state,

      status:
        "ACTIVE",

      restored,

    });

  }


  // ==========================================================
  // STOP
  // ==========================================================
  //
  // Stops live synchronization.
  //
  // This does NOT:
  //
  //   - clear Guest identity
  //   - clear workspace state
  //   - clear Research Desk state
  //   - clear Author document state
  //   - delete persisted workspace state
  //
  // Those are separate ownership decisions.
  //
  // ==========================================================

  stop(): void {

    if (
      this.state.status === "STOPPED" ||
      this.state.status === "IDLE"
    ) {
      return;
    }


    this.detachRuntimeSubscriptions();


    this.publish({

      ...this.state,

      status:
        "STOPPED",

    });

  }


  // ==========================================================
  // CAPTURE NOW
  // ==========================================================
  //
  // Explicit deterministic persistence checkpoint.
  //
  // Runtime-only state remains excluded by the snapshot factory.
  //
  // ==========================================================

  captureNow():
    GuestWorkspaceSessionSnapshot {

    this.assertGuestSessionIdentity();


    const identityState =
      operatorIdentityRuntime.getState();


    const snapshot =
      createGuestWorkspaceSnapshotFromRuntimeState({

        identity:
          identityState,

        workspace:
          workspaceRuntime.getState(),

        researchDesk:
          researchBridgeRuntime.getDesk(),

        authoring:
          authorDocumentRuntime.getState(),

      });


    saveGuestWorkspaceSession(
      snapshot,
    );


    return snapshot;

  }


  // ==========================================================
  // RUNTIME CHANGE
  // ==========================================================
  //
  // Workspace / Research / Author publications converge here.
  //
  // A material runtime publication produces a complete canonical
  // Guest workspace snapshot.
  //
  // Browser persistence therefore represents one coherent:
  //
  //   Investigation
  //   Research Desk
  //   Author document
  //
  // state rather than independently persisted fragments.
  //
  // ==========================================================

  private handleRuntimeChange =
    (): void => {

      if (
        this.state.status !== "ACTIVE"
      ) {
        return;
      }


      if (
        this.captureSuppressed
      ) {
        return;
      }


      const identityState =
        operatorIdentityRuntime.getState();


      if (
        identityState.identity?.kind !== "GUEST" ||
        identityState.persistence !== "SESSION"
      ) {
        return;
      }


      this.captureNow();

    };


  // ==========================================================
  // RESTORE SNAPSHOT
  // ==========================================================
  //
  // The persistence boundary has already:
  //
  //   parsed JSON
  //   validated schema
  //   rejected malformed state
  //
  // This boundary now restores that validated snapshot through
  // runtime-owned public APIs.
  //
  // ==========================================================

  private restoreSnapshot(
    snapshot:
      GuestWorkspaceSessionSnapshot,
  ): void {

    const identityState =
      operatorIdentityRuntime.getState();


    this.captureSuppressed =
      true;


    try {

      restoreGuestWorkspaceSessionIntoRuntimes({

        snapshot,

        identity:
          identityState,

        workspaceRuntime,

        researchBridgeRuntime,

        authorDocumentRuntime,

      });

    }
    finally {

      this.captureSuppressed =
        false;

    }

  }


  // ==========================================================
  // ATTACH SUBSCRIPTIONS
  // ==========================================================

  private attachRuntimeSubscriptions():
    void {

    this.detachRuntimeSubscriptions();


    this.unsubscribeWorkspace =
      workspaceRuntime.subscribe(
        this.handleRuntimeChange,
      );


    this.unsubscribeResearch =
      researchBridgeRuntime.subscribe(
        this.handleRuntimeChange,
      );


    this.unsubscribeAuthor =
      authorDocumentRuntime.subscribe(
        this.handleRuntimeChange,
      );

  }


  // ==========================================================
  // DETACH SUBSCRIPTIONS
  // ==========================================================

  private detachRuntimeSubscriptions():
    void {

    this.unsubscribeWorkspace?.();

    this.unsubscribeResearch?.();

    this.unsubscribeAuthor?.();


    this.unsubscribeWorkspace =
      null;

    this.unsubscribeResearch =
      null;

    this.unsubscribeAuthor =
      null;

  }


  // ==========================================================
  // IDENTITY ASSERTION
  // ==========================================================
  //
  // Guest workspace lifecycle exists only for:
  //
  //   READY
  //   GUEST
  //   SESSION
  //
  // Account persistence is a separate ownership boundary.
  //
  // ==========================================================

  private assertGuestSessionIdentity():
    void {

    const identityState =
      operatorIdentityRuntime.getState();


    if (
      identityState.status !== "READY"
    ) {

      throw new Error(
        "Guest workspace session lifecycle requires READY operator identity.",
      );

    }


    if (
      identityState.identity?.kind !== "GUEST"
    ) {

      throw new Error(
        "Guest workspace session lifecycle requires Guest operator identity.",
      );

    }


    if (
      identityState.persistence !== "SESSION"
    ) {

      throw new Error(
        "Guest workspace session lifecycle requires SESSION persistence policy.",
      );

    }

  }


  // ==========================================================
  // PUBLICATION
  // ==========================================================

  private publish(
    nextState:
      GuestWorkspaceSessionLifecycleState,
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

}


// ============================================================
// SINGLETON
// ============================================================
//
// One lifecycle coordinates the singleton deterministic runtimes.
//
// React integration comes later.
//
// ============================================================

export const guestWorkspaceSessionLifecycle =
  new GuestWorkspaceSessionLifecycle();