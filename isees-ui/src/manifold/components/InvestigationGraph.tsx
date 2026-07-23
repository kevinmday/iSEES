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

import ManifoldToolbar, {
  type ManifoldToolbarAction,
} from "./ManifoldToolbar";

import GraphNodes
from "./GraphNodes";

import GraphEdges
from "./GraphEdges";
// ============================================================
// TYPES
// ============================================================

interface InvestigationGraphProps {
  onAction: (
    action: ManifoldToolbarAction,
  ) => void;
}

// ============================================================
// COMPONENT
// ============================================================

export default function InvestigationGraph({
  onAction,
}: InvestigationGraphProps) {

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
  //
  // Selection intelligence is no longer projected inside the
  // Investigation Graph.
  //
  // GraphContext remains the canonical owner of graph
  // selection. Selected-node intelligence will be resolved and
  // projected by the dedicated Selection Intelligence surface.
  //
  // ==========================================================

  // ==========================================================
  // SELECTED EDGE INTELLIGENCE
  // ==========================================================
  //
  // Selection intelligence is projected outside the
  // Investigation Graph by the dedicated Selection
  // Intelligence surface.
  //
  // ==========================================================

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
        flex: 1,
        minWidth: 0,
        minHeight: 0,

        background: "#08101f",
        border: "1px solid #172033",
        borderRadius: 8,
        padding: 16,

        display: "flex",
        flexDirection: "column",
        gap: 12,

        overflow: "hidden",
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

        {/* ================================================== */}
        {/* TOPOLOGY                                           */}
        {/* ================================================== */}

        <svg
          width="100%"
          height="100%"
          viewBox="-320 -320 640 640"
          preserveAspectRatio="xMidYMid meet"
        >

          {/* ================================================ */}
          {/* EDGES                                            */}
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
          {/* NODES                                            */}
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

        {/* ================================================== */}
        {/* MANIFOLD INSTRUMENT LAYER                          */}
        {/* ================================================== */}
        {/*
          SC-009
          MANIFOLD INSTRUMENT ARCHITECTURE

          Instruments are projected directly over the topology
          viewport and consume no topology layout dimensions.

          The overlay ignores pointer interaction outside
          instrument bounds.
        */}

        <div
          style={{
            position: "absolute",
            inset: 0,

            zIndex: 20,

            pointerEvents: "none",
          }}
        >

          {/* ================================================ */}
          {/* DEFAULT INSTRUMENT RAIL                          */}
          {/* ================================================ */}

          <div
            style={{
              position: "absolute",

              top: 12,
              left: 12,

              pointerEvents: "none",
            }}
          >

            <ManifoldToolbar
              onAction={onAction}
            />

          </div>

        </div>

      </InvestigationViewport>
{/* ==================================================== */}
{/* EDGE INSPECTOR                                      */}
{/* ==================================================== */}
{/*
  The persistent edge inspector has been removed from the
  primary Manifold surface.

  Edge selection remains available directly through the
  topology. Selected-edge intelligence will be projected
  through the dedicated Selection Intelligence surface.
*/}

</div>

);

}