// ============================================================
// tools/verification/VerifyCanonicalSimilarityCandidateEvaluation.ts
//
// P56D-D
// CANONICAL SIMILARITY CANDIDATE EVALUATION VERIFICATION
//
// Verifies the isolated deterministic transformation:
//
//                 C -> E
//
// where:
//
//   C = Canonical Similarity Candidates
//   E = Canonical Candidate Evaluations
//
// GOVERNING RESOLVE PIPELINE
//
//                 M = g(L,T,S)
//
//                 C = h(M.similarityMatrix)
//
//                 E = q(C)
//
// This verifier deliberately tests the evaluation boundary
// independently from ResolveEngine integration.
//
// It proves that evaluation:
//
//   • is deterministic
//   • is input-order invariant
//   • preserves candidate lineage
//   • preserves source similarity measurements
//   • preserves AVAILABLE != UNAVAILABLE
//   • preserves AVAILABLE score 0
//   • preserves canonical dimension order
//   • preserves similarity rationale
//   • accepts direct or reverse resolution orientation
//   • rejects malformed lineage
//   • rejects inconsistent aggregate participation
//   • rejects duplicate aggregate dimensions
//
// Evaluation does NOT:
//
//   • create graph relationships
//   • assert semantic relationships
//   • promote Knowledge
//   • generate Research Vectors
//   • execute REX
//
// ============================================================

import {
  CanonicalSimilarityAvailability,
} from "../../src/resolve/similarity/CanonicalKnowledgeSimilarityTypes";

import type {
  CanonicalKnowledgeSimilarityResolution,
} from "../../src/resolve/similarity/CanonicalKnowledgeSimilarityTypes";

import {
  CanonicalFeatureDimension,
} from "../../src/resolve/features/CanonicalKnowledgeFeatureTypes";

import {
  CanonicalSimilarityCandidateBasis,
} from "../../src/resolve/candidates/CanonicalSimilarityCandidateTypes";

import type {
  CanonicalSimilarityCandidate,
} from "../../src/resolve/candidates/CanonicalSimilarityCandidateTypes";

import {
  CanonicalCandidateEvaluationDimensionStatus,
} from "../../src/resolve/evaluation/CanonicalSimilarityCandidateEvaluationTypes";

import {
  evaluateCanonicalSimilarityCandidates,
} from "../../src/resolve/evaluation/CanonicalSimilarityCandidateEvaluator";

// ============================================================
// ASSERTION UTILITIES
// ============================================================

function assert(
  condition: boolean,
  message: string,
): asserts condition {

  if (!condition) {

    throw new Error(
      `VERIFY FAILED: ${message}`,
    );

  }

}

function assertEqual<T>(
  actual: T,
  expected: T,
  message: string,
): void {

  if (actual !== expected) {

    throw new Error(
      [
        `VERIFY FAILED: ${message}`,
        `expected=${String(expected)}`,
        `actual=${String(actual)}`,
      ].join(" | "),
    );

  }

}

function canonicalJson(
  value: unknown,
): string {

  return JSON.stringify(
    value,
  );

}

function assertThrows(
  operation: () => unknown,
  message: string,
): void {

  let threw =
    false;

  try {

    operation();

  } catch {

    threw =
      true;

  }

  assert(
    threw,
    message,
  );

}

// ============================================================
// CONTROLLED RESOLUTION FIXTURE
// ============================================================
//
// This fixture intentionally contains:
//
//   AVAILABLE narrative       score 0
//   AVAILABLE observability   score 0.75
//   UNAVAILABLE infrastructure
//   AVAILABLE topology        score 0.50
//   UNAVAILABLE geography
//
// This allows one fixture to prove:
//
//   • AVAILABLE zero survives
//   • AVAILABLE nonzero survives
//   • UNAVAILABLE survives
//   • aggregate participation survives
//
// ============================================================

function createControlledResolution(
  sourceKnowledgeObjectId: string,
  targetKnowledgeObjectId: string,
): CanonicalKnowledgeSimilarityResolution {

  return {

    sourceKnowledgeObjectId,

    targetKnowledgeObjectId,

    aggregate: {

      availability:
        CanonicalSimilarityAvailability.AVAILABLE,

      score:
        0.4375,

      participatingWeight:
        0.75,

      participatingDimensions: [

        CanonicalFeatureDimension.NARRATIVE,

        CanonicalFeatureDimension.OBSERVABILITY,

        CanonicalFeatureDimension.TOPOLOGY,

      ],

    },

    dimensions: {

      narrative: {

        availability:
          CanonicalSimilarityAvailability.AVAILABLE,

        dimension:
          CanonicalFeatureDimension.NARRATIVE,

        similarity:
          0,

        weight:
          0.30,

      },

      observability: {

        availability:
          CanonicalSimilarityAvailability.AVAILABLE,

        dimension:
          CanonicalFeatureDimension.OBSERVABILITY,

        similarity:
          0.75,

        weight:
          0.20,

      },

      infrastructure: {

        availability:
          CanonicalSimilarityAvailability.UNAVAILABLE,

        dimension:
          CanonicalFeatureDimension.INFRASTRUCTURE,

        reason:
          "Controlled verification infrastructure unavailable.",

      },

      topology: {

        availability:
          CanonicalSimilarityAvailability.AVAILABLE,

        dimension:
          CanonicalFeatureDimension.TOPOLOGY,

        similarity:
          0.50,

        weight:
          0.25,

      },

      geography: {

        availability:
          CanonicalSimilarityAvailability.UNAVAILABLE,

        dimension:
          CanonicalFeatureDimension.GEOGRAPHY,

        reason:
          "Controlled verification geography unavailable.",

      },

    },

    rationale: [

      "Controlled verification rationale A.",

      "Controlled verification rationale B.",

    ],

  };

}

// ============================================================
// CONTROLLED CANDIDATE
// ============================================================

function createCandidate(
  leftKnowledgeObjectId: string,
  rightKnowledgeObjectId: string,
  reverseResolutionOrientation = false,
): CanonicalSimilarityCandidate {

  const sourceKnowledgeObjectId =
    reverseResolutionOrientation
      ? rightKnowledgeObjectId
      : leftKnowledgeObjectId;

  const targetKnowledgeObjectId =
    reverseResolutionOrientation
      ? leftKnowledgeObjectId
      : rightKnowledgeObjectId;

  return {

    id:
      `similarity-candidate:${leftKnowledgeObjectId}:${rightKnowledgeObjectId}`,

    basis:
      CanonicalSimilarityCandidateBasis
        .AVAILABLE_SIMILARITY,

    leftKnowledgeObjectId,

    rightKnowledgeObjectId,

    similarityResolution:
      createControlledResolution(
        sourceKnowledgeObjectId,
        targetKnowledgeObjectId,
      ),

  };

}

// ============================================================
// PASS 1
// ============================================================
// Equivalent candidate input produces equivalent evaluation.
//
// ============================================================

function verifyRepeatedEvaluationDeterminism(): void {

  const candidate =
    createCandidate(
      "knowledge:event:a",
      "knowledge:event:b",
    );

  const first =
    evaluateCanonicalSimilarityCandidates(
      [candidate],
    );

  const second =
    evaluateCanonicalSimilarityCandidates(
      [candidate],
    );

  assertEqual(
    canonicalJson(first),
    canonicalJson(second),
    "Repeated evaluation of equivalent candidates must be byte-equivalent.",
  );

  console.log(
    "PASS 1 — repeated candidate evaluation is deterministic",
  );

}

// ============================================================
// PASS 2
// ============================================================
// Candidate input order cannot alter evaluation output order.
//
// ============================================================

function verifyInputOrderInvariance(): void {

  const candidateAB =
    createCandidate(
      "knowledge:event:a",
      "knowledge:event:b",
    );

  const candidateAC =
    createCandidate(
      "knowledge:event:a",
      "knowledge:event:c",
    );

  const candidateBC =
    createCandidate(
      "knowledge:event:b",
      "knowledge:event:c",
    );

  const forward =
    evaluateCanonicalSimilarityCandidates(
      [
        candidateAB,
        candidateAC,
        candidateBC,
      ],
    );

  const reordered =
    evaluateCanonicalSimilarityCandidates(
      [
        candidateBC,
        candidateAB,
        candidateAC,
      ],
    );

  assertEqual(
    canonicalJson(forward),
    canonicalJson(reordered),
    "Equivalent reordered candidate populations must produce identical evaluation collections.",
  );

  assertEqual(
    forward.evaluations[0]?.identity.candidateId,
    candidateAB.id,
    "Evaluation ordering must follow deterministic candidate identity.",
  );

  assertEqual(
    forward.evaluations[1]?.identity.candidateId,
    candidateAC.id,
    "Evaluation ordering must follow deterministic candidate identity.",
  );

  assertEqual(
    forward.evaluations[2]?.identity.candidateId,
    candidateBC.id,
    "Evaluation ordering must follow deterministic candidate identity.",
  );

  console.log(
    "PASS 2 — reordered candidate input produces identical canonical evaluation order",
  );

}

// ============================================================
// PASS 3
// ============================================================
// Evaluation identity and pair lineage are preserved.
//
// ============================================================

function verifyEvaluationIdentityAndLineage(): void {

  const candidate =
    createCandidate(
      "knowledge:event:a",
      "knowledge:event:b",
    );

  const result =
    evaluateCanonicalSimilarityCandidates(
      [candidate],
    );

  const evaluation =
    result.evaluations[0];

  assert(
    evaluation !== undefined,
    "Expected one candidate evaluation.",
  );

  assertEqual(
    evaluation.identity.evaluationId,
    `evaluation:${candidate.id}`,
    "Evaluation identity must derive deterministically from candidate identity.",
  );

  assertEqual(
    evaluation.identity.candidateId,
    candidate.id,
    "Evaluation must preserve candidate identity.",
  );

  assertEqual(
    evaluation.identity.leftKnowledgeObjectId,
    candidate.leftKnowledgeObjectId,
    "Evaluation must preserve left Knowledge Object identity.",
  );

  assertEqual(
    evaluation.identity.rightKnowledgeObjectId,
    candidate.rightKnowledgeObjectId,
    "Evaluation must preserve right Knowledge Object identity.",
  );

  assertEqual(
    canonicalJson(
      evaluation.candidate,
    ),
    canonicalJson(
      candidate,
    ),
    "Evaluation must preserve the complete authoritative candidate.",
  );

  console.log(
    "PASS 3 — evaluation preserves candidate identity and Knowledge pair lineage",
  );

}

// ============================================================
// PASS 4
// ============================================================
// Reverse source/target resolution orientation is legitimate.
//
// Candidate pair identity is canonical unordered pair identity.
// Similarity source/target orientation may be independently
// preserved.
//
// ============================================================

function verifyReverseResolutionOrientation(): void {

  const candidate =
    createCandidate(
      "knowledge:event:a",
      "knowledge:event:b",
      true,
    );

  const result =
    evaluateCanonicalSimilarityCandidates(
      [candidate],
    );

  assertEqual(
    result.evaluationCount,
    1,
    "Reverse source/target resolution orientation must remain legitimate.",
  );

  assertEqual(
    result.evaluations[0]
      ?.candidate
      .similarityResolution
      .sourceKnowledgeObjectId,
    "knowledge:event:b",
    "Evaluation must preserve reverse source orientation rather than rewriting it.",
  );

  assertEqual(
    result.evaluations[0]
      ?.candidate
      .similarityResolution
      .targetKnowledgeObjectId,
    "knowledge:event:a",
    "Evaluation must preserve reverse target orientation rather than rewriting it.",
  );

  console.log(
    "PASS 4 — direct or reverse similarity source/target orientation is legitimate",
  );

}

// ============================================================
// PASS 5
// ============================================================
// Every canonical dimension survives in explicit canonical order.
//
// ============================================================

function verifyCanonicalDimensionOrder(): void {

  const candidate =
    createCandidate(
      "knowledge:event:a",
      "knowledge:event:b",
    );

  const result =
    evaluateCanonicalSimilarityCandidates(
      [candidate],
    );

  const dimensions =
    result.evaluations[0]
      ?.explanation
      .dimensions
      .map(
        (dimension) =>
          dimension.dimension,
      );

  const expected = [

    CanonicalFeatureDimension.NARRATIVE,

    CanonicalFeatureDimension.OBSERVABILITY,

    CanonicalFeatureDimension.INFRASTRUCTURE,

    CanonicalFeatureDimension.TOPOLOGY,

    CanonicalFeatureDimension.GEOGRAPHY,

  ];

  assertEqual(
    canonicalJson(dimensions),
    canonicalJson(expected),
    "Evaluation must preserve all five dimensions in explicit canonical order.",
  );

  console.log(
    "PASS 5 — all five similarity dimensions survive evaluation in canonical order",
  );

}

// ============================================================
// PASS 6
// ============================================================
// AVAILABLE and UNAVAILABLE remain distinct.
//
// ============================================================

function verifyAvailabilityPreservation(): void {

  const candidate =
    createCandidate(
      "knowledge:event:a",
      "knowledge:event:b",
    );

  const result =
    evaluateCanonicalSimilarityCandidates(
      [candidate],
    );

  const dimensions =
    result.evaluations[0]
      ?.explanation
      .dimensions;

  assert(
    dimensions !== undefined,
    "Expected dimension evaluations.",
  );

  const narrative =
    dimensions[0];

  const infrastructure =
    dimensions[2];

  assertEqual(
    narrative?.status,
    CanonicalCandidateEvaluationDimensionStatus.AVAILABLE,
    "AVAILABLE source dimension must remain AVAILABLE in evaluation.",
  );

  assertEqual(
    infrastructure?.status,
    CanonicalCandidateEvaluationDimensionStatus.UNAVAILABLE,
    "UNAVAILABLE source dimension must remain UNAVAILABLE in evaluation.",
  );

  assertEqual(
    result.evaluations[0]
      ?.explanation
      .evidence
      .availableDimensionCount,
    3,
    "Evidence state must report three AVAILABLE dimensions.",
  );

  assertEqual(
    result.evaluations[0]
      ?.explanation
      .evidence
      .unavailableDimensionCount,
    2,
    "Evidence state must report two UNAVAILABLE dimensions.",
  );

  console.log(
    "PASS 6 — AVAILABLE and UNAVAILABLE evidence remain semantically distinct",
  );

}

// ============================================================
// PASS 7
// ============================================================
// AVAILABLE score zero must remain AVAILABLE zero.
//
// ============================================================

function verifyAvailableZeroPreservation(): void {

  const candidate =
    createCandidate(
      "knowledge:event:a",
      "knowledge:event:b",
    );

  const result =
    evaluateCanonicalSimilarityCandidates(
      [candidate],
    );

  const narrative =
    result.evaluations[0]
      ?.explanation
      .dimensions[0];

  assert(
    narrative !== undefined,
    "Expected narrative evaluation.",
  );

  assertEqual(
    narrative.status,
    CanonicalCandidateEvaluationDimensionStatus.AVAILABLE,
    "AVAILABLE zero-score dimension must remain AVAILABLE.",
  );

  assertEqual(
    narrative.source.availability,
    CanonicalSimilarityAvailability.AVAILABLE,
    "Source zero-score dimension must preserve AVAILABLE state.",
  );

  if (
    narrative.source.availability !==
      CanonicalSimilarityAvailability.AVAILABLE
  ) {

    throw new Error(
      "VERIFY FAILED: narrative source unexpectedly unavailable.",
    );

  }

  assertEqual(
    narrative.source.similarity,
    0,
    "AVAILABLE zero similarity must remain exactly zero.",
  );

  console.log(
    "PASS 7 — AVAILABLE similarity score zero remains AVAILABLE zero",
  );

}

// ============================================================
// PASS 8
// ============================================================
// Aggregate score and participation survive exactly.
//
// ============================================================

function verifyAggregatePreservation(): void {

  const candidate =
    createCandidate(
      "knowledge:event:a",
      "knowledge:event:b",
    );

  const result =
    evaluateCanonicalSimilarityCandidates(
      [candidate],
    );

  const aggregate =
    result.evaluations[0]
      ?.explanation
      .aggregate;

  assert(
    aggregate !== undefined,
    "Expected aggregate evaluation.",
  );

  assertEqual(
    aggregate.aggregateSimilarity,
    0.4375,
    "Evaluation must preserve aggregate similarity exactly.",
  );

  assertEqual(
    aggregate.participatingDimensionCount,
    3,
    "Evaluation must preserve participating dimension count.",
  );

  assertEqual(
    aggregate.totalDimensionCount,
    5,
    "Evaluation must preserve complete canonical dimension population.",
  );

  console.log(
    "PASS 8 — aggregate similarity and participation survive evaluation exactly",
  );

}

// ============================================================
// PASS 9
// ============================================================
// Similarity rationale survives losslessly.
//
// ============================================================

function verifyRationalePreservation(): void {

  const candidate =
    createCandidate(
      "knowledge:event:a",
      "knowledge:event:b",
    );

  const result =
    evaluateCanonicalSimilarityCandidates(
      [candidate],
    );

  assertEqual(
    canonicalJson(
      result.evaluations[0]
        ?.explanation
        .similarityRationale,
    ),
    canonicalJson(
      candidate
        .similarityResolution
        .rationale,
    ),
    "Evaluation must preserve similarity rationale losslessly.",
  );

  console.log(
    "PASS 9 — canonical similarity rationale survives evaluation losslessly",
  );

}

// ============================================================
// PASS 10
// ============================================================
// Evidence-state collections must match source availability.
//
// ============================================================

function verifyEvidenceState(): void {

  const candidate =
    createCandidate(
      "knowledge:event:a",
      "knowledge:event:b",
    );

  const result =
    evaluateCanonicalSimilarityCandidates(
      [candidate],
    );

  const evidence =
    result.evaluations[0]
      ?.explanation
      .evidence;

  assert(
    evidence !== undefined,
    "Expected evidence state.",
  );

  assertEqual(
    canonicalJson(
      evidence.availableDimensions,
    ),
    canonicalJson(
      [
        CanonicalFeatureDimension.NARRATIVE,
        CanonicalFeatureDimension.OBSERVABILITY,
        CanonicalFeatureDimension.TOPOLOGY,
      ],
    ),
    "Available evidence dimensions must match AVAILABLE source dimensions.",
  );

  assertEqual(
    canonicalJson(
      evidence.unavailableDimensions,
    ),
    canonicalJson(
      [
        CanonicalFeatureDimension.INFRASTRUCTURE,
        CanonicalFeatureDimension.GEOGRAPHY,
      ],
    ),
    "Unavailable evidence dimensions must match UNAVAILABLE source dimensions.",
  );

  assertEqual(
    evidence.totalDimensionCount,
    5,
    "Evidence state must preserve complete dimension population.",
  );

  console.log(
    "PASS 10 — evidence state exactly reflects dimensional availability",
  );

}

// ============================================================
// PASS 11
// ============================================================
// Malformed candidate/resolution lineage must be rejected.
//
// ============================================================

function verifyMalformedLineageRejected(): void {

  const candidate =
    createCandidate(
      "knowledge:event:a",
      "knowledge:event:b",
    );

  const forged:
    CanonicalSimilarityCandidate = {

      ...candidate,

      similarityResolution: {

        ...candidate.similarityResolution,

        sourceKnowledgeObjectId:
          "knowledge:event:forged",

      },

    };

  assertThrows(
    () =>
      evaluateCanonicalSimilarityCandidates(
        [forged],
      ),
    "Evaluation must reject candidate/resolution lineage mismatch.",
  );

  console.log(
    "PASS 11 — malformed candidate/resolution lineage is rejected",
  );

}

// ============================================================
// PASS 12
// ============================================================
// Aggregate participation must agree with per-dimension
// availability.
//
// ============================================================

function verifyInconsistentParticipationRejected(): void {

  const candidate =
    createCandidate(
      "knowledge:event:a",
      "knowledge:event:b",
    );

  const resolution =
    candidate.similarityResolution;

  assert(
    resolution.aggregate.availability ===
      CanonicalSimilarityAvailability.AVAILABLE,
    "Controlled candidate must contain AVAILABLE aggregate.",
  );

  const forged:
    CanonicalSimilarityCandidate = {

      ...candidate,

      similarityResolution: {

        ...resolution,

        aggregate: {

          ...resolution.aggregate,

          participatingDimensions: [

            CanonicalFeatureDimension.NARRATIVE,

            CanonicalFeatureDimension.OBSERVABILITY,

          ],

        },

      },

    };

  assertThrows(
    () =>
      evaluateCanonicalSimilarityCandidates(
        [forged],
      ),
    "Evaluation must reject disagreement between aggregate participation and dimension availability.",
  );

  console.log(
    "PASS 12 — inconsistent aggregate participation is rejected",
  );

}

// ============================================================
// PASS 13
// ============================================================
// Duplicate aggregate dimensions must be rejected.
//
// ============================================================

function verifyDuplicateParticipationRejected(): void {

  const candidate =
    createCandidate(
      "knowledge:event:a",
      "knowledge:event:b",
    );

  const resolution =
    candidate.similarityResolution;

  assert(
    resolution.aggregate.availability ===
      CanonicalSimilarityAvailability.AVAILABLE,
    "Controlled candidate must contain AVAILABLE aggregate.",
  );

  const forged:
    CanonicalSimilarityCandidate = {

      ...candidate,

      similarityResolution: {

        ...resolution,

        aggregate: {

          ...resolution.aggregate,

          participatingDimensions: [

            CanonicalFeatureDimension.NARRATIVE,

            CanonicalFeatureDimension.NARRATIVE,

            CanonicalFeatureDimension.OBSERVABILITY,

            CanonicalFeatureDimension.TOPOLOGY,

          ],

        },

      },

    };

  assertThrows(
    () =>
      evaluateCanonicalSimilarityCandidates(
        [forged],
      ),
    "Evaluation must reject duplicate aggregate participating dimensions.",
  );

  console.log(
    "PASS 13 — duplicate aggregate participating dimensions are rejected",
  );

}

// ============================================================
// PASS 14
// ============================================================
// Evaluation refuses an UNAVAILABLE aggregate.
//
// A CanonicalSimilarityCandidate should never normally contain
// one because candidate generation excludes it.
//
// This verifies evaluator boundary integrity against forged input.
//
// ============================================================

function verifyUnavailableAggregateRejected(): void {

  const candidate =
    createCandidate(
      "knowledge:event:a",
      "knowledge:event:b",
    );

  const forged:
    CanonicalSimilarityCandidate = {

      ...candidate,

      similarityResolution: {

        ...candidate.similarityResolution,

        aggregate: {

          availability:
            CanonicalSimilarityAvailability.UNAVAILABLE,

          reason:
            "Controlled forged unavailable aggregate.",

        },

      },

    };

  assertThrows(
    () =>
      evaluateCanonicalSimilarityCandidates(
        [forged],
      ),
    "Evaluation must reject candidates carrying UNAVAILABLE aggregate similarity.",
  );

  console.log(
    "PASS 14 — forged candidate with UNAVAILABLE aggregate is rejected",
  );

}

// ============================================================
// PASS 15
// ============================================================
// Collection cardinality is preserved exactly.
//
// Evaluation is one-for-one over supplied canonical candidates.
//
// ============================================================

function verifyCollectionCardinality(): void {

  const candidates = [

    createCandidate(
      "knowledge:event:a",
      "knowledge:event:b",
    ),

    createCandidate(
      "knowledge:event:a",
      "knowledge:event:c",
    ),

    createCandidate(
      "knowledge:event:b",
      "knowledge:event:c",
    ),

  ];

  const result =
    evaluateCanonicalSimilarityCandidates(
      candidates,
    );

  assertEqual(
    result.candidateCount,
    3,
    "Evaluation collection must report complete candidate population.",
  );

  assertEqual(
    result.evaluationCount,
    3,
    "Every candidate must produce exactly one evaluation.",
  );

  assertEqual(
    result.evaluations.length,
    3,
    "Evaluation population length must equal candidate population.",
  );

  console.log(
    "PASS 15 — candidate population maps one-for-one to evaluation population",
  );

}

// ============================================================
// PASS 16
// ============================================================
// Evaluation remains explanatory only.
//
// We verify the product does not introduce downstream semantic
// fields representing relationships, Knowledge promotion,
// Research Vectors, REX, or recommendations.
//
// This is intentionally structural.
//
// ============================================================

function verifyEvaluationBoundaryPurity(): void {

  const candidate =
    createCandidate(
      "knowledge:event:a",
      "knowledge:event:b",
    );

  const result =
    evaluateCanonicalSimilarityCandidates(
      [candidate],
    );

  const serialized =
    canonicalJson(
      result,
    );

  const forbiddenKeys = [

    "\"relationship\"",
    "\"relationships\"",
    "\"knowledgeRelationship\"",
    "\"researchVector\"",
    "\"researchVectors\"",
    "\"rex\"",
    "\"recommendation\"",
    "\"recommendedAction\"",
    "\"suggestedSearch\"",

  ];

  for (
    const forbiddenKey
    of forbiddenKeys
  ) {

    assert(
      !serialized.includes(
        forbiddenKey,
      ),
      `Evaluation product must not introduce downstream semantic field ${forbiddenKey}.`,
    );

  }

  console.log(
    "PASS 16 — evaluation remains explanatory and introduces no relationship, Research Vector, REX, or recommendation assertion",
  );

}

// ============================================================
// PASS 17
// ============================================================
// Source candidate objects must not be mutated.
//
// ============================================================

function verifySourceCandidateNotMutated(): void {

  const candidate =
    createCandidate(
      "knowledge:event:a",
      "knowledge:event:b",
    );

  const before =
    canonicalJson(
      candidate,
    );

  evaluateCanonicalSimilarityCandidates(
    [candidate],
  );

  const after =
    canonicalJson(
      candidate,
    );

  assertEqual(
    after,
    before,
    "Evaluation must not mutate its source candidate.",
  );

  console.log(
    "PASS 17 — evaluation does not mutate source candidate state",
  );

}

// ============================================================
// PASS 18
// ============================================================
// Empty candidate population is legitimate and deterministic.
//
// ============================================================

function verifyEmptyPopulation(): void {

  const result =
    evaluateCanonicalSimilarityCandidates(
      [],
    );

  assertEqual(
    result.candidateCount,
    0,
    "Empty candidate population must report zero candidates.",
  );

  assertEqual(
    result.evaluationCount,
    0,
    "Empty candidate population must produce zero evaluations.",
  );

  assertEqual(
    result.evaluations.length,
    0,
    "Empty candidate population must produce an empty evaluation collection.",
  );

  console.log(
    "PASS 18 — empty candidate population produces deterministic empty evaluation product",
  );

}

// ============================================================
// RUN
// ============================================================

function run(): void {

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "P56D-D — CANONICAL SIMILARITY CANDIDATE EVALUATION VERIFICATION",
  );
  console.log(
    "============================================================",
  );
  console.log("");

  verifyRepeatedEvaluationDeterminism();

  verifyInputOrderInvariance();

  verifyEvaluationIdentityAndLineage();

  verifyReverseResolutionOrientation();

  verifyCanonicalDimensionOrder();

  verifyAvailabilityPreservation();

  verifyAvailableZeroPreservation();

  verifyAggregatePreservation();

  verifyRationalePreservation();

  verifyEvidenceState();

  verifyMalformedLineageRejected();

  verifyInconsistentParticipationRejected();

  verifyDuplicateParticipationRejected();

  verifyUnavailableAggregateRejected();

  verifyCollectionCardinality();

  verifyEvaluationBoundaryPurity();

  verifySourceCandidateNotMutated();

  verifyEmptyPopulation();

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    " P56D-D CANONICAL CANDIDATE EVALUATION VERIFIED",
  );
  console.log(
    "============================================================",
  );
  console.log("");
  console.log(
    "Verified:",
  );
  console.log(
    "  deterministic candidate evaluation",
  );
  console.log(
    "  candidate input-order invariance",
  );
  console.log(
    "  deterministic evaluation identity",
  );
  console.log(
    "  candidate and Knowledge pair lineage preservation",
  );
  console.log(
    "  direct/reverse similarity orientation preservation",
  );
  console.log(
    "  canonical five-dimension evaluation ordering",
  );
  console.log(
    "  AVAILABLE / UNAVAILABLE semantic preservation",
  );
  console.log(
    "  AVAILABLE score zero preservation",
  );
  console.log(
    "  aggregate similarity preservation",
  );
  console.log(
    "  aggregate participation preservation",
  );
  console.log(
    "  rationale preservation",
  );
  console.log(
    "  evidence-state derivation",
  );
  console.log(
    "  malformed lineage rejection",
  );
  console.log(
    "  inconsistent participation rejection",
  );
  console.log(
    "  duplicate participation rejection",
  );
  console.log(
    "  forged UNAVAILABLE aggregate rejection",
  );
  console.log(
    "  one candidate -> one evaluation",
  );
  console.log(
    "  source candidate immutability",
  );
  console.log(
    "  empty population determinism",
  );
  console.log(
    "  evaluation boundary purity",
  );
  console.log("");
  console.log(
    "Governing computation:",
  );
  console.log(
    "  M = g(L,T,S)",
  );
  console.log("");
  console.log(
    "Candidate derivation:",
  );
  console.log(
    "  C = h(M.similarityMatrix)",
  );
  console.log("");
  console.log(
    "Candidate evaluation:",
  );
  console.log(
    "  E = q(C)",
  );
  console.log("");
  console.log(
    "Current deterministic path:",
  );
  console.log(
    "  U -> M -> C -> E",
  );
  console.log("");
  console.log(
    "All 18 candidate evaluation invariants passed.",
  );
  console.log("");

}

run();

// ============================================================
// END
// ============================================================