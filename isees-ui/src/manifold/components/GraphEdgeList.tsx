// ============================================================
// src/manifold/components/GraphEdgeList.tsx
// P41B
// GRAPH EDGE LIST
//
// Owns
// • Edge list presentation
// • Edge selection
// • Edge summary cards
//
// Does NOT own
// • Graph computation
// • Runtime
// • SVG rendering
// • Viewport
//
// NOTE
// Initial extraction from InvestigationGraph.
// Behavior is intentionally unchanged.
// ============================================================

import type {
  GraphEdge,
  GraphSelection,
} from "../graphTypes";

// ============================================================
// TYPES
// ============================================================

export interface GraphEdgeListProps {

  edges:
    GraphEdge[];

  selection:
    GraphSelection;

  setSelection: (
    selection: GraphSelection
  ) => void;

}

// ============================================================
// COMPONENT
// ============================================================

export default function GraphEdgeList({

  edges,
  selection,
  setSelection,

}: GraphEdgeListProps) {

  return (

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >

      {edges.map(
        edge => {

          const selectedEdge =
            selection.kind ===
              "EDGE" &&
            selection.edgeId ===
              edge.id;

          return (

            <div
              key={edge.id}
              onClick={() =>
                setSelection({

                  kind: "EDGE",

                  edgeId:
                    edge.id,

                  sourceId:
                    edge.source,

                  targetId:
                    edge.target,

                })
              }
              style={{
                border:
                  selectedEdge
                    ? "1px solid #f59e0b"
                    : "1px solid #172033",

                borderRadius: 6,

                padding: 10,

                background:
                  selectedEdge
                    ? "#1f1300"
                    : "#050b16",

                cursor: "pointer",

                userSelect: "none",

                transition:
                  "all 0.15s ease",
              }}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                }}
              >

                <div
                  style={{
                    color:
                      selectedEdge
                        ? "#fbbf24"
                        : "#d1d5db",

                    fontWeight: 600,
                  }}
                >
                  {edge.source}
                  {" → "}
                  {edge.target}
                </div>

                <div
                  style={{
                    color:
                      selectedEdge
                        ? "#fbbf24"
                        : "#60a5fa",

                    fontWeight: 700,
                  }}
                >
                  {(
                    edge.weight *
                    100
                  ).toFixed(0)}
                  %
                </div>

              </div>

              <div
                style={{
                  marginTop: 6,

                  color:
                    selectedEdge
                      ? "#fde68a"
                      : "#9ca3af",

                  fontSize: 12,
                }}
              >
                {edge.relationship}
              </div>

            </div>

          );

        }
      )}

    </div>

  );

}