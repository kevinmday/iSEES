// ============================================================
// src/resolve/similarity/CanonicalKnowledgeSimilarityTypes.ts
//
// P56C-B
// CANONICAL KNOWLEDGE SIMILARITY TYPES
//
// Deterministic comparison contract for canonical Knowledge
// feature sets.
//
// PURPOSE
//
// Canonical Knowledge feature extraction establishes:
//
//     (K, G₀)
//        ↓
//        F
//
// This package establishes the next computational boundary:
//
//        Fᵢ + Fⱼ
//           ↓
//     similarity operator
//           ↓
//          Sᵢⱼ
//
// Resolve similarity MUST operate on:
//
//     CanonicalKnowledgeFeatureSet
//
// and MUST NOT depend directly upon:
//
//   • legacy CorpusEvent
//   • CanonicalReplayEvent
//   • renderer GraphNode / GraphEdge
//   • arbitrary UI state
//   • mutable runtime state
//
// IMPORTANT
//
// Feature absence is NOT equivalent to similarity zero.
//
// Therefore:
//
//     UNAVAILABLE != 0
//
// A similarity dimension participates in the aggregate score
// only when the canonical features required by that dimension
// are mutually available.
//
// No React.
// No runtime lifecycle.
// No graph rendering.
// No persistence.
// No networking.
// No AI inference.
// No clocks.
// No random values.
//
// ============================================================

import type {
  CanonicalFeatureDimension,
} from "../features/CanonicalKnowledgeFeatureTypes";

// ============================================================
// SIMILARITY AVAILABILITY
// ============================================================
//
// AVAILABLE:
//
//   The dimension could be deterministically compared.
//
// UNAVAILABLE:
//
//   The canonical feature state did not permit a legitimate
//   comparison.
//
// A similarity value of zero means:
//
//   comparison was possible and produced zero similarity.
//
// It does NOT mean:
//
//   comparison was impossible.
//
// ============================================================

export const CanonicalSimilarityAvailability = {

  AVAILABLE:
    "AVAILABLE",

  UNAVAILABLE:
    "UNAVAILABLE",

} as const;

export type CanonicalSimilarityAvailability =
  (typeof CanonicalSimilarityAvailability)[
    keyof typeof CanonicalSimilarityAvailability
  ];

// ============================================================
// AVAILABLE DIMENSION RESULT
// ============================================================

export interface AvailableCanonicalDimensionSimilarity {

  availability:
    typeof CanonicalSimilarityAvailability.AVAILABLE;

  dimension:
    CanonicalFeatureDimension;

  similarity:
    number;

  weight:
    number;

}

// ============================================================
// UNAVAILABLE DIMENSION RESULT
// ============================================================

export interface UnavailableCanonicalDimensionSimilarity {

  availability:
    typeof CanonicalSimilarityAvailability.UNAVAILABLE;

  dimension:
    CanonicalFeatureDimension;

  reason:
    string;

}

// ============================================================
// DIMENSION RESULT
// ============================================================

export type CanonicalDimensionSimilarity =

  | AvailableCanonicalDimensionSimilarity

  | UnavailableCanonicalDimensionSimilarity;

// ============================================================
// RESOLUTION WEIGHTS
// ============================================================
//
// Initial weights preserve the historical deterministic P24.2
// Resolve weighting configuration.
//
// These weights describe relative importance.
//
// They do NOT require every dimension to be available.
//
// When one or more dimensions are unavailable, the aggregate
// similarity operator renormalizes over the mutually available
// dimensions.
//
// For available dimension set A:
//
//                 Σ  w_d s_d
//                d∈A
//     S(i,j) = -------------
//                   Σ w_d
//                  d∈A
//
// ============================================================

export interface CanonicalSimilarityWeights {

  narrative:
    number;

  observability:
    number;

  infrastructure:
    number;

  topology:
    number;

  geography:
    number;

}

// ============================================================
// DEFAULT RESOLUTION WEIGHTS
// ============================================================
//
// Historical P24.2 parity:
//
//   Narrative       0.30
//   Observability   0.20
//   Infrastructure  0.15
//   Topology        0.25
//   Geography       0.10
//
// Total:
//
//   1.00
//
// ============================================================

export const DEFAULT_CANONICAL_SIMILARITY_WEIGHTS:
  CanonicalSimilarityWeights = {

  narrative:
    0.30,

  observability:
    0.20,

  infrastructure:
    0.15,

  topology:
    0.25,

  geography:
    0.10,

};

// ============================================================
// DIMENSION COLLECTION
// ============================================================
//
// Every comparison retains the result for every initial
// similarity dimension.
//
// An unavailable dimension is preserved explicitly rather than
// omitted or represented as zero.
//
// This makes the comparison inspectable.
//
// ============================================================

export interface CanonicalSimilarityDimensions {

  narrative:
    CanonicalDimensionSimilarity;

  observability:
    CanonicalDimensionSimilarity;

  infrastructure:
    CanonicalDimensionSimilarity;

  topology:
    CanonicalDimensionSimilarity;

  geography:
    CanonicalDimensionSimilarity;

}

// ============================================================
// AGGREGATE SIMILARITY AVAILABILITY
// ============================================================
//
// Aggregate similarity itself may be unavailable.
//
// Example:
//
//   if no dimensions are mutually comparable:
//
//       aggregate = UNAVAILABLE
//
// We MUST NOT return:
//
//       aggregate = 0
//
// because:
//
//       no comparison
//
// is semantically different from:
//
//       comparison produced zero similarity.
//
// ============================================================

export interface AvailableCanonicalAggregateSimilarity {

  availability:
    typeof CanonicalSimilarityAvailability.AVAILABLE;

  score:
    number;

  participatingWeight:
    number;

  participatingDimensions:
    readonly CanonicalFeatureDimension[];

}

export interface UnavailableCanonicalAggregateSimilarity {

  availability:
    typeof CanonicalSimilarityAvailability.UNAVAILABLE;

  reason:
    string;

}

export type CanonicalAggregateSimilarity =

  | AvailableCanonicalAggregateSimilarity

  | UnavailableCanonicalAggregateSimilarity;

// ============================================================
// CANONICAL KNOWLEDGE SIMILARITY RESOLUTION
// ============================================================
//
// One deterministic comparison between two canonical Knowledge
// feature sets.
//
// Identity is represented using canonical Knowledge Object IDs.
//
// The result preserves:
//
//   • source identity
//   • target identity
//   • aggregate similarity
//   • every dimension result
//   • rationale
//
// No display-name dependency is introduced here.
//
// ============================================================

export interface CanonicalKnowledgeSimilarityResolution {

  sourceKnowledgeObjectId:
    string;

  targetKnowledgeObjectId:
    string;

  aggregate:
    CanonicalAggregateSimilarity;

  dimensions:
    CanonicalSimilarityDimensions;

  rationale:
    readonly string[];

}

// ============================================================
// CANONICAL COMPARISON COLLECTION
// ============================================================
//
// Canonical ordering is owned by the similarity implementation.
//
// Initial ordering contract:
//
//   1. AVAILABLE aggregate results before UNAVAILABLE results
//
//   2. AVAILABLE aggregate score descending
//
//   3. targetKnowledgeObjectId ascending as deterministic
//      lexical tie-breaker
//
// This avoids dependence upon source array ordering or unstable
// JavaScript sort behavior.
//
// ============================================================

export interface CanonicalKnowledgeSimilarityCollection {

  sourceKnowledgeObjectId:
    string;

  resolutions:
    readonly CanonicalKnowledgeSimilarityResolution[];

}

// ============================================================
// OPERATOR ELIGIBILITY
// ============================================================
//
// A Knowledge Object existing in K does not imply eligibility
// for EVENT similarity.
//
// Eligibility is a downstream computational decision.
//
// The initial P56C-B implementation may restrict EVENT
// similarity to canonical EVENT feature sets while preserving
// heterogeneous Knowledge in the broader feature universe.
//
// ============================================================

export const CanonicalSimilarityOperator = {

  EVENT_SIMILARITY:
    "EVENT_SIMILARITY",

} as const;

export type CanonicalSimilarityOperator =
  (typeof CanonicalSimilarityOperator)[
    keyof typeof CanonicalSimilarityOperator
  ];

// ============================================================
// COMPARISON INVARIANTS
// ============================================================
//
// 1.
//
//   Similarity consumes CanonicalKnowledgeFeatureSet.
//
// 2.
//
//   Similarity does NOT consume CanonicalReplayEvent.
//
// 3.
//
//   Similarity does NOT consume legacy CorpusEvent.
//
// 4.
//
//   Feature UNAVAILABLE does not become similarity zero.
//
// 5.
//
//   Similarity zero is a legitimate AVAILABLE result.
//
// 6.
//
//   A dimension participates only when its required canonical
//   features are mutually available.
//
// 7.
//
//   Aggregate similarity is renormalized across participating
//   dimensions:
//
//                 Σ  w_d s_d
//                d∈A
//       S(i,j) = -------------
//                   Σ w_d
//                  d∈A
//
// 8.
//
//   If A is empty:
//
//       aggregate = UNAVAILABLE
//
//   NOT:
//
//       aggregate = 0
//
// 9.
//
//   Comparison is deterministic.
//
// 10.
//
//   Comparison introduces no wall-clock time, randomness,
//   runtime identity, external mutable state, or AI inference.
//
// 11.
//
//   Jaccard mathematics remains unchanged.
//
//   Availability is evaluated BEFORE Jaccard is invoked.
//
//   Therefore:
//
//       AVAILABLE(A), AVAILABLE(B)
//                 ↓
//              Jaccard
//
//   while:
//
//       AVAILABLE(A), UNAVAILABLE
//                 ↓
//        similarity UNAVAILABLE
//
// 12.
//
//   AVAILABLE([]) remains semantically distinct from
//   UNAVAILABLE.
//
// ============================================================

// ============================================================
// END
// ============================================================