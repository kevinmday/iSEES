// ============================================================
// src/resolve/similarity/CanonicalKnowledgeSimilarityMatrix.ts
//
// P56D-A
// CANONICAL KNOWLEDGE SIMILARITY MATRIX
//
// Deterministic universe-wide pairwise canonical Knowledge
// similarity resolution.
//
// PURPOSE
//
// P56C established deterministic pairwise similarity:
//
//        F_i + F_j
//             ↓
//            S_ij
//
// P56D-A lifts that verified operator across an entire
// canonical feature population:
//
//        {F_1, F_2, ... F_n}
//                  ↓
//        canonical unique pairs
//                  ↓
//        {S_12, S_13, ...}
//
// Each unordered pair is computed exactly once.
//
// For n feature sets:
//
//             n(n - 1)
//     P(n) = ----------
//                 2
//
// This module does NOT:
//
//   • modify similarity mathematics
//   • modify pairwise comparability policy
//   • introduce similarity thresholds
//   • generate candidates
//   • create graph relationships
//   • mutate the manifold
//   • mutate feature sets
//   • infer missing evidence
//   • perform AI inference
//   • use clocks
//   • use randomness
//
// ============================================================

import type {
  CanonicalKnowledgeFeatureSet,
} from "../features/CanonicalKnowledgeFeatureTypes";

import {
  compareCanonicalKnowledgeFeatures,
} from "./CanonicalKnowledgeSimilarity";

import type {
  CanonicalKnowledgeSimilarityMatrix,
  CanonicalKnowledgeSimilarityMatrixContract,
  CanonicalKnowledgeSimilarityPair,
} from "./CanonicalKnowledgeSimilarityMatrixTypes";

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
// FEATURE SET COMPARATOR
// ============================================================
//
// Canonical feature identity is:
//
//     featureSet.knowledgeObjectId
//
// Score is deliberately irrelevant to canonical population
// ordering.
//
// ============================================================

function compareFeatureSets(
  left:
    CanonicalKnowledgeFeatureSet,
  right:
    CanonicalKnowledgeFeatureSet,
): number {

  return compareCanonicalStrings(
    left.knowledgeObjectId,
    right.knowledgeObjectId,
  );

}

// ============================================================
// VALIDATE FEATURE SET IDENTITIES
// ============================================================
//
// Matrix construction requires:
//
//   • every feature set has a non-empty canonical identity
//   • no canonical identity appears more than once
//
// Duplicate identities would make pair identity ambiguous and
// would violate the one-unordered-pair-per-identity contract.
//
// ============================================================

function validateFeatureSets(
  featureSets:
    readonly CanonicalKnowledgeFeatureSet[],
): void {

  const identities =
    new Set<string>();

  for (
    const featureSet
    of featureSets
  ) {

    const id =
      featureSet.knowledgeObjectId;

    if (
      id.trim().length ===
      0
    ) {

      throw new Error(
        "Canonical similarity matrix requires every feature set to have a non-empty knowledgeObjectId.",
      );

    }

    if (
      identities.has(
        id,
      )
    ) {

      throw new Error(
        `Canonical similarity matrix encountered duplicate Knowledge Object identity: ${id}`,
      );

    }

    identities.add(
      id,
    );

  }

}

// ============================================================
// CANONICALIZE FEATURE SET COLLECTION
// ============================================================
//
// Never sort the caller-owned collection directly.
//
// Input ordering must not influence:
//
//   • pair generation
//   • source/target orientation
//   • pair ordering
//   • matrix output
//
// ============================================================

function canonicalizeFeatureSets(
  featureSets:
    readonly CanonicalKnowledgeFeatureSet[],
): readonly CanonicalKnowledgeFeatureSet[] {

  return [
    ...featureSets,
  ].sort(
    compareFeatureSets,
  );

}

// ============================================================
// CREATE CANONICAL PAIR
// ============================================================
//
// The caller supplies feature sets in canonical lexical order.
//
// Therefore:
//
//     left.knowledgeObjectId
//              <
//     right.knowledgeObjectId
//
// The existing P56C similarity operator is reused without
// modification.
//
// ============================================================

function createCanonicalPair(
  left:
    CanonicalKnowledgeFeatureSet,
  right:
    CanonicalKnowledgeFeatureSet,
): CanonicalKnowledgeSimilarityPair {

  const leftKnowledgeObjectId =
    left.knowledgeObjectId;

  const rightKnowledgeObjectId =
    right.knowledgeObjectId;

  if (
    compareCanonicalStrings(
      leftKnowledgeObjectId,
      rightKnowledgeObjectId,
    ) >=
    0
  ) {

    throw new Error(
      "Canonical similarity matrix pair orientation must be strictly lexical.",
    );

  }

  const resolution =
    compareCanonicalKnowledgeFeatures(
      left,
      right,
    );

  // ----------------------------------------------------------
  // IDENTITY PRESERVATION
  // ----------------------------------------------------------
  //
  // The pair wrapper and the underlying similarity resolution
  // must describe the same canonical source/target identities.
  //
  // ----------------------------------------------------------

  if (
    resolution.sourceKnowledgeObjectId !==
      leftKnowledgeObjectId ||
    resolution.targetKnowledgeObjectId !==
      rightKnowledgeObjectId
  ) {

    throw new Error(
      "Canonical similarity matrix resolution identity does not match canonical pair identity.",
    );

  }

  return {

    leftKnowledgeObjectId,

    rightKnowledgeObjectId,

    resolution,

  };

}

// ============================================================
// EXPECTED UNIQUE PAIR COUNT
// ============================================================
//
// For n canonical feature sets:
//
//             n(n - 1)
//     P(n) = ----------
//                 2
//
// ============================================================

export function computeCanonicalSimilarityPairCount(
  featureSetCount:
    number,
): number {

  if (
    !Number.isInteger(
      featureSetCount,
    ) ||
    featureSetCount <
      0
  ) {

    throw new Error(
      "Canonical similarity pair count requires a non-negative integer feature-set count.",
    );

  }

  return (
    featureSetCount *
    (
      featureSetCount -
      1
    )
  ) /
    2;

}

// ============================================================
// COMPUTE CANONICAL KNOWLEDGE SIMILARITY MATRIX
// ============================================================
//
// Deterministic pair traversal:
//
//     F_1 → F_2
//     F_1 → F_3
//     ...
//     F_1 → F_n
//
//     F_2 → F_3
//     ...
//
//     F_(n-1) → F_n
//
// This is the strict upper triangle of the conceptual symmetric
// similarity matrix.
//
// Self-comparisons are omitted.
//
// Reverse duplicates are omitted.
//
// Canonical output order derives ONLY from canonical Knowledge
// identity.
//
// ============================================================

export function computeCanonicalKnowledgeSimilarityMatrix(
  featureSets:
    readonly CanonicalKnowledgeFeatureSet[],
): CanonicalKnowledgeSimilarityMatrix {

  // ----------------------------------------------------------
  // VALIDATE
  // ----------------------------------------------------------

  validateFeatureSets(
    featureSets,
  );

  // ----------------------------------------------------------
  // CANONICALIZE INPUT ORDER
  // ----------------------------------------------------------

  const canonicalFeatureSets =
    canonicalizeFeatureSets(
      featureSets,
    );

  // ----------------------------------------------------------
  // GENERATE UNIQUE CANONICAL PAIRS
  // ----------------------------------------------------------

  const pairs:
    CanonicalKnowledgeSimilarityPair[] = [];

  for (
    let leftIndex = 0;
    leftIndex <
      canonicalFeatureSets.length;
    leftIndex +=
      1
  ) {

    const left =
      canonicalFeatureSets[
        leftIndex
      ];

    for (
      let rightIndex =
        leftIndex +
        1;
      rightIndex <
        canonicalFeatureSets.length;
      rightIndex +=
        1
    ) {

      const right =
        canonicalFeatureSets[
          rightIndex
        ];

      pairs.push(
        createCanonicalPair(
          left,
          right,
        ),
      );

    }

  }

  // ----------------------------------------------------------
  // VERIFY PAIR POPULATION
  // ----------------------------------------------------------

  const expectedPairCount =
    computeCanonicalSimilarityPairCount(
      canonicalFeatureSets.length,
    );

  if (
    pairs.length !==
    expectedPairCount
  ) {

    throw new Error(
      `Canonical similarity matrix pair population mismatch. Expected ${expectedPairCount}, received ${pairs.length}.`,
    );

  }

  // ----------------------------------------------------------
  // DETERMINISTIC MATRIX PRODUCT
  // ----------------------------------------------------------

  return {

    featureSetCount:
      canonicalFeatureSets.length,

    pairCount:
      pairs.length,

    pairs,

  };

}

// ============================================================
// CONTRACT IMPLEMENTATION
// ============================================================
//
// Class form is supplied for deterministic operator composition
// where a contract instance is preferable.
//
// The functional API above remains the primary lightweight
// operation.
//
// ============================================================

export class CanonicalKnowledgeSimilarityMatrixOperator
implements CanonicalKnowledgeSimilarityMatrixContract {

  compute(
    featureSets:
      readonly CanonicalKnowledgeFeatureSet[],
  ): CanonicalKnowledgeSimilarityMatrix {

    return computeCanonicalKnowledgeSimilarityMatrix(
      featureSets,
    );

  }

}

// ============================================================
// END
// ============================================================