// ============================================================
// src/research/researchBridgeTypes.ts
// P41A
// RESEARCH BRIDGE CONTRACTS
//
// Canonical deterministic contracts connecting the
// Investigation Manifold to the Research Desk.
//
// The Research Bridge never copies graph objects.
//
// It creates persistent Research Anchors that remain
// entangled with the live Investigation Graph.
//
// Ownership:
//
// Investigation Graph
//          │
//          ▼
//   Research Anchor
//          │
//          ▼
//    Research Desk
//          │
//          ▼
//   Authoring Studio
//
// ============================================================


// ============================================================
// GRAPH OBJECT TYPE
// ============================================================

export const ResearchAnchorType = {

  NODE: "NODE",

  EDGE: "EDGE",

} as const;

export type ResearchAnchorType =
  typeof ResearchAnchorType[
    keyof typeof ResearchAnchorType
  ];

// ============================================================
// GRAPH REFERENCE
// ============================================================

export interface GraphReference {

  /**
   * Node or Edge.
   */

  type:
    ResearchAnchorType;

  /**
   * Runtime graph identifier.
   */

  id:
    string;

}
// ============================================================
// RESEARCH ANCHOR
// ============================================================

/**
 * A Research Anchor never duplicates
 * graph information.
 *
 * It is a deterministic reference into
 * the live Investigation Graph.
 */

export interface ResearchAnchor {

  /**
   * Stable anchor identifier.
   */

  anchorId:
    string;

  /**
   * Investigation ownership.
   */

  investigationId:
    string;

  /**
   * Live graph reference.
   */

  graph:
    GraphReference;

  /**
   * Runtime revision when
   * anchor created.
   */

  graphRevision:
    number;

  /**
   * Creation timestamp.
   */

  createdAt:
    Date;

  /**
   * Optional operator note.
   */

  notes?:
    string;

  /**
   * Prevent automatic cleanup.
   */

  pinned:
    boolean;

}

// ============================================================
// RESEARCH DESK ENTRY
// ============================================================

/**
 * Individual object displayed on
 * the Research Desk.
 *
 * The desk owns anchors,
 * not graph objects.
 */

export interface ResearchDeskEntry {

  anchor:
    ResearchAnchor;

  /**
   * Operator ordering.
   */

  order:
    number;

}

// ============================================================
// RESEARCH DESK
// ============================================================

export interface ResearchDesk {

  /**
   * Active deterministic anchors.
   */

  entries:
    ResearchDeskEntry[];

}

// ============================================================
// BRIDGE REQUEST
// ============================================================

/**
 * Emitted by the Investigation
 * Manifold when the operator
 * intentionally moves an object
 * into the Research Desk.
 */

export interface ResearchBridgeRequest {

  /**
   * Live Investigation Graph reference
   * intentionally moved into Research.
   */

  graph:
    GraphReference;

  /**
   * Investigation owning the
   * referenced graph object.
   */

  investigationId:
    string;

  /**
   * Deterministic Manifold Runtime revision
   * at the moment the bridge request
   * was emitted.
   */

  graphRevision:
    number;

}
// ============================================================
// FUTURE
// ============================================================
//
// Research Collections
//
// Research Sessions
//
// Research Timeline
//
// Narrative Builder
//
// Report Generator
//
// Citation Manager
//
// Publication Pipeline
//
// Collaboration
//
// ============================================================