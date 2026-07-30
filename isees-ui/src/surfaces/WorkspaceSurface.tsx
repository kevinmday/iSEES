// ============================================================
// src/surfaces/WorkspaceSurface.tsx
// P36
// WORKSPACE SURFACE
//
// Runtime-owned workspace projection router.
//
// The Workspace Surface selects the active operator workspace
// based on the deterministic Workspace Runtime.
//
// Ownership:
//
// Workspace Runtime
//      ↓
// Active Workspace Mode
//      ↓
// Workspace Surface
//      ↓
// Projection Surface
//
// Computational ownership remains below the Workspace Runtime.
// ============================================================

import {
  useWorkspaceRuntime,
} from "../workspace/runtime/WorkspaceRuntimeContext";

import {
  WorkspaceMode,
} from "../workspace/runtime/WorkspaceRuntimeTypes";

import InvestigationWorkspace
  from "../components/InvestigationWorkspace";

import ManifoldWorkspace
  from "../workspace/surfaces/ManifoldWorkspace";

import ResearchWorkspace
  from "../workspace/surfaces/ResearchWorkspace";

// ============================================================
// PLACEHOLDER SURFACE
// ============================================================

function PlaceholderSurface({
  title,
}: {
  title: string;
}) {

  return (

    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: 520,

        border: "1px solid #223047",
        borderRadius: 10,

        background: "#09111f",

        color: "#94a3b8",

        fontSize: 28,
        fontWeight: 700,
        letterSpacing: 1,
      }}
    >
      {title}
    </div>

  );

}

// ============================================================
// COMPONENT
// ============================================================

export default function WorkspaceSurface() {

  const runtime =
    useWorkspaceRuntime();

  switch (
    runtime.getActiveMode()
  ) {

    case WorkspaceMode.OVERVIEW:

      return (
        <PlaceholderSurface
          title="Overview Workspace"
        />
      );

case WorkspaceMode.MANIFOLD:

  return (
    <ManifoldWorkspace />
  );

    case WorkspaceMode.COMPARE:

      return (
        <PlaceholderSurface
          title="Comparative Analysis Workspace"
        />
      );

    case WorkspaceMode.NARRATIVE:

      return (
        <PlaceholderSurface
          title="Narrative Workspace"
        />
      );

    case WorkspaceMode.EVIDENCE:

      return (
        <PlaceholderSurface
          title="Evidence Workspace"
        />
      );

    case WorkspaceMode.TIMELINE:

      return (
        <PlaceholderSurface
          title="Timeline Workspace"
        />
      );

    case WorkspaceMode.LAYERS:

      return (
        <PlaceholderSurface
          title="Layer Analysis Workspace"
        />
      );

    case WorkspaceMode.INTENTION:

      return (
        <PlaceholderSurface
          title="Intention Workspace"
        />
      );

case WorkspaceMode.RESEARCH:

  return (

    <ResearchWorkspace />

  );

    default:

      return (
        <InvestigationWorkspace />
      );

  }

}