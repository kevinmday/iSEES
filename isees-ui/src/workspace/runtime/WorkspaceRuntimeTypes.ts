// ============================================================
// src/workspace/runtime/WorkspaceRuntimeTypes.ts
// P36
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
   * Active workspace container.
   */
  workspace?: Workspace;

  /**
   * Active investigation owned by the runtime.
   *
   * This becomes the single source of truth consumed by all
   * workspace modes.
   *
   * A concrete Investigation contract will replace 'unknown'
   * when extracted into the canonical investigation model.
   */
  investigation?: unknown;

  /**
   * Imported artifacts associated with the investigation.
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
   * Operator state determines which deterministic projection
   * surface is currently being viewed without modifying the
   * underlying investigation.
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
   * Active Investigation Session.
   */
  session:
    WorkspaceRuntimeSession;

  /**
   * Current Operator State.
   *
   * Operator state describes how the active Investigation
   * Session is being viewed.
   */
  operator:
    WorkspaceOperatorState;

  /**
   * Monotonically increasing runtime revision.
   *
   * Consumers observe this value to detect deterministic
   * runtime changes.
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
// runtime-owned contracts will be introduced here while
// maintaining strict separation between:
//
// • Investigation Session (what exists)
// • Operator State (how it is viewed)
// • Computation (how it is derived)
//
// ============================================================