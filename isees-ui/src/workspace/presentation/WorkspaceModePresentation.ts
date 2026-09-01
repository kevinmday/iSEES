import {
  WorkspaceMode,
} from "../runtime/WorkspaceRuntimeTypes";

const MODE_LABELS: Record<WorkspaceMode, string> = {
  [WorkspaceMode.OVERVIEW]: "OVERVIEW",
  [WorkspaceMode.MANIFOLD]: "MANIFOLD",
  [WorkspaceMode.COMPARE]: "COMPARE",
  [WorkspaceMode.NARRATIVE]: "NARRATIVE",
  [WorkspaceMode.EVIDENCE]: "EVIDENCE",
  [WorkspaceMode.TIMELINE]: "TIMELINE",
  [WorkspaceMode.LAYERS]: "LAYERS",
  [WorkspaceMode.INTENTION]: "INTENTION",
  [WorkspaceMode.RESEARCH]: "STUDIO",
};

export function getWorkspaceModeLabel(
  mode: WorkspaceMode,
): string {
  return MODE_LABELS[mode];
}