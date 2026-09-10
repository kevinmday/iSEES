import { useCallback } from "react";

import { useKnowledgeObjectRuntime } from "../../knowledge/runtime/KnowledgeObjectRuntimeContext";
import { useWorkspaceRuntime } from "../../workspace/runtime/WorkspaceRuntimeContext";
import { useResolveRuntime, useResolveRuntimeState } from "./ResolveRuntimeContext";
import { ResolveRuntimeStatus } from "./ResolveRuntimeTypes";

export interface ResolveExecutionCommand {
  readonly execute: () => void;
  readonly disabled: boolean;
  readonly statusText: string;
}

/** Single UI orchestration boundary; ResolveRuntime remains the sole executor. */
export function useResolveExecutionCommand(): ResolveExecutionCommand {
  const knowledgeRuntime = useKnowledgeObjectRuntime();
  const workspaceRuntime = useWorkspaceRuntime();
  const resolveRuntime = useResolveRuntime();
  const resolveState = useResolveRuntimeState();
  const activeInvestigation = workspaceRuntime.getActiveInvestigation();
  const executing = resolveState.status === ResolveRuntimeStatus.EXECUTING;
  const disabled = activeInvestigation === undefined || executing;

  const execute = useCallback((): void => {
    if (disabled || activeInvestigation === undefined) return;

    resolveRuntime.execute({
      investigation: activeInvestigation,
      knowledgeObjects: knowledgeRuntime.getObjects(),
      activeLayers: workspaceRuntime.getActiveLayers(),
      temporalContext: workspaceRuntime.getTemporalContext(),
      investigativeScale: workspaceRuntime.getInvestigativeScale(),
    });
  }, [activeInvestigation, disabled, knowledgeRuntime, resolveRuntime, workspaceRuntime]);

  return {
    execute,
    disabled,
    statusText: activeInvestigation === undefined
      ? "Unavailable: no active investigation."
      : executing
        ? "Resolve execution is in progress."
        : "Runs the selected deterministic context. Empty layer selection is permitted.",
  };
}
