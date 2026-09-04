import { WorkspaceSelectionKind, type WorkspaceSelection } from "../../workspace/runtime/WorkspaceRuntimeTypes";
import type { Investigation } from "../../investigation/investigationTypes";
import { resolveCurrentOperationalRevision } from "../../investigation/revision/OperationalGraphRevision";
import type { KnowledgeObject } from "../../knowledge/model/KnowledgeObject";
import type { ResolveExecutionRecord } from "../../resolve/runtime/ResolveRuntimeTypes";
import { resolveCurrentInvestigationExecution } from "../../intelligence/selection/InvestigationSelectionCoherence";
import { resolveIntentionProjection, validateIntentionProjection, type IntentionModelDefinition, type IntentionProjection } from "../projection";

export const INITIAL_INTENTION_MODEL: IntentionModelDefinition = Object.freeze({
  id: "intention-descriptive-projection",
  version: "1.0.0-experimental",
  configurationId: "intention-descriptive-projection:initial",
});

export type IntentionWorkspaceProjectionState =
  | { readonly status: "AVAILABLE"; readonly projection: IntentionProjection; readonly hasComparisonCandidate: boolean }
  | { readonly status: "UNAVAILABLE"; readonly reason: string };

export function assembleIntentionWorkspaceProjection(input: {
  readonly investigation?: Investigation;
  readonly knowledgeObjects: readonly KnowledgeObject[];
  readonly resolveExecution?: ResolveExecutionRecord;
  readonly workspaceSelection?: WorkspaceSelection;
  readonly model?: IntentionModelDefinition;
}): IntentionWorkspaceProjectionState {
  const { investigation, knowledgeObjects, workspaceSelection } = input;
  if (!investigation) return { status: "UNAVAILABLE", reason: "An active Investigation is required." };
  let currentRevision;
  try { currentRevision = resolveCurrentOperationalRevision(investigation); }
  catch (error) { return { status: "UNAVAILABLE", reason: error instanceof Error ? error.message : "Current operational revision is unavailable." }; }
  const focusedEventId = investigation.workspace.focused_event_id;
  if (!focusedEventId?.trim()) return { status: "UNAVAILABLE", reason: "The active Investigation has no coherent focused EVENT." };

  const executionRecord = resolveCurrentInvestigationExecution(investigation, input.resolveExecution);
  const result = executionRecord?.result;
  let selectedCandidate;
  if (workspaceSelection?.kind === WorkspaceSelectionKind.CANDIDATE && result) {
    const matches = result.candidateEvaluations.evaluations.filter(candidate =>
      candidate.identity.candidateId === workspaceSelection.candidateId &&
      candidate.identity.evaluationId === workspaceSelection.evaluationId &&
      candidate.identity.leftKnowledgeObjectId === workspaceSelection.leftKnowledgeObjectId &&
      candidate.identity.rightKnowledgeObjectId === workspaceSelection.rightKnowledgeObjectId);
    if (matches.length === 1) selectedCandidate = matches[0];
  }

  try {
    const projection = resolveIntentionProjection({
      investigation, currentRevision, focusedEventId, knowledgeObjects,
      ...(selectedCandidate && result ? { selectedCandidate, resolveExecution: result } : {}),
      model: input.model ?? INITIAL_INTENTION_MODEL,
    });
    validateIntentionProjection(projection);
    return { status: "AVAILABLE", projection, hasComparisonCandidate: selectedCandidate !== undefined };
  } catch (error) {
    return { status: "UNAVAILABLE", reason: error instanceof Error ? error.message : "INTENTION projection is unavailable." };
  }
}
