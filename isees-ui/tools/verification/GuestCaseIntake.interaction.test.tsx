import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GuestCaseIntake from "../../src/workspace/surfaces/GuestCaseIntake.tsx";
import { OperatorIdentityRuntimeProvider } from "../../src/identity/runtime/OperatorIdentityRuntimeContext.tsx";
import { operatorIdentityRuntime } from "../../src/identity/runtime/OperatorIdentityRuntime.ts";
import { WorkspaceRuntimeProvider } from "../../src/workspace/runtime/WorkspaceRuntimeContext.tsx";
import { workspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntime.ts";
import { WorkspaceMode, WorkspaceSelectionKind } from "../../src/workspace/runtime/WorkspaceRuntimeTypes.ts";
import { GUEST_WORKING_TITLE_REQUIRED_MESSAGE } from "../../src/workspace/guestCase/GuestCaseIntake.ts";
import { buildKnowledgeBootstrapPopulation } from "../../src/knowledge/ingestion/KnowledgeRuntimeBootstrap.ts";
import { resolveActiveOperationalGraphProjection } from "../../src/investigation/revision/OperationalGraphRevision.ts";

beforeEach(() => {
  sessionStorage.clear();
  operatorIdentityRuntime.clearIdentity();
  operatorIdentityRuntime.initialize();
  operatorIdentityRuntime.continueAsGuest({ kind: "GUEST", operatorId: "guest:intake-test", establishedAt: "2026-09-12T12:00:00.000Z" });
  workspaceRuntime.deactivate();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  workspaceRuntime.deactivate();
  operatorIdentityRuntime.clearIdentity();
});

describe("Guest case completion validation", () => {
  it("creates an isolated initial revision and navigates to its focused event", async () => {
    const user = userEvent.setup();
    const canonicalIds = new Set(buildKnowledgeBootstrapPopulation().map(object => object.identity.id));
    workspaceRuntime.setSelection({ kind: WorkspaceSelectionKind.COMPARISON_TARGET, eventId: "unrelated-event", knowledgeObjectId: "unrelated-object" });
    render(<OperatorIdentityRuntimeProvider><WorkspaceRuntimeProvider><GuestCaseIntake onCancel={() => undefined} /></WorkspaceRuntimeProvider></OperatorIdentityRuntimeProvider>);

    for (const [groupName, inputName, value] of [
      ["Working title", "Working title value", "Fresh Harbor Observation"],
      ["Observation location", "Observation location value", "North Harbor"],
      ["Observer narrative (in their own words)", "Free-form narrative", "A silent light remained above the water."],
      ["Researcher notes", "Researcher notes value", "Two photographs reported available."],
    ] as const) {
      const group = screen.getByRole("group", { name: groupName });
      await user.click(within(group).getByRole("radio", { name: "Supply value" }));
      await user.type(within(group).getByRole("textbox", { name: inputName }), value);
    }
    await user.click(screen.getByRole("button", { name: "Create Temporary Case" }));

    const investigation = workspaceRuntime.getActiveInvestigation();
    expect(investigation?.revisions).toHaveLength(1);
    expect(workspaceRuntime.getActiveMode()).toBe(WorkspaceMode.MANIFOLD);
    expect(workspaceRuntime.getSelection()).toBeUndefined();
    if (!investigation) throw new Error("Guest intake did not activate an Investigation.");
    const graph = resolveActiveOperationalGraphProjection(investigation);
    expect(graph.centerNodeId).toBe(investigation.workspace.guest_candidate_event?.candidateId);
    expect(new Set(graph.nodes.map(node => node.type))).toEqual(new Set(["EVENT", "LOCATION", "NARRATIVE", "ARTIFACT"]));
    expect(graph.nodes.every(node => !canonicalIds.has(node.id))).toBe(true);
    expect(graph.edges.every(edge => !canonicalIds.has(edge.source) && !canonicalIds.has(edge.target))).toBe(true);
  });

  it("preserves values, alerts in the completion panel, and focuses the missing title without activation", async () => {
    const user = userEvent.setup();
    render(<OperatorIdentityRuntimeProvider><WorkspaceRuntimeProvider><GuestCaseIntake onCancel={() => undefined} /></WorkspaceRuntimeProvider></OperatorIdentityRuntimeProvider>);
    const location = screen.getByRole("group", { name: "Observation location" });
    await user.click(within(location).getByRole("radio", { name: "Supply value" }));
    const locationInput = within(location).getByRole("textbox", { name: "Observation location value" });
    await user.type(locationInput, "Preserve this location");
    await user.click(screen.getByRole("button", { name: "Create Temporary Case" }));

    expect(screen.getByText(GUEST_WORKING_TITLE_REQUIRED_MESSAGE).closest('[role="alert"]')).not.toBeNull();
    expect((locationInput as HTMLInputElement).value).toBe("Preserve this location");
    const title = screen.getByRole("group", { name: "Working title" });
    expect(document.activeElement).toBe(within(title).getByRole("radio", { name: "Supply value" }));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(workspaceRuntime.getActiveInvestigation()).toBeUndefined();
  });
});
