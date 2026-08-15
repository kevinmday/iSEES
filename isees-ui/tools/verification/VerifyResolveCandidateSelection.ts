// ============================================================
// tools/verification/VerifyResolveCandidateSelection.ts
//
// P56D-G
// RESOLVE CANDIDATE SELECTION VERIFICATION
//
// Verifies the deterministic operator-selection round trip:
//
//                 Ic -> Sc -> Ic
//
// where:
//
//   Ic = Resolve Candidate Intelligence
//   Sc = Workspace Candidate Selection
//
// COMPLETE VERIFIED PATH BEING EXTENDED
//
//                 U
//                 ↓
//                 M
//                 ↓
//                 C
//                 ↓
//                 E
//                 ↓
//                 Ic
//                 ↓
//                 Sc
//                 ↓
//                 Ic
//
// CRITICAL EPISTEMIC RULE
//
//                 CANDIDATE != EDGE
//
// Candidate selection is inspection state only.
//
// It MUST NOT:
//
//   • establish a relationship
//   • create a GraphEdge
//   • mutate graph topology
//   • promote Knowledge
//   • generate a Research Vector
//   • execute REX
//   • recompute similarity
//   • recompute evaluation
//   • reverse Knowledge pair orientation
//   • repair malformed lineage
//   • guess ambiguous identity
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
  ResolveCandidateEpistemicStatus,
  ResolveCandidateIntelligenceKind,
} from "../../src/resolve/intelligence/ResolveCandidateIntelligenceTypes";

import {
  resolveCandidateIntelligence,
} from "../../src/resolve/intelligence/ResolveCandidateIntelligenceResolver";

import {
  createWorkspaceCandidateSelection,
  resolveOptionalSelectedCandidateIntelligence,
  resolveSelectedCandidateIntelligence,
  validateCandidateIntelligenceLineage,
  validateWorkspaceCandidateSelection,
} from "../../src/resolve/intelligence/ResolveCandidateSelection";

import {
  WorkspaceSelectionKind,
} from "../../src/workspace/runtime/WorkspaceRuntimeTypes";

import type {
  WorkspaceCandidateSelection,
  WorkspaceEdgeSelection,
  WorkspaceNodeSelection,
  WorkspaceNoneSelection,
} from "../../src/workspace/runtime/WorkspaceRuntimeTypes";

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
      `Synthetic ${dimension} candidate-selection verification rationale.`,
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
      "P56D-G-CANDIDATE",

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
// CANDIDATE INTELLIGENCE FIXTURE
// ============================================================
//
// E -> Ic is already verified independently in P56D-F.
//
// We deliberately obtain Ic through the production resolver
// rather than constructing Candidate Intelligence manually.
//
// ============================================================

const intelligence =
  resolveCandidateIntelligence(
    evaluation,
  );

// ============================================================
// SOURCE SNAPSHOTS
// ============================================================

const evaluationBefore =
  canonicalJson(
    evaluation,
  );

const intelligenceBefore =
  canonicalJson(
    intelligence,
  );

// ============================================================
// TEST 1
// Ic -> Sc IS DETERMINISTIC
// ============================================================

const selectionA =
  createWorkspaceCandidateSelection(
    intelligence,
  );

const selectionB =
  createWorkspaceCandidateSelection(
    intelligence,
  );

assertJsonEqual(

  selectionA,

  selectionB,

  "Repeated Ic -> Sc projection must produce equivalent selection.",

);

console.log(
  "PASS 1 — repeated Ic -> Sc projection is deterministic",
);

// ============================================================
// TEST 2
// CANDIDATE IDENTITY SURVIVES EXACTLY
// ============================================================

assertEqual(

  selectionA.candidateId,

  intelligence.identity.candidateId,

  "Candidate identity must survive Ic -> Sc exactly.",

);

console.log(
  "PASS 2 — candidate identity survives candidate selection exactly",
);

// ============================================================
// TEST 3
// EVALUATION IDENTITY SURVIVES EXACTLY
// ============================================================

assertEqual(

  selectionA.evaluationId,

  intelligence.identity.evaluationId,

  "Evaluation identity must survive Ic -> Sc exactly.",

);

console.log(
  "PASS 3 — evaluation identity survives candidate selection exactly",
);

// ============================================================
// TEST 4
// KNOWLEDGE PAIR LINEAGE AND ORIENTATION SURVIVE EXACTLY
// ============================================================

assertEqual(

  selectionA.leftKnowledgeObjectId,

  intelligence.identity.leftKnowledgeObjectId,

  "Left Knowledge Object identity must survive exactly.",

);

assertEqual(

  selectionA.rightKnowledgeObjectId,

  intelligence.identity.rightKnowledgeObjectId,

  "Right Knowledge Object identity must survive exactly.",

);

assertEqual(

  selectionA.leftKnowledgeObjectId,

  "knowledge:A",

  "Left Knowledge orientation must remain knowledge:A.",

);

assertEqual(

  selectionA.rightKnowledgeObjectId,

  "knowledge:B",

  "Right Knowledge orientation must remain knowledge:B.",

);

console.log(
  "PASS 4 — Knowledge pair lineage and orientation survive candidate selection exactly",
);

// ============================================================
// TEST 5
// SELECTION KIND IS EXPLICITLY CANDIDATE
// ============================================================

assertEqual(

  selectionA.kind,

  WorkspaceSelectionKind.CANDIDATE,

  "Resolve candidate selection must be explicitly CANDIDATE.",

);

assert(

  selectionA.kind !==
    (WorkspaceSelectionKind.EDGE as typeof selectionA.kind),

  "Candidate selection must never be represented as EDGE.",

);

console.log(
  "PASS 5 — operator selection is explicitly CANDIDATE and not EDGE",
);

// ============================================================
// TEST 6
// Ic -> Sc -> Ic RETURNS SAME AUTHORITATIVE OBJECT
// ============================================================

const resolvedRoundTrip =
  resolveSelectedCandidateIntelligence(
    selectionA,
    [
      intelligence,
    ],
  );

assert(

  resolvedRoundTrip ===
    intelligence,

  "Ic -> Sc -> Ic must return the same authoritative Candidate Intelligence object.",

);

assertEqual(

  resolvedRoundTrip?.kind,

  ResolveCandidateIntelligenceKind.CANDIDATE,

  "Resolved intelligence must remain CANDIDATE intelligence.",

);

assertEqual(

  resolvedRoundTrip?.epistemicStatus,

  ResolveCandidateEpistemicStatus.POTENTIAL_RELATIONSHIP,

  "Resolved intelligence must remain POTENTIAL_RELATIONSHIP.",

);

console.log(
  "PASS 6 — Ic -> Sc -> Ic returns the same authoritative Candidate Intelligence object",
);

// ============================================================
// TEST 7
// NON-CANDIDATE SELECTIONS DO NOT RESOLVE Ic
// ============================================================

const noneSelection:
  WorkspaceNoneSelection = {

    kind:
      WorkspaceSelectionKind.NONE,

  };

const nodeSelection:
  WorkspaceNodeSelection = {

    kind:
      WorkspaceSelectionKind.NODE,

    nodeId:
      "node:A",

  };

const edgeSelection:
  WorkspaceEdgeSelection = {

    kind:
      WorkspaceSelectionKind.EDGE,

    edgeId:
      "edge:A::B",

  };

assertEqual(

  resolveOptionalSelectedCandidateIntelligence(
    undefined,
    [
      intelligence,
    ],
  ),

  undefined,

  "Undefined Workspace selection must not resolve Candidate Intelligence.",

);

assertEqual(

  resolveSelectedCandidateIntelligence(
    noneSelection,
    [
      intelligence,
    ],
  ),

  undefined,

  "NONE selection must not resolve Candidate Intelligence.",

);

assertEqual(

  resolveSelectedCandidateIntelligence(
    nodeSelection,
    [
      intelligence,
    ],
  ),

  undefined,

  "NODE selection must not resolve Candidate Intelligence.",

);

assertEqual(

  resolveSelectedCandidateIntelligence(
    edgeSelection,
    [
      intelligence,
    ],
  ),

  undefined,

  "EDGE selection must not resolve Candidate Intelligence.",

);

console.log(
  "PASS 7 — undefined, NONE, NODE, and EDGE selections do not resolve Candidate Intelligence",
);

// ============================================================
// TEST 8
// MISSING CANDIDATE IS REJECTED
// ============================================================

const missingCandidateSelection:
  WorkspaceCandidateSelection = {

    kind:
      WorkspaceSelectionKind.CANDIDATE,

    candidateId:
      "candidate:knowledge:X::knowledge:Y",

    evaluationId:
      "evaluation:candidate:knowledge:X::knowledge:Y",

    leftKnowledgeObjectId:
      "knowledge:X",

    rightKnowledgeObjectId:
      "knowledge:Y",

  };

assertThrows(

  () =>
    resolveSelectedCandidateIntelligence(
      missingCandidateSelection,
      [
        intelligence,
      ],
    ),

  "Missing candidate identity must be rejected rather than guessed.",

);

console.log(
  "PASS 8 — missing candidate identity is rejected rather than guessed",
);

// ============================================================
// TEST 9
// DUPLICATE CANDIDATE IDENTITY IS REJECTED AS AMBIGUOUS
// ============================================================
//
// The duplicate need not be a distinct semantic evaluation.
//
// The invariant being tested is that two intelligence objects
// carrying the same canonical candidateId create ambiguity.
//
// The resolver must never choose one arbitrarily.
//
// ============================================================

const duplicateIntelligence =
  {

    ...intelligence,

    explanation: {

      ...intelligence.explanation,

      similarityRationale: [
        ...intelligence.explanation.similarityRationale,
      ],

    },

  };

assertThrows(

  () =>
    resolveSelectedCandidateIntelligence(
      selectionA,
      [
        intelligence,
        duplicateIntelligence,
      ],
    ),

  "Duplicate candidate identity must be rejected as ambiguous.",

);

console.log(
  "PASS 9 — duplicate candidate identity is rejected as ambiguous",
);

// ============================================================
// TEST 10
// WRONG EVALUATION LINEAGE IS REJECTED
// ============================================================

const wrongEvaluationSelection:
  WorkspaceCandidateSelection = {

    ...selectionA,

    evaluationId:
      "evaluation:forged",

  };

assertThrows(

  () =>
    resolveSelectedCandidateIntelligence(
      wrongEvaluationSelection,
      [
        intelligence,
      ],
    ),

  "Candidate selection with forged evaluation lineage must be rejected.",

);

console.log(
  "PASS 10 — forged evaluation lineage is rejected",
);

// ============================================================
// TEST 11
// REVERSED KNOWLEDGE ORIENTATION IS REJECTED
// ============================================================

const reversedPairSelection:
  WorkspaceCandidateSelection = {

    ...selectionA,

    leftKnowledgeObjectId:
      selectionA.rightKnowledgeObjectId,

    rightKnowledgeObjectId:
      selectionA.leftKnowledgeObjectId,

  };

assertThrows(

  () =>
    resolveSelectedCandidateIntelligence(
      reversedPairSelection,
      [
        intelligence,
      ],
    ),

  "Reversed Knowledge pair orientation must be rejected.",

);

console.log(
  "PASS 11 — reversed Knowledge pair orientation is rejected rather than normalized",
);

// ============================================================
// TEST 12
// EMPTY SELECTION IDENTITIES ARE REJECTED
// ============================================================

const emptyCandidateIdSelection:
  WorkspaceCandidateSelection = {

    ...selectionA,

    candidateId:
      "   ",

  };

const emptyEvaluationIdSelection:
  WorkspaceCandidateSelection = {

    ...selectionA,

    evaluationId:
      "",

  };

const emptyLeftKnowledgeSelection:
  WorkspaceCandidateSelection = {

    ...selectionA,

    leftKnowledgeObjectId:
      " ",

  };

const emptyRightKnowledgeSelection:
  WorkspaceCandidateSelection = {

    ...selectionA,

    rightKnowledgeObjectId:
      "\t",

  };

assertThrows(

  () =>
    validateWorkspaceCandidateSelection(
      emptyCandidateIdSelection,
    ),

  "Empty candidateId must be rejected.",

);

assertThrows(

  () =>
    validateWorkspaceCandidateSelection(
      emptyEvaluationIdSelection,
    ),

  "Empty evaluationId must be rejected.",

);

assertThrows(

  () =>
    validateWorkspaceCandidateSelection(
      emptyLeftKnowledgeSelection,
    ),

  "Empty leftKnowledgeObjectId must be rejected.",

);

assertThrows(

  () =>
    validateWorkspaceCandidateSelection(
      emptyRightKnowledgeSelection,
    ),

  "Empty rightKnowledgeObjectId must be rejected.",

);

console.log(
  "PASS 12 — malformed empty candidate-selection identities are rejected",
);

// ============================================================
// TEST 13
// CORRUPTED Ic <-> E LINEAGE IS REJECTED
// ============================================================
//
// Forge Candidate Intelligence identity while retaining the
// authoritative source evaluation.
//
// Both creation and direct lineage validation must reject it.
//
// ============================================================

const corruptedIntelligence =
  {

    ...intelligence,

    identity: {

      ...intelligence.identity,

      evaluationId:
        "evaluation:corrupted",

    },

  };

assertThrows(

  () =>
    validateCandidateIntelligenceLineage(
      corruptedIntelligence,
    ),

  "Corrupted Candidate Intelligence lineage must be rejected.",

);

assertThrows(

  () =>
    createWorkspaceCandidateSelection(
      corruptedIntelligence,
    ),

  "Candidate selection must not be created from corrupted Candidate Intelligence lineage.",

);

console.log(
  "PASS 13 — corrupted Candidate Intelligence / source-evaluation lineage is rejected",
);

// ============================================================
// TEST 14
// SELECTION ROUND TRIP DOES NOT MUTATE E OR Ic
// ============================================================

const evaluationAfter =
  canonicalJson(
    evaluation,
  );

const intelligenceAfter =
  canonicalJson(
    intelligence,
  );

assertEqual(

  evaluationAfter,

  evaluationBefore,

  "Candidate selection operations must not mutate authoritative evaluation state.",

);

assertEqual(

  intelligenceAfter,

  intelligenceBefore,

  "Candidate selection operations must not mutate Candidate Intelligence state.",

);

console.log(
  "PASS 14 — candidate selection creation and resolution do not mutate E or Ic",
);

// ============================================================
// TEST 15
// SELECTION BRIDGE PRESERVES EPISTEMIC BOUNDARY
// ============================================================
//
// We verify the observable product of this module:
//
//   • selection is CANDIDATE
//   • intelligence remains CANDIDATE
//   • epistemic status remains POTENTIAL_RELATIONSHIP
//   • no GraphEdge-shaped identity is introduced
//
// The bridge exports no relationship, topology, Research
// Vector, or REX product.
//
// ============================================================

assertEqual(

  selectionA.kind,

  WorkspaceSelectionKind.CANDIDATE,

  "Selection bridge must emit CANDIDATE selection.",

);

assertEqual(

  intelligence.kind,

  ResolveCandidateIntelligenceKind.CANDIDATE,

  "Source intelligence must remain CANDIDATE.",

);

assertEqual(

  intelligence.epistemicStatus,

  ResolveCandidateEpistemicStatus.POTENTIAL_RELATIONSHIP,

  "Candidate Intelligence must remain POTENTIAL_RELATIONSHIP.",

);

assert(

  !("edgeId" in selectionA),

  "Candidate selection must not manufacture an edgeId.",

);

assert(

  !("relationshipId" in selectionA),

  "Candidate selection must not manufacture a relationshipId.",

);

assert(

  !("researchVectorId" in selectionA),

  "Candidate selection must not manufacture Research Vector identity.",

);

assert(

  !("rexExecutionId" in selectionA),

  "Candidate selection must not manufacture REX execution identity.",

);

console.log(
  "PASS 15 — selection bridge preserves candidate epistemic boundary and creates no topology, Research Vector, or REX state",
);

// ============================================================
// ADDITIONAL REORDERED POPULATION CHECK
// ============================================================
//
// Resolution must depend on canonical identity, not array
// position.
//
// Create a second unrelated Candidate Intelligence object,
// then verify that input order does not alter the selected
// result.
//
// ============================================================

const candidateTwo =
  {

    identity: {

      candidateId:
        "candidate:knowledge:C::knowledge:D",

      leftKnowledgeObjectId:
        "knowledge:C",

      rightKnowledgeObjectId:
        "knowledge:D",

    },

    verificationMarker:
      "P56D-G-CANDIDATE-2",

  } as unknown as CanonicalSimilarityCandidate;

const evaluationTwo =
  {

    ...evaluation,

    identity: {

      evaluationId:
        "evaluation:candidate:knowledge:C::knowledge:D",

      candidateId:
        "candidate:knowledge:C::knowledge:D",

      leftKnowledgeObjectId:
        "knowledge:C",

      rightKnowledgeObjectId:
        "knowledge:D",

    },

    candidate:
      candidateTwo,

  } as CanonicalSimilarityCandidateEvaluation;

const intelligenceTwo =
  resolveCandidateIntelligence(
    evaluationTwo,
  );

const reorderedResolutionA =
  resolveSelectedCandidateIntelligence(
    selectionA,
    [
      intelligence,
      intelligenceTwo,
    ],
  );

const reorderedResolutionB =
  resolveSelectedCandidateIntelligence(
    selectionA,
    [
      intelligenceTwo,
      intelligence,
    ],
  );

assert(

  reorderedResolutionA ===
    intelligence,

  "Selected Candidate Intelligence must resolve correctly in forward population order.",

);

assert(

  reorderedResolutionB ===
    intelligence,

  "Selected Candidate Intelligence must resolve correctly in reversed population order.",

);

// ============================================================
// RESULT
// ============================================================

console.log("");
console.log(
  "============================================================",
);
console.log(
  " P56D-G RESOLVE CANDIDATE SELECTION VERIFIED",
);
console.log(
  "============================================================",
);
console.log("");
console.log(
  "Verified:",
);
console.log(
  "  deterministic Ic -> Sc projection",
);
console.log(
  "  candidate identity preservation",
);
console.log(
  "  evaluation identity preservation",
);
console.log(
  "  Knowledge pair lineage preservation",
);
console.log(
  "  Knowledge pair orientation preservation",
);
console.log(
  "  explicit CANDIDATE Workspace selection",
);
console.log(
  "  CANDIDATE / EDGE structural distinction",
);
console.log(
  "  authoritative Ic -> Sc -> Ic round trip",
);
console.log(
  "  non-candidate selection isolation",
);
console.log(
  "  missing candidate rejection",
);
console.log(
  "  duplicate candidate ambiguity rejection",
);
console.log(
  "  forged evaluation lineage rejection",
);
console.log(
  "  reversed pair rejection",
);
console.log(
  "  empty identity rejection",
);
console.log(
  "  corrupted Ic / E lineage rejection",
);
console.log(
  "  source evaluation immutability",
);
console.log(
  "  Candidate Intelligence immutability",
);
console.log(
  "  population input-order independence",
);
console.log(
  "  no GraphEdge creation",
);
console.log(
  "  no relationship assertion",
);
console.log(
  "  no Research Vector generation",
);
console.log(
  "  no REX execution state",
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
  "Candidate operator selection:",
);
console.log(
  "  Sc = s(Ic)",
);
console.log("");
console.log(
  "Candidate inspection resolution:",
);
console.log(
  "  Ic = r(Sc, Ic[])",
);
console.log("");
console.log(
  "Current deterministic inspection path:",
);
console.log(
  "  U -> M -> C -> E -> Ic -> Sc -> Ic",
);
console.log("");
console.log(
  "Epistemic boundary:",
);
console.log(
  "  Candidate selection means the operator is inspecting",
);
console.log(
  "  a potential relationship.",
);
console.log(
  "  It does NOT establish that relationship.",
);
console.log(
  "  It does NOT create graph topology.",
);
console.log(
  "  It does NOT generate a Research Vector.",
);
console.log(
  "  It does NOT execute REX.",
);
console.log("");
console.log(
  "All 15 Candidate Selection invariants passed.",
);

// ============================================================
// END
// ============================================================