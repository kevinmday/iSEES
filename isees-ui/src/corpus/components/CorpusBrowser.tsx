// ============================================================
// src/corpus/components/CorpusBrowser.tsx
// P24.2C - CORPUS BROWSER V1
// READ-ONLY CORPUS SURFACE
// ============================================================

import { useCorpus } from "../context/CorpusContext";

export default function CorpusBrowser() {
  const { corpus } = useCorpus();

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
        corpus.map((event) => (
          <div
            key={event.corpus_id}
            style={{
              padding: "6px 0",
              borderBottom:
                "1px solid rgba(255,255,255,0.05)",
            }}
          >
            {event.canonical_event.event_name}
          </div>
        ))
      )}
    </div>
  );
}