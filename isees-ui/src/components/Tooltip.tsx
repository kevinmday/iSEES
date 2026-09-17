// ============================================================
// src/components/Tooltip.tsx
// P32.2
// OPERATOR TOOLTIP
//
// Lightweight reusable tooltip component.
//
// FULL DROP-IN REPLACEMENT
// ============================================================

import { useState } from "react";

import type { ReactNode } from "react";

interface TooltipProps {
  text: string;
  children: ReactNode;
  placement?: "left" | "right";
}

export default function Tooltip({
  text,
  children,
  placement = "right",
}: TooltipProps) {
  const [hovered, setHovered] =
    useState(false);
  const [focused, setFocused] =
    useState(false);
  const visible = hovered || focused;
  const opensLeft = placement === "left";

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}

      <div
        style={{
          position: "absolute",

          bottom: "calc(100% + 14px)",

          left: opensLeft ? "auto" : 0,

          right: opensLeft ? 0 : "auto",

          width: opensLeft ? 232 : 340,

          maxWidth: "calc(100vw - 32px)",

          boxSizing: "border-box",

          whiteSpace: "normal",

          overflowWrap: "anywhere",

          padding: "12px 14px",

          background: "#0b1220",

          color: "#d1d5db",

          border: "1px solid #334155",

          borderRadius: 8,

          fontSize: 12,

          lineHeight: 1.55,

          boxShadow:
            "0 10px 30px rgba(0,0,0,.45)",

          textAlign: "left",

          zIndex: 9999,

          pointerEvents: "none",

          opacity: visible ? 1 : 0,

          transform: visible
            ? "translateY(0)"
            : "translateY(4px)",

          transition:
            "opacity 140ms ease, transform 140ms ease",

          visibility: visible
            ? "visible"
            : "hidden",
        }}
      >
        {text}

        <div
          style={{
            position: "absolute",

            top: "100%",

            left: opensLeft ? "auto" : 22,

            right: opensLeft ? 22 : "auto",

            width: 0,
            height: 0,

            borderLeft:
              "7px solid transparent",

            borderRight:
              "7px solid transparent",

            borderTop:
              "7px solid #334155",
          }}
        />
      </div>
    </div>
  );
}
