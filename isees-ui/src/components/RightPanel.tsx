// ============================================================
// src/components/RightPanel.tsx
// CONTEXT-DRIVEN OPERATIONAL INTELLIGENCE (V2)
// FULL DROP-IN REPLACEMENT
// ============================================================

import { useState } from "react";

import { useEventContext } from "../context/EventContext";

import { buildContextualIntel } from "../intel/intel_engine";

// ============================================================
// COMPONENT
// ============================================================

export default function RightPanel() {
  const { activeEvent } = useEventContext();

  const [selectedObject, setSelectedObject] =
    useState<string | null>(null);

  // ----------------------------------------------------------
  // NO ACTIVE EVENT
  // ----------------------------------------------------------

  if (!activeEvent) {
    return (
      <div
        style={{
          padding: 16,
          fontFamily: "Consolas, monospace",
          color: "#94a3b8",
        }}
      >
        Awaiting active event
      </div>
    );
  }

  // ----------------------------------------------------------
  // CONTEXT EXTRACTION
  // ----------------------------------------------------------

  const clusterSize =
    activeEvent.clusters || 1;

  const eventType =
    activeEvent.escalation || "LOW";

  // ----------------------------------------------------------
  // FACILITY → ASSET BRIDGE
  // ----------------------------------------------------------

  const assets =
    activeEvent.facilities?.map(
      (f) => f.name
    ) || [];

  // ==========================================================
  // CLICK HANDLER
  // ==========================================================

  const handleSelect = (asset: string) => {
    setSelectedObject(asset);
  };

  // ==========================================================
  // SELECTED INTEL
  // ==========================================================

  const selectedIntel =
    selectedObject
      ? buildContextualIntel(
          selectedObject,
          eventType,
          clusterSize
        )
      : null;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      style={{
        padding: 14,
        fontFamily: "Consolas, monospace",
        color: "#e6edf3",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* =================================================== */}
      {/* ACTIVE EVENT */}
      {/* =================================================== */}

      <div
        style={{
          border: "1px solid #1f2937",
          borderRadius: 8,
          padding: 12,
          background: "#0b1220",
        }}
      >
        <div
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            color: "#94a3b8",
            marginBottom: 10,
            letterSpacing: 1,
          }}
        >
          Active Event
        </div>

        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          {activeEvent.id}
        </div>

        <div
          style={{
            fontSize: 12,
            color: "#60a5fa",
            marginBottom: 6,
          }}
        >
          {activeEvent.location}
        </div>

        <div
          style={{
            fontSize: 12,
            color:
              activeEvent.escalation ===
              "HIGH"
                ? "#f87171"
                : "#86efac",
          }}
        >
          Escalation:{" "}
          {activeEvent.escalation}
        </div>
      </div>

      {/* =================================================== */}
      {/* INFRASTRUCTURE */}
      {/* =================================================== */}

      <div
        style={{
          border: "1px solid #1f2937",
          borderRadius: 8,
          padding: 12,
          background: "#0b1220",
        }}
      >
        <div
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            color: "#94a3b8",
            marginBottom: 12,
            letterSpacing: 1,
          }}
        >
          Investigation Vectors
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {assets.length === 0 ? (
            <div
              style={{
                color: "#6b7280",
                fontSize: 12,
              }}
            >
              No infrastructure linked
            </div>
          ) : (
            assets.map((asset) => (
              <div
                key={asset}
                onClick={() =>
                  handleSelect(asset)
                }
                style={{
                  cursor: "pointer",

                  border:
                    selectedObject === asset
                      ? "1px solid #38bdf8"
                      : "1px solid #1f2937",

                  background:
                    selectedObject === asset
                      ? "#132238"
                      : "#08101d",

                  borderRadius: 6,

                  padding: 10,

                  transition:
                    "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  {asset}
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: "#94a3b8",
                  }}
                >
                  Click for operational intelligence
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* =================================================== */}
      {/* CONTEXTUAL INTEL */}
      {/* =================================================== */}

      {selectedIntel && (
        <div
          style={{
            border: "1px solid #1f2937",
            borderRadius: 8,
            padding: 12,
            background: "#0b1220",
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              color: "#94a3b8",
              marginBottom: 12,
              letterSpacing: 1,
            }}
          >
            Operational Intelligence
          </div>

          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 14,
            }}
          >
            {selectedIntel.type}
          </div>

          <IntelRow
            label="Role"
            value={selectedIntel.role}
          />

          <IntelRow
            label="Confidence"
            value={
              selectedIntel.confidence
            }
          />

          <IntelRow
            label="Priority"
            value={
              selectedIntel.priority
            }
          />

          <IntelRow
            label="Recommended Action"
            value={
              selectedIntel.actions?.[0]
            }
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// INTEL ROW
// ============================================================

function IntelRow({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div
      style={{
        marginBottom: 12,
      }}
    >
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          color: "#94a3b8",
          marginBottom: 4,
          letterSpacing: 0.5,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 13,
          color: "#e5e7eb",
          lineHeight: 1.5,
        }}
      >
        {String(value)}
      </div>
    </div>
  );
}