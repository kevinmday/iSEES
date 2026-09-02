import type {
  KnowledgeObject,
} from "../../knowledge/model/KnowledgeObject";

import {
  KnowledgeObjectType,
} from "../../knowledge/model/KnowledgeObjectTypes";

import type {
  ResolveCandidateIntelligence,
} from "../../resolve/intelligence/ResolveCandidateIntelligenceTypes";

import {
  resolveOptionalSelectedCandidateIntelligence,
} from "../../resolve/intelligence/ResolveCandidateSelection";

import type {
  WorkspaceSelection,
} from "../../workspace/runtime/WorkspaceRuntimeTypes";

import {
  ComparePairProjectionStatus,

  type ComparePairProjectionResult,
} from "./ComparePairProjectionTypes";

const SYSTEM_CANON_SOURCE_TYPE =
  "SYSTEM_CANON";

function resolveSystemCanonEventId(
  knowledgeObject:
    KnowledgeObject,
): string | undefined {

  if (
    knowledgeObject.type !==
      KnowledgeObjectType.EVENT ||
    knowledgeObject.provenance.sourceType !==
      SYSTEM_CANON_SOURCE_TYPE
  ) {

    return undefined;

  }

  const eventId =
    knowledgeObject.provenance.sourceId;

  if (
    eventId.trim().length ===
    0
  ) {

    throw new Error(
      "COMPARE Pair Projection rejected a System Canon EVENT Knowledge Object with an empty provenance.sourceId.",
    );

  }

  return eventId;

}

function resolveUniqueKnowledgeObjectById(
  knowledgeObjects:
    readonly KnowledgeObject[],
  knowledgeObjectId:
    string,
): KnowledgeObject {

  if (
    knowledgeObjectId.trim().length ===
    0
  ) {

    throw new Error(
      "COMPARE Pair Projection rejected an empty Knowledge Object identity.",
    );

  }

  const matches =
    knowledgeObjects.filter(
      knowledgeObject =>
        knowledgeObject.identity.id ===
          knowledgeObjectId,
    );

  if (
    matches.length !==
    1
  ) {

    throw new Error(
      [
        "COMPARE Pair Projection could not resolve exactly one Knowledge Object:",
        `knowledgeObjectId="${knowledgeObjectId}"`,
        `matches=${matches.length}.`,
      ].join(" "),
    );

  }

  return matches[0]!;

}

export function resolveComparePairProjection(
  focusedEventId:
    string | null | undefined,
  knowledgeObjects:
    readonly KnowledgeObject[],
  selection:
    WorkspaceSelection | undefined,
  candidateIntelligence:
    readonly ResolveCandidateIntelligence[],
): ComparePairProjectionResult {

  if (
    focusedEventId === undefined ||
    focusedEventId === null ||
    focusedEventId.trim().length === 0
  ) {

    return {

      status:
        ComparePairProjectionStatus.NO_FOCUSED_EVENT,

    };

  }

  const selectedCandidate =
    resolveOptionalSelectedCandidateIntelligence(
      selection,
      candidateIntelligence,
    );

  if (
    selectedCandidate ===
    undefined
  ) {

    return {

      status:
        ComparePairProjectionStatus.NO_CANDIDATE_SELECTION,

      focusedEventId,

    };

  }

  const focusedMatches =
    knowledgeObjects.filter(
      knowledgeObject =>
        resolveSystemCanonEventId(
          knowledgeObject,
        ) === focusedEventId,
    );

  if (
    focusedMatches.length ===
    0
  ) {

    return {

      status:
        ComparePairProjectionStatus.FOCUSED_EVENT_KNOWLEDGE_UNAVAILABLE,

      focusedEventId,

    };

  }

  if (
    focusedMatches.length !==
    1
  ) {

    throw new Error(
      [
        "COMPARE Pair Projection rejected ambiguous focused EVENT Knowledge:",
        `focusedEventId="${focusedEventId}"`,
        `matches=${focusedMatches.length}.`,
      ].join(" "),
    );

  }

  const focusedEventKnowledgeObject =
    focusedMatches[0]!;

  const focusedEventKnowledgeObjectId =
    focusedEventKnowledgeObject.identity.id;

  if (
    focusedEventKnowledgeObjectId.trim().length ===
    0
  ) {

    throw new Error(
      "COMPARE Pair Projection rejected focused EVENT Knowledge with an empty identity.",
    );

  }

  const {
    leftKnowledgeObjectId,
    rightKnowledgeObjectId,
  } = selectedCandidate.identity;

  const focusedIsLeft =
    leftKnowledgeObjectId ===
    focusedEventKnowledgeObjectId;

  const focusedIsRight =
    rightKnowledgeObjectId ===
    focusedEventKnowledgeObjectId;

  if (
    focusedIsLeft ===
    focusedIsRight
  ) {

    throw new Error(
      [
        "COMPARE Pair Projection rejected a candidate that does not contain",
        "the focused EVENT Knowledge Object on exactly one side:",
        `focusedEventKnowledgeObjectId="${focusedEventKnowledgeObjectId}".`,
      ].join(" "),
    );

  }

  const comparisonEventKnowledgeObjectId =
    focusedIsLeft
      ? rightKnowledgeObjectId
      : leftKnowledgeObjectId;

  const comparisonEventKnowledgeObject =
    resolveUniqueKnowledgeObjectById(
      knowledgeObjects,
      comparisonEventKnowledgeObjectId,
    );

  const comparisonEventId =
    resolveSystemCanonEventId(
      comparisonEventKnowledgeObject,
    );

  if (
    comparisonEventId ===
    undefined
  ) {

    throw new Error(
      [
        "COMPARE Pair Projection V1 requires Case B to be a canonical",
        "System Canon EVENT Knowledge Object:",
        `knowledgeObjectId="${comparisonEventKnowledgeObjectId}".`,
      ].join(" "),
    );

  }

  return {

    status:
      ComparePairProjectionStatus.READY,

    focusedEventId,

    focusedEventKnowledgeObjectId,

    comparisonEventId,

    comparisonEventKnowledgeObjectId,

    candidateId:
      selectedCandidate.identity.candidateId,

    evaluationId:
      selectedCandidate.identity.evaluationId,

    leftKnowledgeObjectId,

    rightKnowledgeObjectId,

    caseAKnowledgeObjectId:
      focusedEventKnowledgeObjectId,

    caseBKnowledgeObjectId:
      comparisonEventKnowledgeObjectId,

    aggregate:
      selectedCandidate.explanation.aggregate,

    dimensions:
      selectedCandidate.explanation.dimensions,

    epistemicStatus:
      selectedCandidate.epistemicStatus,

    evidence:
      selectedCandidate.explanation.evidence,

    similarityRationale:
      selectedCandidate.explanation.similarityRationale,

    focusedEventKnowledgeObject,

    comparisonEventKnowledgeObject,

    sourceCandidateIntelligence:
      selectedCandidate,

  };

}
