// ============================================================
// src/resolve/intelligence/ResolveCandidateIntelligenceResolver.ts
//
// P56D-F
// RESOLVE CANDIDATE INTELLIGENCE RESOLVER
//
// Pure deterministic projection:
//
//                 Ic = p(E)
//
// where:
//
//   E  = Canonical Similarity Candidate Evaluation
//   Ic = Resolve Candidate Intelligence
//
// PURPOSE
//
// Candidate evaluation already answers:
//
//   "Why is this candidate computationally interesting?"
//
// This resolver projects that authoritative deterministic
// explanation into an operator-inspection intelligence shape.
//
// It performs NO new computation of truth.
//
// GOVERNING PIPELINE
//
//                 M = g(L,T,S)
//
//                 C = h(M.similarityMatrix)
//
//                 E = q(C)
//
//                 Ic = p(E)
//
// Therefore:
//
//                 U -> M -> C -> E -> Ic
//
// PROJECTION INVARIANT
//
// Equivalent canonical evaluation input:
//
//                 E1 ≡ E2
//
// MUST produce equivalent intelligence:
//
//                 p(E1) ≡ p(E2)
//
// This resolver MUST preserve:
//
//   • evaluation identity
//   • candidate identity
//   • Knowledge pair lineage
//   • pair orientation
//   • candidate source object
//   • aggregate similarity
//   • aggregate participation
//   • dimensional ordering
//   • dimensional status
//   • AVAILABLE vs UNAVAILABLE
//   • AVAILABLE score zero
//   • complete source dimensional measurements
//   • evidence state
//   • canonical similarity rationale
//
// This resolver MUST NOT:
//
//   • recompute similarity
//   • modify similarity scores
//   • reinterpret unavailable evidence
//   • convert UNAVAILABLE to zero
//   • apply thresholds
//   • rank candidates
//   • filter candidates
//   • assert relationships
//   • create GraphEdge
//   • mutate graph topology
//   • promote Knowledge
//   • generate Research Vectors
//   • execute REX
//   • recommend research actions
//   • introduce runtime metadata
//   • introduce timestamps
//   • introduce UUIDs
//   • introduce randomness
//   • perform AI inference
//   • perform heuristic reasoning
//
// ============================================================

import type {
  CanonicalSimilarityCandidateEvaluation,
  CanonicalSimilarityCandidateEvaluationCollection,
} from "../evaluation/CanonicalSimilarityCandidateEvaluationTypes";

import {
  ResolveCandidateEpistemicStatus,
  ResolveCandidateIntelligenceKind,
} from "./ResolveCandidateIntelligenceTypes";

import type {
  ResolveCandidateAggregateIntelligence,
  ResolveCandidateDimensionIntelligence,
  ResolveCandidateEvidenceIntelligence,
  ResolveCandidateExplanationIntelligence,
  ResolveCandidateIntelligence,
  ResolveCandidateIntelligenceCollection,
  ResolveCandidateIntelligenceIdentity,
  ResolveCandidateIntelligenceResolverContract,
} from "./ResolveCandidateIntelligenceTypes";

// ============================================================
// SINGLE EVALUATION PROJECTION
// ============================================================
//
// Projects exactly one authoritative evaluation into exactly
// one Candidate Intelligence object.
//
// No identity is generated here.
//
// No explanatory state is generated here.
//
// No canonical measurement is recomputed here.
//
// ============================================================

export function resolveCandidateIntelligence(
  evaluation:
    CanonicalSimilarityCandidateEvaluation,
): ResolveCandidateIntelligence {

  // ----------------------------------------------------------
  // IDENTITY
  // ----------------------------------------------------------
  //
  // Preserve deterministic evaluation/candidate/pair identity.
  //
  // ----------------------------------------------------------

  const identity:
    ResolveCandidateIntelligenceIdentity = {

      evaluationId:
        evaluation.identity.evaluationId,

      candidateId:
        evaluation.identity.candidateId,

      leftKnowledgeObjectId:
        evaluation.identity.leftKnowledgeObjectId,

      rightKnowledgeObjectId:
        evaluation.identity.rightKnowledgeObjectId,

    };

  // ----------------------------------------------------------
  // AGGREGATE
  // ----------------------------------------------------------
  //
  // Copy only.
  //
  // Candidate Intelligence does NOT recompute aggregate
  // similarity or dimensional participation.
  //
  // IMPORTANT:
  //
  // aggregateSimilarity = 0 remains legitimate.
  //
  // ----------------------------------------------------------

  const aggregate:
    ResolveCandidateAggregateIntelligence = {

      aggregateSimilarity:
        evaluation.explanation.aggregate.aggregateSimilarity,

      participatingDimensionCount:
        evaluation.explanation.aggregate.participatingDimensionCount,

      totalDimensionCount:
        evaluation.explanation.aggregate.totalDimensionCount,

    };

  // ----------------------------------------------------------
  // EVIDENCE
  // ----------------------------------------------------------
  //
  // Preserve the explicit distinction:
  //
  //     AVAILABLE
  //         !=
  //     UNAVAILABLE
  //
  // Arrays are copied so the intelligence projection owns its
  // projection containers without modifying authoritative E.
  //
  // ----------------------------------------------------------

  const evidence:
    ResolveCandidateEvidenceIntelligence = {

      availableDimensions: [
        ...evaluation.explanation.evidence.availableDimensions,
      ],

      unavailableDimensions: [
        ...evaluation.explanation.evidence.unavailableDimensions,
      ],

      availableDimensionCount:
        evaluation.explanation.evidence.availableDimensionCount,

      unavailableDimensionCount:
        evaluation.explanation.evidence.unavailableDimensionCount,

      totalDimensionCount:
        evaluation.explanation.evidence.totalDimensionCount,

    };

  // ----------------------------------------------------------
  // DIMENSIONS
  // ----------------------------------------------------------
  //
  // Preserve canonical evaluation ordering.
  //
  // Each dimension retains the complete authoritative source
  // CanonicalDimensionSimilarity.
  //
  // We deliberately do NOT extract an unconditional score.
  //
  // Why?
  //
  // Because:
  //
  //     AVAILABLE score 0
  //
  // and:
  //
  //     UNAVAILABLE
  //
  // are semantically different states.
  //
  // ----------------------------------------------------------

  const dimensions:
    readonly ResolveCandidateDimensionIntelligence[] =
      evaluation.explanation.dimensions.map(
        (
          dimension,
        ): ResolveCandidateDimensionIntelligence => ({

          dimension:
            dimension.dimension,

          status:
            dimension.status,

          source:
            dimension.source,

        }),
      );

  // ----------------------------------------------------------
  // EXPLANATION
  // ----------------------------------------------------------
  //
  // Preserve canonical rationale exactly.
  //
  // No rewriting.
  // No summarization.
  // No generated prose.
  //
  // ----------------------------------------------------------

  const explanation:
    ResolveCandidateExplanationIntelligence = {

      aggregate,

      evidence,

      dimensions,

      similarityRationale: [
        ...evaluation.explanation.similarityRationale,
      ],

    };

  // ----------------------------------------------------------
  // COMPLETE INTELLIGENCE PRODUCT
  // ----------------------------------------------------------
  //
  // The only new semantic labels introduced by projection are:
  //
  //   kind:
  //     CANDIDATE
  //
  //   epistemicStatus:
  //     POTENTIAL_RELATIONSHIP
  //
  // These labels describe the inspection object's epistemic
  // role.
  //
  // They do NOT assert that a relationship exists.
  //
  // ----------------------------------------------------------

  return {

    kind:
      ResolveCandidateIntelligenceKind.CANDIDATE,

    epistemicStatus:
      ResolveCandidateEpistemicStatus.POTENTIAL_RELATIONSHIP,

    identity,

    explanation,

    candidate:
      evaluation.candidate,

    sourceEvaluation:
      evaluation,

  };

}

// ============================================================
// COLLECTION PROJECTION
// ============================================================
//
// Projects the complete canonical evaluation population.
//
// Ordering is preserved exactly.
//
// Therefore:
//
//   canonical evaluation order
//             ↓
//   canonical intelligence order
//
// No sorting occurs here.
//
// No filtering occurs here.
//
// One evaluation produces exactly one intelligence object.
//
// ============================================================

export function resolveCandidateIntelligenceCollection(
  evaluations:
    readonly CanonicalSimilarityCandidateEvaluation[],
): ResolveCandidateIntelligenceCollection {

  const intelligence =
    evaluations.map(
      resolveCandidateIntelligence,
    );

  return {

    candidateCount:
      evaluations.length,

    intelligenceCount:
      intelligence.length,

    intelligence,

  };

}

// ============================================================
// AUTHORITATIVE COLLECTION PROJECTION
// ============================================================
//
// Convenience boundary for projecting directly from the
// complete CanonicalSimilarityCandidateEvaluationCollection.
//
// The source collection already contains authoritative
// candidateCount and evaluationCount.
//
// This function validates population consistency before
// projection.
//
// It does NOT repair malformed source state.
//
// ============================================================

export function resolveCandidateIntelligenceFromEvaluationCollection(
  collection:
    CanonicalSimilarityCandidateEvaluationCollection,
): ResolveCandidateIntelligenceCollection {

  // ----------------------------------------------------------
  // SOURCE POPULATION VALIDATION
  // ----------------------------------------------------------

  if (
    collection.evaluationCount !==
    collection.evaluations.length
  ) {

    throw new Error(
      [
        "Resolve Candidate Intelligence projection rejected",
        "an inconsistent evaluation collection:",
        `evaluationCount=${collection.evaluationCount}`,
        `evaluations.length=${collection.evaluations.length}.`,
      ].join(" "),
    );

  }

  if (
    collection.candidateCount !==
    collection.evaluationCount
  ) {

    throw new Error(
      [
        "Resolve Candidate Intelligence projection rejected",
        "a non-bijective candidate/evaluation population:",
        `candidateCount=${collection.candidateCount}`,
        `evaluationCount=${collection.evaluationCount}.`,
      ].join(" "),
    );

  }

  const projected =
    resolveCandidateIntelligenceCollection(
      collection.evaluations,
    );

  // ----------------------------------------------------------
  // PRESERVE AUTHORITATIVE CANDIDATE POPULATION COUNT
  // ----------------------------------------------------------
  //
  // The generic array projection derives candidateCount from
  // evaluation population because its input has no separate
  // authoritative candidate count.
  //
  // At this collection boundary we retain the authoritative
  // count explicitly.
  //
  // ----------------------------------------------------------

  return {

    ...projected,

    candidateCount:
      collection.candidateCount,

  };

}

// ============================================================
// CONTRACT IMPLEMENTATION
// ============================================================
//
// Object-oriented contract adapter for consumers that prefer
// an explicit resolver instance.
//
// The functional exports above remain the canonical pure
// projection primitives.
//
// ============================================================

export class ResolveCandidateIntelligenceResolver
implements ResolveCandidateIntelligenceResolverContract {

  resolve(
    evaluations:
      readonly CanonicalSimilarityCandidateEvaluation[],
  ): ResolveCandidateIntelligenceCollection {

    return resolveCandidateIntelligenceCollection(
      evaluations,
    );

  }

}

// ============================================================
// ARCHITECTURAL BOUNDARY
// ============================================================
//
// Existing established topology:
//
//   GraphEdge
//      ↓
//   resolveSelectionIntelligence(...)
//      ↓
//   EDGE intelligence
//      ↓
//   "Why are these connected?"
//
// Resolve candidate topology:
//
//   CanonicalSimilarityCandidateEvaluation
//      ↓
//   resolveCandidateIntelligence(...)
//      ↓
//   CANDIDATE intelligence
//      ↓
//   "Why did this potential connection surface?"
//
// Candidate Intelligence remains upstream of:
//
//   • relationship acceptance
//   • GraphEdge creation
//   • graph topology mutation
//   • Research Vector derivation
//   • REX expansion
//
// ============================================================

// ============================================================
// END
// ============================================================