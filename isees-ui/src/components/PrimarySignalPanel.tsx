import { useRef } from "react";
import { useSyntheticEvent } from "../dev/useSyntheticEvent";

export default function PrimarySignalPanel() {
  const { state } = useSyntheticEvent();

  // ------------------------------------------------------------
  // SAFETY GUARD
  // ------------------------------------------------------------
  if (!state) {
    return (
      <div style={{ padding: 8, color: "#888", fontFamily: "monospace" }}>
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
  // PHASE (LOW PRIORITY — PURELY DESCRIPTIVE)
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
  // 🔥 OBSERVATION STATUS (KEY FIX)
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
      return `NO NEW REPORTS (${lastReportSeconds.toFixed(0)}s) — EVENT MAY STILL BE ACTIVE`;
    }

    return `NO RECENT REPORTS (${lastReportSeconds.toFixed(0)}s) — STATUS UNCERTAIN`;
  };

  // ------------------------------------------------------------
  // DIRECTIVES (UNCHANGED LOGIC)
  // ------------------------------------------------------------
  const getActions = () => {
    if (trendSymbol === "↑") return "monitor | radar | correlate";
    if (trendSymbol === "↓") return "log | review | validate";
    return "observe | await data";
  };

  // ------------------------------------------------------------
  // RENDER — COMPACT STRIP
  // ------------------------------------------------------------
  return (
    <div
      style={{
        width: "100%",
        padding: "10px 20px",
        background: "#0b0f1a",
        color: "#e6edf3",
        borderBottom: "1px solid #1f2a44",
        fontFamily: "monospace",
        fontSize: 14
      }}
    >
      {/* LINE 1 — IDENTITY + PHASE */}
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: "#7ee787" }}>PRIMARY SIGNAL</span>{" "}
        | <strong>{getPhase()}</strong>
      </div>

      {/* LINE 2 — TELEMETRY */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        <span>EVENT: {state.event_id}</span>
        <span>LOC: {state.location}</span>
        <span>
          CONF: {state.confidence.toFixed(2)} {trendSymbol}
        </span>
        <span>CLUSTER: {state.cluster_size}</span>
        <span>REPORTS: {state.reports}</span>
        <span>TIME: {lastReportSeconds.toFixed(0)}s</span>
      </div>

      {/* 🔥 LINE 3 — OBSERVATION STATUS (NEW CORE TRUTH) */}
      <div style={{ marginTop: 4, color: "#58a6ff" }}>
        {getObservationStatus()}
      </div>

      {/* LINE 4 — ACTIONS */}
      <div style={{ marginTop: 2, color: "#8b949e" }}>
        ACTIONS: {getActions()}
      </div>
    </div>
  );
}