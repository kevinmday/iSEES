import type {
  KnowledgeObject,
} from "../../knowledge/model/KnowledgeObject";

import type {
  ResolveCandidateAggregateIntelligence,
  ResolveCandidateDimensionIntelligence,
  ResolveCandidateEpistemicStatus,
  ResolveCandidateEvidenceIntelligence,
  ResolveCandidateIntelligence,
} from "../../resolve/intelligence/ResolveCandidateIntelligenceTypes";

export const ComparePairProjectionStatus = {

  READY:
    "READY",

  NO_FOCUSED_EVENT:
    "NO_FOCUSED_EVENT",

  NO_CANDIDATE_SELECTION:
    "NO_CANDIDATE_SELECTION",

  FOCUSED_EVENT_KNOWLEDGE_UNAVAILABLE:
    "FOCUSED_EVENT_KNOWLEDGE_UNAVAILABLE",

} as const;

export type ComparePairProjectionStatus =
  (typeof ComparePairProjectionStatus)[
    keyof typeof ComparePairProjectionStatus
  ];

export interface ComparePairProjectionReady {

  status:
    typeof ComparePairProjectionStatus.READY;

  focusedEventId:
    string;

  focusedEventKnowledgeObjectId:
    string;

  comparisonEventId:
    string;

  comparisonEventKnowledgeObjectId:
    string;

  candidateId:
    string;

  evaluationId:
    string;

  leftKnowledgeObjectId:
    string;

  rightKnowledgeObjectId:
    string;

  caseAKnowledgeObjectId:
    string;

  caseBKnowledgeObjectId:
    string;

  aggregate:
    ResolveCandidateAggregateIntelligence;

  dimensions:
    readonly ResolveCandidateDimensionIntelligence[];

  epistemicStatus:
    ResolveCandidateEpistemicStatus;

  evidence:
    ResolveCandidateEvidenceIntelligence;

  similarityRationale:
    readonly string[];

  focusedEventKnowledgeObject:
    KnowledgeObject;

  comparisonEventKnowledgeObject:
    KnowledgeObject;

  sourceCandidateIntelligence:
    ResolveCandidateIntelligence;

}

export interface ComparePairProjectionNoFocusedEvent {

  status:
    typeof ComparePairProjectionStatus.NO_FOCUSED_EVENT;

}

export interface ComparePairProjectionNoCandidateSelection {

  status:
    typeof ComparePairProjectionStatus.NO_CANDIDATE_SELECTION;

  focusedEventId:
    string;

}

export interface ComparePairProjectionFocusedEventKnowledgeUnavailable {

  status:
    typeof ComparePairProjectionStatus.FOCUSED_EVENT_KNOWLEDGE_UNAVAILABLE;

  focusedEventId:
    string;

}

export type ComparePairProjectionResult =

  | ComparePairProjectionReady
  | ComparePairProjectionNoFocusedEvent
  | ComparePairProjectionNoCandidateSelection
  | ComparePairProjectionFocusedEventKnowledgeUnavailable;
