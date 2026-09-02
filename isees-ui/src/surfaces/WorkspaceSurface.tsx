// ============================================================
// src/surfaces/WorkspaceSurface.tsx
// P51A
// WORKSPACE SURFACE
//
// Runtime-owned workspace projection router.
//
// The Workspace Surface selects the active operator workspace
// based on the deterministic Workspace Runtime.
//
// P56D-I1-G2:
//
// AuthorDocumentRuntime ownership has been promoted out of the
// RESEARCH / Studio projection.
//
// Studio is a projection of persistent Author runtime state.
// Entering or leaving Studio must therefore not create or destroy
// the Author runtime observation boundary.
//
// The permanent AuthorDocumentRuntimeProvider is owned by the
// operational application provider tree.
//
// Ownership:
//
// Workspace Runtime
//      ↓
// Active Workspace Mode
//      ↓
// Workspace Surface
//      ├── Persistent Workspace Instruments
//      └── Projection Surface
//
// Author Document Runtime
//      ↓
// Permanent Operational Provider
//      ↓
// StudioShell projection
//
// Computational ownership remains below the Workspace Runtime.
// ============================================================

import {
  useState,
} from "react";

import {
  useWorkspaceRuntime,
} from "../workspace/runtime/WorkspaceRuntimeContext";

import {
  WorkspaceMode,
} from "../workspace/runtime/WorkspaceRuntimeTypes";

import InvestigationWorkspace
  from "../components/InvestigationWorkspace";

import OverviewWorkspace
  from "../workspace/surfaces/OverviewWorkspace";

import ManifoldWorkspace
  from "../workspace/surfaces/ManifoldWorkspace";

import CompareWorkspace
  from "../compare/components/CompareWorkspace";

import "../compare/components/CompareWorkspace.css";

import StudioShell
  from "../author/components/StudioShell";

import ResearchInboxInstrument
  from "../manifold/components/ResearchInboxInstrument";

import WorkspaceIdentityHeader
  from "../components/workspace/WorkspaceIdentityHeader";

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
// ACTIVE WORKSPACE
// ============================================================

function ActiveWorkspace() {

  const runtime =
    useWorkspaceRuntime();

  switch (
    runtime.getActiveMode()
  ) {

    case WorkspaceMode.OVERVIEW:

      return (
        <OverviewWorkspace />
      );

    case WorkspaceMode.MANIFOLD:

      return (
        <ManifoldWorkspace />
      );

    case WorkspaceMode.COMPARE:

      return (
        <CompareWorkspace />
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
        <StudioShell />
      );

    default:

      return (
        <InvestigationWorkspace />
      );

  }

}

// ============================================================
// COMPONENT
// ============================================================

export default function WorkspaceSurface() {

  const [
    researchInboxExpanded,
    setResearchInboxExpanded,
  ] = useState(false);

  const runtime =
    useWorkspaceRuntime();

  const activeMode =
    runtime.getActiveMode();

  const researchInboxVisible =
    activeMode ===
      WorkspaceMode.MANIFOLD ||
    activeMode ===
      WorkspaceMode.RESEARCH;

  return (

    <>

      {/* ===================================================== */}
      {/* MODE-APPROPRIATE RESEARCH INBOX                      */}
      {/* ===================================================== */}

      {
        researchInboxVisible && (
          <ResearchInboxInstrument
            expanded={
              researchInboxExpanded
            }
            onExpandedChange={
              setResearchInboxExpanded
            }
          />
        )
      }

      {/* ===================================================== */}
      {/* ACTIVE WORKSPACE                                      */}
      {/* ===================================================== */}
      {/*
          When the Research Inbox is expanded in MANIFOLD,
          reserve its full dock width where practical.

          The clamp preserves a usable minimum workspace at
          narrower desktop widths. Any unreserved remainder
          becomes a controlled overlay instead of forcing the
          topology surface below a practical working width.

          Collapsed Research Inbox behavior remains unchanged.
      */}

      <div
        data-research-inbox-expanded={
          researchInboxExpanded
        }
        style={{
          width:
            "100%",

          display:
            "flex",

          flexDirection:
            "column",

          height:
            "100%",

          minWidth:
            0,

          minHeight:
            0,

          boxSizing:
            "border-box",

          paddingRight:
            activeMode === WorkspaceMode.MANIFOLD &&
            researchInboxExpanded
              ? "clamp(0px, calc(100% - 760px), 318px)"
              : 0,

          transition:
            "padding-right 140ms ease",

          gap:
            "10px",
        }}
      >
        <WorkspaceIdentityHeader />

        <div
          style={{
            flex: "1 1 auto",
            minWidth: 0,
            minHeight: 0,
            overflow: "auto",
          }}
        >
          <ActiveWorkspace />
        </div>
      </div>

    </>

  );

}
