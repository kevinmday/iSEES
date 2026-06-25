// ============================================================
// src/manifold/iconology/iconRegistry.ts
// P25.5B ICONOLOGY FOUNDATION
// GRAPH ENTITY ICON REGISTRY
// FULL DROP-IN FILE
// ============================================================

import type {
  GraphNodeType,
  GraphIconType,
} from "../graphTypes";

// ============================================================
// ICON DEFINITION
// ============================================================

export interface GraphIconDefinition {

  type:
    GraphIconType;

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
  GraphIconType,
  GraphIconDefinition
> = {


  UAP: {

  type: "UAP",

    icon: "🛸",

    color: "#60a5fa",

    size: 20,
  },

BUILDING: {

  type: "BUILDING",

  icon: "🏢",

  color: "#94a3b8",

  size: 18,
},

DOCUMENT: {

  type: "DOCUMENT",

  icon: "📄",

  color: "#facc15",

  size: 18,
},


SHIP: {

  type: "SHIP",

  icon: "🚢",

  color: "#94a3b8",

  size: 18,
},

AIRCRAFT: {

  type: "AIRCRAFT",

  icon: "✈️",

  color: "#60a5fa",

  size: 18,
},

RADAR: {

  type: "RADAR",

  icon: "📡",

  color: "#22c55e",

  size: 18,
},

SENSOR: {

  type: "SENSOR",

  icon: "📶",

  color: "#22c55e",

  size: 18,
},

PHOTO: {

  type: "PHOTO",

  icon: "📷",

  color: "#facc15",

  size: 18,
},

VIDEO: {

  type: "VIDEO",

  icon: "🎥",

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
  type: GraphNodeType | GraphIconType,
): GraphIconDefinition {

  switch (type) {

    case "EVENT":
      return GRAPH_ICON_REGISTRY.UAP;

    case "FACILITY":
      return GRAPH_ICON_REGISTRY.BUILDING;

    case "ARTIFACT":
      return GRAPH_ICON_REGISTRY.DOCUMENT;

    default:
      return GRAPH_ICON_REGISTRY[
        type as GraphIconType
      ];

  }

}