// ============================================================
// src/investigation/runtime/InvestigationRuntime.ts
//
// P44
// INVESTIGATION RUNTIME
//
// Deterministic runtime responsible for the active investigation.
//
// This runtime owns investigation-level state and serves as the
// architectural boundary between the Workspace Runtime and the
// investigation subsystems.
//
// Responsibilities
//
// • Active Investigation
// • Investigation Lifecycle
// • Runtime Status
// • Shared Investigation State
// • Runtime Listeners
//
// This runtime intentionally contains NO React code.
//
// ============================================================

import type {
  InvestigationRuntimeStatus,
  InvestigationRuntimeState,
  InvestigationRuntimeListener,
} from "./InvestigationRuntimeTypes";

// ============================================================
// RUNTIME
// ============================================================

export class InvestigationRuntime {

  // ==========================================================
  // STATE
  // ==========================================================

  private state: InvestigationRuntimeState = {

    status: "INITIALIZING",

    investigationId: null,

    focusedNodeId: null,

    focusedEdgeId: null,

    selectedEvidenceIds: [],

    revision: 0,

  };

  private listeners = new Set<InvestigationRuntimeListener>();

  // ==========================================================
  // STATUS
  // ==========================================================

  public getStatus(): InvestigationRuntimeStatus {

    return this.state.status;

  }

  public initialize(): void {

    this.state.status = "READY";

    this.notify();

  }

  public activate(): void {

    this.state.status = "ACTIVE";

    this.notify();

  }

  public deactivate(): void {

    this.state.status = "READY";

    this.notify();

  }

  // ==========================================================
  // INVESTIGATION
  // ==========================================================

  public getInvestigationId(): string | null {

    return this.state.investigationId;

  }

  public setInvestigationId(
    investigationId: string | null,
  ): void {

    this.state.investigationId = investigationId;

    this.bumpRevision();

  }

  // ==========================================================
  // FOCUS
  // ==========================================================

  public getFocusedNodeId(): string | null {

    return this.state.focusedNodeId;

  }

  public setFocusedNodeId(
    nodeId: string | null,
  ): void {

    this.state.focusedNodeId = nodeId;

    this.bumpRevision();

  }

  public getFocusedEdgeId(): string | null {

    return this.state.focusedEdgeId;

  }

  public setFocusedEdgeId(
    edgeId: string | null,
  ): void {

    this.state.focusedEdgeId = edgeId;

    this.bumpRevision();

  }

  // ==========================================================
  // EVIDENCE
  // ==========================================================

  public getSelectedEvidenceIds(): string[] {

    return [...this.state.selectedEvidenceIds];

  }

  public setSelectedEvidenceIds(
    evidenceIds: string[],
  ): void {

    this.state.selectedEvidenceIds = [...evidenceIds];

    this.bumpRevision();

  }

  // ==========================================================
  // STATE
  // ==========================================================

  public getState(): InvestigationRuntimeState {

    return {

      ...this.state,

      selectedEvidenceIds: [
        ...this.state.selectedEvidenceIds,
      ],

    };

  }

  // ==========================================================
  // LISTENERS
  // ==========================================================

  public subscribe(
    listener: InvestigationRuntimeListener,
  ): () => void {

    this.listeners.add(listener);

    return () => {

      this.listeners.delete(listener);

    };

  }

  private notify(): void {

    const snapshot = this.getState();

    for (const listener of this.listeners) {

      listener(snapshot);

    }

  }

  // ==========================================================
  // INTERNAL
  // ==========================================================

  private bumpRevision(): void {

    this.state.revision++;

    this.notify();

  }

}