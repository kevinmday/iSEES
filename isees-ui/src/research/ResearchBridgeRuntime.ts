// ============================================================
// src/research/ResearchBridgeRuntime.ts
// P41A
// RESEARCH BRIDGE RUNTIME
//
// Deterministic runtime owning the operator's active
// Research Desk.
//
// The Research Bridge never owns graph objects.
//
// It owns only Research Anchors that remain entangled
// with the live Investigation Graph.
//
// Performs no graph computation.
//
// Ownership:
//
// Investigation Graph
//          │
//          ▼
// Research Bridge Runtime
//          │
//          ▼
// Research Desk
//          │
//          ▼
// Authoring Studio
//
// ============================================================

import type {

  ResearchAnchor,
  ResearchBridgeRequest,
  ResearchDesk,

} from "./researchBridgeTypes";

// ============================================================
// TYPES
// ============================================================

type ResearchBridgeListener =
  () => void;

// ============================================================
// RUNTIME
// ============================================================

export class ResearchBridgeRuntime {

  private desk:
    ResearchDesk = {

      entries: [],

    };

  private revision =
    0;

  private listeners =
    new Set<ResearchBridgeListener>();

  // ==========================================================
  // ACCESSORS
  // ==========================================================

  getDesk():
    Readonly<ResearchDesk> {

    return this.desk;

  }

  getRevision():
    number {

    return this.revision;

  }

  // ==========================================================
  // OBSERVERS
  // ==========================================================

  subscribe(
    listener: ResearchBridgeListener,
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

    this.revision++;

    for (
      const listener
      of this.listeners
    ) {

      listener();

    }

  }

  // ==========================================================
  // ANCHOR OWNERSHIP
  // ==========================================================

  createAnchor(
    anchor:
      ResearchAnchor,
  ): void {

    if (

      this.desk.entries.some(

        entry =>

          entry.anchor.anchorId ===
          anchor.anchorId

      )

    ) {

      return;

    }

    this.desk = {

      ...this.desk,

      entries: [

        ...this.desk.entries,

        {

          anchor,

          order:
            this.desk.entries.length,

        },

      ],

    };

    this.notify();

  }

  removeAnchor(
    anchorId:
      string,
  ): void {

    this.desk = {

      ...this.desk,

      entries:

        this.desk.entries.filter(

          entry =>

            entry.anchor.anchorId !==
            anchorId,

        ),

    };

    this.notify();

  }

  clearDesk():
    void {

    if (
      this.desk.entries.length === 0
    ) {

      return;

    }

    this.desk = {

      entries: [],

    };

    this.notify();

  }

  pinAnchor(
    anchorId:
      string,

    pinned:
      boolean,
  ): void {

    this.desk = {

      ...this.desk,

      entries:

        this.desk.entries.map(

          entry =>

            entry.anchor.anchorId ===
            anchorId

              ? {

                  ...entry,

                  anchor: {

                    ...entry.anchor,

                    pinned,

                  },

                }

              : entry,

        ),

    };

    this.notify();

  }

  // ==========================================================
  // BRIDGE
  // ==========================================================

  /**
   * Future deterministic bridge.
   *
   * The Investigation Manifold will emit a
   * ResearchBridgeRequest.
   *
   * This runtime will construct the
   * canonical ResearchAnchor.
   */

  bridge(
    _request:
      ResearchBridgeRequest,
  ): void {

    // P41A
    //
    // Implemented after
    // drag/drop integration.

  }

}

// ============================================================
// SINGLETON
// ============================================================

export const researchBridgeRuntime =
  new ResearchBridgeRuntime();