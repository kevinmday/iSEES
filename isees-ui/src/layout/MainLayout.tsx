// ============================================================
// src/layout/MainLayout.tsx — OPERATOR CONSOLE SHELL (V7)
// EPISTEMIC OPERATOR MODE SURFACE INTEGRATED
// SYSTEM BRIEFING LINK ADDED
// FULL DROP-IN REPLACEMENT
// ============================================================

import { Link } from "react-router-dom";

import { useEventContext } from "../context/EventContext";

import {
  useWorkspace,
} from "../workspace/context/WorkspaceContext";

import {
  useWorkspaceRuntime,
} from "../workspace/runtime/WorkspaceRuntimeContext";

import {
  WorkspaceMode,
} from "../workspace/runtime/WorkspaceRuntimeTypes";

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

  const runtime =
    useWorkspaceRuntime();

  const activeWorkspaceMode =
    runtime.getActiveMode();

console.log(
  "MainLayout:",
  activeWorkspaceMode,
);



  const workspaceTitle = (() => {

    switch (activeWorkspaceMode) {

      case WorkspaceMode.OVERVIEW:
        return "Overview Workspace";

      case WorkspaceMode.MANIFOLD:
        return "Primary Investigation Manifold";

      case WorkspaceMode.COMPARE:
        return "Comparative Analysis Workspace";

      case WorkspaceMode.NARRATIVE:
        return "Narrative Reconstruction Workspace";

      case WorkspaceMode.EVIDENCE:
        return "Evidence Workspace";

      case WorkspaceMode.TIMELINE:
        return "Timeline Workspace";

      case WorkspaceMode.LAYERS:
        return "Layer Analysis Workspace";

      case WorkspaceMode.INTENTION:
        return "Intention Analysis Workspace";

      case WorkspaceMode.RESEARCH:
        return "Research Workspace";

      default:
        return "Primary Investigation Manifold";

    }

  })();

  const workspaceDescription = (() => {

    switch (activeWorkspaceMode) {

      case WorkspaceMode.OVERVIEW:
        return "Operational overview of the active investigation.";

      case WorkspaceMode.MANIFOLD:
        return "Deterministic visualization of the active investigation manifold.";

      case WorkspaceMode.COMPARE:
        return "Comparative analysis across investigation candidates.";

      case WorkspaceMode.NARRATIVE:
        return "Narrative reconstruction of the active investigation.";

      case WorkspaceMode.EVIDENCE:
        return "Evidence supporting the active investigation.";

      case WorkspaceMode.TIMELINE:
        return "Temporal progression of the active investigation.";

      case WorkspaceMode.LAYERS:
        return "Deterministic investigation layer analysis.";

      case WorkspaceMode.INTENTION:
        return "Candidate intention analysis derived from deterministic computation.";

      case WorkspaceMode.RESEARCH:
        return "Research artifacts associated with the active investigation.";

      default:
        return "Deterministic visualization of the active investigation manifold.";

    }

  })();

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
          height: 42,
          minHeight: 42,
          borderBottom: "1px solid #182235",
          background: "#0b1220",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 16,
          paddingRight: 16,
          flexShrink: 0,
        }}
      >
        {/* LEFT */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              fontSize: 21,
              fontWeight: 800,
              letterSpacing: 1,
            }}
          >
            iSEES-UAP
          </div>

          <div
            style={{
              fontSize: 13,
              color: "#94a3b8",
              letterSpacing: 1,
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
            gap: 24,
            fontSize: 11,
            textTransform: "uppercase",
            color: "#9ca3af",
          }}
        >
          <Link
            to="/briefing"
            style={{
              color: "#7dd3fc",
              textDecoration: "none",
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            SYSTEM BRIEFING
          </Link>

          <span>
            STATUS:
            <span
              style={{
                color: "#4ade80",
                marginLeft: 6,
                fontWeight: 700,
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
                color: "#38bdf8",
                marginLeft: 6,
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
          height: 58,
          minHeight: 58,
          borderBottom: "1px solid #182235",
          background: "#08101d",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: 18,
          paddingRight: 18,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "#4ade80",
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Primary Signal | Event Acquired & Confirmed
        </div>

        <div
          style={{
            marginTop: 8,
            display: "flex",
            gap: 26,
            flexWrap: "wrap",
            fontSize: 12,
            color: "#d1d5db",
          }}
        >
          <span>
            EVENT:{" "}
            {activeEvent?.id || "NO ACTIVE EVENT"}
          </span>

          <span>
            CONFIDENCE:{" "}
            {activeEvent?.confidence || "--"}
          </span>

          <span>
            CLUSTERS:{" "}
            {activeEvent?.clusters || "--"}
          </span>

          <span>
            REPORTS:{" "}
            {activeEvent?.reports || "--"}
          </span>

          <span>
            STATUS:{" "}
            {activeEvent?.escalation || "--"}
          </span>

          <span>
            RECURRENCE:{" "}
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
            width: 320,
            minWidth: 320,
            maxWidth: 320,

            background: "#070d18",

            border: "1px solid #182235",
            borderRadius: 10,

            display: "flex",
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
        {/* CENTER PANEL — PRIMARY INVESTIGATION MANIFOLD */}
        {/* ================================================= */}

        <div
          style={{
            flex: 1,

            minWidth: 0,

            background: "#09111f",

            overflowY: "auto",
            overflowX: "hidden",

            scrollbarGutter: "stable both-edges",
          }}
        >
          <div
            style={{
              width: "100%",

              margin: 0,

              padding: "16px",

              boxSizing: "border-box",
            }}
          >
            {/* CENTER HEADER */}

            <div
              style={{
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  fontSize: 18,

                  fontWeight: 700,

                  color: "#f8fafc",
                }}
              >
                {workspaceTitle}
              </div>

              <div
                style={{
                  marginTop: 6,

                  fontSize: 12,

                  color: "#94a3b8",

                  lineHeight: 1.5,

                  maxWidth: 760,
                }}
              >
              {workspaceDescription}
              </div>
            </div>

            {/* CENTER CONTENT */}

            <div>{center}</div>
          </div>
        </div>

                {/* ================================================= */}
        {/* RIGHT PANEL — SELECTION INTELLIGENCE */}
        {/* ================================================= */}

        <div
          style={{
            width: 340,
            minWidth: 340,
            maxWidth: 340,
            background: "#070d18",
            display: "flex",
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