// ============================================================
// src/federation/components/FederationPreviewPanel.tsx
// P26 FEDERATED KNOWLEDGE LAYER
// FEDERATION PREVIEW PANEL
//
// Preview of the currently selected federated investigation.
//
// Preview V1
// Browse
//   ↓
// Preview
//   ↓
// Import
//
// ============================================================

import {
  useFederation,
} from "../context/FederationContext";

// ============================================================
// COMPONENT
// ============================================================

export default function FederationPreviewPanel() {

  const {

    preview,

    importEvent,

  } = useFederation();

  // ==========================================================
  // EMPTY
  // ==========================================================

  if (
    preview === null
  ) {

    return (

      <div
        style={{
          padding: "12px",
          borderTop: "1px solid #333",
        }}
      >

        <div
          style={{
            fontWeight: 700,
            fontSize: "13px",
            marginBottom: "10px",
            letterSpacing: "0.05em",
          }}
        >
          PREVIEW
        </div>

        <div
          style={{
            fontSize: "12px",
            opacity: 0.65,
            lineHeight: 1.5,
          }}
        >
          Select an investigation from the
          Federated Knowledge browser.
        </div>

      </div>

    );

  }

  // ==========================================================
  // VIEW
  // ==========================================================

  return (

    <div
      style={{
        padding: "12px",
        borderTop: "1px solid #333",
      }}
    >

      {/* ================================================ */}
      {/* TITLE */}
      {/* ================================================ */}

      <div
        style={{
          fontWeight: 700,
          fontSize: "13px",
          marginBottom: "12px",
          letterSpacing: "0.05em",
        }}
      >
        PREVIEW
      </div>

      {/* ================================================ */}
      {/* EVENT */}
      {/* ================================================ */}

      <div
        style={{
          fontSize: "14px",
          fontWeight: 700,
          marginBottom: "10px",
        }}
      >
        {preview.event.canonical_event.event_name}
      </div>

      {/* ================================================ */}
      {/* DETAILS */}
      {/* ================================================ */}

      <PreviewRow
        label="Repository"
        value={preview.repositoryId}
      />

      <PreviewRow
        label="Artifacts"
        value={String(
          preview.availableArtifacts
        )}
      />

      <PreviewRow
        label="Narratives"
        value={String(
          preview.availableNarratives
        )}
      />

      <PreviewRow
        label="Resolutions"
        value={String(
          preview.availableResolutions
        )}
      />

      <PreviewRow
        label="Updated"
        value={preview.lastUpdated}
      />

      {/* ================================================ */}
      {/* IMPORT */}
      {/* ================================================ */}

      <button

        onClick={() => {

          void importEvent(

            preview.repositoryId,

            preview.event
              .canonical_event
              .event_id

          );

        }}

        style={{

          marginTop: "16px",

          width: "100%",

          padding: "8px",

          border: "1px solid #3ea6ff",

          borderRadius: "4px",

          background: "#1b4f72",

          color: "#ffffff",

          cursor: "pointer",

          fontSize: "12px",

          fontWeight: 700,

        }}

      >

        Import Into Workspace

      </button>

    </div>

  );

}

// ============================================================
// ROW
// ============================================================

function PreviewRow({

  label,

  value,

}: {

  label: string;

  value: string;

}) {

  return (

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        fontSize: "12px",
        marginBottom: "6px",
      }}
    >

      <div
        style={{
          opacity: 0.7,
        }}
      >
        {label}
      </div>

      <div
        style={{
          textAlign: "right",
          fontWeight: 600,
        }}
      >
        {value}
      </div>

    </div>

  );

}