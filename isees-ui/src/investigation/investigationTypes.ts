// ============================================================
// src/investigation/investigationTypes.ts
// P29
// INVESTIGATION LIFECYCLE FOUNDATION
// CANONICAL INVESTIGATION CONTRACTS
//
// The Investigation is the persistent container for all work.
//
// A Workspace is transient.
// A Manifold is computed.
// A Revision is immutable.
//
// FULL DROP-IN FILE
// ============================================================

import type {
  Workspace,
} from "../workspace/workspaceTypes";

import type {
  InvestigationGraph,
} from "../manifold/graphTypes";

// ============================================================
// INVESTIGATION STATUS
// ============================================================

export type InvestigationStatus =
  | "DRAFT"
  | "ACTIVE"
  | "ARCHIVED"
  | "PUBLISHED";

// ============================================================
// BRANCH TYPE
// ============================================================

export type InvestigationBranchType =
  | "MAIN"
  | "EXPERIMENTAL"
  | "RESEARCH"
  | "HYPOTHESIS";

// ============================================================
// MANIFOLD LAYER
// (Initial foundation — expands over time.)
// ============================================================

export type ManifoldLayer =

  | "NARRATIVE"
  | "GEO"
  | "TEMPORAL"
  | "INFRASTRUCTURE"
  | "HISTORICAL"
  | "SENSOR"
  | "CULTURAL"
  | "ONTOLOGICAL"
  | "SEMANTIC_DRIFT";

// ============================================================
// MANIFOLD REVISION
// Snapshot of a deterministic computation.
// ============================================================

export interface ManifoldRevision {

  id: string;

  timestamp: string;

  algorithmVersion: string;

  activeLayers: ManifoldLayer[];

  graph: InvestigationGraph;

  notes?: string;
}

// ============================================================
// INVESTIGATION REVISION
// Immutable checkpoint.
// ============================================================

export interface InvestigationRevision {

  id: string;

  revisionNumber: number;

  timestamp: string;

  operator: string;

  parentRevisionId?: string;

  branch: InvestigationBranchType;

  message: string;

  manifold: ManifoldRevision;
}

// ============================================================
// INVESTIGATION
// Persistent owner of the entire investigation lifecycle.
// ============================================================

export interface Investigation {

  id: string;

  name: string;

  description: string;

  createdAt: string;

  updatedAt: string;

  createdBy: string;

  status: InvestigationStatus;

  workspace: Workspace;

  currentRevisionId?: string;

  revisions: InvestigationRevision[];
}