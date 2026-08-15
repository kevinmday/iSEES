// ============================================================
// src/resolve/intelligence/ResolveCandidateIntelligenceTypes.ts
//
// P56D-F
// RESOLVE CANDIDATE INTELLIGENCE CONTRACTS
//
// Deterministic operator-inspection projection contracts for
// canonical Resolve candidate evaluations.
//
// PURPOSE
//
// Candidate evaluation answers:
//
//   "Why is this candidate computationally interesting?"
//
// Candidate Intelligence makes that deterministic explanatory
// product suitable for operator inspection without changing its
// computational meaning.
//
// GOVERNING PIPELINE
//
//                 M = g(L,T,S)
//
//                 C = h(M.similarityMatrix)
//
//                 E = q(C)
//
// Candidate Intelligence projection:
//
//                 Ic = p(E)
//
// Therefore:
//
//                 U -> M -> C -> E -> Ic
//
// IMPORTANT
//
// Ic is NOT a new source of computational truth.
//
// The authoritative source remains:
//
//   CanonicalSimilarityCandidateEvaluation
//
// Candidate Intelligence MUST preserve:
//
//   • evaluation identity
//   • candidate identity
//   • Knowledge pair lineage
//   • pair orientation
//   • aggregate similarity
//   • aggregate participation
//   • dimension ordering
//   • AVAILABLE vs UNAVAILABLE
//   • AVAILABLE score zero
//   • source dimensional measurements
//   • evidence state
//   • canonical similarity rationale
//
// Candidate Intelligence MUST NOT:
//
//   • recompute similarity
//   • reinterpret evidence
//   • rank candidates
//   • threshold candidates
//   • assert relationships
//   • create graph edges
//   • mutate graph topology
//   • promote Knowledge
//   • generate Research Vectors
//   • execute REX
//   • recommend operator actions
//   • introduce runtime metadata
//   • introduce clocks
//   • introduce randomness
//   • perform AI inference
//   • perform heuristic reasoning
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

import type {
  CanonicalCandidateEvaluationDimensionStatus,
  CanonicalSimilarityCandidateEvaluation,
} from "../evaluation/CanonicalSimilarityCandidateEvaluationTypes";

// ============================================================
// INTELLIGENCE KIND
// ============================================================
//
// This discriminator deliberately says CANDIDATE.
//
// It does NOT say:
//
//   • EDGE
//   • RELATIONSHIP
//   • KNOWLEDGE
//
// The candidate remains epistemically distinct from established
// graph topology.
//
// ============================================================

export const ResolveCandidateIntelligenceKind = {

  CANDIDATE:
    "CANDIDATE",

} as const;

export type ResolveCandidateIntelligenceKind =
  (typeof ResolveCandidateIntelligenceKind)[
    keyof typeof ResolveCandidateIntelligenceKind
  ];

// ============================================================
// EPISTEMIC STATUS
// ============================================================
//
// Candidate Intelligence represents a potential relationship
// worthy of deterministic inspection.
//
// It does not assert that a relationship exists.
//
// ============================================================

export const ResolveCandidateEpistemicStatus = {

  POTENTIAL_RELATIONSHIP:
    "POTENTIAL_RELATIONSHIP",

} as const;

export type ResolveCandidateEpistemicStatus =
  (typeof ResolveCandidateEpistemicStatus)[
    keyof typeof ResolveCandidateEpistemicStatus
  ];

// ============================================================
// IDENTITY
// ============================================================
//
// Identity is copied from the authoritative evaluation.
//
// No new UUID.
// No timestamp.
// No runtime revision.
//
// ============================================================

export interface ResolveCandidateIntelligenceIdentity {

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
// DIMENSION INTELLIGENCE
// ============================================================
//
// This is an inspection projection of one canonical dimension.
//
// IMPORTANT:
//
//     UNAVAILABLE != AVAILABLE score 0
//
// Therefore score is NOT represented as an unconditional
// number.
//
// Consumers MUST inspect status/source semantics.
//
// The complete authoritative source dimension is retained so
// no downstream inspector needs to recompute or reinterpret
// canonical similarity.
//
// ============================================================

export interface ResolveCandidateDimensionIntelligence {

  dimension:
    CanonicalFeatureDimension;

  status:
    CanonicalCandidateEvaluationDimensionStatus;

  source:
    CanonicalDimensionSimilarity;

}

// ============================================================
// EVIDENCE INTELLIGENCE
// ============================================================
//
// This is a lossless projection of the canonical evaluation's
// evidence participation state.
//
// It answers:
//
//   Which dimensions legitimately participated?
//
// and:
//
//   Which dimensions were unavailable?
//
// It does NOT answer:
//
//   Why should missing evidence exist?
//
// ============================================================

export interface ResolveCandidateEvidenceIntelligence {

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
// AGGREGATE INTELLIGENCE
// ============================================================
//
// Candidate eligibility is availability-based, NOT threshold-
// based.
//
// Therefore:
//
//   aggregateSimilarity = 0
//
// remains legitimate when the canonical aggregate similarity
// was AVAILABLE.
//
// ============================================================

export interface ResolveCandidateAggregateIntelligence {

  aggregateSimilarity:
    number;

  participatingDimensionCount:
    number;

  totalDimensionCount:
    number;

}

// ============================================================
// EXPLANATION INTELLIGENCE
// ============================================================
//
// Operator-inspectable deterministic WHY.
//
// This preserves the explanatory structure already produced by
// E = q(C).
//
// No prose generation occurs here.
//
// No rationale rewriting occurs here.
//
// ============================================================

export interface ResolveCandidateExplanationIntelligence {

  aggregate:
    ResolveCandidateAggregateIntelligence;

  evidence:
    ResolveCandidateEvidenceIntelligence;

  dimensions:
    readonly ResolveCandidateDimensionIntelligence[];

  similarityRationale:
    readonly string[];

}

// ============================================================
// COMPLETE CANDIDATE INTELLIGENCE
// ============================================================
//
// Ic = p(E)
//
// This is the deterministic inspection projection consumed by
// future operator-facing intelligence surfaces.
//
// The complete source evaluation and candidate are retained for
// direct lineage inspection.
//
// ============================================================

export interface ResolveCandidateIntelligence {

  kind:
    ResolveCandidateIntelligenceKind;

  epistemicStatus:
    ResolveCandidateEpistemicStatus;

  identity:
    ResolveCandidateIntelligenceIdentity;

  explanation:
    ResolveCandidateExplanationIntelligence;

  /**
   * Complete authoritative candidate.
   *
   * Preserved for direct pair and source lineage inspection.
   */
  candidate:
    CanonicalSimilarityCandidate;

  /**
   * Complete authoritative evaluation.
   *
   * Candidate Intelligence is only a projection of this object.
   * It MUST NOT replace it as computational truth.
   */
  sourceEvaluation:
    CanonicalSimilarityCandidateEvaluation;

}

// ============================================================
// COLLECTION
// ============================================================
//
// Complete deterministic Candidate Intelligence population for
// one evaluation collection.
//
// Ordering MUST preserve canonical evaluation ordering.
//
// ============================================================

export interface ResolveCandidateIntelligenceCollection {

  candidateCount:
    number;

  intelligenceCount:
    number;

  intelligence:
    readonly ResolveCandidateIntelligence[];

}

// ============================================================
// RESOLVER CONTRACT
// ============================================================
//
// Pure deterministic projection:
//
//                 Ic = p(E)
//
// Equivalent E MUST produce equivalent Ic.
//
// ============================================================

export interface ResolveCandidateIntelligenceResolverContract {

  resolve(
    evaluations:
      readonly CanonicalSimilarityCandidateEvaluation[],
  ): ResolveCandidateIntelligenceCollection;

}

// ============================================================
// ARCHITECTURAL DISTINCTION
// ============================================================
//
// Established topology:
//
//   GraphEdge
//      ↓
//   Selection Intelligence
//      ↓
//   "Why are these connected?"
//
// Resolve candidate:
//
//   CanonicalSimilarityCandidateEvaluation
//      ↓
//   Resolve Candidate Intelligence
//      ↓
//   "Why did this potential connection surface?"
//
// These are intentionally different epistemic states.
//
// Candidate Intelligence does NOT manufacture GraphEdge.
//
// ============================================================

// ============================================================
// END
// ============================================================