// ============================================================
// src/author/components/AuthorEditorSurface.tsx
// P49C
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
// ============================================================

import type {
  CSSProperties,
} from "react";

import {
  useAuthorDocument,
} from "../runtime/AuthorDocumentRuntimeContext";

import {

  AuthorNodeTypes,

  type ReferenceNode,

} from "../model/AuthorNodeTypes";

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

        document.nodes.length === 0 ? (

          <LexicalProjectionHost />

        ) : (

          <div
            style={{
              width: "100%",
              height: "100%",
              overflow: "auto",
              padding: 32,
              color: "#e2e8f0",
              fontFamily: "monospace",
            }}
          >

            <h2>

              Computational Author Document

            </h2>

            {document.nodes.map(
              (node) => (

                <div
                  key={node.id}
                  style={{
                    marginBottom: 20,
                    padding: 16,
                    border: "1px solid #334155",
                    borderRadius: 8,
                    background: "#0f172a",
                  }}
                >

                  <div>

                    <strong>Type:</strong>{" "}
                    {node.type}

                  </div>

                  {node.type === AuthorNodeTypes.REFERENCE && (

                    <>

                      <div>

                        <strong>Target:</strong>{" "}
                        {(node as ReferenceNode).targetType}

                      </div>

                      <div>

                        <strong>ID:</strong>{" "}
                        {(node as ReferenceNode).targetId}

                      </div>

                      <div>

                        <strong>Title:</strong>{" "}
                        {(node as ReferenceNode).title}

                      </div>

                      <div>

                        <strong>Source:</strong>{" "}
                        {(node as ReferenceNode).source}

                      </div>

                    </>

                  )}

                </div>

              )

            )}

          </div>

        )

      )}

    </div>

  );

}