import { StrictMode } from "react";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NativeCaseDraftEditor } from "../../src/nativeCaseDraft/NativeCaseDraftEditor.tsx";
import { NATIVE_CASE_DRAFT_FIELD_ORDER, createBlankNativeCaseDraftContent } from "../../src/nativeCaseDraft/NativeCaseDraftFieldState.ts";
import type { NativeCaseDraftApiDependency, NativeCaseDraftCoordinatorState } from "../../src/nativeCaseDraft/NativeCaseDraftCoordinator.ts";
import type { NativeCaseDraftContent, NativeCaseDraftCreateCommand, NativeCaseDraftProjection, NativeCaseDraftReceipt } from "../../src/nativeCaseDraft/NativeCaseDraftTypes.ts";

const labels = ["Working title", "Observation location", "Local observation date", "Local observation time", "Timezone", "Observer narrative (in their own words)", "Object shape", "Movement behavior", "Sound characteristics", "Lighting/visibility", "Observer context", "Witness count", "Environmental conditions", "Approximate duration in seconds", "Researcher notes", "Source/provenance statement", "Privacy classification", "Rights/publication restrictions"] as const;
const projection = (content: NativeCaseDraftContent): NativeCaseDraftProjection => ({ schemaVersion: "native-case-draft-projection/v1", candidateId: "candidate-1", ownership: { kind: "RESEARCHER_OWNED", researcherId: "researcher-1" }, investigationId: "investigation-1", knowledgeClassification: "CANDIDATE_KNOWLEDGE", lifecycle: "DRAFT", revision: 0, freshnessToken: "candidate-1:0", content, createdAt: "2026-09-09T12:00:00Z", updatedAt: "2026-09-09T12:00:00Z", operationalMaterialization: "NONE", systemCanonIdentity: null });
const receipt = (command: NativeCaseDraftCreateCommand): NativeCaseDraftReceipt => ({ ...projection(command.content), idempotencyDisposition: "CREATED" });

afterEach(cleanup);

describe("NativeCaseDraftEditor Strict Mode interaction", () => {
  it("keeps all tri-state fields live and preserves the free-form narrative contract", async () => {
    const user = userEvent.setup();
    let latest: NativeCaseDraftCoordinatorState | undefined;
    const creates: NativeCaseDraftCreateCommand[] = [];
    const api: NativeCaseDraftApiDependency = {
      create: vi.fn(async command => { creates.push(command); return receipt(command); }),
      update: vi.fn(async (_candidateId, command): Promise<NativeCaseDraftReceipt> => ({ ...projection(command.content), revision: 1, freshnessToken: "candidate-1:1", idempotencyDisposition: "UPDATED" })),
      get: vi.fn(),
    };
    const view = render(<StrictMode><NativeCaseDraftEditor api={api} investigationId="investigation-1" generateIdempotencyKey={() => "key-1"} confirmDiscard={() => true} onStateChange={state => { latest = state; }} /></StrictMode>);

    expect(screen.getAllByRole("group")).toHaveLength(18);
    for (const label of labels) {
      const fieldset = screen.getByRole("group", { name: label });
      const omitted = within(fieldset).getByRole("radio", { name: "Not answered" });
      const unknown = within(fieldset).getByRole("radio", { name: "Unknown" });
      const supplied = within(fieldset).getByRole("radio", { name: "Supply value" });
      expect((omitted as HTMLInputElement).checked).toBe(true);
      await user.click(unknown);
      expect((unknown as HTMLInputElement).checked).toBe(true);
      await user.click(supplied);
      expect((supplied as HTMLInputElement).checked).toBe(true);
      const valueControl = fieldset.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input:not([type=radio]), textarea, select");
      expect(valueControl).not.toBeNull();
      expect(valueControl?.disabled).toBe(false);
      await user.click(omitted);
      expect((omitted as HTMLInputElement).checked).toBe(true);
    }

    const narrative = "First line exactly.\nSecond line — unchanged.";
    const narrativeField = screen.getByRole("group", { name: labels[5] });
    const narrativeBox = within(narrativeField).getByRole("textbox", { name: "Free-form narrative" });
    await user.type(narrativeBox, narrative);
    expect((within(narrativeField).getByRole("radio", { name: "Supply value" }) as HTMLInputElement).checked).toBe(true);
    expect(latest?.form.observationNarrative).toEqual({ state: "SUPPLIED", value: narrative });
    expect(latest?.dirty).toBe(true);
    await user.click(screen.getByRole("button", { name: "Discard Unsaved Changes" }));
    expect(latest?.form.observationNarrative).toEqual({ state: "OMITTED" });
    expect(latest?.dirty).toBe(false);
    view.unmount();

    const savedNarrative = "Saved first line\n\nSaved final line";
    const savedContent: NativeCaseDraftContent = { ...createBlankNativeCaseDraftContent(), observationNarrative: { state: "SUPPLIED", value: savedNarrative } };
    render(<StrictMode><NativeCaseDraftEditor api={api} initialProjection={projection(savedContent)} generateIdempotencyKey={() => "key-2"} confirmDiscard={() => true} onStateChange={state => { latest = state; }} /></StrictMode>);
    const savedField = screen.getByRole("group", { name: labels[5] });
    expect((within(savedField).getByRole("textbox", { name: "Free-form narrative" }) as HTMLTextAreaElement).value).toBe(savedNarrative);
    const unknown = within(savedField).getByRole("radio", { name: "Unknown" });
    unknown.focus();
    await user.keyboard(" ");
    expect((unknown as HTMLInputElement).checked).toBe(true);
    expect(within(savedField).queryByRole("textbox", { name: "Free-form narrative" })).toBeNull();
    const supply = within(savedField).getByRole("radio", { name: "Supply value" });
    await user.click(supply);
    const restoredBox = within(savedField).getByRole("textbox", { name: "Free-form narrative" });
    expect(document.activeElement).toBe(restoredBox);
    await user.type(restoredBox, narrative);
    await user.clear(restoredBox);
    expect((within(savedField).getByRole("radio", { name: "Not answered" }) as HTMLInputElement).checked).toBe(true);
    await user.type(within(savedField).getByRole("textbox", { name: "Free-form narrative" }), narrative);
    const notesField = screen.getByRole("group", { name: "Researcher notes" });
    await user.click(within(notesField).getByRole("radio", { name: "Supply value" }));
    await user.type(within(notesField).getByRole("textbox", { name: "Researcher notes value" }), "Independent researcher note");
    expect(latest?.form.observationNarrative).toEqual({ state: "SUPPLIED", value: narrative });
    expect(latest?.form.researcherNotes).toEqual({ state: "SUPPLIED", value: "Independent researcher note" });
    await user.click(screen.getByRole("button", { name: "Save Draft" }));
    await waitFor(() => expect(vi.mocked(api.update).mock.calls).toHaveLength(1));
    const updateCommand = vi.mocked(api.update).mock.calls[0]?.[1];
    expect(updateCommand?.content.observationNarrative).toEqual({ state: "SUPPLIED", value: narrative });
    expect(updateCommand?.content.researcherNotes).toEqual({ state: "SUPPLIED", value: "Independent researcher note" });
    expect(creates).toHaveLength(0);
  });
});
