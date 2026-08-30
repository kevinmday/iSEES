// ============================================================
// src/manifold/components/InvestigationGraph3D.tsx
// P57-UI-A7-I2
// DETERMINISTIC THREE-DIMENSIONAL MANIFOLD PROJECTION
//
// Presentation only. Canonical topology and selection remain
// owned by their existing deterministic runtimes.
// ============================================================

import {
  useMemo,
} from "react";

import ForceGraph3D
from "react-force-graph-3d";

import type {
  GraphEdge,
  GraphNode,
} from "../graphTypes";

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

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#050b16",
      }}
    >
      <ForceGraph3D
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

      <div
        style={{
          position: "absolute",
          right: 16,
          bottom: 14,
          color: "#64748b",
          fontFamily: "Consolas, monospace",
          fontSize: 10,
          letterSpacing: "0.08em",
          pointerEvents: "none",
        }}
      >
        3D · DETERMINISTIC FIXED PROJECTION
      </div>
    </div>
  );
}
