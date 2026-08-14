// ============================================================
// tools/verification/VerifyCanonicalSimilarityCandidateGeneration.ts
//
// P56D-C
// CANONICAL SIMILARITY CANDIDATE GENERATION VERIFICATION
//
// PURPOSE
//
// Verify the deterministic computational boundary:
//
//     Canonical Knowledge
//            ↓
//     Canonical EVENT Features
//            ↓
//     Canonical Similarity Matrix
//            ↓
//     Canonical Similarity Candidates
//
// Candidate generation means only:
//
//   AVAILABLE aggregate similarity
//                ↓
//   eligible downstream candidate
//
// It does NOT mean:
//
//   • canonical relationship
//   • topology edge
//   • same phenomenon
//   • causal relationship
//   • accepted proposition
//
// No threshold.
// No ranking.
// No graph mutation.
// No Knowledge mutation.
// No AI.
// No clocks.
// No randomness.
//
// ============================================================

import {
  KnowledgeObjectType,
} from "../../src/knowledge/model/KnowledgeObjectTypes";

import type {
  KnowledgeObject,
} from "../../src/knowledge/model/KnowledgeObject";

import {
  extractCanonicalEventFeatureSets,
} from "../../src/resolve/features/CanonicalKnowledgeFeatureExtractor";

import {
  computeCanonicalKnowledgeSimilarityMatrix,
} from "../../src/resolve/similarity/CanonicalKnowledgeSimilarityMatrix";

import {
  CanonicalSimilarityAvailability,
} from "../../src/resolve/similarity/CanonicalKnowledgeSimilarityTypes";

import type {
  CanonicalKnowledgeSimilarityResolution,
} from "../../src/resolve/similarity/CanonicalKnowledgeSimilarityTypes";

import type {
  CanonicalKnowledgeSimilarityMatrix,
  CanonicalKnowledgeSimilarityPair,
} from "../../src/resolve/similarity/CanonicalKnowledgeSimilarityMatrixTypes";

import {
  createCanonicalSimilarityCandidateId,
  generateCanonicalSimilarityCandidates,
} from "../../src/resolve/candidates/CanonicalSimilarityCandidateGenerator";

// ============================================================
// ASSERTIONS
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
  actual: T,
  expected: T,
  message: string,
): void {

  assert(
    actual === expected,
    `${message} Expected ${String(expected)}, received ${String(actual)}.`,
  );

}

function assertThrows(
  operation: () => void,
  message: string,
): void {

  let threw = false;

  try {

    operation();

  } catch {

    threw = true;

  }

  assert(
    threw,
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

// ============================================================
// CANONICAL EVENT PAYLOAD
// ============================================================
//
// These fixtures intentionally enter through KnowledgeObject.
//
// Candidate verification therefore exercises:
//
//     KnowledgeObject
//          ↓
//     feature extraction
//          ↓
//     similarity
//          ↓
//     candidate generation
//
// rather than constructing feature sets directly.
//
// ============================================================

function createCanonicalEventPayload(
  eventName: string,
  narrativeTraits:
    readonly string[],
): Record<string, unknown> {

  return {

    source:
      "SYSTEM_CANON",

    canonicalEvent: {

      core_event: {

        event_name:
          eventName,

        classification:
          "verification_event",

        year:
          2004,

        location: {

          state:
            "oregon",

        },

        observability_profile: {

          regime:
            "multi_sensor",

          confidence:
            0.80,

          duration_minutes:
            10,

        },

      },

      narrative_traits:
        [...narrativeTraits],

      infrastructure:
        [],

      topology_state: {

        contradictionDensity:
          0.20,

        residualInstability:
          0.40,

        entanglementScore:
          0.60,

        clusterFragmentation:
          0.30,

      },

    },

  };

}

// ============================================================
// CREATE EVENT KNOWLEDGE OBJECT
// ============================================================

function createEventKnowledgeObject(
  id: string,
  eventName: string,
  narrativeTraits:
    readonly string[],
): KnowledgeObject {

  return {

    identity: {

      id,

      version:
        1,

    },

    type:
      KnowledgeObjectType.EVENT,

    metadata: {

      title:
        eventName,

      createdAt:
        "2026-08-14T00:00:00.000Z",

      updatedAt:
        "2026-08-14T00:00:00.000Z",

      source:
        "SYSTEM_CANON",

      confidence:
        0.80,

      tags:
        [],

    },

    payload:
      createCanonicalEventPayload(
        eventName,
        narrativeTraits,
      ),

    relationships:
      [],

  };

}

// ============================================================
// REAL PIPELINE FIXTURE
// ============================================================

function createThreeEventUniverse():
readonly KnowledgeObject[] {

  return [

    createEventKnowledgeObject(
      "knowledge:event:alpha",
      "Alpha Verification Event",
      [
        "structured_motion",
        "persistent_observation",
      ],
    ),

    createEventKnowledgeObject(
      "knowledge:event:bravo",
      "Bravo Verification Event",
      [
        "structured_motion",
        "persistent_observation",
      ],
    ),

    createEventKnowledgeObject(
      "knowledge:event:charlie",
      "Charlie Verification Event",
      [
        "structured_motion",
        "persistent_observation",
      ],
    ),

  ];

}

// ============================================================
// COMPUTE REAL MATRIX
// ============================================================

function computeRealMatrix(
  knowledgeObjects:
    readonly KnowledgeObject[],
): CanonicalKnowledgeSimilarityMatrix {

  const featureSets =
    extractCanonicalEventFeatureSets(
      knowledgeObjects,
    );

  return computeCanonicalKnowledgeSimilarityMatrix(
    featureSets,
  );

}

// ============================================================
// CONTROLLED RESOLUTION FIXTURE
// ============================================================
//
// Used only for candidate-boundary edge cases.
//
// Similarity mathematics itself is NOT under test here.
//
// ============================================================

function createAvailableResolution(
  sourceKnowledgeObjectId: string,
  targetKnowledgeObjectId: string,
  score: number,
): CanonicalKnowledgeSimilarityResolution {

  return {

    sourceKnowledgeObjectId,
    targetKnowledgeObjectId,

    aggregate: {

      availability:
        CanonicalSimilarityAvailability.AVAILABLE,

      score,

      participatingWeight:
        0,

      participatingDimensions:
        [],

    },

    dimensions: {

      narrative: {

        availability:
          CanonicalSimilarityAvailability.UNAVAILABLE,

        dimension:
          "NARRATIVE",

        reason:
          "Controlled verification fixture.",

      },

      observability: {

        availability:
          CanonicalSimilarityAvailability.UNAVAILABLE,

        dimension:
          "OBSERVABILITY",

        reason:
          "Controlled verification fixture.",

      },

      infrastructure: {

        availability:
          CanonicalSimilarityAvailability.UNAVAILABLE,

        dimension:
          "INFRASTRUCTURE",

        reason:
          "Controlled verification fixture.",

      },

      topology: {

        availability:
          CanonicalSimilarityAvailability.UNAVAILABLE,

        dimension:
          "TOPOLOGY",

        reason:
          "Controlled verification fixture.",

      },

      geography: {

        availability:
          CanonicalSimilarityAvailability.UNAVAILABLE,

        dimension:
          "GEOGRAPHY",

        reason:
          "Controlled verification fixture.",

      },

    },

    rationale:
      [],

  };

}

function createUnavailableResolution(
  sourceKnowledgeObjectId: string,
  targetKnowledgeObjectId: string,
): CanonicalKnowledgeSimilarityResolution {

  return {

    ...createAvailableResolution(
      sourceKnowledgeObjectId,
      targetKnowledgeObjectId,
      0,
    ),

    aggregate: {

      availability:
        CanonicalSimilarityAvailability.UNAVAILABLE,

      reason:
        "Controlled verification unavailable aggregate.",

    },

  };

}

// ============================================================
// CONTROLLED MATRIX
// ============================================================

function createControlledMatrix(
  pairs:
    readonly CanonicalKnowledgeSimilarityPair[],
): CanonicalKnowledgeSimilarityMatrix {

  return {

    featureSetCount:
      pairs.length > 0
        ? pairs.length + 1
        : 0,

    pairCount:
      pairs.length,

    pairs,

  };

}

// ============================================================
// PASS 1
// ============================================================

function verifyAvailablePairsProduceCandidates(): void {

  const matrix =
    computeRealMatrix(
      createThreeEventUniverse(),
    );

  const result =
    generateCanonicalSimilarityCandidates(
      matrix,
    );

  const availablePairCount =
    matrix.pairs.filter(
      (pair) =>
        pair.resolution.aggregate.availability ===
        CanonicalSimilarityAvailability.AVAILABLE,
    ).length;

  assertEqual(
    result.sourcePairCount,
    matrix.pairCount,
    "Candidate collection must report the complete source pair population.",
  );

  assertEqual(
    result.candidateCount,
    availablePairCount,
    "Every AVAILABLE canonical similarity pair must produce exactly one candidate.",
  );

  assertEqual(
    result.candidates.length,
    availablePairCount,
    "Candidate population length must equal AVAILABLE pair population.",
  );

}

// ============================================================
// PASS 2
// ============================================================

function verifyCandidateIdentity(): void {

  const matrix =
    computeRealMatrix(
      createThreeEventUniverse(),
    );

  const result =
    generateCanonicalSimilarityCandidates(
      matrix,
    );

  for (
    const candidate of result.candidates
  ) {

    assertEqual(
      candidate.id,
      createCanonicalSimilarityCandidateId(
        candidate.leftKnowledgeObjectId,
        candidate.rightKnowledgeObjectId,
      ),
      "Candidate identity must derive exclusively from canonical pair identity.",
    );

  }

}

// ============================================================
// PASS 3
// ============================================================

function verifyResolutionPreservation(): void {

  const matrix =
    computeRealMatrix(
      createThreeEventUniverse(),
    );

  const result =
    generateCanonicalSimilarityCandidates(
      matrix,
    );

  for (
    const candidate of result.candidates
  ) {

    const sourcePair =
      matrix.pairs.find(
        (pair) =>
          pair.leftKnowledgeObjectId ===
            candidate.leftKnowledgeObjectId &&
          pair.rightKnowledgeObjectId ===
            candidate.rightKnowledgeObjectId,
      );

    assert(
      sourcePair !== undefined,
      "Candidate must resolve back to its source canonical similarity pair.",
    );

    assertEqual(
      canonicalJson(
        candidate.similarityResolution,
      ),
      canonicalJson(
        sourcePair.resolution,
      ),
      "Candidate must preserve the complete source similarity resolution.",
    );

  }

}

// ============================================================
// PASS 4
// ============================================================

function verifyCandidateOrdering(): void {

  const matrix =
    computeRealMatrix(
      createThreeEventUniverse(),
    );

  const result =
    generateCanonicalSimilarityCandidates(
      matrix,
    );

  const expectedIds =
    matrix.pairs
      .filter(
        (pair) =>
          pair.resolution.aggregate.availability ===
          CanonicalSimilarityAvailability.AVAILABLE,
      )
      .map(
        (pair) =>
          createCanonicalSimilarityCandidateId(
            pair.leftKnowledgeObjectId,
            pair.rightKnowledgeObjectId,
          ),
      );

  const actualIds =
    result.candidates.map(
      (candidate) =>
        candidate.id,
    );

  assertEqual(
    canonicalJson(actualIds),
    canonicalJson(expectedIds),
    "Candidate ordering must preserve canonical similarity pair ordering.",
  );

}

// ============================================================
// PASS 5
// ============================================================

function verifyAvailableZeroIsCandidateEligible(): void {

  const pair:
    CanonicalKnowledgeSimilarityPair = {

      leftKnowledgeObjectId:
        "knowledge:event:a",

      rightKnowledgeObjectId:
        "knowledge:event:b",

      resolution:
        createAvailableResolution(
          "knowledge:event:a",
          "knowledge:event:b",
          0,
        ),

    };

  const result =
    generateCanonicalSimilarityCandidates(
      createControlledMatrix(
        [pair],
      ),
    );

  assertEqual(
    result.candidateCount,
    1,
    "AVAILABLE similarity score zero must remain candidate-eligible.",
  );

  assertEqual(
    result.candidates[0]
      ?.similarityResolution.aggregate.availability,
    CanonicalSimilarityAvailability.AVAILABLE,
    "Zero-score candidate must preserve AVAILABLE aggregate state.",
  );

}

// ============================================================
// PASS 6
// ============================================================

function verifyUnavailableProducesNoCandidate(): void {

  const pair:
    CanonicalKnowledgeSimilarityPair = {

      leftKnowledgeObjectId:
        "knowledge:event:a",

      rightKnowledgeObjectId:
        "knowledge:event:b",

      resolution:
        createUnavailableResolution(
          "knowledge:event:a",
          "knowledge:event:b",
        ),

    };

  const result =
    generateCanonicalSimilarityCandidates(
      createControlledMatrix(
        [pair],
      ),
    );

  assertEqual(
    result.sourcePairCount,
    1,
    "UNAVAILABLE source pair must still be counted as inspected.",
  );

  assertEqual(
    result.candidateCount,
    0,
    "UNAVAILABLE aggregate must not produce a candidate.",
  );

}

// ============================================================
// PASS 7
// ============================================================

function verifyRepeatedGenerationIsDeterministic(): void {

  const matrix =
    computeRealMatrix(
      createThreeEventUniverse(),
    );

  const first =
    generateCanonicalSimilarityCandidates(
      matrix,
    );

  const second =
    generateCanonicalSimilarityCandidates(
      matrix,
    );

  assertEqual(
    canonicalJson(first),
    canonicalJson(second),
    "Repeated candidate generation must be deterministic.",
  );

}

// ============================================================
// PASS 8
// ============================================================

function verifyReorderedUniverseIsInvariant(): void {

  const universe =
    createThreeEventUniverse();

  const reordered =
    [
      universe[2]!,
      universe[0]!,
      universe[1]!,
    ];

  const first =
    generateCanonicalSimilarityCandidates(
      computeRealMatrix(
        universe,
      ),
    );

  const second =
    generateCanonicalSimilarityCandidates(
      computeRealMatrix(
        reordered,
      ),
    );

  assertEqual(
    canonicalJson(first),
    canonicalJson(second),
    "Equivalent reordered Knowledge universes must produce identical candidate collections.",
  );

}

// ============================================================
// PASS 9
// ============================================================

function verifySelfPairRejected(): void {

  const pair:
    CanonicalKnowledgeSimilarityPair = {

      leftKnowledgeObjectId:
        "knowledge:event:a",

      rightKnowledgeObjectId:
        "knowledge:event:a",

      resolution:
        createAvailableResolution(
          "knowledge:event:a",
          "knowledge:event:a",
          0.50,
        ),

    };

  assertThrows(
    () =>
      generateCanonicalSimilarityCandidates(
        createControlledMatrix(
          [pair],
        ),
      ),
    "Candidate generator must reject malformed self-pairs.",
  );

}

// ============================================================
// PASS 10
// ============================================================

function verifyNoncanonicalOrderingRejected(): void {

  const pair:
    CanonicalKnowledgeSimilarityPair = {

      leftKnowledgeObjectId:
        "knowledge:event:z",

      rightKnowledgeObjectId:
        "knowledge:event:a",

      resolution:
        createAvailableResolution(
          "knowledge:event:z",
          "knowledge:event:a",
          0.50,
        ),

    };

  assertThrows(
    () =>
      generateCanonicalSimilarityCandidates(
        createControlledMatrix(
          [pair],
        ),
      ),
    "Candidate generator must reject noncanonical lexical pair ordering.",
  );

}

// ============================================================
// PASS 11
// ============================================================

function verifyMismatchedResolutionIdentityRejected(): void {

  const pair:
    CanonicalKnowledgeSimilarityPair = {

      leftKnowledgeObjectId:
        "knowledge:event:a",

      rightKnowledgeObjectId:
        "knowledge:event:b",

      resolution:
        createAvailableResolution(
          "knowledge:event:a",
          "knowledge:event:c",
          0.50,
        ),

    };

  assertThrows(
    () =>
      generateCanonicalSimilarityCandidates(
        createControlledMatrix(
          [pair],
        ),
      ),
    "Candidate generator must reject mismatched pair/resolution identities.",
  );

}

// ============================================================
// PASS 12
// ============================================================

function verifyNoThresholdFiltering(): void {

  const scores =
    [
      0,
      0.01,
      0.25,
      0.50,
      0.70,
      0.99,
      1,
    ];

  const pairs:
    CanonicalKnowledgeSimilarityPair[] =
      scores.map(
        (
          score,
          index,
        ) => {

          const left =
            `knowledge:event:${String(index).padStart(2, "0")}:a`;

          const right =
            `knowledge:event:${String(index).padStart(2, "0")}:b`;

          return {

            leftKnowledgeObjectId:
              left,

            rightKnowledgeObjectId:
              right,

            resolution:
              createAvailableResolution(
                left,
                right,
                score,
              ),

          };

        },
      );

  const result =
    generateCanonicalSimilarityCandidates(
      createControlledMatrix(
        pairs,
      ),
    );

  assertEqual(
    result.candidateCount,
    scores.length,
    "Every AVAILABLE score must survive candidate generation regardless of magnitude.",
  );

  const preservedScores =
    result.candidates.map(
      (candidate) => {

        const aggregate =
          candidate.similarityResolution.aggregate;

        assert(
          aggregate.availability ===
            CanonicalSimilarityAvailability.AVAILABLE,
          "Threshold verification candidate must preserve AVAILABLE state.",
        );

        return aggregate.score;

      },
    );

  assertEqual(
    canonicalJson(
      preservedScores,
    ),
    canonicalJson(
      scores,
    ),
    "Candidate generation must preserve low, zero, and high similarity measurements without threshold filtering.",
  );

}

// ============================================================
// VERIFICATION RUNNER
// ============================================================

function run(): void {

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "P56D-C — CANONICAL SIMILARITY CANDIDATE GENERATION VERIFICATION",
  );
  console.log(
    "============================================================",
  );
  console.log("");

  verifyAvailablePairsProduceCandidates();

  console.log(
    "PASS 1 — every AVAILABLE canonical similarity pair produces exactly one candidate",
  );

  verifyCandidateIdentity();

  console.log(
    "PASS 2 — candidate identity derives deterministically from canonical pair identity",
  );

  verifyResolutionPreservation();

  console.log(
    "PASS 3 — candidates preserve complete source similarity resolutions",
  );

  verifyCandidateOrdering();

  console.log(
    "PASS 4 — candidate ordering preserves canonical similarity pair ordering",
  );

  verifyAvailableZeroIsCandidateEligible();

  console.log(
    "PASS 5 — AVAILABLE similarity score zero remains candidate-eligible",
  );

  verifyUnavailableProducesNoCandidate();

  console.log(
    "PASS 6 — UNAVAILABLE aggregate similarity produces no candidate",
  );

  verifyRepeatedGenerationIsDeterministic();

  console.log(
    "PASS 7 — repeated candidate generation is deterministic",
  );

  verifyReorderedUniverseIsInvariant();

  console.log(
    "PASS 8 — reordered equivalent Knowledge universes produce identical candidates",
  );

  verifySelfPairRejected();

  console.log(
    "PASS 9 — malformed self-pairs are rejected",
  );

  verifyNoncanonicalOrderingRejected();

  console.log(
    "PASS 10 — malformed noncanonical pair ordering is rejected",
  );

  verifyMismatchedResolutionIdentityRejected();

  console.log(
    "PASS 11 — mismatched pair/resolution identities are rejected",
  );

  verifyNoThresholdFiltering();

  console.log(
    "PASS 12 — candidate generation performs no threshold-based filtering",
  );

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "P56D-C CANONICAL SIMILARITY CANDIDATE GENERATION VERIFIED",
  );
  console.log(
    "============================================================",
  );
  console.log("");
  console.log(
    "Verified:",
  );
  console.log(
    "  Canonical Knowledge -> EVENT feature extraction",
  );
  console.log(
    "  EVENT features -> canonical similarity matrix",
  );
  console.log(
    "  AVAILABLE similarity -> deterministic candidate",
  );
  console.log(
    "  UNAVAILABLE similarity -> no candidate",
  );
  console.log(
    "  AVAILABLE zero remains candidate-eligible",
  );
  console.log(
    "  candidate identity derives from canonical pair identity",
  );
  console.log(
    "  complete similarity resolution survives candidate derivation",
  );
  console.log(
    "  candidate ordering remains canonical rather than score-ranked",
  );
  console.log(
    "  Knowledge input-order invariance survives candidate generation",
  );
  console.log(
    "  repeated candidate generation is deterministic",
  );
  console.log(
    "  malformed pair identities fail loudly",
  );
  console.log(
    "  no numerical threshold participates in candidate generation",
  );
  console.log("");

}

run();

// ============================================================
// END
// ============================================================