// ============================================================
// src/components/RightPanel.tsx — HYBRID + CONTEXT INTEL ENGINE
// FULL DROP-IN REPLACEMENT
// ============================================================

import { useState } from "react";
import { buildContextualIntel } from "../intel/intel_engine";

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------
type Vector = {
  phrase: string;
  score: number;
};

type Report = {
  raw?: any;
  gap_type?: string;
  top_vectors?: Vector[];

  // 🔥 OPTIONAL EVENT CONTEXT (future wiring)
  cluster_size?: number;
  reportsData?: any[];
};

// ============================================================
// COMPONENT
// ============================================================
export default function RightPanel({ report }: { report: Report | null }) {
  const [selectedObject, setSelectedObject] = useState<string | null>(null);

  if (!report) return <div style={{ padding: 20 }}>No data</div>;

  // ------------------------------------------------------------
  // EVENT TYPE DERIVATION
  // ------------------------------------------------------------
  const deriveEventType = () => {
    const data = report.reportsData || [];

    const hasVisual = data.some((r: any) => r.type === "visual");
    const hasSensor = data.some((r: any) => r.type === "sensor");

    if (hasVisual && hasSensor) return "MULTI_SOURCE";
    if (hasVisual) return "VISUAL_ONLY";
    if (hasSensor) return "SENSOR_ONLY";

    return "LOW_CONFIDENCE";
  };

  const eventType = deriveEventType();
  const clusterSize = report.cluster_size || 1;

  // ------------------------------------------------------------
  // COPY + SEARCH HELPERS
  // ------------------------------------------------------------
  const copy = (text: string) => navigator.clipboard.writeText(text);

  const openSearch = (text: string) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const runTopSearch = () => {
    if (report.top_vectors?.length) {
      openSearch(report.top_vectors[0].phrase);
    }
  };

  // ------------------------------------------------------------
  // EXPAND SEARCH PHRASES
  // ------------------------------------------------------------
  const expand = (phrase: string) => {
    const p = phrase.toLowerCase();

    if (p.includes("tic tac")) {
      return [
        "USS Princeton radar logs 2004",
        "AN/SPY-1 anomalous track data",
        "Nimitz strike group CEC records"
      ];
    }

    if (p.includes("omaha")) {
      return [
        "USS Omaha FLIR footage metadata",
        "Navy pyramid UAP video analysis",
        "CIC watch logs Omaha 2019"
      ];
    }

    return [
      phrase + " raw data",
      phrase + " logs",
      phrase + " analysis report"
    ];
  };

  // ------------------------------------------------------------
  // DOMAIN ROUTING
  // ------------------------------------------------------------
  const getDomains = () => {
    if (report.gap_type?.includes("Sensor Fusion")) {
      return ["Radar Systems", "EO/IR Systems", "Data Link (CEC)"];
    }

    if (report.gap_type?.includes("Classification")) {
      return ["Video Analysis", "Intel Reports", "Airspace Logs"];
    }

    return ["General OSINT", "Archives", "Unclassified Reports"];
  };

  // ------------------------------------------------------------
  // ASSET LIST (STATIC FOR NOW → DYNAMIC LATER)
  // ------------------------------------------------------------
  const assets = ["ATC_TOWER", "NEXRAD_RADAR", "AIRPORT_OPS"];

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>

      {/* ======================================== */}
      {/* 🔥 CONTEXT INTEL SUMMARY (NEW) */}
      {/* ======================================== */}
      <h3>Context Intel</h3>

      <div style={{ marginBottom: 10 }}>
        <strong>Event Type:</strong> {eventType}
      </div>

      {/* ASSET SELECT */}
      <div style={{ marginBottom: 10 }}>
        {assets.map((a) => (
          <div
            key={a}
            onClick={() => setSelectedObject(a)}
            style={{
              cursor: "pointer",
              padding: "6px 8px",
              marginBottom: 4,
              borderRadius: 4,
              background:
                selectedObject === a ? "#1f2a44" : "transparent"
            }}
          >
            • {a}
          </div>
        ))}
      </div>

      {/* INTEL SUMMARY (ADAPTIVE) */}
      {selectedObject && (() => {
        const intel = buildContextualIntel(
          selectedObject,
          eventType,
          clusterSize
        );

        if (!intel) return null;

        return (
          <div style={{ marginBottom: 20 }}>
            <h4>{intel.type}</h4>

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

      {/* ======================================== */}
      {/* RAW SIGNAL METRICS */}
      {/* ======================================== */}
      <h3>Signal Metrics</h3>

      <p>
        <b>Coherence:</b>{" "}
        {report.raw?.coherence_flow?.phase8 ?? "N/A"}
      </p>

      <p>
        <b>Entropy:</b>{" "}
        {report.raw?.entropy_flow?.adjusted ?? "N/A"}
      </p>

      <h4>Flags</h4>
      <pre
        style={{
          background: "#111",
          padding: 10,
          fontSize: 12,
          overflowX: "auto"
        }}
      >
        {JSON.stringify(report.raw?.flags ?? {}, null, 2)}
      </pre>

      {/* ======================================== */}
      {/* SEARCH OPERATIONS */}
      {/* ======================================== */}
      <div style={{ marginTop: 30 }}>
        <h3>Search Operations</h3>

        <button onClick={runTopSearch}>Run Top Search</button>

        <h4 style={{ marginTop: 10 }}>Top Vectors</h4>
        {report.top_vectors?.map((v, i) => (
          <div key={i} style={{ background: "#1a1a1a", padding: 8 }}>
            <div>{v.phrase} | {v.score}</div>

            <button onClick={() => copy(v.phrase)}>Copy</button>
            <button onClick={() => openSearch(v.phrase)}>
              Open
            </button>
          </div>
        ))}

        <h4 style={{ marginTop: 20 }}>Expanded Search</h4>
        {report.top_vectors?.flatMap((v) =>
          expand(v.phrase).map((e, i) => (
            <div key={i} style={{ background: "#111", padding: 6 }}>
              {e}
            </div>
          ))
        )}

        <h4 style={{ marginTop: 20 }}>Priority Domains</h4>
        {getDomains().map((d, i) => (
          <div key={i} style={{ background: "#222", padding: 6 }}>
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}