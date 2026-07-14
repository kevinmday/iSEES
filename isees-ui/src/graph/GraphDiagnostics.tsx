// ============================================================
// src/graph/GraphDiagnostics.tsx
// P25.1 GRAPH DIAGNOSTICS
// CORPUS → GRAPH VALIDATION SURFACE
// FULL DROP-IN FILE
// ============================================================

import { useCorpus } from "../corpus/context/CorpusContext";

import {
  buildInvestigationGraph,
} from "../manifold/graphBuilder";

import {
  useWorkspace,
} from "../workspace/context/WorkspaceContext";

// ============================================================
// COMPONENT
// ============================================================

export default function GraphDiagnostics() {

  const {
    corpus,
  } = useCorpus();

  const {
    activeWorkspace,
  } = useWorkspace();

  const graph =
    buildInvestigationGraph(
      corpus,
      activeWorkspace
    );

  const nodeCount =
    graph.nodes.length;

  const edgeCount =
    graph.edges.length;

  const strongestEdge =
    graph.edges.length > 0
      ? graph.edges.reduce(
          (best, current) =>
            current.weight >
            best.weight
              ? current
              : best
        )
      : undefined;

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
    edge => {

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

        background:
          "var(--surface-2)",

        border:
          "var(--surface-border)",

        borderRadius:
          "var(--surface-radius)",

        padding:
          "var(--surface-padding-md)",

      }}
    >

      <div
        style={{

          marginBottom:
            "var(--space-md)",

          fontFamily:
            "var(--font-family-sans)",

          fontSize:
            "var(--font-panel)",

          fontWeight:
            "var(--weight-bold)",

          letterSpacing:
            "var(--tracking-system)",

          textTransform:
            "uppercase",

          color:
            "var(--text-primary)",

        }}
      >
        Graph Summary
      </div>

      <Metric
        label="Nodes"
        value={nodeCount}
      />

      <Metric
        label="Events"
        value={
          graph.statistics.eventCount
        }
      />

      <Metric
        label="Facilities"
        value={
          graph.statistics.facilityCount
        }
      />

      <Metric
        label="Artifacts"
        value={
          graph.statistics.artifactCount
        }
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

      {

        strongestEdge && (

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

        )

      }

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

