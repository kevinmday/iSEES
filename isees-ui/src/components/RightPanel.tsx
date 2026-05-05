// ============================================================
// src/components/RightPanel.tsx — DEBUG + FORCED INTEL RENDER
// FULL DROP-IN REPLACEMENT
// ============================================================

import { useState } from "react";
import { buildContextualIntel } from "../intel/intel_engine";

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------
type Report = {
  cluster_size?: number;
  reportsData?: any[];
  raw?: any;
  top_vectors?: any[];
  gap_type?: string;
};

// ============================================================
// COMPONENT
// ============================================================
export default function RightPanel({ report }: { report: Report | null }) {
  console.log("🧠 RIGHT PANEL REPORT:", report);

  const [selectedObject, setSelectedObject] = useState<string | null>(null);

  // ------------------------------------------------------------
  // 🔥 HARD FALLBACKS (GUARANTEED RENDER)
  // ------------------------------------------------------------
  const safeReport = report || {};
  const clusterSize = safeReport.cluster_size || 1;

  // ------------------------------------------------------------
  // 🔥 FORCE EVENT TYPE (NO DEPENDENCY)
  // ------------------------------------------------------------
  const eventType = "LOW_CONFIDENCE";

  // ------------------------------------------------------------
  // 🔥 ALWAYS AVAILABLE ASSETS
  // ------------------------------------------------------------
  const assets = ["ATC_TOWER", "NEXRAD_RADAR", "AIRPORT_OPS"];

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div
      style={{
        padding: 16,
        fontFamily: "monospace",
        color: "#e6edf3"
      }}
    >
      {/* 🔥 DEBUG HEADER (VISIBLE CONFIRMATION) */}
      <div
        style={{
          marginBottom: 10,
          padding: 6,
          background: "#111",
          border: "1px solid #333",
          fontSize: 12,
          color: "#58a6ff"
        }}
      >
        RIGHT PANEL ACTIVE | report: {report ? "YES" : "NO"}
      </div>

      {/* ======================================== */}
      {/* CONTEXT INTEL */}
      {/* ======================================== */}
      <h3 style={{ marginBottom: 10 }}>Context Intel</h3>

      <div style={{ marginBottom: 10 }}>
        <strong>Event Type:</strong> {eventType}
      </div>

      {/* 🔥 ASSET LIST (FORCED RENDER) */}
      <div style={{ marginBottom: 14 }}>
        {assets.map((a) => (
          <div
            key={a}
            onClick={() => setSelectedObject(a)}
            style={{
              cursor: "pointer",
              padding: "6px 8px",
              marginBottom: 6,
              borderRadius: 4,
              border: "1px solid #222",
              background:
                selectedObject === a ? "#1f2a44" : "transparent"
            }}
          >
            • {a}
          </div>
        ))}
      </div>

      {/* 🔥 INTEL OUTPUT */}
      {selectedObject && (() => {
        const intel = buildContextualIntel(
          selectedObject,
          eventType,
          clusterSize
        );

        console.log("⚡ INTEL OUTPUT:", intel);

        if (!intel) {
          return (
            <div style={{ color: "#ff6b6b" }}>
              No intel returned for {selectedObject}
            </div>
          );
        }

        return (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              border: "1px solid #222",
              background: "#0f172a",
              borderRadius: 6
            }}
          >
            <h4 style={{ marginBottom: 6 }}>{intel.type}</h4>

            <div>
              <strong>Role:</strong>
              <div>{intel.role}</div>
            </div>

            <div style={{ marginTop: 6 }}>
              <strong>Confidence:</strong>
              <div>{intel.confidence}</div>
            </div>

            <div style={{ marginTop: 6 }}>
              <strong>Priority:</strong>
              <div style={{ color: "#58a6ff" }}>{intel.priority}</div>
            </div>

            <div style={{ marginTop: 6 }}>
              <strong>Next Move:</strong>
              <div style={{ color: "#7ee787" }}>
                {intel.actions?.[0]}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}