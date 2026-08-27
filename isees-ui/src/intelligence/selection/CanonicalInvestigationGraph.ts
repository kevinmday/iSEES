// ============================================================
// src/intelligence/selection/CanonicalInvestigationGraph.ts
//
// CANONICAL INVESTIGATION GRAPH
//
// Shared deterministic bridge:
//
//   Canonical Knowledge
//       ↓
//   Knowledge Topology
//       ↓
//   Investigation Graph
//
// Consumers:
//
//   • Investigation Manifold
//   • Selection Intelligence
//   • future iSEES Assistant context production
//
// This module:
//
//   • owns no state
//   • imports no React
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

import {
  buildKnowledgeTopology,
} from "../../knowledge/topology/KnowledgeTopologyBuilder";

import {
  adaptKnowledgeTopology,
} from "../../knowledge/topology/KnowledgeTopologyAdapter";

import type {
  InvestigationGraph,
} from "../../manifold/graphTypes";

// ============================================================
// BUILD CANONICAL INVESTIGATION GRAPH
// ============================================================

export function buildCanonicalInvestigationGraph(
  knowledgeObjects:
    readonly KnowledgeObject[],
  centerNodeId?: string,
): InvestigationGraph {
  const topology =
    buildKnowledgeTopology(
      [...knowledgeObjects],
    );

  return adaptKnowledgeTopology(
    topology,
    centerNodeId,
  );
}

// ============================================================
// END
// ============================================================