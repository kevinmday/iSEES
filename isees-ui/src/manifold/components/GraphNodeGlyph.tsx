// ============================================================
// src/manifold/components/GraphNodeGlyph.tsx
// P25.5A GRAPH ICONOLOGY FOUNDATION
// DETERMINISTIC SVG NODE GLYPHS
// FULL DROP-IN FILE
// ============================================================

import type {
  GraphNodeType,
} from "../graphTypes";

interface GraphNodeGlyphProps {
  type: GraphNodeType;
  selected?: boolean;
  focused?: boolean;
  size?: number;
}

export default function GraphNodeGlyph({
  type,
  selected = false,
  focused = false,
  size = 16,
}: GraphNodeGlyphProps) {
  const fill = selected
    ? "#f59e0b"
    : focused
      ? "#3b82f6"
      : "#1e293b";

  const stroke = selected
    ? "#fde68a"
    : focused
      ? "#93c5fd"
      : "#334155";

  const strokeWidth = selected ? 2.5 : 2;

  const r = size;

  switch (type) {
    // --------------------------------------------------------
    // EVENT
    // --------------------------------------------------------
    case "EVENT":
      return (
        <circle
          r={r}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );

    // --------------------------------------------------------
    // FACILITY
    // --------------------------------------------------------
    case "FACILITY":
      return (
        <rect
          x={-r}
          y={-r}
          width={r * 2}
          height={r * 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          rx={2}
        />
      );

    // --------------------------------------------------------
    // ARTIFACT (diamond)
    // --------------------------------------------------------
    case "ARTIFACT":
      return (
        <polygon
          points={`
            0,-${r}
            ${r},0
            0,${r}
            -${r},0
          `}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );

    // --------------------------------------------------------
    // PERSON (triangle)
    // --------------------------------------------------------
    case "PERSON":
      return (
        <polygon
          points={`
            0,-${r}
            ${r},${r}
            -${r},${r}
          `}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );

    // --------------------------------------------------------
    // ORGANIZATION (hexagon)
    // --------------------------------------------------------
    case "ORGANIZATION":
      return (
        <polygon
          points={`
            -${r * 0.85},-${r * 0.5}
            0,-${r}
            ${r * 0.85},-${r * 0.5}
            ${r * 0.85},${r * 0.5}
            0,${r}
            -${r * 0.85},${r * 0.5}
          `}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );

    // --------------------------------------------------------
    // LOCATION (crosshair)
    // --------------------------------------------------------
    case "LOCATION":
      return (
        <g>
          <circle
            r={r * 0.8}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />

          <line
            x1={-r}
            y1={0}
            x2={r}
            y2={0}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />

          <line
            x1={0}
            y1={-r}
            x2={0}
            y2={r}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </g>
      );

    // --------------------------------------------------------
    // NARRATIVE (star)
    // --------------------------------------------------------
    case "NARRATIVE":
      return (
        <polygon
          points={`
            0,-${r}
            ${r * 0.25},-${r * 0.25}
            ${r},0
            ${r * 0.25},${r * 0.25}
            0,${r}
            -${r * 0.25},${r * 0.25}
            -${r},0
            -${r * 0.25},-${r * 0.25}
          `}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );

    // --------------------------------------------------------
    // HYPOTHESIS (octagon)
    // --------------------------------------------------------
    case "HYPOTHESIS":
      return (
        <polygon
          points={`
            -${r * 0.4},-${r}
            ${r * 0.4},-${r}
            ${r},-${r * 0.4}
            ${r},${r * 0.4}
            ${r * 0.4},${r}
            -${r * 0.4},${r}
            -${r},${r * 0.4}
            -${r},-${r * 0.4}
          `}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );

    // --------------------------------------------------------
    // FALLBACK
    // --------------------------------------------------------
    default:
      return (
        <circle
          r={r}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
  }
}