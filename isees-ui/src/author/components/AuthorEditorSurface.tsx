// ============================================================
// src/author/components/AuthorEditorSurface.tsx
// P49B
// AUTHOR EDITOR SURFACE
//
// Canonical editor host for the Authoring Studio.
//
// Responsibilities:
//
// • Own the editor viewport.
// • Observe the Author Document Runtime.
// • Host future Lexical projection.
// • Never own Author Document state.
//
// The computational Author Document remains owned
// entirely by the deterministic AuthorDocumentRuntime.
//
// Future:
//
// AuthorEditorSurface
//          ↓
// Lexical Projection
//          ↓
// AuthorDocumentRuntime
//
// ============================================================

import type {
  CSSProperties,
} from "react";

import {
  useAuthorDocument,
} from "../runtime/AuthorDocumentRuntimeContext";

import LexicalProjectionHost
  from "../projection/lexical/LexicalProjectionHost";

// ============================================================
// STYLES
// ============================================================

const surfaceStyle: CSSProperties = {

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

  maxWidth: 560,

  lineHeight: 1.6,

};

// ============================================================
// COMPONENT
// ============================================================

export default function AuthorEditorSurface() {

  const document =
    useAuthorDocument();

  return (

    <div style={surfaceStyle}>

      {!document && (

        <div style={placeholderStyle}>

          <div style={titleStyle}>

            Authoring Studio

          </div>

          <div style={subtitleStyle}>

            No active document.

            <br />
            <br />

            This surface will host the future
            Lexical editor projection.

            <br />
            <br />

            The editor will observe the
            deterministic Author Document Runtime
            rather than owning the document itself.

          </div>

        </div>

      )}

     {document && (

  <LexicalProjectionHost />

)}

    </div>

  );

}