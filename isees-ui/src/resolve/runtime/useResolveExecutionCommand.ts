import { useCallback } from "react";

import { useKnowledgeObjectRuntime } from "../../knowledge/runtime/KnowledgeObjectRuntimeContext";
import { useWorkspaceRuntime } from "../../workspace/runtime/WorkspaceRuntimeContext";
import { useResolveRuntime, useResolveRuntimeState } from "./ResolveRuntimeContext";
import { ResolveRuntimeStatus } from "./ResolveRuntimeTypes";
import { composeGuestOperationalKnowledgeObjects } from "../../knowledge/ingestion/GuestCandidateKnowledgeAdapter.ts";
import { WorkspaceSelectionKind } from "../../workspace/runtime/WorkspaceRuntimeTypes";
import type { WorkspaceRuntime } from "../../workspace/runtime/WorkspaceRuntime";
import type { KnowledgeObject } from "../../knowledge/model/KnowledgeObject";
import type { ResolveExecutionRecord } from "./ResolveRuntimeTypes";
import { resolveCurrentInvestigationExecution } from "../../intelligence/selection/InvestigationSelectionCoherence";
import { resolveCandidateIntelligenceCollection } from "../intelligence/ResolveCandidateIntelligenceResolver";
import { createWorkspaceCandidateSelection } from "../intelligence/ResolveCandidateSelection";

export type ResolveCommandPhase = "READY_TO_RESOLVE" | "RESOLVING" | "RESOLVE_COMPLETED" | "RESOLVE_FAILED" | "BLOCKED";

export interface ResolveCommandFeedback {
  readonly phase: ResolveCommandPhase;
  readonly message: string;
  readonly focusedLabel?: string;
  readonly comparisonLabel?: string;
  readonly candidateCount?: number;
  readonly executionId?: string;
}

export interface ResolveExecutionCommand {
  readonly execute: () => ResolveCommandFeedback;
  readonly disabled: boolean;
  readonly statusText: string;
  readonly feedback: ResolveCommandFeedback;
}

function knowledgeLabel(object: { readonly identity: { readonly id: string }; readonly metadata: { readonly title: string }; readonly provenance: { readonly sourceId: string }; readonly payload: unknown }): string {
  const payload = object.payload as { readonly canonicalEvent?: { readonly event_name?: unknown }; readonly nativeCaseDraftContent?: { readonly workingTitle?: { readonly value?: unknown } } } | undefined;
  const label = payload?.nativeCaseDraftContent?.workingTitle?.value ?? payload?.canonicalEvent?.event_name ?? object.metadata.title;
  return typeof label === "string" && label.trim() ? label : object.provenance.sourceId || object.identity.id;
}

function equalValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object") return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => equalValue(value, right[index]));
  }
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord).sort();
  const rightKeys = Object.keys(rightRecord).sort();
  return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index] && equalValue(leftRecord[key], rightRecord[key]));
}

export interface ActiveResolvePair {
  readonly focused: KnowledgeObject;
  readonly comparison?: KnowledgeObject;
}

export function resolveActiveResolvePair(workspaceRuntime: WorkspaceRuntime, knowledgeObjects: readonly KnowledgeObject[]): ActiveResolvePair | undefined {
  const workspace = workspaceRuntime.getWorkspace();
  const selection = workspaceRuntime.getSelection();
  const focused = knowledgeObjects.find(object => object.type === "EVENT" && object.provenance.sourceId === workspace?.focused_event_id);
  if (!focused) return undefined;
  const comparisonKnowledgeObjectId = selection?.kind === WorkspaceSelectionKind.COMPARISON_TARGET
    ? selection.knowledgeObjectId
    : selection?.kind === WorkspaceSelectionKind.CANDIDATE
      ? [selection.leftKnowledgeObjectId, selection.rightKnowledgeObjectId].find(id => id !== focused.identity.id)
      : undefined;
  const comparison = knowledgeObjects.find(object => object.identity.id === comparisonKnowledgeObjectId && object.type === "EVENT" && object.provenance.sourceType === "SYSTEM_CANON");
  return { focused, comparison };
}

export function resolveExecutionMatchesActiveResolveContext(
  execution: ResolveExecutionRecord | undefined,
  workspaceRuntime: WorkspaceRuntime,
  pair: ActiveResolvePair | undefined,
): execution is ResolveExecutionRecord {
  const investigation = workspaceRuntime.getActiveInvestigation();
  const current = resolveCurrentInvestigationExecution(investigation, execution);
  if (!current || !pair) return false;
  if (!equalValue(current.input.activeLayers, workspaceRuntime.getActiveLayers()) ||
      !equalValue(current.input.temporalContext, workspaceRuntime.getTemporalContext()) ||
      !equalValue(current.input.investigativeScale, workspaceRuntime.getInvestigativeScale())) return false;
  if (!pair.comparison) return investigation?.workspace.guest_candidate_event === undefined;
  if (current.commandContext) {
    return current.commandContext.focusedKnowledgeObjectId === pair.focused.identity.id &&
      current.commandContext.comparisonKnowledgeObjectId === pair.comparison.identity.id;
  }
  return current.input.knowledgeObjects.some(object => object.identity.id === pair.focused.identity.id) &&
    current.input.knowledgeObjects.some(object => object.identity.id === pair.comparison!.identity.id) &&
    (current.result === undefined || current.result.candidateEvaluations.evaluations.some(item => {
      const endpoints = [item.identity.leftKnowledgeObjectId, item.identity.rightKnowledgeObjectId];
      return endpoints.includes(pair.focused.identity.id) && endpoints.includes(pair.comparison!.identity.id);
    }));
}

/** Single UI orchestration boundary; ResolveRuntime remains the sole executor. */
export function useResolveExecutionCommand(): ResolveExecutionCommand {
  const knowledgeRuntime = useKnowledgeObjectRuntime();
  const workspaceRuntime = useWorkspaceRuntime();
  const resolveRuntime = useResolveRuntime();
  const resolveState = useResolveRuntimeState();
  const activeInvestigation = workspaceRuntime.getActiveInvestigation();
  const knowledgeObjects = activeInvestigation
    ? composeGuestOperationalKnowledgeObjects(activeInvestigation.workspace, knowledgeRuntime.getObjects())
    : knowledgeRuntime.getObjects();
  const pair = resolveActiveResolvePair(workspaceRuntime, knowledgeObjects);
  const currentExecution = resolveExecutionMatchesActiveResolveContext(resolveState.currentExecution, workspaceRuntime, pair)
    ? resolveState.currentExecution
    : undefined;
  const executing = resolveState.status === ResolveRuntimeStatus.EXECUTING;
  const disabled = activeInvestigation === undefined || executing;

  const execute = useCallback((): ResolveCommandFeedback => {
    if (activeInvestigation === undefined) {
      const blocked = { phase: "BLOCKED", message: "Resolve blocked: no active investigation." } as const;
      return blocked;
    }
    if (executing) {
      const blocked = { phase: "BLOCKED", message: "Resolve blocked: an execution is already in progress." } as const;
      return blocked;
    }

    const focused = pair?.focused;
    const comparison = pair?.comparison;
    const guestPairRequired = activeInvestigation.workspace.guest_candidate_event !== undefined;
    if (!focused || (guestPairRequired && !comparison)) {
      const blocked = { phase: "BLOCKED", message: "Resolve blocked: select an exact System Canon comparison target for the focused case." } as const;
      return blocked;
    }

    try {
      const result = resolveRuntime.execute({
        investigation: activeInvestigation,
        knowledgeObjects,
        activeLayers: workspaceRuntime.getActiveLayers(),
        temporalContext: workspaceRuntime.getTemporalContext(),
        investigativeScale: workspaceRuntime.getInvestigativeScale(),
      }, {
        focusedKnowledgeObjectId: focused.identity.id,
        ...(comparison ? { comparisonKnowledgeObjectId: comparison.identity.id } : {}),
      });
      const evaluation = comparison ? result.candidateEvaluations.evaluations.find(item => {
        const endpoints = [item.identity.leftKnowledgeObjectId, item.identity.rightKnowledgeObjectId];
        return endpoints.includes(focused.identity.id) && endpoints.includes(comparison.identity.id);
      }) : undefined;
      if (comparison) {
        if (!evaluation) throw new Error("the deterministic Resolve result contains no evaluation for the selected exact endpoints");
        const intelligence = resolveCandidateIntelligenceCollection([evaluation]).intelligence[0];
        if (!intelligence) throw new Error("the selected evaluation could not be projected as Resolve candidate intelligence");
        workspaceRuntime.setSelection(createWorkspaceCandidateSelection(intelligence));
      }
      const completed = {
        phase: "RESOLVE_COMPLETED",
        message: "Resolve completed. No relationship has been accepted automatically. Next action: open LAYERS or inspect a Resolve candidate.",
        focusedLabel: knowledgeLabel(focused),
        comparisonLabel: comparison ? knowledgeLabel(comparison) : "Current canonical universe",
        candidateCount: result.candidateEvaluations.evaluations.length,
        executionId: result.executionId,
      } as const;
      return completed;
    } catch (error) {
      const failed = { phase: "RESOLVE_FAILED", message: `Resolve failed: ${error instanceof Error ? error.message : "unknown failure"}.` } as const;
      return failed;
    }
  }, [activeInvestigation, executing, knowledgeObjects, pair, resolveRuntime, workspaceRuntime]);

  const feedback: ResolveCommandFeedback = currentExecution && resolveState.status === ResolveRuntimeStatus.EXECUTING
    ? { phase: "RESOLVING", message: pair?.comparison ? `Resolving ${knowledgeLabel(pair.focused)} against ${knowledgeLabel(pair.comparison)}.` : "Resolve execution is in progress.", executionId: currentExecution.executionId }
    : currentExecution && resolveState.status === ResolveRuntimeStatus.ERROR
      ? { phase: "RESOLVE_FAILED", message: `Resolve failed: ${currentExecution.failureReason ?? "unknown failure"}.`, executionId: currentExecution.executionId }
      : currentExecution?.result
        ? { phase: "RESOLVE_COMPLETED", message: "Resolve completed. No relationship has been accepted automatically. Next action: open LAYERS or inspect a Resolve candidate.", focusedLabel: pair ? knowledgeLabel(pair.focused) : undefined, comparisonLabel: pair?.comparison ? knowledgeLabel(pair.comparison) : "Current canonical universe", candidateCount: currentExecution.result.candidateEvaluations.evaluations.length, executionId: currentExecution.executionId }
        : { phase: "READY_TO_RESOLVE", message: "Ready to resolve the selected comparison." };

  return {
    execute,
    disabled,
    statusText: activeInvestigation === undefined
      ? "Unavailable: no active investigation."
      : executing
        ? "Resolve execution is in progress."
        : "Runs the selected deterministic context. Empty layer selection is permitted.",
    feedback,
  };
}
