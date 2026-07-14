// ============================================================
// src/workspace/runtime/WorkspaceRuntimeTypes.ts
// P36.2
// RUNTIME-OWNED INVESTIGATION TYPES
//
// Canonical contracts for the deterministic Workspace Runtime.
//
// The Workspace Runtime owns the active Investigation Session
// and active Operator State while composing deterministic
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
//      ├── Active Workspace
//      ├── Active Investigation
//      ├── Focused Event
//      └── Operator State
//              ├── Active Workspace Mode
//              └── Active Selection
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
// OPERATOR SELECTION
// ============================================================

export interface WorkspaceSelection {

  /**
   * Runtime-owned operator selection.
   *
   * A concrete deterministic selection contract will replace
   * these generic fields as Investigation Graph ownership
   * moves into the Workspace Runtime.
   */
  type: string;

  id: string;

}

// ============================================================
// INVESTIGATION SESSION
// ============================================================

export interface WorkspaceRuntimeSession {

  /**
   * Active workspace container.
   */
  workspace?: Workspace;

  /**
   * Active investigation owned by the runtime.
   */
  investigation?: unknown;

  /**
   * Currently focused event.
   */
  focusedEvent?: unknown;

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
   * Current workspace mode.
   */
  activeMode:
    WorkspaceMode;

  /**
   * Runtime-owned operator selection.
   */
  selection?:
    WorkspaceSelection;

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
   * Active Investigation Session.
   */
  session:
    WorkspaceRuntimeSession;

  /**
   * Current Operator State.
   */
  operator:
    WorkspaceOperatorState;

  /**
   * Monotonically increasing runtime revision.
   */
  revision:
    number;

}

// ============================================================
// FUTURE CONTRACTS
// ============================================================
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
// ============================================================