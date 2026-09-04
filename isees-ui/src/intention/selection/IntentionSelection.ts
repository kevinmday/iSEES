import type { IntentionProjection } from "../projection";
import { IntentionSelectionKind, type IntentionNoneSelection, type IntentionSelection, type ResolvedIntentionSelection } from "./IntentionSelectionTypes";

export const NO_INTENTION_SELECTION: IntentionNoneSelection = Object.freeze({ kind: IntentionSelectionKind.NONE });

function lineage(projection: IntentionProjection) {
  return Object.freeze({
    investigationId: projection.lineage.investigationId,
    operationalRevisionId: projection.lineage.operationalRevisionId,
    intentionExecutionId: projection.executionId,
    projectionId: projection.id,
    modelId: projection.lineage.modelId,
    modelVersion: projection.lineage.modelVersion,
    configurationId: projection.lineage.configurationId,
    ...(projection.lineage.resolveExecutionId ? { resolveExecutionId: projection.lineage.resolveExecutionId } : {}),
    ...(projection.lineage.candidateId ? { candidateId: projection.lineage.candidateId } : {}),
    ...(projection.lineage.evaluationId ? { evaluationId: projection.lineage.evaluationId } : {}),
  });
}

export function createIntentionNodeSelection(projection: IntentionProjection, projectedNodeId: string): IntentionSelection {
  return Object.freeze({ kind: IntentionSelectionKind.INTENTION_PROJECTED_NODE, ...lineage(projection), projectedNodeId });
}
export function createIntentionLinkSelection(projection: IntentionProjection, projectedLinkId: string): IntentionSelection {
  return Object.freeze({ kind: IntentionSelectionKind.INTENTION_PROJECTED_LINK, ...lineage(projection), projectedLinkId });
}
export function createIntentionDerivationSelection(projection: IntentionProjection, derivationId: string): IntentionSelection {
  return Object.freeze({ kind: IntentionSelectionKind.INTENTION_METRIC_DERIVATION, ...lineage(projection), derivationId });
}

function coherent(selection: Exclude<IntentionSelection, { kind: "NONE" }>, projection: IntentionProjection): boolean {
  const value = projection.lineage;
  return selection.investigationId === value.investigationId &&
    selection.operationalRevisionId === value.operationalRevisionId &&
    selection.intentionExecutionId === projection.executionId &&
    selection.projectionId === projection.id &&
    selection.modelId === value.modelId && selection.modelVersion === value.modelVersion && selection.configurationId === value.configurationId &&
    selection.resolveExecutionId === value.resolveExecutionId && selection.candidateId === value.candidateId && selection.evaluationId === value.evaluationId;
}

export function resolveIntentionSelection(selection: IntentionSelection, projection: IntentionProjection | undefined): ResolvedIntentionSelection {
  if (!projection || selection.kind === IntentionSelectionKind.NONE || !coherent(selection, projection)) return NO_INTENTION_SELECTION;
  if (selection.kind === IntentionSelectionKind.INTENTION_PROJECTED_NODE) {
    const node = projection.nodes.find(item => item.id === selection.projectedNodeId);
    return node ? { kind: selection.kind, node } : NO_INTENTION_SELECTION;
  }
  if (selection.kind === IntentionSelectionKind.INTENTION_PROJECTED_LINK) {
    const link = projection.links.find(item => item.id === selection.projectedLinkId);
    return link ? { kind: selection.kind, link } : NO_INTENTION_SELECTION;
  }
  const derivation = projection.derivations.find(item => item.id === selection.derivationId);
  return derivation ? { kind: selection.kind, derivation } : NO_INTENTION_SELECTION;
}
