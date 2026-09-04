import type { ComputationalAuthorDocument } from "../../author/model/AuthorDocument";
import type { ResearchInboxProjection } from "../../research/researchBridgeTypes";
import type { StudioScope } from "../api/StudioApi";
import { assembleStudioDraftingContext } from "./StudioDraftingContext.ts";
import { STUDIO_DRAFTING_LIMITS, StudioDraftingValidationError, type AssembledStudioDraftingContext, type DraftingSelectionMode, type StudioDraftProposal, type StudioDraftingRequest } from "./StudioDraftingTypes.ts";
import { STUDIO_ARTIFACT_DESIGNS, type StudioArtifactDesignDefinition } from "./StudioArtifactDesigns.ts";

export type StudioDraftingStatus = "NOT_READY" | "READY" | "PREPARING_CONTEXT" | "GENERATING" | "PROPOSAL_READY" | "GENERATION_FAILED" | "CANCELLED" | "STALE" | "DISCARDED";
export interface StudioDraftingEnvironment { scope?: StudioScope; document?: ComputationalAuthorDocument; documentRuntimeRevision: number; researchRevision: number; researchProjection: ResearchInboxProjection }
export interface StudioDraftingState {
  status: StudioDraftingStatus; sourceSelectionMode: DraftingSelectionMode; selectedSourceAnchorIds: readonly string[]; selectedResearcherNoteNodeIds: readonly string[];
  design: StudioArtifactDesignDefinition; draftingInstruction: string; assembled?: AssembledStudioDraftingContext; proposal?: StudioDraftProposal; preservedProposal?: StudioDraftProposal; message: string; requestSequence: number;
}
export interface StudioDraftingClient { generateDraftProposal(scope: StudioScope, command: StudioDraftingRequest, signal?: AbortSignal): Promise<StudioDraftProposal> }
type Listener = () => void;

const initial = (): StudioDraftingState => ({ status: "NOT_READY", sourceSelectionMode: "SUBSET", selectedSourceAnchorIds: [], selectedResearcherNoteNodeIds: [], design: STUDIO_ARTIFACT_DESIGNS[0]!, draftingInstruction: "", message: "Select context and enter drafting instructions.", requestSequence: 0 });
const sameEnvironment = (a: StudioDraftingEnvironment | undefined, b: StudioDraftingEnvironment) => a?.scope?.investigationId === b.scope?.investigationId && a?.scope?.principalId === b.scope?.principalId && a?.document?.identity.id === b.document?.identity.id && a?.documentRuntimeRevision === b.documentRuntimeRevision && a?.researchRevision === b.researchRevision;

export class StudioDraftingRuntime {
  private state = initial(); private environment?: StudioDraftingEnvironment; private listeners = new Set<Listener>(); private preparationSequence = 0; private requestSequence = 0; private abort?: AbortController; private readonly client: StudioDraftingClient;
  constructor(client: StudioDraftingClient) { this.client = client; }
  getState(): Readonly<StudioDraftingState> { return this.state; }
  subscribe(listener: Listener): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  private publish(next: Partial<StudioDraftingState>): void { this.state = { ...this.state, ...next }; this.listeners.forEach(listener => listener()); }
  private invalidate(status: StudioDraftingStatus, message: string, resetSelection = false): void {
    this.abort?.abort(); this.abort = undefined; this.requestSequence += 1; this.preparationSequence += 1;
    this.publish({ status, message, assembled: undefined, proposal: undefined, preservedProposal: undefined, requestSequence: this.requestSequence, ...(resetSelection ? { sourceSelectionMode: "SUBSET" as const, selectedSourceAnchorIds: [], selectedResearcherNoteNodeIds: [] } : {}) });
  }
  updateEnvironment(environment: StudioDraftingEnvironment): void {
    if (sameEnvironment(this.environment, environment)) { this.environment = environment; return; }
    const prior = this.environment; this.environment = environment;
    const identityChanged = prior && (prior.scope?.investigationId !== environment.scope?.investigationId || prior.document?.identity.id !== environment.document?.identity.id);
    const revisionChanged = prior && !identityChanged && prior.documentRuntimeRevision !== environment.documentRuntimeRevision;
    const researchChanged = prior && !identityChanged && prior.researchRevision !== environment.researchRevision;
    const becameStale = Boolean((revisionChanged || researchChanged) && (this.state.proposal || this.state.status === "GENERATING"));
    if (identityChanged) this.invalidate("NOT_READY", "The active Investigation or document changed. Drafting selection was cleared.", true);
    else if (revisionChanged && (this.state.proposal || this.state.status === "GENERATING")) this.invalidate("STALE", "The document revision changed. The proposal is stale.");
    else if (researchChanged && (this.state.proposal || this.state.status === "GENERATING")) this.invalidate("STALE", "The active Investigation source context changed. The proposal is stale.");
    void this.prepare(becameStale);
  }
  setSourceSelectionMode(mode: DraftingSelectionMode): void { if (mode === this.state.sourceSelectionMode) return; this.selectionChanged({ sourceSelectionMode: mode, selectedSourceAnchorIds: [] }); }
  setSourceSelected(anchorId: string, selected: boolean): void { const ids = new Set(this.state.selectedSourceAnchorIds); if (selected) ids.add(anchorId); else ids.delete(anchorId); this.selectionChanged({ selectedSourceAnchorIds: [...ids] }); }
  selectAllEligibleSources(): void { const ids = this.eligibleSourceIds(); this.selectionChanged({ sourceSelectionMode: "SUBSET", selectedSourceAnchorIds: ids }); }
  clearSelectedSources(): void { this.selectionChanged({ selectedSourceAnchorIds: [] }); }
  setNoteSelected(nodeId: string, selected: boolean): void { const ids = new Set(this.state.selectedResearcherNoteNodeIds); if (selected) ids.add(nodeId); else ids.delete(nodeId); this.selectionChanged({ selectedResearcherNoteNodeIds: [...ids] }); }
  setDesign(design: StudioArtifactDesignDefinition): void { this.selectionChanged({ design }); }
  setDraftingInstruction(value: string): void { this.selectionChanged({ draftingInstruction: value }); }
  private selectionChanged(next: Partial<StudioDraftingState>): void { this.abort?.abort(); this.abort = undefined; this.requestSequence += 1; const hadProposal = Boolean(this.state.proposal); this.publish({ ...next, proposal: undefined, preservedProposal: undefined, assembled: undefined, status: hadProposal ? "STALE" : "PREPARING_CONTEXT", message: hadProposal ? "Context selection changed. The previous proposal is stale." : "Preparing deterministic context…", requestSequence: this.requestSequence }); void this.prepare(hadProposal); }
  private eligibleSourceIds(): string[] { return (this.environment?.researchProjection.entries ?? []).filter(({ anchor }) => anchor.insertability.state === "INSERTABLE" && anchor.classification !== "UNDETERMINED").map(({ anchor }) => anchor.anchorId); }
  async prepare(retainStale = false): Promise<void> {
    const sequence = ++this.preparationSequence; const environment = this.environment;
    if (!environment?.scope || !environment.document) { this.publish({ status: "NOT_READY", assembled: undefined, message: !environment?.document ? "Create or restore an active .author document before drafting." : "An active Investigation and operator identity are required." }); return; }
    if (this.state.draftingInstruction.length > STUDIO_DRAFTING_LIMITS.maxInstructionChars) { this.publish({ status: "NOT_READY", assembled: undefined, message: `Drafting instructions exceed ${STUDIO_DRAFTING_LIMITS.maxInstructionChars} characters.` }); return; }
    try {
      const assembled = await assembleStudioDraftingContext({ investigationId: environment.scope.investigationId, document: environment.document, documentRuntimeRevision: environment.documentRuntimeRevision, sourceSelectionMode: this.state.sourceSelectionMode, selectedSourceAnchorIds: this.state.sourceSelectionMode === "ALL" ? [] : this.state.selectedSourceAnchorIds, selectedResearcherNoteNodeIds: this.state.selectedResearcherNoteNodeIds, researchProjection: environment.researchProjection, artifactDesign: this.state.design, draftingInstruction: this.state.draftingInstruction });
      if (sequence !== this.preparationSequence) return; this.publish({ assembled, status: retainStale ? "STALE" : "READY", message: retainStale ? "The previous proposal is stale. The updated deterministic context is ready for explicit regeneration." : "Deterministic context is ready. Generation requires an explicit request." });
    } catch (error) { if (sequence !== this.preparationSequence) return; const message = error instanceof StudioDraftingValidationError ? error.message : "Drafting context could not be prepared safely."; this.publish({ assembled: undefined, status: "NOT_READY", message }); }
  }
  async generate(): Promise<void> {
    if (this.state.status === "GENERATING" || !this.state.assembled || !this.environment?.scope) return;
    const assembled = this.state.assembled; const scope = this.environment.scope; const sequence = ++this.requestSequence; const controller = new AbortController(); this.abort = controller; const prior = this.state.proposal ?? this.state.preservedProposal;
    this.publish({ status: "GENERATING", message: prior ? "Regenerating an unapplied proposal…" : "Generating an unapplied proposal…", requestSequence: sequence, preservedProposal: prior });
    try {
      const proposal = await this.client.generateDraftProposal(scope, { requestContractVersion: "studio-drafting-request/v1", investigationId: scope.investigationId, principalId: scope.principalId, contextHash: assembled.contextHash, context: assembled.context }, controller.signal);
      if (sequence !== this.requestSequence || controller.signal.aborted) return;
      const validIds = new Set(assembled.context.sources.map(source => source.anchorId)); const unknown = proposal.blocks.some(block => block.sourceReferences.some(reference => !validIds.has(reference.anchorId)));
      const matches = proposal.proposalContractVersion === "studio-draft-proposal/v1" && proposal.contextContractVersion === "studio-drafting-context/v1" && proposal.outcome === "GENERATED" && proposal.investigationId === scope.investigationId && proposal.documentId === assembled.context.documentId && proposal.baseIdentity.documentRuntimeRevision === assembled.context.baseIdentity.documentRuntimeRevision && proposal.artifactDesign.designId === assembled.context.artifactDesign.designId && proposal.artifactDesign.designVersion === assembled.context.artifactDesign.designVersion && proposal.contextHash === assembled.contextHash;
      if (!matches || unknown) { this.publish({ status: "STALE", proposal: undefined, message: unknown ? "The response referenced a source outside the submitted context and was rejected." : "The response did not match the captured drafting context and is stale." }); return; }
      this.publish({ status: "PROPOSAL_READY", proposal, preservedProposal: undefined, message: "UNAPPLIED DRAFT ready for review. The .author document is unchanged." });
    } catch {
      if (sequence !== this.requestSequence || controller.signal.aborted) return;
      this.publish({ status: "GENERATION_FAILED", proposal: prior, preservedProposal: prior, message: "Draft generation is unavailable or failed safely. No document or artifact was changed." });
    } finally { if (this.abort === controller) this.abort = undefined; }
  }
  cancel(): void { if (this.state.status !== "GENERATING") return; this.abort?.abort(); this.abort = undefined; this.requestSequence += 1; this.publish({ status: "CANCELLED", message: "Generation cancelled. Late responses will be ignored.", requestSequence: this.requestSequence, proposal: this.state.preservedProposal }); }
  discard(): void { this.abort?.abort(); this.abort = undefined; this.requestSequence += 1; this.publish({ status: "DISCARDED", proposal: undefined, preservedProposal: undefined, message: "The transient proposal was discarded. The .author document is unchanged.", requestSequence: this.requestSequence }); }
}
