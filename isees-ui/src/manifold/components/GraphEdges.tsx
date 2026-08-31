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
        edge => {

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

              <line
              x1={source.x ?? 0}
              y1={source.y ?? 0}
              x2={target.x ?? 0}
              y2={target.y ?? 0}
              stroke={
                selected
                  ? "#f59e0b"
                  : "#334155"
              }
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