// ============================================================
// src/author/components/AuthorEditorSurface.tsx
// P56
// AUTHOR EDITOR SURFACE
//
// Canonical editor host for the Authoring Studio.
//
// Responsibilities:
//
// • Own the editor viewport.
// • Observe the Author Document Runtime.
// • Construct semantic Author nodes from explicit operator
//   actions.
// • Request document mutation through AuthorDocumentRuntime.
// • Host Lexical projection.
// • Never own canonical Author Document state.
//
// The computational Author Document remains owned
// entirely by the deterministic AuthorDocumentRuntime.
//
// P56:
//
// • Existing REFERENCE nodes remain deterministic references
//   to computational identities already known to iSEES.
//
// • Explicit researcher assertions may be created as
//   OBSERVATION nodes.
//
// • OBSERVATION is intentionally distinct from ordinary
//   narrative PARAGRAPH content.
//
// • Existing REFERENCE target identities in the active
//   document are attached to a new OBSERVATION as explicit
//   author-declared relatedReferences.
//
// • No semantic inference occurs here.
//
// • No REX invocation occurs here.
//
// • No Knowledge Object creation occurs here.
//
// CANONICAL PATH:
//
//   Researcher
//      ↓
//   OBSERVATION
//      ↓
//   AuthorDocumentRuntime.insertNode()
//      ↓
//   ComputationalAuthorDocument
//      ↓
//   .author
//      ↓
//   AuthorArtifactParser
//      ↓
//   AuthorKnowledgeCompiler
//      ↓
//   KOM
//
// ============================================================

import {
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import {
  useAuthorDocument,
  useAuthorDocumentRuntime,
} from "../runtime/AuthorDocumentRuntimeContext";

import {
  AuthorNodeTypes,
  type ObservationNode,
  type ReferenceNode,
} from "../model/AuthorNodeTypes";

import LexicalProjectionHost
  from "../projection/lexical/LexicalProjectionHost";

// ============================================================
// STYLES
// ============================================================

const surfaceStyle: CSSProperties = {

  flex:
    1,

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  overflow:
    "auto",

  background:
    "#020617",

};

const placeholderStyle: CSSProperties = {

  display:
    "flex",

  flexDirection:
    "column",

  alignItems:
    "center",

  justifyContent:
    "center",

  gap:
    12,

  textAlign:
    "center",

  color:
    "#64748b",

};

const titleStyle: CSSProperties = {

  fontSize:
    22,

  fontWeight:
    600,

  color:
    "#e2e8f0",

};

const subtitleStyle: CSSProperties = {

  maxWidth:
    560,

  lineHeight:
    1.6,

};

const documentStyle: CSSProperties = {

  width:
    "100%",

  height:
    "100%",

  overflow:
    "auto",

  padding:
    32,

  color:
    "#e2e8f0",

  fontFamily:
    "monospace",

};

const nodeStyle: CSSProperties = {

  marginBottom:
    20,

  padding:
    16,

  border:
    "1px solid #334155",

  borderRadius:
    8,

  background:
    "#0f172a",

};

const observationNodeStyle: CSSProperties = {

  ...nodeStyle,

  border:
    "1px solid #475569",

};

const observationComposerStyle: CSSProperties = {

  marginTop:
    28,

  marginBottom:
    32,

  padding:
    20,

  border:
    "1px solid #334155",

  borderRadius:
    8,

  background:
    "#0f172a",

};

const observationHeaderStyle: CSSProperties = {

  marginBottom:
    6,

  fontSize:
    14,

  fontWeight:
    700,

  color:
    "#e2e8f0",

};

const observationHelpStyle: CSSProperties = {

  marginBottom:
    14,

  maxWidth:
    760,

  fontSize:
    12,

  lineHeight:
    1.5,

  color:
    "#94a3b8",

};

const textareaStyle: CSSProperties = {

  boxSizing:
    "border-box",

  width:
    "100%",

  minHeight:
    110,

  resize:
    "vertical",

  padding:
    12,

  border:
    "1px solid #334155",

  borderRadius:
    8,

  outline:
    "none",

  background:
    "#020617",

  color:
    "#e2e8f0",

  fontFamily:
    "inherit",

  fontSize:
    13,

  lineHeight:
    1.5,

};

const relatedStyle: CSSProperties = {

  marginTop:
    12,

  marginBottom:
    14,

  fontSize:
    12,

  lineHeight:
    1.5,

  color:
    "#94a3b8",

};

const relatedIdentityStyle: CSSProperties = {

  marginTop:
    4,

  color:
    "#cbd5e1",

};

const buttonStyle: CSSProperties = {

  padding:
    "7px 12px",

  border:
    "1px solid #334155",

  borderRadius:
    8,

  background:
    "#111827",

  color:
    "#cbd5e1",

  fontSize:
    12,

  fontWeight:
    600,

  cursor:
    "pointer",

};

const disabledButtonStyle: CSSProperties = {

  ...buttonStyle,

  cursor:
    "default",

  opacity:
    0.5,

};

const observationTextStyle: CSSProperties = {

  marginTop:
    10,

  whiteSpace:
    "pre-wrap",

  lineHeight:
    1.6,

  color:
    "#f1f5f9",

};

// ============================================================
// IDENTITY
// ============================================================

function createObservationId():
  string {

  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {

    return (
      `author-node:${crypto.randomUUID()}`
    );

  }

  return (
    `author-node:${Date.now()}`
  );

}

// ============================================================
// COMPONENT
// ============================================================

export default function AuthorEditorSurface() {

  const document =
    useAuthorDocument();

  const runtime =
    useAuthorDocumentRuntime();

  // ----------------------------------------------------------
  // Local UI state only.
  //
  // The canonical Observation does not exist until the
  // operator explicitly presses Add Observation.
  // ----------------------------------------------------------

  const [
    observationText,
    setObservationText,
  ] = useState(
    "",
  );

  // ==========================================================
  // EXISTING DOCUMENT REFERENCES
  // ==========================================================
  //
  // These identities are already explicitly present in the
  // Author Document.
  //
  // Attaching them to the Observation therefore establishes
  // author-declared structure rather than inferred structure.
  //
  // ==========================================================

  const relatedReferences =
    useMemo(
      () => {

        if (
          !document
        ) {

          return [];

        }

        const identities =
          document.nodes
            .filter(
              node =>
                node.type ===
                AuthorNodeTypes.REFERENCE,
            )
            .map(
              node =>
                (
                  node as ReferenceNode
                ).targetId,
            );

        // ----------------------------------------------------
        // Canonical de-duplication.
        // ----------------------------------------------------

        return [
          ...new Set(
            identities,
          ),
        ];

      },
      [
        document,
      ],
    );

  // ==========================================================
// ADD OBSERVATION
// ==========================================================

const handleAddObservation =
() => {

  const text =
    observationText.trim();

  if (
    text.length === 0
  ) {

    return;

  }

  // ------------------------------------------------------
  // Resolve the canonical document directly from the
  // runtime at commit time.
  //
  // Semantic binding must reflect the exact canonical
  // document state when the operator commits the
  // Observation.
  // ------------------------------------------------------

  const activeDocument =
    runtime.getActiveDocument();

  if (
    !activeDocument
  ) {

    return;

  }

  // ------------------------------------------------------
  // Capture explicit REFERENCE identities currently
  // present in the canonical Author Document.
  //
  // These are author-declared relationships.
  // No inference occurs here.
  // ------------------------------------------------------

  const currentRelatedReferences =
    activeDocument.nodes
      .filter(
        node =>
          node.type ===
          AuthorNodeTypes.REFERENCE,
      )
      .map(
        node =>
          (
            node as ReferenceNode
          ).targetId,
      )
      .filter(
        (
          targetId,
          index,
          values,
        ) =>
          values.indexOf(
            targetId,
          ) === index,
      );

  const observation:
    ObservationNode = {

      id:
        createObservationId(),

      type:
        AuthorNodeTypes.OBSERVATION,

      text,

      source:
        "AUTHOR",

      relatedReferences:
        currentRelatedReferences,

      createdAt:
        new Date(),

  };

  // ------------------------------------------------------
  // Runtime owns canonical document mutation.
  // ------------------------------------------------------

  runtime.insertNode(
    observation,
  );

  // ------------------------------------------------------
  // Clear local composer state only after the runtime
  // mutation request has been issued.
  // ------------------------------------------------------

  setObservationText(
    "",
  );

};
  // ==========================================================
  // NO ACTIVE DOCUMENT
  // ==========================================================

  if (
    !document
  ) {

    return (

      <div style={surfaceStyle}>

        <div style={placeholderStyle}>

          <div style={titleStyle}>

            Authoring Studio

          </div>

          <div style={subtitleStyle}>

            No active document.

            <br />
            <br />

            This surface hosts the computational
            Author Document projection.

            <br />
            <br />

            The editor observes the deterministic
            Author Document Runtime rather than
            owning the document itself.

          </div>

        </div>

      </div>

    );

  }

  // ==========================================================
  // EMPTY DOCUMENT
  // ==========================================================
  //
  // Preserve the existing Lexical projection behavior.
  //
  // ==========================================================

  if (
    document.nodes.length === 0
  ) {

    return (

      <div style={surfaceStyle}>

        <LexicalProjectionHost />

      </div>

    );

  }

  // ==========================================================
  // DOCUMENT
  // ==========================================================

  return (

    <div style={surfaceStyle}>

      <div style={documentStyle}>

        <h2>

          Computational Author Document

        </h2>

        {/* ================================================== */}
        {/* EXISTING DOCUMENT NODES                            */}
        {/* ================================================== */}

        {document.nodes.map(
          node => (

            <div
              key={node.id}
              style={
                node.type ===
                AuthorNodeTypes.OBSERVATION
                  ? observationNodeStyle
                  : nodeStyle
              }
            >

              <div>

                <strong>Type:</strong>{" "}
                {node.type}

              </div>

              {/* ============================================ */}
              {/* REFERENCE                                    */}
              {/* ============================================ */}

              {node.type ===
                AuthorNodeTypes.REFERENCE && (

                <>

                  <div>

                    <strong>Target:</strong>{" "}
                    {
                      (
                        node as ReferenceNode
                      ).targetType
                    }

                  </div>

                  <div>

                    <strong>ID:</strong>{" "}
                    {
                      (
                        node as ReferenceNode
                      ).targetId
                    }

                  </div>

                  <div>

                    <strong>Title:</strong>{" "}
                    {
                      (
                        node as ReferenceNode
                      ).title
                    }

                  </div>

                  <div>

                    <strong>Source:</strong>{" "}
                    {
                      (
                        node as ReferenceNode
                      ).source
                    }

                  </div>

                </>

              )}

              {/* ============================================ */}
              {/* OBSERVATION                                  */}
              {/* ============================================ */}

              {node.type ===
                AuthorNodeTypes.OBSERVATION && (

                <>

                  <div style={observationTextStyle}>

                    {
                      (
                        node as ObservationNode
                      ).text
                    }

                  </div>

                  <div style={relatedStyle}>

                    <strong>Source:</strong>{" "}
                    {
                      (
                        node as ObservationNode
                      ).source
                    }

                    <br />

                    <strong>
                      Related References:
                    </strong>{" "}

                    {
                      (
                        node as ObservationNode
                      ).relatedReferences.length
                    }

                    {
                      (
                        node as ObservationNode
                      ).relatedReferences.map(
                        reference => (

                          <div
                            key={reference}
                            style={relatedIdentityStyle}
                          >

                            {reference}

                          </div>

                        ),
                      )
                    }

                  </div>

                </>

              )}

            </div>

          ),
        )}

        {/* ================================================== */}
        {/* EXPLICIT COMPUTATIONAL OBSERVATION COMPOSER        */}
        {/* ================================================== */}

        <div style={observationComposerStyle}>

          <div style={observationHeaderStyle}>

            New Computational Observation

          </div>

          <div style={observationHelpStyle}>

            Enter an explicit researcher assertion
            intended to cross the computational
            knowledge boundary.

            Ordinary narrative prose is not
            automatically treated as an observation.

          </div>

          <textarea
            style={textareaStyle}
            value={observationText}
            placeholder={
              "Enter researcher observation..."
            }
            onChange={
              event =>
                setObservationText(
                  event.target.value,
                )
            }
          />

          <div style={relatedStyle}>

            <strong>
              Related existing references:
            </strong>{" "}

            {relatedReferences.length}

            {
              relatedReferences.map(
                reference => (

                  <div
                    key={reference}
                    style={relatedIdentityStyle}
                  >

                    {reference}

                  </div>

                ),
              )
            }

          </div>

          <button
            type="button"
            style={
              observationText.trim().length > 0
                ? buttonStyle
                : disabledButtonStyle
            }
            disabled={
              observationText.trim().length === 0
            }
            onClick={handleAddObservation}
          >

            Add Observation

          </button>

        </div>

      </div>

    </div>

  );

}