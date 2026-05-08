// ============================================================
// src/components/RightPanel.tsx
// CONTEXT-DRIVEN OPERATIONAL INTELLIGENCE (V4)
// DEEP NODE INTELLIGENCE SURFACING
// FULL DROP-IN REPLACEMENT
// ============================================================

import { useState } from "react";

import { useEventContext } from "../context/EventContext";

import { buildContextualIntel } from "../intel/intel_engine";

import { objectRegistry } from "../intel/object_registry";

// ============================================================
// NODE TYPE RESOLUTION
// ============================================================

function resolveNodeType(
  assetName: string
): string {
  const lower = assetName.toLowerCase();

  if (
    lower.includes("tower")
  ) {
    return "ATC_TOWER";
  }

  if (
    lower.includes("nexrad") ||
    lower.includes("radar")
  ) {
    return "NEXRAD_RADAR";
  }

  if (
    lower.includes("airport")
  ) {
    return "AIRPORT_OPS";
  }

  return "FAA_RADAR";
}

// ============================================================
// COMPONENT
// ============================================================

export default function RightPanel() {
  const {
    activeEvent,
    activeSurface,
  } = useEventContext();

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
  // NODE REGISTRY
  // ==========================================================

  const selectedNode =
    selectedObject
      ? objectRegistry[
          resolveNodeType(
            selectedObject
          )
        ]
      : null;

  // ==========================================================
  // SURFACE TITLES
  // ==========================================================

  const surfaceTitleMap: Record<
    string,
    string
  > = {
    SUMMARY:
      "Operational Intelligence",

    COLLAPSE:
      "Collapse Residual Analysis",

    CANDIDATES:
      "Candidate Alignment Analysis",

    CONTRADICTIONS:
      "Contradiction Intelligence",

    HOTSPOT:
      "Hotspot Memory Intelligence",

    GEO:
      "Geo Infrastructure Context",
  };

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

      <Panel title="Active Event">
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
      </Panel>

      {/* =================================================== */}
      {/* SURFACE PANEL */}
      {/* =================================================== */}

      <Panel
        title={
          surfaceTitleMap[
            activeSurface
          ]
        }
      >
        {/* =============================================== */}
        {/* SUMMARY */}
        {/* =============================================== */}

        {activeSurface ===
          "SUMMARY" && (
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
                      selectedObject ===
                      asset
                        ? "1px solid #38bdf8"
                        : "1px solid #1f2937",

                    background:
                      selectedObject ===
                      asset
                        ? "#132238"
                        : "#08101d",

                    borderRadius: 6,

                    padding: 10,
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
                    Click for operational
                    intelligence
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* =============================================== */}
        {/* COLLAPSE */}
        {/* =============================================== */}

        {activeSurface ===
          "COLLAPSE" && (
          <IntelStack
            rows={[
              [
                "Primary Residual",
                "Temporal divergence",
              ],

              [
                "Collapse Stability",
                "Unstable",
              ],

              [
                "Reconstruction Failure",
                "Aviation trajectory mismatch",
              ],

              [
                "Residual Severity",
                "Elevated",
              ],
            ]}
          />
        )}

        {/* =============================================== */}
        {/* CANDIDATES */}
        {/* =============================================== */}

        {activeSurface ===
          "CANDIDATES" && (
          <IntelStack
            rows={[
              [
                "Top Candidate",
                "Commercial Aviation",
              ],

              [
                "Alignment",
                "0.71",
              ],

              [
                "Failure Vector",
                "Velocity inconsistency",
              ],

              [
                "Secondary Candidate",
                "Military Aviation",
              ],
            ]}
          />
        )}

        {/* =============================================== */}
        {/* CONTRADICTIONS */}
        {/* =============================================== */}

        {activeSurface ===
          "CONTRADICTIONS" && (
          <IntelStack
            rows={[
              [
                "Primary Contradiction",
                "Motion inconsistency",
              ],

              [
                "Observer Divergence",
                "Moderate",
              ],

              [
                "Sensor Conflict",
                "Present",
              ],

              [
                "Geo Alignment",
                "Partial",
              ],
            ]}
          />
        )}

        {/* =============================================== */}
        {/* HOTSPOT */}
        {/* =============================================== */}

        {activeSurface ===
          "HOTSPOT" && (
          <IntelStack
            rows={[
              [
                "Recurrence State",
                "ACTIVE",
              ],

              [
                "Historical Similarity",
                "0.83",
              ],

              [
                "Pattern Stability",
                "Persistent",
              ],

              [
                "Regional Memory",
                "High",
              ],
            ]}
          />
        )}

        {/* =============================================== */}
        {/* GEO */}
        {/* =============================================== */}

        {activeSurface === "GEO" && (
          <IntelStack
            rows={[
              [
                "Primary Radar",
                "KMAX NEXRAD",
              ],

              [
                "ATC Coverage",
                "Available",
              ],

              [
                "Terrain Masking",
                "Moderate",
              ],

              [
                "Infrastructure Density",
                "High",
              ],
            ]}
          />
        )}
      </Panel>

      {/* =================================================== */}
      {/* NODE INTELLIGENCE */}
      {/* =================================================== */}

      {selectedIntel &&
        selectedNode &&
        activeSurface ===
          "SUMMARY" && (
          <Panel
            title="Focused Node Intelligence"
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              {selectedObject}
            </div>

            <IntelRow
              label="Node Type"
              value={
                selectedNode.type
              }
            />

            <IntelRow
              label="Category"
              value={
                selectedNode.category
              }
            />

            <IntelRow
              label="Role"
              value={
                selectedNode.role
              }
            />

            <IntelRow
              label="Confidence Weight"
              value={
                selectedNode.confidence_weight
              }
            />

            <SectionTitle
              title="Capabilities"
            />

            <BulletList
              items={
                selectedNode.capabilities
              }
            />

            <SectionTitle
              title="Limitations"
            />

            <BulletList
              items={
                selectedNode.limitations
              }
            />

            <SectionTitle
              title="Observation Vectors"
            />

            <BulletList
              items={
                selectedNode.observation_vectors
              }
            />

            <SectionTitle
              title="Recommended Actions"
            />

            <BulletList
              items={
                selectedNode.recommended_actions
              }
            />

            <SectionTitle
              title="Operational Notes"
            />

            <BulletList
              items={
                selectedNode.operational_notes
              }
            />
          </Panel>
        )}
    </div>
  );
}

// ============================================================
// PANEL
// ============================================================

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
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
        {title}
      </div>

      {children}
    </div>
  );
}

// ============================================================
// SECTION TITLE
// ============================================================

function SectionTitle({
  title,
}: {
  title: string;
}) {
  return (
    <div
      style={{
        marginTop: 18,
        marginBottom: 10,
        fontSize: 11,
        color: "#60a5fa",
        textTransform: "uppercase",
        letterSpacing: 1,
        fontWeight: 700,
      }}
    >
      {title}
    </div>
  );
}

// ============================================================
// BULLET LIST
// ============================================================

function BulletList({
  items,
}: {
  items: string[];
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          style={{
            fontSize: 12,
            color: "#d1d5db",
            lineHeight: 1.5,
            paddingLeft: 10,
            borderLeft:
              "2px solid #1f2937",
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// INTEL STACK
// ============================================================

function IntelStack({
  rows,
}: {
  rows: [string, string][];
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {rows.map(([label, value]) => (
        <IntelRow
          key={label}
          label={label}
          value={value}
        />
      ))}
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
        paddingBottom: 10,
        borderBottom:
          "1px solid #182235",
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