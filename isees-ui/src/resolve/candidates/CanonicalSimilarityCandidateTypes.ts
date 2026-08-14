// ============================================================
// src/resolve/candidates/CanonicalSimilarityCandidateTypes.ts
//
// P56D-C
// CANONICAL SIMILARITY CANDIDATE TYPES
//
// Deterministic candidate representation derived from canonical
// pairwise similarity measurements.
//
// PURPOSE
//
// P56D-B established:
//
//     Canonical Knowledge
//            ↓
//     Canonical EVENT Features
//            ↓
//     Pairwise Comparability
//            ↓
//     Similarity Resolution
//            ↓
//     Canonical Similarity Matrix
//            ↓
//     CanonicalManifold
//
// P56D-C establishes the next computational boundary:
//
//     AVAILABLE canonical similarity pair
//                    ↓
//          similarity candidate
//
// A candidate means only:
//
//   "This canonical Knowledge pair possesses an available
//    aggregate similarity measurement and is therefore eligible
//    for downstream deterministic evaluation."
//
// A candidate does NOT mean:
//
//   • the Knowledge Objects are canonically related
//   • the Knowledge Objects represent the same phenomenon
//   • one caused the other
//   • one supports the other
//   • one contradicts the other
//   • a topology edge exists
//   • a KnowledgeRelationship exists
//   • the candidate has been accepted
//   • the candidate has been rejected
//
// No threshold.
// No ranking.
// No graph mutation.
// No Knowledge mutation.
// No AI inference.
// No clocks.
// No randomness.
//
// ============================================================

import type {
  CanonicalKnowledgeSimilarityResolution,
} from "../similarity/CanonicalKnowledgeSimilarityTypes";

// ============================================================
// CANDIDATE BASIS
// ============================================================
//
// CandidateBasis identifies the deterministic computational
// observation that caused a candidate to exist.
//
// P56D-C initially supports exactly one basis:
//
//     AVAILABLE_SIMILARITY
//
// This is intentionally NOT a relationship semantic.
//
// ============================================================

export const CanonicalSimilarityCandidateBasis = {

  AVAILABLE_SIMILARITY:
    "AVAILABLE_SIMILARITY",

} as const;

export type CanonicalSimilarityCandidateBasis =
  (
    typeof CanonicalSimilarityCandidateBasis
  )[
    keyof typeof CanonicalSimilarityCandidateBasis
  ];

// ============================================================
// CANONICAL SIMILARITY CANDIDATE
// ============================================================
//
// Exactly one candidate may be derived from exactly one
// canonical similarity pair whose aggregate is AVAILABLE.
//
// Candidate identity is structural and deterministic.
//
// The canonical pair already guarantees:
//
//     leftKnowledgeObjectId < rightKnowledgeObjectId
//
// Candidate identity therefore derives directly from that pair:
//
//     similarity-candidate:<left>:<right>
//
// The complete similarity resolution is preserved.
//
// This prevents candidate generation from:
// 
//   • recomputing similarity
//   • discarding dimension evidence
//   • discarding availability information
//   • manufacturing rationale
//
// ============================================================

export interface CanonicalSimilarityCandidate {

  // ----------------------------------------------------------
  // DETERMINISTIC CANDIDATE IDENTITY
  // ----------------------------------------------------------

  id:
    string;

  // ----------------------------------------------------------
  // CANDIDATE BASIS
  // ----------------------------------------------------------

  basis:
    CanonicalSimilarityCandidateBasis;

  // ----------------------------------------------------------
  // CANONICAL KNOWLEDGE PAIR
  // ----------------------------------------------------------

  leftKnowledgeObjectId:
    string;

  rightKnowledgeObjectId:
    string;

  // ----------------------------------------------------------
  // SOURCE SIMILARITY RESOLUTION
  // ----------------------------------------------------------
  //
  // Preserved verbatim from the canonical similarity matrix.
  //
  // The candidate layer does not reinterpret or recompute the
  // similarity measurement.
  //
  // ----------------------------------------------------------

  similarityResolution:
    CanonicalKnowledgeSimilarityResolution;

}

// ============================================================
// CANONICAL SIMILARITY CANDIDATE COLLECTION
// ============================================================
//
// Candidate ordering follows canonical pair identity ordering.
//
// It is NOT:
// 
//   • score ranked
//   • confidence ranked
//   • UI ordered
//
// sourcePairCount:
//
//   Number of canonical similarity pairs inspected.
//
// candidateCount:
//
//   Number of pairs with AVAILABLE aggregate similarity.
//
// candidates:
//
//   Canonically identity-ordered candidate population.
//
// Therefore:
//
//     candidateCount <= sourcePairCount
//
// An UNAVAILABLE aggregate legitimately produces no candidate.
//
// ============================================================

export interface CanonicalSimilarityCandidateCollection {

  sourcePairCount:
    number;

  candidateCount:
    number;

  candidates:
    readonly CanonicalSimilarityCandidate[];

}

// ============================================================
// GENERATOR CONTRACT
// ============================================================
//
// Implementations MUST satisfy:
//
//   equivalent canonical similarity matrices
//                     ↓
//   equivalent canonical candidate collections
//
// No candidate may be created from an aggregate whose
// availability is UNAVAILABLE.
//
// No numerical threshold participates in candidate generation.
//
// AVAILABLE score 0 is still a legitimate measured similarity
// and therefore remains candidate-eligible.
//
// ============================================================

export interface CanonicalSimilarityCandidateGeneratorContract {

  generate(
    similarityMatrix:
      import(
        "../similarity/CanonicalKnowledgeSimilarityMatrixTypes"
      ).CanonicalKnowledgeSimilarityMatrix,
  ): CanonicalSimilarityCandidateCollection;

}

// ============================================================
// ARCHITECTURAL INVARIANTS
// ============================================================
//
// 1.
//
//   Candidate generation consumes canonical similarity.
//
// 2.
//
//   Candidate generation does NOT recompute similarity.
//
// 3.
//
//   AVAILABLE aggregate => one candidate.
//
// 4.
//
//   UNAVAILABLE aggregate => no candidate.
//
// 5.
//
//   AVAILABLE score 0 remains candidate-eligible.
//
// 6.
//
//   Candidate != canonical KnowledgeRelationship.
//
// 7.
//
//   Candidate != topology edge.
//
// 8.
//
//   Candidate != accepted proposition.
//
// 9.
//
//   Candidate != causal inference.
//
// 10.
//
//   Candidate generation performs no thresholding.
//
// 11.
//
//   Candidate generation performs no score ranking.
//
// 12.
//
//   Candidate identity derives only from canonical pair identity.
//
// 13.
//
//   Candidate generation introduces no wall-clock time,
//   randomness, runtime identity, external mutable state,
//   graph mutation, Knowledge mutation, or AI inference.
//
// ============================================================

// ============================================================
// END
// ============================================================