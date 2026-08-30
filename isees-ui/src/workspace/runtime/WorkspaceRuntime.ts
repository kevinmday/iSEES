// ============================================================
// src/workspace/runtime/WorkspaceRuntime.ts
// P56
// RUNTIME-OWNED INVESTIGATION STATE
//
// The Workspace Runtime is the deterministic owner of the
// operator's active Investigation Session.
//
// It owns:
//
// • Active Workspace
// • Active Investigation
// • Focused Event
// • Operator State
// • Computational Configuration C = (L, T, S)
//
// The Workspace Runtime performs no mathematical computation.
//
// Computational execution remains owned by:
//
// • Manifold Runtime
// • ResolveRuntime
// • ResolveEngine
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
//      ├── Computational Configuration
//      │       ├── L — Active Layers
//      │       ├── T — Temporal Context
//      │       └── S — Investigative Scale
//      ├── Manifold Runtime
//      ├── Corpus
//      └── Artifacts
//
// ============================================================

import {
  manifoldRuntime,
} from "../../manifold/engine/manifoldRuntime";

import type {
  Workspace,
} from "../workspaceTypes";

import type {
  Investigation,
} from "../../investigation/investigationTypes";

import {
  WorkspaceMode,
  WorkspaceLayoutMode,
} from "./WorkspaceRuntimeTypes";

import type {
  WorkspaceRuntimeState,
  WorkspaceOperatorState,
  WorkspaceMode as WorkspaceModeType,
  WorkspaceSelection,
  WorkspaceComputationalConfiguration,
} from "./WorkspaceRuntimeTypes";

// ============================================================
// TYPES
// ============================================================

type WorkspaceRuntimeListener =
  () => void;

// ============================================================
// DEFAULT COMPUTATIONAL CONFIGURATION
// ============================================================
//
// T and S intentionally remain opaque.
//
// Their mathematical representations are owned by later
// canonical realization work.
//
// The Workspace Runtime merely owns and transports their
// deterministic configuration values.
//
// ============================================================

const DEFAULT_COMPUTATIONAL_CONFIGURATION:
WorkspaceComputationalConfiguration = {

  activeLayers:
    [],

  temporalContext:
    undefined,

  investigativeScale:
    undefined,

};

// ============================================================
// RUNTIME
// ============================================================

export class WorkspaceRuntime {

  private state:
    WorkspaceRuntimeState = {

      status:
        "INITIALIZING",

      session: {

        workspace:
          undefined,

       investigation:
          undefined,

        focusedEvent:
          undefined,

        artifacts:
          [],

      },

      operator: {

        activeMode:
          WorkspaceMode.OVERVIEW,

        layoutMode:
          WorkspaceLayoutMode.NORMAL,

      },

      computational: {

        activeLayers: [
          ...DEFAULT_COMPUTATIONAL_CONFIGURATION
            .activeLayers,
        ],

        temporalContext:
          DEFAULT_COMPUTATIONAL_CONFIGURATION
            .temporalContext,

        investigativeScale:
          DEFAULT_COMPUTATIONAL_CONFIGURATION
            .investigativeScale,

      },

      revision:
        0,

    };

  // ==========================================================
  // OBSERVERS
  // ==========================================================

  private listeners =
    new Set<
      WorkspaceRuntimeListener
    >();

  subscribe(
    listener:
      WorkspaceRuntimeListener,
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

  private notify():
    void {

    for (
      const listener
      of this.listeners
    ) {

      listener();

    }

  }

  // ==========================================================
  // ACCESSORS
  // ==========================================================

  getState():
    Readonly<
      WorkspaceRuntimeState
    > {

    return this.state;

  }

  getManifoldRuntime() {

    return manifoldRuntime;

  }

  getOperatorState():
    Readonly<
      WorkspaceOperatorState
    > {

    return this.state.operator;

  }

  getWorkspace():
    Workspace | undefined {

    return this.state.session.workspace;

  }

  /**
   * Returns the active canonical Investigation.
   *
   * WorkspaceRuntime is the runtime ownership boundary for
   * the Investigation consumed by ResolveRuntime.
   */
  getActiveInvestigation():
    Investigation | undefined {

    return this.state
      .session
      .investigation;

  }

  getFocusedEvent():
    unknown {

    return this.state
      .session
      .focusedEvent;

  }

  // ==========================================================
  // COMPUTATIONAL CONFIGURATION ACCESSORS
  // ==========================================================

  /**
   * Returns the current runtime-owned computational
   * configuration.
   */
  getComputationalConfiguration():
    Readonly<
      WorkspaceComputationalConfiguration
    > {

    return this.state.computational;

  }

  /**
   * L in:
   *
   *     M = g(L, T, S)
   */
  getActiveLayers():
    readonly string[] {

    return this.state
      .computational
      .activeLayers;

  }

  /**
   * T in:
   *
   *     M = g(L, T, S)
   *
   * T remains intentionally opaque.
   */
  getTemporalContext():
    unknown {

    return this.state
      .computational
      .temporalContext;

  }

  /**
   * S in:
   *
   *     M = g(L, T, S)
   *
   * S remains intentionally opaque.
   */
  getInvestigativeScale():
    unknown {

    return this.state
      .computational
      .investigativeScale;

  }

  // ==========================================================
  // OPERATOR STATE
  // ==========================================================

  getActiveMode():
    WorkspaceModeType {

    return this.state
      .operator
      .activeMode;

  }

  setActiveMode(
    mode:
      WorkspaceModeType,
  ): void {

    if (
      this.state.operator.activeMode ===
      mode
    ) {

      return;

    }

    this.state = {

      ...this.state,

      operator: {

        ...this.state.operator,

        activeMode:
          mode,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // WORKSPACE LAYOUT
  // ==========================================================

  getLayoutMode():
    WorkspaceLayoutMode {

    return this.state
      .operator
      .layoutMode;

  }

  isFocusMode():
    boolean {

    return (
      this.state.operator.layoutMode ===
      WorkspaceLayoutMode.FOCUS
    );

  }

  setFocusMode(
    enabled:
      boolean,
  ): void {

    const layoutMode =
      enabled
        ? WorkspaceLayoutMode.FOCUS
        : WorkspaceLayoutMode.NORMAL;

    if (
      this.state.operator.layoutMode ===
      layoutMode
    ) {

      return;

    }

    this.state = {

      ...this.state,

      operator: {

        ...this.state.operator,

        layoutMode,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  toggleFocusMode():
    void {

    this.setFocusMode(
      !this.isFocusMode(),
    );

  }

  // ==========================================================
  // SELECTION
  // ==========================================================

  getSelection() {

    return this.state
      .operator
      .selection;

  }

  setSelection(
    selection:
      WorkspaceSelection,
  ): void {

    if (
      this.state.operator.selection ===
      selection
    ) {

      return;

    }

    this.state = {

      ...this.state,

      operator: {

        ...this.state.operator,

        selection,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  clearSelection():
    void {

    if (
      this.state.operator.selection ===
      undefined
    ) {

      return;

    }

    this.state = {

      ...this.state,

      operator: {

        ...this.state.operator,

        selection:
          undefined,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // COMPUTATIONAL CONFIGURATION
  // ==========================================================
  //
  // The Workspace Runtime owns configuration only.
  //
  // It does NOT execute Resolve.
  //
  // ResolveRuntime receives a deterministic snapshot of this
  // state when the operator issues RESOLVE.
  //
  // ==========================================================

  setComputationalConfiguration(
    configuration:
      WorkspaceComputationalConfiguration,
  ): void {

    this.state = {

      ...this.state,

      computational: {

        activeLayers: [
          ...configuration.activeLayers,
        ],

        temporalContext:
          configuration.temporalContext,

        investigativeScale:
          configuration.investigativeScale,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // ACTIVE LAYERS — L
  // ==========================================================

  setActiveLayers(
    activeLayers:
      readonly string[],
  ): void {

    const nextLayers = [
      ...activeLayers,
    ];

    const currentLayers =
      this.state
        .computational
        .activeLayers;

    if (
      currentLayers.length ===
        nextLayers.length &&
      currentLayers.every(
        (
          layer,
          index,
        ) =>
          layer ===
          nextLayers[index],
      )
    ) {

      return;

    }

    this.state = {

      ...this.state,

      computational: {

        ...this.state.computational,

        activeLayers:
          nextLayers,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // TEMPORAL CONTEXT — T
  // ==========================================================

  setTemporalContext(
    temporalContext:
      unknown,
  ): void {

    if (
      this.state
        .computational
        .temporalContext ===
      temporalContext
    ) {

      return;

    }

    this.state = {

      ...this.state,

      computational: {

        ...this.state.computational,

        temporalContext,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // INVESTIGATIVE SCALE — S
  // ==========================================================

  setInvestigativeScale(
    investigativeScale:
      unknown,
  ): void {

    if (
      this.state
        .computational
        .investigativeScale ===
      investigativeScale
    ) {

      return;

    }

    this.state = {

      ...this.state,

      computational: {

        ...this.state.computational,

        investigativeScale,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // RESET COMPUTATIONAL CONFIGURATION
  // ==========================================================

  resetComputationalConfiguration():
    void {

    this.state = {

      ...this.state,

      computational: {

        activeLayers: [
          ...DEFAULT_COMPUTATIONAL_CONFIGURATION
            .activeLayers,
        ],

        temporalContext:
          DEFAULT_COMPUTATIONAL_CONFIGURATION
            .temporalContext,

        investigativeScale:
          DEFAULT_COMPUTATIONAL_CONFIGURATION
            .investigativeScale,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // INVESTIGATION OWNERSHIP
  // ==========================================================

  /**
   * Installs the canonical active Investigation.
   *
   * No casts or parallel Investigation context are required
   * downstream. ResolveRuntime receives this same canonical
   * Investigation contract.
   */
  setActiveInvestigation(
    investigation:
      Investigation,
  ): void {

    if (
      this.state.session.investigation ===
      investigation
    ) {

      return;

    }

    this.state = {

      ...this.state,

      session: {

        ...this.state.session,

        investigation,

      },

      operator: {

        ...this.state.operator,

        selection:
          undefined,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  clearActiveInvestigation():
    void {

    if (
      this.state.session.investigation ===
        undefined &&
      this.state.operator.selection ===
        undefined
    ) {

      return;

    }

    this.state = {

      ...this.state,

      session: {

        ...this.state.session,

        investigation:
          undefined,

      },

      operator: {

        ...this.state.operator,

        selection:
          undefined,

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
    focusedEvent:
      unknown,
  ): void {

    if (
      this.state.session.focusedEvent ===
      focusedEvent
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

  clearFocusedEvent():
    void {

    if (
      this.state.session.focusedEvent ===
      undefined
    ) {

      return;

    }

    this.state = {

      ...this.state,

      session: {

        ...this.state.session,

        focusedEvent:
          undefined,

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // LIFECYCLE
  // ==========================================================

  initialize():
    void {

    if (
      this.state.status ===
      "READY"
    ) {

      return;

    }

    this.state = {

      ...this.state,

      status:
        "READY",

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  activate(
    workspace:
      Workspace,
  ): void {

    this.state = {

      ...this.state,

      status:
        "ACTIVE",

      session: {

        ...this.state.session,

        workspace,

      },

      // ------------------------------------------------------
      // Workspace active_layers becomes the initial runtime
      // computational layer configuration.
      //
      // From this point forward the Workspace Runtime owns
      // the live computational configuration.
      // ------------------------------------------------------

      computational: {

        ...this.state.computational,

        activeLayers: [
          ...workspace.active_layers,
        ],

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  /**
   * Atomically activates a canonical Investigation and its
   * owning Workspace.
   *
   * Observers must never see a Workspace without the
   * Investigation that owns it. This method therefore
   * publishes the complete intake state with one notification.
   */
  activateInvestigation(
    investigation:
      Investigation,
  ): void {

    const workspace =
      investigation.workspace;

    this.state = {

      ...this.state,

      status:
        "ACTIVE",

      session: {

        ...this.state.session,

        workspace,

        investigation,

      },

      operator: {

        ...this.state.operator,

        selection:
          undefined,

      },

      computational: {

        ...this.state.computational,

        activeLayers: [
          ...workspace.active_layers,
        ],

      },

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  deactivate():
    void {

    this.state = {

      ...this.state,

      status:
        "READY",

      session: {

        workspace:
          undefined,

        investigation:
          undefined,

        focusedEvent:
          undefined,

        artifacts:
          [],

      },

      operator: {

        ...this.state.operator,

        selection:
          undefined,

      },

      computational: {

        activeLayers: [
          ...DEFAULT_COMPUTATIONAL_CONFIGURATION
            .activeLayers,
        ],

        temporalContext:
          DEFAULT_COMPUTATIONAL_CONFIGURATION
            .temporalContext,

        investigativeScale:
          DEFAULT_COMPUTATIONAL_CONFIGURATION
            .investigativeScale,

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
  // Future Computational Configuration
  // ------------------------------------
  //
  // Canonical TemporalContext
  // Canonical InvestigativeScale
  // Layer Taxonomy
  // Compute Profiles
  // Compute Presets
  // Configuration Snapshots
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
