// ============================================================
// src/author/runtime/AuthorDocumentRuntime.ts
// P49A
// AUTHOR DOCUMENT RUNTIME
//
// Deterministic runtime owning the operator's active
// Author Document.
//
// React observes.
//
// Editors edit.
//
// Exporters publish.
//
// No React.
// No Lexical.
// No persistence.
// No networking.
// No AI.
//
// ============================================================

import type {

  AuthorDocument,
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
    AuthorDocument | undefined {

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

  private notify(): void {

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
      AuthorDocument,
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
  // Computational References
  // Embedded Graph Objects
  // Lexical Integration
  // Collaboration
  //
  // ==========================================================

}

// ============================================================
// SINGLETON
// ============================================================

export const authorDocumentRuntime =
  new AuthorDocumentRuntime();