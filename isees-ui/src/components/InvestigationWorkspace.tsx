// ============================================================
// src/components/InvestigationWorkspace.tsx
// OPERATIONAL INVESTIGATION WORKSPACE (V10)
// FULL SURFACE RENDERER STABILIZATION
// DETERMINISTIC COGNITION ARCHITECTURE
// FULL DROP-IN REPLACEMENT
// ============================================================

import { useEventContext } from "../context/EventContext";
import AssessmentSurface from "./surfaces/AssessmentSurface";
import ActionsSurface from "./surfaces/ActionsSurface";
import ResearchSurface from "./surfaces/ResearchSurface";
import SummarySurface from "./surfaces/SummarySurface";
import NarrativesSurface from "./surfaces/NarrativesSurface";
import OverlapSurface from "./surfaces/OverlapSurface";
import EntanglementSurface from "./surfaces/EntanglementSurface";
import ResidualSurface from "./surfaces/ResidualSurface";
import ClustersSurface from "./surfaces/ClustersSurface";
import CollapseSurface from "./surfaces/CollapseSurface";
import CandidatesSurface from "./surfaces/CandidatesSurface";
import ContradictionsSurface from "./surfaces/ContradictionsSurface";
import HotspotSurface from "./surfaces/HotspotSurface";
import GeoSurface from "./surfaces/GeoSurface";
import { WorkspaceHeader } from "./WorkspaceHeader";
import IntelligenceSummary from "./IntelligenceSummary";
import ManifoldLayerSelector from "./ManifoldLayerSelector";
import WorkspaceOverview from "./WorkspaceOverview";
import ResolutionPanel from "./ResolutionPanel";

import {
  useWorkspace,
} from "../workspace/context/WorkspaceContext";

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
    events,
    activeSurface,
    setActiveSurface,
  } = useEventContext();

  const {
    focusedEventId,
  } = useWorkspace();

  if (!focusedEventId) {
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

  const activeEvent =
    events.find(
      event => event.id === focusedEventId
    ) ?? null;

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
        Event not found in workspace
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
    <NarrativesSurface
      narratives={activeEvent.narratives ?? []}
    />
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
    <CandidatesSurface />
  );

  const renderContradictions = () => (
    <ContradictionsSurface
      contradictionDensity={
        topology.contradiction_density || 0
      }
    />
  );

  const renderHotspot = () => (
    <HotspotSurface />
  );

  const renderGeo = () => (
    <GeoSurface />
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

<WorkspaceHeader event={event} />

<WorkspaceOverview />

<ResolutionPanel />

<ManifoldLayerSelector />

<IntelligenceSummary event={event} />

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