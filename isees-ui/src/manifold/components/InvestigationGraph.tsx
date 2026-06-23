// ============================================================
// src/manifold/components/InvestigationGraph.tsx
// P25.1 INTERACTIVE MANIFOLD FOUNDATION
// NODE + EDGE SELECTION
// VISUAL FEEDBACK
// FULL DROP-IN REPLACEMENT
// ============================================================

import {
  useMemo,
  useState,
} from "react";

import {
  useCorpus,
} from "../../corpus/context/CorpusContext";

import {
  useWorkspace,
} from "../../workspace/context/WorkspaceContext";

import {
  buildInvestigationGraph,
} from "../graphBuilder";

import type {
  GraphSelection,
} from "../graphTypes";

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

   // ==========================================================
  // P25.1 SELECTION STATE
  // SINGLE SOURCE OF TRUTH
  // ==========================================================

  const [
    selection,
    setSelection,
  ] =
    useState<
      GraphSelection
    >({
      kind: "NONE",
    });

  // ==========================================================
  // P25.2 CENTER NODE
  // DYNAMIC GRAPH OWNERSHIP
  // ==========================================================

  const [
    centerNodeId,
    setCenterNodeId,
  ] =
    useState<
      string | null
    >(null);

  // ==========================================================
  // FOCUSED NODE
  // ==========================================================

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

      {/* ==================================================== */}
      {/* HEADER */}
      {/* ==================================================== */}

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

     

{/* ==================================================== */}
{/* TOPOLOGY CANVAS */}
{/* ==================================================== */}

<div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    background: "#050b16",
    border: "1px solid #172033",
    borderRadius: 8,
    overflow: "hidden",
  }}
>

  <svg
    width="100%"
    height="500"
    viewBox="-250 -250 500 500"
  >

    {/* ================================================ */}
{/* EDGES */}
{/* ================================================ */}

{graph.edges.map(
  edge => {

    const source =
      graph.nodes.find(
        node =>
          node.id ===
          edge.source
      );

    const target =
      graph.nodes.find(
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

      <line
        key={edge.id}
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
            sourceId:
              edge.source,
            targetId:
              edge.target,
          })
        }
        style={{
          cursor:
            "pointer",
        }}
      />

    );
  }
)}

    {/* ================================================ */}
{/* NODES */}
{/* ================================================ */}

{graph.nodes.map(
  node => {

    const focused =
      focusedNodeIds.has(
        node.id
      );

    const selected =
      selection.kind ===
        "NODE" &&
      selection.nodeId ===
        node.id;

    const centered =
      centerNodeId ===
      node.id;

    return (

      <g
        key={node.id}
        onClick={() =>
          setSelection({
            kind: "NODE",
            nodeId: node.id,
            nodeType:
              node.type,
          })
        }
        onDoubleClick={() =>
          setCenterNodeId(
            node.id
          )
        }
        style={{
          cursor: "pointer",
        }}
      >

        <circle
          cx={node.x ?? 0}
          cy={node.y ?? 0}
          r={
            centered
              ? 22
              : selected
                ? 18
                : focused
                  ? 16
                  : 14
          }
          fill={
            centered
              ? "#dc2626"
              : selected
                ? "#f59e0b"
                : focused
                  ? "#3b82f6"
                  : "#1e293b"
          }
          stroke={
            centered
              ? "#fca5a5"
              : selected
                ? "#fde68a"
                : focused
                  ? "#93c5fd"
                  : "#475569"
          }
          strokeWidth={
            centered
              ? 4
              : 2
          }
        />

        <text
          x={node.x ?? 0}
          y={
            (node.y ?? 0) + 32
          }
          textAnchor="middle"
          fill="#d1d5db"
          fontSize="11"
          fontWeight="600"
        >
          {node.label}
        </text>

      </g>

    );
  }
)}

</svg>

</div>




      {/* ==================================================== */}
      {/* EDGES */}
      {/* ==================================================== */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >

        {graph.edges.map(
          edge => {

            const selectedEdge =
              selection?.kind ===
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

    </div>

  );
}