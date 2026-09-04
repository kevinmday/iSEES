import { ResearchAnchorType, type ResearchCandidateAnchor } from "../../research/researchBridgeTypes";
import type { ResearchBridgeRuntime } from "../../research/ResearchBridgeRuntime";
import { ComparePairProjectionStatus, type ComparePairProjectionReady } from "../projection/ComparePairProjectionTypes";
import { migrateResearchAnchor } from "../../research/ResearchAnchorContract";

export interface CompareCandidateResearchPublicationInput {
  investigationId: string;
  projection: ComparePairProjectionReady;
  resolveExecutionId?: string;
  researchBridgeRuntime: ResearchBridgeRuntime;
}

export function createCompareCandidateResearchAnchor(
  input: Omit<CompareCandidateResearchPublicationInput, "researchBridgeRuntime">,
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
  const anchor = createCompareCandidateResearchAnchor(input);
  input.researchBridgeRuntime.createAnchor(anchor);
  return anchor;
}
