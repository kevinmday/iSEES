// ============================================================
// src/components/InvestigationWorkspace.tsx
// OPERATIONAL INVESTIGATION WORKSPACE (V10)
// FULL SURFACE RENDERER STABILIZATION
// DETERMINISTIC COGNITION ARCHITECTURE
// FULL DROP-IN REPLACEMENT
// ============================================================

import { useEventContext } from "../context/EventContext";
import SurfaceState from "./SurfaceState";
import AssessmentSurface from "./surfaces/AssessmentSurface";
import ActionsSurface from "./surfaces/ActionsSurface";
import ResearchSurface from "./surfaces/ResearchSurface";
import MetricBox from "./surfaces/MetricBox";
import SummarySurface from "./surfaces/SummarySurface";
import NarrativesSurface from "./surfaces/NarrativesSurface";
import OverlapSurface from "./surfaces/OverlapSurface";
import EntanglementSurface from "./surfaces/EntanglementSurface";
import ResidualSurface from "./surfaces/ResidualSurface";
import ClustersSurface from "./surfaces/ClustersSurface";
import CollapseSurface from "./surfaces/CollapseSurface";

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
  <AssessmentSurface event={event} />
);

const renderActions = () => (
  <ActionsSurface event={event} />
);

const renderResearch = () => (
  <ResearchSurface event={event} />
);

const renderSummary = () => (
  <SummarySurface
    event={event}
    topology={topology}
  />
);

const renderNarratives = () => (
  <NarrativesSurface />
);

const renderOverlap = () => (
  <OverlapSurface
    overlapRegions={overlapRegions}
    DetailRow={DetailRow}
  />
);

const renderEntanglement = () => (
  <EntanglementSurface
    topology={topology}
  />
);

const renderResidual = () => (
  <ResidualSurface
    topology={topology}
  />
);

const renderClusters = () => (
  <ClustersSurface
    topology={topology}
  />
);

const renderCollapse = () => (
  <CollapseSurface />
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