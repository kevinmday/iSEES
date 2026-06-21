// ============================================================
// src/investigationGraph/GraphDiagnostics.tsx
// P25.0
// INVESTIGATION GRAPH DIAGNOSTICS
// CORPUS -> RESOLUTION -> GRAPH
// ============================================================

import { useMemo } from "react";

import { useCorpus } from "../corpus/context/CorpusContext";

import {
  buildInvestigationGraph,
  getGraphStats,
} from "./buildGraph";

// ============================================================
// COMPONENT
// ============================================================

export function GraphDiagnostics() {
  const { corpus } = useCorpus();

  const graph = useMemo(
    () => buildInvestigationGraph(corpus),
    [corpus],
  );

  const stats = useMemo(
    () => getGraphStats(graph),
    [graph],
  );

  return (
    <div
      style={{
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div>
        <h3
  style={{
    margin: 0,
  }}
>
  Investigation Graph
</h3>

        <div
          style={{
            fontSize: "12px",
            opacity: 0.7,
            marginTop: "4px",
          }}
        >
          Cross-Event Relationship Topology
        </div>
      </div>

      {/* ================================================== */}
      {/* STATS */}
      {/* ================================================== */}

      <div
        style={{
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "6px",
          padding: "10px",
        }}
      >
        <div>
          <strong>Corpus Events:</strong> {corpus.length}
        </div>

        <div>
          <strong>Nodes:</strong> {stats.node_count}
        </div>

        <div>
          <strong>Edges:</strong> {stats.edge_count}
        </div>
      </div>

      {/* ================================================== */}
      {/* NODE LIST */}
      {/* ================================================== */}

      <div
        style={{
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "6px",
          padding: "10px",
        }}
      >
        <strong>Nodes</strong>

        <div
          style={{
            marginTop: "8px",
            maxHeight: "180px",
            overflowY: "auto",
            fontSize: "12px",
          }}
        >
          {graph.nodes.map((node) => (
            <div
              key={node.id}
              style={{
                padding: "4px 0",
                borderBottom:
                  "1px solid rgba(255,255,255,0.05)",
              }}
            >
              [{node.type}] {node.label}
            </div>
          ))}
        </div>
      </div>

      {/* ================================================== */}
      {/* EDGE LIST */}
      {/* ================================================== */}

      <div
        style={{
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "6px",
          padding: "10px",
        }}
      >
        <strong>Edges</strong>

        <div
          style={{
            marginTop: "8px",
            maxHeight: "180px",
            overflowY: "auto",
            fontSize: "12px",
          }}
        >
          {graph.edges.map((edge) => (
            <div
              key={edge.id}
              style={{
                padding: "4px 0",
                borderBottom:
                  "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {edge.source}
              {" → "}
              {edge.target}
              {" | "}
              {edge.relationship_type}
              {" | "}
              {(edge.confidence * 100).toFixed(1)}%
            </div>
          ))}
        </div>
      </div>

      {/* ================================================== */}
      {/* RAW GRAPH */}
      {/* ================================================== */}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "6px",
          padding: "10px",
          overflow: "auto",
        }}
      >
        <strong>Graph JSON</strong>

        <pre
          style={{
            marginTop: "8px",
            fontSize: "11px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {JSON.stringify(graph, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default GraphDiagnostics;