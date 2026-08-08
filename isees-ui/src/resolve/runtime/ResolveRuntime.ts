// ============================================================
// src/resolve/runtime/ResolveRuntime.ts
//
// P55A
// RESOLVE RUNTIME
//
// Canonical runtime responsible for deterministic execution of
// Resolve–Dissolve Computation (RDC).
//
// Responsibilities
//
//   • Own execution lifecycle
//   • Own execution history
//   • Publish runtime state
//   • Execute deterministic computations
//
// Responsibilities explicitly NOT owned
//
//   • React
//   • UI
//   • Graph Rendering
//   • Investigation State
//   • Knowledge State
//   • Persistence
//   • Networking
//   • AI Inference
//
// ============================================================

import {

  ResolveRuntimeStatus,

} from "./ResolveRuntimeTypes";

import type {

  ResolveRuntimeState,

  ResolveComputationInput,

  ResolveComputationResult,

  ResolveExecutionRecord,

} from "./ResolveRuntimeTypes";
// ============================================================
// LISTENER
// ============================================================

type Listener = () => void;

// ============================================================
// RUNTIME
// ============================================================

export class ResolveRuntime {

  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  private state: ResolveRuntimeState = {

    status: ResolveRuntimeStatus.INITIALIZING,

    history: [],

    revision: 0,

  };

  // ----------------------------------------------------------
  // SUBSCRIPTIONS
  // ----------------------------------------------------------

  private readonly listeners = new Set<Listener>();

  // ==========================================================
  // INITIALIZATION
  // ==========================================================

  initialize(): void {

    this.state = {

      ...this.state,

      status: ResolveRuntimeStatus.READY,

      revision: this.state.revision + 1,

    };

    this.publish();

  }

  // ==========================================================
  // EXECUTION
  // ==========================================================

  execute(

    input: ResolveComputationInput,

  ): ResolveComputationResult {

    const startedAt = new Date();

    const executionId =

      crypto.randomUUID();

    const record: ResolveExecutionRecord = {

      executionId,

      startedAt,

      input,

    };

    this.state = {

      ...this.state,

      status: ResolveRuntimeStatus.EXECUTING,

      currentExecution: record,

      revision: this.state.revision + 1,

    };

    this.publish();

    // --------------------------------------------------------
    // P55A
    //
    // Deterministic computation engine introduced
    // in subsequent engineering package.
    // --------------------------------------------------------

    const result: ResolveComputationResult = {

      success: true,

      executionId,

      startedAt,

      completedAt: new Date(),

      manifold: undefined,

    };

    record.completedAt = result.completedAt;

    record.result = result;

    this.state = {

      ...this.state,

      status: ResolveRuntimeStatus.COMPLETE,

      currentExecution: record,

      history: [

        ...this.state.history,

        record,

      ],

      revision: this.state.revision + 1,

    };

    this.publish();

    return result;

  }

  // ==========================================================
  // STATE
  // ==========================================================

  getState(): ResolveRuntimeState {

    return this.state;

  }

  // ==========================================================
  // SUBSCRIBE
  // ==========================================================

  subscribe(

    listener: Listener,

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
  // DISPOSE
  // ==========================================================

  dispose(): void {

    this.listeners.clear();

  }

  // ==========================================================
  // PUBLISH
  // ==========================================================

  private publish(): void {

    for (

      const listener

      of this.listeners

    ) {

      listener();

    }

  }

}