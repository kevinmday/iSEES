// ============================================================
// src/manifold/components/InvestigationGraph3D.tsx
// P57-UI-A7-I2
// DETERMINISTIC THREE-DIMENSIONAL MANIFOLD PROJECTION
//
// Presentation only. Canonical topology and selection remain
// owned by their existing deterministic runtimes.
// ============================================================

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";

import ForceGraph3D
from "react-force-graph-3d";

import type {
  ForceGraphMethods,
} from "react-force-graph-3d";

import type {
  GraphEdge,
  GraphNode,
} from "../graphTypes";

import ManifoldCameraInstrument, {
  type ManifoldCameraAction,
} from "./ManifoldCameraInstrument";

import type {
  WorkspaceSelection,
} from "../../workspace/runtime/WorkspaceRuntimeTypes";

interface InvestigationGraph3DProps {
  width: number;
  height: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  focusedEventId?: string | null;
  selection: WorkspaceSelection;
  setSelection: (
    selection: WorkspaceSelection,
  ) => void;
  onCollectNode?: (
    node: GraphNode,
  ) => void;
  onCollectEdge?: (
    edge: GraphEdge,
  ) => void;
}

interface ProjectedNode extends GraphNode {
  fx: number;
  fy: number;
  fz: number;
}

interface ProjectedLink extends GraphEdge {
  source: string;
  target: string;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface NavigationControls3D {
  target: Point3D & {
    set?: (
      x: number,
      y: number,
      z: number,
    ) => void;
  };
  minDistance: number;
  maxDistance: number;
  update?: () => void;
}

function stableDepth(
  value: string,
): number {
  let hash = 2166136261;

  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (
    ((hash >>> 0) % 241) - 120
  );
}

function nodeColor(
  node: ProjectedNode,
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

export default function InvestigationGraph3D({
  width,
  height,
  nodes,
  edges,
  focusedEventId,
  selection,
  setSelection,
  onCollectNode,
  onCollectEdge,
}: InvestigationGraph3DProps) {
  const graphRef =
    useRef<
      ForceGraphMethods | undefined
    >(
      undefined
    );

  const getNavigationControls =
    useCallback(
      () =>
        graphRef.current?.controls() as
          | NavigationControls3D
          | undefined,
      [],
    );

  const fitCamera =
    useCallback(
      () => {
        graphRef.current?.zoomToFit(
          0,
          96,
        );
      },
      [],
    );

  const handleCameraAction =
    useCallback(
      (
        action: ManifoldCameraAction,
      ): void => {
        if (action === "CENTER") {
          fitCamera();
          return;
        }

        const graph =
          graphRef.current;

        const controls =
          getNavigationControls();

        if (!graph || !controls) {
          return;
        }

        const camera =
          graph.camera();

        const position: Point3D = {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z,
        };

        const target: Point3D = {
          x: controls.target.x,
          y: controls.target.y,
          z: controls.target.z,
        };

        const PAN_STEP = 32;

        if (
          action === "PAN_UP" ||
          action === "PAN_DOWN" ||
          action === "PAN_LEFT" ||
          action === "PAN_RIGHT"
        ) {
          const offset = {
            x:
              action === "PAN_LEFT"
                ? -PAN_STEP
                : action === "PAN_RIGHT"
                  ? PAN_STEP
                  : 0,
            y:
              action === "PAN_UP"
                ? PAN_STEP
                : action === "PAN_DOWN"
                  ? -PAN_STEP
                  : 0,
            z: 0,
          };

          const nextPosition = {
            x: position.x + offset.x,
            y: position.y + offset.y,
            z: position.z + offset.z,
          };

          const nextTarget = {
            x: target.x + offset.x,
            y: target.y + offset.y,
            z: target.z + offset.z,
          };

          controls.target.set?.(
            nextTarget.x,
            nextTarget.y,
            nextTarget.z,
          );

          controls.update?.();

          graph.cameraPosition(
            nextPosition,
            nextTarget,
            160,
          );

          return;
        }

        const delta = {
          x: position.x - target.x,
          y: position.y - target.y,
          z: position.z - target.z,
        };

        const currentDistance =
          Math.max(
            Math.hypot(
              delta.x,
              delta.y,
              delta.z,
            ),
            1,
          );

        const requestedDistance =
          action === "ZOOM_IN"
            ? currentDistance * 0.8
            : currentDistance * 1.25;

        const nextDistance =
          Math.min(
            controls.maxDistance,
            Math.max(
              controls.minDistance,
              requestedDistance,
            ),
          );

        const scale =
          nextDistance /
          currentDistance;

        graph.cameraPosition(
          {
            x:
              target.x +
              delta.x * scale,
            y:
              target.y +
              delta.y * scale,
            z:
              target.z +
              delta.z * scale,
          },
          target,
          160,
        );
      },
      [
        fitCamera,
        getNavigationControls,
      ],
    );

  const graphData =
    useMemo(
      () => ({
        nodes:
          nodes.map(
            node => ({
              ...node,
              fx: node.x ?? 0,
              fy: node.y ?? 0,
              fz: stableDepth(node.id),
            }),
          ) as ProjectedNode[],
        links:
          edges.map(
            edge => ({
              ...edge,
              source: edge.source,
              target: edge.target,
            }),
          ) as ProjectedLink[],
      }),
      [nodes, edges],
    );

  useEffect(
    () => {
      const controls =
        getNavigationControls();

      if (controls) {
        controls.minDistance = 120;
        controls.maxDistance = 1200;
        controls.update?.();
      }
    },
    [
      getNavigationControls,
      graphData,
      width,
      height,
    ],
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#050b16",
      }}
    >
      <ForceGraph3D
        ref={graphRef}
        onEngineStop={fitCamera}
        width={Math.max(width, 1)}
        height={Math.max(height, 1)}
        graphData={graphData}
        backgroundColor="#050b16"
        showNavInfo={false}
        enableNodeDrag={false}
        cooldownTicks={0}
        nodeLabel={node =>
          (node as ProjectedNode).label
        }
        nodeColor={node =>
          nodeColor(
            node as ProjectedNode,
            focusedEventId,
            selection,
          )
        }
        nodeVal={node => {
          const projected =
            node as ProjectedNode;

          return projected.id === focusedEventId
            ? 12
            : selection.kind === "NODE" &&
                selection.nodeId === projected.id
              ? 10
              : 6;
        }}
        linkColor={link =>
          selection.kind === "EDGE" &&
          selection.edgeId ===
            (link as ProjectedLink).id
            ? "#f59e0b"
            : "#334155"
        }
        linkWidth={link =>
          selection.kind === "EDGE" &&
          selection.edgeId ===
            (link as ProjectedLink).id
            ? 3
            : Math.max(
                0.8,
                (link as ProjectedLink).weight * 3,
              )
        }
        onNodeClick={(node, event) => {
          const projected =
            node as ProjectedNode;

          setSelection({
            kind: "NODE",
            nodeId: projected.id,
          });

          if (event.detail >= 2) {
            onCollectNode?.(projected);
          }
        }}
        onLinkClick={(link, event) => {
          const projected =
            link as ProjectedLink;

          setSelection({
            kind: "EDGE",
            edgeId: projected.id,
          });

          if (event.detail >= 2) {
            onCollectEdge?.(projected);
          }
        }}
      />

      <ManifoldCameraInstrument
        onAction={
          handleCameraAction
        }
      />

      <div
        style={{
          position: "absolute",
          right: 16,
          bottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontFamily: "Consolas, monospace",
          fontSize: 10,
          letterSpacing: "0.08em",
        }}
      >
        <button
          type="button"
          title="Fit the complete deterministic 3D topology"
          onClick={fitCamera}
          style={{
            height: 28,
            padding: "0 12px",
            border:
              "1px solid rgba(96,165,250,0.38)",
            borderRadius: 6,
            background:
              "rgba(8,16,31,0.88)",
            color: "#93c5fd",
            fontFamily: "inherit",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            cursor: "pointer",
          }}
        >
          FIT
        </button>

        <span
          style={{
            color: "#64748b",
            pointerEvents: "none",
          }}
        >
          3D · DETERMINISTIC FIXED PROJECTION
        </span>
      </div>
    </div>
  );
}
