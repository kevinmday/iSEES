// ============================================================
// src/manifold/iconology/iconRegistry.ts
// P25.5B ICONOLOGY FOUNDATION
// GRAPH ENTITY ICON REGISTRY
// FULL DROP-IN FILE
// ============================================================

import type {
  GraphNodeType,
} from "../graphTypes";

// ============================================================
// ICON DEFINITION
// ============================================================

export interface GraphIconDefinition {

  type:
    GraphNodeType;

  icon:
    string;

  color:
    string;

  size:
    number;
}

// ============================================================
// ICON REGISTRY
// ============================================================

export const GRAPH_ICON_REGISTRY:
Record<
  GraphNodeType,
  GraphIconDefinition
> = {

  EVENT: {

    type: "EVENT",

    icon: "🛸",

    color: "#60a5fa",

    size: 20,
  },

  FACILITY: {

    type: "FACILITY",

    icon: "🏢",

    color: "#94a3b8",

    size: 18,
  },

  ARTIFACT: {

    type: "ARTIFACT",

    icon: "📄",

    color: "#facc15",

    size: 18,
  },

  PERSON: {

    type: "PERSON",

    icon: "👤",

    color: "#22c55e",

    size: 18,
  },

  ORGANIZATION: {

    type: "ORGANIZATION",

    icon: "🏛",

    color: "#6366f1",

    size: 18,
  },

  LOCATION: {

    type: "LOCATION",

    icon: "📍",

    color: "#f97316",

    size: 18,
  },

  NARRATIVE: {

    type: "NARRATIVE",

    icon: "🧭",

    color: "#ec4899",

    size: 18,
  },

  HYPOTHESIS: {

    type: "HYPOTHESIS",

    icon: "💡",

    color: "#8b5cf6",

    size: 18,
  },
};

// ============================================================
// LOOKUP
// ============================================================

export function getGraphIcon(
  type: GraphNodeType,
): GraphIconDefinition {

  return GRAPH_ICON_REGISTRY[type];
}