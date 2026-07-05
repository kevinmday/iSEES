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
}

export default function Tooltip({
  text,
  children,
}: TooltipProps) {
  const [visible, setVisible] =
    useState(false);

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
      }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}

      <div
        style={{
          position: "absolute",

          bottom: "calc(100% + 14px)",

          left: "0",

          width: 340,

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

            left: 22,

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