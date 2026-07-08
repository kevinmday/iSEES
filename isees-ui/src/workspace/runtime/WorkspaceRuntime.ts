// ============================================================
// src/workspace/runtime/WorkspaceRuntime.ts
// P34
// WORKSPACE RUNTIME FOUNDATION
//
// The Workspace Runtime owns the deterministic Investigation
// Session.
//
// It composes the major deterministic subsystems without
// performing computation itself.
//
// Ownership:
//
// Operator
//      ↓
// Main Layout
//      ↓
// Workspace Runtime
//      ├── Workspace Context
//      ├── Manifold Runtime
//      ├── Corpus
//      ├── Artifacts
//      └── Future Runtime Services
//
// Computational ownership remains inside the Manifold Runtime
// and Resolve–Dissolve Computation (RDC).
// ============================================================

import {
  manifoldRuntime,
} from "../../manifold/engine/manifoldRuntime";

import type {
  Workspace,
} from "../workspaceTypes";

import type {
  Artifact,
} from "../../artifacts/artifactTypes";

// ============================================================
// TYPES
// ============================================================

export type WorkspaceRuntimeStatus =
  | "INITIALIZING"
  | "READY"
  | "ACTIVE";

export interface WorkspaceRuntimeState {

  /**
   * Runtime status.
   */
  status:
    WorkspaceRuntimeStatus;

  /**
   * Active workspace.
   *
   * Assigned by the Workspace Context.
   */
  workspace?:
    Workspace;

  /**
   * Cached artifacts.
   *
   * Ownership remains with Workspace Context.
   */
  artifacts:
    Artifact[];

  /**
   * Runtime revision.
   */
  revision:
    number;

}

// ============================================================
// RUNTIME
// ============================================================

export class WorkspaceRuntime {

  private state:
    WorkspaceRuntimeState = {

      status:
        "INITIALIZING",

      artifacts: [],

      revision: 0,

    };

  // ==========================================================
  // ACCESSORS
  // ==========================================================

  getState():
    Readonly<WorkspaceRuntimeState> {

    return this.state;

  }

  getManifoldRuntime() {

    return manifoldRuntime;

  }

  // ==========================================================
  // LIFECYCLE
  // ==========================================================

  initialize(): void {

    this.state = {

      ...this.state,

      status: "READY",

    };

  }

  activate(
    workspace: Workspace,
  ): void {

    this.state = {

      ...this.state,

      workspace,

      status: "ACTIVE",

      revision:
        this.state.revision + 1,

    };

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
  // ==========================================================

}

// ============================================================
// SINGLETON
// ============================================================

export const workspaceRuntime =
  new WorkspaceRuntime();