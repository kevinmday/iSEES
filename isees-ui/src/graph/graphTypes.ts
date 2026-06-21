// ============================================================
// src/graph/graphTypes.ts
// P25.0 INVESTIGATION GRAPH FOUNDATION
// CORPUS → GRAPH TYPE CONTRACTS
// FULL DROP-IN REPLACEMENT
// ============================================================

export interface GraphNode {
id: string;
label: string;
sourceType: string;
confidence?: number;
metadata?: Record<string, unknown>;
}

export interface GraphEdge {
id: string;
source: string;
target: string;
weight: number;

relationshipType:
| "SIMILARITY"
| "NARRATIVE"
| "OBSERVABILITY"
| "INFRASTRUCTURE"
| "TOPOLOGY"
| "GEO";

metadata?: {
confidence: number;
narrative: number;
observability: number;
infrastructure: number;
topology: number;
geo: number;
rationale: string[];
};
}

export interface InvestigationGraph {
nodes: GraphNode[];
edges: GraphEdge[];
}

export interface GraphStatistics {
nodeCount: number;
edgeCount: number;
averageEdgeWeight: number;
strongestEdgeWeight: number;
weakestEdgeWeight: number;
}
