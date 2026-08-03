// ============================================================
// src/author/runtime/AuthorDocumentRuntime.ts
// P51C
// AUTHOR DOCUMENT RUNTIME
//
// Deterministic runtime owning the operator's active
// Computational Author Document.
//
// React observes.
//
// Editors edit.
//
// Projection runtimes render.
//
// No React.
// No Lexical.
// No persistence.
// No networking.
// No AI.
//
// ============================================================

import type {

  ComputationalAuthorDocument,

} from "../model/AuthorDocument";

import type {

  AuthorNode,

} from "../model/AuthorNodeTypes";

import type {

  AuthorDocumentRuntimeState,

} from "./AuthorDocumentRuntimeTypes";

// ============================================================
// TYPES
// ============================================================

type AuthorDocumentRuntimeListener =
  () => void;

// ============================================================
// RUNTIME
// ============================================================

export class AuthorDocumentRuntime {

  private state:
    AuthorDocumentRuntimeState = {

      activeDocument:
        undefined,

      dirty:
        false,

      revision:
        0,

    };

  private listeners =
    new Set<
      AuthorDocumentRuntimeListener
    >();

  // ==========================================================
  // ACCESSORS
  // ==========================================================

  getState():
    Readonly<
      AuthorDocumentRuntimeState
    > {

    return this.state;

  }

  getActiveDocument():
    ComputationalAuthorDocument | undefined {

    return this.state.activeDocument;

  }

  getRevision():
    number {

    return this.state.revision;

  }

  isDirty():
    boolean {

    return this.state.dirty;

  }

  // ==========================================================
  // OBSERVERS
  // ==========================================================

  subscribe(
    listener:
      AuthorDocumentRuntimeListener,
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
  // DOCUMENT OWNERSHIP
  // ==========================================================

  setActiveDocument(
    document:
      ComputationalAuthorDocument,
  ): void {

    if (
      this.state.activeDocument ===
      document
    ) {

      return;

    }

    this.state = {

      ...this.state,

      activeDocument:
        document,

      dirty:
        false,

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  clearActiveDocument():
    void {

    if (
      this.state.activeDocument ===
      undefined
    ) {

      return;

    }

    this.state = {

      ...this.state,

      activeDocument:
        undefined,

      dirty:
        false,

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // DOCUMENT MUTATION
  // ==========================================================

  /**
   * Inserts a computational node into the
   * active Author Document.
   *
   * The runtime owns the mutation.
   *
   * Editors, the Research Inbox, REX, and
   * future subsystems merely construct nodes
   * and request insertion.
   */
  insertNode(
    node:
      AuthorNode,
  ): void {

    const document =
      this.state.activeDocument;

    if (
      document ===
      undefined
    ) {

      return;

    }

    document.nodes.push(
      node,
    );

    this.state = {

      ...this.state,

      dirty:
        true,

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // DOCUMENT STATE
  // ==========================================================

  markDirty():
    void {

    if (
      this.state.dirty
    ) {

      return;

    }

    this.state = {

      ...this.state,

      dirty:
        true,

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  markClean():
    void {

    if (
      !this.state.dirty
    ) {

      return;

    }

    this.state = {

      ...this.state,

      dirty:
        false,

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // FUTURE OWNERSHIP
  // ==========================================================
  //
  // Multiple Documents
  // Tabs
  // Undo / Redo
  // Save Manager
  // Publish Manager
  // Citation Manager
  // Embedded Graph Objects
  // Observation Nodes
  // Lexical Projection
  // Collaboration
  //
  // ==========================================================

}

// ============================================================
// SINGLETON
// ============================================================

export const authorDocumentRuntime =
  new AuthorDocumentRuntime();