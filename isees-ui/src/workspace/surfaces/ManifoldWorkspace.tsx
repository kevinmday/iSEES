// ============================================================
// ManifoldWorkspace.tsx
// P45A
// CANON-DRIVEN WORKSPACE RECOVERY
// PRODUCTION MANIFOLD WORKSPACE
//
// Canonical interactive Investigation Manifold workspace.
//
// Presentation-only.
//
// The active investigation and focused event are projected
// from the canonical Workspace Runtime into the Primary
// Investigation Manifold.
//
// Owns:
// • Production workspace layout
// • Manifold presentation
//
// Does NOT own:
// • Investigation state
// • Runtime
// • Graph engine
// • Selection logic
// • Manifold computation
//
// Ownership:
//
// Workspace Runtime
//      ↓
// Manifold Workspace
//      ↓
// Primary Investigation Manifold
//
// ============================================================

import PrimaryInvestigationManifold
  from "../../manifold/components/PrimaryInvestigationManifold";

import {
  useActiveWorkspace,
  useWorkspaceRuntime,
} from "../runtime/WorkspaceRuntimeContext";
import { WorkspaceMode } from "../runtime/WorkspaceRuntimeTypes";
import StudioManifoldArtifactReview from "./StudioManifoldArtifactReview";

// ============================================================
// COMPONENT
// ============================================================

export default function ManifoldWorkspace() {

  const activeWorkspace =
    useActiveWorkspace();
  const runtime = useWorkspaceRuntime();
  const artifactReview = runtime.getStudioManifoldArtifactReview();

  const focusedEventId =
    activeWorkspace
      ?.focused_event_id;

  // ==========================================================
  // NO ACTIVE INVESTIGATION FOCUS
  // ==========================================================

  if (!focusedEventId && !artifactReview) {

    return (

      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 0,

          color: "#94a3b8",
          fontSize: 16,
        }}
      >
        Awaiting active event selection
      </div>

    );

  }

  // ==========================================================
  // MANIFOLD WORKSPACE
  // ==========================================================

  return (

    <div
      style={{
        position: "relative",
        flex: 1,
        width: "100%",
        height: "100%",
        minWidth: 0,
        minHeight: 0,

        display: "flex",

        overflow: "hidden",
      }}
    >

      {artifactReview
        ? <StudioManifoldArtifactReview
            artifact={artifactReview}
            onReturnToStudio={() => {
              runtime.clearStudioManifoldArtifactReview(artifactReview);
              runtime.navigateToMode(WorkspaceMode.RESEARCH);
            }}
          />
        : focusedEventId && <PrimaryInvestigationManifold focusedEventId={focusedEventId} />}

    </div>

  );

}
