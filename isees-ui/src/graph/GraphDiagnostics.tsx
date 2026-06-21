// ============================================================
// src/graph/GraphDiagnostics.tsx
// P25.1 GRAPH DIAGNOSTICS
// CORPUS → GRAPH VALIDATION SURFACE
// FULL DROP-IN FILE
// ============================================================

import { useCorpus } from "../corpus/context/CorpusContext";

import {
  buildInvestigationGraph,
} from "./corpusGraphAdapter";

// ============================================================
// COMPONENT
// ============================================================

export default function GraphDiagnostics() {

  const {
    corpus,
  } = useCorpus();

  const graph =
    buildInvestigationGraph(
      corpus
    );

  const nodeCount =
    graph.nodes.length;

  const edgeCount =
    graph.edges.length;

  const strongestEdge =
    graph.edges.reduce(
      (best, current) =>
        current.weight >
        best.weight
          ? current
          : best,
      graph.edges[0]
    );

  const averageWeight =
    graph.edges.length > 0
      ? (
          graph.edges.reduce(
            (sum, edge) =>
              sum + edge.weight,
            0
          ) /
          graph.edges.length
        )
      : 0;

  const connectionCounts =
    new Map<string, number>();

  graph.edges.forEach(
    (edge) => {

      connectionCounts.set(
        edge.source,
        (
          connectionCounts.get(
            edge.source
          ) ?? 0
        ) + 1
      );

      connectionCounts.set(
        edge.target,
        (
          connectionCounts.get(
            edge.target
          ) ?? 0
        ) + 1
      );
    }
  );

  let mostConnectedNode =
    "N/A";

  let highestConnections =
    0;

  for (
    const [nodeId, count]
    of connectionCounts
  ) {

    if (
      count >
      highestConnections
    ) {

      highestConnections =
        count;

      mostConnectedNode =
        nodeId;
    }
  }

  return (

    <div
      style={{
        background: "#08101f",
        border:
          "1px solid #172033",
        borderRadius: 10,
        padding: 16,
      }}
    >

      <div
        style={{
          fontSize: 11,
          color: "#6b7280",
          textTransform:
            "uppercase",
          letterSpacing: 1.5,
          marginBottom: 16,
        }}
      >
        Graph Diagnostics
      </div>

      <Metric
        label="Nodes"
        value={nodeCount}
      />

      <Metric
        label="Edges"
        value={edgeCount}
      />

      <Metric
        label="Average Weight"
        value={
          (
            averageWeight * 100
          ).toFixed(1) + "%"
        }
      />

      <Metric
        label="Most Connected"
        value={
          mostConnectedNode
        }
      />

      {strongestEdge && (

        <Metric
          label="Strongest Edge"
          value={
            `${strongestEdge.source}
             ↔
             ${strongestEdge.target}
             (${(
               strongestEdge.weight *
               100
             ).toFixed(1)}%)`
          }
        />

      )}

    </div>

  );
}

// ============================================================
// METRIC
// ============================================================

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {

  return (

    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        padding: "8px 0",
        borderBottom:
          "1px solid #172033",
      }}
    >

      <div
        style={{
          color: "#9ca3af",
          fontSize: 12,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#e5e7eb",
          fontWeight: 600,
          fontSize: 12,
        }}
      >
        {value}
      </div>

    </div>

  );
}

