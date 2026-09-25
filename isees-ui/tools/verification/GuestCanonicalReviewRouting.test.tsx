import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Investigation } from "../../src/investigation/investigationTypes";
import { isSessionOnlyCanonicalGuestInvestigation } from "../../src/workspace/persistence/GuestWorkspaceSessionLifecycle";
import { GuestWorkspaceRestorationBoundary } from "../../src/workspace/persistence/GuestWorkspaceRestorationBoundary";
import { OperatorIdentityRuntimeProvider, useOperatorIdentity } from "../../src/identity/runtime/OperatorIdentityRuntimeContext";
import { operatorIdentityRuntime } from "../../src/identity/runtime/OperatorIdentityRuntime";
import { WorkspaceProvider } from "../../src/workspace/context/WorkspaceContext";
import { WorkspaceRuntimeProvider, useWorkspaceMode, useWorkspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntimeContext";
import { workspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntime";
import { WorkspaceMode } from "../../src/workspace/runtime/WorkspaceRuntimeTypes";
import { AuthorDocumentRuntimeProvider } from "../../src/author/runtime/AuthorDocumentRuntimeContext";
import { StudioSaveActionProvider } from "../../src/studio/runtime/StudioSaveActionProvider";
import { useStudioSaveAction } from "../../src/studio/runtime/StudioSaveActionContext";
import { CANONICAL_EVENTS } from "../../src/canonical/runtimeCorpus";
import { SystemCanonAdapter } from "../../src/federation/adapters/SystemCanonAdapter";
import { adaptSystemCanonToKnowledge } from "../../src/knowledge/ingestion/SystemCanonKnowledgeAdapter";
import { executeOverviewCanonicalActivationAndEnterWorkspace } from "../../src/workspace/surfaces/overview/OverviewCanonicalActivationCommand";

const canonical = {
  id: "investigation:nimitz",
  status: "ACTIVE",
  currentRevisionId: "revision:nimitz:1",
  revisions: [{ id: "revision:nimitz:1" }],
  workspace: { imported_events: [{ event_id: "E-TICTAC-2004", source: "SYSTEM_CANON" }] },
} as Investigation;

describe("guest canonical review routing boundary", () => {
  afterEach(() => {
    workspaceRuntime.deactivate();
    operatorIdentityRuntime.clearIdentity();
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/");
  });

  it("classifies only an unmodified canonical Library investigation as session-only", () => {
    expect(isSessionOnlyCanonicalGuestInvestigation(canonical)).toBe(true);
    expect(isSessionOnlyCanonicalGuestInvestigation({ ...canonical, workspace: { ...canonical.workspace, guest_candidate_event: { candidateId: "candidate:1" } } } as Investigation)).toBe(false);
    expect(isSessionOnlyCanonicalGuestInvestigation({ ...canonical, workspace: { ...canonical.workspace, guest_canonical_working_copy: { kind: "GUEST_CANONICAL_WORKING_COPY", sourceInvestigationId: canonical.id, sourceWorkspaceId: "workspace:nimitz", sourceRevisionId: canonical.currentRevisionId, sourceEventId: "E-TICTAC-2004" } } } as Investigation)).toBe(false);
    expect(isSessionOnlyCanonicalGuestInvestigation({ ...canonical, workspace: { ...canonical.workspace, imported_events: [{ event_id: "owned", source: "USER" }] } } as Investigation)).toBe(false);
  });

  it("clears a stale rejected-restoration screen on Back or Forward navigation", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const Broken = () => { throw new Error("render failure"); };
    const view = render(<GuestWorkspaceRestorationBoundary><Broken /></GuestWorkspaceRestorationBoundary>);
    expect(screen.getByText("We couldn’t restore this guest workspace.")).toBeTruthy();
    view.rerender(<GuestWorkspaceRestorationBoundary><main>Owned workspace restored</main></GuestWorkspaceRestorationBoundary>);
    fireEvent.popState(window);
    expect(screen.getByText("Owned workspace restored")).toBeTruthy();
    warn.mockRestore();
  });

  it("keeps Studio save/admission authority mounted through the real guest mode transition", async () => {
    operatorIdentityRuntime.initialize();
    operatorIdentityRuntime.continueAsGuest({ kind: "GUEST", operatorId: "guest:nimitz-review", establishedAt: "2026-09-25T12:00:00.000Z" });
    const adapter = new SystemCanonAdapter();
    await executeOverviewCanonicalActivationAndEnterWorkspace({ adapter, eventId: "E-TICTAC-2004", runtime: workspaceRuntime, admittedKnowledge: adaptSystemCanonToKnowledge(CANONICAL_EVENTS), activationStillCurrent: () => true });
    workspaceRuntime.restoreActiveMode(WorkspaceMode.RESEARCH);
    window.history.replaceState({ owner: "isees.workspace-runtime", version: 1, mode: WorkspaceMode.RESEARCH, investigationId: workspaceRuntime.getActiveInvestigation()!.id }, "", "/?mode=studio");

    function Projection() {
      const mode = useWorkspaceMode();
      const runtime = useWorkspaceRuntime();
      const identity = useOperatorIdentity();
      const actions = useStudioSaveAction();
      return <main><p>{mode === WorkspaceMode.RESEARCH ? "Studio projection" : "Manifold review projection"}</p><p data-testid="identity">{identity.identity?.operatorId}</p><p data-testid="investigation">{actions.admission.investigationId}</p>{mode === WorkspaceMode.RESEARCH && <button onClick={() => runtime.navigateToMode(WorkspaceMode.MANIFOLD)}>REVIEW IN MANIFOLD</button>}</main>;
    }

    render(<OperatorIdentityRuntimeProvider><GuestWorkspaceRestorationBoundary><WorkspaceProvider><WorkspaceRuntimeProvider><AuthorDocumentRuntimeProvider><StudioSaveActionProvider><Projection /></StudioSaveActionProvider></AuthorDocumentRuntimeProvider></WorkspaceRuntimeProvider></WorkspaceProvider></GuestWorkspaceRestorationBoundary></OperatorIdentityRuntimeProvider>);
    const principal = screen.getByTestId("identity").textContent;
    const investigation = screen.getByTestId("investigation").textContent;
    fireEvent.click(screen.getByRole("button", { name: "REVIEW IN MANIFOLD" }));
    await waitFor(() => expect(screen.getByText("Manifold review projection")).toBeTruthy());
    expect(window.location.search).toBe("?mode=manifold");
    expect(screen.queryByText("We couldn’t restore this guest workspace.")).toBeNull();
    expect(screen.getByTestId("identity").textContent).toBe(principal);
    expect(screen.getByTestId("investigation").textContent).toBe(investigation);
  });
});
