// ============================================================
// src/graph/GraphSurface.tsx
// P25.2 GRAPH SURFACE
// CORPUS TOPOLOGY BROWSER
// FULL DROP-IN FILE
// ============================================================

import { useCorpus } from "../corpus/context/CorpusContext";

import {
  buildInvestigationGraph,
} from "./corpusGraphAdapter";

// ============================================================
// COMPONENT
// ============================================================

export default function GraphSurface() {

  const {
    corpus,
  } = useCorpus();

  const graph =
    buildInvestigationGraph(
      corpus
    );

  return (

    <div
      style={{
        background: "#08101f",
        border: "1px solid #172033",
        borderRadius: 10,
        padding: 16,
      }}
    >

      <div
        style={{
          fontSize: 11,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: 1.5,
          marginBottom: 16,
        }}
      >
        Investigation Graph
      </div>

      {graph.nodes.map(
        (node) => {

          const relationships =
            graph.edges.filter(
              (edge) =>
                edge.source === node.id ||
                edge.target === node.id
            );

          return (

            <div
              key={node.id}
              style={{
                background: "#0d1728",
                border:
                  "1px solid #172033",
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
              }}
            >

              {/* NODE */}

              <div
                style={{
                  color: "#e5e7eb",
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                {node.label}
              </div>

              {/* RELATIONSHIPS */}

              {relationships.length === 0 ? (

                <div
                  style={{
                    color: "#6b7280",
                    fontSize: 12,
                  }}
                >
                  No relationships
                </div>

              ) : (

                relationships.map(
                  (edge) => {

                    const otherNodeId =
                      edge.source ===
                      node.id
                        ? edge.target
                        : edge.source;

                    const otherNode =
                      graph.nodes.find(
                        (candidate) =>
                          candidate.id ===
                          otherNodeId
                      );

                    return (

                      <div
                        key={edge.id}
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          padding:
                            "4px 0",
                          fontSize: 12,
                        }}
                      >

                        <div
                          style={{
                            color:
                              "#cbd5e1",
                          }}
                        >
                          ↔{" "}
                          {
                            otherNode?.label ??
                            otherNodeId
                          }
                        </div>

                        <div
                          style={{
                            color:
                              "#38bdf8",
                            fontWeight: 600,
                          }}
                        >
                          {(
                            edge.weight *
                            100
                          ).toFixed(1)}
                          %
                        </div>

                      </div>

                    );
                  }
                )

              )}

            </div>

          );
        }
      )}

    </div>

  );
}

