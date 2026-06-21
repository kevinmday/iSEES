// ============================================================
// src/graph/graphInteractionTypes.ts
// P26.0 INTERACTIVE TOPOLOGY FOUNDATION
// GRAPH INTERACTION CONTRACTS
// FULL DROP-IN FILE
// ============================================================

export interface GraphNodeSelection {

  nodeId: string;

  selectedAt: string;
}

export interface GraphEdgeSelection {

  edgeId: string;

  sourceId: string;

  targetId: string;

  selectedAt: string;
}

export interface GraphFocusState {

  centerNodeId: string | null;

  selectedNodeId: string | null;

  selectedEdgeId: string | null;
}

export interface GraphNodeIntelligence {

  nodeId: string;

  title: string;

  sourceType: string;

  confidence?: number;

  connectionCount: number;

  metadata?: Record<string, unknown>;
}

export interface GraphEdgeIntelligence {

  edgeId: string;

  sourceId: string;

  targetId: string;

  confidence: number;

  narrative: number;

  observability: number;

  infrastructure: number;

  topology: number;

  geo: number;

  rationale: string[];
}

export interface GraphInteractionState {

  focus: GraphFocusState;

  selectedNode?: GraphNodeIntelligence;

  selectedEdge?: GraphEdgeIntelligence;
}