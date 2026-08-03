// ============================================================
// src/author/projection/markdown/MarkdownProjection.ts
// P50
// MARKDOWN PROJECTION
//
// Canonical Markdown projection.
//
// This class adapts the Computational Author
// Document to a future Markdown representation.
//
// This is intentionally a lifecycle stub.
//
// No Markdown generation.
// No file writing.
// No persistence.
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

export class MarkdownProjection
  implements AuthorProjection {

  private context?:
    AuthorProjectionContext;

  private snapshot:
    AuthorProjectionSnapshot = {

      type:
        AuthorProjectionTypes.EXPORTER,

      state:
        AuthorProjectionStates.CREATED,

      capabilities: {

        editable:
          false,

        selectable:
          false,

        exportable:
          true,

        printable:
          false,

      },

    };

  // ==========================================================
  // ACCESSORS
  // ==========================================================

  getSnapshot():
    Readonly<
      AuthorProjectionSnapshot
    > {

    return this.snapshot;

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

    this.snapshot = {

      ...this.snapshot,

      state:
        AuthorProjectionStates.ACTIVE,

    };

  }

  detach():
    void {

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

    this.snapshot = {

      ...this.snapshot,

      state:
        AuthorProjectionStates.DISPOSED,

    };

  }

}