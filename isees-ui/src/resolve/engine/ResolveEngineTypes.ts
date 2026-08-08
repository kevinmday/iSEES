// ============================================================
// src/resolve/engine/ResolveEngineTypes.ts
//
// P55B
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
// Runtime input will be transformed into this structure before
// deterministic manifold computation.
//
// ============================================================

export interface CanonicalComputationalUniverse {

  // ----------------------------------------------------------
  // Investigation identity
  // ----------------------------------------------------------

  investigationId: string;

  // ----------------------------------------------------------
  // Investigation source
  //
  // Retained as canonical computational source material.
  //
  // P55B canonicalization will determine which investigation
  // properties participate in deterministic serialization and
  // manifold construction.
  // ----------------------------------------------------------

  investigation: Investigation;

  // ----------------------------------------------------------
  // Computational knowledge
  // ----------------------------------------------------------

  knowledgeObjects: readonly KnowledgeObject[];

  // ----------------------------------------------------------
  // Active computational layers
  //
  // L in:
  //
  //     M = g(L,T,S)
  //
  // Canonical ordering is established before computation.
  // ----------------------------------------------------------

  activeLayers: readonly string[];

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

  temporalContext: unknown;

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

  investigativeScale: unknown;

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
// ============================================================

export interface CanonicalManifold {

  // ----------------------------------------------------------
  // Governing computational identity
  // ----------------------------------------------------------

  equation: ResolveGoverningEquation;

  // ----------------------------------------------------------
  // Investigation identity
  // ----------------------------------------------------------

  investigationId: string;

  // ----------------------------------------------------------
  // L — Active computational layers
  // ----------------------------------------------------------

  layers: readonly string[];

  // ----------------------------------------------------------
  // T — Temporal computational context
  // ----------------------------------------------------------

  temporalContext: unknown;

  // ----------------------------------------------------------
  // S — Investigative scale
  // ----------------------------------------------------------

  investigativeScale: unknown;

  // ----------------------------------------------------------
  // Computational population
  //
  // Canonically ordered identifiers of Knowledge Objects
  // participating in the manifold.
  //
  // P55B will derive these deterministically from the
  // Computational Universe.
  // ----------------------------------------------------------

  knowledgeObjectIds: readonly string[];

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

  universe: CanonicalComputationalUniverse;

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
//
// Those belong to ResolveRuntime.
//
// ============================================================

export interface ResolveEngineOutput {

  // ----------------------------------------------------------
  // Deterministic Investigation Manifold
  // ----------------------------------------------------------

  manifold: CanonicalManifold;

  // ----------------------------------------------------------
  // Canonical representation
  //
  // Stable serialization of the deterministic engine result.
  //
  // This becomes the substrate for:
  //
  //   • deterministic fingerprints
  //   • provenance
  //   • replay verification
  //   • computation comparison
  //
  // in subsequent P55B steps.
  // ----------------------------------------------------------

  canonicalRepresentation: string;

}

// ============================================================
// ENGINE CONTRACT
// ============================================================
//
// ResolveEngine implementations MUST satisfy:
//
//   execute(A) === execute(A)
//
// for equivalent canonical computational input A.
//
// Equality here refers to deterministic computational content,
// not JavaScript object identity.
//
// ============================================================

export interface ResolveEngineContract {

  execute(
    input: ResolveEngineInput,
  ): ResolveEngineOutput;

}