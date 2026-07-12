// ============================================================
// src/components/RightPanel.tsx
// CONTEXT-DRIVEN OPERATIONAL INTELLIGENCE (V9)
// EVENT-BOUND COGNITION STATE SYNCHRONIZATION
// FULL DROP-IN REPLACEMENT
// ============================================================

import { useEventContext } from "../context/EventContext";

import { buildContextualIntel } from "../intel/intel_engine";

import { objectRegistry } from "../intel/object_registry";

import { useWorkspace }
  from "../workspace/context/WorkspaceContext";

import { useEffect } from "react";

// ============================================================
// NODE TYPE RESOLUTION
// ============================================================

function resolveNodeType(
  assetName: string
): string {

  const lower =
    assetName.toLowerCase();

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
    lower.includes("naval") ||
    lower.includes("carrier") ||
    lower.includes("princeton") ||
    lower.includes("hawkeye")
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

    events,

    activeSurface,

    selectedOperationalNode,

    setSelectedOperationalNode,

  } = useEventContext();

  const {
    focusedEventId,
  } = useWorkspace();

  const activeEvent =
    events.find(
      event => event.id === focusedEventId
    ) ?? null;

  // ==========================================================
  // NO ACTIVE EVENT
  // ==========================================================

  if (!activeEvent) {

    return (

      <div
        style={{
          padding: 16,

          fontFamily:
            "Consolas, monospace",

          color: "#94a3b8",
        }}
      >
        Awaiting active event
      </div>
    );
  }

  // ==========================================================
  // CONTEXT
  // ==========================================================

  const clusterSize =
    activeEvent.clusters || 1;

  const eventType =
    activeEvent.escalation || "LOW";

  const fallbackAssets = [

    "USS Princeton",
    "USS Nimitz Carrier Group",
    "E2 Hawkeye Sensor Grid",
  ];

  const assets =
    activeEvent.facilities?.length
      ? activeEvent.facilities.map(
          (f: any) => f.name
        )
      : fallbackAssets;

    // ==========================================================
  // EVENT-BOUND NODE SYNCHRONIZATION
  // ==========================================================

  const firstAsset =
    assets[0];

  const expectedNodeName =
    selectedOperationalNode?.name;

  const eventHasSelectedNode =
    assets.includes(
      expectedNodeName || ""
    );

  useEffect(() => {

    if (
      firstAsset &&
      !eventHasSelectedNode
    ) {

      setSelectedOperationalNode({

        name: firstAsset,

        type:
          resolveNodeType(
            firstAsset
          ),
      });

    }

  }, [

    firstAsset,

    eventHasSelectedNode,

    setSelectedOperationalNode,

  ]);

  // ==========================================================
  // HANDLERS
  // ==========================================================

  const handleSelect = (
    asset: string
  ) => {

    const nodeType =
      resolveNodeType(asset);

    setSelectedOperationalNode({

      name: asset,

      type: nodeType,
    });
  };

  // ==========================================================
  // INTELLIGENCE
  // ==========================================================

  const selectedIntel =
    selectedOperationalNode
      ? buildContextualIntel(

          selectedOperationalNode.name,

          eventType,

          clusterSize
        )
      : null;

  const selectedNode =
    selectedOperationalNode
      ? objectRegistry[
          selectedOperationalNode.type
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

    NARRATIVES:
      "Narrative Intelligence",

    OVERLAP:
      "Overlap Intelligence",

    ENTANGLEMENT:
      "Entanglement Intelligence",

    RESIDUAL:
      "Residual Intelligence",

    CLUSTERS:
      "Cluster Intelligence",

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

        flexDirection:
          "column",

        gap: 16,
      }}
    >

      {/* ================================================= */}
      {/* ACTIVE EVENT */}
      {/* ================================================= */}

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

      {/* ================================================= */}
      {/* OPERATIONAL NODE SELECTOR */}
      {/* ================================================= */}

      <Panel
        title={
          surfaceTitleMap[
            activeSurface
          ] || "Operational Intelligence"
        }
      >

        <div
          style={{
            display: "flex",

            flexDirection:
              "column",

            gap: 8,
          }}
        >

          {assets.map(
            (
              asset: string
            ) => {

              const selected =
                selectedOperationalNode?.name ===
                asset;

              return (

                <div
                  key={asset}

                  onClick={() =>
                    handleSelect(asset)
                  }

                  style={{

                    cursor: "pointer",

                    border:
                      selected
                        ? "1px solid #38bdf8"
                        : "1px solid #1f2937",

                    background:
                      selected
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
              );
            }
          )}

        </div>

      </Panel>

      {/* ================================================= */}
      {/* FOCUSED NODE INTELLIGENCE */}
      {/* ================================================= */}

      {selectedIntel &&
        selectedNode &&
        selectedOperationalNode && (

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
              {selectedOperationalNode.name}
            </div>

            {/* =========================================== */}
            {/* CORE INTEL */}
            {/* =========================================== */}

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

            {/* =========================================== */}
            {/* CONTACTS */}
            {/* =========================================== */}

            <SectionTitle title="Contacts" />

            <IntelStack
              rows={[

                [
                  "Facility ID",
                  selectedNode.contacts?.facility_id ||
                    "Unknown",
                ],

                [
                  "Ops Phone",
                  selectedNode.contacts?.ops_phone ||
                    "Unknown",
                ],

                [
                  "Tower Frequency",
                  selectedNode.contacts?.tower_frequency ||
                    "Unknown",
                ],

                [
                  "Coordination",
                  selectedNode.contacts?.coordination_line ||
                    "Unknown",
                ],

                [
                  "Reporting Chain",
                  selectedNode.contacts?.reporting_chain ||
                    "Unknown",
                ],
              ]}
            />

            {/* =========================================== */}
            {/* SENSOR STACK */}
            {/* =========================================== */}

            <SectionTitle title="Sensor Stack" />

            <SensorStack
              stack={
                selectedNode.sensor_stack
              }
            />

            {/* =========================================== */}
            {/* CAPABILITIES */}
            {/* =========================================== */}

            <SectionTitle title="Capabilities" />

            <BulletList
              items={
                selectedNode.capabilities
              }
            />

            {/* =========================================== */}
            {/* LIMITATIONS */}
            {/* =========================================== */}

            <SectionTitle title="Limitations" />

            <BulletList
              items={
                selectedNode.limitations
              }
            />

            {/* =========================================== */}
            {/* BLIND SPOTS */}
            {/* =========================================== */}

            <SectionTitle title="Blind Spots" />

            <BulletList
              items={
                selectedNode.blind_spots
              }
            />

            {/* =========================================== */}
            {/* SURFACE-SPECIFIC */}
            {/* =========================================== */}

            {activeSurface ===
              "CONTRADICTIONS" && (

              <>

                <SectionTitle title="Contradiction Vectors" />

                <BulletList
                  items={
                    selectedNode.contradiction_vectors
                  }
                />

              </>
            )}

            {activeSurface ===
              "COLLAPSE" && (

              <>

                <SectionTitle title="Failure Modes" />

                <BulletList
                  items={
                    selectedNode.collapse_failure_modes
                  }
                />

              </>
            )}

            {activeSurface ===
              "HOTSPOT" && (

              <>

                <SectionTitle title="Geo Constraints" />

                <BulletList
                  items={
                    selectedNode.geo_constraints
                  }
                />

              </>
            )}

            {/* =========================================== */}
            {/* OPERATIONAL NOTES */}
            {/* =========================================== */}

            <SectionTitle title="Operational Notes" />

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
// SENSOR STACK
// ============================================================

function SensorStack({
  stack,
}: {
  stack?: any[];
}) {

  if (!stack || stack.length === 0) {

    return (

      <div
        style={{
          fontSize: 12,

          color: "#64748b",

          fontStyle: "italic",
        }}
      >
        No sensor intelligence available
      </div>
    );
  }

  return (

    <div
      style={{
        display: "flex",

        flexDirection:
          "column",

        gap: 10,
      }}
    >

      {stack.map(
        (
          sensor,
          idx
        ) => (

          <div
            key={idx}

            style={{

              border:
                "1px solid #1f2937",

              borderRadius: 6,

              padding: 10,

              background:
                "#08101d",
            }}
          >

            <div
              style={{
                fontWeight: 700,

                marginBottom: 6,

                fontSize: 13,
              }}
            >
              {sensor.name}
            </div>

            <IntelStack
              rows={[

                [
                  "Type",
                  sensor.type,
                ],

                [
                  "Range",
                  sensor.range,
                ],

                [
                  "Refresh",
                  sensor.refresh_rate,
                ],

                [
                  "Notes",
                  sensor.notes,
                ],
              ]}
            />

          </div>
        )
      )}

    </div>
  );
}

// ============================================================
// BULLET LIST
// ============================================================

function BulletList({
  items,
}: {
  items?: string[];
}) {

  if (!items || items.length === 0) {

    return (

      <div
        style={{
          fontSize: 12,

          color: "#64748b",

          fontStyle: "italic",
        }}
      >
        No operational intelligence available
      </div>
    );
  }

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