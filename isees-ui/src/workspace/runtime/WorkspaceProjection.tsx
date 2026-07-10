// ============================================================
// src/workspace/runtime/WorkspaceProjection.tsx
// P37B
// RUNTIME WORKSPACE PROJECTION
//
// Deterministic projection layer between the Workspace Runtime
// and the operator interface.
//
// The Workspace Runtime owns the active Workspace Mode.
// This component simply projects the corresponding workspace
// surface.
//
// This component:
//
// • Owns no state
// • Performs no computation
// • Contains no business logic
// • Projects deterministic workspace surfaces
//
// Ownership:
//
// Operator
//      ↓
// Workspace Runtime
//      ↓
// Workspace Projection
//      ↓
// Workspace Surface
//      ↓
// React Rendering
//
// ============================================================

import type {
  ReactNode,
} from "react";

import {
  useWorkspaceRuntime,
} from "./WorkspaceRuntimeContext";

import {
  WorkspaceMode,
} from "./WorkspaceRuntimeTypes";

import {
  OverviewWorkspace,
  ManifoldWorkspace,
  CompareWorkspace,
  NarrativeWorkspace,
  EvidenceWorkspace,
  TimelineWorkspace,
  LayersWorkspace,
  IntentionWorkspace,
  ResearchWorkspace,
} from "../surfaces";

// ============================================================
// PROPS
// ============================================================

interface WorkspaceProjectionProps {

  /**
   * Temporary migration fallback.
   *
   * This remains only while the legacy workspace surface is
   * being migrated into dedicated runtime-owned workspaces.
   */
  fallback?: ReactNode;

}

// ============================================================
// COMPONENT
// ============================================================

export default function WorkspaceProjection({
  fallback,
}: WorkspaceProjectionProps) {

  const runtime =
    useWorkspaceRuntime();

   const activeMode =
    runtime.getActiveMode();

  console.log(
    "WorkspaceProjection:",
    activeMode,
  );

  switch (activeMode) {

    case WorkspaceMode.OVERVIEW:
      return <OverviewWorkspace />;

    case WorkspaceMode.MANIFOLD:
      return <ManifoldWorkspace />;

    case WorkspaceMode.COMPARE:
      return <CompareWorkspace />;

    case WorkspaceMode.NARRATIVE:
      return <NarrativeWorkspace />;

    case WorkspaceMode.EVIDENCE:
      return <EvidenceWorkspace />;

    case WorkspaceMode.TIMELINE:
      return <TimelineWorkspace />;

    case WorkspaceMode.LAYERS:
      return <LayersWorkspace />;

    case WorkspaceMode.INTENTION:
      return <IntentionWorkspace />;

    case WorkspaceMode.RESEARCH:
      return <ResearchWorkspace />;

    default:
      return <>{fallback}</>;

  }

}