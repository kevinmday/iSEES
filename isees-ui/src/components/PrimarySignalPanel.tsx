// ============================================================
// src/components/PrimarySignalPanel.tsx — CENTERED SIGNAL STRIP
// FULL DROP-IN REPLACEMENT
// ============================================================

import { useRef } from "react";
import { useSyntheticEvent } from "../dev/useSyntheticEvent";

export default function PrimarySignalPanel() {
  const { state } = useSyntheticEvent();

  // ------------------------------------------------------------
  // SAFETY GUARD
  // ------------------------------------------------------------
  if (!state) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
          padding: "6px 16px",
          color: "#888",
          fontFamily: "monospace",
          borderBottom: "1px solid #1f2a44",
          background: "#0b0f1a",
          textAlign: "center"
        }}
      >
        loading signal...
      </div>
    );
  }

  // ------------------------------------------------------------
  // TRACK CONFIDENCE TREND
  // ------------------------------------------------------------
  const prevConfidence = useRef<number | null>(null);
  let trendSymbol: "↑" | "↓" | "→" = "→";

  if (prevConfidence.current !== null) {
    if (state.confidence > prevConfidence.current) trendSymbol = "↑";
    else if (state.confidence < prevConfidence.current) trendSymbol = "↓";
  }
  prevConfidence.current = state.confidence;

  // ------------------------------------------------------------
  // PHASE
  // ------------------------------------------------------------
  const getPhase = () => {
    switch (state.state) {
      case "emerging":
        return "INITIAL";
      case "forming":
        return "FORMING";
      case "confirmed":
        return "CONFIRMED";
      case "decaying":
        return "NO RECENT INPUT";
      default:
        return "UNKNOWN";
    }
  };

  // ------------------------------------------------------------
  // OBSERVATION STATUS
  // ------------------------------------------------------------
  const lastReportSeconds = state.elapsed ?? 0;

  const getObservationStatus = () => {
    if (lastReportSeconds < 10) {
      return "ACTIVE — CONTINUOUS REPORTING";
    }
    if (lastReportSeconds < 30) {
      return "RECENT REPORTS — MONITORING";
    }
    if (lastReportSeconds < 120) {
      return `NO NEW REPORTS (${lastReportSeconds.toFixed(
        0
      )}s) — EVENT MAY STILL BE ACTIVE`;
    }
    return `NO RECENT REPORTS (${lastReportSeconds.toFixed(
      0
    )}s) — STATUS UNCERTAIN`;
  };

  // ------------------------------------------------------------
  // ACTIONS
  // ------------------------------------------------------------
  const getActions = () => {
    if (trendSymbol === "↑") return "monitor | radar | correlate";
    if (trendSymbol === "↓") return "log | review | validate";
    return "observe | await data";
  };

  // ------------------------------------------------------------
  // RENDER — CENTERED STRIP
  // ------------------------------------------------------------
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
        padding: "8px 16px",
        background: "#0b0f1a",
        color: "#e6edf3",
        borderBottom: "1px solid #1f2a44",
        fontFamily: "monospace",
        fontSize: 13
      }}
    >
      {/* LINE 1 — LABEL (CENTERED) */}
      <div style={{ marginBottom: 3, textAlign: "center" }}>
        <span style={{ color: "#7ee787" }}>PRIMARY SIGNAL</span>{" "}
        | <strong>{getPhase()}</strong>
      </div>

      {/* LINE 2 — TELEMETRY (CENTERED FLEX) */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "center", // 🔥 horizontal centering
          textAlign: "center"       // 🔥 wrapped centering
        }}
      >
        <span>EVENT: {state.event_id}</span>
        <span>LOC: {state.location}</span>
        <span>
          CONF: {state.confidence.toFixed(2)} {trendSymbol}
        </span>
        <span>CLUSTER: {state.cluster_size}</span>
        <span>REPORTS: {state.reports}</span>
        <span>TIME: {lastReportSeconds.toFixed(0)}s</span>
      </div>

      {/* LINE 3 — STATUS (CENTERED) */}
      <div style={{ marginTop: 3, color: "#58a6ff", textAlign: "center" }}>
        {getObservationStatus()}
      </div>

      {/* LINE 4 — ACTIONS (CENTERED) */}
      <div style={{ marginTop: 2, color: "#8b949e", textAlign: "center" }}>
        ACTIONS: {getActions()}
      </div>
    </div>
  );
}