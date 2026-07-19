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

import InvestigationViewport
from "./InvestigationViewport";

import GraphStatistics
from "./GraphStatistics";

import GraphInteractionPanel
from "../../graph/GraphInteractionPanel";

import type {
  GraphNodeIntelligence,
  GraphEdgeIntelligence,
} from "../../graph/graphInteractionTypes";

import GraphNodes
from "./GraphNodes";

import GraphEdges
from "./GraphEdges";

// ============================================================
// COMPONENT
// ============================================================

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

        <GraphStatistics
          nodeCount={
            graph.statistics.nodeCount
          }
          edgeCount={
            graph.statistics.edgeCount
          }
          eventCount={
            graph.statistics.eventCount
          }
        />

      </div>

      {/* ==================================================== */}
      {/* TOPOLOGY CANVAS                                     */}
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

<InvestigationViewport>

  <svg
    width="100%"
    height="100%"
    viewBox="-320 -320 640 640"
    preserveAspectRatio="xMidYMid meet"
  >
    {/* ================================================ */}
    {/* EDGES */}
    {/* ================================================ */}

    <GraphEdges
      nodes={
        graph.nodes
      }
      edges={
        graph.edges
      }
      selection={
        selection
      }
      setSelection={
        setSelection
      }
    />

    {/* ================================================ */}
    {/* NODES */}
    {/* ================================================ */}

    <GraphNodes
      nodes={graph.nodes}
      selection={selection}
      focusedNodeIds={focusedNodeIds}
      centerNodeId={centerNodeId}
      setCenterNodeId={setCenterNodeId}
      setSelection={setSelection}
    />

  </svg>

</InvestigationViewport>

<GraphInteractionPanel
  selectedNode={selectedNode}
  selectedEdge={selectedEdge}
/>

{/* ==================================================== */}
{/* EDGE INSPECTOR */}
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