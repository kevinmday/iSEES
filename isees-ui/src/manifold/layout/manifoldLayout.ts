// ============================================================
// src/manifold/layout/manifoldLayout.ts
// P45A-C2
// MANIFOLD LAYOUT ENGINE
//
// Deterministic spatial layout for Investigation Graphs.
//
// Owns:
// • Node positioning
// • Focus-centered topology geometry
// • Deterministic layout strategies
//
// Does NOT own:
// • Graph construction
// • Graph semantics
// • Selection
// • Viewport
// • Projection
// • Rendering
//
// ============================================================

import type {
  GraphNode,
} from "../graphTypes";

// ============================================================
// TYPES
// ============================================================

export interface ManifoldLayoutOptions {

  centerNodeId?:
    string;

  orbitRadius?:
    number;

}

// ============================================================
// CIRCULAR LAYOUT
// ============================================================
//
// P45A-C2.1
//
// This initially preserves the existing deterministic circular
// layout behavior extracted from graphBuilder.ts.
//
// Future layout strategies may include:
//
// • Relationship-aware
// • Hierarchical
// • Timeline
// • Geographic
// • Constellation
// • Force-directed deterministic projection
//
// ============================================================

export function applyCircularManifoldLayout(
  nodes: GraphNode[],
  options: ManifoldLayoutOptions = {},
): GraphNode[] {

  const {
    centerNodeId,
    orbitRadius = 180,
  } = options;

  // ----------------------------------------------------------
  // COPY
  // ----------------------------------------------------------
  //
  // Layout operates on projected node copies rather than
  // mutating the canonical graph nodes supplied by the graph
  // builder.
  //
  // ----------------------------------------------------------

  const positionedNodes =
    nodes.map(
      node => ({
        ...node,
      })
    );

  // ==========================================================
  // CENTER NODE
  // ==========================================================

  const centerNode =
    centerNodeId
      ? positionedNodes.find(
          node =>
            node.id ===
            centerNodeId
        )
      : undefined;

  if (centerNode) {

    centerNode.x = 0;
    centerNode.y = 0;

  }

  // ==========================================================
  // ORBIT NODES
  // ==========================================================

  const orbitNodes =
    positionedNodes.filter(
      node =>
        node.id !==
        centerNodeId
    );

  orbitNodes.forEach(
    (
      node,
      index
    ) => {

      const angle =
        (
          index /
          Math.max(
            orbitNodes.length,
            1
          )
        ) *
        Math.PI *
        2;

      node.x =
        Math.cos(angle) *
        orbitRadius;

      node.y =
        Math.sin(angle) *
        orbitRadius;

    }
  );

  // ==========================================================
  // FALLBACK
  // NO CENTER NODE
  // ==========================================================

  if (!centerNodeId) {

    positionedNodes.forEach(
      (
        node,
        index
      ) => {

        const angle =
          (
            index /
            Math.max(
              positionedNodes.length,
              1
            )
          ) *
          Math.PI *
          2;

        node.x =
          Math.cos(angle) *
          orbitRadius;

        node.y =
          Math.sin(angle) *
          orbitRadius;

      }
    );

  }

  return positionedNodes;

}