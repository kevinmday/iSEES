import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  identity: { current: { status: "READY", identity: { kind: "GUEST", operatorId: "guest-1" } } as any },
  list: vi.fn(),
  listAnchors: vi.fn(),
  investigation: { id: "investigation-1", name: "Acceptance investigation" },
  research: { createAnchorsAtomically: vi.fn() },
}));

vi.mock("../../src/identity/runtime/OperatorIdentityRuntimeContext", () => ({ useOperatorIdentity: () => mocks.identity.current }));
vi.mock("../../src/workspace/runtime/WorkspaceRuntimeContext", () => ({ useWorkspaceRuntime: () => ({ getActiveInvestigation: () => mocks.investigation }) }));
vi.mock("../../src/research/ResearchBridgeContext", () => ({ useResearchBridge: () => mocks.research }));
vi.mock("../../src/research/ResearchSourceApi", () => ({ listCandidateEvidenceResearchAnchors: mocks.listAnchors }));
vi.mock("../../src/evidence/candidates/CandidateEvidenceApi", () => ({ candidateEvidenceApi: { list: mocks.list, transition: vi.fn(), intake: vi.fn(), upload: vi.fn() } }));
vi.mock("../../src/evidence/projection/EvidenceWorkspaceProjection", () => ({
  projectInvestigationEvidence: (investigation: any) => ({ investigation, records: [] }),
  createEvidenceWorkspaceView: (projection: any) => ({ ...projection, totalCount: 0, visibleCount: 0, navigator: [], availabilityCounts: {} }),
  resolveEvidenceInspection: () => undefined,
}));
vi.mock("../../src/evidence/candidates/WebDiscoveryWorkspace", () => ({
  default: ({ authenticated }: { authenticated: boolean }) => <div data-testid="discovery-mode">{authenticated ? "account discovery" : "Guest Basic Web Discovery"}</div>,
}));

import EvidenceWorkspace from "../../src/workspace/surfaces/EvidenceWorkspace";

const response = { investigationAggregateRevision: 4, manifoldRevisionId: "manifold-4", items: [{ candidateId: "candidate-owned", investigationId: "investigation-1", origin: "SUBMISSION", lifecycleState: "SUBMITTED", source: { title: "Owned candidate" } }] };
const openCandidateLane = () => fireEvent.click(screen.getByRole("button", { name: /Candidate Evidence/ }));

afterEach(() => {
  cleanup();
  mocks.list.mockReset();
  mocks.listAnchors.mockReset();
  mocks.identity.current = { status: "READY", identity: { kind: "GUEST", operatorId: "guest-1" } };
});

describe("Evidence workspace authentication", () => {
  it("does not request account-owned Candidate Evidence for a Guest", () => {
    render(<EvidenceWorkspace />);
    openCandidateLane();
    expect(mocks.list).not.toHaveBeenCalled();
    expect(screen.getByText(/Saved Candidate Evidence requires an account/)).toBeTruthy();
    expect(screen.getByTestId("discovery-mode").textContent).toBe("Guest Basic Web Discovery");
    expect(screen.queryByText("Researcher-directed intake")).toBeNull();
    expect(screen.queryByText(/request failed/i)).toBeNull();
  });

  it("loads the account-owned list for a signed-in researcher", async () => {
    mocks.identity.current = { status: "READY", identity: { kind: "ACCOUNT", operatorId: "account-1" } };
    mocks.list.mockResolvedValue(response);
    mocks.listAnchors.mockResolvedValue([]);
    render(<EvidenceWorkspace />);
    await waitFor(() => expect(mocks.list).toHaveBeenCalledWith({ investigationId: "investigation-1", principalId: "account-1" }, expect.any(AbortSignal)));
    openCandidateLane();
    expect(await screen.findByText("Owned candidate")).toBeTruthy();
    expect(screen.getByText("Researcher-directed intake")).toBeTruthy();
  });

  it("clears owned list and request errors across account-to-Guest-to-account transitions", async () => {
    mocks.identity.current = { status: "READY", identity: { kind: "ACCOUNT", operatorId: "account-1" } };
    mocks.list.mockResolvedValueOnce(response);
    mocks.listAnchors.mockResolvedValue([]);
    const view = render(<EvidenceWorkspace />);
    await waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(1));
    openCandidateLane();
    expect(await screen.findByText("Owned candidate")).toBeTruthy();

    mocks.identity.current = { status: "READY", identity: { kind: "GUEST", operatorId: "guest-2" } };
    view.rerender(<EvidenceWorkspace />);
    await act(async () => {});
    openCandidateLane();
    expect(screen.queryByText("Owned candidate")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(mocks.list).toHaveBeenCalledTimes(1);

    mocks.list.mockRejectedValueOnce(new Error("owned list failure"));
    mocks.identity.current = { status: "READY", identity: { kind: "ACCOUNT", operatorId: "account-2" } };
    view.rerender(<EvidenceWorkspace />);
    await waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(2));
    openCandidateLane();
    expect(await screen.findByText(/owned list failure/)).toBeTruthy();

    mocks.identity.current = { status: "READY", identity: { kind: "GUEST", operatorId: "guest-3" } };
    view.rerender(<EvidenceWorkspace />);
    await act(async () => {});
    openCandidateLane();
    expect(screen.queryByText(/owned list failure/)).toBeNull();
  });
});
