// ============================================================
// src/components/RightPanel.tsx
// CONTEXT-DRIVEN OPERATIONAL INTELLIGENCE (V5)
// SURFACE-AWARE ADAPTIVE NODE COGNITION
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

  if (
    lower.includes("naval")
  ) {
    return "MILITARY_SENSOR";
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
  // CONTEXT
  // ----------------------------------------------------------

  const clusterSize =
    activeEvent.clusters || 1;

  const eventType =
    activeEvent.escalation || "LOW";

  const assets =
    activeEvent.facilities?.map(
      (f) => f.name
    ) || [];

  // ==========================================================
  // HANDLERS
  // ==========================================================

  const handleSelect = (
    asset: string
  ) => {
    setSelectedObject(asset);
  };

  // ==========================================================
  // INTELLIGENCE
  // ==========================================================

  const selectedIntel =
    selectedObject
      ? buildContextualIntel(
          selectedObject,
          eventType,
          clusterSize
        )
      : null;

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
        fontFamily:
          "Consolas, monospace",

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
        {activeSurface ===
          "SUMMARY" && (
          <div
            style={{
              display: "flex",
              flexDirection:
                "column",

              gap: 8,
            }}
          >
            {assets.map((asset) => (
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
            ))}
          </div>
        )}

        {activeSurface !==
          "SUMMARY" && (
          <IntelStack
            rows={[
              [
                "Surface",
                activeSurface,
              ],

              [
                "Interpretation Mode",
                "Adaptive cognition enabled",
              ],

              [
                "Context State",
                "Surface-aware node reasoning active",
              ],
            ]}
          />
        )}
      </Panel>

      {/* =================================================== */}
      {/* FOCUSED NODE INTELLIGENCE */}
      {/* =================================================== */}

      {selectedIntel &&
        selectedNode && (
          <Panel
            title={`Focused Node Intelligence — ${activeSurface}`}
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

            {/* =========================================== */}
            {/* SUMMARY */}
            {/* =========================================== */}

            {activeSurface ===
              "SUMMARY" && (
              <>
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

                <SectionTitle title="Capabilities" />

                <BulletList
                  items={
                    selectedNode.capabilities
                  }
                />

                <SectionTitle title="Recommended Actions" />

                <BulletList
                  items={
                    selectedNode.recommended_actions
                  }
                />
              </>
            )}

            {/* =========================================== */}
            {/* COLLAPSE */}
            {/* =========================================== */}

            {activeSurface ===
              "COLLAPSE" && (
              <>
                <IntelRow
                  label="Collapse Relevance"
                  value="Node failed full contextual resolution"
                />

                <SectionTitle title="Failure Modes" />

                <BulletList
                  items={
                    selectedNode.collapse_failure_modes
                  }
                />

                <SectionTitle title="Limitations" />

                <BulletList
                  items={
                    selectedNode.limitations
                  }
                />
              </>
            )}

            {/* =========================================== */}
            {/* CANDIDATES */}
            {/* =========================================== */}

            {activeSurface ===
              "CANDIDATES" && (
              <>
                <IntelRow
                  label="Candidate Support"
                  value="Partial candidate alignment detected"
                />

                <SectionTitle title="Observation Vectors" />

                <BulletList
                  items={
                    selectedNode.observation_vectors
                  }
                />

                <SectionTitle title="Capabilities" />

                <BulletList
                  items={
                    selectedNode.capabilities
                  }
                />
              </>
            )}

            {/* =========================================== */}
            {/* CONTRADICTIONS */}
            {/* =========================================== */}

            {activeSurface ===
              "CONTRADICTIONS" && (
              <>
                <IntelRow
                  label="Contradiction State"
                  value="Sensor divergence present"
                />

                <SectionTitle title="Contradiction Vectors" />

                <BulletList
                  items={
                    selectedNode.contradiction_vectors
                  }
                />

                <SectionTitle title="Operational Notes" />

                <BulletList
                  items={
                    selectedNode.operational_notes
                  }
                />
              </>
            )}

            {/* =========================================== */}
            {/* HOTSPOT */}
            {/* =========================================== */}

            {activeSurface ===
              "HOTSPOT" && (
              <>
                <IntelRow
                  label="Recurrence Relevance"
                  value="Persistent regional infrastructure overlap"
                />

                <SectionTitle title="Geo Constraints" />

                <BulletList
                  items={
                    selectedNode.geo_constraints
                  }
                />

                <SectionTitle title="Operational Notes" />

                <BulletList
                  items={
                    selectedNode.operational_notes
                  }
                />
              </>
            )}

            {/* =========================================== */}
            {/* GEO */}
            {/* =========================================== */}

            {activeSurface ===
              "GEO" && (
              <>
                <IntelRow
                  label="Infrastructure Relevance"
                  value="Geo-spatial investigative node"
                />

                <SectionTitle title="Geo Constraints" />

                <BulletList
                  items={
                    selectedNode.geo_constraints
                  }
                />

                <SectionTitle title="Limitations" />

                <BulletList
                  items={
                    selectedNode.limitations
                  }
                />
              </>
            )}
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
        border:
          "1px solid #1f2937",

        borderRadius: 8,

        padding: 12,

        background: "#0b1220",
      }}
    >
      <div
        style={{
          fontSize: 11,

          textTransform:
            "uppercase",

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
        textTransform:
          "uppercase",
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
        flexDirection:
          "column",
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
        flexDirection:
          "column",
        gap: 12,
      }}
    >
      {rows.map(
        ([label, value]) => (
          <IntelRow
            key={label}
            label={label}
            value={value}
          />
        )
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
        paddingBottom: 10,

        borderBottom:
          "1px solid #182235",
      }}
    >
      <div
        style={{
          fontSize: 10,

          textTransform:
            "uppercase",

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