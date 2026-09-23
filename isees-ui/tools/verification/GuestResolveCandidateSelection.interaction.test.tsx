import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/manifold/components/InvestigationGraph", () => ({ default: () => <div data-testid="investigation-graph" /> }));
vi.mock("../../src/rex/RexExploreControl.tsx", () => ({ RexExploreControl: () => null }));

import RightPanel from "../../src/components/RightPanel";
import ManifoldProjectionStatus from "../../src/components/workspace/ManifoldProjectionStatus";
import { bootstrapKnowledgeRuntime, buildKnowledgeBootstrapPopulation } from "../../src/knowledge/ingestion/KnowledgeRuntimeBootstrap";
import { KnowledgeObjectRuntimeProvider } from "../../src/knowledge/runtime/KnowledgeObjectRuntimeContext";
import PrimaryInvestigationManifold from "../../src/manifold/components/PrimaryInvestigationManifold";
import ManifoldToolbar from "../../src/manifold/components/ManifoldToolbar";
import { createBlankNativeCaseDraftContent, restoreNativeCaseDraftContent, suppliedEnvelope } from "../../src/nativeCaseDraft/NativeCaseDraftFieldState";
import { ResearchBridgeProvider } from "../../src/research/ResearchBridgeContext";
import { ResolveRuntimeProvider } from "../../src/resolve/runtime/ResolveRuntimeContext";
import { ResolveRuntime } from "../../src/resolve/runtime/ResolveRuntime";
import { createGuestCandidateInvestigation } from "../../src/workspace/guestCase/GuestCaseIntake";
import { guestWorkspaceSessionLifecycle } from "../../src/workspace/persistence/GuestWorkspaceSessionLifecycle";
import { workspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntime";
import { WorkspaceRuntimeProvider } from "../../src/workspace/runtime/WorkspaceRuntimeContext";
import { WorkspaceSelectionKind } from "../../src/workspace/runtime/WorkspaceRuntimeTypes";

const establishedAt = "2026-09-23T12:00:00.000Z";
const principal = Object.freeze({ kind: "GUEST" as const, operatorId: "guest:candidate-selection", establishedAt });

beforeEach(() => { workspaceRuntime.deactivate(); bootstrapKnowledgeRuntime(); });
afterEach(() => { cleanup(); workspaceRuntime.deactivate(); vi.restoreAllMocks(); });

function establishGuestInvestigation() {
  const canonical = buildKnowledgeBootstrapPopulation();
  const content = restoreNativeCaseDraftContent(createBlankNativeCaseDraftContent());
  const created = createGuestCandidateInvestigation(Object.freeze({ ...content, workingTitle: suppliedEnvelope("Guest Selection Case"), observationNarrative: suppliedEnvelope("A stable luminous object was observed by several witnesses.") }), { status: "READY", identity: principal, persistence: "SESSION", revision: 1 }, establishedAt, "candidate-selection", canonical);
  if (created.status !== "CREATED") throw new Error(created.message);
  workspaceRuntime.activateGuestCandidateInvestigation(created.investigation);
  const target = canonical.find(object => object.type === "EVENT" && object.provenance.sourceType === "SYSTEM_CANON");
  if (!target) throw new Error("System Canon comparison fixture unavailable.");
  workspaceRuntime.setSelection({ kind: WorkspaceSelectionKind.COMPARISON_TARGET, eventId: target.provenance.sourceId, knowledgeObjectId: target.identity.id });
  return { canonical, created };
}

function Workspace() {
  const investigation = workspaceRuntime.getActiveInvestigation();
  if (!investigation) throw new Error("Active investigation unavailable.");
  return <ResearchBridgeProvider><ManifoldProjectionStatus /><ManifoldToolbar onAction={() => undefined} /><PrimaryInvestigationManifold focusedEventId={investigation.focusedEventId} /><aside aria-label="Selection Intelligence"><RightPanel /></aside></ResearchBridgeProvider>;
}

describe("guest Resolve candidate selection ownership", () => {
  it("keeps candidate inspection in the active guest workspace without restoration or graph mutation", async () => {
    const { canonical, created } = establishGuestInvestigation();
    const investigationId = created.investigation.id;
    const focusedEventId = created.investigation.focusedEventId;
    const principalBefore = JSON.stringify(principal);
    const investigationBefore = JSON.stringify(workspaceRuntime.getActiveInvestigation());
    const canonBefore = JSON.stringify(canonical);
    const restoreSpy = vi.spyOn(guestWorkspaceSessionLifecycle, "start");
    const locationBefore = window.location.href;

    const executeSpy = vi.spyOn(ResolveRuntime.prototype, "execute");
    render(<KnowledgeObjectRuntimeProvider><WorkspaceRuntimeProvider><ResolveRuntimeProvider><Workspace /></ResolveRuntimeProvider></WorkspaceRuntimeProvider></KnowledgeObjectRuntimeProvider>);
    expect(screen.getAllByRole("button", { name: "COMPUTE RELATIONSHIPS" })).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "COMPUTE RELATIONSHIPS" }));
    await waitFor(() => expect(screen.getByText("RESULT CURRENT")).toBeTruthy());
    expect(executeSpy).toHaveBeenCalledTimes(1);

    const candidateRegion = screen.getByText("RELATIONSHIP CANDIDATES").closest("details")!;
    const focusedKnowledgeId = created.candidate.knowledgeObject.identity.id;
    const allCandidates = within(candidateRegion).getAllByRole("button").filter(button => button.textContent?.includes("RELATIONSHIP CANDIDATE "));
    const candidates = allCandidates.filter(button => button.textContent?.includes(focusedKnowledgeId));
    expect(candidates.length).toBeGreaterThanOrEqual(3);

    for (const candidate of candidates.slice(0, 3)) {
      await userEvent.click(candidate);
      await waitFor(() => expect(within(screen.getByRole("complementary", { name: "Selection Intelligence" })).getByText("Aggregate")).toBeTruthy());
      expect(workspaceRuntime.getSelection()).toMatchObject({ kind: WorkspaceSelectionKind.CANDIDATE, executionId: expect.any(String) });
      expect(screen.getByText("RESULT CURRENT")).toBeTruthy();
      expect(screen.queryByText("RESULT OUT OF DATE")).toBeNull();
      expect(executeSpy).toHaveBeenCalledTimes(1);
      expect(workspaceRuntime.getActiveInvestigation()?.id).toBe(investigationId);
      expect(workspaceRuntime.getActiveInvestigation()?.focusedEventId).toBe(focusedEventId);
      expect(JSON.stringify(principal)).toBe(principalBefore);
      expect(screen.queryByText("We couldn’t restore this guest workspace.")).toBeNull();
      expect(window.location.href).toBe(locationBefore);
    }

    expect(restoreSpy).not.toHaveBeenCalled();
    expect(JSON.stringify(workspaceRuntime.getActiveInvestigation())).toBe(investigationBefore);
    expect(JSON.stringify(canonical)).toBe(canonBefore);
    expect(screen.getByRole("button", { name: /Explain metric: Aggregate correspondence/ })).toBeTruthy();
    expect(screen.getByText("RELATIONSHIP CANDIDATES")).toBeTruthy();

    await userEvent.click(allCandidates[3]!);
    const acceptButton = within(candidateRegion).getByRole("button", { name: /Create a canonical relationship/ });
    expect(acceptButton.textContent).toContain("ACCEPT RELATIONSHIP");
    await userEvent.click(acceptButton);
    await waitFor(() => expect(within(candidateRegion).getByText("RELATIONSHIP ACCEPTED")).toBeTruthy());
    expect(executeSpy).toHaveBeenCalledTimes(1);
    expect(within(candidateRegion).getAllByText("RELATIONSHIP ACCEPTED")).toHaveLength(1);
    expect(screen.getByText("RESULT CURRENT")).toBeTruthy();

    await userEvent.click(allCandidates[4]!);
    const currentSelection = workspaceRuntime.getSelection();
    if (currentSelection?.kind !== WorkspaceSelectionKind.CANDIDATE) throw new Error("Current candidate selection unavailable.");
    workspaceRuntime.setSelection({ ...currentSelection, executionId: "resolve:older-execution" });
    await waitFor(() => expect(screen.getByText(/RESULT OUT OF DATE/)).toBeTruthy());
    expect(within(candidateRegion).getByText("RECOMPUTE REQUIRED")).toBeTruthy();
    expect(executeSpy).toHaveBeenCalledTimes(1);
  });
});
