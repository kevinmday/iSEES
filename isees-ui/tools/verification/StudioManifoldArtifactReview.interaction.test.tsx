import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WorkspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntime";
import { WorkspaceMode } from "../../src/workspace/runtime/WorkspaceRuntimeTypes";
import ManifoldWorkspace from "../../src/workspace/surfaces/ManifoldWorkspace";
import StudioManifoldArtifactReview from "../../src/workspace/surfaces/StudioManifoldArtifactReview";
import type { StudioManifoldArtifactDraft } from "../../src/studio/drafting/StudioDraftingTypes";

const workspaceFixture = vi.hoisted(() => ({
  focusedEventId: "event:review" as string | undefined,
  review: undefined as StudioManifoldArtifactDraft | undefined,
  clearReview: vi.fn(),
  navigate: vi.fn(),
  admissionEligible:false,
}));

vi.mock("../../src/manifold/components/PrimaryInvestigationManifold", () => ({ default: ({ focusedEventId }: { focusedEventId: string }) => <div data-testid="primary-investigation-manifold">{focusedEventId}<div>Computation Projection Camera graph controls</div></div> }));
vi.mock("../../src/workspace/runtime/WorkspaceRuntimeContext", () => ({
  useActiveWorkspace: () => workspaceFixture.focusedEventId ? { focused_event_id: workspaceFixture.focusedEventId } : undefined,
  useWorkspaceRuntime: () => ({
    getStudioManifoldArtifactReview: () => workspaceFixture.review,
    clearStudioManifoldArtifactReview: workspaceFixture.clearReview,
    navigateToMode: workspaceFixture.navigate,
  }),
}));
vi.mock("../../src/studio/runtime/StudioSaveActionContext",()=>({useStudioSaveAction:()=>({admission:{authenticated:false,guest:workspaceFixture.admissionEligible,eligible:workspaceFixture.admissionEligible,investigationId:"investigation:review",operationalHeadId:"REV-0001",eligibleNodeIds:["node:one"],pending:false,stale:false,message:""},admitManifoldArtifact:vi.fn(async()=>true),refreshAdmissionAuthority:vi.fn(),viewAdmittedArtifact:vi.fn()})}));

const artifact = Object.freeze({
  kind: "MANIFOLD_ARTIFACT_DRAFT", schemaVersion: "studio-manifold-artifact-draft/v1", authorityState: "UNAPPLIED_LOCAL_PROJECTION", outputHash: "a".repeat(64),
  contextManifest: { contextContractVersion: "studio-drafting-context/v1", investigationId: "investigation:review", documentId: "document:review", baseIdentity: { documentRuntimeRevision: 1, artifactId: null, artifactVersionId: null, artifactRevision: null }, sourceSelectionMode: "SUBSET", selectedSourceAnchorIds: ["source:one"], selectedResearcherNoteNodeIds: [], artifactDesign: { designId: "MANIFOLD_ARTIFACT", designVersion: "1" }, draftingInstruction: "Review", sources: [], researcherNotes: [], excludedSources: [{ anchorId: "source:excluded", reason: "INSPECTION_ONLY" }], contextHash: "b".repeat(64), proposalEffect: "CREATES_UNAPPLIED_LOCAL_PROJECTION_ONLY" },
  projection: { kind: "MANIFOLD_ARTIFACT", schemaVersion: "studio-manifold-artifact-manifest/v1", source: { artifactId: "artifact:review", documentId: "document:review", revisionId: "revision:review", revisionNumber: 1, contentHash: `sha256:${"c".repeat(64)}`, investigationId: "investigation:review" }, frozenSourceAnchors: [], sourceKnowledgeIdentities: [{ kind: "KNOWLEDGE_OBJECT", identity: "node:one" }], evidenceReferences: [], declarations: [{ declarationId: "edge:one", declarationType: "PROPOSED_RELATIONSHIP", source: { authorship: "RESEARCHER", sourceIdentity: "document:review" }, references: [], subject: { kind: "KNOWLEDGE_OBJECT", identity: "node:one" }, predicate: "RELATES_TO", object: { kind: "ARTIFACT", identity: "$ADMITTED_ARTIFACT" }, proposalState: "PROPOSED" }], acceptedRelationshipReferences: [], normalizedProvenance: [{ provenanceId: "provenance:one", sourceIdentity: "source:one", reference: { kind: "SOURCE_SNAPSHOT", identity: "source:one", integrityHash: `sha256:${"d".repeat(64)}` } }], projectionConfiguration: { configurationIdentity: "studio-manifold-artifact", configurationVersion: "1", configurationHash: `sha256:${"e".repeat(64)}` }, canonEffect: "NONE" }
} satisfies StudioManifoldArtifactDraft);

describe("Studio Manifold Artifact governed review", () => {
  afterEach(() => {
    cleanup();
    workspaceFixture.focusedEventId = "event:review";
    workspaceFixture.review = undefined;
    workspaceFixture.clearReview.mockReset();
    workspaceFixture.navigate.mockReset();
    workspaceFixture.admissionEligible=false;
  });
  it("renders the exact proposed projection as focused read-only review", async () => {
    const onReturnToStudio = vi.fn();
    render(<StudioManifoldArtifactReview artifact={artifact} onReturnToStudio={onReturnToStudio} />);
    const review = screen.getByRole("region", { name: "Proposed Manifold Artifact" });
    await waitFor(() => expect(document.activeElement).toBe(review));
    expect(screen.getByText("PROPOSED · UNADMITTED")).toBeTruthy();
    expect(screen.getAllByText(/node:one/)).toHaveLength(3);
    expect(screen.getAllByText(/RELATES_TO/)).toHaveLength(2);
    expect(screen.getByText("source:one")).toBeTruthy();
    expect(screen.getByText(/confidence fields are excluded/)).toBeTruthy();
    expect(screen.getByText(/no Admit & Recompute command/)).toBeTruthy();
    const returnAction = screen.getByRole("button", { name: "RETURN TO STUDIO" });
    returnAction.focus();
    expect(document.activeElement).toBe(returnAction);
    fireEvent.click(returnAction);
    expect(onReturnToStudio).toHaveBeenCalledOnce();
  });

  it("offers guest admission and discloses the disposable canon boundary",async()=>{workspaceFixture.admissionEligible=true;render(<StudioManifoldArtifactReview artifact={artifact} onReturnToStudio={()=>undefined}/>);fireEvent.click(screen.getByRole("button",{name:"ADMIT & RECOMPUTE"}));const inspector=screen.getByRole("dialog",{name:"MANIFOLD ARTIFACT manifest"});fireEvent.click(within(inspector).getByRole("button",{name:"ADMIT & RECOMPUTE"}));expect(screen.getByText("Guest working copy only ? Library canon will not be changed ? Nothing will be saved.")).toBeTruthy()});

  it("keeps handoff session-only and navigates through browser history without mutation", () => {
    const runtime = new WorkspaceRuntime();
    vi.spyOn(runtime, "getActiveInvestigation").mockReturnValue({ id: "investigation:review" } as ReturnType<WorkspaceRuntime["getActiveInvestigation"]>);
    const navigate = vi.spyOn(runtime, "navigateToMode").mockImplementation(() => {});
    const before = runtime.getState();
    runtime.reviewStudioManifoldArtifact(artifact);
    expect(runtime.getStudioManifoldArtifactReview()).toBe(artifact);
    expect(runtime.getState()).toBe(before);
    expect(navigate).toHaveBeenCalledWith("MANIFOLD");
  });

  it("gives an active review exclusive ownership of the central Manifold surface", () => {
    workspaceFixture.review = artifact;
    render(<ManifoldWorkspace />);
    expect(screen.getByRole("region", { name: "Proposed Manifold Artifact" })).toBeTruthy();
    expect(screen.queryByTestId("primary-investigation-manifold")).toBeNull();
    expect(screen.queryByText("Computation Projection Camera graph controls")).toBeNull();
  });

  it("renders the ordinary Manifold unchanged when no review is active", () => {
    render(<ManifoldWorkspace />);
    expect(screen.getByTestId("primary-investigation-manifold").textContent).toContain("event:review");
    expect(screen.queryByRole("region", { name: "Proposed Manifold Artifact" })).toBeNull();
  });

  it("clears only the current handoff and returns through workspace navigation authority", () => {
    workspaceFixture.review = artifact;
    render(<ManifoldWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "RETURN TO STUDIO" }));
    expect(workspaceFixture.clearReview).toHaveBeenCalledWith(artifact);
    expect(workspaceFixture.navigate).toHaveBeenCalledWith(WorkspaceMode.RESEARCH);
    expect(workspaceFixture.review).toBe(artifact);
  });
});
