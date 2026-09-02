import type { KnowledgeObject } from "../../knowledge/model/KnowledgeObject";
import { KnowledgeObjectType } from "../../knowledge/model/KnowledgeObjectTypes";
import type { ResolveCandidateIntelligence } from "../../resolve/intelligence/ResolveCandidateIntelligenceTypes";
import { createWorkspaceCandidateSelection } from "../../resolve/intelligence/ResolveCandidateSelection";
import { WorkspaceSelectionKind, type WorkspaceCandidateSelection, type WorkspaceSelection } from "../../workspace/runtime/WorkspaceRuntimeTypes";
import { resolveComparePairProjection } from "./ComparePairProjectionResolver";
import { ComparePairProjectionStatus } from "./ComparePairProjectionTypes";

const SYSTEM_CANON = "SYSTEM_CANON";

export const CompareCandidateOptionProjectionStatus = {
  NO_FOCUSED_EVENT: "NO_FOCUSED_EVENT",
  FOCUSED_EVENT_KNOWLEDGE_UNAVAILABLE: "FOCUSED_EVENT_KNOWLEDGE_UNAVAILABLE",
  NO_COMPLETED_CANDIDATES: "NO_COMPLETED_CANDIDATES",
  READY: "READY",
} as const;

export type CompareCandidateOption = {
  candidateId: string;
  evaluationId: string;
  leftKnowledgeObjectId: string;
  rightKnowledgeObjectId: string;
  comparisonEventId: string;
  comparisonEventKnowledgeObjectId: string;
  aggregate: { availability: "AVAILABLE"; similarity: number } | { availability: "UNAVAILABLE" };
  participatingDimensionCount: number;
  totalDimensionCount: number;
  availableDimensionCount: number;
  unavailableDimensionCount: number;
  selection: WorkspaceCandidateSelection;
  selected: boolean;
};

export type CompareCandidateOptionProjectionResult =
  | { status: typeof CompareCandidateOptionProjectionStatus.NO_FOCUSED_EVENT }
  | { status: typeof CompareCandidateOptionProjectionStatus.FOCUSED_EVENT_KNOWLEDGE_UNAVAILABLE; focusedEventId: string }
  | { status: typeof CompareCandidateOptionProjectionStatus.NO_COMPLETED_CANDIDATES; focusedEventId: string; focusedEventKnowledgeObjectId: string }
  | { status: typeof CompareCandidateOptionProjectionStatus.READY; focusedEventId: string; focusedEventKnowledgeObjectId: string; options: readonly CompareCandidateOption[]; selectedOption?: CompareCandidateOption };

function canonicalEventId(object: KnowledgeObject): string | undefined {
  if (object.type !== KnowledgeObjectType.EVENT || object.provenance.sourceType !== SYSTEM_CANON) return undefined;
  if (object.provenance.sourceId.trim().length === 0) throw new Error("COMPARE Set rejected canonical EVENT Knowledge with empty source identity.");
  return object.provenance.sourceId;
}

function completeIdentityMatches(selection: WorkspaceSelection | undefined, product: WorkspaceCandidateSelection): boolean {
  return selection?.kind === WorkspaceSelectionKind.CANDIDATE &&
    selection.candidateId === product.candidateId &&
    selection.evaluationId === product.evaluationId &&
    selection.leftKnowledgeObjectId === product.leftKnowledgeObjectId &&
    selection.rightKnowledgeObjectId === product.rightKnowledgeObjectId;
}

export function resolveCompareCandidateOptionProjection(
  focusedEventId: string | null | undefined,
  knowledgeObjects: readonly KnowledgeObject[],
  candidateIntelligence: readonly ResolveCandidateIntelligence[],
  currentSelection: WorkspaceSelection | undefined,
): CompareCandidateOptionProjectionResult {
  if (!focusedEventId?.trim()) return { status: CompareCandidateOptionProjectionStatus.NO_FOCUSED_EVENT };

  const focusedMatches = knowledgeObjects.filter(object => canonicalEventId(object) === focusedEventId);
  if (focusedMatches.length === 0) return { status: CompareCandidateOptionProjectionStatus.FOCUSED_EVENT_KNOWLEDGE_UNAVAILABLE, focusedEventId };
  if (focusedMatches.length !== 1) throw new Error(`COMPARE Set rejected ambiguous focused EVENT Knowledge: focusedEventId="${focusedEventId}" matches=${focusedMatches.length}.`);
  const focusedEventKnowledgeObjectId = focusedMatches[0]!.identity.id;
  if (!focusedEventKnowledgeObjectId.trim()) throw new Error("COMPARE Set rejected focused EVENT Knowledge with empty identity.");

  if (candidateIntelligence.length === 0) return { status: CompareCandidateOptionProjectionStatus.NO_COMPLETED_CANDIDATES, focusedEventId, focusedEventKnowledgeObjectId };

  const options: CompareCandidateOption[] = [];
  for (const intelligence of candidateIntelligence) {
    const { leftKnowledgeObjectId, rightKnowledgeObjectId } = intelligence.identity;
    const focusedIsLeft = leftKnowledgeObjectId === focusedEventKnowledgeObjectId;
    const focusedIsRight = rightKnowledgeObjectId === focusedEventKnowledgeObjectId;
    if (!focusedIsLeft && !focusedIsRight) continue;
    if (focusedIsLeft === focusedIsRight) throw new Error("COMPARE Set rejected a relevant candidate that contains focused EVENT Knowledge on both sides.");

    const selection = createWorkspaceCandidateSelection(intelligence);
    const pair = resolveComparePairProjection(focusedEventId, knowledgeObjects, selection, [intelligence]);
    if (pair.status !== ComparePairProjectionStatus.READY) throw new Error(`COMPARE Set relevant candidate failed I1B readiness: ${pair.status}.`);
    const selected = completeIdentityMatches(currentSelection, selection);
    const aggregate = pair.aggregate.participatingDimensionCount > 0
      ? { availability: "AVAILABLE" as const, similarity: pair.aggregate.aggregateSimilarity }
      : { availability: "UNAVAILABLE" as const };
    options.push({
      candidateId: pair.candidateId,
      evaluationId: pair.evaluationId,
      leftKnowledgeObjectId: pair.leftKnowledgeObjectId,
      rightKnowledgeObjectId: pair.rightKnowledgeObjectId,
      comparisonEventId: pair.comparisonEventId,
      comparisonEventKnowledgeObjectId: pair.comparisonEventKnowledgeObjectId,
      aggregate,
      participatingDimensionCount: pair.aggregate.participatingDimensionCount,
      totalDimensionCount: pair.aggregate.totalDimensionCount,
      availableDimensionCount: pair.evidence.availableDimensionCount,
      unavailableDimensionCount: pair.evidence.unavailableDimensionCount,
      selection,
      selected,
    });
  }

  if (currentSelection?.kind === WorkspaceSelectionKind.CANDIDATE) {
    const involvesFocus = currentSelection.leftKnowledgeObjectId === focusedEventKnowledgeObjectId || currentSelection.rightKnowledgeObjectId === focusedEventKnowledgeObjectId;
    if (involvesFocus && !options.some(option => option.selected)) throw new Error("COMPARE Set rejected a stale CANDIDATE selection involving the focused EVENT.");
  }

  const selectedOptions = options.filter(option => option.selected);
  if (selectedOptions.length > 1) throw new Error("COMPARE Set rejected ambiguous selected candidate identity.");
  return { status: CompareCandidateOptionProjectionStatus.READY, focusedEventId, focusedEventKnowledgeObjectId, options, selectedOption: selectedOptions[0] };
}
