// ============================================================
// src/workspace/runtime/WorkspaceRuntime.ts
// P36
// RUNTIME-OWNED INVESTIGATION STATE
//
// The Workspace Runtime is the deterministic owner of the
// operator's active Investigation Session.
//
// It owns investigation state and operator state while
// composing deterministic runtime subsystems.
//
// The Workspace Runtime performs no computation.
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

        investigation: undefined,

        focusedEvent: undefined,

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
   * notification mechanism.
   *
   * All mutable investigation state remains owned by the
   * Workspace Runtime.
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

  getWorkspace():
    Workspace | undefined {

    return this.state.session.workspace;

  }

  getActiveInvestigation() {

    return this.state.session.investigation;

  }

  getFocusedEvent() {

    return this.state.session.focusedEvent;

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
  // INVESTIGATION OWNERSHIP
  // ==========================================================

  setActiveInvestigation(
    investigation: unknown,
  ): void {

    if (
      this.state.session.investigation === investigation
    ) {

      return;

    }

    this.state = {

      ...this.state,

      session: {

        ...this.state.session,

        investigation,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  clearActiveInvestigation(): void {

    this.state = {

      ...this.state,

      session: {

        ...this.state.session,

        investigation: undefined,

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
    focusedEvent: unknown,
  ): void {

    if (
      this.state.session.focusedEvent === focusedEvent
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

  clearFocusedEvent(): void {

    this.state = {

      ...this.state,

      session: {

        ...this.state.session,

        focusedEvent: undefined,

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

  deactivate(): void {

    this.state = {

      ...this.state,

      status: "READY",

      session: {

        workspace: undefined,

        investigation: undefined,

        focusedEvent: undefined,

        artifacts: [],

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