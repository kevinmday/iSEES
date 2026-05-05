// ============================================================
// src/App.tsx — BACKEND REPORT BRIDGE (PROXY SAFE)
// FULL DROP-IN REPLACEMENT
// ============================================================

import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import MainLayout from "./layout/MainLayout";
import PrimarySignalPanel from "./components/PrimarySignalPanel";
import RightPanel from "./components/RightPanel";
import PublicIntake from "./pages/PublicIntake";

import { useSyntheticEvent } from "./dev/useSyntheticEvent";

type Mode = "INVESTIGATION" | "LIVE_EVENT";

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
    <div style={{
      padding: "8px 16px",
      borderBottom: "1px solid #1f2a44",
      background: "#0b0f1a",
      fontFamily: "monospace"
    }}>
      <div style={{ fontWeight: "bold" }}>
        iSEES-UAP | Emergence Detection System
      </div>

      <div style={{ fontSize: 12, color: "#8b949e" }}>
        STATUS: ACTIVE &nbsp;&nbsp;
        MODE: LIVE ANALYSIS &nbsp;&nbsp;
        UTC: {utc}
      </div>
    </div>
  );
};

// ------------------------------------------------------------
// FOOTER
// ------------------------------------------------------------
const Footer = () => (
  <div style={{
    padding: "6px 16px",
    fontSize: 12,
    color: "#8b949e",
    background: "#0b0f1a",
    borderTop: "1px solid #1f2a44",
    fontFamily: "monospace",
    textAlign: "center"
  }}>
    VERSION: v0.7 | SYSTEM MAINTAINER: Kevin M. Day | CONTACT: kevinmday@yahoo.com
  </div>
);

// ============================================================
// MAIN UI
// ============================================================
function OperatorUI() {

  const [mode, setMode] = useState<Mode>("INVESTIGATION");

  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeEvent, setActiveEvent] = useState<any | null>(null);
  const [clusters, setClusters] = useState<any[]>([]);
  const [selectedIntel, setSelectedIntel] = useState<any | null>(null);

  const { state: signal } = useSyntheticEvent();

  // ------------------------------------------------------------
  // ✅ FETCH CLUSTERS (PROXY SAFE)
  // ------------------------------------------------------------
  useEffect(() => {
    fetch("/clusters")
      .then(res => res.json())
      .then(data => {
        console.log("📡 CLUSTERS:", data);
        setClusters(data);
      })
      .catch(err => console.error("❌ CLUSTERS FAIL:", err));
  }, []);

  // ------------------------------------------------------------
  // ALERT GENERATION
  // ------------------------------------------------------------
  useEffect(() => {
    if (!signal) return;

    if (
      signal.state === "initial" ||
      signal.state === "forming" ||
      signal.state === "confirmed"
    ) {
      const newAlert = {
        id: signal.event_id,
        location: signal.location,
        confidence: signal.confidence,
        state: signal.state
      };

      setAlerts(prev => {
        const exists = prev.find(a => a.id === signal.event_id);

        if (exists) {
          return prev.map(a =>
            a.id === signal.event_id ? { ...a, ...newAlert } : a
          );
        }

        return [newAlert, ...prev];
      });
    }
  }, [signal]);

  // ------------------------------------------------------------
  // 🔥 FETCH REPORT (PROXY SAFE)
  // ------------------------------------------------------------
  const handleAlertClick = async (a: any) => {
    console.log("🚨 ALERT CLICK:", a.id);

    try {
      const res = await fetch(`/report/${a.id}`);
      const data = await res.json();

      console.log("📡 BACKEND REPORT:", data);

      setActiveEvent(data);
      setMode("LIVE_EVENT");
      setSelectedIntel(null);

    } catch (err) {
      console.error("❌ REPORT FETCH FAILED:", err);
      setActiveEvent(null);
    }
  };

  // ------------------------------------------------------------
  // CENTER PANEL
  // ------------------------------------------------------------
  const renderCenter = () => {

    if (selectedIntel) {
      return (
        <div style={{ fontFamily: "monospace" }}>
          <h3>{selectedIntel.type}</h3>

          <div>
            <div><strong>Role:</strong> {selectedIntel.role}</div>
            <div><strong>Confidence:</strong> {selectedIntel.confidence}</div>
            <div><strong>Priority:</strong> {selectedIntel.priority}</div>
            <div><strong>Next Move:</strong> {selectedIntel.actions?.[0]}</div>
          </div>
        </div>
      );
    }

    if (mode === "LIVE_EVENT" && activeEvent) {
      return (
        <div style={{ fontFamily: "monospace" }}>
          <h3>Active Event</h3>

          <div>
            <div>EVENT: {activeEvent.event_id}</div>
            <div>LOCATION: {activeEvent.raw?.location || "UNKNOWN"}</div>
            <div>STATUS: {activeEvent.gap_type}</div>
          </div>
        </div>
      );
    }

    return <div>Select a case or run analysis</div>;
  };

  // ------------------------------------------------------------
  // LEFT PANEL
  // ------------------------------------------------------------
  const renderLeft = () => (
    <div style={{ padding: 10, fontFamily: "monospace" }}>
      <h3>Clusters</h3>

      {clusters.length === 0 && <div>No clusters</div>}

      {clusters.map((c: any) => (
        <div key={c.event_id}>
          {c.event_id} ({c.cluster_size})
        </div>
      ))}
    </div>
  );

  // ------------------------------------------------------------
  // MAIN
  // ------------------------------------------------------------
  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#0b0f1a",
      color: "white"
    }}>
      <Header />

      <PrimarySignalPanel />

      {/* ALERT BAR */}
      {alerts.length > 0 && (
        <div style={{
          padding: "6px 16px",
          background: "#111827",
          borderBottom: "1px solid #1f2a44",
          fontFamily: "monospace"
        }}>
          {alerts.map((a) => (
            <div
              key={a.id}
              onClick={() => handleAlertClick(a)}
              style={{
                cursor: "pointer",
                padding: "4px 0",
                color: "#facc15"
              }}
            >
              ALERTS: {a.id} ({a.state.toUpperCase()} {a.confidence.toFixed(2)})
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1 }}>
        <MainLayout
          left={renderLeft()}
          center={renderCenter()}
          right={
            <RightPanel
              report={activeEvent}
              onSelectIntel={(intel) => setSelectedIntel(intel)}
            />
          }
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