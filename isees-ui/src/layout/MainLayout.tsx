// ============================================================
// src/layout/MainLayout.tsx — OPERATOR CONSOLE SHELL (V7)
// EPISTEMIC OPERATOR MODE SURFACE INTEGRATED
// SYSTEM BRIEFING LINK ADDED
// FULL DROP-IN REPLACEMENT
// ============================================================

import { useState } from "react";

import { Link } from "react-router-dom";
import { useEventContext } from "../context/EventContext";

import {
  useWorkspace,
} from "../workspace/context/WorkspaceContext";

import WorkspaceModeBar
  from "../components/workspace/WorkspaceModeBar";

// ============================================================
// MAIN LAYOUT
// ============================================================

export default function MainLayout({
  left,
  center,
  right,
}: any) {

  const {
    events,
    operatorMode,
  } = useEventContext();

  const {
    focusedEventId,
  } = useWorkspace();

  const [
    workspaceExpanded,
    setWorkspaceExpanded,
  ] = useState(false);

  const activeEvent =
    events.find(
      event => event.id === focusedEventId
    ) ?? null;

  return (

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        background: "#060b14",
        color: "#f8fafc",
        overflow: "hidden",
        fontFamily: "Consolas, monospace",
      }}
    >

      {/* ===================================================== */}
      {/* TOP COMMAND BAR */}
      {/* ===================================================== */}

      <div
        style={{
          height: "var(--header-height)",
          minHeight: "var(--header-height)",

          borderBottom: "var(--surface-border)",

          background: "var(--surface-2)",

          display: "flex",

          alignItems: "center",

          justifyContent: "space-between",

          paddingLeft: "var(--space-lg)",

          paddingRight: "var(--space-lg)",

          flexShrink: 0,
        }}
      >

        {/* LEFT */}

        <div
          style={{
            display: "flex",

            alignItems: "center",

            gap: "var(--space-lg)",
          }}
        >

          <div
            style={{
              fontFamily: "var(--font-family-mono)",

              fontSize: "var(--font-workspace)",

              fontWeight: "var(--weight-bold)",

              lineHeight: "var(--line-tight)",

              color: "var(--text-primary)",
            }}
          >
            iSEES-UAP
          </div>

          <div
            style={{
              fontFamily: "var(--font-family-sans)",

              fontSize: "var(--font-meta)",

              color: "var(--text-caption)",

              letterSpacing: "var(--tracking-system)",

              textTransform: "uppercase",
            }}
          >
            Emergence Detection System
          </div>

        </div>

        {/* RIGHT */}

        <div
          style={{
            display: "flex",

            alignItems: "center",

            gap: "var(--space-xl)",

            fontFamily: "var(--font-family-sans)",

            fontSize: "var(--font-micro)",

            color: "var(--text-caption)",

            letterSpacing: "var(--tracking-system)",

            textTransform: "uppercase",
          }}
        >

          <Link
            to="/briefing"
            style={{
              color: "var(--color-information)",

              textDecoration: "none",

              fontWeight: "var(--weight-semibold)",
            }}
          >
            SYSTEM BRIEFING
          </Link>

          <span>
            STATUS:

            <span
              style={{
                color: "var(--color-success)",

                marginLeft: "var(--space-xs)",

                fontWeight: "var(--weight-bold)",
              }}
            >
              ACTIVE
            </span>

          </span>

          <span>
            MODE: {operatorMode} ANALYSIS
          </span>

          <span>

            MANIFOLD:

            <span
              style={{
                color: "var(--color-information)",

                marginLeft: "var(--space-xs)",

                fontWeight: "var(--weight-semibold)",
              }}
            >
              ONLINE
            </span>

          </span>

        </div>

      </div>

      {/* ===================================================== */}
      {/* PRIMARY SIGNAL STRIP */}
      {/* ===================================================== */}

      <div
        style={{
          minHeight: 58,

          height: 58,

          flexShrink: 0,

          display: "flex",

          flexDirection: "column",

          justifyContent: "center",

          paddingLeft: "var(--space-lg)",

          paddingRight: "var(--space-lg)",

          background: "var(--surface-1)",

          borderBottom: "var(--surface-border)",
        }}
      >

        <div
          style={{
            fontFamily: "var(--font-family-sans)",

            fontSize: "var(--font-micro)",

            fontWeight: "var(--weight-bold)",

            letterSpacing: "var(--tracking-system)",

            textTransform: "uppercase",

            color: "var(--color-success)",
          }}
        >
          Primary Signal · Event Acquired & Confirmed
        </div>

        <div
          style={{
            marginTop: "var(--space-xs)",

            display: "flex",

            flexWrap: "wrap",

            gap: "var(--space-xl)",

            fontFamily: "var(--font-family-mono)",

            fontSize: "var(--font-meta)",

            color: "var(--text-secondary)",
          }}
        >

          <span>
            EVENT&nbsp;
            {activeEvent?.id || "NO ACTIVE EVENT"}
          </span>

          <span>
            CONFIDENCE&nbsp;
            {activeEvent?.confidence || "--"}
          </span>

          <span>
            CLUSTERS&nbsp;
            {activeEvent?.clusters || "--"}
          </span>

          <span>
            REPORTS&nbsp;
            {activeEvent?.reports || "--"}
          </span>

          <span>
            STATUS&nbsp;
            {activeEvent?.escalation || "--"}
          </span>

          <span>
            RECURRENCE&nbsp;
            {activeEvent?.recurrence || "--"}
          </span>

        </div>

      </div>

      {/* ===================================================== */}
      {/* MAIN OPERATOR BODY */}
      {/* ===================================================== */}

      <div
        style={{
          display: "flex",

          flex: 1,

          minHeight: 0,

          overflow: "hidden",

          padding: "12px",

          gap: "12px",

          background: "#060b14",
        }}
      >
  
        {/* ================================================= */}
        {/* LEFT PANEL — INVESTIGATION CONTROL */}
        {/* ================================================= */}

        <div
          style={{
            display: workspaceExpanded
              ? "none"
              : "flex",

            width: 220,
            minWidth: 220,
            maxWidth: 220,

            background: "#070d18",

            border: "1px solid #182235",
            borderRadius: 10,

            flexDirection: "column",

            overflow: "hidden",

            flexShrink: 0,
          }}
        >
          <div
            style={{
              flex: 1,

              overflowY: "auto",

              padding: "18px",

              scrollbarGutter: "stable",
            }}
          >
            {left}
          </div>
        </div>
        {/* ================================================= */}
        {/* CENTER PANEL — WORKSPACE PROJECTION */}
        {/* ================================================= */}

        <div
          style={{
            flex: 1,

            minWidth: 0,

            display: "flex",
            flexDirection: "column",

            background: "#09111f",

            overflow: "hidden",
          }}
        >

          {/* =============================================== */}
          {/* WORKSPACE TOOLBAR */}
          {/* =============================================== */}

          <div
            style={{
              display: "flex",

              justifyContent: "flex-end",

              alignItems: "center",

              padding: "12px 16px",

              borderBottom: "1px solid #182235",

              background: "#0b1220",

              flexShrink: 0,
            }}
          >
            <button
              onClick={() =>
                setWorkspaceExpanded(
                  !workspaceExpanded
                )
              }
              style={{
                padding: "6px 12px",

                background: "#162033",

                color: "#e2e8f0",

                border: "1px solid #263347",

                borderRadius: 6,

                cursor: "pointer",

                fontSize: 12,

                fontWeight: 600,
              }}
            >
              {workspaceExpanded
                ? "Restore"
                : "Expand"}
            </button>
          </div>

          {/* =============================================== */}
          {/* WORKSPACE PROJECTION HOST */}
          {/* Runtime-owned investigation workspace */}
          {/* =============================================== */}
          {/*
              The projection host owns the physical workspace
              bounds.

              Workspace surfaces receive a stable flex region
              rather than participating in document-style
              vertical scrolling.

              Individual workspaces may own scrolling internally
              when their interaction model requires it.
          */}
          {/* =============================================== */}

          <div
            style={{
              flex: 1,

              minWidth: 0,
              minHeight: 0,

              width: "100%",

              display: "flex",
              flexDirection: "column",

              overflow: "hidden",

              margin: 0,

              padding: "16px",

              boxSizing: "border-box",
            }}
          >
            {/* ============================================= */}
            {/* ACTIVE WORKSPACE SURFACE */}
            {/* ============================================= */}

            {center}

          </div>

        </div>
         {/* ================================================= */}
        {/* RIGHT PANEL — SELECTION INTELLIGENCE */}
        {/* ================================================= */}

        <div
          style={{
            display: workspaceExpanded
              ? "none"
              : "flex",

            width: 300,
            minWidth: 300,
            maxWidth: 300,

            background: "#070d18",

            flexDirection: "column",

            overflow: "hidden",

            flexShrink: 0,
          }}
        >
          {/* HEADER */}

          <div
            style={{
              padding: 14,
              borderBottom: "1px solid #182235",
              background: "#0b1220",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Selection Intelligence
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                color: "#94a3b8",
              }}
            >
              Deterministic analysis of the active selection.
            </div>
          </div>

          {/* CONTENT */}

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 12,
            }}
          >
            {right}
          </div>

        </div>

      </div>

{/* ========================================================== */}
{/* WORKSPACE MODE BAR */}
{/* ========================================================== */}

<WorkspaceModeBar />

      {/* ===================================================== */}
      {/* FOOTER STATUS STRIP */}
      {/* ===================================================== */}

      <div
        style={{
          height: 28,
          minHeight: 28,
          borderTop: "1px solid #182235",
          background: "#0b1220",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 14,
          paddingRight: 14,
          fontSize: 10,
          color: "#94a3b8",
          flexShrink: 0,
          letterSpacing: 0.5,
        }}
      >
        <div>VERSION: v0.9-operator-shell</div>

        <div>
          SYSTEM STATE: {operatorMode}
        </div>

        <div>
          EVENT MANIFOLD: SYNCHRONIZED
        </div>
      </div>
    </div>
  );
}