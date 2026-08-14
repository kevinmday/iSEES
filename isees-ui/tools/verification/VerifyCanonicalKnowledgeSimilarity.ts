// ============================================================
// tools/verification/VerifyCanonicalKnowledgeSimilarity.ts
//
// P56C-D
// CANONICAL KNOWLEDGE SIMILARITY VERIFICATION
//
// Verifies the deterministic computational boundary:
//
//        (K, G0)
//           ↓
//           F
//           ↓
//      F_i + F_j
//           ↓
//          S_ij
//
// Primary invariants:
//
//   • similarity consumes canonical Knowledge features
//   • repeated comparison is deterministic
//   • target input ordering does not alter ranked output
//   • Jaccard behavior is preserved
//   • AVAILABLE([]) != UNAVAILABLE
//   • AVAILABLE zero similarity != UNAVAILABLE
//   • topology uses canonical T = (Dc, Ri, Es, Fc)
//   • geography preserves availability semantics
//   • unavailable dimensions do not become zero
//   • aggregate weights renormalize over participating dimensions
//   • feature availability is distinct from pairwise comparability
//   • heterogeneous observability regime does not become similarity zero
//   • completely unavailable comparison remains UNAVAILABLE
//   • ranking is deterministic
//   • lexical tie-breaking is deterministic
//
// No React.
// No runtime mutation.
// No persistence.
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
  CanonicalFeatureLineage,
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
  compareCanonicalKnowledgeFeatureCollection,
  compareCanonicalKnowledgeFeatures,
} from "../../src/resolve/similarity/CanonicalKnowledgeSimilarity";

// ============================================================
// ASSERTION
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

// ============================================================
// APPROXIMATE ASSERTION
// ============================================================

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

// ============================================================
// SERIALIZATION
// ============================================================

function serialize(
  value:
    unknown,
): string {

  return JSON.stringify(
    value,
  );

}

// ============================================================
// TEST LINEAGE
// ============================================================
//
// Verification fixtures require valid canonical feature
// lineage.
//
// The verifier does not test lineage extraction itself.
// P56C-A owns that boundary.
//
// ============================================================

const TEST_LINEAGE:
  CanonicalFeatureLineage = {

  source:
    "KNOWLEDGE_OBJECT",

  sourceKnowledgeObjectIds: [
    "verification:fixture",
  ],

  relationshipIds: [],

};

// ============================================================
// FEATURE FACTORIES
// ============================================================

function available<T>(
  value:
    T,
): CanonicalFeatureValue<T> {

  return {

    availability:
      CanonicalFeatureAvailability.AVAILABLE,

    value,

    lineage:
      TEST_LINEAGE,

  };

}

function unavailable<T>(
  reason =
    "Verification fixture intentionally unavailable.",
): CanonicalFeatureValue<T> {

  return {

    availability:
      CanonicalFeatureAvailability.UNAVAILABLE,

    reason,

  };

}

// ============================================================
// FIXTURE FACTORY
// ============================================================
//
// Defaults intentionally produce a completely comparable EVENT.
//
// Individual tests override only the feature state required for
// the invariant under examination.
//
// ============================================================

interface FixtureOptions {

  id:
    string;

  traits?:
    CanonicalFeatureValue<
      readonly string[]
    >;

  confidence?:
    CanonicalFeatureValue<number>;

   durationMinutes?:
    CanonicalFeatureValue<number>;

  regime?:
    CanonicalFeatureValue<string>;

 
  infrastructure?:
    CanonicalFeatureValue<
      readonly CanonicalInfrastructureEntityFeature[]
    >;

  topology?:
    CanonicalFeatureValue<
      CanonicalTopologyState
    >;

  geography?:
    CanonicalFeatureValue<
      CanonicalGeographicLocation
    >;

}

function createFixture(
  options:
    FixtureOptions,
): CanonicalKnowledgeFeatureSet {

  return {

    knowledgeObjectId:
      options.id,

    knowledgeObjectType:
      "EVENT",

    narrative: {

      traits:
        options.traits ??
        available([
          "radar",
          "visual",
          "aerial",
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
        options.infrastructure ??
        available([
          {
            knowledgeObjectId:
              "system:entity:test-radar",
            facilityType:
              "RADAR",
          },
        ]),

    },

    topology: {

      state:
        options.topology ??
        available({
          contradictionDensity:
            0.20,
          residualInstability:
            0.30,
          entanglementScore:
            0.40,
          clusterFragmentation:
            0.10,
        }),

    },

    geography: {

      location:
        options.geography ??
        available({
          knowledgeObjectId:
            "system:location:test-california",
          state:
            "CA",
          lat:
            32,
          lon:
            -117,
        }),

    },

  };

}

// ============================================================
// DIMENSION ACCESS
// ============================================================

function requireAvailableDimension(
  result:
    ReturnType<
      typeof compareCanonicalKnowledgeFeatures
    >,
  dimension:
    CanonicalFeatureDimension,
): number {

  const candidate =

    dimension ===
      CanonicalFeatureDimension.NARRATIVE
      ? result.dimensions.narrative

      : dimension ===
          CanonicalFeatureDimension.OBSERVABILITY
        ? result.dimensions.observability

        : dimension ===
            CanonicalFeatureDimension.INFRASTRUCTURE
          ? result.dimensions.infrastructure

          : dimension ===
              CanonicalFeatureDimension.TOPOLOGY
            ? result.dimensions.topology

            : result.dimensions.geography;

  assert(
    candidate.availability ===
      CanonicalSimilarityAvailability.AVAILABLE,
    `${dimension} must be AVAILABLE.`,
  );

  if (
    candidate.availability !==
    CanonicalSimilarityAvailability.AVAILABLE
  ) {

    throw new Error(
      `VERIFY FAILED: ${dimension} unexpectedly unavailable.`,
    );

  }

  return candidate.similarity;

}

// ============================================================
// TEST 1
// IDENTICAL FEATURE SETS
// ============================================================

function verifyIdenticalFeatures(): void {

  const source =
    createFixture({
      id:
        "event:source",
    });

  const target =
    createFixture({
      id:
        "event:target",
    });

  const result =
    compareCanonicalKnowledgeFeatures(
      source,
      target,
    );

  assert(
    result.aggregate.availability ===
      CanonicalSimilarityAvailability.AVAILABLE,
    "Identical feature sets must produce AVAILABLE aggregate similarity.",
  );

  if (
    result.aggregate.availability !==
    CanonicalSimilarityAvailability.AVAILABLE
  ) {

    return;

  }

  assertApproximatelyEqual(
    result.aggregate.score,
    1,
    "Identical feature sets must produce aggregate similarity 1.",
  );

  assert(
    result.aggregate.participatingDimensions.length ===
      5,
    "All five dimensions must participate for complete identical fixtures.",
  );

  console.log(
    "PASS — identical canonical features produce similarity 1",
  );

}

// ============================================================
// TEST 2
// REPEATED COMPARISON DETERMINISM
// ============================================================

function verifyRepeatedComparison(): void {

  const source =
    createFixture({
      id:
        "event:source",
    });

  const target =
    createFixture({
      id:
        "event:target",

      traits:
        available([
          "visual",
          "aerial",
          "ground",
        ]),

      confidence:
        available(
          0.60,
        ),

      durationMinutes:
        available(
          30,
        ),

    });

  const first =
    compareCanonicalKnowledgeFeatures(
      source,
      target,
    );

  const second =
    compareCanonicalKnowledgeFeatures(
      source,
      target,
    );

  assert(
    serialize(
      first,
    ) ===
      serialize(
        second,
      ),
    "Repeated canonical similarity comparison must be byte-equivalent under JSON serialization.",
  );

  console.log(
    "PASS — repeated comparison is deterministic",
  );

}

// ============================================================
// TEST 3
// JACCARD BEHAVIOR
// ============================================================
//
// A = { radar, visual, aerial }
//
// B = { visual, aerial, ground }
//
// intersection = 2
// union        = 4
//
// J(A,B) = 2 / 4 = 0.5
//
// ============================================================

function verifyNarrativeJaccard(): void {

  const source =
    createFixture({
      id:
        "event:jaccard-source",

      traits:
        available([
          "radar",
          "visual",
          "aerial",
        ]),
    });

  const target =
    createFixture({
      id:
        "event:jaccard-target",

      traits:
        available([
          "visual",
          "aerial",
          "ground",
        ]),
    });

  const result =
    compareCanonicalKnowledgeFeatures(
      source,
      target,
    );

  const similarity =
    requireAvailableDimension(
      result,
      CanonicalFeatureDimension.NARRATIVE,
    );

  assertApproximatelyEqual(
    similarity,
    0.5,
    "Narrative Jaccard similarity must preserve P24.2 mathematics.",
  );

  console.log(
    "PASS — Jaccard mathematics preserved (2 / 4 = 0.5)",
  );

}

// ============================================================
// TEST 4
// AVAILABLE EMPTY SET != UNAVAILABLE
// ============================================================

function verifyEmptySetSemantics(): void {

  const emptySource =
    createFixture({
      id:
        "event:empty-source",

      traits:
        available([]),
    });

  const emptyTarget =
    createFixture({
      id:
        "event:empty-target",

      traits:
        available([]),
    });

  const emptyResult =
    compareCanonicalKnowledgeFeatures(
      emptySource,
      emptyTarget,
    );

  const emptySimilarity =
    requireAvailableDimension(
      emptyResult,
      CanonicalFeatureDimension.NARRATIVE,
    );

  assertApproximatelyEqual(
    emptySimilarity,
    1,
    "AVAILABLE empty narrative sets must preserve J(empty, empty) = 1.",
  );

  const unavailableTarget =
    createFixture({
      id:
        "event:unavailable-target",

      traits:
        unavailable(),
    });

  const unavailableResult =
    compareCanonicalKnowledgeFeatures(
      emptySource,
      unavailableTarget,
    );

  assert(
    unavailableResult
      .dimensions
      .narrative
      .availability ===
      CanonicalSimilarityAvailability.UNAVAILABLE,
    "AVAILABLE([]) compared with UNAVAILABLE must produce UNAVAILABLE narrative similarity.",
  );

  console.log(
    "PASS — AVAILABLE([]) remains distinct from UNAVAILABLE",
  );

}

// ============================================================
// TEST 5
// ZERO SIMILARITY != UNAVAILABLE
// ============================================================

function verifyZeroSimilaritySemantics(): void {

  const source =
    createFixture({
      id:
        "event:zero-source",

      traits:
        available([
          "radar",
        ]),
    });

  const target =
    createFixture({
      id:
        "event:zero-target",

      traits:
        available([
          "biological",
        ]),
    });

  const result =
    compareCanonicalKnowledgeFeatures(
      source,
      target,
    );

  const narrative =
    result
      .dimensions
      .narrative;

  assert(
    narrative.availability ===
      CanonicalSimilarityAvailability.AVAILABLE,
    "Disjoint known narrative sets must remain AVAILABLE.",
  );

  if (
    narrative.availability !==
    CanonicalSimilarityAvailability.AVAILABLE
  ) {

    return;

  }

  assertApproximatelyEqual(
    narrative.similarity,
    0,
    "Disjoint known narrative sets must produce legitimate zero similarity.",
  );

  console.log(
    "PASS — AVAILABLE zero similarity != UNAVAILABLE",
  );

}

// ============================================================
// TEST 6
// CANONICAL TOPOLOGY VECTOR
// ============================================================
//
// Source:
//
//   (0.2, 0.3, 0.4, 0.1)
//
// Target:
//
//   (0.4, 0.3, 0.2, 0.5)
//
// Component similarities:
//
//   0.8
//   1.0
//   0.8
//   0.6
//
// Mean:
//
//   0.8
//
// ============================================================

function verifyTopologyVector(): void {

  const source =
    createFixture({
      id:
        "event:topology-source",

      topology:
        available({
          contradictionDensity:
            0.20,
          residualInstability:
            0.30,
          entanglementScore:
            0.40,
          clusterFragmentation:
            0.10,
        }),
    });

  const target =
    createFixture({
      id:
        "event:topology-target",

      topology:
        available({
          contradictionDensity:
            0.40,
          residualInstability:
            0.30,
          entanglementScore:
            0.20,
          clusterFragmentation:
            0.50,
        }),
    });

  const result =
    compareCanonicalKnowledgeFeatures(
      source,
      target,
    );

  const topology =
    requireAvailableDimension(
      result,
      CanonicalFeatureDimension.TOPOLOGY,
    );

  assertApproximatelyEqual(
    topology,
    0.8,
    "Canonical topology vector similarity must equal 0.8.",
  );

  console.log(
    "PASS — canonical topology vector T = (Dc, Ri, Es, Fc)",
  );

}

// ============================================================
// TEST 7
// GEOGRAPHY SEMANTICS
// ============================================================

function verifyGeography(): void {

  const source =
    createFixture({
      id:
        "event:geo-source",

      geography:
        available({
          knowledgeObjectId:
            "location:source",
          state:
            "CA",
        }),
    });

  const sameState =
    createFixture({
      id:
        "event:geo-same",

      geography:
        available({
          knowledgeObjectId:
            "location:same",
          state:
            "ca",
        }),
    });

  const differentState =
    createFixture({
      id:
        "event:geo-different",

      geography:
        available({
          knowledgeObjectId:
            "location:different",
          state:
            "OR",
        }),
    });

  const missingState =
    createFixture({
      id:
        "event:geo-missing",

      geography:
        available({
          knowledgeObjectId:
            "location:missing",
        }),
    });

  const same =
    compareCanonicalKnowledgeFeatures(
      source,
      sameState,
    );

  const different =
    compareCanonicalKnowledgeFeatures(
      source,
      differentState,
    );

  const missing =
    compareCanonicalKnowledgeFeatures(
      source,
      missingState,
    );

  assertApproximatelyEqual(
    requireAvailableDimension(
      same,
      CanonicalFeatureDimension.GEOGRAPHY,
    ),
    1,
    "Equivalent canonical state values must produce geography similarity 1.",
  );

  assertApproximatelyEqual(
    requireAvailableDimension(
      different,
      CanonicalFeatureDimension.GEOGRAPHY,
    ),
    0,
    "Different known states must produce legitimate geography similarity 0.",
  );

  assert(
    missing
      .dimensions
      .geography
      .availability ===
      CanonicalSimilarityAvailability.UNAVAILABLE,
    "Missing state must produce UNAVAILABLE geography similarity.",
  );

  console.log(
    "PASS — geography preserves known-zero versus unavailable semantics",
  );

}

// ============================================================
// TEST 8
// PARTIAL-DIMENSION RENORMALIZATION
// ============================================================
//
// Make geography unavailable.
//
// Remaining historical weights:
//
//   narrative       0.30
//   observability   0.20
//   infrastructure  0.15
//   topology        0.25
//
// Participating weight:
//
//   0.90
//
// If every participating dimension has similarity 1:
//
//           0.90
//     S = ------ = 1
//           0.90
//
// Legacy zero-substitution would incorrectly produce:
//
//     0.90
//
// ============================================================

function verifyRenormalization(): void {

  const source =
    createFixture({
      id:
        "event:renormalize-source",
    });

  const target =
    createFixture({
      id:
        "event:renormalize-target",

      geography:
        unavailable(),
    });

  const result =
    compareCanonicalKnowledgeFeatures(
      source,
      target,
    );

  assert(
    result.aggregate.availability ===
      CanonicalSimilarityAvailability.AVAILABLE,
    "Aggregate must remain AVAILABLE when positively weighted dimensions participate.",
  );

  if (
    result.aggregate.availability !==
    CanonicalSimilarityAvailability.AVAILABLE
  ) {

    return;

  }

  assertApproximatelyEqual(
    result.aggregate.participatingWeight,
    0.90,
    "Participating weight must exclude unavailable geography.",
  );

  assertApproximatelyEqual(
    result.aggregate.score,
    1,
    "Aggregate must renormalize rather than penalize unavailable geography.",
  );

  assert(
    !result.aggregate
      .participatingDimensions
      .includes(
        CanonicalFeatureDimension.GEOGRAPHY,
      ),
    "Unavailable geography must not participate in aggregate similarity.",
  );

  console.log(
    "PASS — unavailable dimensions are excluded and weights renormalize",
  );

}

// ============================================================
// TEST 9
// COMPLETELY UNAVAILABLE COMPARISON
// ============================================================

function verifyCompletelyUnavailable(): void {

  const createUnavailableFixture =
    (
      id:
        string,
    ): CanonicalKnowledgeFeatureSet =>
      createFixture({

        id,

        traits:
          unavailable(),

        confidence:
          unavailable(),

        durationMinutes:
          unavailable(),

        regime:
          unavailable(),

        infrastructure:
          unavailable(),

        topology:
          unavailable(),

        geography:
          unavailable(),

      });

  const source =
    createUnavailableFixture(
      "event:unavailable-source",
    );

  const target =
    createUnavailableFixture(
      "event:unavailable-target",
    );

  const result =
    compareCanonicalKnowledgeFeatures(
      source,
      target,
    );

  assert(
    result.aggregate.availability ===
      CanonicalSimilarityAvailability.UNAVAILABLE,
    "Comparison with no mutually available dimensions must produce UNAVAILABLE aggregate.",
  );

  assert(
    result.dimensions.narrative.availability ===
      CanonicalSimilarityAvailability.UNAVAILABLE &&
    result.dimensions.observability.availability ===
      CanonicalSimilarityAvailability.UNAVAILABLE &&
    result.dimensions.infrastructure.availability ===
      CanonicalSimilarityAvailability.UNAVAILABLE &&
    result.dimensions.topology.availability ===
      CanonicalSimilarityAvailability.UNAVAILABLE &&
    result.dimensions.geography.availability ===
      CanonicalSimilarityAvailability.UNAVAILABLE,
    "Every dimension must remain explicitly UNAVAILABLE.",
  );

  console.log(
    "PASS — completely unavailable comparison does not become zero",
  );

}

// ============================================================
// TEST 10
// TARGET INPUT ORDER INVARIANCE
// ============================================================

function verifyTargetOrderingInvariant(): void {

  const source =
    createFixture({
      id:
        "event:ordering-source",
    });

  const targetA =
    createFixture({
      id:
        "event:a",
    });

  const targetB =
    createFixture({
      id:
        "event:b",

      traits:
        available([
          "different",
        ]),
    });

  const targetC =
    createFixture({
      id:
        "event:c",

      confidence:
        available(
          0.20,
        ),
    });

  const first =
    compareCanonicalKnowledgeFeatureCollection(
      source,
      [
        targetA,
        targetB,
        targetC,
      ],
    );

  const second =
    compareCanonicalKnowledgeFeatureCollection(
      source,
      [
        targetC,
        targetA,
        targetB,
      ],
    );

  assert(
    serialize(
      first,
    ) ===
      serialize(
        second,
      ),
    "Target input permutation must not alter canonical ranked output.",
  );

  console.log(
    "PASS — target input ordering does not alter ranked output",
  );

}

// ============================================================
// TEST 11
// SCORE ORDERING
// ============================================================

function verifyScoreOrdering(): void {

  const source =
    createFixture({
      id:
        "event:rank-source",
    });

  const exact =
    createFixture({
      id:
        "event:exact",
    });

  const weaker =
    createFixture({
      id:
        "event:weaker",

      traits:
        available([
          "unrelated",
        ]),

      confidence:
        available(
          0.10,
        ),

      durationMinutes:
        available(
          90,
        ),
    });

  const collection =
    compareCanonicalKnowledgeFeatureCollection(
      source,
      [
        weaker,
        exact,
      ],
    );

  assert(
    collection
      .resolutions[0]
      ?.targetKnowledgeObjectId ===
      "event:exact",
    "Higher aggregate similarity must rank first.",
  );

  console.log(
    "PASS — aggregate similarity ranking is deterministic",
  );

}

// ============================================================
// TEST 12
// LEXICAL TIE BREAK
// ============================================================

function verifyLexicalTieBreak(): void {

  const source =
    createFixture({
      id:
        "event:tie-source",
    });

  const targetZ =
    createFixture({
      id:
        "event:z",
    });

  const targetA =
    createFixture({
      id:
        "event:a",
    });

  const collection =
    compareCanonicalKnowledgeFeatureCollection(
      source,
      [
        targetZ,
        targetA,
      ],
    );

  assert(
    collection
      .resolutions[0]
      ?.targetKnowledgeObjectId ===
      "event:a",
    "Equal scores must use canonical target ID lexical ordering.",
  );

  assert(
    collection
      .resolutions[1]
      ?.targetKnowledgeObjectId ===
      "event:z",
    "Lexical tie-break ordering must be stable.",
  );

  console.log(
    "PASS — lexical target identity provides deterministic tie-break",
  );

}

// ============================================================
// TEST 13
// SOURCE / TARGET IDENTITY PRESERVATION
// ============================================================

function verifyIdentityPreservation(): void {

  const source =
    createFixture({
      id:
        "event:identity-source",
    });

  const target =
    createFixture({
      id:
        "event:identity-target",
    });

  const result =
    compareCanonicalKnowledgeFeatures(
      source,
      target,
    );

  assert(
    result.sourceKnowledgeObjectId ===
      "event:identity-source",
    "Source canonical Knowledge identity must be preserved.",
  );

  assert(
    result.targetKnowledgeObjectId ===
      "event:identity-target",
    "Target canonical Knowledge identity must be preserved.",
  );

  console.log(
    "PASS — canonical Knowledge identities preserved",
  );

}

// ============================================================
// TEST 14
// SAME OBSERVABILITY REGIME
// ============================================================
//
// Equal canonical observation regimes establish a homogeneous
// observational basis for the existing confidence / duration
// similarity operator.
//
// ============================================================

function verifySameObservabilityRegime(): void {

  const source =
    createFixture({
      id:
        "event:observability-same-source",

      regime:
        available(
          "multi_sensor",
        ),
    });

  const target =
    createFixture({
      id:
        "event:observability-same-target",

      regime:
        available(
          "multi_sensor",
        ),
    });

  const result =
    compareCanonicalKnowledgeFeatures(
      source,
      target,
    );

  const observability =
    result
      .dimensions
      .observability;

  assert(
    observability.availability ===
      CanonicalSimilarityAvailability.AVAILABLE,
    "Equal canonical observation regimes must permit observability similarity.",
  );

  if (
    observability.availability !==
    CanonicalSimilarityAvailability.AVAILABLE
  ) {

    return;

  }

  assertApproximatelyEqual(
    observability.similarity,
    1,
    "Equal regimes with identical confidence and duration must produce observability similarity 1.",
  );

  console.log(
    "PASS — same canonical observation regime permits observability similarity",
  );

}

// ============================================================
// TEST 15
// HETEROGENEOUS OBSERVABILITY REGIME
// ============================================================
//
// Different canonical observation regimes do not establish
// direct observability comparability.
//
// Critically:
//
//   heterogeneous regime != similarity zero
//
// The observability dimension becomes UNAVAILABLE while other
// legitimately comparable dimensions remain eligible for the
// aggregate.
//
// ============================================================

function verifyHeterogeneousObservabilityRegime(): void {

  const source =
    createFixture({
      id:
        "event:observability-cross-source",

      regime:
        available(
          "multi_sensor",
        ),
    });

  const target =
    createFixture({
      id:
        "event:observability-cross-target",

      regime:
        available(
          "historical_narrative",
        ),
    });

  const result =
    compareCanonicalKnowledgeFeatures(
      source,
      target,
    );

  assert(
    result
      .dimensions
      .observability
      .availability ===
      CanonicalSimilarityAvailability.UNAVAILABLE,
    "Different canonical observation regimes must not produce an observability similarity score.",
  );

  assert(
    result.aggregate.availability ===
      CanonicalSimilarityAvailability.AVAILABLE,
    "Cross-regime observability must not invalidate otherwise comparable dimensions.",
  );

  if (
    result.aggregate.availability !==
    CanonicalSimilarityAvailability.AVAILABLE
  ) {

    return;

  }

  assert(
    !result.aggregate
      .participatingDimensions
      .includes(
        CanonicalFeatureDimension.OBSERVABILITY,
      ),
    "Cross-regime observability must be excluded from aggregate participation.",
  );

  assert(
    result.aggregate.participatingDimensions.length ===
      4,
    "The remaining four comparable dimensions must continue participating.",
  );

  assertApproximatelyEqual(
    result.aggregate.participatingWeight,
    0.80,
    "Cross-regime observability must remove its 0.20 weight from aggregate participation.",
  );

  assertApproximatelyEqual(
    result.aggregate.score,
    1,
    "Remaining identical dimensions must renormalize to aggregate similarity 1.",
  );

  console.log(
    "PASS — heterogeneous observation regime becomes unavailable, not zero",
  );

}

// ============================================================
// TEST 16
// MULTIDIMENSIONAL PAIRWISE COMPARABILITY GATES
// ============================================================
//
// P56C-D regression boundary.
//
// Narrative, infrastructure, topology, and geography must
// pass through the same pairwise comparability operator already
// governing observability.
//
// For each dimension:
//
//   unavailable canonical evidence
//          ↓
//      INDETERMINATE
//          ↓
//   similarity UNAVAILABLE
//
// Critically:
//
//   unavailable evidence != similarity zero
//
// Other legitimately comparable dimensions remain eligible
// and aggregate weights renormalize over those dimensions.
//
// ============================================================

function verifyMultidimensionalComparabilityGates(): void {

  const cases = [

    {
      dimension:
        CanonicalFeatureDimension.NARRATIVE,

      target:
        createFixture({
          id:
            "event:gate-narrative",

          traits:
            unavailable(),
        }),
    },

    {
      dimension:
        CanonicalFeatureDimension.INFRASTRUCTURE,

      target:
        createFixture({
          id:
            "event:gate-infrastructure",

          infrastructure:
            unavailable(),
        }),
    },

    {
      dimension:
        CanonicalFeatureDimension.TOPOLOGY,

      target:
        createFixture({
          id:
            "event:gate-topology",

          topology:
            unavailable(),
        }),
    },

    {
      dimension:
        CanonicalFeatureDimension.GEOGRAPHY,

      target:
        createFixture({
          id:
            "event:gate-geography",

          geography:
            unavailable(),
        }),
    },

  ] as const;

  for (
    const testCase
    of cases
  ) {

    const source =
      createFixture({
        id:
          `event:gate-source-${testCase.dimension}`,
      });

    const result =
      compareCanonicalKnowledgeFeatures(
        source,
        testCase.target,
      );

    const candidate =
      testCase.dimension ===
        CanonicalFeatureDimension.NARRATIVE
        ? result.dimensions.narrative
        : testCase.dimension ===
            CanonicalFeatureDimension.INFRASTRUCTURE
          ? result.dimensions.infrastructure
          : testCase.dimension ===
              CanonicalFeatureDimension.TOPOLOGY
            ? result.dimensions.topology
            : result.dimensions.geography;

    assert(
      candidate.availability ===
        CanonicalSimilarityAvailability.UNAVAILABLE,
      `${testCase.dimension} must become UNAVAILABLE when pairwise comparability is indeterminate.`,
    );

    assert(
      result.aggregate.availability ===
        CanonicalSimilarityAvailability.AVAILABLE,
      `${testCase.dimension} unavailability must not invalidate otherwise comparable dimensions.`,
    );

    if (
      result.aggregate.availability !==
      CanonicalSimilarityAvailability.AVAILABLE
    ) {

      continue;

    }

    assert(
      !result.aggregate
        .participatingDimensions
        .includes(
          testCase.dimension,
        ),
      `${testCase.dimension} must be excluded from aggregate participation when not comparable.`,
    );

    assert(
      result.aggregate.participatingDimensions.length ===
        4,
      `${testCase.dimension} gating must leave the remaining four dimensions participating.`,
    );

    const excludedWeight =
      testCase.dimension ===
        CanonicalFeatureDimension.NARRATIVE
        ? 0.30
        : testCase.dimension ===
            CanonicalFeatureDimension.INFRASTRUCTURE
          ? 0.15
          : testCase.dimension ===
              CanonicalFeatureDimension.TOPOLOGY
            ? 0.25
            : 0.10;

    assertApproximatelyEqual(
      result.aggregate.participatingWeight,
      1 - excludedWeight,
      `${testCase.dimension} gating must remove only that dimension's canonical weight.`,
    );

    assertApproximatelyEqual(
      result.aggregate.score,
      1,
      `${testCase.dimension} gating must preserve similarity 1 across the remaining identical dimensions.`,
    );

  }

  console.log(
    "PASS — narrative, infrastructure, topology, and geography obey pairwise comparability gates",
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
    "P56C-D — CANONICAL KNOWLEDGE SIMILARITY VERIFICATION",
  );
  console.log(
    "============================================================",
  );
  console.log("");

  verifyIdenticalFeatures();

  verifyRepeatedComparison();

  verifyNarrativeJaccard();

  verifyEmptySetSemantics();

  verifyZeroSimilaritySemantics();

  verifyTopologyVector();

  verifyGeography();

  verifyRenormalization();

  verifyCompletelyUnavailable();

  verifyTargetOrderingInvariant();

  verifyScoreOrdering();

  verifyLexicalTieBreak();

  verifyIdentityPreservation();

  verifySameObservabilityRegime();

  verifyHeterogeneousObservabilityRegime();

  verifyMultidimensionalComparabilityGates();

  // ==========================================================
  // SUMMARY
  // ==========================================================

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "P56C-D VERIFICATION PASSED",
  );
  console.log(
    "============================================================",
  );
  console.log("");
  console.log(
    "Verified:",
  );
  console.log(
    "  F_i + F_j -> S_ij",
  );
  console.log(
    "  deterministic comparison",
  );
  console.log(
    "  canonical target ordering",
  );
  console.log(
    "  input-order invariance",
  );
  console.log(
    "  Jaccard mathematics preserved",
  );
  console.log(
    "  AVAILABLE([]) != UNAVAILABLE",
  );
  console.log(
    "  AVAILABLE zero != UNAVAILABLE",
  );
  console.log(
    "  canonical topology vector comparison",
  );
  console.log(
    "  geography availability semantics",
  );
  console.log(
    "  availability-aware weight renormalization",
  );
  console.log(
    "  no-comparison != zero similarity",
  );
  console.log(
    "  deterministic ranking",
  );
  console.log(
    "  deterministic lexical tie-breaking",
  );
  console.log(
    "  feature availability != pairwise comparability",
  );
  console.log(
    "  same observability regime permits measurement",
  );
  console.log(
    "  heterogeneous observability regime becomes UNAVAILABLE, not zero",
  );
  console.log(
    "  narrative pairwise comparability gate",
  );
  console.log(
    "  infrastructure pairwise comparability gate",
  );
  console.log(
    "  topology pairwise comparability gate",
  );
  console.log(
    "  geography pairwise comparability gate",
  );
  console.log(
    "  multidimensional gate-aware aggregate renormalization",
  );
  console.log(
    "  canonical Knowledge identity preservation",
  );
  console.log("");

}

main();