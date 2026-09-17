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
  GraphSelection,
  InvestigationGraph,
} from "../../manifold/graphTypes";

import type {
  WorkspaceSelection,
} from "../../workspace/runtime/WorkspaceRuntimeTypes";

import {
  resolveSelectionIntelligence,
} from "../../manifold/selection/selectionIntelligenceResolver";

import type {
  SelectionIntelligence,
  SelectionIntelligenceContext,
} from "../../manifold/selection/selectionIntelligenceResolver";

// ============================================================
// REQUEST
// ============================================================

export interface CanonicalSelectionIntelligenceRequest {
  readonly graph:
    InvestigationGraph;

  readonly selection:
    WorkspaceSelection | undefined;

  readonly investigationId?: string;

  readonly manifoldRevisionId?: string;
}

// ============================================================
// RESOLVE
// ============================================================

export function resolveCanonicalSelectionIntelligence(
  request:
    CanonicalSelectionIntelligenceRequest,
): SelectionIntelligence {
  const graph = request.graph;

  const graphSelection:
  GraphSelection = (() => {
    if (
      request.selection === undefined ||
      request.selection.kind === "NONE" ||
      request.selection.kind === "CANDIDATE" ||
      request.selection.kind === "COMPARISON_TARGET"
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

    const endpointsExist = edge !== undefined &&
      graph.nodes.some(node => node.id === edge.source) &&
      graph.nodes.some(node => node.id === edge.target);

    return edge === undefined || !endpointsExist
      ? { kind: "NONE" }
      : {
          kind: "EDGE",
          edgeId: edge.id,
          sourceId: edge.source,
          targetId: edge.target,
        };
  })();

  if (
    request.selection?.kind === "NODE" &&
    graphSelection.kind === "NONE"
  ) {
    return {
      kind: "NONE",
      availability: {
        status: "UNAVAILABLE",
        reason: "SELECTION_NOT_FOUND",
      },
    };
  }

  if (
    request.selection?.kind === "EDGE" &&
    graphSelection.kind === "NONE"
  ) {
    return {
      kind: "NONE",
      availability: {
        status: "UNAVAILABLE",
        reason: "SELECTION_NOT_FOUND",
      },
    };
  }

  const context: SelectionIntelligenceContext | undefined =
    request.investigationId !== undefined &&
    request.manifoldRevisionId !== undefined
      ? {
          investigationId: request.investigationId,
          manifoldRevisionId: request.manifoldRevisionId,
        }
      : undefined;

  return resolveSelectionIntelligence(
    graphSelection,
    graph,
    context,
  );
}

// ============================================================
// END
// ============================================================
