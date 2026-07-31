// ============================================================
// src/author/runtime/AuthorDocumentRuntimeTypes.ts
// ============================================================

import type {

  ComputationalAuthorDocument,

} from "../model/AuthorDocument";

// ============================================================
// RUNTIME STATE
// ============================================================

export interface AuthorDocumentRuntimeState {

  activeDocument?:
    ComputationalAuthorDocument;

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