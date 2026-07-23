// ============================================================
// src/investigation/runtime/InvestigationRuntimeTypes.ts
//
// P44
// INVESTIGATION RUNTIME TYPES
//
// Canonical type definitions for the Investigation Runtime.
//
// These types define the deterministic runtime contract shared
// by the runtime implementation, React context, and consumers.
//
// ============================================================

// ============================================================
// STATUS
// ============================================================

export type InvestigationRuntimeStatus =
  | "INITIALIZING"
  | "READY"
  | "ACTIVE";

// ============================================================
// STATE
// ============================================================

export interface InvestigationRuntimeState {

  status: InvestigationRuntimeStatus;

  investigationId: string | null;

  focusedNodeId: string | null;

  focusedEdgeId: string | null;

  selectedEvidenceIds: string[];

  revision: number;

}

// ============================================================
// LISTENER
// ============================================================

export type InvestigationRuntimeListener = (
  state: InvestigationRuntimeState,
) => void;

// ============================================================
// PUBLIC RUNTIME CONTRACT
// ============================================================

export interface InvestigationRuntimeContract {

  // ----------------------------------------------------------
  // Lifecycle
  // ----------------------------------------------------------

  getStatus(): InvestigationRuntimeStatus;

  initialize(): void;

  activate(): void;

  deactivate(): void;

  // ----------------------------------------------------------
  // Investigation
  // ----------------------------------------------------------

  getInvestigationId(): string | null;

  setInvestigationId(
    investigationId: string | null,
  ): void;

  // ----------------------------------------------------------
  // Focus
  // ----------------------------------------------------------

  getFocusedNodeId(): string | null;

  setFocusedNodeId(
    nodeId: string | null,
  ): void;

  getFocusedEdgeId(): string | null;

  setFocusedEdgeId(
    edgeId: string | null,
  ): void;

  // ----------------------------------------------------------
  // Evidence
  // ----------------------------------------------------------

  getSelectedEvidenceIds(): string[];

  setSelectedEvidenceIds(
    evidenceIds: string[],
  ): void;

  // ----------------------------------------------------------
  // Runtime State
  // ----------------------------------------------------------

  getState(): InvestigationRuntimeState;

  // ----------------------------------------------------------
  // Subscription
  // ----------------------------------------------------------

  subscribe(
    listener: InvestigationRuntimeListener,
  ): () => void;

}