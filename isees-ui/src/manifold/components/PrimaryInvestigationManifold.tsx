// ============================================================
// src/manifold/components/PrimaryInvestigationManifold.tsx
// P34C
// PRIMARY INVESTIGATION WORKSPACE
//
// The Primary Investigation Workspace is the central projection
// host for an Investigation Session.
//
// The Workspace Runtime owns the active Workspace Mode.
// This component renders the deterministic projection
// associated with that mode.
//
// Every workspace mode is a projection of the same underlying
// Investigation Session.
//
// Ownership:
//
// Operator
//      ↓
// Workspace Runtime
//      ↓
// Active Workspace Mode
//      ↓
// Primary Investigation Workspace
//      ↓
// Projection Surface
//      ↓
// Manifold Runtime
//      ↓
// Resolve–Dissolve Computation (RDC)
//
// ============================================================

import InvestigationGraph from "./InvestigationGraph";

import ManifoldToolbar, {
  type ManifoldToolbarAction,
} from "./ManifoldToolbar";

import ManifoldLayerSelector from "../../components/ManifoldLayerSelector";
import WorkspaceOverview from "../../components/WorkspaceOverview";
import ResolutionPanel from "../../components/ResolutionPanel";

import {
  manifoldRuntime,
} from "../engine/manifoldRuntime";

import {
  useGraph,
} from "../context/GraphContext";

import {
  useWorkspaceRuntime,
} from "../../workspace/runtime/WorkspaceRuntimeContext";

import {
  WorkspaceMode,
} from "../../workspace/runtime/WorkspaceRuntimeTypes";

import DrawerSection from "./DrawerSection";

// ============================================================
// TYPES
// ============================================================

interface PrimaryInvestigationManifoldProps {
  focusedEventId: string;
}

// ============================================================
// COMPONENT
// ============================================================

export default function PrimaryInvestigationManifold({
  focusedEventId,
}: PrimaryInvestigationManifoldProps) {

  const {
    selection,
  } = useGraph();

  const runtime =
    useWorkspaceRuntime();

  const activeMode =
    runtime.getActiveMode();

    // ==========================================================
  // OPERATOR ACTIONS
  // ==========================================================

  function handleToolbarAction(
    action: ManifoldToolbarAction,
  ) {

    // P31A
    //
    // The Primary Investigation Manifold owns operator intent.
    // The runtime subsystem orchestrates deterministic
    // computation while remaining independent of the UI.

    manifoldRuntime.dispatch(action);

  }

  return (
    <section
  style={{
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    overflow: "hidden",
  }}
>

  {/* ===================================================== */}
  {/* MANIFOLD HEADER REGION                               */}
  {/* ===================================================== */}

  <div
    style={{
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}
  >

      {/* ===================================================== */}
      {/* MANIFOLD OPERATOR TOOLBAR */}
      {/* ===================================================== */}

      <ManifoldToolbar
        onAction={handleToolbarAction}
      />

  </div>

     {/* ===================================================== */}
{/* INVESTIGATION MANIFOLD                               */}
{/* ===================================================== */}

<div
  style={{
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    gap: 12,
  }}
>

  <InvestigationGraph />

</div>

        {/* ===================================================== */}
      {/* DRAWER REGION                                         */}
      {/* ===================================================== */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          flexShrink: 0,
        }}
      >

    {/* ===================================================== */}
{/* LAYER CONTROLS */}
{/* ===================================================== */}

<DrawerSection
  title="Layer Controls"
>

  <ManifoldLayerSelector />

</DrawerSection>

       {/* ===================================================== */}
{/* INVESTIGATION SUMMARY */}
{/* ===================================================== */}

{activeMode === WorkspaceMode.OVERVIEW && (

  <DrawerSection
    title="Investigation Summary"
  >

    <WorkspaceOverview />

  </DrawerSection>

)}

        {/* ===================================================== */}
        {/* RESOLUTION PANEL */}
        {/* ===================================================== */}

        <ResolutionPanel
          focusedEventId={focusedEventId}
        />

        {/* ===================================================== */}
        {/* CURRENT MANIFOLD SELECTION */}
        {/* ===================================================== */}

        <div
          style={{
            marginTop: 12,
            marginBottom: 12,
            padding: 12,
            border: "1px solid #334155",
            borderRadius: 8,
            background: "#0f172a",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: 10,
              fontSize: 13,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Current Manifold Selection
          </div>

          {selection.kind === "NONE" && (
            <div
              style={{
                color: "#94a3b8",
                fontSize: 12,
              }}
            >
              Nothing selected.
              Click a node or relationship in the
              Investigation Manifold.
            </div>
          )}

          {selection.kind === "NODE" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: 12,
              }}
            >
              <div>
                <strong>Type:</strong>{" "}
                {selection.nodeType}
              </div>

              <div>
                <strong>Node:</strong>{" "}
                {selection.nodeId}
              </div>
            </div>
          )}

          {selection.kind === "EDGE" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: 12,
              }}
            >
              <div>
                <strong>Relationship</strong>
              </div>

              <div>
                {selection.sourceId}
              </div>

              <div
                style={{
                  color: "#60a5fa",
                }}
              >
                ↓
              </div>

              <div>
                {selection.targetId}
              </div>
            </div>
          )}

        </div>

      </div>

    </section>
  );

}