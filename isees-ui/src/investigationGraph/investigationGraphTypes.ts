// ============================================================
// src/investigationGraph/investigationGraphTypes.ts
// P25.0
// INVESTIGATION GRAPH FOUNDATION
// DETERMINISTIC MANIFOLD GRAPH CONTRACTS
// ============================================================

export type InvestigationNodeType =
  | "EVENT"
  | "FACILITY"
  | "ARTIFACT"
  | "PERSON"
  | "LOCATION"
  | "HYPOTHESIS";

export interface InvestigationNode {
  id: string;

  type: InvestigationNodeType;

  label: string;

  confidence?: number;

  source_id?: string;

  metadata?: Record<string, unknown>;
}

export type InvestigationRelationshipType =
  | "NARRATIVE"
  | "OBSERVABILITY"
  | "INFRASTRUCTURE"
  | "TOPOLOGY"
  | "GEO";

export interface InvestigationEdge {
  id: string;

  source: string;
  target: string;

  relationship_type: InvestigationRelationshipType;

  confidence: number;

  rationale: string[];

  metadata?: Record<string, unknown>;
}

export interface InvestigationGraph {
  nodes: InvestigationNode[];
  edges: InvestigationEdge[];
}

// ============================================================
// GRAPH HELPERS
// ============================================================

export function createEmptyGraph(): InvestigationGraph {
  return {
    nodes: [],
    edges: [],
  };
}