// ============================================================
// src/author/projection/AuthorProjection.ts
// P50
// AUTHOR PROJECTION
//
// Canonical projection contract.
//
// Every projection of a Computational Author
// Document implements this interface.
//
// Projections:
//
// • observe
// • interpret
// • visualize
// • edit
// • export
//
// Projections never own the computational
// document.
//
// ============================================================

import type {

  AuthorProjectionContext,

  AuthorProjectionSnapshot,

} from "./AuthorProjectionTypes";

// ============================================================
// PROJECTION
// ============================================================

export interface AuthorProjection {

  /**
   * Immutable description of the
   * current projection.
   */
  getSnapshot():
    Readonly<
      AuthorProjectionSnapshot
    >;

  /**
   * Initialize the projection.
   *
   * Called exactly once before use.
   */
  initialize(
    context:
      AuthorProjectionContext,
  ): void;

  /**
   * Attach the projection to its
   * hosting environment.
   *
   * React, DOM, Canvas, SVG,
   * Export pipeline, etc.
   */
  attach():
    void;

  /**
   * Refresh the projection from the
   * current computational document.
   */
  refresh():
    void;

  /**
   * Detach from the hosting
   * environment.
   */
  detach():
    void;

  /**
   * Permanently release all resources.
   *
   * A disposed projection shall never
   * become active again.
   */
  dispose():
    void;

}