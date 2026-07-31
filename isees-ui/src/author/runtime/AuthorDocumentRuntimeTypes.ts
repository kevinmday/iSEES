// ============================================================
// src/author/runtime/AuthorDocumentRuntimeTypes.ts
// P49A
// AUTHOR DOCUMENT RUNTIME CONTRACTS
//
// Canonical runtime contracts for deterministic document
// authoring.
//
// The Author Document Runtime owns document state.
//
// React observes.
//
// Lexical edits.
//
// Exporters publish.
//
// ============================================================

// ============================================================
// DOCUMENT STATUS
// ============================================================

export const AuthorDocumentStatus = {

  DRAFT: "DRAFT",

  REVIEW: "REVIEW",

  FINAL: "FINAL",

  PUBLISHED: "PUBLISHED",

} as const;

export type AuthorDocumentStatus =
  typeof AuthorDocumentStatus[
    keyof typeof AuthorDocumentStatus
  ];

// ============================================================
// DOCUMENT METADATA
// ============================================================

export interface AuthorDocumentMetadata {

  title:
    string;

  author:
    string;

  investigationId:
    string;

  focusedEventId?:
    string;

  createdAt:
    Date;

  updatedAt:
    Date;

  revision:
    number;

  status:
    AuthorDocumentStatus;

}

// ============================================================
// COMPUTATIONAL REFERENCE
// ============================================================

export interface ComputationalReference {

  id:
    string;

  type:
    string;

}

// ============================================================
// DOCUMENT
// ============================================================

export interface AuthorDocument {

  id:
    string;

  metadata:
    AuthorDocumentMetadata;

  content:
    string;

  references:
    ComputationalReference[];

}

// ============================================================
// RUNTIME STATE
// ============================================================

export interface AuthorDocumentRuntimeState {

  activeDocument?:
    AuthorDocument;

  dirty:
    boolean;

  revision:
    number;

}

// ============================================================
// FUTURE
// ============================================================
//
// Multiple Documents
//
// Tabs
//
// Undo / Redo
//
// Save Manager
//
// Publish Manager
//
// Citation Manager
//
// Computational Blocks
//
// Embedded Graph References
//
// Lexical Integration
//
// ============================================================