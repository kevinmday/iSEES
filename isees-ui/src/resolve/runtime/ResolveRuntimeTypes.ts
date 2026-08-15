// ============================================================
// src/resolve/runtime/ResolveRuntimeTypes.ts
//
// P56D-E
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
//   • canonical similarity candidate derivation
//   • canonical candidate evaluation
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
// Runtime preserves the complete deterministic engine product.
//
// Runtime explicitly owns NO:
//
//   • manifold computation
//   • similarity computation
//   • candidate derivation
//   • candidate evaluation
//   • computational provenance generation
//   • relationship assertion
//   • Research Vector generation
//   • REX execution
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
  CanonicalSimilarityCandidateCollection,
} from "../candidates/CanonicalSimilarityCandidateTypes";

import type {
  CanonicalSimilarityCandidateEvaluationCollection,
} from "../evaluation/CanonicalSimilarityCandidateEvaluationTypes";

import type {
  ResolveProvenance,
} from "../engine/ResolveProvenance";

// ============================================================
// RUNTIME STATUS
// ============================================================

export const ResolveRuntimeStatus = {

  INITIALIZING:
    "INITIALIZING",

  READY:
    "READY",

  EXECUTING:
    "EXECUTING",

  COMPLETE:
    "COMPLETE",

  ERROR:
    "ERROR",

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
//     • similarityCandidates
//     • candidateEvaluations
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
//   • similarity candidate populations
//   • candidate evaluation populations
//   • canonical representations
//   • provenance
//
// Runtime MUST preserve these deterministic products exactly as
// produced by ResolveEngine.
//
// Runtime MUST NOT:
//
//   • regenerate them
//   • reinterpret them
//   • rank them
//   • filter them
//   • promote them
//   • convert them into relationships
//   • convert them into Research Vectors
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
  //
  // This is the computed canonical world state:
  //
  //                 M = g(L,T,S)
  //
  // ----------------------------------------------------------

  manifold:
    CanonicalManifold;

  // ----------------------------------------------------------
  // Deterministic similarity candidates
  //
  // Produced exclusively by ResolveEngine downstream from the
  // canonical manifold similarity matrix:
  //
  //                 C = h(M.similarityMatrix)
  //
  // A candidate is NOT:
  //
  //   • a relationship
  //   • a topology edge
  //   • accepted Knowledge
  //   • a Research Vector
  //
  // Runtime preserves this product without reinterpretation.
  //
  // ----------------------------------------------------------

  similarityCandidates:
    CanonicalSimilarityCandidateCollection;

  // ----------------------------------------------------------
  // Deterministic candidate evaluations
  //
  // Produced exclusively by ResolveEngine downstream from the
  // canonical candidate population:
  //
  //                 E = q(C)
  //
  // Evaluation provides deterministic explanatory state for
  // why a candidate surfaced.
  //
  // An evaluation is NOT:
  //
  //   • a relationship assertion
  //   • a topology edge
  //   • accepted Knowledge
  //   • a Research Vector
  //   • a REX instruction
  //   • a recommendation
  //
  // Runtime preserves this product without reinterpretation.
  //
  // ----------------------------------------------------------

  candidateEvaluations:
    CanonicalSimilarityCandidateEvaluationCollection;

  // ----------------------------------------------------------
  // Canonical computational representation
  //
  // Stable byte-comparable representation of the deterministic
  // manifold.
  //
  // IMPORTANT:
  //
  // This remains the CanonicalManifold representation.
  //
  // similarityCandidates and candidateEvaluations remain
  // distinct sibling deterministic products and are NOT folded
  // into this representation.
  //
  // Complete-product replay handles M + C + E independently.
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
  //   • canonical manifold result
  //
  // This is computational lineage.
  //
  // It is NOT runtime execution history.
  //
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
// Because ResolveComputationResult now preserves the complete
// deterministic engine product, completed execution history
// also preserves:
//
//                 M + C + E
//
// without making those products runtime-owned.
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
  //
  // Successful records preserve the complete deterministic
  // M + C + E result through ResolveComputationResult.
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
  //   U -> M -> C -> E
  //     ↓
  //   complete deterministic computational product
  //     ↓
  //   runtime execution record
  //
  // Runtime adds lifecycle metadata around the product but
  // does not alter its deterministic contents.
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