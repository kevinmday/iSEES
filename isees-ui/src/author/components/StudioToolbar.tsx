// ============================================================
// src/author/components/StudioToolbar.tsx
// P49A
// STUDIO TOOLBAR
//
// Canonical toolbar for the Authoring Studio.
//
// Responsibilities
//
// • Observe AuthorDocumentRuntime.
// • Display document state.
// • Host future document commands.
// • Never own document state.
//
// Future
//
// • Save
// • Undo / Redo
// • Formatting
// • Citations
// • References
// • Export
// • Publish
//
// ============================================================

import type {
  CSSProperties,
} from "react";

import {
  useAuthorDocument,
  useAuthorDocumentDirty,
} from "../runtime/AuthorDocumentRuntimeContext";

// ============================================================
// STYLES
// ============================================================

const toolbarStyle: CSSProperties = {

  display: "flex",

  alignItems: "center",

  justifyContent: "space-between",

  gap: 16,

  height: 48,

  padding: "0 16px",

  borderBottom: "1px solid #1e293b",

  background: "#0f172a",

  flexShrink: 0,

};

const leftStyle: CSSProperties = {

  display: "flex",

  alignItems: "center",

  gap: 16,

};

const rightStyle: CSSProperties = {

  display: "flex",

  alignItems: "center",

  gap: 12,

};

const titleStyle: CSSProperties = {

  fontSize: 15,

  fontWeight: 700,

  color: "#e2e8f0",

};

const subtitleStyle: CSSProperties = {

  fontSize: 12,

  color: "#94a3b8",

};

const statusStyle: CSSProperties = {

  padding: "4px 10px",

  borderRadius: 999,

  border: "1px solid #334155",

  background: "#111827",

  fontSize: 12,

  fontWeight: 600,

  color: "#cbd5e1",

};

const buttonStyle: CSSProperties = {

  padding: "6px 12px",

  border: "1px solid #334155",

  borderRadius: 8,

  background: "#111827",

  color: "#cbd5e1",

  fontSize: 12,

  fontWeight: 600,

  cursor: "default",

  userSelect: "none",

};

// ============================================================
// COMPONENT
// ============================================================

export default function StudioToolbar() {

  const document =
    useAuthorDocument();

  const dirty =
    useAuthorDocumentDirty();

  return (

    <div style={toolbarStyle}>

      <div style={leftStyle}>

        <div>

          <div style={titleStyle}>

            {
              document?.metadata.title ??
              "Untitled Document"
            }

          </div>

          <div style={subtitleStyle}>

            Authoring Studio

          </div>

        </div>

      </div>

      <div style={rightStyle}>

        <div style={statusStyle}>

          {
            dirty
              ? "Unsaved Changes"
              : "Saved"
          }

        </div>

        {[
          "Save",
          "References",
          "Export",
          "Publish",
        ].map(command => (

          <div
            key={command}
            style={buttonStyle}
          >

            {command}

          </div>

        ))}

      </div>

    </div>

  );

}