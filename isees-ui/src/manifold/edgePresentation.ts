// ============================================================
// edgePresentation.ts
// P57-UI-A9-I3
// DETERMINISTIC EDGE PRESENTATION CONTRACT
//
// Canonical visual identity for Investigation Graph relationships.
//
// Owns:
// - Relationship color
// - Directional presentation policy
//
// Does not own:
// - Graph topology
// - Relationship computation
// - Selection
// - Interaction
// ============================================================

import type {
  GraphRelationshipType,
} from "./graphTypes";

export interface EdgePresentation {
  color: string;
  directed: boolean;
}

const EDGE_PRESENTATION: Readonly<
  Record<
    GraphRelationshipType,
    EdgePresentation
  >
> = {
  SIMILARITY: {
    color: "#38bdf8",
    directed: false,
  },
  OBSERVED_AT: {
    color: "#60a5fa",
    directed: true,
  },
  ASSOCIATED_WITH: {
    color: "#64748b",
    directed: false,
  },
  LOCATED_AT: {
    color: "#f97316",
    directed: true,
  },
  SUPPORTS: {
    color: "#22c55e",
    directed: true,
  },
  CONTRADICTS: {
    color: "#ef4444",
    directed: true,
  },
  DERIVED_FROM: {
    color: "#a78bfa",
    directed: true,
  },
  REFERENCES: {
    color: "#eab308",
    directed: true,
  },
  INVESTIGATES: {
    color: "#14b8a6",
    directed: true,
  },
};

export const SELECTED_EDGE_COLOR =
  "#f59e0b";

export function getEdgePresentation(
  relationship: GraphRelationshipType
): EdgePresentation {

  return EDGE_PRESENTATION[
    relationship
  ];

}