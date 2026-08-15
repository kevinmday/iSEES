// ============================================================
// src/resolve/evaluation/CanonicalSimilarityCandidateEvaluator.ts
//
// P56D-D
// CANONICAL SIMILARITY CANDIDATE EVALUATOR
//
// Deterministically transforms canonical similarity candidates
// into structured explanatory evaluation products.
//
// GOVERNING PIPELINE
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
// The evaluator does NOT:
//
//   • recompute similarity
//   • modify candidates
//   • modify CanonicalManifold
//   • create graph relationships
//   • assert semantic relationships
//   • promote Knowledge
//   • generate Research Vectors
//   • execute REX
//   • recommend research actions
//   • perform AI inference
//   • perform heuristic reasoning
//
// Evaluation is derived exclusively from deterministic facts
// already preserved by the candidate and its authoritative
// similarity resolution.
//
// No clocks.
// No random values.
// No external mutable state.
//
// ============================================================

import type {
  CanonicalSimilarityCandidate,
} from "../candidates/CanonicalSimilarityCandidateTypes";

import {
  CanonicalSimilarityAvailability,
} from "../similarity/CanonicalKnowledgeSimilarityTypes";

import type {
  CanonicalDimensionSimilarity,
} from "../similarity/CanonicalKnowledgeSimilarityTypes";

import {
  CanonicalFeatureDimension,
} from "../features/CanonicalKnowledgeFeatureTypes";

import {
  CanonicalCandidateEvaluationDimensionStatus,
} from "./CanonicalSimilarityCandidateEvaluationTypes";

import type {
  CanonicalSimilarityCandidateAggregateEvaluation,
  CanonicalSimilarityCandidateDimensionEvaluation,
  CanonicalSimilarityCandidateEvaluation,
  CanonicalSimilarityCandidateEvaluationCollection,
  CanonicalSimilarityCandidateEvaluatorContract,
  CanonicalSimilarityCandidateEvidenceState,
  CanonicalSimilarityCandidateExplanationBasis,
} from "./CanonicalSimilarityCandidateEvaluationTypes";

// ============================================================
// CANONICAL DIMENSION ORDER
// ============================================================
//
// CanonicalFeatureDimension owns uppercase dimension identities:
//
//   NARRATIVE
//   OBSERVABILITY
//   INFRASTRUCTURE
//   TOPOLOGY
//   GEOGRAPHY
//
// CanonicalKnowledgeSimilarityResolution.dimensions, however,
// exposes lowercase object properties:
//
//   narrative
//   observability
//   infrastructure
//   topology
//   geography
//
// We therefore preserve canonical dimension identity here while
// explicitly mapping each identity to its authoritative source
// result.
//
// No JavaScript property-enumeration ordering is trusted.
//
// ============================================================

const CANONICAL_DIMENSION_ORDER:
  readonly CanonicalFeatureDimension[] = [

    CanonicalFeatureDimension.NARRATIVE,
    CanonicalFeatureDimension.OBSERVABILITY,
    CanonicalFeatureDimension.INFRASTRUCTURE,
    CanonicalFeatureDimension.TOPOLOGY,
    CanonicalFeatureDimension.GEOGRAPHY,

  ];

// ============================================================
// EVALUATOR
// ============================================================

export class CanonicalSimilarityCandidateEvaluator
implements CanonicalSimilarityCandidateEvaluatorContract {

  // ==========================================================
  // EVALUATE COLLECTION
  // ==========================================================
  //
  // Candidate input order is not trusted.
  //
  // A canonical copy is sorted by deterministic candidate
  // identity before evaluation.
  //
  // The source array is never mutated.
  //
  // ==========================================================

  evaluate(
    candidates:
      readonly CanonicalSimilarityCandidate[],
  ): CanonicalSimilarityCandidateEvaluationCollection {

    const canonicalCandidates =
      [...candidates]
        .sort(compareCandidateIdentity);

    const evaluations =
      canonicalCandidates.map(
        evaluateCandidate,
      );

    return {

      candidateCount:
        canonicalCandidates.length,

      evaluationCount:
        evaluations.length,

      evaluations,

    };

  }

}

// ============================================================
// EVALUATE ONE CANDIDATE
// ============================================================
//
// Evaluation is a projection of facts already present in the
// candidate.
//
// No source similarity value is recalculated.
//
// ============================================================

function evaluateCandidate(
  candidate:
    CanonicalSimilarityCandidate,
): CanonicalSimilarityCandidateEvaluation {

  const resolution =
    candidate.similarityResolution;

  // ----------------------------------------------------------
  // LINEAGE VALIDATION
  // ----------------------------------------------------------
  //
  // Candidate pair identity and source similarity resolution
  // must describe the same two Knowledge Objects.
  //
  // IMPORTANT:
  //
  // Candidate left/right orientation is canonical pair ordering.
  //
  // Similarity source/target orientation is independently
  // preserved by the similarity operator.
  //
  // Therefore:
  //
  //   {left, right} = {source, target}
  //
  // is required, but:
  //
  //   left = source
  //   right = target
  //
  // is NOT required.
  //
  // ----------------------------------------------------------

  validateCandidateLineage(
    candidate,
  );

  // ----------------------------------------------------------
  // DIMENSION EVALUATIONS
  // ----------------------------------------------------------
  //
  // Explicit source mapping is intentional.
  //
  // CanonicalFeatureDimension values are uppercase identities,
  // while resolution.dimensions uses lowercase property names.
  //
  // ----------------------------------------------------------

  const dimensions:
    readonly CanonicalSimilarityCandidateDimensionEvaluation[] = [

      evaluateDimension(
        CanonicalFeatureDimension.NARRATIVE,
        resolution.dimensions.narrative,
      ),

      evaluateDimension(
        CanonicalFeatureDimension.OBSERVABILITY,
        resolution.dimensions.observability,
      ),

      evaluateDimension(
        CanonicalFeatureDimension.INFRASTRUCTURE,
        resolution.dimensions.infrastructure,
      ),

      evaluateDimension(
        CanonicalFeatureDimension.TOPOLOGY,
        resolution.dimensions.topology,
      ),

      evaluateDimension(
        CanonicalFeatureDimension.GEOGRAPHY,
        resolution.dimensions.geography,
      ),

    ];

  // ----------------------------------------------------------
  // EVIDENCE STATE
  // ----------------------------------------------------------

  const evidence =
    buildEvidenceState(
      dimensions,
    );

  // ----------------------------------------------------------
  // AGGREGATE
  // ----------------------------------------------------------
  //
  // Canonical similarity candidates originate only from
  // AVAILABLE aggregate similarity resolutions.
  //
  // We validate rather than manufacture an aggregate value.
  //
  // AVAILABLE score 0 remains fully legitimate.
  //
  // ----------------------------------------------------------

  if (
    resolution.aggregate.availability !==
      CanonicalSimilarityAvailability.AVAILABLE
  ) {

    throw new Error(
      [
        "Canonical similarity candidate evaluation rejected",
        `candidate "${candidate.id}"`,
        "because its aggregate similarity is UNAVAILABLE.",
      ].join(" "),
    );

  }

  const aggregate:
    CanonicalSimilarityCandidateAggregateEvaluation = {

      aggregateSimilarity:
        resolution.aggregate.score,

      participatingDimensionCount:
        resolution.aggregate
          .participatingDimensions
          .length,

      totalDimensionCount:
        CANONICAL_DIMENSION_ORDER.length,

    };

  // ----------------------------------------------------------
  // CROSS-CHECK PARTICIPATION
  // ----------------------------------------------------------
  //
  // The aggregate similarity result records which dimensions
  // participated.
  //
  // The individual dimension results independently expose
  // AVAILABLE / UNAVAILABLE.
  //
  // These deterministic representations must agree.
  //
  // ----------------------------------------------------------

  validateAggregateParticipation(
    candidate,
    resolution.aggregate
      .participatingDimensions,
    evidence.availableDimensions,
  );

  // ----------------------------------------------------------
  // EXPLANATION BASIS
  // ----------------------------------------------------------

  const explanation:
    CanonicalSimilarityCandidateExplanationBasis = {

      aggregate,

      evidence,

      dimensions,

      similarityRationale:
        [...resolution.rationale],

    };

  // ----------------------------------------------------------
  // DETERMINISTIC EVALUATION PRODUCT
  // ----------------------------------------------------------

  return {

    identity: {

      evaluationId:
        createEvaluationId(
          candidate.id,
        ),

      candidateId:
        candidate.id,

      leftKnowledgeObjectId:
        candidate.leftKnowledgeObjectId,

      rightKnowledgeObjectId:
        candidate.rightKnowledgeObjectId,

    },

    candidate,

    explanation,

  };

}

// ============================================================
// EVALUATE DIMENSION
// ============================================================
//
// AVAILABLE and UNAVAILABLE remain semantically distinct.
//
// In particular:
//
//   AVAILABLE similarity 0
//
// is NOT transformed into:
//
//   UNAVAILABLE
//
// ============================================================

function evaluateDimension(
  dimension:
    CanonicalFeatureDimension,
  source:
    CanonicalDimensionSimilarity,
): CanonicalSimilarityCandidateDimensionEvaluation {

  if (
    source.dimension !==
      dimension
  ) {

    throw new Error(
      [
        "Canonical similarity candidate evaluation rejected",
        `dimension "${dimension}"`,
        "because source dimension identity does not match.",
      ].join(" "),
    );

  }

  if (
    source.availability ===
      CanonicalSimilarityAvailability.AVAILABLE
  ) {

    return {

      dimension,

      status:
        CanonicalCandidateEvaluationDimensionStatus.AVAILABLE,

      source,

    };

  }

  return {

    dimension,

    status:
      CanonicalCandidateEvaluationDimensionStatus.UNAVAILABLE,

    source,

  };

}

// ============================================================
// BUILD EVIDENCE STATE
// ============================================================

function buildEvidenceState(
  dimensions:
    readonly CanonicalSimilarityCandidateDimensionEvaluation[],
): CanonicalSimilarityCandidateEvidenceState {

  const availableDimensions:
    CanonicalFeatureDimension[] = [];

  const unavailableDimensions:
    CanonicalFeatureDimension[] = [];

  for (
    const dimensionEvaluation
    of dimensions
  ) {

    if (
      dimensionEvaluation.status ===
        CanonicalCandidateEvaluationDimensionStatus.AVAILABLE
    ) {

      availableDimensions.push(
        dimensionEvaluation.dimension,
      );

    } else {

      unavailableDimensions.push(
        dimensionEvaluation.dimension,
      );

    }

  }

  return {

    availableDimensions,

    unavailableDimensions,

    availableDimensionCount:
      availableDimensions.length,

    unavailableDimensionCount:
      unavailableDimensions.length,

    totalDimensionCount:
      dimensions.length,

  };

}

// ============================================================
// VALIDATE CANDIDATE LINEAGE
// ============================================================
//
// Candidate pair identity and similarity-resolution identity must
// describe the same unordered canonical Knowledge pair.
//
// Candidate pair orientation:
//
//   left < right
//
// is canonical structural ordering.
//
// Similarity source/target orientation is allowed to differ.
//
// Therefore both direct and reverse resolution orientation are
// legitimate:
//
//   left  = source && right = target
//
// OR:
//
//   left  = target && right = source
//
// We do not rewrite either representation.
//
// ============================================================

function validateCandidateLineage(
  candidate:
    CanonicalSimilarityCandidate,
): void {

  const resolution =
    candidate.similarityResolution;

  const directMatch =
    resolution.sourceKnowledgeObjectId ===
      candidate.leftKnowledgeObjectId
    &&
    resolution.targetKnowledgeObjectId ===
      candidate.rightKnowledgeObjectId;

  const reverseMatch =
    resolution.sourceKnowledgeObjectId ===
      candidate.rightKnowledgeObjectId
    &&
    resolution.targetKnowledgeObjectId ===
      candidate.leftKnowledgeObjectId;

  if (
    !directMatch &&
    !reverseMatch
  ) {

    throw new Error(
      [
        "Canonical similarity candidate evaluation rejected",
        `candidate "${candidate.id}"`,
        "because candidate pair identity does not match",
        "its source similarity resolution.",
      ].join(" "),
    );

  }

}

// ============================================================
// VALIDATE AGGREGATE PARTICIPATION
// ============================================================
//
// Aggregate participation and per-dimension availability are two
// deterministic views of the same similarity computation.
//
// Evaluation refuses inconsistent source state.
//
// ============================================================

function validateAggregateParticipation(
  candidate:
    CanonicalSimilarityCandidate,
  aggregateDimensions:
    readonly CanonicalFeatureDimension[],
  availableDimensions:
    readonly CanonicalFeatureDimension[],
): void {

  const canonicalAggregateDimensions =
    canonicalizeDimensions(
      aggregateDimensions,
    );

  const canonicalAvailableDimensions =
    canonicalizeDimensions(
      availableDimensions,
    );

  if (
    canonicalAggregateDimensions.length !==
      canonicalAvailableDimensions.length
  ) {

    throw new Error(
      [
        "Canonical similarity candidate evaluation rejected",
        `candidate "${candidate.id}"`,
        "because aggregate participating dimensions disagree",
        "with available dimension results.",
      ].join(" "),
    );

  }

  for (
    let index = 0;
    index <
      canonicalAggregateDimensions.length;
    index += 1
  ) {

    if (
      canonicalAggregateDimensions[index] !==
        canonicalAvailableDimensions[index]
    ) {

      throw new Error(
        [
          "Canonical similarity candidate evaluation rejected",
          `candidate "${candidate.id}"`,
          "because aggregate participating dimensions disagree",
          "with available dimension results.",
        ].join(" "),
      );

    }

  }

}

// ============================================================
// CANONICALIZE DIMENSION COLLECTION
// ============================================================
//
// Duplicates are rejected.
//
// Returning explicit canonical dimension order makes validation
// independent of source-array ordering.
//
// ============================================================

function canonicalizeDimensions(
  dimensions:
    readonly CanonicalFeatureDimension[],
): CanonicalFeatureDimension[] {

  const unique =
    new Set<CanonicalFeatureDimension>();

  for (
    const dimension
    of dimensions
  ) {

    if (
      unique.has(
        dimension,
      )
    ) {

      throw new Error(
        [
          "Canonical similarity candidate evaluation rejected",
          `duplicate participating dimension "${dimension}".`,
        ].join(" "),
      );

    }

    unique.add(
      dimension,
    );

  }

  return CANONICAL_DIMENSION_ORDER.filter(
    (dimension) =>
      unique.has(
        dimension,
      ),
  );

}

// ============================================================
// EVALUATION ID
// ============================================================
//
// Evaluation identity is deterministic and derived entirely from
// candidate identity.
//
// Example:
//
//   similarity-candidate:A:B
//
// becomes:
//
//   evaluation:similarity-candidate:A:B
//
// No UUID.
// No runtime identity.
// No clock.
//
// ============================================================

function createEvaluationId(
  candidateId:
    string,
): string {

  return `evaluation:${candidateId}`;

}

// ============================================================
// CANDIDATE ORDER
// ============================================================
//
// Candidate identity is candidate.id.
//
// Candidate generation already derives that identity from the
// canonical pair:
//
//   similarity-candidate:<left>:<right>
//
// Evaluation nevertheless sorts explicitly so equivalent
// candidate sets produce equivalent evaluation collections even
// when supplied in different array order.
//
// The input array is never mutated.
//
// ============================================================

function compareCandidateIdentity(
  left:
    CanonicalSimilarityCandidate,
  right:
    CanonicalSimilarityCandidate,
): number {

  if (
    left.id <
      right.id
  ) {

    return -1;

  }

  if (
    left.id >
      right.id
  ) {

    return 1;

  }

  return 0;

}

// ============================================================
// FUNCTIONAL ENTRY POINT
// ============================================================
//
// Convenience entry point for callers that do not need to own an
// evaluator instance.
//
// ============================================================

export function evaluateCanonicalSimilarityCandidates(
  candidates:
    readonly CanonicalSimilarityCandidate[],
): CanonicalSimilarityCandidateEvaluationCollection {

  const evaluator =
    new CanonicalSimilarityCandidateEvaluator();

  return evaluator.evaluate(
    candidates,
  );

}

// ============================================================
// END
// ============================================================