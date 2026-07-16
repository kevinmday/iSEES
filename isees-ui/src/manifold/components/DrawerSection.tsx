// ============================================================
// DrawerSection.tsx
// P39B
// PRODUCTION DRAWER SECTION
//
// Canonical expandable section used throughout the
// Production Manifold Workspace.
//
// P39B:
// • Presentation only
// • Always expanded
// • Collapse behavior added later
//
// Owns
// • Drawer presentation
// • Drawer typography
// • Drawer spacing
//
// Does NOT own
// • Runtime
// • Selection
// • Business logic
//
// ============================================================

import type { ReactNode } from "react";

// ============================================================
// TYPES
// ============================================================

interface DrawerSectionProps {

  title: string;

  children: ReactNode;

}

// ============================================================
// COMPONENT
// ============================================================

export default function DrawerSection({

  title,

  children,

}: DrawerSectionProps) {

  return (

    <section
      style={{

        border: "1px solid #334155",

        borderRadius: 10,

        background: "#0f172a",

        overflow: "hidden",

      }}
    >

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div
        style={{

          display: "flex",

          alignItems: "center",

          gap: 10,

          padding: "10px 14px",

          background: "#111c2d",

          borderBottom: "1px solid #334155",

          userSelect: "none",

        }}
      >

        <span
          style={{

            color: "#60a5fa",

            fontSize: 12,

            width: 14,

            textAlign: "center",

          }}
        >
          ▼
        </span>

        <span
          style={{

            color: "#f8fafc",

            fontSize: 13,

            fontWeight: 700,

            letterSpacing: 1,

            textTransform: "uppercase",

          }}
        >
          {title}
        </span>

      </div>

      {/* ====================================================== */}
      {/* CONTENT */}
      {/* ====================================================== */}

      <div
        style={{

          padding: 12,

        }}
      >

        {children}

      </div>

    </section>

  );

}