// ============================================================
// src/workspace/runtime/WorkspaceRuntime.ts
// P56
// RUNTIME-OWNED INVESTIGATION STATE
//
// The Workspace Runtime is the deterministic owner of the
// operator's active Investigation Session.
//
// It owns:
//
// • Active Workspace
// • Active Investigation
// • Focused Event
// • Operator State
// • Computational Configuration C = (L, T, S)
//
// The Workspace Runtime performs no mathematical computation.
//
// Computational execution remains owned by:
//
// • Manifold Runtime
// • ResolveRuntime
// • ResolveEngine
//
// Ownership:
//
// Operator
//      ↓
// Main Layout
//      ↓
// Workspace Runtime
//      ├── Active Workspace
//      ├── Active Investigation
//      ├── Focused Event
//      ├── Operator State
//      ├── Computational Configuration
//      │       ├── L — Active Layers
//      │       ├── T — Temporal Context
//      │       └── S — Investigative Scale
//      ├── Manifold Runtime
//      ├── Corpus
//      └── Artifacts
//
// ============================================================

import {
  manifoldRuntime,
} from "../../manifold/engine/manifoldRuntime";

import type {
  Workspace,
} from "../workspaceTypes";

import type {
  Investigation,
} from "../../investigation/investigationTypes";
import type { StudioManifoldArtifactDraft } from "../../studio/drafting/StudioDraftingTypes";
import { validateManifoldArtifactManifest } from "../../studio/contracts/StudioCanonicalSerialization";
import type { MaterializedOwnedActivation } from "../../investigation/continuity/OwnedInvestigationContinuity";
import { computeGuestManifoldArtifactAdmission, type GuestAdmissionCommand, type GuestAdmissionResult } from "../../studio/runtime/GuestManifoldArtifactAdmission";

import {
  validateOperationalRevisionInvestigation,
} from "../../investigation/revision/OperationalGraphRevision";

import {
  WorkspaceMode,
  WorkspaceLayoutMode,
} from "./WorkspaceRuntimeTypes";

import type {
  WorkspaceRuntimeState,
  WorkspaceOperatorState,
  WorkspaceMode as WorkspaceModeType,
  WorkspaceModeAvailability,
  WorkspaceSelection,
  WorkspaceComputationalConfiguration,
} from "./WorkspaceRuntimeTypes";

// ============================================================
// TYPES
// ============================================================

type WorkspaceRuntimeListener =
  () => void;

type WorkspaceNavigationRecorder = (mode: WorkspaceModeType) => void;

// ============================================================
// DEFAULT COMPUTATIONAL CONFIGURATION
// ============================================================
//
// T and S intentionally remain opaque.
//
// Their mathematical representations are owned by later
// canonical realization work.
//
// The Workspace Runtime merely owns and transports their
// deterministic configuration values.
//
// ============================================================

const DEFAULT_COMPUTATIONAL_CONFIGURATION:
WorkspaceComputationalConfiguration = {

  activeLayers:
    [],

  temporalContext:
    undefined,

  investigativeScale:
    undefined,

};

// ============================================================
// RUNTIME
// ============================================================

export class WorkspaceRuntime {
  private manifoldArtifactReview?: StudioManifoldArtifactDraft;

  private readonly guestArtifactAdmissions = new Map<string, { signature: string; result: GuestAdmissionResult }>();

  private readonly guestCanonicalWorkingCopies = new Map<string, Investigation>();

  private navigationRecorder: WorkspaceNavigationRecorder | undefined;

  private state:
    WorkspaceRuntimeState = {

      status:
        "INITIALIZING",

      session: {

        workspace:
          undefined,

       investigation:
          undefined,

        focusedEvent:
          undefined,

        artifacts:
          [],

      },

      operator: {

        activeMode:
          WorkspaceMode.OVERVIEW,

        layoutMode:
          WorkspaceLayoutMode.NORMAL,

      },

      computational: {

        activeLayers: [
          ...DEFAULT_COMPUTATIONAL_CONFIGURATION
            .activeLayers,
        ],

        temporalContext:
          DEFAULT_COMPUTATIONAL_CONFIGURATION
            .temporalContext,

        investigativeScale:
          DEFAULT_COMPUTATIONAL_CONFIGURATION
            .investigativeScale,

      },

      revision:
        0,

    };

  // ==========================================================
  // OBSERVERS
  // ==========================================================

  private listeners =
    new Set<
      WorkspaceRuntimeListener
    >();

  subscribe(
    listener:
      WorkspaceRuntimeListener,
  ): () => void {

    this.listeners.add(
      listener,
    );

    return () => {

      this.listeners.delete(
        listener,
      );

    };

  }

  private notify():
    void {

    for (
      const listener
      of this.listeners
    ) {

      listener();

    }

  }

  // ==========================================================
  // ACCESSORS
  // ==========================================================

  getState():
    Readonly<
      WorkspaceRuntimeState
    > {

    return this.state;

  }

  getManifoldRuntime() {

    return manifoldRuntime;

  }

  getOperatorState():
    Readonly<
      WorkspaceOperatorState
    > {

    return this.state.operator;

  }

  getWorkspace():
    Workspace | undefined {

    return this.state.session.workspace;

  }

  /**
   * Returns the active canonical Investigation.
   *
   * WorkspaceRuntime is the runtime ownership boundary for
   * the Investigation consumed by ResolveRuntime.
   */
  getActiveInvestigation():
    Investigation | undefined {

    return this.state
      .session
      .investigation;

  }

  getFocusedEvent():
    unknown {

    return this.state
      .session
      .focusedEvent;

  }

  // ==========================================================
  // COMPUTATIONAL CONFIGURATION ACCESSORS
  // ==========================================================

  /**
   * Returns the current runtime-owned computational
   * configuration.
   */
  getComputationalConfiguration():
    Readonly<
      WorkspaceComputationalConfiguration
    > {

    return this.state.computational;

  }

  /**
   * L in:
   *
   *     M = g(L, T, S)
   */
  getActiveLayers():
    readonly string[] {

    return this.state
      .computational
      .activeLayers;

  }

  /**
   * T in:
   *
   *     M = g(L, T, S)
   *
   * T remains intentionally opaque.
   */
  getTemporalContext():
    unknown {

    return this.state
      .computational
      .temporalContext;

  }

  /**
   * S in:
   *
   *     M = g(L, T, S)
   *
   * S remains intentionally opaque.
   */
  getInvestigativeScale():
    unknown {

    return this.state
      .computational
      .investigativeScale;

  }

  // ==========================================================
  // OPERATOR STATE
  // ==========================================================

  getActiveMode():
    WorkspaceModeType {

    return this.state
      .operator
      .activeMode;

  }

  /**
   * Returns the canonical operator-facing eligibility for a
   * Workspace Mode.
   *
   * OVERVIEW and LIBRARY are valid without an active
   * Investigation. Every analytical mode requires a real active
   * Investigation.
   */
  getModeAvailability(
    mode:
      WorkspaceModeType,
  ): WorkspaceModeAvailability {

    if (
      mode === WorkspaceMode.OVERVIEW ||
      mode === WorkspaceMode.LIBRARY ||
      this.state.session.investigation !==
        undefined
    ) {

      return {
        available: true,
      };

    }

    return {
      available: false,
      reason:
        "Import or activate an investigation before entering this workspace mode.",
    };

  }

  setActiveMode(
    mode:
      WorkspaceModeType,
  ): void {

    if (
      this.state.operator.activeMode ===
      mode
    ) {

      return;

    }

    const availability =
      this.getModeAvailability(
        mode,
      );

    if (!availability.available) {

      return;

    }

    this.state = {

      ...this.state,

      operator: {

        ...this.state.operator,

        activeMode:
          mode,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // WORKSPACE LAYOUT
  // ==========================================================

  getLayoutMode():
    WorkspaceLayoutMode {

    return this.state
      .operator
      .layoutMode;

  }

  isFocusMode():
    boolean {

    return (
      this.state.operator.layoutMode ===
      WorkspaceLayoutMode.FOCUS
    );

  }

  setFocusMode(
    enabled:
      boolean,
  ): void {

    const layoutMode =
      enabled
        ? WorkspaceLayoutMode.FOCUS
        : WorkspaceLayoutMode.NORMAL;

    if (
      this.state.operator.layoutMode ===
      layoutMode
    ) {

      return;

    }

    this.state = {

      ...this.state,

      operator: {

        ...this.state.operator,

        layoutMode,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  toggleFocusMode():
    void {

    this.setFocusMode(
      !this.isFocusMode(),
    );

  }

  // ==========================================================
  // SELECTION
  // ==========================================================

  getSelection() {

    return this.state
      .operator
      .selection;

  }

  setSelection(
    selection:
      WorkspaceSelection,
  ): void {

    if (
      this.state.operator.selection ===
      selection
    ) {

      return;

    }

    this.state = {

      ...this.state,

      operator: {

        ...this.state.operator,

        selection,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  clearSelection():
    void {

    if (
      this.state.operator.selection ===
      undefined
    ) {

      return;

    }

    this.state = {

      ...this.state,

      operator: {

        ...this.state.operator,

        activeMode:
          WorkspaceMode.MANIFOLD,

        selection:
          undefined,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // COMPUTATIONAL CONFIGURATION
  // ==========================================================
  //
  // The Workspace Runtime owns configuration only.
  //
  // It does NOT execute Resolve.
  //
  // ResolveRuntime receives a deterministic snapshot of this
  // state when the operator issues RESOLVE.
  //
  // ==========================================================

  setComputationalConfiguration(
    configuration:
      WorkspaceComputationalConfiguration,
  ): void {

    this.state = {

      ...this.state,

      computational: {

        activeLayers: [
          ...configuration.activeLayers,
        ],

        temporalContext:
          configuration.temporalContext,

        investigativeScale:
          configuration.investigativeScale,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // ACTIVE LAYERS — L
  // ==========================================================

  setActiveLayers(
    activeLayers:
      readonly string[],
  ): void {

    const nextLayers = [
      ...activeLayers,
    ];

    const currentLayers =
      this.state
        .computational
        .activeLayers;

    if (
      currentLayers.length ===
        nextLayers.length &&
      currentLayers.every(
        (
          layer,
          index,
        ) =>
          layer ===
          nextLayers[index],
      )
    ) {

      return;

    }

    this.state = {

      ...this.state,

      computational: {

        ...this.state.computational,

        activeLayers:
          nextLayers,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // TEMPORAL CONTEXT — T
  // ==========================================================

  setTemporalContext(
    temporalContext:
      unknown,
  ): void {

    if (
      this.state
        .computational
        .temporalContext ===
      temporalContext
    ) {

      return;

    }

    this.state = {

      ...this.state,

      computational: {

        ...this.state.computational,

        temporalContext,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // INVESTIGATIVE SCALE — S
  // ==========================================================

  setInvestigativeScale(
    investigativeScale:
      unknown,
  ): void {

    if (
      this.state
        .computational
        .investigativeScale ===
      investigativeScale
    ) {

      return;

    }

    this.state = {

      ...this.state,

      computational: {

        ...this.state.computational,

        investigativeScale,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // RESET COMPUTATIONAL CONFIGURATION
  // ==========================================================

  resetComputationalConfiguration():
    void {

    this.state = {

      ...this.state,

      computational: {

        activeLayers: [
          ...DEFAULT_COMPUTATIONAL_CONFIGURATION
            .activeLayers,
        ],

        temporalContext:
          DEFAULT_COMPUTATIONAL_CONFIGURATION
            .temporalContext,

        investigativeScale:
          DEFAULT_COMPUTATIONAL_CONFIGURATION
            .investigativeScale,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // INVESTIGATION OWNERSHIP
  // ==========================================================

  /**
   * Legacy Guest restoration compatibility boundary.
   *
   * Ordinary production intake must use activateInvestigation(),
   * which validates operational revision completeness and publishes
   * Investigation plus Workspace atomically. This setter remains
   * temporarily available only to the revisionless Guest restoration
   * path scheduled for I4A-5.
   */
  setActiveInvestigation(
    investigation:
      Investigation,
  ): void {

    if (
      this.state.session.investigation ===
      investigation
    ) {

      return;

    }

    this.state = {

      ...this.state,

      session: {

        ...this.state.session,

        investigation,

      },

      operator: {

        ...this.state.operator,

        selection:
          undefined,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  clearActiveInvestigation():
    void {

    if (
      this.state.session.investigation ===
        undefined &&
      this.state.operator.selection ===
        undefined
    ) {

      return;

    }

    this.state = {

      ...this.state,

      session: {

        ...this.state.session,

        investigation:
          undefined,

      },

      operator: {

        ...this.state.operator,

        selection:
          undefined,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // FOCUSED EVENT OWNERSHIP
  // ==========================================================

  setFocusedEvent(
    focusedEvent:
      unknown,
  ): void {

    if (
      this.state.session.focusedEvent ===
      focusedEvent
    ) {

      return;

    }

    this.state = {

      ...this.state,

      session: {

        ...this.state.session,

        focusedEvent,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  clearFocusedEvent():
    void {

    if (
      this.state.session.focusedEvent ===
      undefined
    ) {

      return;

    }

    this.state = {

      ...this.state,

      session: {

        ...this.state.session,

        focusedEvent:
          undefined,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // LIFECYCLE
  // ==========================================================

  initialize():
    void {

    if (
      this.state.status ===
      "READY"
    ) {

      return;

    }

    this.state = {

      ...this.state,

      status:
        "READY",

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  activate(
    workspace:
      Workspace,
  ): void {

    this.state = {

      ...this.state,

      status:
        "ACTIVE",

      session: {

        ...this.state.session,

        workspace,

      },

      // ------------------------------------------------------
      // Workspace active_layers becomes the initial runtime
      // computational layer configuration.
      //
      // From this point forward the Workspace Runtime owns
      // the live computational configuration.
      // ------------------------------------------------------

      computational: {

        ...this.state.computational,

        activeLayers: [
          ...workspace.active_layers,
        ],

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  /**
   * Atomically activates a canonical Investigation and its
   * owning Workspace.
   *
   * Observers must never see a Workspace without the
   * Investigation that owns it. This method therefore
   * publishes the complete intake state with one notification.
   */
  activateInvestigation(
    investigation:
      Investigation,
  ): void {

    validateOperationalRevisionInvestigation(
      investigation,
    );

    const workspace =
      investigation.workspace;

    const focusedEventId =
      workspace.focused_event_id;

    if (
      focusedEventId === null ||
      !focusedEventId.trim() ||
      workspace.imported_events.filter(
        reference =>
          reference.event_id === focusedEventId,
      ).length !== 1
    ) {
      throw new Error(
        "Activated Investigation must own exactly one focused Event reference.",
      );
    }

    this.state = {

      ...this.state,

      status:
        "ACTIVE",

      session: {

        ...this.state.session,

        workspace,

        investigation,

      },

      operator: {

        ...this.state.operator,

        selection:
          undefined,

      },

      computational: {

        ...this.state.computational,

        activeLayers: [
          ...workspace.active_layers,
        ],

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  /** Explicit operator navigation. Presentation history is recorded after validation. */
  navigateToMode(mode: WorkspaceModeType): void {
    if (!this.getModeAvailability(mode).available) return;
    this.setActiveMode(mode);
    this.navigationRecorder?.(mode);
  }

  /**
   * Carries a disposable Studio projection into MANIFOLD for read-only review.
   * This session-only handoff is deliberately outside canonical Investigation,
   * Workspace, graph, Research Inbox, and persistence state.
   */
  reviewStudioManifoldArtifact(artifact: StudioManifoldArtifactDraft): void {
    const investigationId = this.getActiveInvestigation()?.id;
    if (
      artifact.kind !== "MANIFOLD_ARTIFACT_DRAFT" ||
      artifact.authorityState !== "UNAPPLIED_LOCAL_PROJECTION" ||
      artifact.contextManifest.investigationId !== investigationId ||
      artifact.projection.source.investigationId !== investigationId
    ) throw new Error("Studio Manifold Artifact review requires the active Investigation and an unapplied local projection.");
    validateManifoldArtifactManifest(artifact.projection);
    this.manifoldArtifactReview = artifact;
    this.navigateToMode(WorkspaceMode.MANIFOLD);
  }

  getStudioManifoldArtifactReview(): StudioManifoldArtifactDraft | undefined {
    const review = this.manifoldArtifactReview;
    return review?.contextManifest.investigationId === this.getActiveInvestigation()?.id ? review : undefined;
  }

  clearStudioManifoldArtifactReview(artifact?: StudioManifoldArtifactDraft): void {
    if (artifact !== undefined && this.manifoldArtifactReview !== artifact) return;
    this.manifoldArtifactReview = undefined;
  }

  /** Browser/bootstrap restoration. This never writes a browser-history entry. */
  restoreActiveMode(mode: WorkspaceModeType): void {
    this.setActiveMode(mode);
  }

  attachNavigationRecorder(recorder: WorkspaceNavigationRecorder | undefined): void {
    this.navigationRecorder = recorder;
  }

  /** Atomically appends one session-local guest artifact revision through the active runtime owner. */
  admitGuestManifoldArtifact(command: GuestAdmissionCommand): GuestAdmissionResult & { readonly replayed:boolean } {
    const source=this.state.session.investigation;
    if(!source||this.state.session.workspace!==source.workspace)throw new Error("Guest admission requires one unambiguous active investigation.");
    const provenance=source.workspace.guest_canonical_working_copy;
    const sourceId=provenance?.sourceInvestigationId??source.id;
    if(sourceId!==command.investigationId)throw new Error("Guest admission investigation identity is ambiguous.");
    const key=`${sourceId}:${command.idempotencyKey}`;
    const signature=JSON.stringify({projectionId:command.projectionId,expectedOperationalHeadId:command.expectedOperationalHeadId,selected:[...command.selectedRelationshipDeclarationIds].sort(),outputHash:command.outputHash});
    const prior=this.guestArtifactAdmissions.get(key);
    if(prior){if(prior.signature!==signature||this.state.session.investigation?.id!==prior.result.investigation.id)throw new Error("Guest admission idempotency conflict.");return{...prior.result,replayed:true}}
    const active=source.workspace.guest_candidate_event||provenance?source:this.createGuestCanonicalWorkingCopy(source,command.expectedOperationalHeadId);
    const result=computeGuestManifoldArtifactAdmission(active,{...command,investigationId:active.id});
    this.state={...this.state,status:"ACTIVE",session:{...this.state.session,workspace:result.investigation.workspace,investigation:result.investigation,artifacts:[...result.investigation.workspace.artifacts]},operator:{...this.state.operator,selection:{kind:"NODE",nodeId:result.receipt.admittedArtifactNodeId}},revision:this.state.revision+1};
    this.guestArtifactAdmissions.set(key,{signature,result});this.manifoldArtifactReview=undefined;this.notify();return{...result,replayed:false};
  }

  canAdmitGuestManifoldArtifact(investigationId: string | undefined): boolean {
    const active=this.state.session.investigation;
    if(!active||!investigationId)return false;
    if(active.workspace.guest_candidate_event)return active.id===investigationId&&active.status==="DRAFT";
    const copy=active.workspace.guest_canonical_working_copy;
    if(copy)return copy.sourceInvestigationId===investigationId;
    return active.id===investigationId&&active.status==="ACTIVE"&&active.revisions.some(item=>item.id===active.currentRevisionId)&&active.workspace.imported_events.length===1&&["SYSTEM_CANON","RESEARCH_CANON"].includes(active.workspace.imported_events[0]!.source);
  }

  private createGuestCanonicalWorkingCopy(source: Investigation, expectedHeadId: string | null): Investigation {
    if(!expectedHeadId||source.currentRevisionId!==expectedHeadId)throw new Error("The canonical investigation changed. Review before confirming again.");
    const revision=source.revisions.filter(item=>item.id===expectedHeadId);
    const reference=source.workspace.imported_events;
    if(revision.length!==1||reference.length!==1||!["SYSTEM_CANON","RESEARCH_CANON"].includes(reference[0]!.source))throw new Error("Canonical source identity or active revision is ambiguous.");
    const copyKey=`${source.id}\u0000${source.workspace.id}\u0000${expectedHeadId}\u0000${reference[0]!.event_id}`;
    const existing=this.guestCanonicalWorkingCopies.get(copyKey);
    if(existing)return existing;
    const workspace={...source.workspace,name:`${source.name} — Guest working copy`,guest_canonical_working_copy:Object.freeze({kind:"GUEST_CANONICAL_WORKING_COPY" as const,sourceInvestigationId:source.id,sourceWorkspaceId:source.workspace.id,sourceRevisionId:expectedHeadId,sourceEventId:reference[0]!.event_id})};
    const copy={...source,name:`${source.name} — Disposable guest working copy`,description:`Disposable guest working copy derived from ${source.name}. Nothing will be saved.`,createdBy:"GUEST_SESSION",status:"DRAFT" as const,workspace};
    validateOperationalRevisionInvestigation(copy);this.guestCanonicalWorkingCopies.set(copyKey,copy);return copy;
  }

  /** Activates a session-only researcher candidate with its real initial operational revision. */
  activateGuestCandidateInvestigation(investigation: Investigation): void {
    const workspace = investigation.workspace;
    const candidate = workspace.guest_candidate_event;
    if (
      investigation.status !== "DRAFT" || candidate === undefined ||
      candidate.knowledgeClassification !== "CANDIDATE_KNOWLEDGE" ||
      candidate.origin !== "RESEARCHER_SUPPLIED" || candidate.lifecycle !== "DRAFT" ||
      candidate.objectType !== "EVENT" || candidate.operationalMaterialization !== "INITIAL_REVISION_ACTIVE" ||
      candidate.systemCanonIdentity !== null || workspace.focused_event_id !== candidate.candidateId ||
      workspace.imported_events.length !== 1 || workspace.imported_events[0]?.event_id !== candidate.candidateId ||
      workspace.imported_events[0]?.source !== "RESEARCHER_SUPPLIED" || investigation.revisions.length !== 1 ||
      investigation.currentRevisionId !== investigation.revisions[0]?.id
    ) throw new Error("Guest candidate activation rejected a non-candidate or non-operational payload.");

    validateOperationalRevisionInvestigation(investigation);

    this.guestArtifactAdmissions.clear();

    this.guestCanonicalWorkingCopies.clear();

    this.state = { ...this.state, status: "ACTIVE",
      session: { workspace, investigation, focusedEvent: candidate.candidateId, artifacts: [] },
      operator: { ...this.state.operator, activeMode: WorkspaceMode.MANIFOLD, layoutMode: WorkspaceLayoutMode.NORMAL, selection: undefined },
      computational: { activeLayers: [], temporalContext: undefined, investigativeScale: undefined },
      revision: this.state.revision + 1 };
    this.notify();
  }

  /**
   * Atomically activates a server-authorized, deliberately empty owned
   * Investigation. Empty ownership is not an operational graph revision and must
   * never be routed through canonical materialization or given a focused Event.
   */
  activateEmptyOwnedInvestigation(
    investigation: Investigation,
  ): void {
    this.activateEmptyOwnedInvestigationState(investigation);
    this.notify();
  }

  private activateEmptyOwnedInvestigationState(
    investigation: Investigation,
  ): void {
    const workspace = investigation.workspace;
    if (
      !investigation.id.trim() ||
      !workspace.id.trim() ||
      workspace.focused_event_id !== null ||
      workspace.imported_events.length !== 0 ||
      workspace.investigations.length !== 0 ||
      workspace.artifacts.length !== 0 ||
      workspace.active_layers.length !== 0 ||
      investigation.revisions.length !== 0 ||
      investigation.currentRevisionId !== undefined
    ) {
      throw new Error("Owned empty Investigation activation payload is not empty.");
    }

    this.state = {
      ...this.state,
      status: "ACTIVE",
      session: {
        workspace,
        investigation,
        focusedEvent: undefined,
        artifacts: [],
      },
      operator: {
        ...this.state.operator,
        activeMode: WorkspaceMode.LIBRARY,
        layoutMode: WorkspaceLayoutMode.NORMAL,
        selection: undefined,
      },
      computational: {
        activeLayers: [],
        temporalContext: undefined,
        investigativeScale: undefined,
      },
      revision: this.state.revision + 1,
    };
  }

  /** Atomically installs an already validated, owner-authorized adopted projection. */
  activateAdoptedOwnedInvestigation(activation: MaterializedOwnedActivation): void {
    this.activateAdoptedOwnedInvestigationState(activation);
    this.notify();
  }

  /** Installs an authoritative mutation response without changing the current surface. */
  refreshAdoptedOwnedInvestigation(activation: MaterializedOwnedActivation): void {
    const activeMode = this.state.operator.activeMode;
    this.activateAdoptedOwnedInvestigationState(activation);
    this.state = { ...this.state, operator: { ...this.state.operator, activeMode } };
    this.notify();
  }

  private activateAdoptedOwnedInvestigationState(activation: MaterializedOwnedActivation): void {
    validateOperationalRevisionInvestigation(activation.investigation);
    const workspace = activation.investigation.workspace;
    this.state = {
      ...this.state,
      status: "ACTIVE",
      session: { workspace, investigation: activation.investigation, focusedEvent: workspace.focused_event_id ?? undefined, artifacts: [...workspace.artifacts] },
      operator: { ...this.state.operator, activeMode: WorkspaceMode.MANIFOLD, layoutMode: WorkspaceLayoutMode.NORMAL, selection: undefined },
      computational: { activeLayers: [...workspace.active_layers], temporalContext: activation.temporalContext, investigativeScale: activation.investigativeScale },
      revision: this.state.revision + 1,
    };
  }

  /**
   * Installs every runtime-owned projection of an account activation before
   * publishing the new Workspace revision. The callback is the composition
   * boundary for the singular live Research and Author owners.
   */
  activateOwnedInvestigation(
    activation: MaterializedOwnedActivation,
    installAccountState: () => void,
  ): void {
    const previousState = this.state;
    try {
      if (activation.investigation.revisions.length === 0) {
        this.activateEmptyOwnedInvestigationState(activation.investigation);
      } else {
        this.activateAdoptedOwnedInvestigationState(activation);
      }
      installAccountState();
    } catch (error) {
      this.state = previousState;
      throw error;
    }
    this.notify();
  }

  deactivate():
    void {

    this.guestArtifactAdmissions.clear();

    this.guestCanonicalWorkingCopies.clear();

    this.state = {

      ...this.state,

      status:
        "READY",

      session: {

        workspace:
          undefined,

        investigation:
          undefined,

        focusedEvent:
          undefined,

        artifacts:
          [],

      },

      operator: {

        ...this.state.operator,

        selection:
          undefined,

      },

      computational: {

        activeLayers: [
          ...DEFAULT_COMPUTATIONAL_CONFIGURATION
            .activeLayers,
        ],

        temporalContext:
          DEFAULT_COMPUTATIONAL_CONFIGURATION
            .temporalContext,

        investigativeScale:
          DEFAULT_COMPUTATIONAL_CONFIGURATION
            .investigativeScale,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // FUTURE OWNERSHIP
  // ==========================================================
  //
  // Investigation Session
  // Snapshot Manager
  // History Manager
  // Timeline Runtime
  // Playback Runtime
  // Corpus Runtime
  // Layout Runtime
  // Projection Runtime
  // Collaboration Runtime
  // Export Runtime
  //
  // Future Computational Configuration
  // ------------------------------------
  //
  // Canonical TemporalContext
  // Canonical InvestigativeScale
  // Layer Taxonomy
  // Compute Profiles
  // Compute Presets
  // Configuration Snapshots
  //
  // Future Operator State
  // ---------------------
  //
  // Selection
  // Hover
  // Viewport
  // Layout
  // Playback
  // History Cursor
  // Command State
  //
  // ==========================================================

}

// ============================================================
// SINGLETON
// ============================================================

export const workspaceRuntime =
  new WorkspaceRuntime();
