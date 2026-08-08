// ============================================================
// src/resolve/runtime/ResolveRuntimeTypes.ts
//
// P55B
// RESOLVE RUNTIME TYPES
//
// Canonical runtime contracts for Resolve-Dissolve Computation.
//
// Resolve Runtime owns execution lifecycle around deterministic
// Resolve Engine computation.
//
// ARCHITECTURAL BOUNDARY
//
// Resolve Engine owns:
//
//   • deterministic computation
//   • canonical manifold construction
//   • canonical computational representation
//   • deterministic computational provenance
//
// Resolve Runtime owns:
//
//   • execution identity
//   • execution timestamps
//   • execution lifecycle
//   • execution history
//   • runtime publication
//   • delegation to Resolve Engine
//
// Runtime explicitly owns NO:
//
//   • manifold computation
//   • computational provenance generation
//   • UI
//   • graph rendering
//   • persistence
//   • networking
//   • AI inference
//   • heuristic reasoning
//
// GOVERNING COMPUTATION
//
//                 M = g(L,T,S)
//
// Runtime metadata MUST NOT participate in deterministic
// computation.
//
// ============================================================

import type {
  Investigation,
} from "../../investigation/investigationTypes";

import type {
  KnowledgeObject,
} from "../../knowledge/model/KnowledgeObject";

import type {
  CanonicalManifold,
} from "../engine/ResolveEngineTypes";

import type {
  ResolveProvenance,
} from "../engine/ResolveProvenance";

// ============================================================
// RUNTIME STATUS
// ============================================================

export const ResolveRuntimeStatus = {

  INITIALIZING: "INITIALIZING",

  READY: "READY",

  EXECUTING: "EXECUTING",

  COMPLETE: "COMPLETE",

  ERROR: "ERROR",

} as const;

export type ResolveRuntimeStatus =
  (typeof ResolveRuntimeStatus)[
    keyof typeof ResolveRuntimeStatus
  ];

// ============================================================
// COMPUTATIONAL INPUT
// ============================================================
//
// This is the runtime-facing Resolve input.
//
// Before entering ResolveEngine, this input is transformed into
// a CanonicalComputationalUniverse.
//
// Runtime collection ordering MUST NOT determine computational
// output.
//
// ============================================================

export interface ResolveComputationInput {

  investigation:
    Investigation;

  knowledgeObjects:
    readonly KnowledgeObject[];

  activeLayers:
    readonly string[];

  temporalContext:
    unknown;

  investigativeScale:
    unknown;

}

// ============================================================
// COMPUTATIONAL RESULT
// ============================================================
//
// ResolveComputationResult combines two intentionally separate
// classes of information:
//
//   DETERMINISTIC COMPUTATIONAL PRODUCT
//
//     • manifold
//     • canonicalRepresentation
//     • provenance
//
//   RUNTIME EXECUTION METADATA
//
//     • success
//     • executionId
//     • startedAt
//     • completedAt
//
// This distinction is fundamental.
//
// Two separate runtime executions may have different:
//
//   • execution IDs
//   • start times
//   • completion times
//
// while still containing exactly equivalent deterministic:
//
//   • manifolds
//   • canonical representations
//   • provenance
//
// ============================================================

export interface ResolveComputationResult {

  // ----------------------------------------------------------
  // Runtime execution outcome
  // ----------------------------------------------------------

  success:
    boolean;

  // ----------------------------------------------------------
  // Runtime execution identity
  //
  // Nondeterministic.
  //
  // MUST NOT participate in Resolve Engine computation.
  // ----------------------------------------------------------

  executionId:
    string;

  // ----------------------------------------------------------
  // Runtime timestamps
  //
  // Nondeterministic.
  //
  // MUST NOT participate in Resolve Engine computation.
  // ----------------------------------------------------------

  startedAt:
    Date;

  completedAt:
    Date;

  // ----------------------------------------------------------
  // Deterministic manifold
  //
  // Produced exclusively by ResolveEngine.
  // ----------------------------------------------------------

  manifold:
    CanonicalManifold;

  // ----------------------------------------------------------
  // Canonical computational representation
  //
  // Stable byte-comparable representation of the deterministic
  // manifold.
  //
  // Used by:
  //
  //   • replay verification
  //   • computation comparison
  //   • provenance
  //   • future fingerprints
  //
  // ----------------------------------------------------------

  canonicalRepresentation:
    string;

  // ----------------------------------------------------------
  // Deterministic computational provenance
  //
  // Produced and validated exclusively inside ResolveEngine.
  //
  // Describes:
  //
  //   • engine contract
  //   • governing equation
  //   • investigation identity
  //   • Knowledge Object population
  //   • active computational layers
  //   • temporal context
  //   • investigative scale
  //   • canonical result
  //
  // This is computational lineage.
  //
  // It is NOT runtime execution history.
  // ----------------------------------------------------------

  provenance:
    ResolveProvenance;

}

// ============================================================
// EXECUTION RECORD
// ============================================================
//
// ExecutionRecord belongs exclusively to Resolve Runtime.
//
// It wraps deterministic computation with runtime lifecycle
// information.
//
// ============================================================

export interface ResolveExecutionRecord {

  // ----------------------------------------------------------
  // Runtime execution identity
  // ----------------------------------------------------------

  executionId:
    string;

  // ----------------------------------------------------------
  // Runtime lifecycle timestamps
  // ----------------------------------------------------------

  startedAt:
    Date;

  completedAt?:
    Date;

  // ----------------------------------------------------------
  // Original runtime-facing computation input
  // ----------------------------------------------------------

  input:
    ResolveComputationInput;

  // ----------------------------------------------------------
  // Completed computation result
  //
  // Absent while execution is in progress or if execution
  // fails before producing a valid deterministic result.
  // ----------------------------------------------------------

  result?:
    ResolveComputationResult;

}

// ============================================================
// RUNTIME STATE
// ============================================================

export interface ResolveRuntimeState {

  // ----------------------------------------------------------
  // Current lifecycle state
  // ----------------------------------------------------------

  status:
    ResolveRuntimeStatus;

  // ----------------------------------------------------------
  // Current or most recently completed execution
  // ----------------------------------------------------------

  currentExecution?:
    ResolveExecutionRecord;

  // ----------------------------------------------------------
  // Completed execution history
  // ----------------------------------------------------------

  history:
    readonly ResolveExecutionRecord[];

  // ----------------------------------------------------------
  // Runtime publication revision
  //
  // This is runtime state only.
  //
  // It MUST NOT participate in deterministic computation.
  // ----------------------------------------------------------

  revision:
    number;

}

// ============================================================
// RUNTIME CONTRACT
// ============================================================

export interface ResolveRuntime {

  // ----------------------------------------------------------
  // Initialize runtime lifecycle
  // ----------------------------------------------------------

  initialize():
    void;

  // ----------------------------------------------------------
  // Execute Resolve computation
  //
  // Runtime:
  //
  //   input
  //     ↓
  //   canonical universe
  //     ↓
  //   ResolveEngine
  //     ↓
  //   deterministic computational product
  //     ↓
  //   runtime execution record
  //
  // ----------------------------------------------------------

  execute(
    input: ResolveComputationInput,
  ): ResolveComputationResult;

  // ----------------------------------------------------------
  // Read runtime state
  // ----------------------------------------------------------

  getState():
    ResolveRuntimeState;

  // ----------------------------------------------------------
  // Subscribe to runtime publication
  // ----------------------------------------------------------

  subscribe(
    listener: () => void,
  ): () => void;

  // ----------------------------------------------------------
  // Dispose runtime subscriptions/resources
  // ----------------------------------------------------------

  dispose():
    void;

}

// ============================================================
// END
// ============================================================