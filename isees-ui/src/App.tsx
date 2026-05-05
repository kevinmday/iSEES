// ============================================================
// src/App.tsx — FIXED RIGHT PANEL WIRING
// FULL DROP-IN REPLACEMENT
// ============================================================

import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import MainLayout from "./layout/MainLayout";
import PrimarySignalPanel from "./components/PrimarySignalPanel";
import RightPanel from "./components/RightPanel"; // 🔥 FIX
import PublicIntake from "./pages/PublicIntake";

import { useSyntheticEvent } from "./dev/useSyntheticEvent";

type Mode = "INVESTIGATION" | "LIVE_EVENT" | "INTAKE";

// ------------------------------------------------------------
// HEADER
// ------------------------------------------------------------
const Header = () => {
  const [utc, setUtc] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setUtc(now.toISOString().slice(11, 19));
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div
      style={{
        padding: "8px 16px",
        borderBottom: "1px solid #1f2a44",
        background: "#0b0f1a",
        fontFamily: "monospace"
      }}
    >
      <div style={{ fontWeight: "bold" }}>
        iSEES-UAP | Emergence Detection System
      </div>
      <div style={{ fontSize: 12, color: "#8b949e" }}>
        STATUS: ACTIVE&nbsp;&nbsp;&nbsp;
        MODE: LIVE ANALYSIS&nbsp;&nbsp;&nbsp;
        UTC: {utc}
      </div>
    </div>
  );
};

// ------------------------------------------------------------
// FOOTER
// ------------------------------------------------------------
const Footer = () => {
  return (
    <div
      style={{
        padding: "6px 16px",
        fontSize: 12,
        color: "#8b949e",
        background: "#0b0f1a",
        borderTop: "1px solid #1f2a44",
        fontFamily: "monospace",
        textAlign: "center",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }}
    >
      VERSION: v0.7 |
      SYSTEM MAINTAINER: Kevin M. Day |
      CONTACT: kevinmday@yahoo.com |
      Outputs are analytical and based on aggregated observational data.
    </div>
  );
};

// ============================================================
// OPERATOR UI
// ============================================================
function OperatorUI() {
  const [mode, setMode] = useState<Mode>("INVESTIGATION");

  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeEvent, setActiveEvent] = useState<any | null>(null);
  const [clusters, setClusters] = useState<any[]>([]);

  const { state: signal } = useSyntheticEvent();

  // ------------------------------------------------------------
  // FETCH CLUSTERS
  // ------------------------------------------------------------
  useEffect(() => {
    const fetchClusters = () => {
      fetch("http://127.0.0.1:8001/clusters")
        .then(res => res.json())
        .then(data => {
          console.log("CLUSTERS:", data);
          setClusters(data);
        })
        .catch(err => console.error(err));
    };

    fetchClusters();
    const interval = setInterval(fetchClusters, 3000);
    return () => clearInterval(interval);
  }, []);

  // ------------------------------------------------------------
  // ALERT GENERATION
  // ------------------------------------------------------------
  useEffect(() => {
    if (!signal) return;

    if (signal.state === "forming" || signal.state === "confirmed") {
      setAlerts(prev => {
        if (prev.find(a => a.id === signal.event_id)) return prev;

        return [
          {
            id: signal.event_id,
            location: signal.location,
            confidence: signal.confidence,
            state: signal.state,
            cluster_size: signal.cluster_size,
            reports: signal.reports,
            elapsed: signal.elapsed
          },
          ...prev
        ];
      });
    }
  }, [signal]);

  const handleAlertClick = (a: any) => {
    setActiveEvent(a);
    setMode("LIVE_EVENT");
  };

  // ------------------------------------------------------------
  // LEFT PANEL
  // ------------------------------------------------------------
  const renderLeftPanel = () => (
    <div style={{ padding: 10, fontFamily: "monospace" }}>
      <h3>Clusters</h3>

      {clusters.length === 0 && (
        <div style={{ opacity: 0.5 }}>No clusters</div>
      )}

      {clusters.map((c: any) => (
        <div
          key={c.cluster_id}
          style={{
            border: "1px solid #1f2a44",
            padding: 8,
            marginBottom: 8,
            borderRadius: 6,
            background: "#0b1220"
          }}
        >
          <div><strong>{c.cluster_id}</strong></div>
          <div>Reports: {c.reports?.length || 0}</div>
          <div>Intensity: {c.intensity}</div>
          <div>Duration: {c.duration_seconds}s</div>
        </div>
      ))}
    </div>
  );

  // ------------------------------------------------------------
  // CENTER PANEL
  // ------------------------------------------------------------
  const renderCenter = () => {
    if (mode === "LIVE_EVENT" && activeEvent) {
      return (
        <div style={{ fontFamily: "monospace" }}>
          <h3>Active Event</h3>

          <div>
            <div>EVENT: {activeEvent.id}</div>
            <div>LOCATION: {activeEvent.location}</div>
            <div>STATE: {activeEvent.state.toUpperCase()}</div>
            <div>CONFIDENCE: {activeEvent.confidence.toFixed(2)}</div>
          </div>
        </div>
      );
    }

    return <div>Select a case or run analysis</div>;
  };

  // ------------------------------------------------------------
  // MAIN RENDER
  // ------------------------------------------------------------
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#0b0f1a",
        color: "white"
      }}
    >
      <Header />

      <PrimarySignalPanel />

      {/* ALERT BAR */}
      {alerts.length > 0 && (
        <div
          style={{
            padding: "6px 16px",
            background: "#111827",
            borderBottom: "1px solid #1f2a44",
            fontFamily: "monospace"
          }}
        >
          <strong style={{ color: "#facc15" }}>ALERTS:</strong>{" "}
          {alerts.map(a => (
            <span
              key={a.id}
              onClick={() => handleAlertClick(a)}
              style={{ cursor: "pointer", marginRight: 15 }}
            >
              {a.id} ({a.state.toUpperCase()} {a.confidence.toFixed(2)})
            </span>
          ))}
        </div>
      )}

      {/* MAIN CONTENT */}
      <div style={{ flex: 1 }}>
        <MainLayout
          left={renderLeftPanel()}
          center={renderCenter()}
          right={<RightPanel report={activeEvent} />} // 🔥 FIXED
        />
      </div>

      <Footer />
    </div>
  );
}

// ------------------------------------------------------------
export default function App() {
  return (
    <Routes>
      <Route path="/report" element={<PublicIntake />} />
      <Route path="/*" element={<OperatorUI />} />
    </Routes>
  );
}