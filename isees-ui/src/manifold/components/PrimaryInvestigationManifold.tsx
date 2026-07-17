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

  // ==========================================================
  // CONTEXT
  // ==========================================================

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
  ): void {

    // --------------------------------------------------------
    // The Primary Investigation Manifold owns operator intent.
    //
    // The Manifold Runtime performs the deterministic
    // orchestration of the requested operation.
    // --------------------------------------------------------

    manifoldRuntime.dispatch(action);

  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        height: "100%",
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
          gap: 16,
          paddingBottom: 8,
          borderBottom: "1px solid rgba(148,163,184,0.12)",
        }}
      >

          {/* ===================================================== */}
      {/* MANIFOLD OPERATOR TOOLBAR                            */}
      {/* ===================================================== */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          width: "100%",
        }}
      >

        <ManifoldToolbar
          onAction={handleToolbarAction}
        />

      </div>

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
          overflow: "hidden",
          border: "1px solid rgba(148,163,184,0.12)",
          borderRadius: 12,
          background: "#020617",
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
          gap: 16,
          flexShrink: 0,
          paddingTop: 8,
          borderTop: "1px solid rgba(148,163,184,0.12)",
        }}
      >

        {/* ===================================================== */}
        {/* LAYER CONTROLS                                       */}
        {/* ===================================================== */}

        <DrawerSection
          title="Layer Controls"
        >

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >

            <ManifoldLayerSelector />

          </div>

        </DrawerSection>

        {/* ===================================================== */}
        {/* INVESTIGATION SUMMARY                                */}
        {/* ===================================================== */}

        {activeMode === WorkspaceMode.OVERVIEW && (

          <DrawerSection
            title="Investigation Summary"
          >

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >

              <WorkspaceOverview />

            </div>

          </DrawerSection>

        )}

        {/* ===================================================== */}
        {/* RESOLUTION PANEL                                     */}
        {/* ===================================================== */}

        <DrawerSection
          title="Resolution"
        >

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >

            <ResolutionPanel
              focusedEventId={focusedEventId}
            />

          </div>

        </DrawerSection>

        {/* ===================================================== */}
        {/* CURRENT MANIFOLD SELECTION                           */}
        {/* ===================================================== */}

        <DrawerSection
          title="Current Selection"
        >

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              padding: 12,
              border: "1px solid rgba(148,163,184,0.12)",
              borderRadius: 8,
              background: "#0f172a",
            }}
          >

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

        </DrawerSection>

      </div>

    </section>

  );

}