// ============================================================
// src/corpus/components/CorpusBrowser.tsx
// P25.6B UNIFIED INVESTIGATION IMPORT
// CORPUS BROWSER
// SINGLE WORKSPACE IMPORT PIPELINE
// FULL DROP-IN REPLACEMENT
// ============================================================

import {
  useCorpus,
} from "../context/CorpusContext";

import {
  useWorkspace,
} from "../../workspace/context/WorkspaceContext";

// ============================================================
// COMPONENT
// ============================================================

export default function CorpusBrowser() {

  const {
    corpus,
    selectedCorpusEventId,
    setSelectedCorpusEventId,
  } = useCorpus();

  const {
    importInvestigation,
  } = useWorkspace();

  return (
    <div
      style={{
        padding: "12px",
        borderBottom: "1px solid #333",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          marginBottom: "8px",
        }}
      >
        CORPUS
      </div>

      <div
        style={{
          fontSize: "12px",
          opacity: 0.75,
          marginBottom: "8px",
        }}
      >
        System Canon
      </div>

      {corpus.length === 0 ? (
        <div
          style={{
            fontSize: "12px",
            opacity: 0.6,
          }}
        >
          No corpus events loaded.
        </div>
      ) : (
        corpus.map((event) => {

          const isSelected =
            event.corpus_id ===
            selectedCorpusEventId;

          return (
            <div
              key={event.corpus_id}
              onClick={() => {

                // ------------------------------------------
                // Corpus Selection
                // ------------------------------------------

                setSelectedCorpusEventId(
                  event.corpus_id
                );

                // ------------------------------------------
                // Unified Workspace Investigation Import
                // ------------------------------------------

                importInvestigation(
                  event.canonical_event.event_id
                );
              }}
              style={{
                padding: "6px 8px",

                cursor: "pointer",

                borderBottom:
                  "1px solid rgba(255,255,255,0.05)",

                background: isSelected
                  ? "rgba(0,180,255,0.15)"
                  : "transparent",

                borderLeft: isSelected
                  ? "3px solid #00b4ff"
                  : "3px solid transparent",

                transition:
                  "background 120ms ease",
              }}
            >
              {isSelected ? "▶ " : ""}

              {event.canonical_event.event_name}
            </div>
          );
        })
      )}
    </div>
  );
}