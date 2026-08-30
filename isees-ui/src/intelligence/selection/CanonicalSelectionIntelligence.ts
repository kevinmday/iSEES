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

import type {
  WorkspaceSelection,
} from "../../workspace/runtime/WorkspaceRuntimeTypes";

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
    WorkspaceSelection | undefined;

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

  const graphSelection:
  GraphSelection = (() => {
    if (
      request.selection === undefined ||
      request.selection.kind === "NONE" ||
      request.selection.kind === "CANDIDATE"
    ) {
      return { kind: "NONE" };
    }

    if (request.selection.kind === "NODE") {
      const nodeId =
        request.selection.nodeId;

      const node = graph.nodes.find(
        candidate =>
          candidate.id === nodeId,
      );

      return node === undefined
        ? { kind: "NONE" }
        : {
            kind: "NODE",
            nodeId: node.id,
            nodeType: node.type,
          };
    }

    const edgeId =
      request.selection.edgeId;

    const edge = graph.edges.find(
      candidate =>
        candidate.id === edgeId,
    );

    return edge === undefined
      ? { kind: "NONE" }
      : {
          kind: "EDGE",
          edgeId: edge.id,
          sourceId: edge.source,
          targetId: edge.target,
        };
  })();

  return resolveSelectionIntelligence(
    graphSelection,
    graph,
  );
}

// ============================================================
// END
// ============================================================