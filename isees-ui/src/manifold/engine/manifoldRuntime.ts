// ============================================================
// src/manifold/engine/manifoldRuntime.ts
// P33A
// DETERMINISTIC MANIFOLD RUNTIME
//
// The Manifold Runtime is the deterministic orchestration layer
// that owns an active Investigation Session.
//
// Responsibilities:
//
//   • Receive operator intent
//   • Own deterministic runtime state
//   • Coordinate Resolve–Dissolve Computation (RDC)
//   • Invoke the deterministic Manifold Engine
//   • Maintain runtime history
//   • Manage presentation state
//   • Own runtime selection state
//   • Own future snapshot state
//
// The runtime intentionally performs NO computation.
//
// Computational ownership belongs exclusively to the
// deterministic Manifold Engine.
//
// Ownership:
//
// Operator
//      ↓
// Manifold Toolbar
//      ↓
// Primary Investigation Manifold
//      ↓
// Manifold Runtime
//      ↓
// Resolve–Dissolve Computation (RDC)
//      ↓
// Deterministic Investigation Manifold
//
// The Runtime owns investigation execution.
//
// The Engine owns investigation computation.
//
// ============================================================

import type {
  Manifold,
} from "./manifoldTypes";

import {
  computeManifold,
} from "./manifoldEngine";

import type {
  ManifoldToolbarAction,
} from "../components/ManifoldToolbar";

// ============================================================
// TYPES
// ============================================================

export type ManifoldViewMode =
  | "2D"
  | "3D";

export type RuntimeExecutionState =
  | "IDLE"
  | "RESOLVING"
  | "RESOLVED"
  | "DISSOLVED"
  | "COLLAPSED";

export interface RuntimeSelection {

  nodeId?: string;

  edgeId?: string;

}

export interface ManifoldRuntimeState {

  /**
   * Current deterministic manifold.
   */
  manifold?: Manifold;

  /**
   * Presentation mode.
   */
  viewMode: ManifoldViewMode;

  /**
   * Runtime execution state.
   */
  executionState: RuntimeExecutionState;

  /**
   * Current runtime selection.
   *
   * Eventually replaces UI-owned transient selection.
   */
  selection: RuntimeSelection;

  /**
   * Runtime revision.
   *
   * Incremented after every deterministic operator action.
   */
  revision: number;

}

// ============================================================
// DEFAULT STATE
// ============================================================

export const DEFAULT_MANIFOLD_RUNTIME:
ManifoldRuntimeState = {

  manifold: undefined,

  viewMode: "2D",

  executionState: "IDLE",

  selection: {},

  revision: 0,

};

// ============================================================
// RUNTIME
// ============================================================

export class ManifoldRuntime {

  private state =
    DEFAULT_MANIFOLD_RUNTIME;

  // ==========================================================
  // ACCESSORS
  // ==========================================================

  getState():
    Readonly<ManifoldRuntimeState> {

    return this.state;

  }

  // ==========================================================
  // OPERATOR ENTRY
  // ==========================================================

  dispatch(
    action: ManifoldToolbarAction,
  ): void {

    switch (action) {

      case "RESOLVE":
        this.resolve();
        return;

      case "DISSOLVE":
        this.dissolve();
        return;

      case "COLLAPSE":
        this.collapse();
        return;

      case "VIEW_2D":
        this.setViewMode("2D");
        return;

      case "VIEW_3D":
        this.setViewMode("3D");
        return;

      default: {

        const exhaustive: never =
          action;

        console.warn(
          "[ManifoldRuntime] Unknown action:",
          exhaustive,
        );

      }

    }

  }

  // ==========================================================
  // OPERATIONS
  // ==========================================================

  private resolve(): void {

    this.state = {

      ...this.state,

      executionState: "RESOLVING",

    };

    try {

      const manifold =
        computeManifold();

      this.state = {

        ...this.state,

        manifold,

        executionState: "RESOLVED",

        revision:
          this.state.revision + 1,

      };

    }

    catch {

      console.info(
        "[Runtime] computeManifold() not yet implemented.",
      );

      this.state = {

        ...this.state,

        executionState: "IDLE",

      };

    }

  }

  private dissolve(): void {

    this.state = {

      ...this.state,

      manifold: undefined,

      executionState: "DISSOLVED",

      revision:
        this.state.revision + 1,

    };

  }

  private collapse(): void {

    this.state = {

      ...this.state,

      executionState: "COLLAPSED",

      revision:
        this.state.revision + 1,

    };

  }

  private setViewMode(
    mode: ManifoldViewMode,
  ): void {

    this.state = {

      ...this.state,

      viewMode: mode,

      revision:
        this.state.revision + 1,

    };

  }

  // ==========================================================
  // FUTURE RUNTIME API
  // ==========================================================
  //
  // selectNode()
  // selectEdge()
  // clearSelection()
  // saveSnapshot()
  // restoreSnapshot()
  // undo()
  // redo()
  // replay()
  // export()
  //
  // These capabilities belong to the Runtime because they
  // represent deterministic investigation session ownership
  // rather than computation.
  //
  // ==========================================================

}

// ============================================================
// SINGLETON
// ============================================================

export const manifoldRuntime =
  new ManifoldRuntime();