// ============================================================
// src/author/components/StudioShell.tsx
// P49B
// STUDIO SHELL
//
// Canonical root of the Authoring Studio.
//
// Responsibilities:
//
// • Own Studio layout.
// • Observe AuthorDocumentRuntime.
// • Host toolbar.
// • Host editor surface.
// • Host status bar.
// • Never own document state.
//
// Document ownership remains entirely inside the
// deterministic AuthorDocumentRuntime.
//
// ============================================================

import type {
  CSSProperties,
} from "react";
import { useEffect } from "react";

import StudioToolbar
  from "./StudioToolbar";

import StudioStatusBar
  from "./StudioStatusBar";

import AuthorEditorSurface
  from "./AuthorEditorSurface";

import StudioResearchInbox
  from "../../studio/components/StudioResearchInbox";
import StudioArtifactInspector
  from "../../studio/components/StudioArtifactInspector";

import "./StudioShell.css";
import { useActiveInvestigation, useWorkspaceRuntime } from "../../workspace/runtime/WorkspaceRuntimeContext";
import { useAuthorDocumentRuntime } from "../runtime/AuthorDocumentRuntimeContext";
import { WorkspaceMode } from "../../workspace/runtime/WorkspaceRuntimeTypes";

// ============================================================
// STYLES
// ============================================================

const shellStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  width: "100%",

  height: "100%",

  overflow: "hidden",

  background: "#020617",

  color: "#e2e8f0",

};

// ============================================================
// COMPONENT
// ============================================================

export default function StudioShell() {

  const investigation = useActiveInvestigation();
  const workspaceRuntime = useWorkspaceRuntime();
  const authorRuntime = useAuthorDocumentRuntime();

  useEffect(() => {
    authorRuntime.activateInvestigation(investigation?.id);
  }, [authorRuntime, investigation?.id]);

  if (!investigation) {
    return (
      <section className="studio-shell__blocked" role="status" aria-label="STUDIO unavailable">
        <div className="studio-shell__blocked-card">
          <span>STUDIO / INVESTIGATION REQUIRED</span>
          <h1>No active Investigation</h1>
          <p>STUDIO consumes an already-active Investigation. Return to OVERVIEW to open or create an Investigation before authoring.</p>
          <button type="button" onClick={() => workspaceRuntime.setActiveMode(WorkspaceMode.OVERVIEW)}>
            Return to OVERVIEW
          </button>
        </div>
      </section>
    );
  }

  return (

    <div style={shellStyle} data-studio-workspace="three-column">

      <div className="studio-shell__workspace">

        <StudioResearchInbox />

        <main className="studio-shell__authoring">

      {/* ===================================================== */}
      {/* TOOLBAR */}
      {/* ===================================================== */}

      <StudioToolbar />

      {/* ===================================================== */}
      {/* EDITOR SURFACE */}
      {/* ===================================================== */}

      <AuthorEditorSurface />

      {/* ===================================================== */}
      {/* STATUS BAR */}
      {/* ===================================================== */}

      <StudioStatusBar />

        </main>

        <StudioArtifactInspector />

      </div>

    </div>

  );

}
