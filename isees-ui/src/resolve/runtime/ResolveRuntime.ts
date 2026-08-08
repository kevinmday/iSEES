// ============================================================
// src/resolve/runtime/ResolveRuntime.ts
//
// P55B
// RESOLVE RUNTIME
//
// Canonical runtime responsible for execution lifecycle around
// deterministic Resolve-Dissolve Computation (RDC).
//
// ARCHITECTURAL BOUNDARY
//
// ResolveRuntime owns:
//
//   • execution identity
//   • execution timestamps
//   • execution lifecycle
//   • execution history
//   • runtime publication
//   • Runtime → Engine delegation
//
// ResolveEngine owns:
//
//   • deterministic computation
//   • canonical manifold construction
//   • canonical result serialization
//
// GOVERNING COMPUTATION
//
//                 M = g(L,T,S)
//
// Runtime metadata MUST NOT participate in computation.
//
// Responsibilities explicitly NOT owned:
//
//   • React
//   • UI
//   • Graph Rendering
//   • Investigation State
//   • Knowledge State
//   • Persistence
//   • Networking
//   • AI Inference
//   • Heuristic Reasoning
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

import {
  ResolveEngine,
} from "../engine/ResolveEngine";

import {
  buildCanonicalComputationalUniverse,
} from "../engine/CanonicalUniverse";

// ============================================================
// LISTENER
// ============================================================

type Listener = () => void;

// ============================================================
// RUNTIME
// ============================================================

export class ResolveRuntime {

  // ----------------------------------------------------------
  // ENGINE
  // ----------------------------------------------------------
  //
  // ResolveEngine is stateless.
  //
  // Runtime owns the engine instance only as the execution
  // boundary through which deterministic computation occurs.
  //
  // ----------------------------------------------------------

  private readonly engine =
    new ResolveEngine();

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

  private readonly listeners =
    new Set<Listener>();

  // ==========================================================
  // INITIALIZATION
  // ==========================================================

  initialize(): void {

    this.state = {

      ...this.state,

      status:
        ResolveRuntimeStatus.READY,

      revision:
        this.state.revision + 1,

    };

    this.publish();

  }

  // ==========================================================
  // EXECUTION
  // ==========================================================
  //
  // Runtime execution pipeline:
  //
  //   ResolveComputationInput
  //            ↓
  //   execution metadata
  //            ↓
  //   Canonical Computational Universe
  //            ↓
  //       ResolveEngine
  //            ↓
  //        g(L,T,S)
  //            ↓
  //   Canonical Manifold
  //            ↓
  //   execution record/history
  //
  // Runtime metadata is created outside the engine and does
  // not participate in deterministic computation.
  //
  // ==========================================================

  execute(
    input: ResolveComputationInput,
  ): ResolveComputationResult {

    // --------------------------------------------------------
    // Runtime-owned execution metadata
    // --------------------------------------------------------

    const startedAt =
      new Date();

    const executionId =
      crypto.randomUUID();

    const record:
      ResolveExecutionRecord = {

        executionId,

        startedAt,

        input,

      };

    // --------------------------------------------------------
    // Publish EXECUTING state
    // --------------------------------------------------------

    this.state = {

      ...this.state,

      status:
        ResolveRuntimeStatus.EXECUTING,

      currentExecution:
        record,

      revision:
        this.state.revision + 1,

    };

    this.publish();

    // --------------------------------------------------------
    // Deterministic computation
    // --------------------------------------------------------

    try {

      // ------------------------------------------------------
      // Runtime input → Canonical Computational Universe
      // ------------------------------------------------------

      const universe =
        buildCanonicalComputationalUniverse(
          input,
        );

      // ------------------------------------------------------
      // Canonical Computational Universe → Resolve Engine
      //
      // Everything below this boundary is deterministic.
      // ------------------------------------------------------

      const engineOutput =
        this.engine.execute({

          universe,

        });

      // ------------------------------------------------------
      // Runtime-owned completion metadata
      // ------------------------------------------------------

      const completedAt =
        new Date();

      const result:
        ResolveComputationResult = {

          success: true,

          executionId,

          startedAt,

          completedAt,

          manifold:
            engineOutput.manifold,

          canonicalRepresentation:
            engineOutput.canonicalRepresentation,

        };

      // ------------------------------------------------------
      // Complete execution record
      // ------------------------------------------------------

      record.completedAt =
        completedAt;

      record.result =
        result;

      // ------------------------------------------------------
      // Publish COMPLETE state
      // ------------------------------------------------------

      this.state = {

        ...this.state,

        status:
          ResolveRuntimeStatus.COMPLETE,

        currentExecution:
          record,

        history: [

          ...this.state.history,

          record,

        ],

        revision:
          this.state.revision + 1,

      };

      this.publish();

      return result;

    } catch (error) {

      // ------------------------------------------------------
      // Runtime failure state
      //
      // Failed executions remain inspectable through
      // currentExecution.
      //
      // They are not added to successful execution history
      // until a canonical failure-record model is introduced.
      // ------------------------------------------------------

      this.state = {

        ...this.state,

        status:
          ResolveRuntimeStatus.ERROR,

        currentExecution:
          record,

        revision:
          this.state.revision + 1,

      };

      this.publish();

      throw error;

    }

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

// ============================================================
// END
// ============================================================