import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GuestCaseIntake from "../../src/workspace/surfaces/GuestCaseIntake.tsx";
import { OperatorIdentityRuntimeProvider } from "../../src/identity/runtime/OperatorIdentityRuntimeContext.tsx";
import { operatorIdentityRuntime } from "../../src/identity/runtime/OperatorIdentityRuntime.ts";
import { WorkspaceRuntimeProvider } from "../../src/workspace/runtime/WorkspaceRuntimeContext.tsx";
import { workspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntime.ts";
import { GUEST_WORKING_TITLE_REQUIRED_MESSAGE } from "../../src/workspace/guestCase/GuestCaseIntake.ts";

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
