// ============================================================
// src/components/RightPanel.tsx — GEO-AWARE INTEL (FIXED)
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
  geo_context?: {
    assets?: string[];
    [key: string]: any;
  };
};

// ============================================================
// COMPONENT
// ============================================================
export default function RightPanel({
  report,
  onSelectIntel
}: {
  report: Report | null;
  onSelectIntel?: (intel: any) => void;
}) {
  console.log("🧠 RIGHT PANEL REPORT:", report);

  const [selectedObject, setSelectedObject] = useState<string | null>(null);

  const clusterSize = report?.cluster_size || 1;

  // ------------------------------------------------------------
  // 🔥 REAL EVENT TYPE (fallback safe)
  // ------------------------------------------------------------
  const eventType = report?.gap_type || "LOW_CONFIDENCE";

  // ------------------------------------------------------------
  // 🔥 GEO-AWARE ASSETS (NO MORE HARDCODE)
  // ------------------------------------------------------------
  const assets = report?.geo_context?.assets || [];

  // ------------------------------------------------------------
  // 🔴 HARD STOP IF NO GEO CONTEXT
  // ------------------------------------------------------------
  if (!report?.geo_context) {
    return (
      <div
        style={{
          padding: 16,
          fontFamily: "monospace",
          color: "#888"
        }}
      >
        <div
          style={{
            marginBottom: 10,
            padding: 6,
            background: "#111",
            border: "1px solid #333",
            fontSize: 12,
            color: "#ff6b6b"
          }}
        >
          RIGHT PANEL ACTIVE | report: {report ? "YES" : "NO"}
        </div>

        No geo-context available — select an event
      </div>
    );
  }

  // ============================================================
  // CLICK HANDLER (BRIDGE)
  // ============================================================
  const handleSelect = (asset: string) => {
    setSelectedObject(asset);

    const intel = buildContextualIntel(asset, eventType, clusterSize);

    console.log("⚡ INTEL OUTPUT:", intel);

    if (onSelectIntel && intel) {
      onSelectIntel(intel);
    }
  };

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
      {/* DEBUG HEADER */}
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

      <h3 style={{ marginBottom: 10 }}>Context Intel</h3>

      <div style={{ marginBottom: 10 }}>
        <strong>Event Type:</strong> {eventType}
      </div>

      {/* 🔥 GEO-DERIVED ASSETS */}
      <div style={{ marginBottom: 14 }}>
        {assets.length === 0 ? (
          <div style={{ color: "#888" }}>No assets found</div>
        ) : (
          assets.map((a) => (
            <div
              key={a}
              onClick={() => handleSelect(a)}
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
          ))
        )}
      </div>

      {/* LOCAL INTEL DISPLAY */}
      {selectedObject && (() => {
        const intel = buildContextualIntel(
          selectedObject,
          eventType,
          clusterSize
        );

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