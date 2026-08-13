// ============================================================
// src/resolve/similarity/CanonicalKnowledgeComparabilityTypes.ts
// P56C-C
// CANONICAL KNOWLEDGE PAIRWISE COMPARABILITY TYPES
//
// Defines the deterministic contract used to decide whether
// a canonical feature dimension may legitimately participate
// in pairwise similarity computation.
//
// This layer sits between:
//
//     Canonical Feature Extraction
//                |
//                v
//     Pairwise Comparability
//                |
//                v
//     Similarity Mathematics
//
// Comparability is NOT feature availability.
//
// Feature availability answers:
//
//     Does this individual Knowledge Object possess the
//     canonical feature required by the operator?
//
// Pairwise comparability answers:
//
//     Given the canonical evidence for two Knowledge Objects,
//     is comparison on this dimension epistemically valid?
//
// Comparability is also NOT similarity.
//
//     NOT_COMPARABLE != similarity 0
//
// Similarity zero means:
//
//     a legitimate comparison was performed and no similarity
//     was measured.
//
// NOT_COMPARABLE means:
//
//     the comparison itself was not legitimate.
//
// No similarity mathematics is defined in this module.
//
// ============================================================

import type {
  CanonicalFeatureDimension,
} from "../features/CanonicalKnowledgeFeatureTypes";

// ============================================================
// COMPARABILITY
// ============================================================

export const CanonicalFeatureComparability = {

  COMPARABLE:
    "COMPARABLE",

  NOT_COMPARABLE:
    "NOT_COMPARABLE",

  INDETERMINATE:
    "INDETERMINATE",

} as const;

export type CanonicalFeatureComparability =
  (typeof CanonicalFeatureComparability)[keyof typeof CanonicalFeatureComparability];

// ============================================================
// PAIRWISE COMPARABILITY RESULT
// ============================================================
//
// This is intentionally independent of similarity score.
//
// No numerical score exists at this boundary.
//
// ============================================================

export interface CanonicalFeatureComparabilityResult {

  dimension:
    CanonicalFeatureDimension;

  comparability:
    CanonicalFeatureComparability;

  reason:
    string;

}

// ============================================================
// ARCHITECTURAL INVARIANTS
// ============================================================
//
// 1.
//
//   Feature availability != pairwise comparability.
//
// 2.
//
//   Pairwise comparability != similarity.
//
// 3.
//
//   UNAVAILABLE != NOT_COMPARABLE.
//
// 4.
//
//   NOT_COMPARABLE != similarity 0.
//
// 5.
//
//   INDETERMINATE preserves insufficient canonical evidence.
//
// 6.
//
//   This contract performs no historical, technological,
//   semantic, or observational inference.
//
// 7.
//
//   Accepted similarity mathematics remains unchanged.
//
// ============================================================
// END
// ============================================================