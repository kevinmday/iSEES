// ============================================================
// src/author/components/StudioStatusBar.tsx
// P49A
// STUDIO STATUS BAR
//
// Canonical status bar for the Authoring Studio.
//
// Responsibilities
//
// • Observe AuthorDocumentRuntime.
// • Present runtime status.
// • Never own document state.
//
// Future
//
// • Cursor position
// • Word count
// • Character count
// • Reading time
// • Save status
// • Revision
// • Provenance state
// • Computational graph status
//
// ============================================================

import type {
  CSSProperties,
} from "react";

import {
  useAuthorDocument,
  useAuthorDocumentDirty,
  useAuthorDocumentRevision,
} from "../runtime/AuthorDocumentRuntimeContext";

// ============================================================
// STYLES
// ============================================================

const statusBarStyle: CSSProperties = {

  display: "flex",

  alignItems: "center",

  justifyContent: "space-between",

  height: 32,

  padding: "0 16px",

  borderTop: "1px solid #1e293b",

  background: "#0f172a",

  color: "#94a3b8",

  fontSize: 12,

  flexShrink: 0,

};

const groupStyle: CSSProperties = {

  display: "flex",

  alignItems: "center",

  gap: 18,

};

// ============================================================
// COMPONENT
// ============================================================

export default function StudioStatusBar() {

  const document =
    useAuthorDocument();

  const dirty =
    useAuthorDocumentDirty();

  const revision =
    useAuthorDocumentRevision();

  return (

    <div style={statusBarStyle}>

      <div style={groupStyle}>

        <div>

          Studio Runtime Ready

        </div>

        <div>

          Runtime Revision: {revision}

        </div>

      </div>

      <div style={groupStyle}>

        <div>

          {
            document
              ? document.status
              : "No Document"
          }

        </div>

        <div>

          {
            dirty
              ? "Dirty"
              : "Clean"
          }

        </div>

      </div>

    </div>

  );

}