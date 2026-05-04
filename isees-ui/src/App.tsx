// ============================================================
// src/App.tsx — CLUSTER WIRED (LIVE BACKEND)
// FULL DROP-IN REPLACEMENT
// ============================================================

import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import MainLayout from "./layout/MainLayout";
import PrimarySignalPanel from "./components/PrimarySignalPanel";
import ActionExecutionPanel from "./components/ActionExecutionPanel";

import PublicIntake from "./pages/PublicIntake";

import { useSyntheticEvent } from "./dev/useSyntheticEvent";
import { buildIntel } from "./intel/intel_composer";

// ------------------------------------------------------------
type Mode = "INVESTIGATION" | "LIVE_EVENT" | "INTAKE";

// ============================================================
// OPERATOR UI
// ============================================================
function OperatorUI() {
  const [mode, setMode] = useState<Mode>("INVESTIGATION");

  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeEvent, setActiveEvent] = useState<any | null>(null);

  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [selectedAction, setSelectedAction] = useState<any | null>(null);

  // 🔥 NEW — CLUSTERS STATE
  const [clusters, setClusters] = useState<any[]>([]);

  const { state: signal } = useSyntheticEvent();

  // ------------------------------------------------------------
  // FETCH CLUSTERS (LIVE)
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
  // ALERT CREATION
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

  // ------------------------------------------------------------
  // ALERT CLICK
  // ------------------------------------------------------------
  const handleAlertClick = (a: any) => {
    setActiveEvent(a);
    setSelectedAsset(null);
    setSelectedAction(null);
    setMode("LIVE_EVENT");
  };

  // ------------------------------------------------------------
  // LEFT PANEL — 🔥 LIVE CLUSTERS
  // ------------------------------------------------------------
  const renderLeftPanel = () => {
    return (
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
  };

  // ------------------------------------------------------------
  // RIGHT PANEL
  // ------------------------------------------------------------
  const renderRightPanel = () => {
    if (mode === "LIVE_EVENT" && activeEvent) {

      const assets = [
        { name: "Medford ATC Tower", type: "ATC_TOWER" },
        { name: "KMAX Radar", type: "NEXRAD_RADAR" },
        { name: "Airport Ops", type: "AIRPORT_OPS" }
      ];

      return (
        <div style={{ padding: 10, fontFamily: "monospace" }}>
          <h3>Actionable Intel</h3>

          <strong>Assets</strong>

          {assets.map((a, i) => {
            const isSelected = selectedAsset?.name === a.name;

            const intel =
              isSelected && activeEvent
                ? buildIntel(a, activeEvent)
                : null;

            return (
              <div key={i} style={{ marginBottom: 10 }}>
                <div
                  onClick={() => {
                    setSelectedAsset(a);
                    setSelectedAction(null);
                  }}
                  style={{
                    cursor: "pointer",
                    padding: "6px 8px",
                    borderRadius: 4,
                    background: isSelected ? "#1f2a44" : "transparent"
                  }}
                >
                  • {a.name}
                </div>

                {isSelected && intel && (
                  <div style={{
                    marginTop: 6,
                    padding: "10px",
                    border: "1px solid #1f2a44",
                    borderRadius: 6,
                    background: "#0b1220",
                    color: "#8b949e",
                    fontSize: 13
                  }}>
                    <div><strong>Contact</strong></div>
                    <div>Role: {intel.contact?.role || "Unknown"}</div>
                    <div>Phone: {intel.contact?.phone || "Unknown"}</div>

                    <div style={{ marginTop: 8 }}>
                      <strong>Actions</strong>

                      {intel.actions.map((act: any, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedAction(act)}
                          style={{
                            cursor: "pointer",
                            marginTop: 6,
                            padding: "6px 8px",
                            borderRadius: 4,
                            background:
                              selectedAction?.label === act.label
                                ? "#1f2a44"
                                : "#111827",
                            color: "#58a6ff"
                          }}
                        >
                          • {act.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return <div style={{ padding: 10 }}>No active intel</div>;
  };

  // ------------------------------------------------------------
  // CENTER PANEL
  // ------------------------------------------------------------
  const renderCenter = () => {
    if (mode === "LIVE_EVENT" && activeEvent) {

      const intel =
        selectedAsset && activeEvent
          ? buildIntel(selectedAsset, activeEvent)
          : null;

      return (
        <div>
          <h3>Active Event</h3>

          <div style={{ fontFamily: "monospace", marginBottom: 15 }}>
            <div>EVENT: {activeEvent.id}</div>
            <div>LOCATION: {activeEvent.location}</div>
            <div>STATE: {activeEvent.state.toUpperCase()}</div>
            <div>CONFIDENCE: {activeEvent.confidence.toFixed(2)}</div>
            <div>CLUSTER: {activeEvent.cluster_size}</div>
            <div>REPORTS: {activeEvent.reports}</div>
            <div>TIME: {activeEvent.elapsed?.toFixed(0)}s</div>
          </div>

          {intel && (
            <div style={{
              marginTop: 20,
              paddingTop: 15,
              borderTop: "1px solid #1f2a44",
              fontFamily: "monospace"
            }}>
              <h3>{intel.name}</h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <strong>Capabilities</strong>
                  {intel.capabilities.map((c: string, i: number) => (
                    <div key={i}>• {c}</div>
                  ))}
                </div>

                <div>
                  <strong>Limitations</strong>
                  {intel.limitations.map((l: string, i: number) => (
                    <div key={i}>• {l}</div>
                  ))}
                </div>

                <div>
                  <strong>Relevance</strong>
                  {intel.relevance.map((r: string, i: number) => (
                    <div key={i}>• {r}</div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 15 }}>
                <strong>Environment</strong>
                <div>Visibility: {intel.environment.visibility}</div>
                <div>Weather: {intel.environment.weather}</div>
                <div>{intel.environment.impact}</div>
              </div>
            </div>
          )}

          {selectedAction && (
            <ActionExecutionPanel action={selectedAction} />
          )}
        </div>
      );
    }

    return <div>Select a case or run analysis</div>;
  };

  // ------------------------------------------------------------
  return (
    <div style={{ height: "100vh", color: "white" }}>

      <PrimarySignalPanel />

      {alerts.length > 0 && (
        <div style={{
          padding: "6px 20px",
          background: "#111827",
          borderBottom: "1px solid #1f2a44",
          fontFamily: "monospace"
        }}>
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

      <MainLayout
        left={renderLeftPanel()}
        center={renderCenter()}
        right={renderRightPanel()}
      />
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