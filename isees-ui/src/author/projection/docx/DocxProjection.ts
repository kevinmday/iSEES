// ============================================================
// src/author/projection/docx/DocxProjection.ts
// P50
// DOCX PROJECTION
//
// Canonical DOCX projection.
//
// This class adapts the Computational Author
// Document to a future Microsoft Word
// representation.
//
// Lifecycle stub only.
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

export class DocxProjection
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
          true,

      },

    };

  getSnapshot():
    Readonly<
      AuthorProjectionSnapshot
    > {

    return this.snapshot;

  }

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

    if (!this.context) {

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