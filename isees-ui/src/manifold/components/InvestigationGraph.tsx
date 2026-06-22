// ============================================================
// src/manifold/components/InvestigationGraph.tsx
// P25 INVESTIGATION GRAPH FOUNDATION
// DETERMINISTIC GRAPH VISUALIZATION (V1)
// FULL DROP-IN FILE
// ============================================================

import { useMemo } from "react";

import {
  useCorpus,
} from "../../corpus/context/CorpusContext";

import {
  useWorkspace,
} from "../../workspace/context/WorkspaceContext";

import {
  buildInvestigationGraph,
} from "../graphBuilder";

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      style={{
        textAlign: "center",
      }}
    >
      <div
        style={{
          color: "#6b7280",
          fontSize: 11,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#f3f4f6",
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function InvestigationGraph() {

  const {
    corpus,
  } = useCorpus();

  const {
    activeWorkspace,
    focusedEventId,
  } = useWorkspace();

  const graph =
    useMemo(
      () =>
        buildInvestigationGraph(
          corpus,
          activeWorkspace
        ),
      [
        corpus,
        activeWorkspace,
      ]
    );

  const focusedNodeIds =
    new Set<string>();

  if (focusedEventId) {
    focusedNodeIds.add(
      focusedEventId
    );
  }

  return (
    <div
      style={{
        background: "#08101f",
        border: "1px solid #172033",
        borderRadius: 8,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >

      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >

        <div>

          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Investigation Graph
          </div>

          <div
            style={{
              fontSize: 18,
              color: "#f3f4f6",
              fontWeight: 700,
            }}
          >
            Deterministic Relationship Map
          </div>

        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
          }}
        >

          <StatCard
            label="Nodes"
            value={
              graph.statistics.nodeCount
            }
          />

          <StatCard
            label="Edges"
            value={
              graph.statistics.edgeCount
            }
          />

          <StatCard
            label="Events"
            value={
              graph.statistics.eventCount
            }
          />

        </div>

      </div>

      {/* NODES */}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >

        {graph.nodes.map(
          node => {

            const focused =
              focusedNodeIds.has(
                node.id
              );

            return (

              <div
                key={node.id}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: focused
                    ? "1px solid #3b82f6"
                    : "1px solid #1f2937",
                  background: focused
                    ? "#0f172a"
                    : "#08101f",
                  color: focused
                    ? "#60a5fa"
                    : "#d1d5db",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {node.label}
              </div>

            );
          }
        )}

      </div>

      {/* EDGES */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >

        {graph.edges.map(
          edge => (

            <div
              key={edge.id}
              style={{
                border: "1px solid #172033",
                borderRadius: 6,
                padding: 10,
                background: "#050b16",
              }}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >

                <div
                  style={{
                    color: "#d1d5db",
                    fontWeight: 600,
                  }}
                >
                  {edge.source}
                  {" → "}
                  {edge.target}
                </div>

                <div
                  style={{
                    color: "#60a5fa",
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
                  color: "#9ca3af",
                  fontSize: 12,
                }}
              >
                {edge.relationship}
              </div>

            </div>

          )
        )}

      </div>

    </div>
  );
}