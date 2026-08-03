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

import StudioToolbar
  from "./StudioToolbar";

import StudioStatusBar
  from "./StudioStatusBar";

import AuthorEditorSurface
  from "./AuthorEditorSurface";

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

  return (

    <div style={shellStyle}>

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

    </div>

  );

}