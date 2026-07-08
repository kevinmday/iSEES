// ============================================================
// src/workspace/runtime/WorkspaceRuntimeTypes.ts
// P34
// WORKSPACE RUNTIME TYPES
//
// Canonical contracts for the deterministic Workspace Runtime.
//
// The Workspace Runtime owns the active Investigation Session
// by composing deterministic runtime subsystems while remaining
// independent of computation.
//
// Computational ownership remains within Resolve–Dissolve
// Computation (RDC) and the Manifold Runtime.
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
// SESSION
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
// STATE
// ============================================================

export interface WorkspaceRuntimeState {

  /**
   * Runtime lifecycle status.
   */
  status:
    WorkspaceRuntimeStatus;

  /**
   * Current investigation session.
   */
  session:
    WorkspaceRuntimeSession;

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
// export interface WorkspaceSnapshot {}
//
// export interface WorkspaceHistory {}
//
// export interface WorkspaceTimeline {}
//
// export interface WorkspacePlayback {}
//
// export interface WorkspaceCollaboration {}
//
// export interface WorkspaceExport {}
//
// export interface WorkspaceNotification {}
//
// These contracts will evolve as the Workspace Runtime becomes
// the deterministic owner of the complete Investigation Session.
//
// ============================================================