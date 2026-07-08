// ============================================================
// src/workspace/runtime/WorkspaceRuntime.ts
// P34D
// WORKSPACE RUNTIME FOUNDATION
//
// The Workspace Runtime owns the deterministic Investigation
// Session and Operator State.
//
// It composes deterministic runtime subsystems without
// performing computation itself.
//
// Ownership:
//
// Operator
//      ↓
// Main Layout
//      ↓
// Workspace Runtime
//      ├── Investigation Session
//      ├── Operator State
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

import {
  WorkspaceMode,
} from "./WorkspaceRuntimeTypes";

import type {
  WorkspaceRuntimeState,
  WorkspaceOperatorState,
  WorkspaceMode as WorkspaceModeType,
} from "./WorkspaceRuntimeTypes";

// ============================================================
// TYPES
// ============================================================

type WorkspaceRuntimeListener =
  () => void;

// ============================================================
// RUNTIME
// ============================================================

export class WorkspaceRuntime {

  private state:
    WorkspaceRuntimeState = {

      status: "INITIALIZING",

      session: {

        workspace: undefined,

        artifacts: [],

      },

      operator: {

        activeMode:
          WorkspaceMode.OVERVIEW,

      },

      revision: 0,

    };

  /**
   * Runtime listeners.
   *
   * React observes runtime changes through this lightweight
   * notification mechanism. Ownership remains entirely within
   * the Workspace Runtime.
   */
  private listeners =
    new Set<WorkspaceRuntimeListener>();

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

  getOperatorState():
    Readonly<WorkspaceOperatorState> {

    return this.state.operator;

  }

  getActiveMode():
    WorkspaceModeType {

    return this.state.operator.activeMode;

  }

  // ==========================================================
  // OBSERVERS
  // ==========================================================

  subscribe(
    listener: WorkspaceRuntimeListener,
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

  private notify(): void {

    for (
      const listener
      of this.listeners
    ) {

      listener();

    }

  }

  // ==========================================================
  // OPERATOR STATE
  // ==========================================================

  setActiveMode(
    mode: WorkspaceModeType,
  ): void {

    if (
      this.state.operator.activeMode === mode
    ) {

      return;

    }

    this.state = {

      ...this.state,

      operator: {

        ...this.state.operator,

        activeMode: mode,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // LIFECYCLE
  // ==========================================================

  initialize(): void {

    this.state = {

      ...this.state,

      status: "READY",

    };

    this.notify();

  }

  activate(
    workspace: Workspace,
  ): void {

    this.state = {

      ...this.state,

      status: "ACTIVE",

      session: {

        ...this.state.session,

        workspace,

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
  // Future Operator State
  // ---------------------
  //
  // Selection
  // Focus
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