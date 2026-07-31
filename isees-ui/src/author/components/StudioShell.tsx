// ============================================================
// src/author/components/StudioShell.tsx
// P49A
// STUDIO SHELL
//
// Canonical root of the Authoring Studio.
//
// Responsibilities:
//
// • Own Studio layout.
// • Observe AuthorDocumentRuntime.
// • Host future toolbar.
// • Host future editor canvas.
// • Host future status bar.
// • Never own document state.
//
// Document state remains entirely inside the
// deterministic AuthorDocumentRuntime.
//
// ============================================================

import type {
  CSSProperties,
} from "react";

import {
  useAuthorDocument,
} from "../runtime/AuthorDocumentRuntimeContext";

import StudioToolbar from "./StudioToolbar";
import StudioStatusBar from "./StudioStatusBar";

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

const canvasStyle: CSSProperties = {

  flex: 1,

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  overflow: "auto",

  background: "#020617",

};

const placeholderStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  alignItems: "center",

  justifyContent: "center",

  gap: 12,

  textAlign: "center",

  color: "#64748b",

};

const titleStyle: CSSProperties = {

  fontSize: 22,

  fontWeight: 600,

  color: "#e2e8f0",

};

const subtitleStyle: CSSProperties = {

  maxWidth: 520,

  lineHeight: 1.6,

};

// ============================================================
// COMPONENT
// ============================================================

export default function StudioShell() {

  const document =
    useAuthorDocument();

  return (

    <div style={shellStyle}>

      {/* ===================================================== */}
      {/* TOOLBAR */}
      {/* ===================================================== */}

      <StudioToolbar />

      {/* ===================================================== */}
      {/* CANVAS */}
      {/* ===================================================== */}

      <div style={canvasStyle}>

        {!document && (

          <div style={placeholderStyle}>

            <div style={titleStyle}>

              Authoring Studio

            </div>

            <div style={subtitleStyle}>

              No active document.

              <br />

              Future versions will host the
              Lexical editor, computational
              references, embedded manifold
              artifacts, provenance tracking,
              publishing, and live graph
              expansion from this workspace.

            </div>

          </div>

        )}

        {document && (

          <div style={placeholderStyle}>

            <div style={titleStyle}>

              {document.metadata.title}

            </div>

            <div>

              Document runtime connected.

            </div>

            <div>

              Editor integration pending.

            </div>

          </div>

        )}

      </div>

      {/* ===================================================== */}
      {/* STATUS BAR */}
      {/* ===================================================== */}

      <StudioStatusBar />

    </div>

  );

}