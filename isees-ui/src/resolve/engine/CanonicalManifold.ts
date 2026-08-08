// ============================================================
// src/resolve/engine/CanonicalManifold.ts
//
// P55B
// CANONICAL MANIFOLD COMPUTATION
//
// First executable deterministic realization of:
//
//                 M = g(L,T,S)
//
// This module transforms a canonical Computational Universe
// into a canonical Investigation Manifold.
//
// IMPORTANT
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

// ============================================================
// COMPUTE CANONICAL MANIFOLD
// ============================================================
//
// P55B establishes the first executable form of:
//
//                 M = g(L,T,S)
//
// At this stage:
//
//   L → canonically ordered active layers
//   T → canonical universe temporal context
//   S → canonical universe investigative scale
//
// The Knowledge Object population defines the computational
// entities participating in the resulting manifold.
//
// Later packages may enrich g() with:
//
//   • relationships
//   • observations
//   • topology
//   • temporal deformation
//   • latent intention resolution
//   • dissolve operations
//   • candidate generation
//
// without changing this deterministic Engine boundary.
//
// ============================================================

export function computeCanonicalManifold(
  universe: CanonicalComputationalUniverse,
): CanonicalManifold {

  const knowledgeObjectIds =
    getCanonicalKnowledgeObjectIds(
      universe,
    );

  const manifold: CanonicalManifold = {

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
// ============================================================

function normalizeCanonicalValue(
  value: unknown,
): unknown {

  if (
    value === null
  ) {

    return null;

  }

  if (
    typeof value !== "object"
  ) {

    return value;

  }

  if (
    Array.isArray(value)
  ) {

    return value.map(
      normalizeCanonicalValue,
    );

  }

  const source =
    value as Record<string, unknown>;

  const normalized:
    Record<string, unknown> = {};

  const keys =
    Object.keys(source).sort(
      compareCanonicalStrings,
    );

  for (
    const key
    of keys
  ) {

    const propertyValue =
      source[key];

    if (
      propertyValue === undefined
    ) {

      continue;

    }

    normalized[key] =
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
  left: string,
  right: string,
): number {

  if (
    left < right
  ) {

    return -1;

  }

  if (
    left > right
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
// This representation becomes the basis for deterministic
// fingerprints and replay verification.
//
// ============================================================

export function serializeCanonicalManifold(
  manifold: CanonicalManifold,
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
    serialized === undefined
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
// Convenience operation representing the deterministic core:
//
//     U
//     ↓
//     g(L,T,S)
//     ↓
//     M
//     ↓
//     canonical representation
//
// ============================================================

export function computeCanonicalManifoldRepresentation(
  universe: CanonicalComputationalUniverse,
): {

  manifold: CanonicalManifold;

  canonicalRepresentation: string;

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