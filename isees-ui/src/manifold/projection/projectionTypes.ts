// ============================================================
// src/manifold/projection/projectionTypes.ts
// P31 PROJECTION ENGINE FOUNDATION
// PROJECTION TYPE CONTRACTS
//
// The Projection subsystem transforms a computed Investigation
// Manifold into a deterministic geometric representation suitable
// for visualization. Projection is intentionally independent of
// any renderer (SVG, Canvas, WebGL, Three.js, etc.).
//
// The renderer consumes ProjectionResult. It never computes
// topology or layout.
// ============================================================

import type {
  GraphEdge,
  GraphNode,
} from "../graphTypes";

// ============================================================
// PROJECTION TYPES
// ============================================================

export const ProjectionType = {
  PLANAR_2D: "PLANAR_2D",

  FORCE: "FORCE",

  CIRCULAR: "CIRCULAR",

  HIERARCHICAL: "HIERARCHICAL",

  TIMELINE: "TIMELINE",

  GEOGRAPHIC: "GEOGRAPHIC",

  CONSTELLATION: "CONSTELLATION",

  HYPERBOLIC: "HYPERBOLIC",

  SPATIAL_3D: "SPATIAL_3D",
} as const;

export type ProjectionType =
  (typeof ProjectionType)[keyof typeof ProjectionType];

// ============================================================
// VIEWPORT
// ============================================================

export interface ProjectionViewport {
  centerX: number;

  centerY: number;

  zoom: number;

  rotation: number;

  width: number;

  height: number;
}

// ============================================================
// BOUNDS
// ============================================================

export interface ProjectionBounds {
  minX: number;

  maxX: number;

  minY: number;

  maxY: number;
}

// ============================================================
// PROJECTED NODE
// ============================================================

export interface ProjectedNode extends GraphNode {
  x: number;

  y: number;

  /**
   * Reserved for future spatial projections.
   * Always zero for PLANAR_2D.
   */
  z: number;

  visible: boolean;

  selected: boolean;

  focused: boolean;

  importance: number;
}

// ============================================================
// PROJECTED EDGE
// ============================================================

export interface ProjectedEdge extends GraphEdge {
  visible: boolean;
}

// ============================================================
// PROJECTION STATISTICS
// ============================================================

export interface ProjectionStatistics {
  nodeCount: number;

  edgeCount: number;

  averageEdgeLength: number;

  radius: number;
}

// ============================================================
// PROJECTION RESULT
// ============================================================

export interface ProjectionResult {
  projectionType: ProjectionType;

  viewport: ProjectionViewport;

  bounds: ProjectionBounds;

  centroid: {
    x: number;
    y: number;
  };

  statistics: ProjectionStatistics;

  nodes: ProjectedNode[];

  edges: ProjectedEdge[];
}