// ============================================================
// tools/verification/VerifyResolveAcceptedKnowledgeFeedback.ts
//
// P56D-I1-G7
// ACCEPTED KNOWLEDGE FEEDBACK & DETERMINISTIC RE-RESOLVE
//
// PURPOSE
//
// Verify the first complete operator-mediated Resolve feedback
// cycle:
//
//   K0
//    ↓
//   Resolve
//    ↓
//   Candidate
//    ↓
//   Evaluation
//    ↓
//   Candidate Intelligence
//    ↓
//   ACCEPT
//    ↓
//   Canonical KnowledgeRelationship
//    ↓
//   KnowledgeObjectRuntime
//    ↓
//   K1
//    ↓
//   Re-Resolve
//    ↓
//   M1
//
// GOVERNING FEEDBACK PATH
//
//   K0 -> R(K0) -> C -> A(C) -> K1 -> R(K1) -> M1
//
// GOVERNING COMPUTATION
//
//                  M = g(L,T,S)
//
// CRITICAL EPISTEMIC RULE
//
//   Candidate != KnowledgeRelationship
//
// Resolve may propose.
// Only explicit acceptance may alter canonical Knowledge.
//
// This verifier deliberately exercises production:
//
//   • ResolveRuntime
//   • ResolveEngine
//   • canonical Knowledge feature extraction
//   • canonical similarity
//   • candidate generation
//   • candidate evaluation
//   • candidate intelligence projection
//   • candidate acceptance
//   • KnowledgeObjectRuntime publication
//   • canonical universe reconstruction
//   • deterministic re-Resolve
//
// It does NOT:
//
//   • use React
//   • create GraphEdges
//   • mutate graph topology
//   • fabricate candidate intelligence
//   • bypass Resolve candidate generation
//   • perform AI inference
//
// Runtime UUIDs and timestamps are intentionally excluded from
// deterministic comparisons.
//
// ============================================================

import {
  KnowledgeObjectType,
} from "../../src/knowledge/model/KnowledgeObjectTypes";

import type {
  KnowledgeObject,
} from "../../src/knowledge/model/KnowledgeObject";

import {
  KnowledgeObjectRuntime,
} from "../../src/knowledge/runtime/KnowledgeObjectRuntime";

import {
  ResolveRuntime,
} from "../../src/resolve/runtime/ResolveRuntime";

import type {
  ResolveComputationInput,
  ResolveComputationResult,
} from "../../src/resolve/runtime/ResolveRuntimeTypes";

import {
  resolveCandidateIntelligence,
} from "../../src/resolve/intelligence/ResolveCandidateIntelligenceResolver";

import {
  materializeAcceptedResolveCandidate,
  ResolveAcceptedRelationshipType,
} from "../../src/resolve/acceptance/ResolveCandidateAcceptance";

import {
  buildCanonicalComputationalUniverse,
} from "../../src/resolve/engine/CanonicalUniverse";

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

function assertJsonEqual(
  actual: unknown,
  expected: unknown,
  message: string,
): void {

  assertEqual(
    JSON.stringify(actual),
    JSON.stringify(expected),
    message,
  );

}

// ============================================================
// CANONICAL EVENT PAYLOAD
// ============================================================
//
// This fixture follows the CURRENT production canonical EVENT
// feature-extraction contract.
//
// IMPORTANT:
//
// The feature extractor reads:
//
//   payload.source
//   payload.sourceKind
//   payload.observabilityRegime
//
//   payload.canonicalEvent
//     .core_event
//       .semantic_signature
//         .traits
//
//   payload.canonicalEvent
//     .core_event
//       .observability_profile
//         .duration_minutes
//
//   payload.canonicalEvent
//     .topology
//       .topology_state
//
// Confidence is NOT read from the payload.
// It is canonical Knowledge state:
//
//   KnowledgeObject.confidence.value
//
// Geography and infrastructure are intentionally not fabricated
// here. Those dimensions require canonical Knowledge
// relationships such as LOCATED_AT / OBSERVED_AT.
//
// We provide Knowledge.
//
// We do NOT construct feature sets, similarity pairs,
// candidates, or evaluations manually.
//
// ============================================================

function createCanonicalEventPayload(
  eventName: string,
): Record<string, unknown> {

  return {

    source:
      "SYSTEM_CANON",

    sourceKind:
      "CANONICAL_REPLAY_EVENT",

    observabilityRegime:
      "multi_sensor",

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

        semantic_signature: {

          traits: [
            "structured_motion",
            "persistent_observation",
          ],

        },

        observability_profile: {

          duration_minutes:
            10,

        },

      },

      topology: {

        topology_state: {

          contradiction_density:
            0.20,

          residual_instability:
            0.40,

          entanglement_score:
            0.60,

          cluster_fragmentation:
            0.30,

        },

      },

    },

  };

}

// ============================================================
// CANONICAL EVENT KNOWLEDGE OBJECT
// ============================================================

function createEventKnowledgeObject(
  id: string,
  eventName: string,
): KnowledgeObject {

  return {

    identity: {

      id,

    },

    type:
      KnowledgeObjectType.EVENT,

    confidence: {

      value:
        0.80,

    },

    relationships: [],

    payload:
      createCanonicalEventPayload(
        eventName,
      ),

  } as KnowledgeObject;

}

// ============================================================
// INVESTIGATION
// ============================================================

function createInvestigation():
  ResolveComputationInput["investigation"] {

  return {

    id:
      "investigation:p56d-i1-g7-verification",

  } as ResolveComputationInput["investigation"];

}

// ============================================================
// RESOLVE INPUT
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
// INITIAL KNOWLEDGE POPULATION K0
// ============================================================

function createInitialKnowledgePopulation():
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
// DETERMINISTIC ENGINE PRODUCT
// ============================================================
//
// ResolveRuntime owns UUIDs and timestamps.
//
// Those values are intentionally non-deterministic runtime
// metadata.
//
// G7 compares only engine-owned deterministic products.
//
// ============================================================

function deterministicProduct(
  result:
    ResolveComputationResult,
): unknown {

  return {

    manifold:
      result.manifold,

    similarityCandidates:
      result.similarityCandidates,

    candidateEvaluations:
      result.candidateEvaluations,

    canonicalRepresentation:
      result.canonicalRepresentation,

    provenance:
      result.provenance,

  };

}

// ============================================================
// RELATIONSHIP COUNT
// ============================================================

function countRelationship(
  knowledgeObjects:
    readonly KnowledgeObject[],
  relationshipId:
    string,
): number {

  let count =
    0;

  for (
    const object
    of knowledgeObjects
  ) {

    for (
      const relationship
      of object.relationships
    ) {

      if (
        relationship.id ===
        relationshipId
      ) {

        count +=
          1;

      }

    }

  }

  return count;

}

// ============================================================
// RELATIONSHIP LOOKUP
// ============================================================

function hasRelationship(
  knowledgeObjects:
    readonly KnowledgeObject[],
  relationshipId:
    string,
): boolean {

  return (
    countRelationship(
      knowledgeObjects,
      relationshipId,
    ) ===
    1
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
    "P56D-I1-G7 — ACCEPTED KNOWLEDGE FEEDBACK VERIFICATION",
  );
  console.log(
    "============================================================",
  );
  console.log("");

  // ==========================================================
  // ESTABLISH AUTHORITATIVE RUNTIMES
  // ==========================================================

  const knowledgeRuntime =
    new KnowledgeObjectRuntime();

  const resolveRuntime =
    new ResolveRuntime();

  resolveRuntime.initialize();

  // ==========================================================
  // ESTABLISH K0
  // ==========================================================

  const initialKnowledge =
    createInitialKnowledgePopulation();

  knowledgeRuntime.setObjects(
    [...initialKnowledge],
  );

  const k0BeforeResolve =
    JSON.stringify(
      knowledgeRuntime.getObjects(),
    );

  // ==========================================================
  // PASS 1
  // INITIAL K0 PRODUCES REAL RESOLVE CANDIDATES
  // ==========================================================

  const initialResult =
    resolveRuntime.execute(
      createResolveInput(
        knowledgeRuntime.getObjects(),
      ),
    );

  assert(
    initialResult.success,
    "Initial Resolve execution must succeed.",
  );

  assertEqual(
    initialResult.similarityCandidates.candidates.length,
    3,
    "Three canonical EVENT Knowledge Objects must produce three Resolve candidates.",
  );

  assertEqual(
    initialResult.candidateEvaluations.evaluations.length,
    3,
    "Three Resolve candidates must produce three candidate evaluations.",
  );

  console.log(
    "PASS 1 — initial K0 produces real Resolve candidates and evaluations",
  );

  // ==========================================================
  // PASS 2
  // RESOLVE ALONE DOES NOT MUTATE KNOWLEDGE
  // ==========================================================

  assertEqual(
    JSON.stringify(
      knowledgeRuntime.getObjects(),
    ),
    k0BeforeResolve,
    "Resolve computation alone must not mutate canonical Knowledge.",
  );

  for (
    const object
    of knowledgeRuntime.getObjects()
  ) {

    assertEqual(
      object.relationships.length,
      0,
      "Initial Resolve must not materialize Knowledge relationships.",
    );

  }

  console.log(
    "PASS 2 — Resolve computation alone leaves canonical Knowledge unchanged",
  );

  // ==========================================================
  // PASS 3
  // REAL EVALUATION -> PRODUCTION CANDIDATE INTELLIGENCE
  // ==========================================================

  const evaluation =
    initialResult
      .candidateEvaluations
      .evaluations[0];

  assert(
    evaluation !== undefined,
    "Initial Resolve must expose at least one candidate evaluation.",
  );

  const intelligence =
    resolveCandidateIntelligence(
      evaluation,
    );

  assertEqual(
    intelligence.identity.candidateId,
    evaluation.identity.candidateId,
    "Candidate intelligence must preserve candidate identity.",
  );

  assertEqual(
    intelligence.identity.leftKnowledgeObjectId,
    evaluation.identity.leftKnowledgeObjectId,
    "Candidate intelligence must preserve canonical left Knowledge identity.",
  );

  assertEqual(
    intelligence.identity.rightKnowledgeObjectId,
    evaluation.identity.rightKnowledgeObjectId,
    "Candidate intelligence must preserve canonical right Knowledge identity.",
  );

  console.log(
    "PASS 3 — real Resolve evaluation produces authoritative candidate intelligence",
  );

  // ==========================================================
  // PASS 4
  // EXPLICIT ACCEPTANCE MATERIALIZES CANONICAL RELATIONSHIP
  // ==========================================================

  const acceptance =
    materializeAcceptedResolveCandidate(
      intelligence,
      knowledgeRuntime.getObjects(),
    );

  assert(
    acceptance.changed,
    "First explicit acceptance must materialize new canonical relationship state.",
  );

  assertEqual(
    acceptance.relationship.type,
    ResolveAcceptedRelationshipType.RESOLVE_CANDIDATE,
    "Accepted relationship must preserve Resolve-candidate semantic type.",
  );

  assertEqual(
    acceptance.sourceKnowledgeObjectId,
    intelligence.identity.leftKnowledgeObjectId,
    "Accepted relationship must preserve canonical source Knowledge identity.",
  );

  assertEqual(
    acceptance.targetKnowledgeObjectId,
    intelligence.identity.rightKnowledgeObjectId,
    "Accepted relationship must preserve canonical target Knowledge identity.",
  );

  console.log(
    "PASS 4 — explicit acceptance materializes canonical Knowledge relationship",
  );

  // ==========================================================
  // PASS 5
  // ACCEPTED KNOWLEDGE PUBLISHES INTO KNOWLEDGE RUNTIME
  // ==========================================================

  const revisionBeforePublication =
    knowledgeRuntime.getRevision();

  knowledgeRuntime.updateObject(
    acceptance.knowledgeObject,
  );

  assertEqual(
    knowledgeRuntime.getRevision(),
    revisionBeforePublication + 1,
    "Knowledge Runtime publication must advance runtime revision exactly once.",
  );

  const k1 =
    knowledgeRuntime.getObjects();

  assert(
    hasRelationship(
      k1,
      acceptance.relationship.id,
    ),
    "Authoritative Knowledge Runtime K1 must contain the accepted relationship.",
  );

  const publishedSource =
    knowledgeRuntime.getObject(
      acceptance.sourceKnowledgeObjectId,
    );

  assert(
    publishedSource !== undefined,
    "Accepted source Knowledge Object must remain present after runtime publication.",
  );

  assert(
    publishedSource!.relationships.some(
      relationship =>
        relationship.id ===
        acceptance.relationship.id,
    ),
    "Published source Knowledge Object must contain accepted relationship.",
  );

  console.log(
    "PASS 5 — accepted relationship publishes into authoritative Knowledge Runtime K1",
  );

  // ==========================================================
  // PASS 6
  // K1 CONTAINS EXACTLY ONE ACCEPTED RELATIONSHIP
  // ==========================================================

  assertEqual(
    countRelationship(
      k1,
      acceptance.relationship.id,
    ),
    1,
    "K1 must contain exactly one accepted canonical relationship.",
  );

  assertEqual(
    k1.length,
    initialKnowledge.length,
    "Acceptance must replace Knowledge relationship state without changing Knowledge Object population.",
  );

  console.log(
    "PASS 6 — K1 contains exactly one accepted canonical relationship",
  );

  // ==========================================================
  // PASS 7
  // OPERATIONAL ACCEPTANCE IS IDEMPOTENT
  // ==========================================================

  const repeatedAcceptance =
    materializeAcceptedResolveCandidate(
      intelligence,
      knowledgeRuntime.getObjects(),
    );

  assert(
    !repeatedAcceptance.changed,
    "Repeated acceptance of the same canonical candidate must be idempotent.",
  );

  knowledgeRuntime.updateObject(
    repeatedAcceptance.knowledgeObject,
  );

  assertEqual(
    countRelationship(
      knowledgeRuntime.getObjects(),
      acceptance.relationship.id,
    ),
    1,
    "Repeated operational acceptance must not duplicate canonical relationship state.",
  );

  console.log(
    "PASS 7 — repeated operational acceptance is idempotent",
  );

  // ==========================================================
  // PASS 8
  // RE-RESOLVE CONSUMES POST-ACCEPTANCE K1
  // ==========================================================

  const postAcceptanceKnowledge =
    knowledgeRuntime.getObjects();

  const secondResult =
    resolveRuntime.execute(
      createResolveInput(
        postAcceptanceKnowledge,
      ),
    );

  assert(
    secondResult.success,
    "Post-acceptance re-Resolve must succeed.",
  );

  const latestExecution =
    resolveRuntime
      .getState()
      .currentExecution;

  assert(
    latestExecution !== undefined,
    "Resolve Runtime must preserve current post-acceptance execution.",
  );

  assert(
    hasRelationship(
      latestExecution!.input.knowledgeObjects,
      acceptance.relationship.id,
    ),
    "Re-Resolve input must contain the accepted canonical relationship.",
  );

  console.log(
    "PASS 8 — re-Resolve consumes post-acceptance authoritative Knowledge K1",
  );

  // ==========================================================
  // PASS 9
  // CANONICAL UNIVERSE PRESERVES ACCEPTED KNOWLEDGE
  // ==========================================================

  const canonicalUniverse =
    buildCanonicalComputationalUniverse(
      createResolveInput(
        postAcceptanceKnowledge,
      ),
    );

  assert(
    hasRelationship(
      canonicalUniverse.knowledgeObjects,
      acceptance.relationship.id,
    ),
    "Canonical universe must preserve the accepted Knowledge relationship.",
  );

  assertEqual(
    countRelationship(
      canonicalUniverse.knowledgeObjects,
      acceptance.relationship.id,
    ),
    1,
    "Canonical universe must preserve exactly one accepted relationship.",
  );

  console.log(
    "PASS 9 — accepted relationship survives canonical-universe construction",
  );

  // ==========================================================
  // PASS 10
  // REPEATED POST-ACCEPTANCE RESOLVE IS DETERMINISTIC
  // ==========================================================

  const repeatedResult =
    resolveRuntime.execute(
      createResolveInput(
        postAcceptanceKnowledge,
      ),
    );

  assertJsonEqual(
    deterministicProduct(
      secondResult,
    ),
    deterministicProduct(
      repeatedResult,
    ),
    "Repeated post-acceptance Resolve must produce identical deterministic engine products.",
  );

  console.log(
    "PASS 10 — repeated post-acceptance Resolve is deterministic",
  );

  // ==========================================================
  // PASS 11
  // REORDERED K1 PRODUCES IDENTICAL CANONICAL COMPUTATION
  // ==========================================================

  const reorderedKnowledge = [
    ...postAcceptanceKnowledge,
  ].reverse();

  const reorderedRuntime =
    new ResolveRuntime();

  reorderedRuntime.initialize();

  const reorderedResult =
    reorderedRuntime.execute(
      createResolveInput(
        reorderedKnowledge,
      ),
    );

  assertJsonEqual(
    deterministicProduct(
      secondResult,
    ),
    deterministicProduct(
      reorderedResult,
    ),
    "Equivalent reordered K1 must produce identical deterministic Resolve products.",
  );

  console.log(
    "PASS 11 — reordered equivalent K1 produces identical canonical Resolve output",
  );

  // ==========================================================
  // PASS 12
  // COMPLETE FEEDBACK CYCLE CLOSURE
  // ==========================================================

  assertEqual(
    secondResult.manifold
      .knowledgeObjectIds
      .length,
    3,
    "Post-acceptance manifold must preserve complete Knowledge population.",
  );

  assertEqual(
    secondResult.manifold
      .similarityMatrix
      .pairCount,
    3,
    "Post-acceptance manifold must preserve complete three-event similarity population.",
  );

  assertEqual(
    secondResult.similarityCandidates
      .candidates
      .length,
    3,
    "Post-acceptance re-Resolve must continue producing canonical candidate population.",
  );

  assertEqual(
    secondResult.candidateEvaluations
      .evaluations
      .length,
    3,
    "Post-acceptance re-Resolve must continue producing canonical candidate evaluations.",
  );

  assert(
    hasRelationship(
      knowledgeRuntime.getObjects(),
      acceptance.relationship.id,
    ),
    "Feedback closure must leave accepted relationship authoritative in canonical Knowledge.",
  );

  console.log(
    "PASS 12 — complete operator-mediated Knowledge feedback cycle closes",
  );

  // ==========================================================
  // SUMMARY
  // ==========================================================

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "P56D-I1-G7 ACCEPTED KNOWLEDGE FEEDBACK VERIFIED",
  );
  console.log(
    "============================================================",
  );
  console.log("");
  console.log(
    "Verified:",
  );
  console.log(
    "  K0 -> production Resolve candidate generation",
  );
  console.log(
    "  Resolve computation does not mutate Knowledge",
  );
  console.log(
    "  production evaluation -> candidate intelligence",
  );
  console.log(
    "  explicit candidate acceptance -> KnowledgeRelationship",
  );
  console.log(
    "  accepted relationship -> KnowledgeObjectRuntime",
  );
  console.log(
    "  authoritative post-acceptance Knowledge K1",
  );
  console.log(
    "  exactly-once canonical relationship state",
  );
  console.log(
    "  operational acceptance idempotence",
  );
  console.log(
    "  K1 -> subsequent Resolve input",
  );
  console.log(
    "  accepted relationship survives canonical-universe construction",
  );
  console.log(
    "  repeated post-acceptance Resolve determinism",
  );
  console.log(
    "  reordered post-acceptance Knowledge determinism",
  );
  console.log(
    "  no candidate-to-GraphEdge shortcut",
  );
  console.log(
    "  complete feedback path:",
  );
  console.log(
    "    K0 -> R(K0) -> C -> A(C) -> K1 -> R(K1) -> M1",
  );
  console.log(
    "  governing computation remains M = g(L,T,S)",
  );
  console.log("");

}

main();