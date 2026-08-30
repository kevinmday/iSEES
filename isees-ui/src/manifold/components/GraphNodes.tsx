// ============================================================
// src/manifold/components/GraphNodes.tsx
// P41B
// GRAPH NODES
//
// Owns
// • Node presentation
// • Node glyph rendering
// • Node labels
// • Node click handling
// • Node focus presentation
// • Center node presentation
//
// Does NOT own
// • Graph computation
// • Runtime
// • Selection state ownership
// • Viewport
//
// NOTE
// Behavior matches the existing InvestigationGraph node
// rendering so the extraction can occur without changing
// functionality.
// ============================================================

import GraphNodeGlyph
from "./GraphNodeGlyph";

import type {
  GraphNode,
  GraphSelection,
} from "../graphTypes";

// ============================================================
// TYPES
// ============================================================

export interface GraphNodesProps {

  nodes:
    GraphNode[];

  selection:
    GraphSelection;

  focusedNodeIds:
    Set<string>;

  centerNodeId:
    string | null;

  setCenterNodeId: (
    nodeId: string
  ) => void;

  setSelection: (
    selection: GraphSelection
  ) => void;

  // ==========================================================
  // OPTIONAL COLLECTION CALLBACK
  // ==========================================================

  onCollectNode?: (
    node: GraphNode
  ) => void;

}

// ============================================================
// COMPONENT
// ============================================================

export default function GraphNodes({

  nodes,
  selection,
  focusedNodeIds,
  centerNodeId,
  setCenterNodeId,
  setSelection,
  onCollectNode,

}: GraphNodesProps) {

  return (

    <>

      {nodes.map(
        node => {

          const focused =
            focusedNodeIds.has(
              node.id
            );

          const selected =
            selection.kind === "NODE" &&
            selection.nodeId === node.id;

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

          // ==================================================
          // LABEL PROJECTION
          // ==================================================
          //
          // Labels project away from the Manifold center so that
          // peripheral node labels consume exterior space rather
          // than crossing topology toward neighboring node
          // territories.
          //
          // Every non-central node type uses the same deterministic
          // horizontal projection rule. The explicitly centered
          // node retains centered label presentation.
          //
          // ==================================================

          const nodeX =
            node.x ?? 0;

          const peripheralLabel =
            !centered;

          const horizontalThreshold =
            24;

          const projectsLeft =
            peripheralLabel &&
            nodeX < -horizontalThreshold;

          const projectsRight =
            peripheralLabel &&
            nodeX > horizontalThreshold;

          const labelX =
            projectsLeft
              ? -(glyphSize + 10)
              : projectsRight
                ? glyphSize + 10
                : 0;

          const labelY =
            projectsLeft ||
            projectsRight
              ? 4
              : glyphSize + 18;

          const labelAnchor =
            projectsLeft
              ? "end"
              : projectsRight
                ? "start"
                : "middle";

          return (

            <g
              key={node.id}
              transform={`translate(${node.x ?? 0}, ${node.y ?? 0})`}

              onClick={() => {

                setSelection({

                  kind: "NODE",

                  nodeId:
                    node.id,

                  nodeType:
                    node.type,

                });
}}

              onDoubleClick={() => {

                setCenterNodeId(
                  node.id
                );

                onCollectNode?.(
                  node
                );

              }}

              style={{
                cursor: "pointer",
              }}
            >

              <circle
                r={16}
                fill="transparent"
                style={{
                  cursor: "pointer",
                }}
              />

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
                x={labelX}
                y={labelY}
                textAnchor={labelAnchor}
                dominantBaseline={
                  projectsLeft ||
                  projectsRight
                    ? "middle"
                    : undefined
                }
                fill="#d1d5db"
                stroke="#020617"
                strokeWidth="3"
                strokeLinejoin="round"
                paintOrder="stroke"
                fontSize="11"
                fontWeight="600"
                style={{
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                {node.label}
              </text>

            </g>

          );

        }
      )}

    </>

  );

}