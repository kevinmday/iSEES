// ============================================================
// src/manifold/components/GraphEdges.tsx
// P41B
// GRAPH EDGES
//
// Owns
// • Edge presentation
// • Edge rendering
// • Edge click handling
//
// Does NOT own
// • Graph computation
// • Runtime
// • Selection state ownership
// • Viewport
//
// NOTE
// Behavior matches the existing InvestigationGraph edge
// rendering so the extraction can occur without changing
// functionality.
// ============================================================

import type {
  GraphEdge,
  GraphNode,
} from "../graphTypes";

import type {
  WorkspaceSelection,
} from "../../workspace/runtime/WorkspaceRuntimeTypes";

import {
  getEdgePresentation,
  SELECTED_EDGE_COLOR,
} from "../edgePresentation";

// ============================================================
// TYPES
// ============================================================

export interface GraphEdgesProps {

  nodes:
    GraphNode[];

  edges:
    GraphEdge[];

  selection:
    WorkspaceSelection;

  setSelection: (
    selection: WorkspaceSelection
  ) => void;


  onCollectEdge?: (
    edge: GraphEdge
  ) => void;
}

// ============================================================
// COMPONENT
// ============================================================

export default function GraphEdges({

  nodes,
  edges,
  selection,
  setSelection,

onCollectEdge,
}: GraphEdgesProps) {

  return (

    <>

      {edges.map(
        (
          edge,
          edgeIndex,
        ) => {

          const source =
            nodes.find(
              node =>
                node.id ===
                edge.source
            );

          const target =
            nodes.find(
              node =>
                node.id ===
                edge.target
            );

          if (
            !source ||
            !target
          ) {

            return null;

          }

          const selected =
            selection.kind ===
              "EDGE" &&
            selection.edgeId ===
              edge.id;

          const presentation =
            getEdgePresentation(
              edge.relationship
            );

          const strokeColor =
            selected
              ? SELECTED_EDGE_COLOR
              : presentation.color;

          const arrowMarkerId =
            `edge-arrow-${edgeIndex}`;

          return (

            <g
              key={edge.id}
              role="button"
              tabIndex={0}
              aria-label={
                `EDGE connecting ${source.label} to ${target.label}. Single-click to inspect. Double-click to add to Research Inbox.`
              }
            >
              <title>
                {
                  `EDGE — ${source.label} to ${target.label}
A canonical relationship connecting two nodes.
Single-click: inspect in Selection Intelligence.
Double-click: add to Research Inbox.`
                }
              </title>

              {presentation.directed && (
                <defs>
                  <marker
                    id={arrowMarkerId}
                    viewBox="0 0 8 8"
                    markerWidth={
                      selected
                        ? 9
                        : 7
                    }
                    markerHeight={
                      selected
                        ? 9
                        : 7
                    }
                    refX="7"
                    refY="4"
                    orient="auto"
                    markerUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 0 0 L 8 4 L 0 8 z"
                      fill={strokeColor}
                    />
                  </marker>
                </defs>
              )}

              <line
              x1={source.x ?? 0}
              y1={source.y ?? 0}
              x2={target.x ?? 0}
              y2={target.y ?? 0}
              stroke={strokeColor}
              strokeWidth={
                selected
                  ? 4
                  : Math.max(
                      1,
                      edge.weight * 5
                    )
              }
              opacity={
                selected
                  ? 1
                  : 0.75
              }
              markerEnd={
                presentation.directed
                  ? `url(#${arrowMarkerId})`
                  : undefined
              }
              onClick={() =>
                setSelection({

                  kind: "EDGE",

                  edgeId:
                    edge.id,

                })
              }
              onDoubleClick={() =>
                onCollectEdge?.(
                  edge
                )
              }

              style={{
                cursor: "pointer",
              }}
              />

            </g>

          );

        }
      )}

    </>

  );

}