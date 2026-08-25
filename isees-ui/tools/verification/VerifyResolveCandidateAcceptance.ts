// ============================================================
// tools/verification/VerifyResolveCandidateAcceptance.ts
//
// P56D-I1-G6
// RESOLVE CANDIDATE ACCEPTANCE VERIFICATION
//
// Verifies the explicit epistemic transition:
//
//   Candidate Intelligence
//          ↓
//   OPERATOR ACCEPTANCE
//          ↓
//   KnowledgeRelationship
//
// CRITICAL RULE:
//
//   CANDIDATE != RELATIONSHIP
//
// Only explicit acceptance may materialize the candidate into
// canonical Knowledge relationship state.
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
} from "../../src/resolve/evaluation/CanonicalSimilarityCandidateEvaluationTypes";

import {
  resolveCandidateIntelligence,
} from "../../src/resolve/intelligence/ResolveCandidateIntelligenceResolver";

import type {
  KnowledgeObject,
} from "../../src/knowledge/model/KnowledgeObject";

import {
  materializeAcceptedResolveCandidate,
  ResolveAcceptedRelationshipType,
} from "../../src/resolve/acceptance/ResolveCandidateAcceptance";

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
// CANONICAL DIMENSION VOCABULARY
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

// ============================================================
// DIMENSION FIXTURE HELPERS
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
      `Synthetic ${dimension} candidate-acceptance verification rationale.`,
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
// AUTHORITATIVE CANDIDATE FIXTURE
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
      "P56D-I1-G6-CANDIDATE",

  } as unknown as CanonicalSimilarityCandidate;

// ============================================================
// AUTHORITATIVE EVALUATION FIXTURE
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
            availableSource(
              NARRATIVE,
              0.72,
            ),

        },

        {

          dimension:
            OBSERVABILITY,

          status:
            CanonicalCandidateEvaluationDimensionStatus.AVAILABLE,

          source:
            availableSource(
              OBSERVABILITY,
              0,
            ),

        },

        {

          dimension:
            INFRASTRUCTURE,

          status:
            CanonicalCandidateEvaluationDimensionStatus.UNAVAILABLE,

          source:
            unavailableSource(
              INFRASTRUCTURE,
            ),

        },

        {

          dimension:
            TOPOLOGY,

          status:
            CanonicalCandidateEvaluationDimensionStatus.AVAILABLE,

          source:
            availableSource(
              TOPOLOGY,
              0.83,
            ),

        },

        {

          dimension:
            GEOGRAPHY,

          status:
            CanonicalCandidateEvaluationDimensionStatus.AVAILABLE,

          source:
            availableSource(
              GEOGRAPHY,
              0.14,
            ),

        },

      ],

      similarityRationale: [

        "Narrative evidence is canonically comparable.",
        "Observability evidence is AVAILABLE even when score is zero.",
        "Infrastructure evidence is UNAVAILABLE and is not zero.",
        "Topology evidence is canonically comparable.",
        "Geographic evidence is canonically comparable.",

      ],

    },

  };

// ============================================================
// PRODUCTION CANDIDATE INTELLIGENCE
// ============================================================

const intelligence =
  resolveCandidateIntelligence(
    evaluation,
  );

// ============================================================
// KNOWLEDGE FIXTURE
// ============================================================
//
// Acceptance only requires canonical identity + relationships.
//
// The remaining KnowledgeObject structure is deliberately
// synthetic because this verifier is testing the acceptance
// boundary, not Knowledge construction.
//
// ============================================================

function createKnowledgeObject(
  id: string,
): KnowledgeObject {

  return {

    identity: {

      id,

      type:
        "EVENT",

      version:
        1,

    },

    payload: {

      source:
        "P56D-I1-G6-VERIFICATION",

      data: {
        id,
      },

    },

    relationships: [],

    provenance: {

      sourceType:
        "SYSTEM",

      sourceId:
        "P56D-I1-G6",

      createdAt:
        "2000-01-01T00:00:00.000Z",

      updatedAt:
        "2000-01-01T00:00:00.000Z",

    },

    revision: {

      revision:
        1,

      timestamp:
        "2000-01-01T00:00:00.000Z",

    },

  } as unknown as KnowledgeObject;

}

const knowledgeA =
  createKnowledgeObject(
    "knowledge:A",
  );

const knowledgeB =
  createKnowledgeObject(
    "knowledge:B",
  );

const knowledgeUniverse = [
  knowledgeA,
  knowledgeB,
] as const;

// ============================================================
// SOURCE SNAPSHOTS
// ============================================================

const knowledgeUniverseBefore =
  canonicalJson(
    knowledgeUniverse,
  );

const intelligenceBefore =
  canonicalJson(
    intelligence,
  );

// ============================================================
// PASS 1
// VALID CANDIDATE MATERIALIZES EXACTLY ONE RELATIONSHIP
// ============================================================

const first =
  materializeAcceptedResolveCandidate(
    intelligence,
    knowledgeUniverse,
  );

assertEqual(
  first.changed,
  true,
  "first acceptance must report a material change",
);

assertEqual(
  first.knowledgeObject.relationships.length,
  1,
  "first acceptance must materialize exactly one relationship",
);

console.log(
  "PASS 1 — valid candidate materializes exactly one Knowledge relationship",
);

// ============================================================
// PASS 2
// DETERMINISTIC RELATIONSHIP IDENTITY
// ============================================================

assertEqual(
  first.relationship.id,
  "resolve-relationship:candidate:knowledge:A::knowledge:B",
  "relationship identity must derive deterministically from candidate identity",
);

assertEqual(
  first.relationship.type,
  ResolveAcceptedRelationshipType.RESOLVE_CANDIDATE,
  "relationship must carry the accepted Resolve candidate semantic",
);

console.log(
  "PASS 2 — accepted relationship identity and semantic type are deterministic",
);

// ============================================================
// PASS 3
// PAIR ORIENTATION
// ============================================================

assertEqual(
  first.sourceKnowledgeObjectId,
  "knowledge:A",
  "left Knowledge identity must remain the relationship source",
);

assertEqual(
  first.targetKnowledgeObjectId,
  "knowledge:B",
  "right Knowledge identity must remain the relationship target",
);

assertEqual(
  first.relationship.targetId,
  "knowledge:B",
  "materialized relationship must target the canonical right Knowledge Object",
);

console.log(
  "PASS 3 — canonical left/right pair orientation is preserved",
);

// ============================================================
// PASS 4
// SOURCE OBJECT IMMUTABILITY
// ============================================================

assertEqual(
  knowledgeA.relationships.length,
  0,
  "source Knowledge fixture must not be mutated in place",
);

assert(
  first.knowledgeObject !== knowledgeA,
  "changed acceptance must return a new KnowledgeObject instance",
);

const expectedSource = {

  ...knowledgeA,

  relationships: [
    first.relationship,
  ],

};

assertJsonEqual(
  first.knowledgeObject,
  expectedSource,
  "acceptance must preserve all source Knowledge fields except the appended relationship",
);

console.log(
  "PASS 4 — source Knowledge is preserved immutably",
);

// ============================================================
// PASS 5
// TARGET OBJECT UNCHANGED
// ============================================================

assertEqual(
  knowledgeB.relationships.length,
  0,
  "target Knowledge Object must not be mutated",
);

console.log(
  "PASS 5 — target Knowledge remains unchanged",
);

// ============================================================
// PASS 6
// IDEMPOTENCE
// ============================================================

const second =
  materializeAcceptedResolveCandidate(
    intelligence,
    [
      first.knowledgeObject,
      knowledgeB,
    ],
  );

assertEqual(
  second.changed,
  false,
  "repeated acceptance must be idempotent",
);

assertEqual(
  second.knowledgeObject.relationships.length,
  1,
  "repeated acceptance must not duplicate the relationship",
);

assertJsonEqual(
  second.knowledgeObject,
  first.knowledgeObject,
  "repeated acceptance must preserve the already-materialized source exactly",
);

console.log(
  "PASS 6 — repeated candidate acceptance is idempotent",
);

// ============================================================
// PASS 7
// MISSING SOURCE REJECTED
// ============================================================

assertThrows(
  () =>
    materializeAcceptedResolveCandidate(
      intelligence,
      [
        knowledgeB,
      ],
    ),
  "acceptance must reject a missing source Knowledge Object",
);

console.log(
  "PASS 7 — missing source Knowledge Object is rejected",
);

// ============================================================
// PASS 8
// MISSING TARGET REJECTED
// ============================================================

assertThrows(
  () =>
    materializeAcceptedResolveCandidate(
      intelligence,
      [
        knowledgeA,
      ],
    ),
  "acceptance must reject a missing target Knowledge Object",
);

console.log(
  "PASS 8 — missing target Knowledge Object is rejected",
);

// ============================================================
// PASS 9
// DUPLICATE KNOWLEDGE IDENTITY REJECTED
// ============================================================

assertThrows(
  () =>
    materializeAcceptedResolveCandidate(
      intelligence,
      [
        knowledgeA,
        createKnowledgeObject(
          "knowledge:A",
        ),
        knowledgeB,
      ],
    ),
  "acceptance must reject ambiguous duplicate Knowledge identity",
);

console.log(
  "PASS 9 — ambiguous duplicate Knowledge identity is rejected",
);

// ============================================================
// PASS 10
// CONFLICTING RELATIONSHIP IDENTITY REJECTED
// ============================================================

const conflictingSource =
  {

    ...knowledgeA,

    relationships: [

      {

        id:
          "resolve-relationship:candidate:knowledge:A::knowledge:B",

        type:
          "CONFLICTING_RELATIONSHIP",

        targetId:
          "knowledge:B",

      },

    ],

  } as KnowledgeObject;

assertThrows(
  () =>
    materializeAcceptedResolveCandidate(
      intelligence,
      [
        conflictingSource,
        knowledgeB,
      ],
    ),
  "acceptance must reject conflicting semantics under the same deterministic relationship identity",
);

console.log(
  "PASS 10 — conflicting existing relationship identity is rejected",
);

// ============================================================
// PASS 11
// INPUT ORDER INVARIANCE
// ============================================================

const reordered =
  materializeAcceptedResolveCandidate(
    intelligence,
    [
      knowledgeB,
      knowledgeA,
    ],
  );

assertJsonEqual(
  reordered,
  first,
  "equivalent Knowledge universes with different input ordering must produce identical acceptance output",
);

console.log(
  "PASS 11 — Knowledge input ordering does not affect acceptance",
);

// ============================================================
// PASS 12
// NO INPUT MUTATION
// ============================================================

assertEqual(
  canonicalJson(
    knowledgeUniverse,
  ),
  knowledgeUniverseBefore,
  "acceptance must not mutate the supplied Knowledge universe",
);

assertEqual(
  canonicalJson(
    intelligence,
  ),
  intelligenceBefore,
  "acceptance must not mutate Candidate Intelligence",
);

console.log(
  "PASS 12 — candidate and Knowledge inputs remain unchanged",
);

// ============================================================
// VERIFIED
// ============================================================

console.log("");
console.log(
  "============================================================",
);
console.log(
  "P56D-I1-G6 RESOLVE CANDIDATE ACCEPTANCE VERIFIED",
);
console.log(
  "============================================================",
);
console.log("");
console.log(
  "Verified:",
);
console.log(
  "  Candidate != Relationship until explicit acceptance",
);
console.log(
  "  deterministic relationship identity",
);
console.log(
  "  canonical left -> right orientation",
);
console.log(
  "  immutable Knowledge materialization",
);
console.log(
  "  target preservation",
);
console.log(
  "  idempotent repeated acceptance",
);
console.log(
  "  missing source rejection",
);
console.log(
  "  missing target rejection",
);
console.log(
  "  duplicate Knowledge identity rejection",
);
console.log(
  "  conflicting relationship identity rejection",
);
console.log(
  "  Knowledge input-order invariance",
);
console.log(
  "  zero mutation of candidate / Knowledge inputs",
);