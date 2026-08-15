// ============================================================
// src/resolve/runtime/ResolveRuntime.ts
//
// P56D-E
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
//   • canonical similarity candidate derivation
//   • canonical candidate evaluation
//   • canonical result serialization
//   • deterministic computational provenance
//   • computational lineage validation
//
// GOVERNING COMPUTATION
//
//                 M = g(L,T,S)
//
// Candidate derivation:
//
//                 C = h(M.similarityMatrix)
//
// Candidate evaluation:
//
//                 E = q(C)
//
// Complete deterministic engine product:
//
//                 U -> M -> C -> E
//
// Runtime metadata MUST NOT participate in computation.
//
// The runtime preserves the complete deterministic engine
// product but does not create, recompute, reinterpret, filter,
// rank, promote, or otherwise modify that product.
//
// Responsibilities explicitly NOT owned:
//
//   • manifold computation
//   • similarity computation
//   • candidate derivation
//   • candidate evaluation
//   • computational provenance generation
//   • relationship assertion
//   • Research Vector generation
//   • REX execution
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

    status:
      ResolveRuntimeStatus.INITIALIZING,

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
  //        M = g(L,T,S)
  //            ↓
  //   Canonical Manifold
  //            ↓
  //   C = h(M.similarityMatrix)
  //            ↓
  //   Similarity Candidates
  //            ↓
  //        E = q(C)
  //            ↓
  //   Candidate Evaluations
  //            ↓
  //   Canonical Representation
  //            ↓
  //   Computational Provenance
  //            ↓
  //   execution record/history
  //
  // More compactly:
  //
  //       U -> M -> C -> E
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
      //
      // Engine returns the complete deterministic product:
      //
      //   • manifold
      //   • similarityCandidates
      //   • candidateEvaluations
      //   • canonicalRepresentation
      //   • provenance
      //
      // Runtime receives these products exactly as produced by
      // the engine.
      //
      // It does NOT:
      //
      //   • recompute similarity
      //   • regenerate candidates
      //   • regenerate evaluations
      //   • filter candidates
      //   • filter evaluations
      //   • rank candidates
      //   • rank evaluations
      //   • create relationships
      //   • create topology edges
      //   • create Research Vectors
      //   • execute REX
      //
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

      // ------------------------------------------------------
      // Construct Runtime Result
      //
      // Runtime wraps the complete deterministic engine product
      // with execution metadata.
      //
      // Deterministic engine-owned products are copied through
      // without transformation:
      //
      //   M
      //   C
      //   E
      //   canonicalRepresentation
      //   provenance
      //
      // Runtime does NOT regenerate or modify provenance.
      //
      // ------------------------------------------------------

      const result:
        ResolveComputationResult = {

          success:
            true,

          executionId,

          startedAt,

          completedAt,

          manifold:
            engineOutput.manifold,

          similarityCandidates:
            engineOutput.similarityCandidates,

          candidateEvaluations:
            engineOutput.candidateEvaluations,

          canonicalRepresentation:
            engineOutput.canonicalRepresentation,

          provenance:
            engineOutput.provenance,

        };

      // ------------------------------------------------------
      // Complete execution record
      //
      // The execution record now preserves the complete
      // deterministic Resolve product:
      //
      //             M + C + E
      //
      // together with runtime-owned lifecycle metadata.
      //
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