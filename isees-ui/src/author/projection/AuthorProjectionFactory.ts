// ============================================================
// src/author/projection/AuthorProjectionFactory.ts
// P50
// AUTHOR PROJECTION FACTORY
//
// Deterministic factory responsible for constructing
// Author Projections.
//
// The factory is the single location where concrete
// projection implementations are selected.
//
// The remainder of the Author subsystem depends only
// upon the AuthorProjection contract.
//
// ============================================================

import type {

  AuthorProjection,

} from "./AuthorProjection";

import {

  AuthorProjectionTypes,

} from "./AuthorProjectionTypes";

import {

  LexicalProjection,

} from "./lexical/LexicalProjection";

// ============================================================
// FACTORY
// ============================================================

export class AuthorProjectionFactory {

  /**
   * Create a projection implementation.
   *
   * Future implementations:
   *
   *  • Markdown
   *  • PDF
   *  • DOCX
   *  • HTML
   *  • Presentation
   */

  static create(

    type =
      AuthorProjectionTypes.EDITOR,

  ): AuthorProjection {

    switch (type) {

      case AuthorProjectionTypes.EDITOR:

        return new LexicalProjection();

      default:

        throw new Error(

          `Unsupported Author Projection: ${type}`,

        );

    }

  }

}