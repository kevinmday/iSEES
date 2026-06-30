// ============================================================
// src/manifold/engine/manifoldEngine.ts
// P29 MANIFOLD ENGINE FOUNDATION
// DETERMINISTIC MANIFOLD ENGINE
// FULL DROP-IN FILE
// ============================================================

import type {
  GraphEdge,
  GraphNode,
} from "../graphTypes";

import type {
  BuildManifoldRequest,
  BuildManifoldResult,
  ManifoldTopology,
  ResolvedSelection,
} from "./manifoldTypes";

import {
  resolveInvestigationContext,
} from "./manifoldContextResolver";

// ============================================================
// BUILD MANIFOLD
// ============================================================

export function buildManifold(
  request: BuildManifoldRequest,
): BuildManifoldResult {

  const {

    graph,

    activeLayers,

    selection,

    centerNodeId,

  } = request;

  // ==========================================================
  // RESOLVE CURRENT SELECTION
  // ==========================================================

  const resolvedSelection =
    resolveSelection(
      graph.nodes,
      graph.edges,
      selection,
    );

  // ==========================================================
  // COMPUTE TOPOLOGY
  // ==========================================================

  const topology =
    computeTopology(
      graph.nodes,
      graph.edges,
    );

  // ==========================================================
  // BUILD INVESTIGATION CONTEXT
  // ==========================================================

  const investigationContext =
    resolveInvestigationContext(
      graph,
      selection,
    );

  // ==========================================================
  // RESULT
  // ==========================================================

  return {

    manifold: {

      state: {

        graph,

        activeLayers,

        selection,

        centerNodeId,

      },

      topology,

      investigationContext,

    },

    resolvedSelection,

  };
}

// ============================================================
// RESOLVE SELECTION
// ============================================================

function resolveSelection(

  nodes: GraphNode[],

  edges: GraphEdge[],

  selection: BuildManifoldRequest["selection"],

): ResolvedSelection {

  // ----------------------------------------------------------
  // NONE
  // ----------------------------------------------------------

  if (

    selection.kind === "NONE"

  ) {

    return {

      connectedNodes: [],

      connectedEdges: [],

    };

  }

  // ----------------------------------------------------------
  // NODE
  // ----------------------------------------------------------

  if (

    selection.kind === "NODE"

  ) {

    const node =

      nodes.find(

        n =>

          n.id ===

          selection.nodeId

      );

    const connectedEdges =

      edges.filter(

        edge =>

          edge.source === node?.id ||

          edge.target === node?.id

      );

    const connectedIds =

      new Set<string>();

    connectedEdges.forEach(

      edge => {

        connectedIds.add(

          edge.source

        );

        connectedIds.add(

          edge.target

        );

      }

    );

    const connectedNodes =

      nodes.filter(

        node =>

          connectedIds.has(

            node.id

          )

      );

    return {

      selectedNode: node,

      connectedNodes,

      connectedEdges,

    };

  }

  // ----------------------------------------------------------
  // CLUSTER
  // ----------------------------------------------------------

  if (

    selection.kind === "CLUSTER"

  ) {

    return {

      connectedNodes: [],

      connectedEdges: [],

    };

  }

  // ----------------------------------------------------------
  // EDGE
  // ----------------------------------------------------------

  const edge =

    edges.find(

      e =>

        e.id ===

        selection.edgeId

    );

  if (

    !edge

  ) {

    return {

      connectedNodes: [],

      connectedEdges: [],

    };

  }

  const connectedNodes =

    nodes.filter(

      node =>

        node.id === edge.source ||

        node.id === edge.target

    );

  return {

    selectedEdge: edge,

    connectedNodes,

    connectedEdges: [

      edge,

    ],

  };
}

// ============================================================
// COMPUTE TOPOLOGY
// ============================================================

function computeTopology(

  nodes: GraphNode[],

  edges: GraphEdge[],

): ManifoldTopology {

  const eventCount =

    nodes.filter(

      n =>

        n.type === "EVENT"

    ).length;

  const artifactCount =

    nodes.filter(

      n =>

        n.type === "ARTIFACT"

    ).length;

  return {

    nodeCount:

      nodes.length,

    edgeCount:

      edges.length,

    eventCount,

    artifactCount,

    // --------------------------------------------------------
    // PLACEHOLDERS
    // (Future deterministic topology metrics)
    // --------------------------------------------------------

    clusterCount: 0,

    contradictionDensity: 0,

    residualInstability: 0,

    entanglementScore: 0,

  };
}