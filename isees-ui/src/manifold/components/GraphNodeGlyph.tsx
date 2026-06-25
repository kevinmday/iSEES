// ============================================================
// src/manifold/components/GraphNodeGlyph.tsx
// P25.5A GRAPH ICONOLOGY FOUNDATION
// DETERMINISTIC SVG NODE GLYPHS
// FULL DROP-IN FILE
// ============================================================

import type {
  GraphNodeType,
  GraphIconType,
} from "../graphTypes";

import {
  getGraphIcon,
} from "../iconology/iconRegistry";


interface GraphNodeGlyphProps {

  type: GraphNodeType;

  iconType?: GraphIconType;

  selected?: boolean;

  focused?: boolean;

  size?: number;

}


export default function GraphNodeGlyph({
  type,
  iconType,
  selected = false,
  focused = false,
  size = 16,
}: GraphNodeGlyphProps) {

  const icon =
  getGraphIcon(
    iconType ?? type
  );

const fill =
  selected
    ? "#f59e0b"
    : focused
      ? "#3b82f6"
      : icon.color;


  return (

    <text
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={size}
      fill={fill}
      style={{

        userSelect: "none",

        pointerEvents: "none",

      }}

    >
      {icon.icon}
    </text>

  );

}