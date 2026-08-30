// ============================================================
// src/manifold/components/InvestigationGraph.tsx
// P28 MANIFOLD PROMOTION
// PRIMARY INVESTIGATION SURFACE
// DETERMINISTIC INVESTIGATION TOPOLOGY
// ============================================================
import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useWorkspace,
} from "../../workspace/context/WorkspaceContext";

import {
  useKnowledgeObjects,
} from "../../knowledge/runtime/KnowledgeObjectRuntimeContext";

import {
  buildKnowledgeTopology,
} from "../../knowledge/topology/KnowledgeTopologyBuilder";

import {
  adaptKnowledgeTopology,
} from "../../knowledge/topology/KnowledgeTopologyAdapter";

import {
  applyCircularManifoldLayout,
} from "../layout/manifoldLayout";

import {
  useGraph,
} from "../context/GraphContext";

import type {
  GraphEdge,
  GraphNode,
} from "../graphTypes";

import InvestigationViewport
from "./InvestigationViewport";

import GraphStatistics
from "./GraphStatistics";

import ManifoldToolbar, {
  type ManifoldToolbarAction,
} from "./ManifoldToolbar";

import ManifoldCameraInstrument, {
  type ManifoldCameraAction,
} from "./ManifoldCameraInstrument";

import GraphNodes
from "./GraphNodes";

import GraphEdges
from "./GraphEdges";

import {
  researchBridgeRuntime,
} from "../../research/ResearchBridgeRuntime";

import {
  ResearchAnchorType,
} from "../../research/researchBridgeTypes";

// ============================================================// TYPES

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
    focusedEventId,
  } = useWorkspace();

  const knowledgeObjects =
    useKnowledgeObjects();

  // ==========================================================
  // P56B
  // KNOWLEDGE-DERIVED OPERATIONAL TOPOLOGY
  // ==========================================================
  //
  // Canonical Knowledge K is now the explicit topology
  // authority for the live Investigation Manifold.
  //
  //   K
  //   ↓
  //   KnowledgeTopologyBuilder
  //   ↓
  //   G₀(K)
  //   ↓
  //   KnowledgeTopologyAdapter
  //   ↓
  //   InvestigationGraph
  //
  // React observes Knowledge runtime state through
  // useKnowledgeObjects().
  //
  // A Knowledge runtime mutation therefore causes deterministic
  // reconstruction of G₀ and rerendering of the Manifold.
  //
  // Legacy graph construction remains available as a migration
  // oracle/fallback but no longer owns explicit live Manifold
  // topology through this component.
  //
  // Computed topology such as SIMILARITY relationships is not
  // manufactured here. Gcomputed remains the responsibility of
  // the appropriate RDC / Discovery computational layer.
  //
  // ==========================================================

  const graph =
    useMemo(
      () => {

        const topology =
          buildKnowledgeTopology(
            knowledgeObjects
          );

        return adaptKnowledgeTopology(
          topology
        );

      },
      [
        knowledgeObjects,
      ]
    );

  // ==========================================================
  // MANIFOLD LAYOUT
  // ==========================================================
  //
  // Graph construction and spatial layout are intentionally
  // independent.
  //
  // The graph builder establishes deterministic semantic
  // topology. The Manifold Layout Engine projects that topology
  // into spatial coordinates for presentation.
  //
  // ==========================================================

  const positionedNodes =
    useMemo(
      () =>
        applyCircularManifoldLayout(
          graph.nodes,
          {
            centerNodeId:
              graph.centerNodeId,
            orbitRadius: 180,
          }
        ),
      [
        graph.nodes,
        graph.centerNodeId,
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
// GRAPH COLLECTION
// ==========================================================
//
// GraphNodes owns interaction.
//
// InvestigationGraph owns integration with the deterministic
// Research Bridge runtime.
//
// ==========================================================

function handleCollectNode(
  node: GraphNode,
): void {

  // ==========================================================
  // P56D-I1-G3
  // RESEARCH COLLECTION DIAGNOSTIC BOUNDARY
  //
  // Temporary instrumentation.
  //
  // This intentionally changes no Research Bridge semantics.
  // It exposes:
  //
  //   1. whether GraphNodes reaches this integration boundary
  //   2. whether focusedEventId exists
  //   3. Research Desk size before bridge()
  //   4. Research Desk size after bridge()
  //
  // ==========================================================

  const deskBefore =
    researchBridgeRuntime
      .getDesk()
      .entries
      .length;

  console.log(
    "[G3 TRACE] handleCollectNode ENTER",
    {
      nodeId:
        node.id,

      focusedEventId,

      deskBefore,
    },
  );

  // ----------------------------------------------------------
  // INVESTIGATION OWNERSHIP GUARD
  // ----------------------------------------------------------

  if (!focusedEventId) {

    console.log(
      "[G3 TRACE] handleCollectNode BLOCKED — no focusedEventId",
      {
        nodeId:
          node.id,

        focusedEventId,

        deskBefore,
      },
    );

    return;

  }

  // ----------------------------------------------------------
  // MANIFOLD -> RESEARCH BRIDGE
  // ----------------------------------------------------------

  researchBridgeRuntime.bridge({

    investigationId:
      focusedEventId,

    graph: {

      type:
        ResearchAnchorType.NODE,

      id:
        node.id,

    },

    graphRevision:
      1,

  });

  // ----------------------------------------------------------
  // POST-BRIDGE OBSERVATION
  // ----------------------------------------------------------

  const deskAfter =
    researchBridgeRuntime
      .getDesk()
      .entries
      .length;

  console.log(
    "[G3 TRACE] handleCollectNode AFTER bridge",
    {
      nodeId:
        node.id,

      focusedEventId,

      deskBefore,

      deskAfter,

      bridgeMutatedDesk:
        deskAfter !== deskBefore,
    },
  );

}
function handleCollectEdge(
  edge:
    GraphEdge,
): void {

  if (!focusedEventId) {
    return;
  }

  researchBridgeRuntime.bridge({

    investigationId:
      focusedEventId,

    graph: {

      type:
        ResearchAnchorType.EDGE,

      id:
        edge.id,

    },

    graphRevision:
      1,

  });

}

  // ==========================================================
  // CAMERA STATE
  // ==========================================================

  const [
    camera,
    setCamera,
  ] = useState({
    panX: 0,
    panY: 0,
    zoom: 1,
  });

  const cameraDragRef =
    useRef<{
      pointerId: number;
      clientX: number;
      clientY: number;
    } | null>(
      null
    );
  // ==========================================================
  // CAMERA ACTIONS
  // ==========================================================

  function handleCameraAction(
    action: ManifoldCameraAction,
  ): void {

    const PAN_STEP = 40;
    const ZOOM_FACTOR = 1.2;

    setCamera(
      current => {

        switch (action) {

          case "ZOOM_IN":

            return {
              ...current,
              zoom:
                Math.min(
                  current.zoom *
                    ZOOM_FACTOR,
                  6
                ),
            };

          case "ZOOM_OUT":

            return {
              ...current,
              zoom:
                Math.max(
                  current.zoom /
                    ZOOM_FACTOR,
                  0.5
                ),
            };

          case "PAN_UP":

            return {
              ...current,
              panY:
                current.panY -
                PAN_STEP /
                  current.zoom,
            };

          case "PAN_DOWN":

            return {
              ...current,
              panY:
                current.panY +
                PAN_STEP /
                  current.zoom,
            };

          case "PAN_LEFT":

            return {
              ...current,
              panX:
                current.panX -
                PAN_STEP /
                  current.zoom,
            };

          case "PAN_RIGHT":

            return {
              ...current,
              panX:
                current.panX +
                PAN_STEP /
                  current.zoom,
            };

          case "CENTER":

            return {
              panX: 0,
              panY: 0,
              zoom: 1,
            };

          default:

            return current;
        }

      }
    );
  }

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
        {(viewportSize) => {

          // ==================================================
          // RESPONSIVE TOPOLOGY PROJECTION
          // ==================================================
          //
          // Graph coordinates remain deterministic and
          // independent of viewport dimensions.
          //
          // Projection derives the visible coordinate space
          // from the actual positioned topology and adapts that
          // space to the physical Investigation Viewport.
          //
          // Layout owns topology geometry.
          // Projection owns framing.
          //
          // ==================================================

          const topologyPadding = 135;

          // ==================================================
          // TOPOLOGY BOUNDS
          // ==================================================

          const xCoordinates =
            positionedNodes.map(
              node =>
                node.x ?? 0
            );

          const yCoordinates =
            positionedNodes.map(
              node =>
                node.y ?? 0
            );

          const minX =
            Math.min(
              ...xCoordinates
            );

          const maxX =
            Math.max(
              ...xCoordinates
            );

          const minY =
            Math.min(
              ...yCoordinates
            );

          const maxY =
            Math.max(
              ...yCoordinates
            );

          const topologyWidth =
            Math.max(
              maxX - minX,
              1
            );

          const topologyHeight =
            Math.max(
              maxY - minY,
              1
            );

          const topologyCenterX =
            (
              minX +
              maxX
            ) / 2;

          const topologyCenterY =
            (
              minY +
              maxY
            ) / 2;

          // ==================================================
          // PHYSICAL VIEWPORT
          // ==================================================

          const viewportWidth =
            Math.max(
              viewportSize.width,
              1
            );

          const viewportHeight =
            Math.max(
              viewportSize.height,
              1
            );

          const viewportAspectRatio =
            viewportWidth /
            viewportHeight;

          // ==================================================
          // PADDED TOPOLOGY EXTENT
          // ==================================================

          let viewBoxWidth =
            topologyWidth +
            topologyPadding * 2;

          let viewBoxHeight =
            topologyHeight +
            topologyPadding * 2;

          const topologyAspectRatio =
            viewBoxWidth /
            viewBoxHeight;

          // ==================================================
          // ASPECT-RATIO CORRECTION
          // ==================================================
          //
          // Expand only the deficient dimension so the entire
          // padded topology remains visible without changing
          // deterministic node geometry.
          //
          // ==================================================

          if (
            topologyAspectRatio >
            viewportAspectRatio
          ) {

            viewBoxHeight =
              viewBoxWidth /
              viewportAspectRatio;

          } else {

            viewBoxWidth =
              viewBoxHeight *
              viewportAspectRatio;

          }

            // ==================================================
          // CAMERA PROJECTION
          // ==================================================
          //
          // Camera state modifies only the visible projection.
          //
          // Deterministic topology coordinates remain
          // unchanged.
          //
          // ==================================================

          const cameraViewBoxWidth =
            viewBoxWidth /
            camera.zoom;

          const cameraViewBoxHeight =
            viewBoxHeight /
            camera.zoom;

          const cameraViewBoxX =
            topologyCenterX +
            camera.panX -
            cameraViewBoxWidth / 2;

          const cameraViewBoxY =
            topologyCenterY +
            camera.panY -
            cameraViewBoxHeight / 2;

          // ==================================================
          // DIRECT CAMERA INTERACTION
          // ==================================================

          function handleTopologyPointerDown(
            event:
              React.PointerEvent<SVGSVGElement>
          ): void {

            const target =
              event.target as SVGElement;

            if (
              target.getAttribute(
                "data-camera-surface"
              ) !== "true"
            ) {
              return;
            }

            cameraDragRef.current = {
              pointerId:
                event.pointerId,

              clientX:
                event.clientX,

              clientY:
                event.clientY,
            };

            event.currentTarget.setPointerCapture(
              event.pointerId
            );
          }

          function handleTopologyPointerMove(
            event:
              React.PointerEvent<SVGSVGElement>
          ): void {

            const drag =
              cameraDragRef.current;

            if (
              !drag ||
              drag.pointerId !==
                event.pointerId
            ) {
              return;
            }

            const rect =
              event.currentTarget.getBoundingClientRect();

            if (
              rect.width === 0 ||
              rect.height === 0
            ) {
              return;
            }

            const deltaX =
              event.clientX -
              drag.clientX;

            const deltaY =
              event.clientY -
              drag.clientY;

            const topologyDeltaX =
              deltaX *
              (
                cameraViewBoxWidth /
                rect.width
              );

            const topologyDeltaY =
              deltaY *
              (
                cameraViewBoxHeight /
                rect.height
              );

            cameraDragRef.current = {
              pointerId:
                event.pointerId,

              clientX:
                event.clientX,

              clientY:
                event.clientY,
            };

            setCamera(
              current => ({
                ...current,

                panX:
                  current.panX -
                  topologyDeltaX,

                panY:
                  current.panY -
                  topologyDeltaY,
              })
            );
          }

          function handleTopologyPointerUp(
            event:
              React.PointerEvent<SVGSVGElement>
          ): void {

            const drag =
              cameraDragRef.current;

            if (
              !drag ||
              drag.pointerId !==
                event.pointerId
            ) {
              return;
            }

            cameraDragRef.current =
              null;

            if (
              event.currentTarget.hasPointerCapture(
                event.pointerId
              )
            ) {
              event.currentTarget.releasePointerCapture(
                event.pointerId
              );
            }
          }

          function handleTopologyWheel(
            event:
              React.WheelEvent<SVGSVGElement>
          ): void {

            event.preventDefault();

            const ZOOM_FACTOR =
              1.12;

            setCamera(
              current => {

                const nextZoom =
                  event.deltaY < 0
                    ? current.zoom *
                      ZOOM_FACTOR
                    : current.zoom /
                      ZOOM_FACTOR;

                return {
                  ...current,

                  zoom:
                    Math.min(
                      6,
                      Math.max(
                        0.5,
                        nextZoom
                      )
                    ),
                };
              }
            );
          }

          return (

            <>
              {/* ============================================== */}
              {/* TOPOLOGY                                       */}
              {/* ============================================== */}

              <svg
                width="100%"
                height="100%"
                viewBox={
                  `${cameraViewBoxX} ${cameraViewBoxY} ${cameraViewBoxWidth} ${cameraViewBoxHeight}`
                }
                preserveAspectRatio="xMidYMid meet"

                onPointerDown={
                  handleTopologyPointerDown
                }

                onPointerMove={
                  handleTopologyPointerMove
                }

                onPointerUp={
                  handleTopologyPointerUp
                }

                onPointerCancel={
                  handleTopologyPointerUp
                }

                onWheel={
                  handleTopologyWheel
                }

                             style={{
                  cursor:
                    cameraDragRef.current
                      ? "grabbing"
                      : "grab",

                  touchAction: "none",

                  userSelect: "none",
                  WebkitUserSelect: "none",
                }}
              >

                               {/* ============================================ */}
                {/* BACKGROUND PAN SURFACE                       */}
                {/* ============================================ */}

                <rect
                  data-camera-surface="true"
                  x={cameraViewBoxX}
                  y={cameraViewBoxY}
                  width={cameraViewBoxWidth}
                  height={cameraViewBoxHeight}
                  fill="transparent"
                  pointerEvents="all"
                />

                {/* ============================================ */}
                {/* EDGES                                        */}
                {/* ============================================ */}

                <GraphEdges
                  nodes={
                    positionedNodes
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
                  onCollectEdge={
                    handleCollectEdge
                  }

                />

                             {/* ============================================ */}
              {/* NODES                                        */}
              {/* ============================================ */}

              <GraphNodes
                nodes={positionedNodes}
                selection={selection}
                focusedNodeIds={focusedNodeIds}
                centerNodeId={centerNodeId}
                setCenterNodeId={setCenterNodeId}
                setSelection={setSelection}
                onCollectNode={
                  handleCollectNode
                }
              />

            </svg>
              {/* ============================================== */}
              {/* MANIFOLD INSTRUMENT LAYER                     */}
              {/* ============================================== */}
              {/*
                SC-009
                MANIFOLD INSTRUMENT ARCHITECTURE

                Instruments are projected directly over the
                topology viewport and consume no topology
                layout dimensions.

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

                  {/* ============================================ */}
              {/* MANIFOLD INSTRUMENTS                         */}
              {/* ============================================ */}

              <ManifoldToolbar
                onAction={onAction}
              />

              <ManifoldCameraInstrument
                onAction={
                  handleCameraAction
                }
              />

            </div>

          </>

        );

      }}
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