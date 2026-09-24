import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ComputationalAuthorDocument } from "../../src/author/model/AuthorDocument";
import { WorkspaceMode } from "../../src/workspace/runtime/WorkspaceRuntimeTypes";
import {
  GUEST_WORKSPACE_SESSION_STORAGE_KEY,
  clearGuestWorkspaceSession,
  createGuestWorkspaceSessionSnapshot,
  restoreGuestWorkspaceSession,
  saveGuestWorkspaceSession,
} from "../../src/workspace/persistence/GuestWorkspaceSessionPersistence";
import {
  createSessionStudioCandidate,
  getSessionCandidatePublicationBlocker,
  SessionStudioCandidateRuntime,
} from "../../src/studio/candidate/SessionStudioCandidate";

const document: ComputationalAuthorDocument = {
  identity: { id: "document:guest", createdAt: new Date("2026-09-23T10:00:00.000Z") },
  metadata: { title: "Guest finding", description: "", author: "Guest", modifiedAt: new Date("2026-09-23T10:01:00.000Z"), version: 3 },
  type: "REPORT", status: "MODIFIED",
  nodes: [{ id: "observation:1", type: "OBSERVATION", text: "Researcher-authored observation.", source: "AUTHOR", relatedReferences: [], createdAt: new Date("2026-09-23T10:01:00.000Z") } as never],
};

function snapshot(candidate: ReturnType<typeof createSessionStudioCandidate>) {
  return createGuestWorkspaceSessionSnapshot({
    ownership: { kind: "GUEST", operatorId: "guest:test", establishedAt: "2026-09-23T10:00:00.000Z" },
    createdAt: "2026-09-23T10:00:00.000Z", updatedAt: "2026-09-23T10:02:00.000Z",
    workspace: { operator: { activeMode: WorkspaceMode.OVERVIEW, layoutMode: "NORMAL" }, computational: { activeLayers: [] } },
    research: { desk: { entries: [] } }, authoring: { activeDocument: document }, candidateOverlay: { candidates: [candidate] },
  });
}

describe("Guest Studio Candidate Knowledge publication", () => {
  beforeEach(() => clearGuestWorkspaceSession());

  it("publishes eligible authored content idempotently without network or canonical mutation", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const runtime = new SessionStudioCandidateRuntime();
    const canonicalKnowledge = Object.freeze([{ id: "knowledge:1" }]);
    const operationalRevision = Object.freeze({ id: "revision:1", nodes: 1, edges: 0 });
    const candidate1 = createSessionStudioCandidate({ document, investigationId: "investigation:1", operatorId: "guest:test", createdAt: "2026-09-23T10:02:00.000Z" });
    const candidate2 = createSessionStudioCandidate({ document, investigationId: "investigation:1", operatorId: "guest:test", createdAt: "2026-09-23T10:03:00.000Z" });
    runtime.publish(candidate1); runtime.publish(candidate2);
    expect(runtime.getCandidates()).toHaveLength(1);
    expect(candidate2.candidateId).toBe(candidate1.candidateId);
    expect(candidate1).toMatchObject({ lifecycleClassification: "CANDIDATE_KNOWLEDGE", epistemicClassification: "CANDIDATE", durability: "SESSION", canonicality: "NON_CANONICAL", canonicalEffect: "NONE", acceptanceState: "UNACCEPTED", investigationId: "investigation:1" });
    expect(canonicalKnowledge).toEqual([{ id: "knowledge:1" }]);
    expect(operationalRevision).toEqual({ id: "revision:1", nodes: 1, edges: 0 });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("reports the exact authored-content blocker", () => {
    expect(getSessionCandidatePublicationBlocker({ ...document, nodes: [] }, "investigation:1")).toBe("Add at least one researcher-authored or source-backed block before publishing Candidate Knowledge.");
  });

  it("restores valid candidates, drops malformed candidates, and clears with the browser session", () => {
    const candidate = createSessionStudioCandidate({ document, investigationId: "investigation:1", operatorId: "guest:test" });
    saveGuestWorkspaceSession(snapshot(candidate));
    expect(restoreGuestWorkspaceSession()).toMatchObject({ status: "RESTORED", snapshot: { candidateOverlay: { candidates: [{ candidateId: candidate.candidateId }] } } });
    const malformed = JSON.parse(window.sessionStorage.getItem(GUEST_WORKSPACE_SESSION_STORAGE_KEY)!) as { candidateOverlay: { candidates: unknown[] } };
    malformed.candidateOverlay.candidates.push({ candidateId: "malformed" });
    window.sessionStorage.setItem(GUEST_WORKSPACE_SESSION_STORAGE_KEY, JSON.stringify(malformed));
    expect(restoreGuestWorkspaceSession()).toMatchObject({ status: "RESTORED", snapshot: { candidateOverlay: { candidates: [{ candidateId: candidate.candidateId }] } } });
    clearGuestWorkspaceSession();
    expect(restoreGuestWorkspaceSession()).toEqual({ status: "EMPTY" });
  });

  it("keeps Guest UI publication separate from durable API and presents an inspectable Manifold overlay", () => {
    const inspector = readFileSync(resolve(process.cwd(), "src/studio/components/StudioArtifactInspector.tsx"), "utf8");
    const manifold = readFileSync(resolve(process.cwd(), "src/manifold/components/PrimaryInvestigationManifold.tsx"), "utf8");
    const adoption = readFileSync(resolve(process.cwd(), "src/account/GuestInvestigationAdoption.ts"), "utf8");
    expect(inspector).toContain('operator.identity?.kind === "ACCOUNT"');
    expect(inspector).toContain("Publish Candidate to Manifold");
    expect(inspector).toContain("Candidate Knowledge · Session only · Non-canonical · Not saved to account.");
    expect(inspector).toContain("View in Manifold");
    expect(manifold).toContain("CANDIDATE KNOWLEDGE");
    expect(manifold).toContain("SESSION ONLY · NON-CANONICAL");
    expect(manifold).toContain("Excluded from canonical topology, accepted relationship counts, and Resolve inputs.");
    expect(adoption).not.toContain("candidateOverlay");
  });
});
