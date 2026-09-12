import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ManifoldToolbar from "../../src/manifold/components/ManifoldToolbar";
import ManifoldProjectionStatus from "../../src/components/workspace/ManifoldProjectionStatus";
import { ResolveRuntimeProvider } from "../../src/resolve/runtime/ResolveRuntimeContext";
import { ResolveRuntime } from "../../src/resolve/runtime/ResolveRuntime";
import { ResolveEngine } from "../../src/resolve/engine/ResolveEngine";
import { WorkspaceRuntimeProvider } from "../../src/workspace/runtime/WorkspaceRuntimeContext";
import { workspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntime";
import { KnowledgeObjectRuntimeProvider } from "../../src/knowledge/runtime/KnowledgeObjectRuntimeContext";
import { bootstrapKnowledgeRuntime, buildKnowledgeBootstrapPopulation } from "../../src/knowledge/ingestion/KnowledgeRuntimeBootstrap";
import { createBlankNativeCaseDraftContent, restoreNativeCaseDraftContent, suppliedEnvelope } from "../../src/nativeCaseDraft/NativeCaseDraftFieldState";
import { createGuestCandidateInvestigation } from "../../src/workspace/guestCase/GuestCaseIntake";
import { WorkspaceSelectionKind } from "../../src/workspace/runtime/WorkspaceRuntimeTypes";

const establishedAt = "2026-09-12T12:00:00.000Z";
const identity = { status: "READY" as const, identity: { kind: "GUEST" as const, operatorId: "guest:resolve-interaction", establishedAt }, persistence: "SESSION" as const, revision: 1 };

beforeEach(() => { workspaceRuntime.deactivate(); bootstrapKnowledgeRuntime(); });
afterEach(() => { cleanup(); workspaceRuntime.deactivate(); vi.restoreAllMocks(); });

function establishGuestPair() {
  const canonical = buildKnowledgeBootstrapPopulation();
  const content = restoreNativeCaseDraftContent(createBlankNativeCaseDraftContent());
  const form = Object.freeze({ ...content, workingTitle: suppliedEnvelope("Guest Case Alpha"), observationNarrative: suppliedEnvelope("A stable luminous object was observed.") });
  const created = createGuestCandidateInvestigation(form, identity, establishedAt, "resolve-interaction-candidate", canonical);
  if (created.status !== "CREATED") throw new Error(created.message);
  const targets = canonical.filter(object => object.type === "EVENT" && object.provenance.sourceType === "SYSTEM_CANON");
  const target = targets[0]!;
  workspaceRuntime.activateGuestCandidateInvestigation(created.investigation);
  workspaceRuntime.setSelection({ kind: WorkspaceSelectionKind.COMPARISON_TARGET, eventId: target.provenance.sourceId, knowledgeObjectId: target.identity.id });
  return { canonical, created, target, replacement: targets[1]! };
}

function renderOwnerPath() {
  return render(<KnowledgeObjectRuntimeProvider><WorkspaceRuntimeProvider><ResolveRuntimeProvider><ManifoldProjectionStatus /><ManifoldToolbar onAction={vi.fn()} /></ResolveRuntimeProvider></WorkspaceRuntimeProvider></KnowledgeObjectRuntimeProvider>);
}

describe("MANIFOLD governed Resolve interaction", () => {
  it("completes the real toolbar owner after one click and rejects stale pair feedback", async () => {
    const { canonical, created, target, replacement } = establishGuestPair();
    const canonBefore = JSON.stringify(canonical);
    const executeSpy = vi.spyOn(ResolveRuntime.prototype, "execute");
    renderOwnerPath();
    expect(screen.getByText("READY TO RESOLVE")).toBeTruthy();
    expect(screen.getByText(/EVENT MANIFOLD:.*RESOLVE: UNRESOLVED/)).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "Resolve" }));
    await waitFor(() => expect(screen.getByText("RESOLVE COMPLETED")).toBeTruthy());
    expect(executeSpy).toHaveBeenCalledTimes(1);
    const feedback = screen.getByText("RESOLVE COMPLETED").parentElement!;
    expect(feedback.textContent).toContain("Focused case: Guest Case Alpha");
    expect(feedback.textContent).toContain(`Comparison case: ${target.metadata.title}`);
    const result = executeSpy.mock.results[0]!.value;
    expect(feedback.textContent).toContain(`Candidates produced: ${result.candidateEvaluations.evaluations.length}`);
    expect(feedback.textContent).toContain("No relationship has been accepted automatically");
    expect(feedback.textContent).toContain("open LAYERS or inspect a Resolve candidate");
    expect(screen.getByText(/EVENT MANIFOLD:.*RESOLVE: SYNCHRONIZED/)).toBeTruthy();
    expect(JSON.stringify(canonical)).toBe(canonBefore);
    expect(created.candidate.knowledgeObject.relationships).toEqual([]);

    act(() => workspaceRuntime.setSelection({ kind: WorkspaceSelectionKind.COMPARISON_TARGET, eventId: replacement.provenance.sourceId, knowledgeObjectId: replacement.identity.id }));
    await waitFor(() => expect(screen.getByText("READY TO RESOLVE")).toBeTruthy());
    expect(screen.queryByText("RESOLVE COMPLETED")).toBeNull();
    expect(screen.getByText(/EVENT MANIFOLD:.*RESOLVE: STALE/)).toBeTruthy();
    expect(executeSpy).toHaveBeenCalledTimes(1);
  });

  it("publishes the exact authoritative runtime failure reason as an accessible alert", async () => {
    establishGuestPair();
    vi.spyOn(ResolveEngine.prototype, "execute").mockImplementation(() => { throw new Error("exact deterministic failure reason"); });
    renderOwnerPath();
    await userEvent.click(screen.getByRole("button", { name: "Resolve" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Resolve failed: exact deterministic failure reason."));
    expect(screen.getByText(/EVENT MANIFOLD:.*RESOLVE: ERROR/)).toBeTruthy();
  });
});
