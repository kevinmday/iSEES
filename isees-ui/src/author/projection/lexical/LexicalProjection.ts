// ============================================================
// src/author/projection/lexical/LexicalProjection.ts
// P51
// LEXICAL PROJECTION
//
// Canonical Lexical projection.
//
// This class is responsible for projecting the
// Computational Author Document into the future
// Lexical editor while preserving computational
// ownership inside the AuthorDocumentRuntime.
//
// IMPORTANT
//
// This class intentionally contains:
//
// • no Lexical imports
// • no React
// • no DOM
// • no editor implementation
//
// The Lexical editor remains an implementation
// detail of this projection.
//
// ============================================================

import type {

  AuthorProjection,

} from "../AuthorProjection";

import type {

  AuthorProjectionContext,

  AuthorProjectionSnapshot,

} from "../AuthorProjectionTypes";

import {

  AuthorProjectionStates,

  AuthorProjectionTypes,

} from "../AuthorProjectionTypes";

// ============================================================
// PROJECTION
// ============================================================

export class LexicalProjection
  implements AuthorProjection {

  private context?:
    AuthorProjectionContext;

  /**
   * True once the computational document
   * has been projected into the current
   * editor representation.
   */
  private synchronized =
    false;

  private snapshot:
    AuthorProjectionSnapshot = {

      type:
        AuthorProjectionTypes.EDITOR,

      state:
        AuthorProjectionStates.CREATED,

      capabilities: {

        editable:
          true,

        selectable:
          true,

        exportable:
          false,

        printable:
          false,

      },

    };

  // ==========================================================
  // STATE
  // ==========================================================

  getSnapshot():
    Readonly<
      AuthorProjectionSnapshot
    > {

    return this.snapshot;

  }

  isSynchronized():
    boolean {

    return this.synchronized;

  }

  // ==========================================================
  // LIFECYCLE
  // ==========================================================

  initialize(
    context:
      AuthorProjectionContext,
  ): void {

    this.context =
      context;

    this.synchronized =
      false;

    this.snapshot = {

      ...this.snapshot,

      state:
        AuthorProjectionStates.INITIALIZED,

    };

  }

  attach():
    void {

    this.snapshot = {

      ...this.snapshot,

      state:
        AuthorProjectionStates.ATTACHED,

    };

  }

  refresh():
    void {

    if (
      !this.context
    ) {

      return;

    }

    //
    // P51
    //
    // Future implementation:
    //
    // ComputationalAuthorDocument
    //          ↓
    //   Lexical Projection
    //          ↓
    //  Lexical Editor State
    //
    // This method becomes the canonical
    // projection synchronization point.
    //

    this.synchronized =
      true;

    this.snapshot = {

      ...this.snapshot,

      state:
        AuthorProjectionStates.ACTIVE,

    };

  }

  detach():
    void {

    this.synchronized =
      false;

    this.snapshot = {

      ...this.snapshot,

      state:
        AuthorProjectionStates.DETACHED,

    };

  }

  dispose():
    void {

    this.context =
      undefined;

    this.synchronized =
      false;

    this.snapshot = {

      ...this.snapshot,

      state:
        AuthorProjectionStates.DISPOSED,

    };

  }

}