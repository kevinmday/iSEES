// ============================================================
// src/federation/components/FederationPreviewPanel.tsx
// P57-UI-A4
// SELECTED CASE PREVIEW
//
// Preview the currently selected repository-held case and
// explicitly import it into the active Workspace.
//
// Presentation only.
// Federation preview and import ownership remain unchanged.
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

  if (preview === null) {
    return (
      <div className="investigation-library__preview">
        <div className="investigation-library__preview-title">
          Case Preview
        </div>

        <div className="investigation-library__preview-empty">
          Select a case from the repository browser to inspect
          it before import.
        </div>
      </div>
    );
  }

  // ==========================================================
  // SELECTED CASE
  // ==========================================================

  const eventId =
    preview.event.canonical_event.event_id;

  return (
    <div className="investigation-library__preview">

      {/* ===================================================== */}
      {/* CASE IDENTITY */}
      {/* ===================================================== */}

      <div className="investigation-library__preview-title">
        Case Preview
      </div>

      <div className="investigation-library__preview-case">
        {preview.event.canonical_event.event_name}
      </div>

      {/* ===================================================== */}
      {/* CASE PROJECTION */}
      {/* ===================================================== */}

      <div className="investigation-library__preview-details">
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
      </div>

      {/* ===================================================== */}
      {/* EXPLICIT IMPORT */}
      {/* ===================================================== */}

      <button
        type="button"
        className="investigation-library__import"
        onClick={() => {
          void importEvent(
            preview.repositoryId,
            eventId
          );
        }}
      >
        Import Into Workspace
      </button>

    </div>
  );
}

// ============================================================
// PREVIEW ROW
// ============================================================

function PreviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="investigation-library__preview-row">
      <span>{label}</span>

      <span className="investigation-library__preview-value">
        {value}
      </span>
    </div>
  );
}