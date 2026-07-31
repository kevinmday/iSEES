// ============================================================
// AUTHOR DOCUMENT TYPES
// ============================================================

/**
 * Canonical document types supported by the
 * Authoring Studio.
 *
 * Additional projections may be introduced
 * without changing the computational model.
 */
export const AuthorDocumentTypes = {

  DOCUMENT:
    "DOCUMENT",

  REPORT:
    "REPORT",

  PRESENTATION:
    "PRESENTATION",

  NOTEBOOK:
    "NOTEBOOK",

  ARTICLE:
    "ARTICLE",

  MANUAL:
    "MANUAL",

} as const;

export type AuthorDocumentType =
  typeof AuthorDocumentTypes[
    keyof typeof AuthorDocumentTypes
  ];

/**
 * Current lifecycle state of the document.
 */
export const AuthorDocumentStatuses = {

  NEW:
    "NEW",

  READY:
    "READY",

  MODIFIED:
    "MODIFIED",

  SAVED:
    "SAVED",

  ARCHIVED:
    "ARCHIVED",

} as const;

export type AuthorDocumentStatus =
  typeof AuthorDocumentStatuses[
    keyof typeof AuthorDocumentStatuses
  ];

/**
 * Immutable identity assigned to the
 * computational document.
 */
export interface AuthorDocumentIdentity {

  readonly id:
    string;

  readonly createdAt:
    Date;

}

/**
 * Mutable metadata describing the document.
 */
export interface AuthorDocumentMetadata {

  title:
    string;

  description:
    string;

  author:
    string;

  modifiedAt:
    Date;

  version:
    number;

}

/**
 * Root computational document contract.
 *
 * The document itself remains editor-agnostic.
 * Lexical, DOCX, PDF, HTML, Markdown, and future
 * formats are projections of this model rather
 * than the model itself.
 */
export interface AuthorDocument {

  identity:
    AuthorDocumentIdentity;

  metadata:
    AuthorDocumentMetadata;

  type:
    AuthorDocumentType;

  status:
    AuthorDocumentStatus;

}