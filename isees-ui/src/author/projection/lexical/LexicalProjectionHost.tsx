// ============================================================
// src/author/projection/lexical/LexicalProjectionHost.tsx
// P51
// LEXICAL PROJECTION HOST
//
// TEMPORARY DIAGNOSTIC IMPLEMENTATION
//
// Purpose:
//
// • Verify the Projection Host is being mounted.
// • Eliminate Lexical as a variable.
// • Confirm AuthorEditorSurface is rendering this host.
//
// Once verified, this file will be replaced with the
// actual Lexical implementation.
//
// ============================================================

import type {
  CSSProperties,
} from "react";

// ============================================================
// STYLES
// ============================================================

const diagnosticStyle: CSSProperties = {

  background: "#22c55e",

  color: "#000000",

  width: "100%",

  height: "100%",

  padding: 32,

  fontSize: 32,

  fontWeight: 700,

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

};

// ============================================================
// COMPONENT
// ============================================================

export default function LexicalProjectionHost() {

  return (

    <div style={diagnosticStyle}>

      LEXICAL PROJECTION HOST IS MOUNTED

    </div>

  );

}