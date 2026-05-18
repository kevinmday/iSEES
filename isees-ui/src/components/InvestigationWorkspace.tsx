// ============================================================
// src/components/InvestigationWorkspace.tsx
// OPERATIONAL INVESTIGATION WORKSPACE (V9)
// PROCEDURAL COGNITION ENABLED
// NARRATIVE INTELLIGENCE ENABLED
// SURFACE STATE ENGINE ENABLED
// FULL DROP-IN REPLACEMENT
// ============================================================

import { useEventContext } from "../context/EventContext";
import { objectRegistry } from "../intel/object_registry";
import SurfaceState from "./SurfaceState";

// ============================================================
// INVESTIGATION SURFACES
// ============================================================

const SURFACES = [
  "SUMMARY",
  "NARRATIVES",
  "OVERLAP",
  "ENTANGLEMENT",
  "RESIDUAL",
  "CLUSTERS",
  "COLLAPSE",
  "CANDIDATES",
  "CONTRADICTIONS",
  "HOTSPOT",
  "GEO",
];

// ============================================================
// METRIC BOX
// ============================================================

function MetricBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {

  return (

    <div
      style={{
        border: "1px solid #1f2937",
        borderRadius: 8,
        padding: 14,
        background: "#08101f",
      }}
    >

      <div
        style={{
          fontSize: 10,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 10,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#d1d5db",
        }}
      >
        {value}
      </div>

    </div>
  );
}

// ============================================================
// SURFACE BUTTON
// ============================================================

function SurfaceButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {

  return (

    <button
      onClick={onClick}
      style={{
        background: active
          ? "#111827"
          : "#08101f",

        border: active
          ? "1px solid #374151"
          : "1px solid #1f2937",

        color: active
          ? "#f3f4f6"
          : "#9ca3af",

        padding: "8px 12px",

        borderRadius: 6,

        fontSize: 11,

        fontWeight: 700,

        letterSpacing: 1,

        cursor: "pointer",

        textTransform: "uppercase",
      }}
    >
      {label}
    </button>
  );
}

// ============================================================
// SURFACE BLOCK
// ============================================================

function SurfaceBlock({
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
        borderRadius: 10,
        padding: 18,
        background: "#08101f",
      }}
    >

      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 18,
        }}
      >
        {title}
      </div>

      {children}

    </div>
  );
}

// ============================================================
// DETAIL ROW
// ============================================================

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {

  return (

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid #172033",
      }}
    >

      <div
        style={{
          fontSize: 12,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 13,
          color: "#d1d5db",
          fontWeight: 600,
        }}
      >
        {value}
      </div>

    </div>
  );
}

// ============================================================
// VECTOR BUILDER
// ============================================================

function buildInvestigationVectors({
  surface,
  node,
  topology,
}: {
  surface: string;
  node: any;
  topology: any;
}) {

  const vectors: string[] = [];

  if (!node) {

    return [
      "Select an operational node to begin procedural investigation reasoning.",
    ];
  }

  if (surface === "SUMMARY") {

    vectors.push(
      "Pull operational logs during synchronized observation window."
    );

    vectors.push(
      "Cross-reference pilot communications with manifold overlap timing."
    );

    vectors.push(
      "Validate whether sensor coverage aligns with reported emergence geometry."
    );

    vectors.push(
      "Correlate tower observations against regional radar coordination."
    );
  }

  if (surface === "CONTRADICTIONS") {

    (node.contradiction_vectors || []).forEach(
      (v: string) => vectors.push(v)
    );

    vectors.push(
      "Investigate divergence between visual confirmation and sensor correlation."
    );

    vectors.push(
      "Evaluate transponder absence against topology instability propagation."
    );
  }

  if (surface === "COLLAPSE") {

    (node.collapse_failure_modes || []).forEach(
      (v: string) => vectors.push(v)
    );

    vectors.push(
      "Assess terrain masking against radar horizon geometry."
    );

    vectors.push(
      "Evaluate low-RCS collapse pathways against sensor refresh intervals."
    );

    vectors.push(
      `Residual instability currently measured at ${topology.residual_instability || 0}.`
    );
  }

  if (surface === "HOTSPOT") {

    vectors.push(
      "Compare current emergence geometry against historical recurrence zones."
    );

    vectors.push(
      "Cross-reference infrastructure overlap with prior hotspot memory."
    );

    vectors.push(
      "Evaluate whether regional node convergence indicates persistent manifold recurrence."
    );
  }

  if (surface === "GEO") {

    (node.geo_constraints || []).forEach(
      (v: string) => vectors.push(v)
    );

    vectors.push(
      "Evaluate terrain geometry against observational visibility windows."
    );

    vectors.push(
      "Assess infrastructure placement relative to manifold propagation pathways."
    );
  }

  if (surface === "CANDIDATES") {

    (node.observation_vectors || []).forEach(
      (v: string) => vectors.push(v)
    );

    vectors.push(
      "Evaluate candidate alignment against operational sensor capabilities."
    );

    vectors.push(
      "Cross-check candidate consistency against contradiction density."
    );
  }

  if (surface === "ENTANGLEMENT") {

    vectors.push(
      "Investigate cross-domain coupling between active collapse basins."
    );

    vectors.push(
      "Determine whether sensor observations exhibit synchronized manifold interaction."
    );

    vectors.push(
      `Global entanglement currently estimated at ${topology.entanglement_score || 0}.`
    );
  }

  if (surface === "RESIDUAL") {

    vectors.push(
      "Trace unresolved manifold pressure propagation across infrastructure nodes."
    );

    vectors.push(
      "Evaluate whether residual instability persists across independent observers."
    );

    vectors.push(
      `Residual propagation currently measured at ${topology.residual_instability || 0}.`
    );
  }

  if (surface === "CLUSTERS") {

    vectors.push(
      "Evaluate fragmentation between independent collapse basins."
    );

    vectors.push(
      "Determine whether cluster separation reflects true topology divergence."
    );

    vectors.push(
      `Cluster fragmentation currently estimated at ${topology.cluster_fragmentation || 0}.`
    );
  }

  return vectors;
}

// ============================================================
// COMPONENT
// ============================================================

export default function InvestigationWorkspace() {

  const {

    activeEvent,

    activeSurface,

    setActiveSurface,

    selectedOperationalNode,

  } = useEventContext();

  if (!activeEvent) {

    return (

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          color: "#9ca3af",
          fontSize: 18,
        }}
      >
        Awaiting active event selection
      </div>
    );
  }

  const event = activeEvent;

  const topology =
    event.topology || {};

  const observability =
    event.topology_observability || {};

  const overlapRegions =
    observability.overlap_regions || [];

  const selectedNode =
    selectedOperationalNode
      ? objectRegistry[
          selectedOperationalNode.type
        ]
      : null;

  const investigationVectors =
    buildInvestigationVectors({

      surface:
        activeSurface,

      node:
        selectedNode,

      topology,
    });

  const topologyInterpretation = [

    `Manifold stability currently classified as ${topology.stability_state?.toLowerCase() || "unknown"}.`,

    `Ambiguity state remains ${topology.ambiguity_state?.toLowerCase() || "unknown"} during active collapse evaluation.`,

    `Residual instability propagation measured at ${topology.residual_instability || 0}.`,

    `Cross-domain entanglement currently estimated at ${topology.entanglement_score || 0}.`,
  ];

  return (

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >

      {/* ================================================= */}
      {/* ACTIVE EVENT HEADER */}
      {/* ================================================= */}

      <div
        style={{
          border: "1px solid #1f2937",
          borderRadius: 10,
          padding: 18,
          background: "#08101f",
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >

          <div>

            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: 1,
              }}
            >
              {event.id}
            </div>

            <div
              style={{
                marginTop: 6,
                color: "#9ca3af",
                fontSize: 13,
              }}
            >
              {event.location}
            </div>

          </div>

          <div
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              background: "#0f172a",
              border: "1px solid #1f2937",

              color:
                event.escalation === "HIGH"
                  ? "#f87171"
                  : "#86efac",

              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            {event.escalation}
          </div>

        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(6, 1fr)",
            gap: 12,
          }}
        >

          <MetricBox
            label="Confidence"
            value={event.confidence}
          />

          <MetricBox
            label="Reports"
            value={event.reports}
          />

          <MetricBox
            label="Clusters"
            value={event.clusters}
          />

          <MetricBox
            label="Duration"
            value={event.duration}
          />

          <MetricBox
            label="Recurrence"
            value={event.recurrence}
          />

          <MetricBox
            label="Trend"
            value={event.trend}
          />

        </div>

      </div>

      {/* ================================================= */}
      {/* SURFACE SELECTOR */}
      {/* ================================================= */}

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >

        {SURFACES.map((surface) => (

          <SurfaceButton
            key={surface}
            label={surface}
            active={
              activeSurface === surface
            }
            onClick={() =>
              setActiveSurface(surface as any)
            }
          />

        ))}

      </div>

      {/* ================================================= */}
      {/* SUMMARY */}
      {/* ================================================= */}

      {activeSurface === "SUMMARY" && (

        <>

          <SurfaceBlock title="Manifold Reasoning">

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >

              {event.reasoning.map((item: string, idx: number) => (

                <div
                  key={idx}
                  style={{
                    padding: 12,
                    border: "1px solid #1f2937",
                    borderRadius: 8,
                    background: "#0b1220",
                    color: "#cbd5e1",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {item}
                </div>

              ))}

            </div>

          </SurfaceBlock>

          <SurfaceBlock title="Topology State">

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, 1fr)",
                gap: 12,
              }}
            >

              <MetricBox
                label="Stability"
                value={
                  topology.stability_state || "UNKNOWN"
                }
              />

              <MetricBox
                label="Ambiguity"
                value={
                  topology.ambiguity_state || "UNKNOWN"
                }
              />

              <MetricBox
                label="Contradiction"
                value={
                  topology.contradiction_density || 0
                }
              />

              <MetricBox
                label="Residual"
                value={
                  topology.residual_instability || 0
                }
              />

              <MetricBox
                label="Entanglement"
                value={
                  topology.entanglement_score || 0
                }
              />

              <MetricBox
                label="Fragmentation"
                value={
                  topology.cluster_fragmentation || 0
                }
              />

            </div>

            <div
              style={{
                marginTop: 18,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >

              {topologyInterpretation.map(
                (item, idx) => (

                  <div
                    key={idx}
                    style={{
                      padding: 12,
                      border:
                        "1px solid #1f2937",
                      borderRadius: 8,
                      background: "#0b1220",
                      color: "#cbd5e1",
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    {item}
                  </div>

                )
              )}

            </div>

          </SurfaceBlock>

          <SurfaceBlock title="Investigation Vectors">

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >

              {investigationVectors.map(
                (vector, idx) => (

                  <div
                    key={idx}
                    style={{
                      padding: 14,
                      border:
                        "1px solid #1f2937",
                      borderRadius: 8,
                      background: "#0b1220",
                      color: "#d1d5db",
                      fontSize: 13,
                      lineHeight: 1.6,
                      borderLeft:
                        "3px solid #2563eb",
                    }}
                  >
                    {vector}
                  </div>

                )
              )}

            </div>

          </SurfaceBlock>

        </>

      )}

      {/* ================================================= */}
      {/* NARRATIVES */}
      {/* ================================================= */}

      {activeSurface === "NARRATIVES" && (

        <SurfaceBlock title="Observer Narrative Intelligence">

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >

            {(event.narratives || []).length === 0 && (

              <SurfaceState
                title="Narrative Surface State"
                state="SPARSE"
                density="LOW"
                topology="DISCONNECTED"
                pressure="MINIMAL"
                integrity="VERIFIED"
                glyph="NONE"
                explanation={[
                  "No observer narratives currently attached to active manifold reconstruction.",
                  "Semantic convergence density remains below narrative activation threshold.",
                  "Additional observer testimony required for higher-order narrative synthesis.",
                ]}
              />

            )}

          </div>

        </SurfaceBlock>

      )}

      {/* ================================================= */}
      {/* OVERLAP */}
      {/* ================================================= */}

      {activeSurface === "OVERLAP" && (

        <SurfaceBlock title="Overlap Regions">

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >

            {overlapRegions.length === 0 && (

              <SurfaceState
                title="Overlap Surface State"
                state="SPARSE"
                density="LOW"
                topology="DISCONNECTED"
                pressure="MINIMAL"
                integrity="VERIFIED"
                glyph="OVERLAP"
                explanation={[
                  "No statistically significant overlap manifold regions detected.",
                  "Observer geometry currently lacks synchronized spatial convergence.",
                  "Spatial overlap activation threshold has not been reached.",
                ]}
              />

            )}

            {overlapRegions.map((region: any, idx: number) => (

              <div
                key={idx}
                style={{
                  border: "1px solid #1f2937",
                  borderRadius: 8,
                  padding: 14,
                  background: "#0b1220",
                }}
              >

                <DetailRow
                  label="Overlap Score"
                  value={region.overlap_score}
                />

                <DetailRow
                  label="Candidates"
                  value={region.contributing_candidates?.join(" ↔ ")}
                />

              </div>

            ))}

          </div>

        </SurfaceBlock>

      )}

    </div>
  );
}
