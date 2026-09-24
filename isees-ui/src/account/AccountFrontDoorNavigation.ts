import { WorkspaceMode } from "../workspace/runtime/WorkspaceRuntimeTypes.ts";

export interface AccountFrontDoorNavigationRuntime {
  readonly getActiveInvestigation: () => { readonly revisions: readonly unknown[] } | undefined;
  readonly navigateToMode: (mode: WorkspaceMode) => void;
}

/** Applies the explicit owned-investigation navigation contract after activation. */
export function navigateAfterOwnedInvestigationOpen(runtime: AccountFrontDoorNavigationRuntime): void {
  if ((runtime.getActiveInvestigation()?.revisions.length ?? 0) > 0) {
    runtime.navigateToMode(WorkspaceMode.MANIFOLD);
  }
}
