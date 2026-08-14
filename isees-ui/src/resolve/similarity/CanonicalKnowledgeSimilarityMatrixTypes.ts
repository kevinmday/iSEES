// ============================================================
// src/resolve/similarity/CanonicalKnowledgeSimilarityMatrixTypes.ts
//
// P56D-A
// CANONICAL KNOWLEDGE SIMILARITY MATRIX TYPES
//
// Deterministic types for universe-wide pairwise canonical
// Knowledge similarity resolution.
//
// PURPOSE
//
// P56C established deterministic pairwise similarity:
//
//        F_i + F_j
//             ↓
//            S_ij
//
// P56D-A establishes the deterministic collection structure:
//
//        {F_1, F_2, ... F_n}
//                  ↓
//        unique canonical pairs
//                  ↓
//        {S_12, S_13, ...}
//
// The word "matrix" identifies the universe-wide pairwise
// similarity computation.
//
// The canonical stored representation intentionally contains
// each unordered pair exactly once.
//
// Therefore:
//
//   • no self-pairs
//   • no duplicate reverse pairs
//   • no score-derived canonical ordering
//
// For n feature sets:
//
//             n(n - 1)
//     P(n) = ----------
//                 2
//
// No thresholds.
// No candidate generation.
// No graph relationships.
// No manifold mutation.
// No AI inference.
// No clocks.
// No randomness.
//
// ============================================================

import type {
  CanonicalKnowledgeSimilarityResolution,
} from "./CanonicalKnowledgeSimilarityTypes";

// ============================================================
// CANONICAL SIMILARITY PAIR
// ============================================================
//
// A pair represents exactly one unordered canonical Knowledge
// comparison.
//
// Pair identity is established lexically:
//
//     leftKnowledgeObjectId < rightKnowledgeObjectId
//
// The resolution itself preserves the source/target identities
// used by the deterministic similarity operator.
//
// Pair ordering is an identity concern.
//
// Similarity ranking is NOT a pair identity concern.
//
// ============================================================

export interface CanonicalKnowledgeSimilarityPair {

  // ----------------------------------------------------------
  // Canonical pair identity
  // ----------------------------------------------------------

  leftKnowledgeObjectId:
    string;

  rightKnowledgeObjectId:
    string;

  // ----------------------------------------------------------
  // Deterministic similarity resolution
  // ----------------------------------------------------------

  resolution:
    CanonicalKnowledgeSimilarityResolution;

}

// ============================================================
// CANONICAL SIMILARITY MATRIX
// ============================================================
//
// Universe-wide deterministic pairwise similarity product.
//
// featureSetCount:
//
//   Number of canonical feature sets participating in the
//   computation.
//
// pairCount:
//
//   Number of unique unordered pairs actually represented.
//
// pairs:
//
//   Canonically identity-ordered pairwise similarity
//   resolutions.
//
// Expected:
//
//             n(n - 1)
//     count = ----------
//                 2
//
// for n >= 2.
//
// Empty and single-member populations legitimately produce
// zero pairs.
//
// ============================================================

export interface CanonicalKnowledgeSimilarityMatrix {

  featureSetCount:
    number;

  pairCount:
    number;

  pairs:
    readonly CanonicalKnowledgeSimilarityPair[];

}

// ============================================================
// MATRIX CONTRACT
// ============================================================
//
// Implementations of this contract MUST satisfy:
//
//   equivalent canonical feature collections
//                  ↓
//   equivalent canonical similarity matrices
//
// including:
//
//   • pair population
//   • pair identity
//   • pair ordering
//   • similarity resolution
//
// Input collection order MUST NOT alter the result.
//
// ============================================================

export interface CanonicalKnowledgeSimilarityMatrixContract {

  compute(
    featureSets:
      readonly import(
        "../features/CanonicalKnowledgeFeatureTypes"
      ).CanonicalKnowledgeFeatureSet[],
  ): CanonicalKnowledgeSimilarityMatrix;

}

// ============================================================
// END
// ============================================================