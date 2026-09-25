import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => {
  const capturedRepresentation = { schemaVersion: "research-record/v1", mediaType: "application/json", value: { observation: "Frozen Nimitz source snapshot", provenance: { owner: "Research Inbox", recordId: "source-1" } } };
  const anchor = { schemaVersion: "research-anchor/v2", anchorId: "anchor-1", investigationId: "investigation:nimitz", kind: "EVIDENCE_RECORD", sourceWorkspace: "EVIDENCE", sourceIdentity: "research-inbox:source-1", collectedAt: new Date("2026-09-25T12:00:00Z"), createdAt: new Date("2026-09-25T12:00:00Z"), classification: "CANONICAL", display: { title: "Frozen Nimitz source", summary: "Governed source" }, insertability: { state: "INSERTABLE", reason: "Governed source." }, capturedRepresentation, evidence: { identity: "source-1", representation: capturedRepresentation.value }, pinned: false };
  const document = { identity: { id: "document:nimitz", createdAt: new Date("2026-09-25T12:00:00Z") }, metadata: { title: "Nimitz", description: "", author: "Researcher", modifiedAt: new Date("2026-09-25T12:00:00Z"), version: 1 }, type: "REPORT", status: "MODIFIED", nodes: [] };
  return { anchor, document, projection: { status: "AVAILABLE", investigationId: "investigation:nimitz", entries: [{ anchor, order: 0 }] }, review: vi.fn(), clearReview: vi.fn() };
});

vi.mock("../../src/author/runtime/AuthorDocumentRuntimeContext", () => ({ useAuthorDocument: () => fixture.document, useAuthorDocumentRevision: () => 1 }));
vi.mock("../../src/identity/runtime/OperatorIdentityRuntimeContext", () => ({ useOperatorIdentity: () => ({ identity: { operatorId: "operator-1" } }) }));
vi.mock("../../src/workspace/runtime/WorkspaceRuntimeContext", () => ({ useActiveInvestigation: () => ({ id: "investigation:nimitz" }), useWorkspaceRuntime: () => ({ reviewStudioManifoldArtifact: fixture.review, clearStudioManifoldArtifactReview: fixture.clearReview }) }));
vi.mock("../../src/research/ResearchBridgeRuntime", () => ({ researchBridgeRuntime: { getRevision: () => 1, subscribe: () => () => {}, projectInvestigation: () => fixture.projection } }));

import StudioDraftingPanel from "../../src/studio/components/StudioDraftingPanel.tsx";
import { StudioDraftingRuntime } from "../../src/studio/drafting/StudioDraftingRuntime.ts";
import type { StudioDraftingClient } from "../../src/studio/drafting/StudioDraftingRuntime.ts";

async function makeReady(runtime: StudioDraftingRuntime) {
  const user = userEvent.setup();
  render(<StudioDraftingPanel runtimeOverride={runtime} />);
  await waitFor(() => expect(screen.getByText("Frozen Nimitz source")).toBeTruthy());
  await user.click(screen.getByRole("checkbox", { name: /Frozen Nimitz source/ }));
  await user.selectOptions(screen.getByRole("combobox", { name: "Predefined design" }), "MANIFOLD_ARTIFACT@1");
  await user.type(screen.getByRole("textbox", { name: /Researcher instructions/ }), "Project the selected frozen source.");
  await waitFor(() => expect(screen.getByText("Validation passed; no blockers.")).toBeTruthy());
  return user;
}

describe("Studio Artifact Drafting MANIFOLD_ARTIFACT interaction", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => cleanup());

  it("generates and renders the local manifest from the actual Generate Draft button", async () => {
    const client: StudioDraftingClient = { generateDraftProposal: vi.fn(async () => { throw new Error("network path must not run"); }) };
    const runtime = new StudioDraftingRuntime(client);
    const beforeDocument = JSON.stringify(fixture.document), beforeProjection = JSON.stringify(fixture.projection);
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const user = await makeReady(runtime);
    expect(screen.queryByRole("button", { name: "REVIEW IN MANIFOLD" })).toBeNull();
    const generate = screen.getByRole("button", { name: "Generate Draft" });
    generate.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(screen.getByRole("region", { name: "Manifold Artifact local projection" })).toBeTruthy());

    const preview = screen.getByLabelText("Machine-readable Manifold Artifact");
    const manifest = JSON.parse(preview.textContent!);
    expect(manifest.frozenSourceAnchors).toHaveLength(1);
    expect(manifest.normalizedProvenance[0]).toMatchObject({ sourceIdentity: "anchor-1", reference: { kind: "SOURCE_SNAPSHOT", identity: "anchor-1" } });
    expect(manifest.declarations).toEqual([]);
    expect(manifest.canonEffect).toBe("NONE");
    expect(preview.textContent).not.toMatch(/researchVector|confidence|intent|meaning/i);
    expect(screen.getAllByText(/UNAPPLIED LOCAL PROJECTION/).length).toBeGreaterThan(0);
    expect(screen.getByText("DISPOSABLE", { exact: false })).toBeTruthy();
    expect(screen.getByText("NOT ADMITTED")).toBeTruthy();
    expect(screen.getByText("Canonical Manifold effect")).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("region", { name: "Manifold Artifact local projection" }));
    let downloadedFilename = "";
    const createObjectUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:local-manifest");
    const revokeObjectUrl = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () { downloadedFilename = this.download; });
    await user.click(screen.getByRole("button", { name: "Download JSON" }));
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    expect(downloadedFilename).toBe("document-nimitz.manifold-artifact.projection");
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:local-manifest");
    expect(screen.getByRole("button", { name: "REVIEW IN MANIFOLD" })).toBeTruthy();
    const review = screen.getByRole("button", { name: "REVIEW IN MANIFOLD" });
    review.focus();
    await user.keyboard("{Enter}");
    expect(fixture.review).toHaveBeenCalledWith(runtime.getState().manifoldArtifact);
    expect(client.generateDraftProposal).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(JSON.stringify(fixture.document)).toBe(beforeDocument);
    expect(JSON.stringify(fixture.projection)).toBe(beforeProjection);
    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(screen.queryByLabelText("Machine-readable Manifold Artifact")).toBeNull();
    expect(screen.queryByRole("button", { name: "REVIEW IN MANIFOLD" })).toBeNull();
  });

  it("announces pending work and visibly reports local generation failure", async () => {
    const client: StudioDraftingClient = { generateDraftProposal: vi.fn(async () => { throw new Error("network path must not run"); }) };
    const runtime = new StudioDraftingRuntime(client, async () => { throw new Error("deterministic renderer failed"); });
    await makeReady(runtime);
    const generate = screen.getByRole("button", { name: "Generate Draft" });
    fireEvent.click(generate);
    expect((generate as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("status").textContent).toMatch(/Generating local Manifold Artifact projection/);
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/generation failed safely/i));
    expect((generate as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByLabelText("Machine-readable Manifold Artifact")).toBeNull();
    expect(client.generateDraftProposal).not.toHaveBeenCalled();
  });
});
