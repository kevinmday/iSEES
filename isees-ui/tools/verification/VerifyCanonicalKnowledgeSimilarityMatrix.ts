// ============================================================
// tools/verification/VerifyCanonicalKnowledgeSimilarityMatrix.ts
//
// P56D-A
// CANONICAL KNOWLEDGE SIMILARITY MATRIX VERIFICATION
//
// Verifies deterministic universe-wide pairwise similarity
// resolution.
//
// GOVERNING OPERATION
//
//        {F_1, F_2, ... F_n}
//                  ↓
//        canonical unique pairs
//                  ↓
//        {S_12, S_13, ...}
//
// For n feature sets:
//
//             n(n - 1)
//     P(n) = ----------
//                 2
//
// VERIFICATION TARGETS
//
//   • zero-member population produces zero pairs
//   • one-member population produces zero pairs
//   • n members produce n(n - 1)/2 pairs
//   • every unordered pair occurs exactly once
//   • no self-pairs
//   • no reverse duplicate pairs
//   • pair orientation is strictly lexical
//   • pair ordering is canonical identity ordering
//   • input ordering does not alter matrix output
//   • repeated computation is deterministic
//   • caller-owned feature collection is not mutated
//   • canonical Knowledge identities are preserved
//   • duplicate identities are rejected
//   • empty identities are rejected
//   • P56C-D similarity semantics remain intact
//   • unavailable dimensions remain unavailable, not zero
//
// No React.
// No UI.
// No networking.
// No AI.
// No clocks.
// No randomness.
//
// ============================================================

import {
  CanonicalFeatureAvailability,
  CanonicalFeatureDimension,
} from "../../src/resolve/features/CanonicalKnowledgeFeatureTypes";

import type {
  CanonicalFeatureValue,
  CanonicalGeographicLocation,
  CanonicalInfrastructureEntityFeature,
  CanonicalKnowledgeFeatureSet,
  CanonicalTopologyState,
} from "../../src/resolve/features/CanonicalKnowledgeFeatureTypes";

import {
  CanonicalSimilarityAvailability,
} from "../../src/resolve/similarity/CanonicalKnowledgeSimilarityTypes";

import {
  computeCanonicalKnowledgeSimilarityMatrix,
  computeCanonicalSimilarityPairCount,
} from "../../src/resolve/similarity/CanonicalKnowledgeSimilarityMatrix";

import type {
  CanonicalKnowledgeSimilarityMatrix,
  CanonicalKnowledgeSimilarityPair,
} from "../../src/resolve/similarity/CanonicalKnowledgeSimilarityMatrixTypes";

// ============================================================
// ASSERTIONS
// ============================================================

function assert(
  condition:
    boolean,
  message:
    string,
): void {

  if (
    !condition
  ) {

    throw new Error(
      `VERIFY FAILED: ${message}`,
    );

  }

}

function assertEqual<T>(
  actual:
    T,
  expected:
    T,
  message:
    string,
): void {

  assert(
    actual ===
      expected,
    `${message} Expected ${String(expected)}, received ${String(actual)}.`,
  );

}

function assertApproximatelyEqual(
  actual:
    number,
  expected:
    number,
  message:
    string,
  epsilon =
    0.0000001,
): void {

  assert(
    Math.abs(
      actual -
      expected,
    ) <=
      epsilon,
    `${message} Expected ${expected}, received ${actual}.`,
  );

}

function assertThrows(
  operation:
    () => void,
  expectedMessageFragment:
    string,
  message:
    string,
): void {

  let thrown:
    unknown;

  try {

    operation();

  } catch (
    error
  ) {

    thrown =
      error;

  }

  assert(
    thrown instanceof Error,
    `${message} Expected an Error to be thrown.`,
  );

  if (
    !(thrown instanceof Error)
  ) {

    return;

  }

  assert(
    thrown.message.includes(
      expectedMessageFragment,
    ),
    `${message} Unexpected error message: ${thrown.message}`,
  );

}

// ============================================================
// FEATURE VALUE HELPERS
// ============================================================

function available<T>(
  value:
    T,
): CanonicalFeatureValue<T> {

  return {

    availability:
      CanonicalFeatureAvailability.AVAILABLE,

    value,

  };

}

function unavailable<T>(
  reason:
    string,
): CanonicalFeatureValue<T> {

  return {

    availability:
      CanonicalFeatureAvailability.UNAVAILABLE,

    reason,

  };

}

// ============================================================
// FIXTURE OPTIONS
// ============================================================

interface FixtureOptions {

  id:
    string;

  narrativeTraits?:
    CanonicalFeatureValue<
      readonly string[]
    >;

  confidence?:
    CanonicalFeatureValue<number>;

  durationMinutes?:
    CanonicalFeatureValue<number>;

  regime?:
    CanonicalFeatureValue<string>;

  infrastructureEntities?:
    CanonicalFeatureValue<
      readonly CanonicalInfrastructureEntityFeature[]
    >;

  topologyState?:
    CanonicalFeatureValue<
      CanonicalTopologyState
    >;

  geographyLocation?:
    CanonicalFeatureValue<
      CanonicalGeographicLocation
    >;

}

// ============================================================
// DEFAULT FIXTURE VALUES
// ============================================================

function createDefaultInfrastructure():
  readonly CanonicalInfrastructureEntityFeature[] {

  return [

    {

      knowledgeObjectId:
        "facility:default",

      facilityType:
        "radar_site",

    },

  ];

}

function createDefaultTopology():
  CanonicalTopologyState {

  return {

    contradictionDensity:
      0.20,

    residualInstability:
      0.40,

    entanglementScore:
      0.60,

    clusterFragmentation:
      0.30,

  };

}

function createDefaultGeography():
  CanonicalGeographicLocation {

  return {

    state:
      "oregon",

  };

}

// ============================================================
// CREATE FEATURE FIXTURE
// ============================================================
//
// These are already-extracted canonical feature sets.
//
// P56D-A is verifying the matrix operator, not re-verifying the
// Knowledge → Feature extraction boundary.
//
// ============================================================

function createFixture(
  options:
    FixtureOptions,
): CanonicalKnowledgeFeatureSet {

  return {

    knowledgeObjectId:
      options.id,

    narrative: {

      traits:
        options.narrativeTraits ??
        available([
          "structured_motion",
          "persistent_observation",
        ]),

    },

    observability: {

      confidence:
        options.confidence ??
        available(
          0.80,
        ),

      durationMinutes:
        options.durationMinutes ??
        available(
          10,
        ),

      regime:
        options.regime ??
        available(
          "multi_sensor",
        ),

    },

    infrastructure: {

      entities:
        options.infrastructureEntities ??
        available(
          createDefaultInfrastructure(),
        ),

    },

    topology: {

      state:
        options.topologyState ??
        available(
          createDefaultTopology(),
        ),

    },

    geography: {

      location:
        options.geographyLocation ??
        available(
          createDefaultGeography(),
        ),

    },

  };

}

// ============================================================
// MATRIX SERIALIZATION
// ============================================================
//
// JSON serialization is sufficient here because the matrix
// operator itself establishes deterministic property population
// and canonical pair ordering.
//
// This verifier uses serialization only to compare complete
// deterministic products produced by equivalent inputs.
//
// ============================================================

function serializeMatrix(
  matrix:
    CanonicalKnowledgeSimilarityMatrix,
): string {

  return JSON.stringify(
    matrix,
  );

}

// ============================================================
// PAIR IDENTITY
// ============================================================

function pairIdentity(
  pair:
    CanonicalKnowledgeSimilarityPair,
): string {

  return (
    `${pair.leftKnowledgeObjectId}` +
    "->" +
    `${pair.rightKnowledgeObjectId}`
  );

}

// ============================================================
// TEST 1
// ZERO-MEMBER POPULATION
// ============================================================

function verifyEmptyPopulation(): void {

  const matrix =
    computeCanonicalKnowledgeSimilarityMatrix(
      [],
    );

  assertEqual(
    matrix.featureSetCount,
    0,
    "Empty population must report zero feature sets.",
  );

  assertEqual(
    matrix.pairCount,
    0,
    "Empty population must report zero pairs.",
  );

  assertEqual(
    matrix.pairs.length,
    0,
    "Empty population must contain no pair resolutions.",
  );

  assertEqual(
    computeCanonicalSimilarityPairCount(
      0,
    ),
    0,
    "P(0) must equal zero.",
  );

  console.log(
    "PASS — empty canonical feature population produces zero pairs",
  );

}

// ============================================================
// TEST 2
// SINGLE-MEMBER POPULATION
// ============================================================

function verifySingleMemberPopulation(): void {

  const feature =
    createFixture({
      id:
        "event:alpha",
    });

  const matrix =
    computeCanonicalKnowledgeSimilarityMatrix([
      feature,
    ]);

  assertEqual(
    matrix.featureSetCount,
    1,
    "Single-member population must report one feature set.",
  );

  assertEqual(
    matrix.pairCount,
    0,
    "Single-member population must report zero pairs.",
  );

  assertEqual(
    matrix.pairs.length,
    0,
    "Single-member population must contain no pair resolutions.",
  );

  assertEqual(
    computeCanonicalSimilarityPairCount(
      1,
    ),
    0,
    "P(1) must equal zero.",
  );

  console.log(
    "PASS — single canonical feature produces zero pairs",
  );

}

// ============================================================
// TEST 3
// PAIR COUNT MATHEMATICS
// ============================================================

function verifyPairCountMathematics(): void {

  const expected: readonly [
    number,
    number,
  ][] = [

    [0, 0],
    [1, 0],
    [2, 1],
    [3, 3],
    [4, 6],
    [5, 10],
    [10, 45],
    [100, 4950],

  ];

  for (
    const [
      featureSetCount,
      pairCount,
    ]
    of expected
  ) {

    assertEqual(
      computeCanonicalSimilarityPairCount(
        featureSetCount,
      ),
      pairCount,
      `Pair-count equation failed for n=${featureSetCount}.`,
    );

  }

  console.log(
    "PASS — pair count obeys n(n - 1) / 2",
  );

}

// ============================================================
// TEST 4
// THREE-MEMBER CANONICAL PAIR POPULATION
// ============================================================

function verifyThreeMemberPairPopulation(): void {

  const alpha =
    createFixture({
      id:
        "event:alpha",
    });

  const beta =
    createFixture({
      id:
        "event:beta",
    });

  const gamma =
    createFixture({
      id:
        "event:gamma",
    });

  // Deliberately unsorted input.

  const matrix =
    computeCanonicalKnowledgeSimilarityMatrix([
      gamma,
      alpha,
      beta,
    ]);

  assertEqual(
    matrix.featureSetCount,
    3,
    "Three-member population must report three feature sets.",
  );

  assertEqual(
    matrix.pairCount,
    3,
    "Three members must produce exactly three unique pairs.",
  );

  const identities =
    matrix.pairs.map(
      pairIdentity,
    );

  const expected = [

    "event:alpha->event:beta",
    "event:alpha->event:gamma",
    "event:beta->event:gamma",

  ];

  assertEqual(
    JSON.stringify(
      identities,
    ),
    JSON.stringify(
      expected,
    ),
    "Three-member pair population must use canonical identity ordering.",
  );

  console.log(
    "PASS — three members produce the three canonical unique pairs",
  );

}

// ============================================================
// TEST 5
// NO SELF-PAIRS
// ============================================================

function verifyNoSelfPairs(): void {

  const matrix =
    computeCanonicalKnowledgeSimilarityMatrix([

      createFixture({
        id:
          "event:alpha",
      }),

      createFixture({
        id:
          "event:beta",
      }),

      createFixture({
        id:
          "event:gamma",
      }),

      createFixture({
        id:
          "event:delta",
      }),

    ]);

  for (
    const pair
    of matrix.pairs
  ) {

    assert(
      pair.leftKnowledgeObjectId !==
        pair.rightKnowledgeObjectId,
      `Self-pair encountered for ${pair.leftKnowledgeObjectId}.`,
    );

  }

  console.log(
    "PASS — canonical matrix contains no self-pairs",
  );

}

// ============================================================
// TEST 6
// STRICT LEXICAL PAIR ORIENTATION
// ============================================================

function verifyLexicalPairOrientation(): void {

  const matrix =
    computeCanonicalKnowledgeSimilarityMatrix([

      createFixture({
        id:
          "event:zulu",
      }),

      createFixture({
        id:
          "event:alpha",
      }),

      createFixture({
        id:
          "event:mike",
      }),

      createFixture({
        id:
          "event:bravo",
      }),

    ]);

  for (
    const pair
    of matrix.pairs
  ) {

    assert(
      pair.leftKnowledgeObjectId <
        pair.rightKnowledgeObjectId,
      `Pair orientation must be lexical: ${pairIdentity(pair)}.`,
    );

  }

  console.log(
    "PASS — every canonical pair has strict lexical orientation",
  );

}

// ============================================================
// TEST 7
// NO REVERSE DUPLICATES
// ============================================================

function verifyNoReverseDuplicates(): void {

  const matrix =
    computeCanonicalKnowledgeSimilarityMatrix([

      createFixture({
        id:
          "event:alpha",
      }),

      createFixture({
        id:
          "event:beta",
      }),

      createFixture({
        id:
          "event:gamma",
      }),

      createFixture({
        id:
          "event:delta",
      }),

      createFixture({
        id:
          "event:epsilon",
      }),

    ]);

  const identities =
    new Set<string>();

  for (
    const pair
    of matrix.pairs
  ) {

    const forward =
      pairIdentity(
        pair,
      );

    const reverse =
      `${pair.rightKnowledgeObjectId}` +
      "->" +
      `${pair.leftKnowledgeObjectId}`;

    assert(
      !identities.has(
        forward,
      ),
      `Duplicate canonical pair encountered: ${forward}.`,
    );

    assert(
      !identities.has(
        reverse,
      ),
      `Reverse duplicate canonical pair encountered: ${forward}.`,
    );

    identities.add(
      forward,
    );

  }

  assertEqual(
    identities.size,
    matrix.pairCount,
    "Every matrix pair must possess one unique canonical identity.",
  );

  console.log(
    "PASS — canonical matrix contains no duplicate or reverse pairs",
  );

}

// ============================================================
// TEST 8
// INPUT ORDER INVARIANCE
// ============================================================

function verifyInputOrderInvariance(): void {

  const alpha =
    createFixture({
      id:
        "event:alpha",

      narrativeTraits:
        available([
          "alpha",
          "shared",
        ]),
    });

  const beta =
    createFixture({
      id:
        "event:beta",

      narrativeTraits:
        available([
          "beta",
          "shared",
        ]),
    });

  const gamma =
    createFixture({
      id:
        "event:gamma",

      narrativeTraits:
        available([
          "gamma",
          "shared",
        ]),
    });

  const delta =
    createFixture({
      id:
        "event:delta",

      narrativeTraits:
        available([
          "delta",
          "shared",
        ]),
    });

  const first =
    computeCanonicalKnowledgeSimilarityMatrix([
      alpha,
      beta,
      gamma,
      delta,
    ]);

  const second =
    computeCanonicalKnowledgeSimilarityMatrix([
      delta,
      beta,
      alpha,
      gamma,
    ]);

  const third =
    computeCanonicalKnowledgeSimilarityMatrix([
      gamma,
      alpha,
      delta,
      beta,
    ]);

  assertEqual(
    serializeMatrix(
      first,
    ),
    serializeMatrix(
      second,
    ),
    "Input collection ordering must not alter matrix output.",
  );

  assertEqual(
    serializeMatrix(
      first,
    ),
    serializeMatrix(
      third,
    ),
    "Alternate input collection ordering must not alter matrix output.",
  );

  console.log(
    "PASS — input ordering does not alter canonical matrix output",
  );

}

// ============================================================
// TEST 9
// REPEATED COMPUTATION DETERMINISM
// ============================================================

function verifyRepeatedComputation(): void {

  const features = [

    createFixture({
      id:
        "event:alpha",
    }),

    createFixture({
      id:
        "event:beta",
    }),

    createFixture({
      id:
        "event:gamma",
    }),

  ];

  const first =
    computeCanonicalKnowledgeSimilarityMatrix(
      features,
    );

  const second =
    computeCanonicalKnowledgeSimilarityMatrix(
      features,
    );

  assertEqual(
    serializeMatrix(
      first,
    ),
    serializeMatrix(
      second,
    ),
    "Repeated matrix computation must produce identical output.",
  );

  console.log(
    "PASS — repeated canonical matrix computation is deterministic",
  );

}

// ============================================================
// TEST 10
// CALLER COLLECTION IS NOT MUTATED
// ============================================================

function verifyInputCollectionNotMutated(): void {

  const gamma =
    createFixture({
      id:
        "event:gamma",
    });

  const alpha =
    createFixture({
      id:
        "event:alpha",
    });

  const beta =
    createFixture({
      id:
        "event:beta",
    });

  const input = [
    gamma,
    alpha,
    beta,
  ];

  const before =
    input.map(
      feature =>
        feature.knowledgeObjectId,
    );

  computeCanonicalKnowledgeSimilarityMatrix(
    input,
  );

  const after =
    input.map(
      feature =>
        feature.knowledgeObjectId,
    );

  assertEqual(
    JSON.stringify(
      after,
    ),
    JSON.stringify(
      before,
    ),
    "Matrix computation must not reorder the caller-owned feature collection.",
  );

  console.log(
    "PASS — matrix computation does not mutate caller collection order",
  );

}

// ============================================================
// TEST 11
// CANONICAL IDENTITY PRESERVATION
// ============================================================

function verifyIdentityPreservation(): void {

  const matrix =
    computeCanonicalKnowledgeSimilarityMatrix([

      createFixture({
        id:
          "event:identity-a",
      }),

      createFixture({
        id:
          "event:identity-b",
      }),

    ]);

  assertEqual(
    matrix.pairCount,
    1,
    "Two feature sets must produce exactly one pair.",
  );

  const pair =
    matrix.pairs[0];

  assertEqual(
    pair.leftKnowledgeObjectId,
    "event:identity-a",
    "Pair must preserve canonical left Knowledge identity.",
  );

  assertEqual(
    pair.rightKnowledgeObjectId,
    "event:identity-b",
    "Pair must preserve canonical right Knowledge identity.",
  );

  assertEqual(
    pair.resolution.sourceKnowledgeObjectId,
    pair.leftKnowledgeObjectId,
    "Similarity source identity must match canonical pair left identity.",
  );

  assertEqual(
    pair.resolution.targetKnowledgeObjectId,
    pair.rightKnowledgeObjectId,
    "Similarity target identity must match canonical pair right identity.",
  );

  console.log(
    "PASS — canonical Knowledge identities survive matrix resolution",
  );

}

// ============================================================
// TEST 12
// DUPLICATE IDENTITIES REJECTED
// ============================================================

function verifyDuplicateIdentityRejection(): void {

  const first =
    createFixture({
      id:
        "event:duplicate",
    });

  const second =
    createFixture({
      id:
        "event:duplicate",
    });

  assertThrows(
    () => {

      computeCanonicalKnowledgeSimilarityMatrix([
        first,
        second,
      ]);

    },
    "duplicate Knowledge Object identity",
    "Duplicate canonical identities must be rejected.",
  );

  console.log(
    "PASS — duplicate canonical Knowledge identities are rejected",
  );

}

// ============================================================
// TEST 13
// EMPTY IDENTITY REJECTED
// ============================================================

function verifyEmptyIdentityRejection(): void {

  const feature =
    createFixture({
      id:
        "   ",
    });

  assertThrows(
    () => {

      computeCanonicalKnowledgeSimilarityMatrix([
        feature,
      ]);

    },
    "non-empty knowledgeObjectId",
    "Empty canonical feature identity must be rejected.",
  );

  console.log(
    "PASS — empty canonical Knowledge identity is rejected",
  );

}

// ============================================================
// TEST 14
// PAIR COUNT VALIDATION
// ============================================================

function verifyPairCountInputValidation(): void {

  assertThrows(
    () => {

      computeCanonicalSimilarityPairCount(
        -1,
      );

    },
    "non-negative integer",
    "Negative feature-set counts must be rejected.",
  );

  assertThrows(
    () => {

      computeCanonicalSimilarityPairCount(
        1.5,
      );

    },
    "non-negative integer",
    "Fractional feature-set counts must be rejected.",
  );

  console.log(
    "PASS — pair-count operator rejects invalid population counts",
  );

}

// ============================================================
// TEST 15
// VERIFIED PAIRWISE SIMILARITY IS PRESERVED
// ============================================================
//
// Two otherwise identical feature sets with:
//
//   A narrative = [alpha, shared]
//   B narrative = [beta, shared]
//
// have:
//
//   intersection = {shared}       -> 1
//   union        = {alpha,beta,shared} -> 3
//
// Therefore:
//
//        J(A,B) = 1 / 3
//
// The matrix must preserve the existing P56C-D operator result;
// it must not introduce a second similarity implementation.
//
// ============================================================

function verifyPairwiseSimilarityPreservation(): void {

  const alpha =
    createFixture({

      id:
        "event:alpha",

      narrativeTraits:
        available([
          "alpha",
          "shared",
        ]),

    });

  const beta =
    createFixture({

      id:
        "event:beta",

      narrativeTraits:
        available([
          "beta",
          "shared",
        ]),

    });

  const matrix =
    computeCanonicalKnowledgeSimilarityMatrix([
      beta,
      alpha,
    ]);

  assertEqual(
    matrix.pairCount,
    1,
    "Two canonical features must produce one matrix pair.",
  );

  const pair =
    matrix.pairs[0];

  const narrative =
    pair.resolution
      .dimensions
      .narrative;

  assert(
    narrative.availability ===
      CanonicalSimilarityAvailability.AVAILABLE,
    "Narrative similarity must remain available.",
  );

  if (
    narrative.availability !==
    CanonicalSimilarityAvailability.AVAILABLE
  ) {

    return;

  }

  assertApproximatelyEqual(
    narrative.similarity,
    1 /
      3,
    "Matrix must preserve P56C-D Jaccard mathematics.",
  );

  // ----------------------------------------------------------
  // Aggregate expectation
  //
  // Narrative weight = 0.30 and narrative score = 1/3.
  //
  // All other fixture dimensions are identical and therefore
  // score 1.
  //
  // Aggregate:
  //
  //   (0.30 * 1/3) +
  //   (0.20 * 1)   +
  //   (0.15 * 1)   +
  //   (0.25 * 1)   +
  //   (0.10 * 1)
  //
  // = 0.80
  //
  // ----------------------------------------------------------

  const aggregate =
    pair.resolution.aggregate;

  assert(
    aggregate.availability ===
      CanonicalSimilarityAvailability.AVAILABLE,
    "Aggregate similarity must remain available.",
  );

  if (
    aggregate.availability !==
    CanonicalSimilarityAvailability.AVAILABLE
  ) {

    return;

  }

  assertApproximatelyEqual(
    aggregate.score,
    0.80,
    "Matrix must preserve the existing weighted aggregate similarity.",
  );

  assertApproximatelyEqual(
    aggregate.participatingWeight,
    1,
    "All five mutually comparable dimensions must participate.",
  );

  console.log(
    "PASS — matrix preserves verified P56C-D pairwise similarity mathematics",
  );

}

// ============================================================
// TEST 16
// UNAVAILABLE REMAINS UNAVAILABLE
// ============================================================
//
// This is the semantic invariant that must survive the lifting
// from one pair to an entire universe:
//
//          UNAVAILABLE != 0
//
// Geography is deliberately unavailable on one side.
//
// The matrix must preserve:
//
//   geography similarity = UNAVAILABLE
//
// while allowing the remaining four dimensions to participate
// in the aggregate.
//
// Geography canonical weight = 0.10.
//
// Therefore participating weight = 0.90.
//
// Since the other four dimensions are identical:
//
// aggregate similarity = 1.
//
// ============================================================

function verifyUnavailableSemanticsPreserved(): void {

  const alpha =
    createFixture({

      id:
        "event:alpha",

      geographyLocation:
        unavailable(
          "Canonical geography unavailable for verification.",
        ),

    });

  const beta =
    createFixture({

      id:
        "event:beta",

    });

  const matrix =
    computeCanonicalKnowledgeSimilarityMatrix([
      alpha,
      beta,
    ]);

  const pair =
    matrix.pairs[0];

  const geography =
    pair.resolution
      .dimensions
      .geography;

  assertEqual(
    geography.dimension,
    CanonicalFeatureDimension.GEOGRAPHY,
    "Unavailable dimension must remain canonical Geography.",
  );

  assert(
    geography.availability ===
      CanonicalSimilarityAvailability.UNAVAILABLE,
    "Unavailable geography must remain unavailable inside the matrix.",
  );

  const aggregate =
    pair.resolution.aggregate;

  assert(
    aggregate.availability ===
      CanonicalSimilarityAvailability.AVAILABLE,
    "Remaining comparable dimensions must still produce an aggregate.",
  );

  if (
    aggregate.availability !==
    CanonicalSimilarityAvailability.AVAILABLE
  ) {

    return;

  }

  assertApproximatelyEqual(
    aggregate.participatingWeight,
    0.90,
    "Unavailable geography must remove only its 0.10 weight.",
  );

  assertApproximatelyEqual(
    aggregate.score,
    1,
    "Remaining identical dimensions must renormalize to similarity 1.",
  );

  assert(
    !aggregate
      .participatingDimensions
      .includes(
        CanonicalFeatureDimension.GEOGRAPHY,
      ),
    "Unavailable geography must not participate in aggregate similarity.",
  );

  console.log(
    "PASS — UNAVAILABLE remains distinct from zero in matrix computation",
  );

}

// ============================================================
// TEST 17
// HETEROGENEOUS OBSERVATION REGIME
// ============================================================
//
// P56C-D established:
//
//   same regime      -> comparable
//   different regime -> unavailable observability measurement
//
// The matrix must preserve that gate.
//
// ============================================================

function verifyObservabilityComparabilityPreserved(): void {

  const alpha =
    createFixture({

      id:
        "event:alpha",

      regime:
        available(
          "multi_sensor",
        ),

    });

  const beta =
    createFixture({

      id:
        "event:beta",

      regime:
        available(
          "historical_narrative",
        ),

    });

  const matrix =
    computeCanonicalKnowledgeSimilarityMatrix([
      alpha,
      beta,
    ]);

  const pair =
    matrix.pairs[0];

  const observability =
    pair.resolution
      .dimensions
      .observability;

  assert(
    observability.availability ===
      CanonicalSimilarityAvailability.UNAVAILABLE,
    "Heterogeneous observation regimes must remain unavailable in matrix computation.",
  );

  const aggregate =
    pair.resolution.aggregate;

  assert(
    aggregate.availability ===
      CanonicalSimilarityAvailability.AVAILABLE,
    "Other comparable dimensions must survive heterogeneous observability.",
  );

  if (
    aggregate.availability !==
    CanonicalSimilarityAvailability.AVAILABLE
  ) {

    return;

  }

  assertApproximatelyEqual(
    aggregate.participatingWeight,
    0.80,
    "Heterogeneous observability must remove its 0.20 weight.",
  );

  assertApproximatelyEqual(
    aggregate.score,
    1,
    "Remaining identical dimensions must renormalize to similarity 1.",
  );

  console.log(
    "PASS — matrix preserves P56C-D observability comparability gate",
  );

}

// ============================================================
// TEST 18
// MATRIX ORDER IS IDENTITY-BASED, NOT SCORE-BASED
// ============================================================
//
// Canonical matrix ordering must describe stable pair identity.
//
// It must NOT reorder pairs merely because similarity scores
// change.
//
// For:
//
//   alpha
//   beta
//   gamma
//
// canonical order remains:
//
//   alpha -> beta
//   alpha -> gamma
//   beta  -> gamma
//
// regardless of pair similarity.
//
// ============================================================

function verifyPairOrderingIndependentOfScore(): void {

  const alpha =
    createFixture({

      id:
        "event:alpha",

      narrativeTraits:
        available([
          "one",
        ]),

    });

  const beta =
    createFixture({

      id:
        "event:beta",

      narrativeTraits:
        available([
          "completely-different",
        ]),

    });

  const gamma =
    createFixture({

      id:
        "event:gamma",

      narrativeTraits:
        available([
          "one",
        ]),

    });

  const matrix =
    computeCanonicalKnowledgeSimilarityMatrix([
      gamma,
      beta,
      alpha,
    ]);

  const identities =
    matrix.pairs.map(
      pairIdentity,
    );

  const expected = [

    "event:alpha->event:beta",
    "event:alpha->event:gamma",
    "event:beta->event:gamma",

  ];

  assertEqual(
    JSON.stringify(
      identities,
    ),
    JSON.stringify(
      expected,
    ),
    "Canonical pair order must derive from identity rather than similarity score.",
  );

  const alphaBeta =
    matrix.pairs[0];

  const alphaGamma =
    matrix.pairs[1];

  assert(
    alphaBeta.resolution.aggregate.availability ===
      CanonicalSimilarityAvailability.AVAILABLE,
    "Alpha/Beta aggregate must be available.",
  );

  assert(
    alphaGamma.resolution.aggregate.availability ===
      CanonicalSimilarityAvailability.AVAILABLE,
    "Alpha/Gamma aggregate must be available.",
  );

  if (
    alphaBeta.resolution.aggregate.availability !==
      CanonicalSimilarityAvailability.AVAILABLE ||
    alphaGamma.resolution.aggregate.availability !==
      CanonicalSimilarityAvailability.AVAILABLE
  ) {

    return;

  }

  assert(
    alphaGamma.resolution.aggregate.score >
      alphaBeta.resolution.aggregate.score,
    "Fixture must establish that later alpha/gamma pair has higher similarity than alpha/beta.",
  );

  // Despite alpha/gamma having the higher score, alpha/beta
  // remains first because canonical matrix order is identity
  // order rather than ranking order.

  assertEqual(
    pairIdentity(
      matrix.pairs[0],
    ),
    "event:alpha->event:beta",
    "Lower-scoring canonical pair must not move because of ranking.",
  );

  assertEqual(
    pairIdentity(
      matrix.pairs[1],
    ),
    "event:alpha->event:gamma",
    "Higher-scoring canonical pair must retain canonical identity position.",
  );

  console.log(
    "PASS — canonical matrix pair ordering is identity-based, not score-based",
  );

}

// ============================================================
// TEST 19
// SIX-MEMBER COMPLETE PAIR POPULATION
// ============================================================
//
// A slightly larger population verifies that nested traversal
// actually realizes the complete strict upper triangle.
//
// n = 6
//
//       6(5)
// P = ------- = 15
//         2
//
// ============================================================

function verifySixMemberCompletePopulation(): void {

  const ids = [

    "event:foxtrot",
    "event:charlie",
    "event:alpha",
    "event:echo",
    "event:bravo",
    "event:delta",

  ];

  const features =
    ids.map(
      id =>
        createFixture({
          id,
        }),
    );

  const matrix =
    computeCanonicalKnowledgeSimilarityMatrix(
      features,
    );

  assertEqual(
    matrix.featureSetCount,
    6,
    "Six-member matrix must report six feature sets.",
  );

  assertEqual(
    matrix.pairCount,
    15,
    "Six members must produce fifteen unique pairs.",
  );

  assertEqual(
    matrix.pairs.length,
    computeCanonicalSimilarityPairCount(
      6,
    ),
    "Six-member matrix population must equal pair-count equation.",
  );

  const expected = [

    "event:alpha->event:bravo",
    "event:alpha->event:charlie",
    "event:alpha->event:delta",
    "event:alpha->event:echo",
    "event:alpha->event:foxtrot",

    "event:bravo->event:charlie",
    "event:bravo->event:delta",
    "event:bravo->event:echo",
    "event:bravo->event:foxtrot",

    "event:charlie->event:delta",
    "event:charlie->event:echo",
    "event:charlie->event:foxtrot",

    "event:delta->event:echo",
    "event:delta->event:foxtrot",

    "event:echo->event:foxtrot",

  ];

  const actual =
    matrix.pairs.map(
      pairIdentity,
    );

  assertEqual(
    JSON.stringify(
      actual,
    ),
    JSON.stringify(
      expected,
    ),
    "Six-member matrix must realize the complete canonical strict upper triangle.",
  );

  console.log(
    "PASS — six members realize complete 15-pair canonical upper triangle",
  );

}

// ============================================================
// MAIN
// ============================================================

function main(): void {

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "P56D-A — CANONICAL KNOWLEDGE SIMILARITY MATRIX VERIFICATION",
  );
  console.log(
    "============================================================",
  );
  console.log("");

  verifyEmptyPopulation();

  verifySingleMemberPopulation();

  verifyPairCountMathematics();

  verifyThreeMemberPairPopulation();

  verifyNoSelfPairs();

  verifyLexicalPairOrientation();

  verifyNoReverseDuplicates();

  verifyInputOrderInvariance();

  verifyRepeatedComputation();

  verifyInputCollectionNotMutated();

  verifyIdentityPreservation();

  verifyDuplicateIdentityRejection();

  verifyEmptyIdentityRejection();

  verifyPairCountInputValidation();

  verifyPairwiseSimilarityPreservation();

  verifyUnavailableSemanticsPreserved();

  verifyObservabilityComparabilityPreserved();

  verifyPairOrderingIndependentOfScore();

  verifySixMemberCompletePopulation();

  // ==========================================================
  // SUMMARY
  // ==========================================================

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "P56D-A VERIFICATION PASSED",
  );
  console.log(
    "============================================================",
  );
  console.log("");
  console.log(
    "Verified:",
  );
  console.log(
    "  {F_1 ... F_n} -> unique canonical S_ij population",
  );
  console.log(
    "  P(n) = n(n - 1) / 2",
  );
  console.log(
    "  zero-member population -> zero pairs",
  );
  console.log(
    "  one-member population -> zero pairs",
  );
  console.log(
    "  no self-pairs",
  );
  console.log(
    "  no reverse duplicate pairs",
  );
  console.log(
    "  strict lexical pair orientation",
  );
  console.log(
    "  canonical identity-based pair ordering",
  );
  console.log(
    "  input-order invariance",
  );
  console.log(
    "  repeated computation determinism",
  );
  console.log(
    "  caller collection remains unmodified",
  );
  console.log(
    "  canonical Knowledge identity preservation",
  );
  console.log(
    "  duplicate identity rejection",
  );
  console.log(
    "  empty identity rejection",
  );
  console.log(
    "  P56C-D pairwise similarity mathematics preserved",
  );
  console.log(
    "  UNAVAILABLE != zero preserved",
  );
  console.log(
    "  observability comparability gate preserved",
  );
  console.log(
    "  score does not determine canonical pair order",
  );
  console.log(
    "  complete strict upper-triangle realization",
  );
  console.log("");

}

main();