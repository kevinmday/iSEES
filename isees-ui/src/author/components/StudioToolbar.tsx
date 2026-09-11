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
// • SAVE delegates to the Studio V1 orchestration owner, which
//   appends an authoritative immutable .author revision.
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
// • The runtime is marked clean only after the exact local
//   runtime revision is acknowledged by the authoritative API.
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
import { useActiveInvestigation } from "../../workspace/runtime/WorkspaceRuntimeContext";

import type {
  ComputationalAuthorDocument,
} from "../model/AuthorDocument";

import {
  AuthorDocumentTypes,
  AuthorDocumentStatuses,
} from "../model/AuthorDocumentTypes";

import {
  AuthorArtifactParser,
} from "../ingestion/AuthorArtifactParser";

import {
  AuthorKnowledgeCompiler,
} from "../ingestion/AuthorKnowledgeCompiler";
import { useStudioSaveAction } from "../../studio/runtime/StudioSaveActionContext.ts";
import { useIsAccountOperator } from "../../identity/runtime/OperatorIdentityRuntimeContext.tsx";

// ============================================================
// STYLES
// ============================================================

const toolbarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  minHeight: 48,
  padding: "8px 16px",
  boxSizing: "border-box",
  flexWrap: "wrap",
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
  flexWrap: "wrap",
  flexShrink: 0,
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

const authorIdentityStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 10, minWidth: 0 };
const authorGlyphStyle: CSSProperties = { display: "grid", placeItems: "center", width: 42, height: 42, border: "1px solid #38bdf8", borderRadius: 7, background: "#082f49", color: "#f8fafc", fontSize: 9, fontWeight: 800, lineHeight: 1.05 };
const authorCopyStyle: CSSProperties = { display: "grid", gap: 2, minWidth: 0 };
const canonicalLabelStyle: CSSProperties = { color: "#7dd3fc", fontSize: 10, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase" };

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

  const activeInvestigation = useActiveInvestigation();

  const runtime =
    useAuthorDocumentRuntime();

  const knowledgeRuntime =
    useKnowledgeObjectRuntime();

  const document =
    useAuthorDocument();
  const dirty = useAuthorDocumentDirty();

  const saveAction = useStudioSaveAction();
  const canDurablySave = useIsAccountOperator();

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

      if (!activeInvestigation) return;

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

  const handleSaveDocument = () => { void saveAction.save(); };

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

        <div style={authorIdentityStyle} aria-label={document ? `Canonical .author source. ${document.metadata.title}. ${saveAction.state.revisionNumber ? `Immutable revision ${saveAction.state.revisionNumber}.` : "Local draft."} ${dirty ? "Dirty." : saveAction.state.headRevisionId ? "Saved." : "Unsaved."}` : "No active canonical .author source"}>
          <span style={authorGlyphStyle} role="img" aria-label="Canonical dot author source glyph"><b style={{fontSize: 16}}>A</b>.author</span>
          <span style={authorCopyStyle}>
          <span style={canonicalLabelStyle}>Canonical source</span>

          <div style={titleStyle}>

            {
              document?.metadata.title ??
              "No active .author"
            }

            {document ? ".author" : ""}

          </div>

          <div style={subtitleStyle}>

            {saveAction.state.revisionNumber ? `Immutable revision ${saveAction.state.revisionNumber}` : "Local .author draft"} · {dirty ? "Dirty" : saveAction.state.status === "LOADING" ? "Restoring" : saveAction.state.status === "FAILED" ? "Failed · draft preserved" : saveAction.state.headRevisionId ? "Saved" : "Unsaved"}

          </div>

          </span>
        </div>

        {
  ingestionStatus.message
    ? (

      <div
        style={{
          ...(
            ingestionStatus.kind ===
            "ERROR"
              ? ingestionErrorStyle
              : ingestionStatusStyle
          ),

          maxWidth: 520,

          whiteSpace: "normal",

          overflow: "visible",

          textOverflow: "clip",

          lineHeight: 1.35,
        }}
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

          {document && !canDurablySave ? "Sign in to save this .author document." : saveAction.state.message}

        </div>

        {/* ================================================== */}
        {/* NEW DOCUMENT                                       */}
        {/* ================================================== */}

        <button
          type="button"
          style={activeInvestigation ? buttonStyle : disabledButtonStyle}
          disabled={!activeInvestigation}
          title={activeInvestigation ? "Create a new canonical .author draft." : "Select an Investigation before creating a .author draft."}
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
            document && canDurablySave && saveAction.state.canSave
              ? buttonStyle
              : disabledButtonStyle
          }
          disabled={!document || !canDurablySave || !saveAction.state.canSave}
          onClick={handleSaveDocument}
          title={saveAction.state.status === "UNAUTHENTICATED" ? "Sign in to save this .author document." : saveAction.state.message}
        >

          {saveAction.state.status === "SAVING_INITIAL" || saveAction.state.status === "SAVING_REVISION" ? "Saving…" : saveAction.state.retryable ? "Retry" : "Save"}

        </button>

        {saveAction.state.status === "CONFLICT" && <><button type="button" style={buttonStyle} onClick={() => void saveAction.reloadHead()}>Reload authoritative head</button><button type="button" style={buttonStyle} onClick={saveAction.keepLocalDraft}>Keep local draft</button></>}

        {saveAction.state.status === "SAVED" && <button type="button" style={buttonStyle} onClick={() => void saveAction.reloadHead()}>Reload head</button>}

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
          title={ingesting ? "A .author artifact is currently being ingested." : "Upload a native .author artifact for ingestion."}
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
            title={`${command} is unavailable in this Studio iteration.`}
          >

            {command}

          </button>

        ))}

      </div>

    </div>

  );

}
