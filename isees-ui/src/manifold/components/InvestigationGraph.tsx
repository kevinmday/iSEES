// ============================================================
// src/manifold/components/InvestigationGraph.tsx
// P28 MANIFOLD PROMOTION
// PRIMARY INVESTIGATION SURFACE
// DETERMINISTIC INVESTIGATION TOPOLOGY
// ============================================================

import {
  useMemo,
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

import {
  useGraph,
} from "../context/GraphContext";

import GraphInteractionPanel
from "../../graph/GraphInteractionPanel";

import GraphNodeGlyph
from "./GraphNodeGlyph";

import type {
  GraphNodeIntelligence,
  GraphEdgeIntelligence,
} from "../../graph/graphInteractionTypes";

// ============================================================
// STAT CARD
// ============================================================

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
  // P28A
  // GRAPH CONTEXT OWNERSHIP
  // SINGLE SOURCE OF TRUTH
  // ==========================================================

  const {
    selection,
    setSelection,
    centerNodeId,
    setCenterNodeId,
  } = useGraph();


  // ==========================================================
  // SELECTED NODE INTELLIGENCE
  // ==========================================================

const selectedNode: GraphNodeIntelligence | undefined =
  selection.kind === "NODE"
    ? (() => {

        const node =
          graph.nodes.find(
            n => n.id === selection.nodeId
          );

        if (!node) {
          return undefined;
        }

        const connectionCount =
          graph.edges.filter(
            edge =>
              edge.source === node.id ||
              edge.target === node.id
          ).length;

        return {

          nodeId:
            node.id,

          title:
            node.label,

          sourceType:
            String(
              node.metadata?.source ??
              "UNKNOWN"
            ),

          confidence:
            typeof node.metadata?.confidence ===
            "number"
              ? node.metadata.confidence
              : undefined,

          connectionCount,

          metadata:
            node.metadata,
        };

      })()
    : undefined;

// ==========================================================
// SELECTED EDGE INTELLIGENCE
// ==========================================================

const selectedEdge: GraphEdgeIntelligence | undefined =
  selection.kind === "EDGE"
    ? (() => {

        const edge =
          graph.edges.find(
            e => e.id === selection.edgeId
          );

        if (!edge) {
          return undefined;
        }

        return {

          edgeId:
            edge.id,

          sourceId:
            edge.source,

          targetId:
            edge.target,

          confidence:
            edge.metrics?.confidence ?? 0,

          narrative:
            edge.metrics?.narrative ?? 0,

          observability:
            edge.metrics?.observability ?? 0,

          infrastructure:
            edge.metrics?.infrastructure ?? 0,

          topology:
            edge.metrics?.topology ?? 0,

          geo:
            edge.metrics?.geo ?? 0,

          rationale:
            edge.rationale ?? [],
        };

      })()
    : undefined;


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
            Investigation Manifold
          </div>

          <div
            style={{
              fontSize: 18,
              color: "#f3f4f6",
              fontWeight: 700,
            }}
          >
            Deterministic Investigation Topology
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
{/* P40
    PRODUCTION MANIFOLD VIEWPORT

    Owns:
    • Graph presentation
    • Responsive viewport
    • SVG host

    Does NOT own:
    • Graph computation
    • Selection
    • Runtime
    • Layout algorithms
*/}
{/* ==================================================== */}

<div
  style={{
    flex: 1,
    minHeight: 0,

    display: "flex",
    justifyContent: "center",
    alignItems: "stretch",

    padding: 16,

    background: "#050b16",
    border: "1px solid #172033",
    borderRadius: 8,

    overflow: "hidden",

    position: "relative",
  }}
>

  <svg
    width="100%"
    height="100%"
    viewBox="-320 -320 640 640"
    preserveAspectRatio="xMidYMid meet"
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
              cursor: "pointer",
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

        const glyphSize =
          centered
            ? 22
            : selected
              ? 18
              : focused
                ? 16
                : 14;

        return (

          <g
            key={node.id}
            transform={`translate(${node.x ?? 0}, ${node.y ?? 0})`}
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

            <GraphNodeGlyph
              type={node.type}
              iconType={node.iconType}
              selected={selected}
              focused={focused}
              size={glyphSize}
            />

            {centered && (
              <circle
                r={glyphSize + 8}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={3}
                opacity={0.85}
              />
            )}

            <text
              x={0}
              y={glyphSize + 18}
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

<GraphInteractionPanel
  selectedNode={selectedNode}
  selectedEdge={selectedEdge}
/>

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