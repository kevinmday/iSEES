// ============================================================
// src/layout/MainLayout.tsx — OPERATOR CONSOLE SHELL (V7)
// EPISTEMIC OPERATOR MODE SURFACE INTEGRATED
// SYSTEM BRIEFING LINK ADDED
//
// P57-UI-A5
// SELECTION INTELLIGENCE SHELL CONNECTED
//
// FULL DROP-IN REPLACEMENT
// ============================================================

import { useState } from "react";
import { Link } from "react-router-dom";

import { useEventContext } from "../context/EventContext";

import {
  useWorkspaceMode,
} from "../workspace/runtime/WorkspaceRuntimeContext";
import { WorkspaceMode } from "../workspace/runtime/WorkspaceRuntimeTypes";

import {
  getWorkspaceModeLabel,
} from "../workspace/presentation/WorkspaceModePresentation";

import WorkspaceModeBar
  from "../components/workspace/WorkspaceModeBar";

import ManifoldProjectionStatus
  from "../components/workspace/ManifoldProjectionStatus";

import "../components/SelectionIntelligence.css";

// ============================================================
// MAIN LAYOUT
// ============================================================

export default function MainLayout({
  left,
  center,
  right,
}: any) {
  const {
    operatorMode,
  } = useEventContext();

  const workspaceMode =
    useWorkspaceMode();
  const layersMode = workspaceMode === WorkspaceMode.LAYERS;
  const leftInstrumentName = layersMode ? "Laboratory Navigator" : "Investigation Control";
  const rightInstrumentName = layersMode ? "Experimental Intelligence" : "Selection Intelligence";

  const [
    workspaceExpanded,
    setWorkspaceExpanded,
  ] = useState(false);

  const [
    leftPanelCollapsed,
    setLeftPanelCollapsed,
  ] = useState(false);

  const [
    rightPanelCollapsed,
    setRightPanelCollapsed,
  ] = useState(false);

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
            MODE: {getWorkspaceModeLabel(workspaceMode)}
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

        {/* =================================================== */}
        {/* LEFT PANEL — INVESTIGATION CONTROL */}
        {/* =================================================== */}

        {/* LEFT PANEL RESTORE CONTROL */}

        {!workspaceExpanded && leftPanelCollapsed && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() =>
                setLeftPanelCollapsed(false)
              }
              title={`Restore ${leftInstrumentName}`}
              style={{
                background: "#070d18",
                color: "#94a3b8",
                border: "1px solid #182235",
                borderRadius: 6,
                cursor: "pointer",
                fontFamily: "Consolas, monospace",
                fontSize: 14,
                padding: "6px 7px",
              }}
            >
              &gt;&gt;
            </button>
          </div>
        )}

        <div
          style={{
            display:
              workspaceExpanded || leftPanelCollapsed
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

          {/* LEFT PANEL COLLAPSE CONTROL */}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "6px 8px 0 8px",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() =>
                setLeftPanelCollapsed(true)
              }
              title={`Collapse ${leftInstrumentName}`}
              style={{
                background: "transparent",
                color: "#94a3b8",
                border: "none",
                cursor: "pointer",
                fontFamily: "Consolas, monospace",
                fontSize: 14,
                padding: "2px 4px",
              }}
            >
              &lt;&lt;
            </button>
          </div>

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

        {/* =================================================== */}
        {/* CENTER PANEL — WORKSPACE PROJECTION */}
        {/* =================================================== */}

        <div
          style={{
            flex: 1,
            minWidth: 0,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            background: "#09111f",
            overflow: "hidden",
          }}
        >

          {/* WORKSPACE LAYOUT CONTROL */}

          <button
            type="button"
            onClick={() =>
              setWorkspaceExpanded(
                !workspaceExpanded
              )
            }
            title={
              workspaceExpanded
                ? "Restore workspace panels"
                : "Expand workspace"
            }
            style={{
              position: "absolute",
              top: 12,
              right: 16,
              zIndex: 20,
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
            {
              workspaceExpanded
                ? "Restore"
                : "Expand"
            }
          </button>

          {/* =============================================== */}
          {/* WORKSPACE PROJECTION HOST */}
          {/* Runtime-owned investigation workspace */}
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
            {center}
          </div>
        </div>

        {/* =================================================== */}
        {/* RIGHT PANEL — SELECTION INTELLIGENCE */}
        {/* =================================================== */}

        {/* RIGHT PANEL RESTORE CONTROL */}

        {!workspaceExpanded && rightPanelCollapsed && (
          <div className="selection-intelligence-restore">
            <button
              type="button"
              className={
                "selection-intelligence-restore__button"
              }
              onClick={() =>
                setRightPanelCollapsed(false)
              }
              title={`Restore ${rightInstrumentName}`}
              aria-label={`Restore ${rightInstrumentName}`}
            >
              &lt;&lt;
            </button>
          </div>
        )}

        {/* RIGHT PANEL SHELL */}

        <aside
          className={[
            "selection-intelligence",
            workspaceExpanded || rightPanelCollapsed
              ? "selection-intelligence--hidden"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label={rightInstrumentName}
        >

          {/* HEADER */}

          <header className="selection-intelligence__header">
            <div className="selection-intelligence__header-row">
              <div className="selection-intelligence__identity">
                <div className="selection-intelligence__eyebrow">
                  {layersMode ? "Laboratory inspection" : "Active selection"}
                </div>

                <div className="selection-intelligence__title">
                  {rightInstrumentName}
                </div>
              </div>

              <button
                type="button"
                className="selection-intelligence__collapse"
                onClick={() =>
                  setRightPanelCollapsed(true)
                }
                title={`Collapse ${rightInstrumentName}`}
                aria-label={`Collapse ${rightInstrumentName}`}
              >
                &gt;&gt;
              </button>
            </div>

            <div className="selection-intelligence__description">
              Deterministic inspection of the active node,
              edge, cluster, or Resolve candidate.
            </div>
          </header>

          {/* DETERMINISTIC INTELLIGENCE BODY */}

          <div className="selection-intelligence__body">
            {right}
          </div>
        </aside>
      </div>

      {/* ===================================================== */}
      {/* WORKSPACE MODE BAR */}
      {/* ===================================================== */}

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
        <div>
          VERSION: v0.9-operator-shell
        </div>

        <div>
          SYSTEM STATE: {operatorMode}
        </div>

        <div>
          <ManifoldProjectionStatus />
        </div>
      </div>
    </div>
  );
}
