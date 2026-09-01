// ============================================================
// src/manifold/components/ManifoldMapInstrument.tsx
// P57-UI-A9-I1
// MOVABLE PASSIVE MANIFOLD MAP
//
// Presentation-only structural projection of the active
// three-dimensional Investigation Manifold.
//
// The surrounding ManifoldInstrumentPalette owns:
//
// - floating position
// - drag interaction
// - docking
// - local presentation persistence
//
// This component owns no:
//
// - canonical topology
// - canonical selection
// - camera control
// - workspace state
// - force simulation
// ============================================================

import ManifoldInstrumentPalette
from "./ManifoldInstrumentPalette";

import type {
  GraphEdge,
  GraphNode,
} from "../graphTypes";

import type {
  WorkspaceSelection,
} from "../../workspace/runtime/WorkspaceRuntimeTypes";


// ============================================================
// TYPES
// ============================================================

// Camera presentation only. This contract owns no camera,
// topology, selection, or workspace state.
export interface ManifoldCameraPoint3D {
  x: number;
  y: number;
  z: number;
}

export interface ManifoldCameraSnapshot3D {
  position: ManifoldCameraPoint3D;
  target: ManifoldCameraPoint3D;
}
interface ManifoldMapInstrumentProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  focusedEventId?: string | null;
  selection: WorkspaceSelection;
  camera: ManifoldCameraSnapshot3D | null;
}

interface MapBounds {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

// ============================================================
// CONSTANTS
// ============================================================

const MAP_WIDTH = 220;
const MAP_HEIGHT = 142;
const MAP_PADDING = 34;

// ============================================================
// HELPERS
// ============================================================

function resolveBounds(
  nodes: GraphNode[],
): MapBounds {
  if (nodes.length === 0) {
    return {
      minX: -100,
      minY: -100,
      width: 200,
      height: 200,
    };
  }

  const xValues =
    nodes.map(node => node.x ?? 0);

  const yValues =
    nodes.map(node => node.y ?? 0);

  const minX =
    Math.min(...xValues);

  const maxX =
    Math.max(...xValues);

  const minY =
    Math.min(...yValues);

  const maxY =
    Math.max(...yValues);

  return {
    minX:
      minX - MAP_PADDING,

    minY:
      minY - MAP_PADDING,

    width:
      Math.max(
        maxX - minX + MAP_PADDING * 2,
        1,
      ),

    height:
      Math.max(
        maxY - minY + MAP_PADDING * 2,
        1,
      ),
  };
}

function nodeFill(
  node: GraphNode,
  focusedEventId: string | null | undefined,
  selection: WorkspaceSelection,
): string {
  if (
    selection.kind === "NODE" &&
    selection.nodeId === node.id
  ) {
    return "#f59e0b";
  }

  if (node.id === focusedEventId) {
    return "#38bdf8";
  }

  switch (node.type) {
    case "EVENT":
      return "#60a5fa";

    case "LOCATION":
      return "#f472b6";

    case "FACILITY":
      return "#94a3b8";

    default:
      return "#a78bfa";
  }
}

// ============================================================
// COMPONENT
// ============================================================

export default function ManifoldMapInstrument({
  nodes,
  edges,
  focusedEventId,
  selection,
  camera,
}: ManifoldMapInstrumentProps) {
  const bounds =
    resolveBounds(nodes);

  const nodeById =
    new Map(
      nodes.map(
        node => [
          node.id,
          node,
        ],
      ),
    );

  const cameraDistance =
    camera
      ? Math.hypot(
          camera.position.x -
            camera.target.x,
          camera.position.y -
            camera.target.y,
          camera.position.z -
            camera.target.z,
        )
      : 0;

  const regionRadius =
    camera
      ? Math.min(
          Math.max(
            cameraDistance * 0.18,
            34,
          ),
          Math.max(
            Math.min(
              bounds.width,
              bounds.height,
            ) * 0.42,
            34,
          ),
        )
      : 0;

  const directionX =
    camera
      ? camera.position.x -
        camera.target.x
      : 0;

  const directionY =
    camera
      ? camera.position.y -
        camera.target.y
      : 0;

  const directionMagnitude =
    Math.max(
      Math.hypot(
        directionX,
        directionY,
      ),
      1,
    );

  const directionLength =
    regionRadius * 0.72;

  const directionEndX =
    camera
      ? camera.target.x +
        (
          directionX /
          directionMagnitude
        ) *
        directionLength
      : 0;

  const directionEndY =
    camera
      ? camera.target.y +
        (
          directionY /
          directionMagnitude
        ) *
        directionLength
      : 0;

  return (
    <ManifoldInstrumentPalette
      instrumentId="manifold-map"
      title="Manifold Map"
      defaultPosition={{
        x: 310,
        y: 12,
      }}
      width={MAP_WIDTH}
    >
      <div
        data-passive-manifold-map="true"
        style={{
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <svg
          aria-hidden="true"
          focusable="false"
          width="100%"
          height={MAP_HEIGHT}
          viewBox={
            `${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`
          }
          preserveAspectRatio="xMidYMid meet"
          style={{
            display: "block",
            overflow: "hidden",
            border:
              "1px solid rgba(148,163,184,0.16)",
            borderRadius: 6,
            background:
              "rgba(5,11,22,0.94)",
            pointerEvents: "none",
          }}
        >
          {edges.map(edge => {
            const source =
              nodeById.get(edge.source);

            const target =
              nodeById.get(edge.target);

            if (!source || !target) {
              return null;
            }

            const selected =
              selection.kind === "EDGE" &&
              selection.edgeId === edge.id;

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
                    : "#475569"
                }
                strokeWidth={
                  selected
                    ? 4
                    : Math.max(
                        1.2,
                        edge.weight * 2,
                      )
                }
                strokeOpacity={
                  selected
                    ? 0.94
                    : 0.58
                }
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {camera && (
            <g
              data-camera-region="true"
              pointerEvents="none"
            >
              <circle
                cx={camera.target.x}
                cy={camera.target.y}
                r={regionRadius}
                fill="rgba(56,189,248,0.06)"
                stroke="#38bdf8"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                strokeOpacity={0.86}
                vectorEffect="non-scaling-stroke"
              />

              <line
                x1={camera.target.x}
                y1={camera.target.y}
                x2={directionEndX}
                y2={directionEndY}
                stroke="#7dd3fc"
                strokeWidth={2}
                strokeOpacity={0.9}
                vectorEffect="non-scaling-stroke"
              />

              <circle
                cx={camera.target.x}
                cy={camera.target.y}
                r={7}
                fill="#020617"
                stroke="#7dd3fc"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />

              <line
                x1={camera.target.x - 11}
                y1={camera.target.y}
                x2={camera.target.x + 11}
                y2={camera.target.y}
                stroke="#7dd3fc"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />

              <line
                x1={camera.target.x}
                y1={camera.target.y - 11}
                x2={camera.target.x}
                y2={camera.target.y + 11}
                stroke="#7dd3fc"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          )}

          {nodes.map(node => {
            const selected =
              selection.kind === "NODE" &&
              selection.nodeId === node.id;

            const focused =
              node.id === focusedEventId;

            return (
              <circle
                key={node.id}
                cx={node.x ?? 0}
                cy={node.y ?? 0}
                r={
                  focused
                    ? 9
                    : selected
                      ? 8
                      : node.type === "EVENT"
                        ? 6
                        : 4
                }
                fill={
                  nodeFill(
                    node,
                    focusedEventId,
                    selection,
                  )
                }
                stroke={
                  selected
                    ? "#fde68a"
                    : focused
                      ? "#bae6fd"
                      : "#0f172a"
                }
                strokeWidth={
                  selected || focused
                    ? 2.5
                    : 1.2
                }
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        <div
          style={{
            marginTop: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#64748b",
            fontFamily:
              "Consolas, monospace",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <span>
            Passive view
          </span>

          <span>
            {nodes.length} N · {edges.length} E
          </span>
        </div>
      </div>
    </ManifoldInstrumentPalette>
  );
}