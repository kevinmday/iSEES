// ============================================================
// src/components/ResolutionPanel.tsx
// P24.4 RESOLUTION INTEGRATION PASS
// WORKSPACE → CORPUS → RESOLUTION BRIDGE
// FULL DROP-IN REPLACEMENT
// ============================================================

import { useCorpus } from "../corpus/context/CorpusContext";

// ============================================================
// COMPONENT
// ============================================================

export default function ResolutionPanel({
focusedEventId,
}: {
focusedEventId: string;
}) {

const {
corpus,
} = useCorpus();

const corpusEvent =
corpus.find(
(event) =>
event.corpus_id ===
focusedEventId
);

const resolutions =
corpusEvent?.similarity_resolutions ??
[];

return (


<div
  style={{
    background: "#08101f",
    border: "1px solid #172033",
    borderRadius: 10,
    padding: 16,
  }}
>

  {/* HEADER */}

  <div
    style={{
      fontSize: 11,
      color: "#6b7280",
      textTransform: "uppercase",
      letterSpacing: 1.5,
      marginBottom: 12,
    }}
  >
    Similar Cases
  </div>

  {/* NO CORPUS EVENT */}

  {!corpusEvent && (

    <div
      style={{
        color: "#9ca3af",
        fontSize: 12,
      }}
    >
      No corpus event found for:
      {" "}
      {focusedEventId}
    </div>

  )}

  {/* NO RESOLUTIONS */}

  {corpusEvent &&
    resolutions.length === 0 && (

    <div
      style={{
        color: "#9ca3af",
        fontSize: 12,
      }}
    >
      No similarity resolutions available.
    </div>

  )}

  {/* RESOLUTION CARDS */}

  {resolutions.map(
    (resolution) => (

      <div
        key={
          resolution.target_event_id
        }
        style={{
          background: "#0d1728",
          border: "1px solid #172033",
          borderRadius: 8,
          padding: "12px 14px",
          marginBottom: 10,
        }}
      >

        <div
          style={{
            color: "#e5e7eb",
            fontWeight: 700,
            fontSize: 13,
            marginBottom: 8,
          }}
        >
          {resolution.target_event_name}
        </div>

        <div
          style={{
            color: "#9ca3af",
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          Confidence:
          {" "}
          {(resolution.confidence * 100).toFixed(1)}
          %

          <br />

          Narrative:
          {" "}
          {(resolution.narrative_similarity * 100).toFixed(1)}
          %

          <br />

          Observability:
          {" "}
          {(resolution.observability_similarity * 100).toFixed(1)}
          %

          <br />

          Infrastructure:
          {" "}
          {(resolution.infrastructure_similarity * 100).toFixed(1)}
          %

          <br />

          Topology:
          {" "}
          {(resolution.topology_similarity * 100).toFixed(1)}
          %

          <br />

          Geo:
          {" "}
          {(resolution.geo_similarity * 100).toFixed(1)}
          %
        </div>

        {resolution.rationale.length > 0 && (

          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              color: "#94a3b8",
            }}
          >
            {resolution.rationale.map(
              (
                rationale,
                index
              ) => (

                <div
                  key={index}
                >
                  • {rationale}
                </div>

              )
            )}
          </div>

        )}

      </div>

    )
  )}

</div>


);
}
