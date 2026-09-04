import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useKnowledgeObjects } from "../../knowledge/runtime/KnowledgeObjectRuntimeContext";
import { useResolveRuntimeState } from "../../resolve/runtime/ResolveRuntimeContext";
import { useWorkspaceMode, useWorkspaceRuntime } from "../../workspace/runtime/WorkspaceRuntimeContext";
import { createIntentionDerivationSelection, createIntentionLinkSelection, createIntentionNodeSelection, IntentionSelectionKind, NO_INTENTION_SELECTION, resolveIntentionSelection, type IntentionSelection, type ResolvedIntentionSelection } from "../selection";
import { assembleIntentionWorkspaceProjection, type IntentionWorkspaceProjectionState } from "./IntentionWorkspaceModel";

interface IntentionWorkspaceContextValue {
  readonly state: IntentionWorkspaceProjectionState;
  readonly selection: IntentionSelection;
  readonly resolvedSelection: ResolvedIntentionSelection;
  readonly selectNode: (id: string) => void;
  readonly selectLink: (id: string) => void;
  readonly selectDerivation: (id: string) => void;
}

const IntentionWorkspaceContext = createContext<IntentionWorkspaceContextValue | undefined>(undefined);

export function IntentionWorkspaceProvider({ children }: { readonly children: ReactNode }) {
  useWorkspaceMode();
  const workspaceRuntime = useWorkspaceRuntime();
  const resolveState = useResolveRuntimeState();
  const knowledgeObjects = useKnowledgeObjects();
  const investigation = workspaceRuntime.getActiveInvestigation();
  const workspaceSelection = workspaceRuntime.getSelection();
  const state = useMemo(() => assembleIntentionWorkspaceProjection({ investigation, knowledgeObjects, resolveExecution: resolveState.currentExecution, workspaceSelection }), [investigation, knowledgeObjects, resolveState.currentExecution, workspaceSelection]);
  const [selection, setSelection] = useState<IntentionSelection>(NO_INTENTION_SELECTION);
  const projection = state.status === "AVAILABLE" ? state.projection : undefined;
  const resolvedSelection = useMemo(() => resolveIntentionSelection(selection, projection), [selection, projection]);

  useEffect(() => {
    if (selection.kind !== IntentionSelectionKind.NONE && resolvedSelection.kind === IntentionSelectionKind.NONE) setSelection(NO_INTENTION_SELECTION);
  }, [resolvedSelection, selection.kind]);

  const selectNode = useCallback((id: string) => { if (projection) setSelection(createIntentionNodeSelection(projection, id)); }, [projection]);
  const selectLink = useCallback((id: string) => { if (projection) setSelection(createIntentionLinkSelection(projection, id)); }, [projection]);
  const selectDerivation = useCallback((id: string) => { if (projection) setSelection(createIntentionDerivationSelection(projection, id)); }, [projection]);

  return <IntentionWorkspaceContext.Provider value={{ state, selection, resolvedSelection, selectNode, selectLink, selectDerivation }}>{children}</IntentionWorkspaceContext.Provider>;
}

export function useIntentionWorkspace() {
  const value = useContext(IntentionWorkspaceContext);
  if (!value) throw new Error("useIntentionWorkspace must be used inside IntentionWorkspaceProvider");
  return value;
}
