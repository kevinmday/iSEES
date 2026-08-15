// ============================================================
// src/resolve/evaluation/CanonicalSimilarityCandidateEvaluationTypes.ts
//
// P56D-D
// CANONICAL SIMILARITY CANDIDATE EVALUATION CONTRACTS
//
// Defines the deterministic explanatory product derived from a
// canonical similarity candidate.
//
// PURPOSE
//
// Candidate generation answers:
//
//   "Which canonically comparable Knowledge pairs deserve
//    deterministic examination?"
//
// Candidate evaluation answers:
//
//   "Why is this candidate computationally interesting?"
//
// Evaluation does NOT:
//
//   • create graph relationships
//   • assert semantic relationships
//   • promote Knowledge
//   • mutate the Canonical Manifold
//   • generate Research Vectors
//   • execute REX
//   • recommend research actions
//   • perform AI inference
//   • perform heuristic reasoning
//
// Evaluation is a structured deterministic explanation product.
//
// It preserves the distinction:
//
//   measurement
//      !=
//   candidate
//      !=
//   evaluation
//      !=
//   relationship
//      !=
//   accepted Knowledge
//
// LONG-GAME COMPUTATIONAL PATH
//
//   K
//   ↓
//   U
//   ↓
//   M = g(L,T,S)
//   ↓
//   C = h(M.similarityMatrix)
//   ↓
//   E = q(C)
//   ↓
//   future Research Vector derivation
//   ↓
//   future REX expansion
//
// P56D-D owns only:
//
//                 C -> E
//
// ============================================================

import type {
  CanonicalSimilarityCandidate,
} from "../candidates/CanonicalSimilarityCandidateTypes";

import type {
  CanonicalDimensionSimilarity,
} from "../similarity/CanonicalKnowledgeSimilarityTypes";

import type {
  CanonicalFeatureDimension,
} from "../features/CanonicalKnowledgeFeatureTypes";

// ============================================================
// EVALUATION IDENTITY
// ============================================================
//
// Evaluation identity is derived from the candidate identity.
//
// No UUID.
// No timestamp.
// No runtime revision.
//
// Equivalent candidate identity MUST produce equivalent
// evaluation identity.
//
// ============================================================

export interface CanonicalSimilarityCandidateEvaluationIdentity {

  evaluationId:
    string;

  candidateId:
    string;

  leftKnowledgeObjectId:
    string;

  rightKnowledgeObjectId:
    string;

}

// ============================================================
// DIMENSION PARTICIPATION STATUS
// ============================================================
//
// AVAILABLE means the dimension legitimately participated in
// the similarity computation.
//
// UNAVAILABLE means the dimension could not legitimately
// participate.
//
// IMPORTANT:
//
//   UNAVAILABLE != zero
//
// A zero similarity score is still an observed comparison.
//
// ============================================================

export const CanonicalCandidateEvaluationDimensionStatus = {

  AVAILABLE:
    "AVAILABLE",

  UNAVAILABLE:
    "UNAVAILABLE",

} as const;

export type CanonicalCandidateEvaluationDimensionStatus =
  (typeof CanonicalCandidateEvaluationDimensionStatus)[
    keyof typeof CanonicalCandidateEvaluationDimensionStatus
  ];

// ============================================================
// DIMENSION EVALUATION
// ============================================================
//
// A dimension evaluation preserves the original deterministic
// similarity result.
//
// Evaluation MUST NOT recompute the similarity measurement.
//
// The similarity engine remains authoritative for:
//
//   • comparability
//   • availability
//   • score
//   • weight
//   • rationale
//   • unavailable reason
//
// This layer only structures those facts as explanatory state.
//
// ============================================================

export interface CanonicalSimilarityCandidateDimensionEvaluation {

  dimension:
    CanonicalFeatureDimension;

  status:
    CanonicalCandidateEvaluationDimensionStatus;

  /**
   * Complete authoritative source dimension result.
   *
   * Preserved losslessly so downstream explanation,
   * inspection, Research Vector derivation, and replay do not
   * need to reinterpret or recompute similarity.
   */
  source:
    CanonicalDimensionSimilarity;

}

// ============================================================
// EVIDENCE STATE
// ============================================================
//
// Evidence state summarizes which canonical dimensions were
// legitimately observable/comparable for this candidate.
//
// It does NOT interpret missing evidence.
//
// It does NOT infer why evidence should exist.
//
// It simply preserves the computational distinction between:
//
//   observed comparison
//
// and:
//
//   unavailable comparison
//
// ============================================================

export interface CanonicalSimilarityCandidateEvidenceState {

  availableDimensions:
    readonly CanonicalFeatureDimension[];

  unavailableDimensions:
    readonly CanonicalFeatureDimension[];

  availableDimensionCount:
    number;

  unavailableDimensionCount:
    number;

  totalDimensionCount:
    number;

}

// ============================================================
// AGGREGATE EVALUATION
// ============================================================
//
// The aggregate evaluation summarizes the deterministic
// similarity result that caused this candidate to exist.
//
// Candidate eligibility is NOT threshold-based.
//
// Therefore:
//
//   aggregateSimilarity = 0
//
// remains a legitimate evaluated candidate when the source
// similarity resolution is AVAILABLE.
//
// ============================================================

export interface CanonicalSimilarityCandidateAggregateEvaluation {

  aggregateSimilarity:
    number;

  participatingDimensionCount:
    number;

  totalDimensionCount:
    number;

}

// ============================================================
// EXPLANATION BASIS
// ============================================================
//
// Structured computational basis for answering:
//
//   WHY DID THIS CANDIDATE SURFACE?
//
// This is deliberately machine-readable.
//
// Human-readable UI text, reports, Research Vectors, and future
// REX operations may project from this state.
//
// They MUST NOT become the authoritative computational truth.
//
// ============================================================

export interface CanonicalSimilarityCandidateExplanationBasis {

  aggregate:
    CanonicalSimilarityCandidateAggregateEvaluation;

  evidence:
    CanonicalSimilarityCandidateEvidenceState;

  dimensions:
    readonly CanonicalSimilarityCandidateDimensionEvaluation[];

  /**
   * Canonical rationale produced by the similarity computation.
   *
   * This is preserved rather than rewritten here.
   */
  similarityRationale:
    readonly string[];

}

// ============================================================
// CANONICAL CANDIDATE EVALUATION
// ============================================================
//
// Complete deterministic evaluation product.
//
// The candidate remains the authoritative source object.
//
// Evaluation provides structured explanatory state derived from
// that candidate without altering the candidate or manifold.
//
// ============================================================

export interface CanonicalSimilarityCandidateEvaluation {

  identity:
    CanonicalSimilarityCandidateEvaluationIdentity;

  /**
   * Complete authoritative candidate.
   *
   * Preserved losslessly so evaluation lineage remains directly
   * inspectable.
   */
  candidate:
    CanonicalSimilarityCandidate;

  explanation:
    CanonicalSimilarityCandidateExplanationBasis;

}

// ============================================================
// EVALUATION COLLECTION
// ============================================================
//
// Deterministically ordered complete evaluation product for a
// Resolve execution.
//
// Ordering MUST follow canonical candidate identity ordering.
//
// ============================================================

export interface CanonicalSimilarityCandidateEvaluationCollection {

  candidateCount:
    number;

  evaluationCount:
    number;

  evaluations:
    readonly CanonicalSimilarityCandidateEvaluation[];

}

// ============================================================
// EVALUATION CONTRACT
// ============================================================
//
// Implementations MUST satisfy:
//
//   q(C) ≡ q(C)
//
// for equivalent canonical candidate input C.
//
// Evaluation MUST:
//
//   • preserve candidate identity
//   • preserve pair orientation
//   • preserve source similarity measurements
//   • preserve AVAILABLE vs UNAVAILABLE
//   • preserve zero as a legitimate available score
//   • produce deterministic ordering
//
// Evaluation MUST NOT:
//
//   • modify candidates
//   • modify CanonicalManifold
//   • create graph edges
//   • assert relationships
//   • promote Knowledge
//   • generate Research Vectors
//   • execute REX
//   • introduce runtime metadata
//   • introduce clocks
//   • introduce randomness
//
// ============================================================

export interface CanonicalSimilarityCandidateEvaluatorContract {

  evaluate(
    candidates:
      readonly CanonicalSimilarityCandidate[],
  ): CanonicalSimilarityCandidateEvaluationCollection;

}

// ============================================================
// GOVERNING PIPELINE
// ============================================================
//
//                 M = g(L,T,S)
//
//                 C = h(M.similarityMatrix)
//
//                 E = q(C)
//
// Therefore:
//
//                 U -> M -> C -> E
//
// E remains downstream explanatory computation.
//
// It does not alter M.
// It does not assert a relationship.
// It does not become Knowledge.
//
// ============================================================

// ============================================================
// END
// ============================================================