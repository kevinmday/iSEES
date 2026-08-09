// ============================================================
// src/author/components/StudioToolbar.tsx
// P56
// STUDIO TOOLBAR
//
// Canonical toolbar for the Authoring Studio.
//
// Responsibilities:
//
// • Observe AuthorDocumentRuntime.
// • Display document state.
// • Issue document lifecycle commands to the runtime.
// • Never own canonical document state.
//
// P56:
//
// • NEW DOCUMENT creates a canonical
//   ComputationalAuthorDocument and transfers ownership
//   immediately to AuthorDocumentRuntime.
//
// • SAVE serializes the active ComputationalAuthorDocument
//   into the native canonical iSEES .author JSON artifact.
//
// • UPLOAD accepts a native canonical iSEES .author artifact,
//   validates it, compiles authored computational content into
//   KOM, preserves existing computational references, and
//   performs deterministic Knowledge Runtime upsert.
//
// • Re-ingestion is idempotent by deterministic Knowledge
//   Object identity.
//
// • Existing references are NOT duplicated as Knowledge
//   Objects.
//
// • The runtime is marked clean only after the artifact
//   has been successfully serialized and emitted.
//
// P56 RETURN PATH:
//
//   MANIFOLD
//      ↓
//   RESEARCH INBOX
//      ↓
//   STUDIO
//      ↓
//   .author
//      ↓
//   UPLOAD
//      ↓
//   AuthorArtifactParser
//      ↓
//   AuthorKnowledgeCompiler
//      ↓
//   KOM
//
// Future:
//
// • Resolve invocation after successful ingestion.
// • Manifold recomputation.
// • Graph revision.
// • Provenance inspection UI.
// • Reference inspection.
// • Undo / Redo.
// • Formatting.
// • Citations.
// • Export.
// • Publish.
//
// ============================================================

import {
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
} from "react";

import {
  useAuthorDocument,
  useAuthorDocumentDirty,
  useAuthorDocumentRuntime,
} from "../runtime/AuthorDocumentRuntimeContext";

import {
  useKnowledgeObjectRuntime,
} from "../../knowledge/runtime/KnowledgeObjectRuntimeContext";

import type {
  ComputationalAuthorDocument,
} from "../model/AuthorDocument";

import {
  AuthorDocumentTypes,
  AuthorDocumentStatuses,
} from "../model/AuthorDocumentTypes";

import {
  createAuthorArtifactFileName,
  serializeAuthorArtifact,
} from "../artifact/AuthorArtifactSerializer";

import {
  AuthorArtifactParser,
} from "../ingestion/AuthorArtifactParser";

import {
  AuthorKnowledgeCompiler,
} from "../ingestion/AuthorKnowledgeCompiler";

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
  minWidth: 0,
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
  whiteSpace: "nowrap",
};

const ingestionStatusStyle: CSSProperties = {
  fontSize: 11,
  color: "#94a3b8",
  maxWidth: 360,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const ingestionErrorStyle: CSSProperties = {
  ...ingestionStatusStyle,
  color: "#fca5a5",
};

const buttonStyle: CSSProperties = {
  padding: "6px 12px",
  border: "1px solid #334155",
  borderRadius: 8,
  background: "#111827",
  color: "#cbd5e1",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  userSelect: "none",
};

const disabledButtonStyle: CSSProperties = {
  ...buttonStyle,
  cursor: "default",
  opacity: 0.5,
};

const hiddenFileInputStyle: CSSProperties = {
  display: "none",
};

// ============================================================
// INGESTION STATUS
// ============================================================

type IngestionStatusKind =
  | "IDLE"
  | "SUCCESS"
  | "ERROR";

interface IngestionStatus {

  readonly kind:
    IngestionStatusKind;

  readonly message:
    string;

}

// ============================================================
// IDENTITY
// ============================================================

function createDocumentId(): string {

  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {

    return `author:${crypto.randomUUID()}`;

  }

  return `author:${Date.now()}`;

}

// ============================================================
// DOCUMENT FACTORY
// ============================================================

function createAuthorDocument():
  ComputationalAuthorDocument {

  const now =
    new Date();

  return {

    identity: {

      id:
        createDocumentId(),

      createdAt:
        now,

    },

    metadata: {

      title:
        "Untitled Investigation Document",

      description:
        "",

      author:
        "",

      modifiedAt:
        now,

      version:
        1,

    },

    type:
      AuthorDocumentTypes.DOCUMENT,

    status:
      AuthorDocumentStatuses.NEW,

    nodes:
      [],

  };

}

// ============================================================
// COMPONENT
// ============================================================

export default function StudioToolbar() {

  const runtime =
    useAuthorDocumentRuntime();

  const knowledgeRuntime =
    useKnowledgeObjectRuntime();

  const document =
    useAuthorDocument();

  const dirty =
    useAuthorDocumentDirty();

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [
    ingestionStatus,
    setIngestionStatus,
  ] = useState<IngestionStatus>({

    kind:
      "IDLE",

    message:
      "",

  });

  const [
    ingesting,
    setIngesting,
  ] = useState(
    false,
  );

  // ==========================================================
  // NEW DOCUMENT
  // ==========================================================

  const handleNewDocument =
    () => {

      const newDocument =
        createAuthorDocument();

      runtime.setActiveDocument(
        newDocument,
      );

      setIngestionStatus({

        kind:
          "IDLE",

        message:
          "",

      });

    };

  // ==========================================================
  // SAVE DOCUMENT
  // ==========================================================

  const handleSaveDocument =
    () => {

      if (!document) {

        return;

      }

      // ------------------------------------------------------
      // Serialize the canonical computational document.
      //
      // This is NOT an export projection.
      //
      // .author JSON is the native iSEES Author artifact.
      // ------------------------------------------------------

      const serialized =
        serializeAuthorArtifact(
          document,
        );

      // ------------------------------------------------------
      // Materialize the canonical artifact in the browser.
      // ------------------------------------------------------

      const blob =
        new Blob(
          [serialized],
          {
            type:
              "application/json",
          },
        );

      const url =
        URL.createObjectURL(
          blob,
        );

      const anchor =
        window.document.createElement(
          "a",
        );

      anchor.href =
        url;

      anchor.download =
        createAuthorArtifactFileName(
          document,
        );

      window.document.body.appendChild(
        anchor,
      );

      anchor.click();

      window.document.body.removeChild(
        anchor,
      );

      URL.revokeObjectURL(
        url,
      );

      // ------------------------------------------------------
      // Persistence succeeded from the runtime's perspective.
      //
      // Only now acknowledge that the active document is clean.
      // ------------------------------------------------------

      runtime.markClean();

  };

  // ==========================================================
  // OPEN AUTHOR ARTIFACT PICKER
  // ==========================================================

  const handleUploadDocument =
    () => {

      if (
        ingesting
      ) {

        return;

      }

      fileInputRef.current?.click();

    };

  // ==========================================================
  // INGEST AUTHOR ARTIFACT
  // ==========================================================
  //
  // Native return boundary:
  //
  //   .author
  //      ↓
  //   parse
  //      ↓
  //   validate
  //      ↓
  //   compile
  //      ↓
  //   KnowledgeObject[]
  //      ↓
  //   deterministic KOM upsert
  //
  // Existing computational references are preserved by the
  // compiler and are NOT manufactured as duplicate Knowledge
  // Objects.
  //
  // ==========================================================

  const handleAuthorArtifactSelected =
    async (
      event:
        ChangeEvent<HTMLInputElement>,
    ) => {

      const input =
        event.currentTarget;

      const file =
        input.files?.[0];

      // ------------------------------------------------------
      // Reset immediately so selecting the same file again
      // still generates a future change event.
      // ------------------------------------------------------

      input.value =
        "";

      if (
        !file
      ) {

        return;

      }

      setIngesting(
        true,
      );

      setIngestionStatus({

        kind:
          "IDLE",

        message:
          `Reading ${file.name}...`,

      });

      try {

        // ----------------------------------------------------
        // READ
        // ----------------------------------------------------

        const text =
          await file.text();

        // ----------------------------------------------------
        // PARSE + VALIDATE
        // ----------------------------------------------------

        const parseResult =
          AuthorArtifactParser.parseJson(
            text,
          );

        if (
          !parseResult.ok
        ) {

          setIngestionStatus({

            kind:
              "ERROR",

            message:
              parseResult.error,

          });

          return;

        }

        // ----------------------------------------------------
        // COMPILE
        // ----------------------------------------------------

        const compileResult =
          AuthorKnowledgeCompiler.compile(
            parseResult.value,
          );

        // ----------------------------------------------------
        // UPSERT INTO KOM
        // ----------------------------------------------------
        //
        // Deterministic Knowledge Object IDs make repeated
        // ingestion of the same document revision idempotent.
        //
        // Existing ID:
        //
        //   updateObject()
        //
        // New ID:
        //
        //   addObject()
        //
        // ----------------------------------------------------

        let added =
          0;

        let updated =
          0;

        for (
          const knowledgeObject
          of compileResult.knowledgeObjects
        ) {

          if (
            knowledgeRuntime.hasObject(
              knowledgeObject.identity.id,
            )
          ) {

            knowledgeRuntime.updateObject(
              knowledgeObject,
            );

            updated +=
              1;

          } else {

            knowledgeRuntime.addObject(
              knowledgeObject,
            );

            added +=
              1;

          }

        }

        // ----------------------------------------------------
        // PRESERVED REFERENCES
        // ----------------------------------------------------
        //
        // References are intentionally NOT inserted as new
        // Knowledge Objects.
        //
        // Their canonical target identities remain available
        // in compileResult.references for later reference
        // binding / Resolve integration.
        //
        // ----------------------------------------------------

        const referenceCount =
          compileResult.references.length;

        const knowledgeCount =
          compileResult.knowledgeObjects.length;

        // ----------------------------------------------------
        // SUCCESS STATUS
        // ----------------------------------------------------

        setIngestionStatus({

          kind:
            "SUCCESS",

          message:
            [
              `Ingested ${file.name}:`,
              `${knowledgeCount} observation${knowledgeCount === 1 ? "" : "s"}`,
              `(${added} new, ${updated} updated)`,
              `· ${referenceCount} preserved reference${referenceCount === 1 ? "" : "s"}`,
            ].join(
              " ",
            ),

        });

      } catch (
        error
      ) {

        const message =
          error instanceof Error
            ? error.message
            : "Unknown Author artifact ingestion error.";

        setIngestionStatus({

          kind:
            "ERROR",

          message:
            `Upload failed: ${message}`,

        });

      } finally {

        setIngesting(
          false,
        );

      }

    };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div style={toolbarStyle}>

      <div style={leftStyle}>

        <div>

          <div style={titleStyle}>

            {
              document?.metadata.title ??
              "No Active Document"
            }

          </div>

          <div style={subtitleStyle}>

            Authoring Studio

          </div>

        </div>

        {
          ingestionStatus.message
            ? (

              <div
                style={
                  ingestionStatus.kind ===
                  "ERROR"
                    ? ingestionErrorStyle
                    : ingestionStatusStyle
                }
                title={
                  ingestionStatus.message
                }
              >

                {
                  ingestionStatus.message
                }

              </div>

            )
            : null
        }

      </div>

      <div style={rightStyle}>

        <div style={statusStyle}>

          {
            !document
              ? "No Document"
              : dirty
                ? "Unsaved Changes"
                : "Saved"
          }

        </div>

        {/* ================================================== */}
        {/* NEW DOCUMENT                                       */}
        {/* ================================================== */}

        <button
          type="button"
          style={buttonStyle}
          onClick={handleNewDocument}
        >

          New Document

        </button>

        {/* ================================================== */}
        {/* SAVE                                               */}
        {/* ================================================== */}

        <button
          type="button"
          style={
            document
              ? buttonStyle
              : disabledButtonStyle
          }
          disabled={!document}
          onClick={handleSaveDocument}
        >

          Save

        </button>

        {/* ================================================== */}
        {/* UPLOAD / INGEST                                    */}
        {/* ================================================== */}

        <button
          type="button"
          style={
            ingesting
              ? disabledButtonStyle
              : buttonStyle
          }
          disabled={ingesting}
          onClick={handleUploadDocument}
        >

          {
            ingesting
              ? "Ingesting..."
              : "Upload"
          }

        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".author,application/json"
          style={hiddenFileInputStyle}
          onChange={handleAuthorArtifactSelected}
        />

        {/* ================================================== */}
        {/* FUTURE COMMANDS                                    */}
        {/* ================================================== */}

        {[
          "References",
          "Export",
          "Publish",
        ].map(command => (

          <button
            key={command}
            type="button"
            style={disabledButtonStyle}
            disabled
          >

            {command}

          </button>

        ))}

      </div>

    </div>

  );

}