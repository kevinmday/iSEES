// ============================================================
// src/workspace/surfaces/OverviewWorkspace.tsx
// P57-UI-A5-I4A
// CANONICAL OVERVIEW WORKSPACE
//
// Fresh-session investigation command summary.
//
// Presentation only.
//
// Canonical values are read from WorkspaceRuntime.
// No investigation, graph, Resolve, Research, or persistence
// state is created or mutated here.
// ============================================================

import {
  useWorkspaceRuntime,
} from "../runtime/WorkspaceRuntimeContext";

import GuestWelcomeOverview
  from "./GuestWelcomeOverview";

import "./OverviewWorkspace.css";

// ============================================================
// DISPLAY HELPERS
// ============================================================

function displayDate(
  value:
    string | undefined,
): string {

  if (!value) {
    return "UNAVAILABLE";
  }

  return value.slice(
    0,
    10,
  );

}

// ============================================================
// COMPONENT
// ============================================================

export default function OverviewWorkspace() {

  const runtime =
    useWorkspaceRuntime();

  const investigation =
    runtime.getActiveInvestigation();

  if (!investigation) {
    return (
      <div className="overview-workspace">
        <GuestWelcomeOverview />
      </div>
    );
  }

  const workspace =
    runtime.getWorkspace() ??
    investigation?.workspace;

  const activeLayers =
    runtime.getActiveLayers();

  const focusedEventId =
    workspace?.focused_event_id ??
    null;

  return (

    <div className="overview-workspace">

      <div className="overview-dashboard">

        {/* ================================================= */}
        {/* ACTIVE INVESTIGATION                              */}
        {/* ================================================= */}

        <section className="investigation-summary">

          <div className="summary-label">
            Active Investigation
          </div>

          <h2 className="summary-title">
            {
              investigation?.name ??
              "No Active Investigation"
            }
          </h2>

          <div className="summary-subtitle">
            {
              investigation?.description ??
              "Select or import a case from the Investigation Library."
            }
          </div>

          <div className="summary-subject">
            Investigation ID&nbsp;&nbsp;
            {
              investigation?.id ??
              "UNAVAILABLE"
            }
          </div>

          <div className="summary-location">
            Workspace&nbsp;&nbsp;
            {
              workspace?.name ??
              "UNAVAILABLE"
            }
          </div>

        </section>

        {/* ================================================= */}
        {/* CANONICAL OPERATIONAL STATE                       */}
        {/* ================================================= */}

        <section
          className="investigation-metrics"
          aria-label="Active investigation operational state"
        >

          <Metric
            label="Status"
            value={
              investigation?.status ??
              "UNAVAILABLE"
            }
          />

          <Metric
            label="Imported Cases"
            value={
              String(
                workspace
                  ?.imported_events
                  .length ??
                0
              )
            }
          />

          <Metric
            label="Artifacts"
            value={
              String(
                workspace
                  ?.artifacts
                  .length ??
                0
              )
            }
          />

          <Metric
            label="Revisions"
            value={
              String(
                investigation
                  ?.revisions
                  .length ??
                0
              )
            }
          />

          <Metric
            label="Active Layers"
            value={
              String(
                activeLayers.length
              )
            }
          />

          <Metric
            label="Updated"
            value={
              displayDate(
                investigation
                  ?.updatedAt
              )
            }
          />

        </section>

        {/* ================================================= */}
        {/* CURRENT INVESTIGATIVE FOCUS                       */}
        {/* ================================================= */}

        <section className="investigation-summary">

          <div className="summary-label">
            Current Investigative Focus
          </div>

          <h2 className="summary-title">
            {
              focusedEventId ??
              "No Event Selected"
            }
          </h2>

          <div className="summary-subtitle">
            {
              focusedEventId
                ? "The active event is ready for deterministic inspection across the available workspace modes."
                : "Choose or import a case from the Investigation Library to establish the active investigative focus."
            }
          </div>

        </section>

      </div>

    </div>

  );

}

// ============================================================
// METRIC
// ============================================================

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (

    <div className="metric-card">

      <div className="metric-label">
        {label}
      </div>

      <div className="metric-value">
        {value}
      </div>

    </div>

  );

}