import {
  CANONICAL_EVENTS,
} from "../../src/canonical/runtimeCorpus";

import {
  resolveComparePairProjection,
} from "../../src/compare/projection/ComparePairProjectionResolver";

import {
  ComparePairProjectionStatus,
} from "../../src/compare/projection/ComparePairProjectionTypes";

import {
  adaptSystemCanonToKnowledge,
} from "../../src/knowledge/ingestion/SystemCanonKnowledgeAdapter";

import type {
  KnowledgeObject,
} from "../../src/knowledge/model/KnowledgeObject";

import {
  KnowledgeObjectType,
} from "../../src/knowledge/model/KnowledgeObjectTypes";

import type {
  CanonicalSimilarityCandidate,
} from "../../src/resolve/candidates/CanonicalSimilarityCandidateTypes";

import {
  CanonicalCandidateEvaluationDimensionStatus,

  type CanonicalSimilarityCandidateEvaluation,
} from "../../src/resolve/evaluation/CanonicalSimilarityCandidateEvaluationTypes";

import type {
  CanonicalFeatureDimension,
} from "../../src/resolve/features/CanonicalKnowledgeFeatureTypes";

import {
  resolveCandidateIntelligence,
} from "../../src/resolve/intelligence/ResolveCandidateIntelligenceResolver";

import {
  createWorkspaceCandidateSelection,
} from "../../src/resolve/intelligence/ResolveCandidateSelection";

import type {
  CanonicalDimensionSimilarity,
} from "../../src/resolve/similarity/CanonicalKnowledgeSimilarityTypes";

import {
  WorkspaceSelectionKind,

  type WorkspaceSelection,
} from "../../src/workspace/runtime/WorkspaceRuntimeTypes";

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

  assert(
    actual === expected,
    message,
  );

}

function assertThrows(
  operation: () => unknown,
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

let passCount = 0;

function pass(
  message: string,
): void {

  passCount += 1;
  console.log(
    `PASS ${passCount} — ${message}`,
  );

}

const TICTAC_EVENT_ID =
  "E-TICTAC-2004";

const ROOSEVELT_EVENT_ID =
  "E-ROOSEVELT-2015";

const TICTAC_KNOWLEDGE_ID =
  "system:event:E-TICTAC-2004";

const ROOSEVELT_KNOWLEDGE_ID =
  "system:event:E-ROOSEVELT-2015";

const canonicalEvents =
  CANONICAL_EVENTS.filter(
    event =>
      event.event_id === TICTAC_EVENT_ID ||
      event.event_id === ROOSEVELT_EVENT_ID,
  );

assertEqual(
  canonicalEvents.length,
  2,
  "Canonical Tic Tac and Roosevelt events must exist.",
);

const knowledgeObjects =
  adaptSystemCanonToKnowledge(
    canonicalEvents,
  );

const dimensions = [
  "NARRATIVE",
  "OBSERVABILITY",
  "INFRASTRUCTURE",
  "TOPOLOGY",
  "GEOGRAPHY",
] as const satisfies readonly CanonicalFeatureDimension[];

function available(
  dimension: CanonicalFeatureDimension,
  similarity: number,
): CanonicalDimensionSimilarity {

  return {
    availability: "AVAILABLE",
    dimension,
    similarity,
    weight: 1,
  };

}

function unavailable(
  dimension: CanonicalFeatureDimension,
): CanonicalDimensionSimilarity {

  return {
    availability: "UNAVAILABLE",
    dimension,
    reason: `${dimension} unavailable for projection verification.`,
  };

}

const sources: readonly CanonicalDimensionSimilarity[] = [
  available(dimensions[0], 0.71),
  available(dimensions[1], 0),
  unavailable(dimensions[2]),
  available(dimensions[3], 0.84),
  available(dimensions[4], 0.19),
];

const candidate = {
  identity: {
    candidateId:
      `candidate:${TICTAC_KNOWLEDGE_ID}::${ROOSEVELT_KNOWLEDGE_ID}`,
    leftKnowledgeObjectId:
      TICTAC_KNOWLEDGE_ID,
    rightKnowledgeObjectId:
      ROOSEVELT_KNOWLEDGE_ID,
  },
} as unknown as CanonicalSimilarityCandidate;

const evaluation: CanonicalSimilarityCandidateEvaluation = {
  identity: {
    evaluationId:
      `evaluation:${candidate.identity.candidateId}`,
    candidateId:
      candidate.identity.candidateId,
    leftKnowledgeObjectId:
      TICTAC_KNOWLEDGE_ID,
    rightKnowledgeObjectId:
      ROOSEVELT_KNOWLEDGE_ID,
  },
  candidate,
  explanation: {
    aggregate: {
      aggregateSimilarity: 0.435,
      participatingDimensionCount: 4,
      totalDimensionCount: 5,
    },
    evidence: {
      availableDimensions: [
        dimensions[0],
        dimensions[1],
        dimensions[3],
        dimensions[4],
      ],
      unavailableDimensions: [
        dimensions[2],
      ],
      availableDimensionCount: 4,
      unavailableDimensionCount: 1,
      totalDimensionCount: 5,
    },
    dimensions: sources.map(
      source => ({
        dimension: source.dimension,
        status:
          source.availability === "AVAILABLE"
            ? CanonicalCandidateEvaluationDimensionStatus.AVAILABLE
            : CanonicalCandidateEvaluationDimensionStatus.UNAVAILABLE,
        source,
      }),
    ),
    similarityRationale: [
      "Canonical projection verifier rationale.",
    ],
  },
};

const intelligence =
  resolveCandidateIntelligence(
    evaluation,
  );

const selection =
  createWorkspaceCandidateSelection(
    intelligence,
  );

function readyProjection(
  focusedEventId: string,
) {

  const result =
    resolveComparePairProjection(
      focusedEventId,
      knowledgeObjects,
      selection,
      [intelligence],
    );

  assert(
    result.status === ComparePairProjectionStatus.READY,
    "Expected READY COMPARE pair projection.",
  );

  return result;

}

const ticTacFocused =
  readyProjection(
    TICTAC_EVENT_ID,
  );

assertEqual(ticTacFocused.focusedEventId, TICTAC_EVENT_ID, "Case A event must be Tic Tac.");
assertEqual(ticTacFocused.comparisonEventId, ROOSEVELT_EVENT_ID, "Case B event must be Roosevelt.");
pass("Tic Tac focused on canonical left resolves Case A / Case B");

const rooseveltFocused =
  readyProjection(
    ROOSEVELT_EVENT_ID,
  );

assertEqual(rooseveltFocused.focusedEventId, ROOSEVELT_EVENT_ID, "Case A event must be Roosevelt.");
assertEqual(rooseveltFocused.comparisonEventId, TICTAC_EVENT_ID, "Case B event must be Tic Tac.");
pass("Roosevelt focused on canonical right resolves Case A / Case B");

assertEqual(rooseveltFocused.leftKnowledgeObjectId, TICTAC_KNOWLEDGE_ID, "Canonical left must not change.");
assertEqual(rooseveltFocused.rightKnowledgeObjectId, ROOSEVELT_KNOWLEDGE_ID, "Canonical right must not change.");
pass("canonical candidate ordering remains unchanged");

assertEqual(ticTacFocused.caseAKnowledgeObjectId, TICTAC_KNOWLEDGE_ID, "Tic Tac must orient Case A.");
assertEqual(rooseveltFocused.caseAKnowledgeObjectId, ROOSEVELT_KNOWLEDGE_ID, "Roosevelt must orient Case A.");
pass("operator Case A / Case B orientation follows focused EVENT");

assertEqual(ticTacFocused.candidateId, candidate.identity.candidateId, "Candidate ID must survive.");
pass("candidate ID is preserved");

assertEqual(ticTacFocused.evaluationId, evaluation.identity.evaluationId, "Evaluation ID must survive.");
pass("evaluation ID is preserved");

assertEqual(ticTacFocused.dimensions.length, 5, "Exactly five dimensions must survive.");
assert(ticTacFocused.dimensions.every((item, index) => item.dimension === dimensions[index]), "Dimension order must survive.");
pass("all five canonical dimensions are preserved");

assert(ticTacFocused.dimensions.every((item, index) => item.source === sources[index]), "Dimension sources must survive by reference.");
pass("AVAILABLE dimension scores are preserved exactly");

assertEqual(ticTacFocused.dimensions[2]?.source.availability, "UNAVAILABLE", "UNAVAILABLE must survive.");
assert(!("similarity" in ticTacFocused.dimensions[2]!.source), "UNAVAILABLE must not acquire a zero score.");
pass("UNAVAILABLE remains UNAVAILABLE and is never converted to zero");

assert(ticTacFocused.aggregate === intelligence.explanation.aggregate, "Aggregate must survive by reference.");
pass("aggregate result is preserved exactly");

assertEqual(ticTacFocused.epistemicStatus, intelligence.epistemicStatus, "Epistemic status must survive.");
assert(ticTacFocused.evidence === intelligence.explanation.evidence, "Evidence accounting must survive.");
assert(ticTacFocused.sourceCandidateIntelligence === intelligence, "Candidate lineage must survive.");
pass("epistemic status, evidence accounting, and lineage are preserved");

const nonCandidateSelections: readonly (WorkspaceSelection | undefined)[] = [
  undefined,
  { kind: WorkspaceSelectionKind.NONE },
  { kind: WorkspaceSelectionKind.NODE, nodeId: "node:test" },
  { kind: WorkspaceSelectionKind.EDGE, edgeId: "edge:test" },
];

for (const nonCandidateSelection of nonCandidateSelections) {
  const result = resolveComparePairProjection(TICTAC_EVENT_ID, knowledgeObjects, nonCandidateSelection, [intelligence]);
  assertEqual(result.status, ComparePairProjectionStatus.NO_CANDIDATE_SELECTION, "Non-candidate selection must not be ready.");
  pass(`${nonCandidateSelection?.kind ?? "undefined"} returns NO_CANDIDATE_SELECTION`);
}

assertEqual(resolveComparePairProjection("", knowledgeObjects, selection, [intelligence]).status, ComparePairProjectionStatus.NO_FOCUSED_EVENT, "Missing focus must be explicit.");
pass("missing focused event returns NO_FOCUSED_EVENT");

const withoutTicTac = knowledgeObjects.filter(object => object.identity.id !== TICTAC_KNOWLEDGE_ID);
assertEqual(resolveComparePairProjection(TICTAC_EVENT_ID, withoutTicTac, selection, [intelligence]).status, ComparePairProjectionStatus.FOCUSED_EVENT_KNOWLEDGE_UNAVAILABLE, "Missing focused Knowledge must be explicit.");
pass("missing focused EVENT Knowledge returns FOCUSED_EVENT_KNOWLEDGE_UNAVAILABLE");

const unrelatedKnowledgeId = knowledgeObjects.find(object => object.type !== KnowledgeObjectType.EVENT)!.identity.id;
const unrelatedSelection = { ...selection, leftKnowledgeObjectId: unrelatedKnowledgeId };
assertThrows(() => resolveComparePairProjection(TICTAC_EVENT_ID, knowledgeObjects, unrelatedSelection, [{ ...intelligence, identity: { ...intelligence.identity, leftKnowledgeObjectId: unrelatedKnowledgeId }, sourceEvaluation: { ...evaluation, identity: { ...evaluation.identity, leftKnowledgeObjectId: unrelatedKnowledgeId } } }]), "Unrelated candidate must throw.");
pass("candidate unrelated to focused EVENT throws");

assertThrows(() => resolveComparePairProjection(TICTAC_EVENT_ID, knowledgeObjects, { ...selection, evaluationId: "evaluation:stale" }, [intelligence]), "Stale identity must throw through selection resolver.");
pass("stale candidate identity throws through established resolver");

const ticTacObject = knowledgeObjects.find(object => object.identity.id === TICTAC_KNOWLEDGE_ID)!;
assertThrows(() => resolveComparePairProjection(TICTAC_EVENT_ID, [...knowledgeObjects, { ...ticTacObject }], selection, [intelligence]), "Ambiguous focused Knowledge must throw.");
pass("ambiguous focused EVENT Knowledge throws");

const rooseveltObject = knowledgeObjects.find(object => object.identity.id === ROOSEVELT_KNOWLEDGE_ID)!;
const nonEventRoosevelt = { ...rooseveltObject, type: KnowledgeObjectType.ENTITY } as KnowledgeObject;
assertThrows(() => resolveComparePairProjection(TICTAC_EVENT_ID, knowledgeObjects.map(object => object === rooseveltObject ? nonEventRoosevelt : object), selection, [intelligence]), "Non-EVENT Case B must throw.");
pass("non-EVENT Case B throws");

assertEqual(JSON.stringify(readyProjection(TICTAC_EVENT_ID)), JSON.stringify(readyProjection(TICTAC_EVENT_ID)), "Repeated resolution must be structurally identical.");
pass("repeated resolution is structurally identical");

console.log("");
console.log(`All ${passCount} COMPARE Pair Projection invariants passed.`);
