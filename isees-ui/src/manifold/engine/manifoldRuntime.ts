// ============================================================
// src/manifold/engine/manifoldRuntime.ts
// P31A
// DETERMINISTIC MANIFOLD RUNTIME FOUNDATION
//
// The Manifold Runtime is the orchestration layer that owns the
// active investigation session.
//
// Responsibilities:
//
//   • Receive operator intent
//   • Manage runtime state
//   • Coordinate deterministic computation
//   • Invoke the Manifold Engine
//   • Maintain investigation history
//   • Control presentation mode
//
// The runtime intentionally contains NO computational logic.
// Computation remains the responsibility of the deterministic
// Manifold Engine.
//
// Ownership:
//
// Operator
//      ↓
// Toolbar
//      ↓
// Primary Investigation Manifold
//      ↓
// Manifold Runtime
//      ↓
// Manifold Engine
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

export interface ManifoldRuntimeState {

  /**
   * Current deterministic manifold.
   *
   * Undefined until the first successful computation.
   */
  manifold?: Manifold;

  /**
   * Current presentation mode.
   */
  viewMode: ManifoldViewMode;

  /**
   * Runtime revision.
   *
   * Incremented every deterministic operator action.
   */
  revision: number;
}

// ============================================================
// DEFAULT STATE
// ============================================================

export const DEFAULT_MANIFOLD_RUNTIME: ManifoldRuntimeState = {

  manifold: undefined,

  viewMode: "2D",

  revision: 0,
};

// ============================================================
// RUNTIME
// ============================================================

export class ManifoldRuntime {

  private state: ManifoldRuntimeState =
    DEFAULT_MANIFOLD_RUNTIME;

  // ==========================================================
  // ACCESSORS
  // ==========================================================

  getState(): Readonly<ManifoldRuntimeState> {
    return this.state;
  }

  // ==========================================================
  // OPERATOR ENTRY POINT
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

        const exhaustive: never = action;

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

    console.log(
      "[Runtime] Resolve",
    );

    // P31A
    //
    // This intentionally invokes the public engine API.
    // computeManifold() remains a stub until the RDC
    // pipeline is implemented.

    try {

      const manifold =
        computeManifold();

      this.state = {
        ...this.state,
        manifold,
        revision:
          this.state.revision + 1,
      };

    } catch {

      console.info(
        "[Runtime] computeManifold() not yet implemented.",
      );

    }

  }

  private dissolve(): void {

    console.log(
      "[Runtime] Dissolve",
    );

    this.bumpRevision();

  }

  private collapse(): void {

    console.log(
      "[Runtime] Collapse",
    );

    this.bumpRevision();

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

    console.log(
      "[Runtime] View Mode:",
      mode,
    );

  }

  // ==========================================================
  // HELPERS
  // ==========================================================

  private bumpRevision(): void {

    this.state = {

      ...this.state,

      revision:
        this.state.revision + 1,

    };

  }

}

// ============================================================
// SINGLETON
// ============================================================

export const manifoldRuntime =
  new ManifoldRuntime();