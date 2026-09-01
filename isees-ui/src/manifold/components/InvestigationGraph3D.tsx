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
  useState,
} from "react";

import ForceGraph3D
from "react-force-graph-3d";

import type {
  ForceGraphMethods,
} from "react-force-graph-3d";

import SpriteText
from "three-spritetext";

import {
  Group,
} from "three";

import type {
  GraphEdge,
  GraphNode,
} from "../graphTypes";

import {
  getGraphIcon,
} from "../iconology/iconRegistry";
import {
  getEdgePresentation,
  SELECTED_EDGE_COLOR,
} from "../edgePresentation";

import ManifoldCameraInstrument, {
  type ManifoldCameraAction,
} from "./ManifoldCameraInstrument";


import ManifoldMapInstrument
from "./ManifoldMapInstrument";

import type {
  ManifoldCameraSnapshot3D,
} from "./ManifoldMapInstrument";

export type {
  ManifoldCameraSnapshot3D,
} from "./ManifoldMapInstrument";

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
  onCameraChange?: (
    snapshot: ManifoldCameraSnapshot3D,
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
  addEventListener?: (
    type: "change",
    listener: () => void,
  ) => void;
  removeEventListener?: (
    type: "change",
    listener: () => void,
  ) => void;
}

function createPersistentNodeLabel(
  node: ProjectedNode,
  focusedEventId: string | null | undefined,
  selection: WorkspaceSelection,
): SpriteText | null {
  const isSelected =
    selection.kind === "NODE" &&
    selection.nodeId === node.id;

  const isFocused =
    node.id === focusedEventId;

  const isEvent =
    node.type === "EVENT";

  if (
    !isSelected &&
    !isFocused &&
    !isEvent
  ) {
    return null;
  }

  const color =
    isSelected
      ? "#fbbf24"
      : isFocused
        ? "#7dd3fc"
        : "#dbeafe";

  const label =
    new SpriteText(
      node.label,
      isSelected || isFocused
        ? 8
        : 6.5,
      color,
    );

  label.fontFace =
    "Consolas";

  label.fontWeight =
    isSelected || isFocused
      ? "700"
      : "600";

  label.backgroundColor =
    "rgba(2,6,23,0.82)";

  label.padding =
    [2, 3];

  label.borderRadius =
    2;

  label.borderWidth =
    isSelected || isFocused
      ? 0.5
      : 0;

  label.borderColor =
    color;

  label.strokeWidth =
    0.25;

  label.strokeColor =
    "#020617";

  label.offsetY =
    -4;

  return label;
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

  return getGraphIcon(
    node.iconType ?? node.type
  ).color;
}

function createCanonicalNodeObject(
  node: ProjectedNode,
  focusedEventId: string | null | undefined,
  selection: WorkspaceSelection,
): Group {
  const icon =
    getGraphIcon(
      node.iconType ?? node.type
    );

  const isSelected =
    selection.kind === "NODE" &&
    selection.nodeId === node.id;

  const isFocused =
    node.id === focusedEventId;

  const glyphColor =
    nodeColor(
      node,
      focusedEventId,
      selection,
    );

  const glyphHeight =
    isFocused
      ? 17
      : isSelected
        ? 15
        : Math.max(
            12,
            icon.size * 0.72,
          );

  const glyph =
    new SpriteText(
      icon.icon,
      glyphHeight,
      glyphColor,
    );

  glyph.fontFace =
    "Segoe UI Emoji";

  glyph.fontWeight =
    "700";

  glyph.backgroundColor =
    isSelected
      ? "rgba(120,53,15,0.92)"
      : isFocused
        ? "rgba(3,105,161,0.92)"
        : "rgba(2,6,23,0.88)";

  glyph.padding =
    [3, 3.5];

  glyph.borderRadius =
    4;

  glyph.borderWidth =
    isSelected || isFocused
      ? 0.8
      : 0.4;

  glyph.borderColor =
    glyphColor;

  glyph.strokeWidth =
    0.18;

  glyph.strokeColor =
    "#020617";

  const group =
    new Group();

  group.add(glyph);

  const label =
    createPersistentNodeLabel(
      node,
      focusedEventId,
      selection,
    );

  if (label) {
    label.offsetY = -14;
    group.add(label);
  }

  return group;
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
  onCameraChange,
}: InvestigationGraph3DProps) {
  const graphRef =
    useRef<
      ForceGraphMethods | undefined
    >(
      undefined
    );

  const [
    cameraSnapshot,
    setCameraSnapshot,
  ] = useState<
    ManifoldCameraSnapshot3D | null
  >(null);

  const fittedTopologyRef =
    useRef<string | null>(null);

  const topologyIdentity =
    useMemo(
      () =>
        [
          ...nodes.map(node => node.id),
          "::",
          ...edges.map(edge => edge.id),
        ].join("|"),
      [nodes, edges],
    );

  const getNavigationControls =
    useCallback(
      () =>
        graphRef.current?.controls() as
          | NavigationControls3D
          | undefined,
      [],
    );

  const publishCameraSnapshot =
    useCallback(
      () => {
        const graph =
          graphRef.current;

        const controls =
          getNavigationControls();

        if (!graph || !controls) {
          return;
        }

        const camera =
          graph.camera();

        const snapshot: ManifoldCameraSnapshot3D = {
          position: {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
          },
          target: {
            x: controls.target.x,
            y: controls.target.y,
            z: controls.target.z,
          },
        };

        setCameraSnapshot(snapshot);
        onCameraChange?.(snapshot);
      },
      [
        getNavigationControls,
        onCameraChange,
      ],
    );

  const fitCamera =
    useCallback(
      () => {
        const graph =
          graphRef.current;

        const controls =
          getNavigationControls();

        if (
          !graph ||
          nodes.length === 0
        ) {
          return;
        }

        const projectedPoints =
          nodes.map(
            node => ({
              x: node.x ?? 0,
              y: node.y ?? 0,
              z: stableDepth(node.id),
            }),
          );

        const minX =
          Math.min(
            ...projectedPoints.map(
              point => point.x,
            ),
          );

        const maxX =
          Math.max(
            ...projectedPoints.map(
              point => point.x,
            ),
          );

        const minY =
          Math.min(
            ...projectedPoints.map(
              point => point.y,
            ),
          );

        const maxY =
          Math.max(
            ...projectedPoints.map(
              point => point.y,
            ),
          );

        const minZ =
          Math.min(
            ...projectedPoints.map(
              point => point.z,
            ),
          );

        const maxZ =
          Math.max(
            ...projectedPoints.map(
              point => point.z,
            ),
          );

        const target: Point3D = {
          x: (minX + maxX) / 2,
          y: (minY + maxY) / 2,
          z: (minZ + maxZ) / 2,
        };

        const topologyRadius =
          Math.max(
            ...projectedPoints.map(
              point =>
                Math.hypot(
                  point.x - target.x,
                  point.y - target.y,
                  point.z - target.z,
                ),
            ),
            1,
          );

        const aspectRatio =
          Math.max(
            width /
              Math.max(height, 1),
            0.1,
          );

        const verticalFieldOfView =
          Math.PI / 3;

        const limitingFieldOfView =
          aspectRatio < 1
            ? 2 *
              Math.atan(
                Math.tan(
                  verticalFieldOfView / 2,
                ) *
                  aspectRatio,
              )
            : verticalFieldOfView;

        const requestedDistance =
          (
            topologyRadius /
            Math.sin(
              limitingFieldOfView / 2,
            )
          ) *
          1.35;

        const cameraDistance =
          Math.min(
            1200,
            Math.max(
              120,
              requestedDistance,
            ),
          );

        controls?.target.set?.(
          target.x,
          target.y,
          target.z,
        );

        controls?.update?.();

        graph.cameraPosition(
          {
            x: target.x,
            y: target.y,
            z:
              target.z +
              cameraDistance,
          },
          target,
          160,
        );

        publishCameraSnapshot();
      },
      [
        getNavigationControls,
        height,
        nodes,
        publishCameraSnapshot,
        width,
      ],
    );

  const handleEngineStop =
    useCallback(
      () => {
        if (
          fittedTopologyRef.current ===
          topologyIdentity
        ) {
          return;
        }

        fittedTopologyRef.current =
          topologyIdentity;

        fitCamera();
      },
      [
        fitCamera,
        topologyIdentity,
      ],
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

      if (!controls) {
        return;
      }

      controls.minDistance = 120;
      controls.maxDistance = 1200;
      controls.update?.();

      const handleControlsChange =
        () => publishCameraSnapshot();

      controls.addEventListener?.(
        "change",
        handleControlsChange,
      );

      publishCameraSnapshot();

      return () => {
        controls.removeEventListener?.(
          "change",
          handleControlsChange,
        );
      };
    },
    [
      getNavigationControls,
      graphData,
      height,
      publishCameraSnapshot,
      width,
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
        onEngineStop={handleEngineStop}
        width={Math.max(width, 1)}
        height={Math.max(height, 1)}
        graphData={graphData}
        backgroundColor="#050b16"
        showNavInfo={false}
        enableNodeDrag={false}
        cooldownTicks={0}
        nodeLabel={node => {
          const projected =
            node as ProjectedNode;

          return [
            `NODE — ${projected.label}`,
            "A canonical object in the Investigation Graph.",
            "Single-click: inspect in Selection Intelligence.",
            "Double-click: add to Research Inbox.",
          ].join("<br />");
        }}
        linkLabel={link => {
          const projected =
            link as ProjectedLink;

          return [
            `EDGE — ${projected.id}`,
            "A canonical relationship connecting two nodes.",
            "Single-click: inspect in Selection Intelligence.",
            "Double-click: add to Research Inbox.",
          ].join("<br />");
        }}
        nodeThreeObject={(node: unknown) =>
          createCanonicalNodeObject(
            node as ProjectedNode,
            focusedEventId,
            selection,
          )
        }
        nodeThreeObjectExtend={false}
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
        linkColor={link => {

          const projectedLink =
            link as ProjectedLink;

          const selected =
            selection.kind === "EDGE" &&
            selection.edgeId ===
              projectedLink.id;

          return selected
            ? SELECTED_EDGE_COLOR
            : getEdgePresentation(
                projectedLink.relationship,
              ).color;

        }}
        linkOpacity={0.46}
        linkWidth={link =>
          selection.kind === "EDGE" &&
          selection.edgeId ===
            (link as ProjectedLink).id
            ? 3.5
            : Math.max(
                1.05,
                (link as ProjectedLink).weight * 3,
              )
        }
        linkDirectionalArrowLength={link => {

          const projectedLink =
            link as ProjectedLink;

          if (
            !getEdgePresentation(
              projectedLink.relationship,
            ).directed
          ) {
            return 0;
          }

          return (
            selection.kind === "EDGE" &&
            selection.edgeId ===
              projectedLink.id
          )
            ? 7
            : 4.5;

        }}
        linkDirectionalArrowColor={link => {

          const projectedLink =
            link as ProjectedLink;

          return (
            selection.kind === "EDGE" &&
            selection.edgeId ===
              projectedLink.id
          )
            ? SELECTED_EDGE_COLOR
            : getEdgePresentation(
                projectedLink.relationship,
              ).color;

        }}
        linkDirectionalArrowRelPos={0.72}
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

      <ManifoldMapInstrument
        nodes={nodes}
        edges={edges}
        focusedEventId={focusedEventId}
        selection={selection}
        camera={cameraSnapshot}
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
