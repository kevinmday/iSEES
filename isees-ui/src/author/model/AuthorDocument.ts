// ============================================================
// AUTHOR DOCUMENT
// ============================================================

import type {

  AuthorDocument,

} from "./AuthorDocumentTypes";

import type {

  AuthorNode,

} from "./AuthorNodeTypes";

/**
 * Canonical computational author document.
 *
 * This is the root object owned by the
 * AuthorDocumentRuntime.
 *
 * The document is intentionally independent
 * of any editor implementation. Lexical,
 * DOCX, PDF, HTML, Markdown, presentations,
 * and future formats are all projections
 * of this computational model.
 */
export interface ComputationalAuthorDocument
  extends AuthorDocument {

  /**
   * Root semantic document structure.
   */
  nodes:
    AuthorNode[];

}