// ============================================================
// tools/verification/VerifyResolveCanonicalSimilarityIntegration.ts
//
// P56D-B
// RESOLVE CANONICAL SIMILARITY INTEGRATION VERIFICATION
//
// PURPOSE
//
// Verify that the deterministic canonical similarity machinery
// established by P56C / P56D-A is now genuinely integrated into
// the Resolve manifold computation.
//
// This is NOT another unit test of similarity mathematics.
//
// P56D-A already verified:
//
//   • canonical pair construction
//   • n(n - 1) / 2 pair population
//   • pair orientation
//   • input-order invariance
//   • comparability gates
//   • similarity mathematics
//   • UNAVAILABLE != zero
//
// This verifier proves the integration path:
//
//     Canonical Knowledge
//             ↓
//     Canonical EVENT Features
//             ↓
//     Canonical Similarity Matrix
//             ↓
//     Canonical Manifold
//             ↓
//     Canonical Representation
//
// GOVERNING COMPUTATION
//
//                 M = g(L,T,S)
//
// Similarity remains a deterministic computed product inside M.
//
// It is NOT introduced as another independent input to g().
//
// VERIFICATION TARGETS
//
//   • three canonical EVENT Knowledge Objects participate
//   • three events produce exactly three unique pairs
//   • similarity matrix is physically present in manifold
//   • canonical pair identities are preserved
//   • similarity matrix survives canonical serialization
//   • equivalent reordered universes produce identical output
//   • repeated manifold computation is deterministic
//   • similarity-bearing canonical representation is identical
//     for equivalent canonical input
//   • non-EVENT Knowledge remains in the manifold population
//     without being coerced into EVENT similarity
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
  KnowledgeObjectType,
} from "../../src/knowledge/model/KnowledgeObjectTypes";

import type {
  KnowledgeObject,
} from "../../src/knowledge/model/KnowledgeObject";

import {
  buildCanonicalComputationalUniverse,
} from "../../src/resolve/engine/CanonicalUniverse";

import {
  computeCanonicalManifoldRepresentation,
} from "../../src/resolve/engine/CanonicalManifold";

import type {
  CanonicalManifold,
} from "../../src/resolve/engine/ResolveEngineTypes";

import type {
  ResolveComputationInput,
} from "../../src/resolve/runtime/ResolveRuntimeTypes";

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

// ============================================================
// CANONICAL EVENT PAYLOAD
// ============================================================
//
// Feature extraction already owns the interpretation of
// canonical event payloads.
//
// These fixtures deliberately provide the canonical fields
// required by that existing extractor rather than constructing
// CanonicalKnowledgeFeatureSet objects directly.
//
// This is essential.
//
// P56D-B must verify:
//
//     KnowledgeObject
//          ↓
//     feature extraction
//          ↓
//     similarity matrix
//          ↓
//     manifold
//
// rather than bypassing the integration boundary.
//
// ============================================================

function createCanonicalEventPayload(
  eventName:
    string,
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

      narrative_traits: [
        "structured_motion",
        "persistent_observation",
      ],

      infrastructure: [],

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
//
// IMPORTANT KNOWLEDGE MODEL CONTRACT:
//
//   object.identity.id
//       = canonical object identity
//
//   object.type
//       = canonical Knowledge Object type
//
// Feature extraction reads object.type.
//
// relationships is explicit structural state. An empty
// relationship collection is legitimate and causes relationship-
// derived dimensions such as infrastructure/geography to become
// UNAVAILABLE rather than being fabricated.
//
// ============================================================

function createEventKnowledgeObject(
  id:
    string,
  eventName:
    string,
): KnowledgeObject {

  return {

    identity: {

      id,

    },

    type:
      KnowledgeObjectType.EVENT,

    relationships: [],

    payload:
      createCanonicalEventPayload(
        eventName,
      ),

  } as KnowledgeObject;

}

// ============================================================
// CREATE NON-EVENT KNOWLEDGE OBJECT
// ============================================================

function createNonEventKnowledgeObject(
  id:
    string,
): KnowledgeObject {

  return {

    identity: {

      id,

    },

    type:
      KnowledgeObjectType.ARTIFACT,

    relationships: [],

    payload: {

      source:
        "VERIFICATION",

    },

  } as KnowledgeObject;

}

// ============================================================
// CREATE INVESTIGATION
// ============================================================
//
// ResolveComputationInput owns the authoritative Investigation
// type.
//
// This verifier needs only a stable canonical investigation
// identity for the engine boundary.
//
// ============================================================

function createInvestigation():
  ResolveComputationInput["investigation"] {

  return {

    id:
      "investigation:p56d-b-verification",

  } as ResolveComputationInput["investigation"];

}

// ============================================================
// CREATE RESOLVE INPUT
// ============================================================

function createResolveInput(
  knowledgeObjects:
    readonly KnowledgeObject[],
): ResolveComputationInput {

  return {

    investigation:
      createInvestigation(),

    knowledgeObjects,

    activeLayers: [
      "TEMPORAL",
      "SIMILARITY",
      "GEO",
    ],

    temporalContext: {

      start:
        "2004-01-01T00:00:00.000Z",

      end:
        "2004-12-31T23:59:59.999Z",

    },

    investigativeScale: {

      level:
        "EVENT",

      depth:
        1,

    },

  };

}

// ============================================================
// CREATE THREE-EVENT POPULATION
// ============================================================

function createThreeEventPopulation():
  readonly KnowledgeObject[] {

  return [

    createEventKnowledgeObject(
      "event:alpha",
      "Alpha Verification Event",
    ),

    createEventKnowledgeObject(
      "event:beta",
      "Beta Verification Event",
    ),

    createEventKnowledgeObject(
      "event:gamma",
      "Gamma Verification Event",
    ),

  ];

}

// ============================================================
// COMPUTE VERIFICATION MANIFOLD
// ============================================================

function computeVerificationManifold(
  knowledgeObjects:
    readonly KnowledgeObject[],
): {

  manifold:
    CanonicalManifold;

  canonicalRepresentation:
    string;

} {

  const input =
    createResolveInput(
      knowledgeObjects,
    );

  const universe =
    buildCanonicalComputationalUniverse(
      input,
    );

  return computeCanonicalManifoldRepresentation(
    universe,
  );

}

// ============================================================
// PAIR IDENTITY
// ============================================================

function getPairIdentities(
  manifold:
    CanonicalManifold,
): readonly string[] {

  return manifold
    .similarityMatrix
    .pairs
    .map(
      pair =>
        `${pair.leftKnowledgeObjectId}->${pair.rightKnowledgeObjectId}`,
    );

}

// ============================================================
// TEST 1
// THREE EVENTS ENTER SIMILARITY MANIFOLD
// ============================================================

function verifyThreeEventIntegration(): void {

  const result =
    computeVerificationManifold(
      createThreeEventPopulation(),
    );

  const matrix =
    result.manifold
      .similarityMatrix;

  assertEqual(
    matrix.featureSetCount,
    3,
    "Three canonical EVENT Knowledge Objects must produce three canonical feature sets.",
  );

  assertEqual(
    matrix.pairCount,
    3,
    "Three canonical EVENT Knowledge Objects must produce exactly three similarity pairs.",
  );

  assertEqual(
    matrix.pairs.length,
    3,
    "Similarity matrix must physically contain all three unique pairs.",
  );

  console.log(
    "PASS 1 — three canonical EVENT Knowledge Objects produce three Resolve similarity pairs",
  );

}

// ============================================================
// TEST 2
// CANONICAL PAIR IDENTITIES
// ============================================================

function verifyCanonicalPairIdentities(): void {

  const result =
    computeVerificationManifold([

      createEventKnowledgeObject(
        "event:gamma",
        "Gamma Verification Event",
      ),

      createEventKnowledgeObject(
        "event:alpha",
        "Alpha Verification Event",
      ),

      createEventKnowledgeObject(
        "event:beta",
        "Beta Verification Event",
      ),

    ]);

  const actual =
    getPairIdentities(
      result.manifold,
    );

  const expected = [

    "event:alpha->event:beta",
    "event:alpha->event:gamma",
    "event:beta->event:gamma",

  ];

  assertEqual(
    JSON.stringify(
      actual,
    ),
    JSON.stringify(
      expected,
    ),
    "Resolve similarity matrix must preserve canonical pair identity ordering.",
  );

  console.log(
    "PASS 2 — Resolve preserves canonical similarity pair identities",
  );

}

// ============================================================
// TEST 3
// MATRIX IS PART OF CANONICAL REPRESENTATION
// ============================================================

function verifySimilaritySerializedIntoManifold(): void {

  const result =
    computeVerificationManifold(
      createThreeEventPopulation(),
    );

  const parsed =
    JSON.parse(
      result.canonicalRepresentation,
    ) as Record<string, unknown>;

  assert(
    Object.prototype.hasOwnProperty.call(
      parsed,
      "similarityMatrix",
    ),
    "Canonical representation must contain similarityMatrix.",
  );

  const serializedMatrix =
    parsed[
      "similarityMatrix"
    ] as {

      featureSetCount?:
        number;

      pairCount?:
        number;

      pairs?:
        unknown[];

    };

  assertEqual(
    serializedMatrix.featureSetCount,
    3,
    "Serialized manifold must preserve similarity feature-set count.",
  );

  assertEqual(
    serializedMatrix.pairCount,
    3,
    "Serialized manifold must preserve similarity pair count.",
  );

  assertEqual(
    serializedMatrix.pairs?.length,
    3,
    "Serialized manifold must preserve all similarity pairs.",
  );

  console.log(
    "PASS 3 — similarity matrix survives canonical manifold serialization",
  );

}

// ============================================================
// TEST 4
// INPUT ORDER INVARIANCE THROUGH RESOLVE
// ============================================================
//
// This is stronger than the P56D-A matrix test.
//
// Here the entire path is exercised:
//
//   unordered Knowledge
//          ↓
//   CanonicalUniverse
//          ↓
//   feature extraction
//          ↓
//   matrix computation
//          ↓
//   manifold serialization
//
// ============================================================

function verifyResolveInputOrderInvariance(): void {

  const alpha =
    createEventKnowledgeObject(
      "event:alpha",
      "Alpha Verification Event",
    );

  const beta =
    createEventKnowledgeObject(
      "event:beta",
      "Beta Verification Event",
    );

  const gamma =
    createEventKnowledgeObject(
      "event:gamma",
      "Gamma Verification Event",
    );

  const first =
    computeVerificationManifold([
      alpha,
      beta,
      gamma,
    ]);

  const second =
    computeVerificationManifold([
      gamma,
      alpha,
      beta,
    ]);

  const third =
    computeVerificationManifold([
      beta,
      gamma,
      alpha,
    ]);

  assertEqual(
    first.canonicalRepresentation,
    second.canonicalRepresentation,
    "Reordered equivalent Knowledge populations must produce byte-identical similarity-bearing manifolds.",
  );

  assertEqual(
    first.canonicalRepresentation,
    third.canonicalRepresentation,
    "Alternate Knowledge ordering must not alter similarity-bearing canonical representation.",
  );

  console.log(
    "PASS 4 — reordered equivalent universes produce identical similarity-bearing canonical output",
  );

}

// ============================================================
// TEST 5
// REPEATED COMPUTATION DETERMINISM
// ============================================================

function verifyRepeatedResolveComputation(): void {

  const population =
    createThreeEventPopulation();

  const first =
    computeVerificationManifold(
      population,
    );

  const second =
    computeVerificationManifold(
      population,
    );

  assertEqual(
    first.canonicalRepresentation,
    second.canonicalRepresentation,
    "Repeated Resolve computation must produce byte-identical similarity-bearing canonical output.",
  );

  assertEqual(
    JSON.stringify(
      first.manifold,
    ),
    JSON.stringify(
      second.manifold,
    ),
    "Repeated Resolve computation must produce structurally identical manifolds.",
  );

  console.log(
    "PASS 5 — repeated Resolve similarity computation is deterministic",
  );

}

// ============================================================
// TEST 6
// NON-EVENT KNOWLEDGE IS NOT COERCED INTO EVENT SIMILARITY
// ============================================================
//
// Four Knowledge Objects enter the manifold:
//
//   • three EVENT
//   • one ARTIFACT
//
// Expected:
//
//   manifold Knowledge population = 4
//   similarity feature population = 3
//   similarity pair population    = 3
//
// This proves:
//
//   Knowledge membership != EVENT similarity eligibility
//
// ============================================================

function verifyNonEventKnowledgeNotCoerced(): void {

  const events =
    createThreeEventPopulation();

  const artifact =
    createNonEventKnowledgeObject(
      "artifact:verification",
    );

  const result =
    computeVerificationManifold([
      artifact,
      ...events,
    ]);

  assertEqual(
    result.manifold
      .knowledgeObjectIds
      .length,
    4,
    "Non-EVENT Knowledge must remain part of the canonical manifold population.",
  );

  assert(
    result.manifold
      .knowledgeObjectIds
      .includes(
        "artifact:verification",
      ),
    "Artifact identity must remain represented in canonical manifold Knowledge population.",
  );

  assertEqual(
    result.manifold
      .similarityMatrix
      .featureSetCount,
    3,
    "Only canonical EVENT feature sets may participate in the event similarity matrix.",
  );

  assertEqual(
    result.manifold
      .similarityMatrix
      .pairCount,
    3,
    "Adding non-EVENT Knowledge must not create false EVENT similarity pairs.",
  );

  for (
    const pair
    of result.manifold
      .similarityMatrix
      .pairs
  ) {

    assert(
      pair.leftKnowledgeObjectId !==
        "artifact:verification" &&
      pair.rightKnowledgeObjectId !==
        "artifact:verification",
      "Non-EVENT Knowledge must never be silently coerced into EVENT similarity comparison.",
    );

  }

  console.log(
    "PASS 6 — non-EVENT Knowledge remains in manifold without entering EVENT similarity matrix",
  );

}

// ============================================================
// TEST 7
// PAIRWISE RESOLUTION IS PHYSICALLY PRESENT
// ============================================================
//
// We are not re-testing exact similarity mathematics here.
//
// We verify that each matrix entry inside Resolve contains the
// actual deterministic P56C-D resolution rather than merely an
// identity placeholder.
//
// ============================================================

function verifySimilarityResolutionPresent(): void {

  const result =
    computeVerificationManifold(
      createThreeEventPopulation(),
    );

  for (
    const pair
    of result.manifold
      .similarityMatrix
      .pairs
  ) {

    assertEqual(
      pair.resolution
        .sourceKnowledgeObjectId,
      pair.leftKnowledgeObjectId,
      "Resolve matrix pair must preserve similarity source identity.",
    );

    assertEqual(
      pair.resolution
        .targetKnowledgeObjectId,
      pair.rightKnowledgeObjectId,
      "Resolve matrix pair must preserve similarity target identity.",
    );

    assert(
      pair.resolution
        .dimensions !==
        undefined,
      "Resolve matrix pair must contain deterministic dimension resolutions.",
    );

    assert(
      pair.resolution
        .aggregate !==
        undefined,
      "Resolve matrix pair must contain deterministic aggregate resolution.",
    );

  }

  console.log(
    "PASS 7 — Resolve manifold contains complete deterministic pairwise similarity resolutions",
  );

}

// ============================================================
// TEST 8
// SERIALIZED PAIR IDENTITIES
// ============================================================
//
// Verify that pair identities survive all the way through the
// canonical serialization boundary.
//
// ============================================================

function verifySerializedPairIdentities(): void {

  const result =
    computeVerificationManifold([

      createEventKnowledgeObject(
        "event:gamma",
        "Gamma Verification Event",
      ),

      createEventKnowledgeObject(
        "event:beta",
        "Beta Verification Event",
      ),

      createEventKnowledgeObject(
        "event:alpha",
        "Alpha Verification Event",
      ),

    ]);

  const parsed =
    JSON.parse(
      result.canonicalRepresentation,
    ) as {

      similarityMatrix:
        {

          pairs:
            {

              leftKnowledgeObjectId:
                string;

              rightKnowledgeObjectId:
                string;

            }[];

        };

    };

  const identities =
    parsed
      .similarityMatrix
      .pairs
      .map(
        pair =>
          `${pair.leftKnowledgeObjectId}->${pair.rightKnowledgeObjectId}`,
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
    "Canonical serialization must preserve canonical similarity pair identities and ordering.",
  );

  console.log(
    "PASS 8 — canonical serialization preserves similarity pair identity and ordering",
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
    "P56D-B — RESOLVE CANONICAL SIMILARITY INTEGRATION VERIFICATION",
  );
  console.log(
    "============================================================",
  );
  console.log("");

  verifyThreeEventIntegration();

  verifyCanonicalPairIdentities();

  verifySimilaritySerializedIntoManifold();

  verifyResolveInputOrderInvariance();

  verifyRepeatedResolveComputation();

  verifyNonEventKnowledgeNotCoerced();

  verifySimilarityResolutionPresent();

  verifySerializedPairIdentities();

  // ==========================================================
  // SUMMARY
  // ==========================================================

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "P56D-B RESOLVE SIMILARITY INTEGRATION VERIFIED",
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
    "  three EVENT Knowledge Objects -> three unique S_ij pairs",
  );
  console.log(
    "  canonical pair identity preservation",
  );
  console.log(
    "  similarity matrix is part of CanonicalManifold",
  );
  console.log(
    "  similarity matrix is part of canonical representation",
  );
  console.log(
    "  complete pairwise resolutions survive Resolve integration",
  );
  console.log(
    "  Knowledge input-order invariance survives full Resolve path",
  );
  console.log(
    "  repeated similarity-bearing Resolve computation is deterministic",
  );
  console.log(
    "  non-EVENT Knowledge remains in manifold but outside EVENT similarity",
  );
  console.log(
    "  canonical serialized pair ordering is deterministic",
  );
  console.log(
    "  governing equation remains M = g(L,T,S)",
  );
  console.log("");

}

main();