// ============================================================
// src/session/runtime/OperatorSessionRuntime.ts
// P54A
// COMPUTATIONAL OPERATOR SESSION RUNTIME
//
// The Operator Session Runtime is the deterministic owner of
// the operator's active computational task.
//
// Unlike the Workspace Runtime, which determines the active
// workspace projection, the Operator Session Runtime governs
// the operator's current session and resolves the instruments
// appropriate to that task.
//
// The runtime performs no presentation.
//
// React observes.
//
// ============================================================

import {

  OperatorSessionType,

} from "./OperatorSessionRuntimeTypes";

import type {

  OperatorInstrument,
  OperatorSessionState,

} from "./OperatorSessionRuntimeTypes";

import {

  operatorInstrumentResolver,

} from "../services/OperatorInstrumentResolver";

// ============================================================
// TYPES
// ============================================================

type OperatorSessionRuntimeListener =
  () => void;

// ============================================================
// RUNTIME
// ============================================================

export class OperatorSessionRuntime {

  private state:
    OperatorSessionState = {

      status: "INITIALIZING",

      activeSession:
        OperatorSessionType.NORMAL,

      previousSession:
        undefined,

      startedAt:
        undefined,

      revision: 0,

      leftInstruments: [],

      rightInstruments: [],

    };

  /**
   * Runtime listeners.
   *
   * React observes runtime changes through this lightweight
   * notification mechanism.
   */

  private listeners =
    new Set<OperatorSessionRuntimeListener>();

  // ==========================================================
  // ACCESSORS
  // ==========================================================

  getState():
    Readonly<OperatorSessionState> {

    return this.state;

  }

  getActiveSession():
    OperatorSessionType {

    return this.state.activeSession;

  }

  getPreviousSession():
    OperatorSessionType | undefined {

    return this.state.previousSession;

  }

  getLeftInstruments():
    Readonly<OperatorInstrument[]> {

    return this.state.leftInstruments;

  }

  getRightInstruments():
    Readonly<OperatorInstrument[]> {

    return this.state.rightInstruments;

  }

  // ==========================================================
  // OBSERVERS
  // ==========================================================

  subscribe(
    listener: OperatorSessionRuntimeListener,
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

  private notify(): void {

    for (

      const listener

      of this.listeners

    ) {

      listener();

    }

  }

  // ==========================================================
  // SESSION
  // ==========================================================

  setActiveSession(
    session: OperatorSessionType,
  ): void {

    if (

      this.state.activeSession === session

    ) {

      return;

    }

    const instruments =

      operatorInstrumentResolver.resolve(

        session,

      );

    this.state = {

      ...this.state,

      previousSession:
        this.state.activeSession,

      activeSession:
        session,

      startedAt:
        new Date(),

      leftInstruments:
        instruments.left,

      rightInstruments:
        instruments.right,

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }
  // ==========================================================
  // INSTRUMENTS
  // ==========================================================

  setInstruments(

    leftInstruments:
      OperatorInstrument[],

    rightInstruments:
      OperatorInstrument[],

  ): void {

    this.state = {

      ...this.state,

      leftInstruments,

      rightInstruments,

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // LIFECYCLE
  // ==========================================================

  initialize(): void {

    this.state = {

      ...this.state,

      status: "READY",

    };

    this.notify();

  }

  activate(): void {

    this.state = {

      ...this.state,

      status: "ACTIVE",

      startedAt:
        new Date(),

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  deactivate(): void {

    this.state = {

      ...this.state,

      status: "READY",

      previousSession:
        this.state.activeSession,

      activeSession:
        OperatorSessionType.NORMAL,

      startedAt:
        undefined,

      leftInstruments: [],

      rightInstruments: [],

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

}

// ============================================================
// SINGLETON
// ============================================================

export const operatorSessionRuntime =
  new OperatorSessionRuntime();