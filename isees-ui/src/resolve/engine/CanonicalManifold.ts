// ============================================================
// src/resolve/engine/CanonicalManifold.ts
//
// P56D-B
// CANONICAL MANIFOLD COMPUTATION
//
// Deterministic realization of:
//
//                 M = g(L,T,S)
//
// P56D-B integrates the canonical universe-wide pairwise
// similarity structure into the deterministic manifold.
//
// This module transforms a canonical Computational Universe
// into a canonical Investigation Manifold.
//
// COMPUTATIONAL FLOW
//
//     Canonical Computational Universe
//                  ↓
//        canonical Knowledge population
//                  ↓
//        canonical EVENT feature sets
//                  ↓
//        pairwise comparability gates
//                  ↓
//        deterministic similarity matrix
//                  ↓
//          Canonical Manifold
//
// IMPORTANT
//
// Similarity is a computed manifold product.
//
// It does NOT become a new independent input to:
//
//                 M = g(L,T,S)
//
// This is computational state.
//
// It is NOT:
//
//   • graph rendering
//   • UI state
//   • runtime lifecycle
//   • persistence
//   • networking
//   • AI inference
//   • heuristic reasoning
//   • candidate generation
//   • similarity thresholding
//   • graph-edge generation
//
// DETERMINISTIC INVARIANT
//
// Equivalent Canonical Computational Universes MUST produce
// equivalent Canonical Manifolds.
//
// No clocks.
// No random values.
// No external state.
//
// ============================================================

import {
  RESOLVE_GOVERNING_EQUATION,
} from "./ResolveEngineTypes";

import type {
  CanonicalComputationalUniverse,
  CanonicalManifold,
} from "./ResolveEngineTypes";

import {
  getCanonicalKnowledgeObjectIds,
} from "./CanonicalUniverse";

import {
  extractCanonicalEventFeatureSets,
} from "../features/CanonicalKnowledgeFeatureExtractor";

import {
  computeCanonicalKnowledgeSimilarityMatrix,
} from "../similarity/CanonicalKnowledgeSimilarityMatrix";

// ============================================================
// COMPUTE CANONICAL MANIFOLD
// ============================================================
//
// The deterministic manifold is produced from:
//
//                 M = g(L,T,S)
//
// where:
//
//   L → canonically ordered active layers
//   T → canonical universe temporal context
//   S → canonical universe investigative scale
//
// The Knowledge Object population defines the computational
// entities participating in the manifold.
//
// P56D-B additionally realizes the canonical similarity
// structure of participating EVENT Knowledge:
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
// Only canonical EVENT feature sets participate in this
// similarity matrix.
//
// Other Knowledge Object types remain legitimate members of the
// manifold population but are not silently coerced into event
// similarity comparisons.
//
// Later packages may enrich g() with:
//
//   • relationships
//   • observations
//   • temporal deformation
//   • latent intention resolution
//   • dissolve operations
//   • candidate generation
//
// without changing this deterministic Engine boundary.
//
// ============================================================

export function computeCanonicalManifold(
  universe:
    CanonicalComputationalUniverse,
): CanonicalManifold {

  // ----------------------------------------------------------
  // CANONICAL KNOWLEDGE POPULATION
  // ----------------------------------------------------------

  const knowledgeObjectIds =
    getCanonicalKnowledgeObjectIds(
      universe,
    );

  // ----------------------------------------------------------
  // CANONICAL EVENT FEATURE POPULATION
  // ----------------------------------------------------------
  //
  // Feature extraction remains owned by the canonical feature
  // layer.
  //
  // The Engine does not reproduce or reinterpret feature
  // semantics.
  //
  // extractCanonicalEventFeatureSets() establishes the EVENT
  // feature population eligible for pairwise similarity.
  //
  // ----------------------------------------------------------

  const eventFeatureSets =
    extractCanonicalEventFeatureSets(
      universe.knowledgeObjects,
    );

  // ----------------------------------------------------------
  // CANONICAL SIMILARITY MATRIX
  // ----------------------------------------------------------
  //
  // P56D-A owns universe-wide pair construction and pairwise
  // similarity resolution.
  //
  // It guarantees:
  //
  //   • n(n - 1) / 2 unique unordered pairs
  //   • no self-pairs
  //   • no reverse duplicates
  //   • lexical pair orientation
  //   • canonical pair ordering
  //   • input-order invariance
  //   • pairwise comparability gates
  //   • UNAVAILABLE != zero
  //
  // No similarity mathematics is implemented here.
  //
  // ----------------------------------------------------------

  const similarityMatrix =
    computeCanonicalKnowledgeSimilarityMatrix(
      eventFeatureSets,
    );

  // ----------------------------------------------------------
  // CANONICAL MANIFOLD PRODUCT
  // ----------------------------------------------------------

  const manifold:
    CanonicalManifold = {

    equation:
      RESOLVE_GOVERNING_EQUATION,

    investigationId:
      universe.investigationId,

    layers: [
      ...universe.activeLayers,
    ],

    temporalContext:
      universe.temporalContext,

    investigativeScale:
      universe.investigativeScale,

    knowledgeObjectIds: [
      ...knowledgeObjectIds,
    ],

    similarityMatrix,

  };

  return manifold;

}

// ============================================================
// CANONICAL VALUE NORMALIZATION
// ============================================================
//
// JavaScript object property insertion order must not become an
// accidental part of the computational contract.
//
// This function recursively normalizes values before canonical
// serialization.
//
// Rules:
//
//   • null remains null
//   • primitives remain unchanged
//   • arrays preserve order
//   • object keys are lexically sorted
//   • undefined object properties are omitted
//
// Array order is intentionally preserved because arrays reaching
// this boundary are expected to have already been canonicalized
// when their semantics are set-like.
//
// The P56D-A similarity matrix satisfies this requirement:
//
//   • feature population is canonicalized
//   • pair orientation is canonical
//   • pair traversal order is canonical
//
// Therefore matrix pair order is intentionally preserved during
// serialization.
//
// ============================================================

function normalizeCanonicalValue(
  value:
    unknown,
): unknown {

  if (
    value ===
      null
  ) {

    return null;

  }

  if (
    typeof value !==
      "object"
  ) {

    return value;

  }

  if (
    Array.isArray(
      value,
    )
  ) {

    return value.map(
      normalizeCanonicalValue,
    );

  }

  const source =
    value as Record<
      string,
      unknown
    >;

  const normalized:
    Record<
      string,
      unknown
    > = {};

  const keys =
    Object.keys(
      source,
    ).sort(
      compareCanonicalStrings,
    );

  for (
    const key
    of keys
  ) {

    const propertyValue =
      source[
        key
      ];

    if (
      propertyValue ===
        undefined
    ) {

      continue;

    }

    normalized[
      key
    ] =
      normalizeCanonicalValue(
        propertyValue,
      );

  }

  return normalized;

}

// ============================================================
// CANONICAL STRING COMPARATOR
// ============================================================
//
// Explicit lexical comparison avoids locale-sensitive ordering.
//
// ============================================================

function compareCanonicalStrings(
  left:
    string,
  right:
    string,
): number {

  if (
    left <
      right
  ) {

    return -1;

  }

  if (
    left >
      right
  ) {

    return 1;

  }

  return 0;

}

// ============================================================
// SERIALIZE CANONICAL MANIFOLD
// ============================================================
//
// Produces a stable machine-readable representation of the
// manifold.
//
// Equivalent manifold state must produce the same serialized
// representation.
//
// This representation becomes the basis for:
//
//   • deterministic fingerprints
//   • replay verification
//   • provenance
//   • computation comparison
//
// P56D-B consequence:
//
// Because similarityMatrix is part of CanonicalManifold, the
// complete deterministic pairwise similarity structure now
// participates automatically in canonical serialization.
//
// ============================================================

export function serializeCanonicalManifold(
  manifold:
    CanonicalManifold,
): string {

  const normalized =
    normalizeCanonicalValue(
      manifold,
    );

  const serialized =
    JSON.stringify(
      normalized,
    );

  if (
    serialized ===
      undefined
  ) {

    throw new Error(
      "Resolve canonical manifold serialization failed.",
    );

  }

  return serialized;

}

// ============================================================
// COMPUTE + SERIALIZE
// ============================================================
//
// Deterministic core:
//
//     U
//     ↓
//     g(L,T,S)
//     ↓
//     M
//     ↓
//     canonical representation
//
// P56D-B:
//
//     M
//     ├── Knowledge population
//     └── canonical similarity matrix
//
// Therefore similarity measurements are now part of the
// byte-comparable deterministic Resolve product.
//
// ============================================================

export function computeCanonicalManifoldRepresentation(
  universe:
    CanonicalComputationalUniverse,
): {

  manifold:
    CanonicalManifold;

  canonicalRepresentation:
    string;

} {

  const manifold =
    computeCanonicalManifold(
      universe,
    );

  const canonicalRepresentation =
    serializeCanonicalManifold(
      manifold,
    );

  return {

    manifold,

    canonicalRepresentation,

  };

}

// ============================================================
// END
// ============================================================