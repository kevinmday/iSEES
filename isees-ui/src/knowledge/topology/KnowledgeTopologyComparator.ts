// ============================================================
// src/knowledge/topology/KnowledgeTopologyComparator.ts
// P56A
// KNOWLEDGE TOPOLOGY MIGRATION COMPARATOR
//
// Pure deterministic diagnostic utility for comparing:
//
//     Legacy InvestigationGraph
//              ⇅
//     Knowledge-derived InvestigationGraph
//
// Purpose:
//
// • Measure topology equivalence before graph-authority cutover
// • Identify legacy-only topology
// • Identify knowledge-only topology
// • Identify semantic mismatches
//
// This module performs comparison only.
//
// No React.
// No runtime access.
// No Corpus access.
// No mutation.
// No logging.
// No persistence.
// No networking.
// No AI.
//
// ============================================================

import type {
  GraphEdge,
  GraphNode,
  InvestigationGraph,
} from "../../manifold/graphTypes";

// ============================================================
// NODE DIFFERENCE
// ============================================================

export interface NodeDifference {

  id: string;

  legacy?: GraphNode;

  knowledge?: GraphNode;

  typeMismatch: boolean;

  labelMismatch: boolean;

}

// ============================================================
// EDGE DIFFERENCE
// ============================================================

export interface EdgeDifference {

  id: string;

  legacy?: GraphEdge;

  knowledge?: GraphEdge;

  sourceMismatch: boolean;

  targetMismatch: boolean;

  relationshipMismatch: boolean;

  weightMismatch: boolean;

}

// ============================================================
// COMPARISON SUMMARY
// ============================================================

export interface TopologyComparisonSummary {

  equivalent: boolean;

  legacyNodeCount: number;

  knowledgeNodeCount: number;

  sharedNodeCount: number;

  legacyOnlyNodeCount: number;

  knowledgeOnlyNodeCount: number;

  nodeSemanticDifferenceCount: number;

  legacyEdgeCount: number;

  knowledgeEdgeCount: number;

  sharedEdgeCount: number;

  legacyOnlyEdgeCount: number;

  knowledgeOnlyEdgeCount: number;

  edgeSemanticDifferenceCount: number;

}

// ============================================================
// COMPARISON RESULT
// ============================================================

export interface TopologyComparison {

  summary:
    TopologyComparisonSummary;

  sharedNodeIds:
    string[];

  legacyOnlyNodes:
    GraphNode[];

  knowledgeOnlyNodes:
    GraphNode[];

  nodeDifferences:
    NodeDifference[];

  sharedEdgeIds:
    string[];

  legacyOnlyEdges:
    GraphEdge[];

  knowledgeOnlyEdges:
    GraphEdge[];

  edgeDifferences:
    EdgeDifference[];

}

// ============================================================
// HELPERS
// ============================================================

function compareStrings(
  left: string,
  right: string,
): boolean {

  return left !== right;

}

function compareNumbers(
  left: number,
  right: number,
): boolean {

  return left !== right;

}

function sortStrings(
  values: string[],
): string[] {

  return [
    ...values,
  ].sort(
    (
      left,
      right,
    ) =>
      left.localeCompare(
        right,
      ),
  );

}

function sortNodes(
  nodes: GraphNode[],
): GraphNode[] {

  return [
    ...nodes,
  ].sort(
    (
      left,
      right,
    ) =>
      left.id.localeCompare(
        right.id,
      ),
  );

}

function sortEdges(
  edges: GraphEdge[],
): GraphEdge[] {

  return [
    ...edges,
  ].sort(
    (
      left,
      right,
    ) =>
      left.id.localeCompare(
        right.id,
      ),
  );

}

// ============================================================
// NODE INDEX
// ============================================================

function indexNodes(
  nodes: GraphNode[],
): Map<string, GraphNode> {

  const index =
    new Map<
      string,
      GraphNode
    >();

  for (
    const node of nodes
  ) {

    index.set(
      node.id,
      node,
    );

  }

  return index;

}

// ============================================================
// EDGE INDEX
// ============================================================

function indexEdges(
  edges: GraphEdge[],
): Map<string, GraphEdge> {

  const index =
    new Map<
      string,
      GraphEdge
    >();

  for (
    const edge of edges
  ) {

    index.set(
      edge.id,
      edge,
    );

  }

  return index;

}

// ============================================================
// NODE COMPARISON
// ============================================================

function compareNodes(
  legacyNodes: GraphNode[],
  knowledgeNodes: GraphNode[],
) {

  const legacyIndex =
    indexNodes(
      legacyNodes,
    );

  const knowledgeIndex =
    indexNodes(
      knowledgeNodes,
    );

  const sharedNodeIds:
    string[] = [];

  const legacyOnlyNodes:
    GraphNode[] = [];

  const knowledgeOnlyNodes:
    GraphNode[] = [];

  const nodeDifferences:
    NodeDifference[] = [];

  for (
    const [
      id,
      legacyNode,
    ] of legacyIndex
  ) {

    const knowledgeNode =
      knowledgeIndex.get(
        id,
      );

    if (
      !knowledgeNode
    ) {

      legacyOnlyNodes.push(
        legacyNode,
      );

      continue;

    }

    sharedNodeIds.push(
      id,
    );

    const typeMismatch =
      compareStrings(
        legacyNode.type,
        knowledgeNode.type,
      );

    const labelMismatch =
      compareStrings(
        legacyNode.label,
        knowledgeNode.label,
      );

    if (
      typeMismatch ||
      labelMismatch
    ) {

      nodeDifferences.push({
        id,

        legacy:
          legacyNode,

        knowledge:
          knowledgeNode,

        typeMismatch,

        labelMismatch,
      });

    }

  }

  for (
    const [
      id,
      knowledgeNode,
    ] of knowledgeIndex
  ) {

    if (
      !legacyIndex.has(
        id,
      )
    ) {

      knowledgeOnlyNodes.push(
        knowledgeNode,
      );

    }

  }

  return {

    sharedNodeIds:
      sortStrings(
        sharedNodeIds,
      ),

    legacyOnlyNodes:
      sortNodes(
        legacyOnlyNodes,
      ),

    knowledgeOnlyNodes:
      sortNodes(
        knowledgeOnlyNodes,
      ),

    nodeDifferences:
      [
        ...nodeDifferences,
      ].sort(
        (
          left,
          right,
        ) =>
          left.id.localeCompare(
            right.id,
          ),
      ),

  };

}

// ============================================================
// EDGE COMPARISON
// ============================================================

function compareEdges(
  legacyEdges: GraphEdge[],
  knowledgeEdges: GraphEdge[],
) {

  const legacyIndex =
    indexEdges(
      legacyEdges,
    );

  const knowledgeIndex =
    indexEdges(
      knowledgeEdges,
    );

  const sharedEdgeIds:
    string[] = [];

  const legacyOnlyEdges:
    GraphEdge[] = [];

  const knowledgeOnlyEdges:
    GraphEdge[] = [];

  const edgeDifferences:
    EdgeDifference[] = [];

  for (
    const [
      id,
      legacyEdge,
    ] of legacyIndex
  ) {

    const knowledgeEdge =
      knowledgeIndex.get(
        id,
      );

    if (
      !knowledgeEdge
    ) {

      legacyOnlyEdges.push(
        legacyEdge,
      );

      continue;

    }

    sharedEdgeIds.push(
      id,
    );

    const sourceMismatch =
      compareStrings(
        legacyEdge.source,
        knowledgeEdge.source,
      );

    const targetMismatch =
      compareStrings(
        legacyEdge.target,
        knowledgeEdge.target,
      );

    const relationshipMismatch =
      compareStrings(
        legacyEdge.relationship,
        knowledgeEdge.relationship,
      );

    const weightMismatch =
      compareNumbers(
        legacyEdge.weight,
        knowledgeEdge.weight,
      );

    if (
      sourceMismatch ||
      targetMismatch ||
      relationshipMismatch ||
      weightMismatch
    ) {

      edgeDifferences.push({
        id,

        legacy:
          legacyEdge,

        knowledge:
          knowledgeEdge,

        sourceMismatch,

        targetMismatch,

        relationshipMismatch,

        weightMismatch,
      });

    }

  }

  for (
    const [
      id,
      knowledgeEdge,
    ] of knowledgeIndex
  ) {

    if (
      !legacyIndex.has(
        id,
      )
    ) {

      knowledgeOnlyEdges.push(
        knowledgeEdge,
      );

    }

  }

  return {

    sharedEdgeIds:
      sortStrings(
        sharedEdgeIds,
      ),

    legacyOnlyEdges:
      sortEdges(
        legacyOnlyEdges,
      ),

    knowledgeOnlyEdges:
      sortEdges(
        knowledgeOnlyEdges,
      ),

    edgeDifferences:
      [
        ...edgeDifferences,
      ].sort(
        (
          left,
          right,
        ) =>
          left.id.localeCompare(
            right.id,
          ),
      ),

  };

}

// ============================================================
// PUBLIC COMPARATOR
// ============================================================

export function compareInvestigationGraphs(
  legacyGraph: InvestigationGraph,
  knowledgeGraph: InvestigationGraph,
): TopologyComparison {

  const nodeComparison =
    compareNodes(
      legacyGraph.nodes,
      knowledgeGraph.nodes,
    );

  const edgeComparison =
    compareEdges(
      legacyGraph.edges,
      knowledgeGraph.edges,
    );

  const equivalent =
    nodeComparison
      .legacyOnlyNodes
      .length === 0 &&

    nodeComparison
      .knowledgeOnlyNodes
      .length === 0 &&

    nodeComparison
      .nodeDifferences
      .length === 0 &&

    edgeComparison
      .legacyOnlyEdges
      .length === 0 &&

    edgeComparison
      .knowledgeOnlyEdges
      .length === 0 &&

    edgeComparison
      .edgeDifferences
      .length === 0;

  const summary:
    TopologyComparisonSummary = {

      equivalent,

      legacyNodeCount:
        legacyGraph.nodes.length,

      knowledgeNodeCount:
        knowledgeGraph.nodes.length,

      sharedNodeCount:
        nodeComparison
          .sharedNodeIds
          .length,

      legacyOnlyNodeCount:
        nodeComparison
          .legacyOnlyNodes
          .length,

      knowledgeOnlyNodeCount:
        nodeComparison
          .knowledgeOnlyNodes
          .length,

      nodeSemanticDifferenceCount:
        nodeComparison
          .nodeDifferences
          .length,

      legacyEdgeCount:
        legacyGraph.edges.length,

      knowledgeEdgeCount:
        knowledgeGraph.edges.length,

      sharedEdgeCount:
        edgeComparison
          .sharedEdgeIds
          .length,

      legacyOnlyEdgeCount:
        edgeComparison
          .legacyOnlyEdges
          .length,

      knowledgeOnlyEdgeCount:
        edgeComparison
          .knowledgeOnlyEdges
          .length,

      edgeSemanticDifferenceCount:
        edgeComparison
          .edgeDifferences
          .length,

    };

  return {

    summary,

    sharedNodeIds:
      nodeComparison
        .sharedNodeIds,

    legacyOnlyNodes:
      nodeComparison
        .legacyOnlyNodes,

    knowledgeOnlyNodes:
      nodeComparison
        .knowledgeOnlyNodes,

    nodeDifferences:
      nodeComparison
        .nodeDifferences,

    sharedEdgeIds:
      edgeComparison
        .sharedEdgeIds,

    legacyOnlyEdges:
      edgeComparison
        .legacyOnlyEdges,

    knowledgeOnlyEdges:
      edgeComparison
        .knowledgeOnlyEdges,

    edgeDifferences:
      edgeComparison
        .edgeDifferences,

  };

}

// ============================================================
// END
// ============================================================