// ============================================================
// src/author/projection/AuthorProjectionTypes.ts
// P50
// AUTHOR PROJECTION TYPES
//
// Canonical contracts describing every projection of a
// Computational Author Document.
//
// A projection interprets the computational document for
// a particular operator experience.
//
// Projections never own computational truth.
//
// ============================================================

import type {

  ComputationalAuthorDocument,

} from "../model/AuthorDocument";

// ============================================================
// PROJECTION TYPE
// ============================================================

export const AuthorProjectionTypes = {

  EDITOR:
    "EDITOR",

  VIEWER:
    "VIEWER",

  EXPORTER:
    "EXPORTER",

  VISUALIZATION:
    "VISUALIZATION",

  PRESENTATION:
    "PRESENTATION",

  CUSTOM:
    "CUSTOM",

} as const;

export type AuthorProjectionType =
  typeof AuthorProjectionTypes[
    keyof typeof AuthorProjectionTypes
  ];

// ============================================================
// LIFECYCLE
// ============================================================

export const AuthorProjectionStates = {

  CREATED:
    "CREATED",

  INITIALIZED:
    "INITIALIZED",

  ATTACHED:
    "ATTACHED",

  ACTIVE:
    "ACTIVE",

  DETACHED:
    "DETACHED",

  DISPOSED:
    "DISPOSED",

} as const;

export type AuthorProjectionState =
  typeof AuthorProjectionStates[
    keyof typeof AuthorProjectionStates
  ];

// ============================================================
// CAPABILITIES
// ============================================================

export interface AuthorProjectionCapabilities {

  readonly editable:
    boolean;

  readonly selectable:
    boolean;

  readonly exportable:
    boolean;

  readonly printable:
    boolean;

}

// ============================================================
// CONTEXT
// ============================================================

/**
 * Immutable context supplied to every projection.
 *
 * Projections observe the computational document.
 * They never become its owner.
 */
export interface AuthorProjectionContext {

  readonly document:
    ComputationalAuthorDocument;

}

// ============================================================
// SNAPSHOT
// ============================================================

/**
 * Runtime-independent projection state.
 *
 * This describes the projection itself rather than
 * the computational document.
 */
export interface AuthorProjectionSnapshot {

  readonly type:
    AuthorProjectionType;

  readonly state:
    AuthorProjectionState;

  readonly capabilities:
    AuthorProjectionCapabilities;

}