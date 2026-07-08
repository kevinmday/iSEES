// ============================================================
// src/workspace/runtime/WorkspaceRuntimeTypes.ts
// P34
// WORKSPACE RUNTIME TYPES
//
// Canonical contracts for the deterministic Workspace Runtime.
//
// The Workspace Runtime owns the active Investigation Session
// and the active Operator State while composing deterministic
// runtime subsystems without performing computation.
//
// Computational ownership remains within Resolve–Dissolve
// Computation (RDC) and the Manifold Runtime.
//
// Ownership:
//
// Operator
//      ↓
// Workspace Runtime
//      ├── Investigation Session
//      └── Operator State
//              ↓
//          Active Workspace Mode
//
// ============================================================

import type {
  Workspace,
} from "../workspaceTypes";

import type {
  Artifact,
} from "../../artifacts/artifactTypes";

// ============================================================
// STATUS
// ============================================================

export type WorkspaceRuntimeStatus =
  | "INITIALIZING"
  | "READY"
  | "ACTIVE";

// ============================================================
// WORKSPACE MODES
// ============================================================

export const WorkspaceMode = {

  OVERVIEW: "OVERVIEW",

  MANIFOLD: "MANIFOLD",

  COMPARE: "COMPARE",

  NARRATIVE: "NARRATIVE",

  EVIDENCE: "EVIDENCE",

  TIMELINE: "TIMELINE",

  LAYERS: "LAYERS",

  INTENTION: "INTENTION",

  RESEARCH: "RESEARCH",

} as const;

export type WorkspaceMode =
  typeof WorkspaceMode[
    keyof typeof WorkspaceMode
  ];

// ============================================================
// INVESTIGATION SESSION
// ============================================================

export interface WorkspaceRuntimeSession {

  /**
   * Active workspace.
   */
  workspace?: Workspace;

  /**
   * Imported artifacts.
   */
  artifacts: Artifact[];

}

// ============================================================
// OPERATOR STATE
// ============================================================

export interface WorkspaceOperatorState {

  /**
   * Current operator workspace mode.
   *
   * This determines which deterministic projection surface
   * is currently active.
   */
  activeMode:
    WorkspaceMode;

}

// ============================================================
// STATE
// ============================================================

export interface WorkspaceRuntimeState {

  /**
   * Runtime lifecycle status.
   */
  status:
    WorkspaceRuntimeStatus;

  /**
   * Current Investigation Session.
   */
  session:
    WorkspaceRuntimeSession;

  /**
   * Current Operator State.
   *
   * Operator state describes how the current Investigation
   * Session is being viewed without modifying the underlying
   * investigation.
   */
  operator:
    WorkspaceOperatorState;

  /**
   * Runtime revision.
   */
  revision:
    number;

}

// ============================================================
// FUTURE CONTRACTS
// ============================================================
//
// export interface WorkspaceSelection {}
//
// export interface WorkspaceFocus {}
//
// export interface WorkspaceViewport {}
//
// export interface WorkspaceLayout {}
//
// export interface WorkspacePlayback {}
//
// export interface WorkspaceHistory {}
//
// export interface WorkspaceSnapshot {}
//
// export interface WorkspaceCollaboration {}
//
// export interface WorkspaceExport {}
//
// export interface WorkspaceNotification {}
//
// As the Workspace Runtime evolves into the deterministic
// owner of the complete Investigation Session, additional
// operator state will be introduced here while maintaining
// strict separation between:
//
// • Investigation Session (what exists)
// • Operator State (how it is viewed)
// • Computation (how it is derived)
//
// ============================================================