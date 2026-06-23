// ============================================================
// src/manifold/graphTypes.ts
// P25.2A TOPOLOGY FOUNDATION
// DETERMINISTIC GRAPH CONTRACTS
// FULL DROP-IN FILE
// ============================================================

// ============================================================
// NODE TYPES
// ============================================================

export type GraphNodeType =
  | "EVENT"
  | "FACILITY"
  | "ARTIFACT"
  | "PERSON"
  | "ORGANIZATION"
  | "LOCATION"
  | "NARRATIVE"
  | "HYPOTHESIS";

// ============================================================
// EDGE TYPES
// ============================================================

export type GraphRelationshipType =
  | "SIMILARITY"
  | "OBSERVED_AT"
  | "ASSOCIATED_WITH"
  | "LOCATED_AT"
  | "SUPPORTS"
  | "CONTRADICTS"
  | "DERIVED_FROM"
  | "REFERENCES"
  | "INVESTIGATES";

// ============================================================
// GRAPH NODE
// ============================================================

export interface GraphNode {

  id: string;

  label: string;

  type: GraphNodeType;

  // ----------------------------------------------------------
  // P25.2A
  // DETERMINISTIC TOPOLOGY POSITION
  // Assigned by graphBuilder.ts
  // Consumed by InvestigationGraph.tsx
  // ----------------------------------------------------------

  x?: number;

  y?: number;

  metadata?: Record<
    string,
    unknown
  >;
}

// ============================================================
// EDGE METRICS
// ============================================================

export interface GraphEdgeMetrics {

  confidence?: number;

  narrative?: number;

  observability?: number;

  infrastructure?: number;

  topology?: number;

  geo?: number;
}

// ============================================================
// GRAPH EDGE
// ============================================================

export interface GraphEdge {

  id: string;

  source: string;

  target: string;

  relationship:
    GraphRelationshipType;

  weight: number;

  metrics?:
    GraphEdgeMetrics;

  rationale:
    string[];
}

// ============================================================
// GRAPH SELECTION
// SINGLE SOURCE OF TRUTH
// ============================================================

export type GraphSelection =

  | {

      kind: "NODE";

      nodeId: string;

      nodeType:
        GraphNodeType;
    }

  | {

      kind: "EDGE";

      edgeId: string;

      sourceId: string;

      targetId: string;
    };

// ============================================================
// GRAPH CLUSTER
// FUTURE MANIFOLD GROUPING
// ============================================================

export interface GraphCluster {

  id: string;

  label: string;

  nodeIds: string[];

  confidence?: number;
}

// ============================================================
// GRAPH STATISTICS
// ============================================================

export interface GraphStatistics {

  nodeCount: number;

  edgeCount: number;

  eventCount: number;

  artifactCount: number;
}

// ============================================================
// INVESTIGATION GRAPH
// ============================================================

export interface InvestigationGraph {

  nodes:
    GraphNode[];

  edges:
    GraphEdge[];

  statistics:
    GraphStatistics;

  clusters?:
    GraphCluster[];

  // ----------------------------------------------------------
  // GRAPH OWNERSHIP MODEL
  // P25 FOUNDATION
  // ----------------------------------------------------------

  centerNodeId?:
    string;

  selectedNodeId?:
    string;

  selectedEdgeId?:
    string;

  selectedClusterId?:
    string;
}