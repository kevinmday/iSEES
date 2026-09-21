import { ResearchAnchorType, type ResearchCandidateAnchor } from "../../research/researchBridgeTypes";
import type { ResearchBridgeRuntime } from "../../research/ResearchBridgeRuntime";
import { ComparePairProjectionStatus, type ComparePairProjectionReady } from "../projection/ComparePairProjectionTypes";
import { migrateResearchAnchor } from "../../research/ResearchAnchorContract";
import type { KnowledgeObject } from "../../knowledge/model/KnowledgeObject";
import {
  createAcceptedResolveCandidateRelationshipId,
  ResolveCandidateAcceptanceState,
  resolveCandidateAcceptanceState,
} from "../../resolve/acceptance/ResolveCandidateAcceptance";
import type { ResolveCandidateIntelligence } from "../../resolve/intelligence/ResolveCandidateIntelligenceTypes";

export interface CompareCandidateResearchPublicationInput {
  investigationId: string;
  projection: ComparePairProjectionReady;
  resolveExecutionId?: string;
  researchBridgeRuntime: ResearchBridgeRuntime;
  knowledgeObjects?: readonly KnowledgeObject[];
}

function candidateIntelligence(anchor: ResearchCandidateAnchor): ResolveCandidateIntelligence {
  const identity = {
    candidateId: anchor.candidate.candidateId,
    evaluationId: anchor.candidate.evaluationId,
    leftKnowledgeObjectId: anchor.candidate.leftKnowledgeObjectId,
    rightKnowledgeObjectId: anchor.candidate.rightKnowledgeObjectId,
  };
  return {
    identity,
    candidate: { id: identity.candidateId, leftKnowledgeObjectId: identity.leftKnowledgeObjectId, rightKnowledgeObjectId: identity.rightKnowledgeObjectId },
    sourceEvaluation: {
      identity,
      candidate: { id: identity.candidateId, leftKnowledgeObjectId: identity.leftKnowledgeObjectId, rightKnowledgeObjectId: identity.rightKnowledgeObjectId },
    },
  } as unknown as ResolveCandidateIntelligence;
}

export function reconcileCompareCandidateResearchAnchor(
  anchor: ResearchCandidateAnchor,
  knowledgeObjects: readonly KnowledgeObject[],
): ResearchCandidateAnchor {
  const acceptance = resolveCandidateAcceptanceState(candidateIntelligence(anchor), knowledgeObjects);
  const accepted = acceptance.state === ResolveCandidateAcceptanceState.ACCEPTED;
  const conflict = acceptance.state === ResolveCandidateAcceptanceState.MALFORMED_CONFLICT;
  const acceptedRelationshipId = accepted ? createAcceptedResolveCandidateRelationshipId(anchor.candidate.candidateId) : undefined;
  const candidate = { ...anchor.candidate, acceptedRelationshipId };
  return migrateResearchAnchor({
    ...anchor,
    candidate,
    sourceIdentity: acceptedRelationshipId ?? `CANDIDATE:${candidate.candidateId}:${candidate.evaluationId}`,
    classification: accepted ? "CANONICAL" : conflict ? "UNDETERMINED" : "RESEARCHER_GENERATED",
    sourceProjectionId: candidate.evaluationId,
    display: {
      ...anchor.display,
      summary: accepted
        ? `Accepted canonical relationship ${acceptedRelationshipId}.`
        : conflict
          ? "Canonical acceptance is malformed or conflicting; insertion is governed closed."
          : "Candidate pairwise correspondence; not accepted.",
    },
    insertability: accepted
      ? { state: "INSERTABLE", reason: "Exact canonical accepted relationship and candidate lineage are available." }
      : { state: "INSPECTION_ONLY", reason: conflict ? (acceptance.message ?? "Canonical acceptance is malformed.") : "COMPARE candidate has no exact canonical accepted relationship." },
    capturedRepresentation: {
      schemaVersion: "compare-candidate-relationship/v2",
      mediaType: "application/json",
      value: {
        researchAnchorId: anchor.anchorId,
        candidateId: candidate.candidateId,
        evaluationId: candidate.evaluationId,
        acceptedRelationshipId,
        acceptedRelationship: accepted ? acceptance.relationship : undefined,
        leftKnowledgeObjectId: candidate.leftKnowledgeObjectId,
        rightKnowledgeObjectId: candidate.rightKnowledgeObjectId,
        resolveExecutionId: candidate.resolveExecutionId,
        collectedAt: anchor.collectedAt.toISOString(),
        candidate,
      },
    },
  }) as ResearchCandidateAnchor;
}

export function reconcilePublishedCompareCandidates(
  researchBridgeRuntime: ResearchBridgeRuntime,
  knowledgeObjects: readonly KnowledgeObject[],
  investigationId?: string,
): number {
  let replaced = 0;
  for (const { anchor } of researchBridgeRuntime.getDesk().entries) {
    if (anchor.kind !== "COMPARE_CANDIDATE" || (investigationId && anchor.investigationId !== investigationId)) continue;
    if (researchBridgeRuntime.replaceAnchor(reconcileCompareCandidateResearchAnchor(anchor, knowledgeObjects)) === "REPLACED") replaced++;
  }
  return replaced;
}

export function createCompareCandidateResearchAnchor(
  input: Omit<CompareCandidateResearchPublicationInput, "researchBridgeRuntime" | "knowledgeObjects">,
): ResearchCandidateAnchor {
  if (input.projection.status !== ComparePairProjectionStatus.READY) {
    throw new Error("Research publication requires a READY COMPARE Pair Projection.");
  }
  return migrateResearchAnchor({
    anchorId: ["research", input.investigationId, "CANDIDATE", input.projection.candidateId, input.projection.evaluationId].join(":"),
    investigationId: input.investigationId,
    candidate: {
      type: ResearchAnchorType.CANDIDATE,
      candidateId: input.projection.candidateId,
      evaluationId: input.projection.evaluationId,
      leftKnowledgeObjectId: input.projection.leftKnowledgeObjectId,
      rightKnowledgeObjectId: input.projection.rightKnowledgeObjectId,
      focusedEventId: input.projection.focusedEventId,
      focusedEventKnowledgeObjectId: input.projection.focusedEventKnowledgeObjectId,
      comparisonEventId: input.projection.comparisonEventId,
      comparisonEventKnowledgeObjectId: input.projection.comparisonEventKnowledgeObjectId,
      resolveExecutionId: input.resolveExecutionId,
      epistemicStatus: input.projection.epistemicStatus,
      aggregate: input.projection.aggregate,
      dimensions: input.projection.dimensions,
      source: "COMPARE_PAIR_INSPECTION",
    },
    createdAt: new Date(),
    pinned: false,
  } as unknown as Record<string, unknown>) as ResearchCandidateAnchor;
}

export function publishCompareCandidateToResearch(input: CompareCandidateResearchPublicationInput): ResearchCandidateAnchor {
  const anchor = reconcileCompareCandidateResearchAnchor(createCompareCandidateResearchAnchor(input), input.knowledgeObjects ?? []);
  const creation = input.researchBridgeRuntime.createAnchor(anchor);
  if (creation === "ALREADY_PRESENT") input.researchBridgeRuntime.replaceAnchor(anchor);
  return anchor;
}
