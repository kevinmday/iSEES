// ============================================================
// src/manifold/selection/selectionIntelligenceResolver.ts
// P45B
// SELECTION INTELLIGENCE RESOLVER
//
// Deterministic projection between:
//
// Graph Selection
//      ↓
// Investigation Graph
//      ↓
// Selection Intelligence
//
// This module owns no state.
// It performs no inference.
// It resolves canonical graph objects into inspector-ready
// intelligence projections.
//
// ============================================================

import type {
  GraphSelection,
  InvestigationGraph,
} from "../graphTypes";

import type {
  GraphNodeIntelligence,
  GraphEdgeIntelligence,
} from "../../graph/graphInteractionTypes";

// ============================================================
// RESULT CONTRACT
// ============================================================

export type SelectionIntelligence =

  | {
      kind: "NONE";
    }

  | {
      kind: "NODE";

      intelligence:
        GraphNodeIntelligence;
    }

  | {
      kind: "EDGE";

      intelligence:
        GraphEdgeIntelligence;
    }

  | {
      kind: "CLUSTER";

      clusterId: string;
    };

// ============================================================
// HELPERS
// ============================================================

function metric(
  value: number | undefined
): number {

  return value ?? 0;
}

// ============================================================
// RESOLVER
// ============================================================

export function resolveSelectionIntelligence(
  selection: GraphSelection,
  graph: InvestigationGraph,
): SelectionIntelligence {

  // ==========================================================
  // NONE
  // ==========================================================

  if (
    selection.kind === "NONE"
  ) {

    return {
      kind: "NONE",
    };
  }

  // ==========================================================
  // NODE
  // ==========================================================

  if (
    selection.kind === "NODE"
  ) {

    const node =
      graph.nodes.find(
        candidate =>
          candidate.id ===
          selection.nodeId
      );

    if (!node) {

      return {
        kind: "NONE",
      };
    }

    const connectionCount =
      graph.edges.filter(
        edge =>
          edge.source === node.id ||
          edge.target === node.id
      ).length;

    const metadata =
      node.metadata;

    const sourceType =
      typeof metadata?.source ===
      "string"
        ? metadata.source
        : node.type;

    const confidenceValue =
      metadata?.confidence;

    const confidence =
      typeof confidenceValue ===
      "number"
        ? confidenceValue
        : undefined;

    return {

      kind: "NODE",

      intelligence: {

        nodeId:
          node.id,

        title:
          node.label,

        sourceType,

        confidence,

        connectionCount,

        metadata:
          node.metadata,
      },
    };
  }

  // ==========================================================
  // EDGE
  // ==========================================================

  if (
    selection.kind === "EDGE"
  ) {

    const edge =
      graph.edges.find(
        candidate =>
          candidate.id ===
          selection.edgeId
      );

    if (!edge) {

      return {
        kind: "NONE",
      };
    }

    const sourceNode =
      graph.nodes.find(
        candidate =>
          candidate.id ===
          edge.source
      );

    const targetNode =
      graph.nodes.find(
        candidate =>
          candidate.id ===
          edge.target
      );

    return {

      kind: "EDGE",

      intelligence: {

        edgeId:
          edge.id,

        sourceId:
          edge.source,

        sourceLabel:
          sourceNode?.label ??
          edge.source,

        targetId:
          edge.target,

        targetLabel:
          targetNode?.label ??
          edge.target,

        relationship:
          edge.relationship,

        confidence:
          metric(
            edge.metrics?.confidence ??
            edge.weight
          ),

        narrative:
          metric(
            edge.metrics?.narrative
          ),

        observability:
          metric(
            edge.metrics?.observability
          ),

        infrastructure:
          metric(
            edge.metrics?.infrastructure
          ),

        topology:
          metric(
            edge.metrics?.topology
          ),

        geo:
          metric(
            edge.metrics?.geo
          ),

        rationale:
          edge.rationale,
      },
    };
  }
  // ==========================================================
  // CLUSTER
  // ==========================================================

  if (
    selection.kind === "CLUSTER"
  ) {

    return {

      kind: "CLUSTER",

      clusterId:
        selection.clusterId,
    };
  }

  // ==========================================================
  // EXHAUSTIVE FALLBACK
  // ==========================================================

  return {
    kind: "NONE",
  };
}