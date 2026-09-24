import type { WorkspaceRuntime } from "../runtime/WorkspaceRuntime";
import { WorkspaceMode } from "../runtime/WorkspaceRuntimeTypes";

/**
 * The single Library command for entering an already-active operational
 * investigation. WorkspaceRuntime remains the navigation and eligibility
 * authority, including browser-history recording.
 */
export function resumeCurrentInvestigation(runtime: WorkspaceRuntime): boolean {
  const investigation = runtime.getActiveInvestigation();
  if (investigation === undefined || investigation.revisions.length === 0) return false;
  if (runtime.getActiveMode() === WorkspaceMode.MANIFOLD) return true;
  runtime.navigateToMode(WorkspaceMode.MANIFOLD);
  return runtime.getActiveMode() === WorkspaceMode.MANIFOLD;
}
