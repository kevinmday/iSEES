// ============================================================
// src/components/InvestigationWorkspace.tsx
// OPERATIONAL INVESTIGATION WORKSPACE (V10)
// FULL SURFACE RENDERER STABILIZATION
// DETERMINISTIC COGNITION ARCHITECTURE
// FULL DROP-IN REPLACEMENT
// ============================================================

import { useEventContext } from "../context/EventContext";
import SurfaceState from "./SurfaceState";

// ============================================================
// INVESTIGATION SURFACES
// ============================================================

const SURFACES = [
  "ASSESSMENT",
  "ACTIONS",
  "RESEARCH",
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
        background: active ? "#111827" : "#08101f",

        border: active
          ? "1px solid #374151"
          : "1px solid #1f2937",

        color: active ? "#f3f4f6" : "#9ca3af",

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
// COMPONENT
// ============================================================

export default function InvestigationWorkspace() {
  const {
    activeEvent,
    activeSurface,
    setActiveSurface,
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

  const topology = event.topology || {};

  const observability =
    event.topology_observability || {};

  const overlapRegions =
    observability.overlap_regions || [];

const renderAssessment = () => (

<SurfaceBlock title="Operational Assessment">

<div
style={{
display: "flex",
flexDirection: "column",
gap: 12,
}}
>

{event.operational_intelligence?.assessment ? (

<>

<DetailRow
label="Confidence"
value={
event.operational_intelligence
.assessment.confidence
}
/>

<DetailRow
label="Topology State"
value={
event.operational_intelligence
.assessment.topology_state
}
/>

<DetailRow
label="Primary Hypothesis"
value={
event.operational_intelligence
.assessment.primary_hypothesis
}
/>

<DetailRow
label="Primary Contradiction"
value={
event.operational_intelligence
.assessment.primary_contradiction
}
/>

<DetailRow
label="Next Best Action"
value={
event.operational_intelligence
.assessment.next_best_action
}
/>

</>

) : (

<>

<DetailRow
label="Confidence"
value={event.confidence}
/>

<DetailRow
label="Escalation"
value={event.escalation}
/>

<DetailRow
label="Facility Count"
value={event.facilities?.length || 0}
/>

</>

)}

{(event.reasoning || []).map(
(item: string, idx: number) => (

<div
key={idx}
style={{
padding: 12,
border: "1px solid #1f2937",
borderRadius: 8,
background: "#0b1220",
color: "#cbd5e1",
fontSize: 13,
}}
>
{item}
</div>

)
)}

</div>

</SurfaceBlock>

);


const renderActions = () => (

<SurfaceBlock title="Recommended Actions">

<div
style={{
display: "flex",
flexDirection: "column",
gap: 12,
}}
>

{(
event.operational_intelligence
?.recommended_actions || []
).map(
(action: string, idx: number) => (

<div
key={idx}
style={{
padding: 12,
border: "1px solid #1f2937",
borderRadius: 8,
background: "#0b1220",
color: "#cbd5e1",
fontSize: 13,
}}
>
{action}
</div>

)
)}

{(
event.operational_intelligence
?.recommended_actions || []
).length === 0 && (

<div
style={{
padding: 12,
border: "1px solid #1f2937",
borderRadius: 8,
background: "#0b1220",
color: "#64748b",
fontSize: 13,
fontStyle: "italic",
}}
>
No recommended actions available
</div>

)}

</div>

</SurfaceBlock>

);

const renderResearch = () => (

<SurfaceBlock title="Research Vectors">

<div
style={{
display: "flex",
flexDirection: "column",
gap: 12,
}}
>

{(
event.operational_intelligence
?.investigation_vectors || []
).map(
(vector: string, idx: number) => (

<div
key={idx}
style={{
padding: 12,
border: "1px solid #1f2937",
borderRadius: 8,
background: "#0b1220",
color: "#cbd5e1",
fontSize: 13,
}}
>
{vector}
</div>

)
)}

{(
event.operational_intelligence
?.investigation_vectors || []
).length === 0 && (

<div
style={{
padding: 12,
border: "1px solid #1f2937",
borderRadius: 8,
background: "#0b1220",
color: "#64748b",
fontSize: 13,
fontStyle: "italic",
}}
>
No research vectors available
</div>

)}

</div>

</SurfaceBlock>

);

const renderSummary = () => (
    <>
      <SurfaceBlock title="Manifold Reasoning">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {(event.reasoning || []).map(
            (item: string, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: 12,
                  border: "1px solid #1f2937",
                  borderRadius: 8,
                  background: "#0b1220",
                  color: "#cbd5e1",
                  fontSize: 13,
                }}
              >
                {item}
              </div>
            )
          )}
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
              topology.stability_state ||
              "UNKNOWN"
            }
          />

          <MetricBox
            label="Ambiguity"
            value={
              topology.ambiguity_state ||
              "UNKNOWN"
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
            label="Contradiction"
            value={
              topology.contradiction_density || 0
            }
          />

          <MetricBox
            label="Fragmentation"
            value={
              topology.cluster_fragmentation || 0
            }
          />
        </div>
      </SurfaceBlock>
    </>
  );

  const renderNarratives = () => (
    <SurfaceBlock title="Observer Narrative Intelligence">
      <SurfaceState
        title="Narrative Surface State"
        state="ACTIVE"
        density="MODERATE"
        topology="SEMANTICALLY COHERENT"
        pressure="RISING"
        integrity="VERIFIED"
        glyph="NARRATIVE"
        explanation={[
          "Observer narrative convergence actively propagating.",
          "Semantic topology coherence stabilized.",
          "Narrative cognition field currently synchronized.",
        ]}
      />
    </SurfaceBlock>
  );

  const renderOverlap = () => (
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

        {overlapRegions.map(
          (region: any, idx: number) => (
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
                value={region.contributing_candidates?.join(
                  " ↔ "
                )}
              />
            </div>
          )
        )}
      </div>
    </SurfaceBlock>
  );

  const renderEntanglement = () => (
    <SurfaceState
      title="Entanglement Surface"
      state="ACTIVE"
      density="HIGH"
      topology="COUPLED"
      pressure="ELEVATED"
      integrity="VERIFIED"
      glyph="ENTANGLEMENT"
      explanation={[
        "Cross-domain manifold coupling detected.",
        "Observer synchronization pressure remains elevated.",
        `Entanglement score currently ${topology.entanglement_score || 0}.`,
      ]}
    />
  );

  const renderResidual = () => (
    <SurfaceState
      title="Residual Surface"
      state="ACTIVE"
      density="MODERATE"
      topology="PROPAGATING"
      pressure="UNRESOLVED"
      integrity="PARTIAL"
      glyph="RESIDUAL"
      explanation={[
        "Residual instability continues propagating through active topology.",
        "Observer geometry remains partially unresolved.",
        `Residual instability currently ${topology.residual_instability || 0}.`,
      ]}
    />
  );

  const renderClusters = () => (
    <SurfaceState
      title="Cluster Surface"
      state="ACTIVE"
      density="HIGH"
      topology="FRAGMENTED"
      pressure="MODERATE"
      integrity="VERIFIED"
      glyph="CLUSTERS"
      explanation={[
        "Independent collapse basins currently detected.",
        "Cluster divergence remains active.",
        `Cluster fragmentation currently ${topology.cluster_fragmentation || 0}.`,
      ]}
    />
  );

  const renderCollapse = () => (
    <SurfaceState
      title="Collapse Surface"
      state="ACTIVE"
      density="HIGH"
      topology="COLLAPSING"
      pressure="SEVERE"
      integrity="UNSTABLE"
      glyph="COLLAPSE"
      explanation={[
        "Topology collapse pathways currently active.",
        "Sensor coherence degrading under manifold stress.",
        "Collapse basin convergence detected.",
      ]}
    />
  );

  const renderCandidates = () => (
    <SurfaceState
      title="Candidate Surface"
      state="ACTIVE"
      density="MODERATE"
      topology="EVALUATING"
      pressure="RISING"
      integrity="VERIFIED"
      glyph="CANDIDATES"
      explanation={[
        "Candidate object evaluation active.",
        "Operational sensor alignment underway.",
        "Contradiction filtering currently propagating.",
      ]}
    />
  );

  const renderContradictions = () => (
    <SurfaceState
      title="Contradiction Surface"
      state="ACTIVE"
      density="HIGH"
      topology="CONFLICTED"
      pressure="ELEVATED"
      integrity="UNSTABLE"
      glyph="CONTRADICTIONS"
      explanation={[
        "Contradiction density exceeds nominal baseline.",
        "Observer/sensor disagreement remains unresolved.",
        `Contradiction density currently ${topology.contradiction_density || 0}.`,
      ]}
    />
  );

  const renderHotspot = () => (
    <SurfaceState
      title="Hotspot Surface"
      state="ACTIVE"
      density="HIGH"
      topology="RECURSIVE"
      pressure="RISING"
      integrity="VERIFIED"
      glyph="HOTSPOT"
      explanation={[
        "Historical recurrence topology detected.",
        "Persistent emergence geometry remains active.",
        "Regional hotspot memory synchronization active.",
      ]}
    />
  );

  const renderGeo = () => (
    <SurfaceState
      title="Geospatial Surface"
      state="ACTIVE"
      density="MODERATE"
      topology="TERRAIN-BOUND"
      pressure="STABLE"
      integrity="VERIFIED"
      glyph="GEO"
      explanation={[
        "Terrain-aware manifold propagation active.",
        "Infrastructure geometry synchronized.",
        "Observability normalization successfully applied.",
      ]}
    />
  );

// =========================================================
// SURFACE MAP
// =========================================================

const surfaceRendererMap = {

ASSESSMENT: renderAssessment,
ACTIONS: renderActions,
RESEARCH: renderResearch,

SUMMARY: renderSummary,
NARRATIVES: renderNarratives,
OVERLAP: renderOverlap,
ENTANGLEMENT: renderEntanglement,
RESIDUAL: renderResidual,
CLUSTERS: renderClusters,
COLLAPSE: renderCollapse,
CANDIDATES: renderCandidates,
CONTRADICTIONS: renderContradictions,
HOTSPOT: renderHotspot,
GEO: renderGeo,
};

const ActiveRenderer =
surfaceRendererMap[
activeSurface as keyof typeof surfaceRendererMap
];

  // =========================================================
// MAIN RENDER
// =========================================================

return (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 18,
    }}
  >
    {/* ACTIVE EVENT HEADER */}

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

    {/* EVENT INTELLIGENCE SUMMARY */}

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
          marginBottom: 16,
        }}
      >
        Event Intelligence Summary
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
        }}
      >
        <SurfaceBlock title="What Happened">
          <div
            style={{
              fontSize: 13,
              color: "#cbd5e1",
              lineHeight: 1.6,
            }}
          >
            {(event.reasoning?.[0]) ||
              "No event summary available."}
          </div>
        </SurfaceBlock>

       <SurfaceBlock title="What It Means">
  <div
    style={{
      fontSize: 13,
      color: "#cbd5e1",
      lineHeight: 1.6,
    }}
  >
    Escalation: {event.escalation}
  </div>

  <div
    style={{
      marginTop: 10,
      fontSize: 13,
      color: "#cbd5e1",
    }}
  >
    Confidence: {event.confidence}
  </div>
</SurfaceBlock>

        <SurfaceBlock title="What To Do Next">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {(
              event.operational_intelligence
                ?.recommended_actions || []
            )
              .slice(0, 3)
              .map(
                (
                  action: string,
                  idx: number
                ) => (
                  <div key={idx}>
                    • {action}
                  </div>
                )
              )}

            {(
              event.operational_intelligence
                ?.recommended_actions || []
            ).length === 0 && (
              <div
                style={{
                  color: "#64748b",
                  fontStyle: "italic",
                }}
              >
                No recommended actions available
              </div>
            )}
          </div>
        </SurfaceBlock>

<SurfaceBlock title="Operational Significance">
  <div
    style={{
      fontSize: 13,
      color: "#cbd5e1",
      lineHeight: 1.8,
    }}
  >
    Facilities Involved:
    {" "}
    {event.facilities?.length || 0}

    <br />

    Research Targets:
    {" "}
    {(
      event.operational_intelligence
        ?.investigation_vectors || []
    ).length}

    <br />

    Escalation Level:
    {" "}
    {event.escalation}

    <br />

    Confidence:
    {" "}
    {event.confidence}
  </div>
</SurfaceBlock>

<SurfaceBlock title="Related Intelligence">
  <div
    style={{
      fontSize: 13,
      color: "#cbd5e1",
      lineHeight: 1.8,
    }}
  >
    Clusters: {event.clusters}

    <br />

    Reports: {event.reports}

    <br />

    Recurrence: {event.recurrence}

    <br />

    Trend: {event.trend}
  </div>
</SurfaceBlock>
      </div>
    </div>

    {/* SURFACE SELECTOR */}

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

    {/* ACTIVE SURFACE */}

    {ActiveRenderer && <ActiveRenderer />}
  </div>
);
}