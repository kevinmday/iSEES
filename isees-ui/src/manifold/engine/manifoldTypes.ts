// ============================================================
// src/manifold/engine/manifoldTypes.ts
// P29 MANIFOLD ENGINE FOUNDATION
// DETERMINISTIC MANIFOLD TYPE CONTRACTS
// FULL DROP-IN FILE
// ============================================================

import type {
  InvestigationGraph,
  GraphNode,
  GraphEdge,
  GraphSelection,
} from "../graphTypes";

import type {
  InvestigationContext,
} from "../context/GraphContext";

// ============================================================
// MANIFOLD LAYERS
// ============================================================

export const ManifoldLayer = {

  OBSERVABILITY: "OBSERVABILITY",

  NARRATIVE: "NARRATIVE",

  TEMPORAL: "TEMPORAL",

  GEOSPATIAL: "GEOSPATIAL",

  INFRASTRUCTURE: "INFRASTRUCTURE",

  TOPOLOGY: "TOPOLOGY",

  INTENTION: "INTENTION",

  BELIEF: "BELIEF",

  RELIGION: "RELIGION",

  MYTHOLOGY: "MYTHOLOGY",

  ASTROLOGY: "ASTROLOGY",

  CULTURAL: "CULTURAL",

  SYMBOLIC: "SYMBOLIC",

  PHENOMENOLOGY: "PHENOMENOLOGY",

} as const;

export type ManifoldLayer =
  (typeof ManifoldLayer)[
    keyof typeof ManifoldLayer
  ];

// ============================================================
// MANIFOLD STATE
// ============================================================

export type ManifoldState = {

  graph:
    InvestigationGraph;

  activeLayers:
    ManifoldLayer[];

  selection:
    GraphSelection;

  centerNodeId:
    string | null;
};

// ============================================================
// TOPOLOGY SUMMARY
// ============================================================

export type ManifoldTopology = {

  nodeCount:
    number;

  edgeCount:
    number;

  eventCount:
    number;

  artifactCount:
    number;

  clusterCount:
    number;

  contradictionDensity:
    number;

  residualInstability:
    number;

  entanglementScore:
    number;
};

// ============================================================
// RESOLVED MANIFOLD
// ============================================================

export type ResolvedManifold = {

  state:
    ManifoldState;

  topology:
    ManifoldTopology;

  investigationContext:
    InvestigationContext;
};

// ============================================================
// RESOLVED SELECTION
// ============================================================

export type ResolvedSelection = {

  selectedNode?:
    GraphNode;

  selectedEdge?:
    GraphEdge;

  connectedNodes:
    GraphNode[];

  connectedEdges:
    GraphEdge[];
};

// ============================================================
// ENGINE INPUT
// ============================================================

export type BuildManifoldRequest = {

  graph:
    InvestigationGraph;

  activeLayers:
    ManifoldLayer[];

  selection:
    GraphSelection;

  centerNodeId:
    string | null;
};

// ============================================================
// ENGINE OUTPUT
// ============================================================

export type BuildManifoldResult = {

  manifold:
    ResolvedManifold;

  resolvedSelection:
    ResolvedSelection;
};

// ============================================================
// FUTURE NOTES
// ============================================================
//
// The Manifold Engine intentionally sits ABOVE the graph.
//
// InvestigationGraph
//     becomes one visualization.
//
// Future projections:
//
// • 2D Investigation Graph
// • 3D Manifold
// • Timeline
// • Narrative Flow
// • Collapse Surface
// • Contradiction Surface
// • Heatmaps
// • Future AR/VR exploration
//
// All projections consume the same deterministic
// ResolvedManifold.
//
// ============================================================