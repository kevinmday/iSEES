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
  ResearchInboxProjection,
  ResearchInboxQuery,

} from "./researchBridgeTypes";
import { migrateResearchAnchor } from "./ResearchAnchorContract.ts";

// ============================================================
// TYPES
// ============================================================

export type ResearchBridgeMutation =
  | { kind: "CREATE"; anchor: ResearchAnchor }
  | { kind: "REMOVE" | "CLEAR" | "RESTORE" | "PIN" };

type ResearchBridgeListener =
  (mutation: ResearchBridgeMutation) => void;

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

  projectInvestigation(query: ResearchInboxQuery): ResearchInboxProjection {
    if (!query.investigationId) return { status: "NO_ACTIVE_INVESTIGATION", entries: [] };
    const needle = query.searchQuery?.trim().toLocaleLowerCase() ?? "";
    const entries = this.desk.entries
      .filter(entry => entry.anchor.investigationId === query.investigationId)
      .map(entry => ({ ...entry, anchor: migrateResearchAnchor(entry.anchor) }))
      .filter(entry => !query.sourceWorkspace || entry.anchor.sourceWorkspace === query.sourceWorkspace)
      .filter(entry => !query.sourceKind || entry.anchor.kind === query.sourceKind)
      .filter(entry => !query.insertableOnly || entry.anchor.insertability.state === "INSERTABLE")
      .filter(entry => !needle || [entry.anchor.display.title, entry.anchor.display.summary, entry.anchor.sourceIdentity, entry.anchor.kind].some(value => value.toLocaleLowerCase().includes(needle)))
      .sort((left, right) => {
        if (query.pinnedFirst !== false && left.anchor.pinned !== right.anchor.pinned) return left.anchor.pinned ? -1 : 1;
        return left.order - right.order || left.anchor.anchorId.localeCompare(right.anchor.anchorId);
      });
    const selectedAnchorId = query.selectedAnchorId && entries.some(entry => entry.anchor.anchorId === query.selectedAnchorId) ? query.selectedAnchorId : undefined;
    return { status: "AVAILABLE", investigationId: query.investigationId, entries, selectedAnchorId };
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

  private notify(mutation: ResearchBridgeMutation): void {

    this.revision++;

    for (
      const listener
      of this.listeners
    ) {

      listener(mutation);

    }

  }

  // ==========================================================
  // ANCHOR OWNERSHIP
  // ==========================================================

  createAnchor(
    anchor:
      ResearchAnchor,
  ): void {

    const qualifiedAnchor = migrateResearchAnchor(anchor);
    if (

      this.desk.entries.some(

        entry =>

          entry.anchor.anchorId ===
          qualifiedAnchor.anchorId

      )

    ) {

      return;

    }

    this.desk = {

      ...this.desk,

      entries: [

        ...this.desk.entries,

        {

          anchor: qualifiedAnchor,

          order:
            this.desk.entries.length,

        },

      ],

    };

    this.notify({ kind: "CREATE", anchor: qualifiedAnchor });

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

    this.notify({ kind: "REMOVE" });

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

    this.notify({ kind: "CLEAR" });

  }

  // ==========================================================
  // DESK RESTORATION
  // ==========================================================

  /**
   * Restore a previously persisted Research Desk.
   *
   * Restoration is intentionally distinct from createAnchor()
   * and bridge().
   *
   * Persisted Research state already contains canonical:
   *
   *   - Research Anchor identity
   *   - Investigation ownership
   *   - Graph reference
   *   - Graph revision
   *   - Operator ordering
   *   - Pin state
   *   - Creation metadata
   *
   * Therefore restoration must preserve the persisted Desk
   * exactly rather than reconstructing it through bridge().
   *
   * Runtime revision itself is not persisted. Restoration is
   * one atomic runtime mutation and therefore emits exactly one
   * runtime publication.
   */
  restoreDesk(
    desk:
      ResearchDesk,
  ): void {

    this.desk = {

      ...desk,

      entries:

        desk.entries.map(

          entry => ({

            ...entry,

            anchor: migrateResearchAnchor(entry.anchor),

          }),

        ),

    };

    this.notify({ kind: "RESTORE" });

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

    this.notify({ kind: "PIN" });

  }

  // ==========================================================
  // BRIDGE
  // ==========================================================

  /**
   * Deterministic bridge from the live
   * Investigation Manifold into Research.
   *
   * The Manifold emits a ResearchBridgeRequest.
   *
   * The Research Bridge constructs a canonical
   * ResearchAnchor without copying the underlying
   * graph object.
   *
   * Anchor identity is derived deterministically
   * from investigation ownership and graph identity.
   */

  bridge(
    request:
      ResearchBridgeRequest,
  ): void {

    const anchorId =
      [
        "research",
        request.investigationId,
        request.graph.type,
        request.graph.id,
      ].join(":");

    const createdAt = new Date();
    const anchor = migrateResearchAnchor({

        anchorId,

        investigationId:
          request.investigationId,

        graph:
          request.graph,

        graphRevision:
          request.graphRevision,

        createdAt,

        pinned:
          false,

      } as unknown as Record<string, unknown>);

    this.createAnchor(
      anchor,
    );

  }

}

// ============================================================
// SINGLETON
// ============================================================

export const researchBridgeRuntime =
  new ResearchBridgeRuntime();
