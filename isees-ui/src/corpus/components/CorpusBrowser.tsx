// ============================================================
// src/corpus/components/CorpusBrowser.tsx
// P24.3 - CORPUS BROWSER V2
// SELECTABLE CORPUS SURFACE
// ============================================================

import { useCorpus } from "../context/CorpusContext";

export default function CorpusBrowser() {
  const {
    corpus,
    selectedCorpusEventId,
    setSelectedCorpusEventId,
  } = useCorpus();

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
              onClick={() =>
                setSelectedCorpusEventId(
                  event.corpus_id
                )
              }
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