// ============================================================
// tools/verification/VerifyResolveCandidateIntelligence.ts
//
// P56D-F
// RESOLVE CANDIDATE INTELLIGENCE VERIFICATION
//
// Verifies the deterministic operator-inspection projection:
//
//                 Ic = p(E)
//
// where:
//
//   E  = Canonical Similarity Candidate Evaluation
//   Ic = Resolve Candidate Intelligence
//
// GOVERNING COMPUTATIONAL PATH
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
// PURPOSE
//
// Candidate evaluation is authoritative computational truth.
//
// Candidate Intelligence is a deterministic inspection
// projection of that truth.
//
// This verifier proves that projection:
//
//   • is deterministic
//   • is one-to-one
//   • preserves identity
//   • preserves Knowledge pair lineage
//   • preserves pair orientation
//   • preserves aggregate similarity
//   • preserves participation
//   • preserves dimensional ordering
//   • preserves AVAILABLE vs UNAVAILABLE
//   • preserves AVAILABLE score zero
//   • preserves canonical rationale
//   • preserves authoritative candidate lineage
//   • preserves authoritative evaluation lineage
//   • does not mutate source evaluation state
//   • rejects malformed collection population state
//
// Candidate Intelligence MUST NOT:
//
//   • recompute similarity
//   • reinterpret evidence
//   • rank candidates
//   • threshold candidates
//   • assert relationships
//   • create GraphEdge
//   • mutate topology
//   • promote Knowledge
//   • generate Research Vectors
//   • execute REX
//   • introduce runtime metadata
//   • introduce clocks
//   • introduce randomness
//   • perform AI inference
//   • perform heuristic reasoning
//
// ============================================================

import type {
  CanonicalSimilarityCandidate,
} from "../../src/resolve/candidates/CanonicalSimilarityCandidateTypes";

import type {
  CanonicalDimensionSimilarity,
} from "../../src/resolve/similarity/CanonicalKnowledgeSimilarityTypes";

import type {
  CanonicalFeatureDimension,
} from "../../src/resolve/features/CanonicalKnowledgeFeatureTypes";

import {
  CanonicalCandidateEvaluationDimensionStatus,
} from "../../src/resolve/evaluation/CanonicalSimilarityCandidateEvaluationTypes";

import type {
  CanonicalSimilarityCandidateEvaluation,
  CanonicalSimilarityCandidateEvaluationCollection,
} from "../../src/resolve/evaluation/CanonicalSimilarityCandidateEvaluationTypes";

import {
  ResolveCandidateEpistemicStatus,
  ResolveCandidateIntelligenceKind,
} from "../../src/resolve/intelligence/ResolveCandidateIntelligenceTypes";

import {
  resolveCandidateIntelligence,
  resolveCandidateIntelligenceCollection,
  resolveCandidateIntelligenceFromEvaluationCollection,
} from "../../src/resolve/intelligence/ResolveCandidateIntelligenceResolver";

// ============================================================
// ASSERTION UTILITIES
// ============================================================

function assert(
  condition: boolean,
  message: string,
): void {

  if (!condition) {

    throw new Error(
      `VERIFY FAILED: ${message}`,
    );

  }

}

function assertEqual<T>(
  left: T,
  right: T,
  message: string,
): void {

  assert(
    left === right,
    message,
  );

}

function canonicalJson(
  value: unknown,
): string {

  return JSON.stringify(
    value,
  );

}

function assertJsonEqual(
  left: unknown,
  right: unknown,
  message: string,
): void {

  assertEqual(
    canonicalJson(left),
    canonicalJson(right),
    message,
  );

}

// ============================================================
// CANONICAL DIMENSION FIXTURES
// ============================================================
//
// CanonicalFeatureDimension is an uppercase canonical
// vocabulary.
//
// We keep the fixture local to this verifier so the test is
// concerned with projection behavior rather than feature
// extraction.
//
// ============================================================

const NARRATIVE =
  "NARRATIVE" as CanonicalFeatureDimension;

const OBSERVABILITY =
  "OBSERVABILITY" as CanonicalFeatureDimension;

const INFRASTRUCTURE =
  "INFRASTRUCTURE" as CanonicalFeatureDimension;

const TOPOLOGY =
  "TOPOLOGY" as CanonicalFeatureDimension;

const GEOGRAPHY =
  "GEOGRAPHY" as CanonicalFeatureDimension;

const CANONICAL_DIMENSION_ORDER:
  readonly CanonicalFeatureDimension[] = [

    NARRATIVE,
    OBSERVABILITY,
    INFRASTRUCTURE,
    TOPOLOGY,
    GEOGRAPHY,

  ];

// ============================================================
// SOURCE DIMENSION FIXTURES
// ============================================================
//
// ResolveCandidateIntelligenceResolver treats each source
// CanonicalDimensionSimilarity as authoritative opaque
// computational state.
//
// It copies the reference.
//
// Therefore this verifier does not need to reproduce similarity
// computation.
//
// The synthetic source objects deliberately include:
//
//   • AVAILABLE positive score
//   • AVAILABLE zero score
//   • UNAVAILABLE state
//
// so projection semantics can be verified directly.
//
// ============================================================

function availableSource(
  dimension:
    CanonicalFeatureDimension,
  score:
    number,
): CanonicalDimensionSimilarity {

  return {

    dimension,

    availability:
      "AVAILABLE",

    score,

    weight:
      1,

    rationale: [
      `Synthetic ${dimension} verification rationale.`,
    ],

  } as unknown as CanonicalDimensionSimilarity;

}

function unavailableSource(
  dimension:
    CanonicalFeatureDimension,
): CanonicalDimensionSimilarity {

  return {

    dimension,

    availability:
      "UNAVAILABLE",

    reason:
      `Synthetic ${dimension} evidence unavailable.`,

  } as unknown as CanonicalDimensionSimilarity;

}

// ============================================================
// CANDIDATE FIXTURE
// ============================================================
//
// Candidate Intelligence preserves the complete authoritative
// candidate object.
//
// The projection does not inspect or recompute candidate
// internals.
//
// Therefore the fixture can remain minimal while still proving
// reference and lineage preservation.
//
// ============================================================

const candidate =
  {

    identity: {

      candidateId:
        "candidate:knowledge:A::knowledge:B",

      leftKnowledgeObjectId:
        "knowledge:A",

      rightKnowledgeObjectId:
        "knowledge:B",

    },

    verificationMarker:
      "P56D-F-CANDIDATE",

  } as unknown as CanonicalSimilarityCandidate;

// ============================================================
// DIMENSION SOURCE FIXTURES
// ============================================================

const narrativeSource =
  availableSource(
    NARRATIVE,
    0.72,
  );

const observabilitySource =
  availableSource(
    OBSERVABILITY,
    0,
  );

const infrastructureSource =
  unavailableSource(
    INFRASTRUCTURE,
  );

const topologySource =
  availableSource(
    TOPOLOGY,
    0.83,
  );

const geographySource =
  availableSource(
    GEOGRAPHY,
    0.14,
  );

// ============================================================
// EVALUATION FIXTURE
// ============================================================
//
// IMPORTANT SEMANTIC CASE:
//
// OBSERVABILITY:
//
//     AVAILABLE score 0
//
// INFRASTRUCTURE:
//
//     UNAVAILABLE
//
// These MUST remain different after E -> Ic.
//
// ============================================================

const evaluation:
  CanonicalSimilarityCandidateEvaluation = {

    identity: {

      evaluationId:
        "evaluation:candidate:knowledge:A::knowledge:B",

      candidateId:
        "candidate:knowledge:A::knowledge:B",

      leftKnowledgeObjectId:
        "knowledge:A",

      rightKnowledgeObjectId:
        "knowledge:B",

    },

    candidate,

    explanation: {

      aggregate: {

        aggregateSimilarity:
          0.4225,

        participatingDimensionCount:
          4,

        totalDimensionCount:
          5,

      },

      evidence: {

        availableDimensions: [

          NARRATIVE,
          OBSERVABILITY,
          TOPOLOGY,
          GEOGRAPHY,

        ],

        unavailableDimensions: [

          INFRASTRUCTURE,

        ],

        availableDimensionCount:
          4,

        unavailableDimensionCount:
          1,

        totalDimensionCount:
          5,

      },

      dimensions: [

        {

          dimension:
            NARRATIVE,

          status:
            CanonicalCandidateEvaluationDimensionStatus.AVAILABLE,

          source:
            narrativeSource,

        },

        {

          dimension:
            OBSERVABILITY,

          status:
            CanonicalCandidateEvaluationDimensionStatus.AVAILABLE,

          source:
            observabilitySource,

        },

        {

          dimension:
            INFRASTRUCTURE,

          status:
            CanonicalCandidateEvaluationDimensionStatus.UNAVAILABLE,

          source:
            infrastructureSource,

        },

        {

          dimension:
            TOPOLOGY,

          status:
            CanonicalCandidateEvaluationDimensionStatus.AVAILABLE,

          source:
            topologySource,

        },

        {

          dimension:
            GEOGRAPHY,

          status:
            CanonicalCandidateEvaluationDimensionStatus.AVAILABLE,

          source:
            geographySource,

        },

      ],

      similarityRationale: [

        "Narrative evidence is canonically comparable.",

        "Observability evidence is available even though similarity is zero.",

        "Infrastructure evidence is unavailable and is not interpreted as zero.",

        "Topology evidence is canonically comparable.",

        "Geographic evidence is canonically comparable.",

      ],

    },

  };

// ============================================================
// SOURCE SNAPSHOT
// ============================================================
//
// Used to prove projection does not mutate E.
//
// ============================================================

const evaluationBeforeProjection =
  canonicalJson(
    evaluation,
  );

// ============================================================
// TEST 1
// REPEATED PROJECTION IS DETERMINISTIC
// ============================================================

const intelligenceA =
  resolveCandidateIntelligence(
    evaluation,
  );

const intelligenceB =
  resolveCandidateIntelligence(
    evaluation,
  );

assertJsonEqual(

  intelligenceA,

  intelligenceB,

  "Repeated E -> Ic projection must produce equivalent intelligence.",

);

console.log(
  "PASS 1 — repeated E -> Ic projection is deterministic",
);

// ============================================================
// TEST 2
// ONE EVALUATION -> ONE INTELLIGENCE OBJECT
// ============================================================

const singleCollection =
  resolveCandidateIntelligenceCollection([
    evaluation,
  ]);

assertEqual(

  singleCollection.candidateCount,

  1,

  "One evaluation must produce candidateCount 1.",

);

assertEqual(

  singleCollection.intelligenceCount,

  1,

  "One evaluation must produce intelligenceCount 1.",

);

assertEqual(

  singleCollection.intelligence.length,

  1,

  "One evaluation must produce exactly one intelligence object.",

);

console.log(
  "PASS 2 — one evaluation produces exactly one Candidate Intelligence object",
);

// ============================================================
// TEST 3
// IDENTITY AND KNOWLEDGE PAIR LINEAGE SURVIVE EXACTLY
// ============================================================

assertEqual(

  intelligenceA.identity.evaluationId,

  evaluation.identity.evaluationId,

  "Evaluation identity must survive projection exactly.",

);

assertEqual(

  intelligenceA.identity.candidateId,

  evaluation.identity.candidateId,

  "Candidate identity must survive projection exactly.",

);

assertEqual(

  intelligenceA.identity.leftKnowledgeObjectId,

  evaluation.identity.leftKnowledgeObjectId,

  "Left Knowledge Object identity must survive projection exactly.",

);

assertEqual(

  intelligenceA.identity.rightKnowledgeObjectId,

  evaluation.identity.rightKnowledgeObjectId,

  "Right Knowledge Object identity must survive projection exactly.",

);

console.log(
  "PASS 3 — evaluation, candidate, and Knowledge pair identities survive exactly",
);

// ============================================================
// TEST 4
// PAIR ORIENTATION SURVIVES EXACTLY
// ============================================================

assertEqual(

  intelligenceA.identity.leftKnowledgeObjectId,

  "knowledge:A",

  "Left pair orientation must remain knowledge:A.",

);

assertEqual(

  intelligenceA.identity.rightKnowledgeObjectId,

  "knowledge:B",

  "Right pair orientation must remain knowledge:B.",

);

assert(

  !(
    intelligenceA.identity.leftKnowledgeObjectId ===
      evaluation.identity.rightKnowledgeObjectId
    &&
    intelligenceA.identity.rightKnowledgeObjectId ===
      evaluation.identity.leftKnowledgeObjectId
  ),

  "Candidate Intelligence must not reverse pair orientation.",

);

console.log(
  "PASS 4 — canonical Knowledge pair orientation survives projection",
);

// ============================================================
// TEST 5
// KIND IS CANDIDATE
// ============================================================

assertEqual(

  intelligenceA.kind,

  ResolveCandidateIntelligenceKind.CANDIDATE,

  "Candidate Intelligence kind must be CANDIDATE.",

);

console.log(
  "PASS 5 — intelligence is explicitly typed as CANDIDATE",
);

// ============================================================
// TEST 6
// EPISTEMIC STATUS REMAINS POTENTIAL
// ============================================================

assertEqual(

  intelligenceA.epistemicStatus,

  ResolveCandidateEpistemicStatus.POTENTIAL_RELATIONSHIP,

  "Candidate Intelligence must remain POTENTIAL_RELATIONSHIP.",

);

assert(

  intelligenceA.epistemicStatus !==
    ("ESTABLISHED_RELATIONSHIP" as typeof intelligenceA.epistemicStatus),

  "Candidate Intelligence must not claim an established relationship.",

);

console.log(
  "PASS 6 — candidate remains a potential relationship, not an established relationship",
);

// ============================================================
// TEST 7
// AGGREGATE SIMILARITY SURVIVES EXACTLY
// ============================================================

assertEqual(

  intelligenceA.explanation.aggregate.aggregateSimilarity,

  evaluation.explanation.aggregate.aggregateSimilarity,

  "Aggregate similarity must survive projection exactly.",

);

console.log(
  "PASS 7 — aggregate similarity survives projection exactly",
);

// ============================================================
// TEST 8
// AGGREGATE PARTICIPATION SURVIVES EXACTLY
// ============================================================

assertEqual(

  intelligenceA.explanation.aggregate.participatingDimensionCount,

  evaluation.explanation.aggregate.participatingDimensionCount,

  "Participating dimension count must survive exactly.",

);

assertEqual(

  intelligenceA.explanation.aggregate.totalDimensionCount,

  evaluation.explanation.aggregate.totalDimensionCount,

  "Total dimension count must survive exactly.",

);

assertEqual(

  intelligenceA.explanation.evidence.availableDimensionCount,

  evaluation.explanation.evidence.availableDimensionCount,

  "Available dimension count must survive exactly.",

);

assertEqual(

  intelligenceA.explanation.evidence.unavailableDimensionCount,

  evaluation.explanation.evidence.unavailableDimensionCount,

  "Unavailable dimension count must survive exactly.",

);

assertEqual(

  intelligenceA.explanation.evidence.totalDimensionCount,

  evaluation.explanation.evidence.totalDimensionCount,

  "Evidence total dimension count must survive exactly.",

);

console.log(
  "PASS 8 — aggregate and evidence participation counts survive exactly",
);

// ============================================================
// TEST 9
// FIVE-DIMENSION CANONICAL ORDER SURVIVES
// ============================================================

const projectedDimensionOrder =
  intelligenceA.explanation.dimensions.map(
    dimension =>
      dimension.dimension,
  );

assertJsonEqual(

  projectedDimensionOrder,

  CANONICAL_DIMENSION_ORDER,

  "Candidate Intelligence must preserve canonical five-dimension ordering.",

);

console.log(
  "PASS 9 — canonical five-dimension evaluation order survives projection",
);

// ============================================================
// TEST 10
// AVAILABLE AND UNAVAILABLE REMAIN DISTINCT
// ============================================================

const projectedObservability =
  intelligenceA.explanation.dimensions[1];

const projectedInfrastructure =
  intelligenceA.explanation.dimensions[2];

assert(

  projectedObservability !== undefined,

  "Projected OBSERVABILITY dimension must exist.",

);

assert(

  projectedInfrastructure !== undefined,

  "Projected INFRASTRUCTURE dimension must exist.",

);

assertEqual(

  projectedObservability!.status,

  CanonicalCandidateEvaluationDimensionStatus.AVAILABLE,

  "OBSERVABILITY must remain AVAILABLE.",

);

assertEqual(

  projectedInfrastructure!.status,

  CanonicalCandidateEvaluationDimensionStatus.UNAVAILABLE,

  "INFRASTRUCTURE must remain UNAVAILABLE.",

);

assert(

  projectedObservability!.status !==
    projectedInfrastructure!.status,

  "AVAILABLE and UNAVAILABLE must remain semantically distinct.",

);

assertJsonEqual(

  intelligenceA.explanation.evidence.availableDimensions,

  evaluation.explanation.evidence.availableDimensions,

  "Available dimension population must survive exactly.",

);

assertJsonEqual(

  intelligenceA.explanation.evidence.unavailableDimensions,

  evaluation.explanation.evidence.unavailableDimensions,

  "Unavailable dimension population must survive exactly.",

);

console.log(
  "PASS 10 — AVAILABLE and UNAVAILABLE evidence remain semantically distinct",
);

// ============================================================
// TEST 11
// AVAILABLE SCORE ZERO REMAINS AVAILABLE ZERO
// ============================================================
//
// We intentionally inspect the authoritative source object.
//
// Candidate Intelligence must not reinterpret:
//
//     AVAILABLE score 0
//
// as:
//
//     UNAVAILABLE
//
// ============================================================

const projectedObservabilitySource =
  projectedObservability!.source as unknown as {

    availability:
      string;

    score:
      number;

  };

assertEqual(

  projectedObservabilitySource.availability,

  "AVAILABLE",

  "Zero-score OBSERVABILITY source must remain AVAILABLE.",

);

assertEqual(

  projectedObservabilitySource.score,

  0,

  "AVAILABLE zero similarity must remain exactly zero.",

);

assert(

  projectedObservability!.status ===
    CanonicalCandidateEvaluationDimensionStatus.AVAILABLE,

  "AVAILABLE zero must not become UNAVAILABLE during projection.",

);

console.log(
  "PASS 11 — AVAILABLE similarity score zero remains AVAILABLE zero",
);

// ============================================================
// TEST 12
// CANONICAL RATIONALE SURVIVES LOSSLESSLY
// ============================================================

assertJsonEqual(

  intelligenceA.explanation.similarityRationale,

  evaluation.explanation.similarityRationale,

  "Canonical similarity rationale must survive projection losslessly.",

);

console.log(
  "PASS 12 — canonical similarity rationale survives projection losslessly",
);

// ============================================================
// TEST 13
// AUTHORITATIVE CANDIDATE / EVALUATION LINEAGE REMAINS ATTACHED
// ============================================================
//
// The resolver deliberately preserves the authoritative source
// objects.
//
// This allows future inspection, Research Vector derivation,
// replay, and audit to reach E directly rather than reconstruct
// it from presentation state.
//
// ============================================================

assert(

  intelligenceA.candidate ===
    evaluation.candidate,

  "Candidate Intelligence must retain the authoritative candidate reference.",

);

assert(

  intelligenceA.sourceEvaluation ===
    evaluation,

  "Candidate Intelligence must retain the authoritative evaluation reference.",

);

for (
  let index = 0;
  index < evaluation.explanation.dimensions.length;
  index += 1
) {

  assert(

    intelligenceA.explanation.dimensions[index]?.source ===
      evaluation.explanation.dimensions[index]?.source,

    `Dimension ${index} must retain its authoritative source similarity reference.`,

  );

}

console.log(
  "PASS 13 — authoritative candidate, evaluation, and dimensional lineage remain attached",
);

// ============================================================
// TEST 14
// PROJECTION DOES NOT MUTATE SOURCE EVALUATION
// ============================================================

const evaluationAfterProjection =
  canonicalJson(
    evaluation,
  );

assertEqual(

  evaluationAfterProjection,

  evaluationBeforeProjection,

  "Candidate Intelligence projection must not mutate source evaluation state.",

);

console.log(
  "PASS 14 — Candidate Intelligence projection does not mutate source evaluation",
);

// ============================================================
// TEST 15
// MALFORMED COLLECTIONS ARE REJECTED, NOT REPAIRED
// ============================================================

const validEvaluationCollection:
  CanonicalSimilarityCandidateEvaluationCollection = {

    candidateCount:
      1,

    evaluationCount:
      1,

    evaluations: [
      evaluation,
    ],

  };

const validProjectedCollection =
  resolveCandidateIntelligenceFromEvaluationCollection(
    validEvaluationCollection,
  );

assertEqual(

  validProjectedCollection.candidateCount,

  1,

  "Valid collection must preserve authoritative candidateCount.",

);

assertEqual(

  validProjectedCollection.intelligenceCount,

  1,

  "Valid collection must produce one intelligence object.",

);

// ------------------------------------------------------------
// evaluationCount != evaluations.length
// ------------------------------------------------------------

const malformedEvaluationCount =
  {

    candidateCount:
      1,

    evaluationCount:
      2,

    evaluations: [
      evaluation,
    ],

  } as CanonicalSimilarityCandidateEvaluationCollection;

let rejectedMalformedEvaluationCount =
  false;

try {

  resolveCandidateIntelligenceFromEvaluationCollection(
    malformedEvaluationCount,
  );

} catch {

  rejectedMalformedEvaluationCount =
    true;

}

assert(

  rejectedMalformedEvaluationCount,

  "Projection must reject inconsistent evaluationCount rather than repair it.",

);

// ------------------------------------------------------------
// candidateCount != evaluationCount
// ------------------------------------------------------------

const malformedCandidateCount =
  {

    candidateCount:
      2,

    evaluationCount:
      1,

    evaluations: [
      evaluation,
    ],

  } as CanonicalSimilarityCandidateEvaluationCollection;

let rejectedMalformedCandidateCount =
  false;

try {

  resolveCandidateIntelligenceFromEvaluationCollection(
    malformedCandidateCount,
  );

} catch {

  rejectedMalformedCandidateCount =
    true;

}

assert(

  rejectedMalformedCandidateCount,

  "Projection must reject non-bijective candidate/evaluation population rather than repair it.",

);

console.log(
  "PASS 15 — malformed candidate/evaluation collections are rejected rather than repaired",
);

// ============================================================
// ADDITIONAL COLLECTION DETERMINISM CHECK
// ============================================================
//
// This is intentionally folded into the final verification
// rather than numbered as a separate invariant.
//
// ============================================================

const projectedCollectionA =
  resolveCandidateIntelligenceFromEvaluationCollection(
    validEvaluationCollection,
  );

const projectedCollectionB =
  resolveCandidateIntelligenceFromEvaluationCollection(
    validEvaluationCollection,
  );

assertJsonEqual(

  projectedCollectionA,

  projectedCollectionB,

  "Repeated collection projection must remain deterministic.",

);

// ============================================================
// RESULT
// ============================================================

console.log("");
console.log(
  "============================================================",
);
console.log(
  " P56D-F RESOLVE CANDIDATE INTELLIGENCE VERIFIED",
);
console.log(
  "============================================================",
);
console.log("");
console.log(
  "Verified:",
);
console.log(
  "  deterministic E -> Ic projection",
);
console.log(
  "  one evaluation -> one Candidate Intelligence object",
);
console.log(
  "  evaluation identity preservation",
);
console.log(
  "  candidate identity preservation",
);
console.log(
  "  Knowledge pair lineage preservation",
);
console.log(
  "  pair orientation preservation",
);
console.log(
  "  explicit CANDIDATE intelligence kind",
);
console.log(
  "  POTENTIAL_RELATIONSHIP epistemic status",
);
console.log(
  "  aggregate similarity preservation",
);
console.log(
  "  aggregate participation preservation",
);
console.log(
  "  evidence participation preservation",
);
console.log(
  "  canonical five-dimension ordering",
);
console.log(
  "  AVAILABLE / UNAVAILABLE semantic preservation",
);
console.log(
  "  AVAILABLE score zero preservation",
);
console.log(
  "  canonical rationale preservation",
);
console.log(
  "  authoritative candidate lineage preservation",
);
console.log(
  "  authoritative evaluation lineage preservation",
);
console.log(
  "  authoritative dimensional source preservation",
);
console.log(
  "  source evaluation immutability",
);
console.log(
  "  malformed collection rejection",
);
console.log(
  "  non-bijective population rejection",
);
console.log(
  "  deterministic collection projection",
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
  "Candidate Intelligence projection:",
);
console.log(
  "  Ic = p(E)",
);
console.log("");
console.log(
  "Current deterministic explanatory path:",
);
console.log(
  "  U -> M -> C -> E -> Ic",
);
console.log("");
console.log(
  "Epistemic boundary:",
);
console.log(
  "  Candidate Intelligence explains a potential relationship.",
);
console.log(
  "  It does NOT assert a graph relationship.",
);
console.log(
  "  It does NOT create a GraphEdge.",
);
console.log(
  "  It does NOT generate a Research Vector.",
);
console.log(
  "  It does NOT execute REX.",
);
console.log("");
console.log(
  "All 15 Candidate Intelligence invariants passed.",
);

// ============================================================
// END
// ============================================================