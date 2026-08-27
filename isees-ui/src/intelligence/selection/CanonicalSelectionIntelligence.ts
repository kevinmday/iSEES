// ============================================================
// src/intelligence/selection/CanonicalSelectionIntelligence.ts
//
// CANONICAL SELECTION INTELLIGENCE
//
// Shared deterministic resolution:
//
//   Canonical Knowledge
//       ↓
//   Canonical Investigation Graph
//       ↓
//   Graph Selection
//       ↓
//   Selection Intelligence
//
// Consumers:
//
//   • Selection Intelligence RightPanel
//   • future iSEES Assistant context production
//   • future deterministic replay and verification
//
// This module:
//
//   • owns no selection state
//   • imports no React
//   • reads no runtime directly
//   • performs no inference
//   • executes no REX
//   • invokes no AI
//   • mutates no canonical input
//
// FULL DROP-IN FILE
// ============================================================

import type {
  KnowledgeObject,
} from "../../knowledge/model/KnowledgeObject";

import type {
  GraphSelection,
} from "../../manifold/graphTypes";

import {
  resolveSelectionIntelligence,
} from "../../manifold/selection/selectionIntelligenceResolver";

import type {
  SelectionIntelligence,
} from "../../manifold/selection/selectionIntelligenceResolver";

import {
  buildCanonicalInvestigationGraph,
} from "./CanonicalInvestigationGraph";

// ============================================================
// REQUEST
// ============================================================

export interface CanonicalSelectionIntelligenceRequest {
  readonly knowledgeObjects:
    readonly KnowledgeObject[];

  readonly selection:
    GraphSelection;

  readonly centerNodeId?:
    string;
}

// ============================================================
// RESOLVE
// ============================================================

export function resolveCanonicalSelectionIntelligence(
  request:
    CanonicalSelectionIntelligenceRequest,
): SelectionIntelligence {
  const graph =
    buildCanonicalInvestigationGraph(
      request.knowledgeObjects,
      request.centerNodeId,
    );

  return resolveSelectionIntelligence(
    request.selection,
    graph,
  );
}

// ============================================================
// END
// ============================================================