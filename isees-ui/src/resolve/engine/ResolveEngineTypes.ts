// ============================================================
// src/resolve/engine/ResolveEngineTypes.ts
//
// P56D-B
// RESOLVE ENGINE TYPES
//
// Canonical deterministic types owned by the Resolve Engine.
//
// ENGINE INVARIANT
//
//   identical canonical input
//          ↓
//   identical engine output
//
// Runtime metadata such as:
//
//   • execution IDs
//   • timestamps
//   • lifecycle state
//   • execution history
//
// MUST NOT participate in engine computation.
//
// Resolve Engine owns:
//
//   • Canonical computational universe input
//   • Canonical manifold output
//   • Canonical computational representation
//   • Deterministic computational provenance
//   • Deterministic computation contracts
//
// Resolve Engine explicitly does NOT own:
//
//   • Runtime lifecycle
//   • Execution identity
//   • Wall-clock time
//   • Execution history
//   • React
//   • UI
//   • Graph rendering
//   • Persistence
//   • Networking
//   • AI inference
//
// ============================================================

import type {
  Investigation,
} from "../../investigation/investigationTypes";

import type {
  KnowledgeObject,
} from "../../knowledge/model/KnowledgeObject";

import type {
  CanonicalKnowledgeSimilarityMatrix,
} from "../similarity/CanonicalKnowledgeSimilarityMatrixTypes";

import type {
  CanonicalSimilarityCandidateCollection,
} from "../candidates/CanonicalSimilarityCandidateTypes";

import type {
  ResolveProvenance,
} from "./ResolveProvenance";

// ============================================================
// GOVERNING EQUATION
// ============================================================

export const RESOLVE_GOVERNING_EQUATION =
  "M = g(L,T,S)" as const;

export type ResolveGoverningEquation =
  typeof RESOLVE_GOVERNING_EQUATION;

// ============================================================
// CANONICAL COMPUTATIONAL UNIVERSE
// ============================================================
//
// The Computational Universe is the complete deterministic
// source state presented to the Resolve Engine.
//
// It is NOT runtime state.
//
// It contains no execution ID.
// It contains no timestamps.
// It contains no lifecycle information.
//
// Runtime input is transformed into this structure before
// deterministic manifold computation.
//
// ============================================================

export interface CanonicalComputationalUniverse {

  // ----------------------------------------------------------
  // Investigation identity
  // ----------------------------------------------------------

  investigationId:
    string;

  // ----------------------------------------------------------
  // Investigation source
  //
  // Retained as canonical computational source material.
  //
  // Canonicalization determines which investigation properties
  // participate in deterministic computation.
  // ----------------------------------------------------------

  investigation:
    Investigation;

  // ----------------------------------------------------------
  // Computational knowledge
  // ----------------------------------------------------------

  knowledgeObjects:
    readonly KnowledgeObject[];

  // ----------------------------------------------------------
  // Active computational layers
  //
  // L in:
  //
  //     M = g(L,T,S)
  //
  // Canonical ordering is established before computation.
  // ----------------------------------------------------------

  activeLayers:
    readonly string[];

  // ----------------------------------------------------------
  // Temporal context
  //
  // T in:
  //
  //     M = g(L,T,S)
  //
  // The concrete temporal model remains intentionally opaque
  // until its canonical computational representation is
  // introduced.
  // ----------------------------------------------------------

  temporalContext:
    unknown;

  // ----------------------------------------------------------
  // Investigative scale
  //
  // S in:
  //
  //     M = g(L,T,S)
  //
  // The concrete scale model remains intentionally opaque
  // until its canonical computational representation is
  // introduced.
  // ----------------------------------------------------------

  investigativeScale:
    unknown;

}

// ============================================================
// CANONICAL MANIFOLD
// ============================================================
//
// CanonicalManifold is the deterministic computational product
// of Resolve.
//
// It is NOT a rendered graph.
//
// It is NOT UI state.
//
// It is NOT an execution record.
//
// It is the machine-readable manifold produced by:
//
//                 M = g(L,T,S)
//
// P56D-B enriches the manifold with the deterministic pairwise
// similarity structure computed across participating canonical
// event Knowledge.
//
// IMPORTANT:
//
// Similarity is a computed manifold product.
//
// It does NOT become a new independent input to the governing
// equation.
//
// Therefore the governing computation remains:
//
//                 M = g(L,T,S)
//
// and NOT:
//
//                 M = g(L,T,S,Similarity)
//
// ============================================================

export interface CanonicalManifold {

  // ----------------------------------------------------------
  // Governing computational identity
  // ----------------------------------------------------------

  equation:
    ResolveGoverningEquation;

  // ----------------------------------------------------------
  // Investigation identity
  // ----------------------------------------------------------

  investigationId:
    string;

  // ----------------------------------------------------------
  // L — Active computational layers
  // ----------------------------------------------------------

  layers:
    readonly string[];

  // ----------------------------------------------------------
  // T — Temporal computational context
  // ----------------------------------------------------------

  temporalContext:
    unknown;

  // ----------------------------------------------------------
  // S — Investigative scale
  // ----------------------------------------------------------

  investigativeScale:
    unknown;

  // ----------------------------------------------------------
  // Computational population
  //
  // Canonically ordered identifiers of Knowledge Objects
  // participating in the manifold.
  // ----------------------------------------------------------

  knowledgeObjectIds:
    readonly string[];

  // ----------------------------------------------------------
  // CANONICAL PAIRWISE SIMILARITY STRUCTURE
  //
  // Deterministic universe-wide similarity measurement across
  // participating canonical event feature sets.
  //
  // Conceptually:
  //
  //     K[]
  //      ↓
  //     F[]
  //      ↓
  //     C_ij
  //      ↓
  //     S_ij
  //      ↓
  //     {S_ij | i < j}
  //
  // This structure contains each unordered canonical event
  // pair exactly once.
  //
  // It is:
  //
  //   • deterministic
  //   • identity ordered
  //   • comparability aware
  //   • availability aware
  //   • part of canonical manifold state
  //
  // It is NOT:
  //
  //   • a graph edge collection
  //   • candidate generation
  //   • a similarity threshold
  //   • a ranking policy
  //   • a heuristic decision
  //   • AI inference
  //
  // ----------------------------------------------------------

  similarityMatrix:
    CanonicalKnowledgeSimilarityMatrix;

}

// ============================================================
// ENGINE INPUT
// ============================================================
//
// The engine receives only canonical computational state.
//
// Runtime metadata MUST NEVER be added to this interface.
//
// ============================================================

export interface ResolveEngineInput {

  universe:
    CanonicalComputationalUniverse;

}

// ============================================================
// ENGINE OUTPUT
// ============================================================
//
// Engine output is deterministic.
//
// Therefore this interface intentionally contains:
//
//   NO executionId
//   NO startedAt
//   NO completedAt
//   NO random values
//   NO runtime revision
//
// Those belong to ResolveRuntime.
//
// The complete deterministic result consists of:
//
//   • manifold
//   • canonical similarity candidates
//   • canonical representation
//   • computational provenance
//
// Candidate propositions are a sibling deterministic product.
//
// They are derived FROM measured manifold similarity state but
// are deliberately NOT embedded inside CanonicalManifold.
//
// This preserves the epistemic boundary:
//
//   manifold
//       = computed world state
//
//   similarityCandidates
//       = downstream propositions eligible for evaluation
//
// Equivalent canonical input MUST produce equivalent values
// for all four.
//
// ============================================================

export interface ResolveEngineOutput {

  // ----------------------------------------------------------
  // Deterministic Investigation Manifold
  // ----------------------------------------------------------

  manifold:
    CanonicalManifold;

  // ----------------------------------------------------------
  // Canonical similarity candidates
  //
  // Deterministically derived from:
  //
  //     manifold.similarityMatrix
  //
  // Candidate presence means only that an AVAILABLE canonical
  // similarity measurement exists for the pair.
  //
  // It does NOT mean:
  //
  //   • canonical relationship
  //   • topology edge
  //   • accepted proposition
  //   • causal inference
  //   • same phenomenon
  //
  // Candidate eligibility is availability-based.
  //
  // No numerical similarity threshold participates here.
  //
  // Candidates are deliberately a sibling Resolve product,
  // not part of CanonicalManifold.
  //
  // This preserves the epistemic boundary:
  //
  //   manifold
  //       = computed world state
  //
  //   similarityCandidates
  //       = downstream propositions eligible for evaluation
  //
  // ----------------------------------------------------------

  similarityCandidates:
    CanonicalSimilarityCandidateCollection;

  // ----------------------------------------------------------
  // Canonical representation
  //
  // Stable serialization of the deterministic manifold.
  //
  // This is the byte-comparable substrate for:
  //
  //   • replay verification
  //   • provenance
  //   • computation comparison
  //   • future fingerprints
  //
  // Because similarityMatrix is now part of CanonicalManifold,
  // its deterministic pairwise measurements automatically
  // participate in this canonical representation.
  //
  // similarityCandidates are deliberately NOT included in this
  // manifold representation. They are a sibling deterministic
  // Resolve product derived from manifold similarity state.
  //
  // ----------------------------------------------------------

  canonicalRepresentation:
    string;

  // ----------------------------------------------------------
  // Deterministic computational provenance
  //
  // Describes WHAT computational state produced this result
  // and under WHICH deterministic engine contract.
  //
  // This is deliberately distinct from runtime execution
  // history.
  //
  // ----------------------------------------------------------

  provenance:
    ResolveProvenance;

}

// ============================================================
// ENGINE CONTRACT
// ============================================================
//
// ResolveEngine implementations MUST satisfy:
//
//   execute(A) ≡ execute(A)
//
// for equivalent canonical computational input A.
//
// Equivalence refers to deterministic computational content,
// not JavaScript object identity.
//
// Therefore:
//
//   manifold(A)                ≡ manifold(A)
//   similarityCandidates(A)    ≡ similarityCandidates(A)
//   representation(A)          ≡ representation(A)
//   provenance(A)              ≡ provenance(A)
//
// Runtime execution metadata is outside this contract.
//
// ============================================================

export interface ResolveEngineContract {

  execute(
    input:
      ResolveEngineInput,
  ): ResolveEngineOutput;

}

// ============================================================
// END
// ============================================================