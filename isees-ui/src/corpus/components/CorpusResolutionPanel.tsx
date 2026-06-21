import { useCorpus } from "../context/CorpusContext";
import GraphDiagnostics from "../../investigationGraph/GraphDiagnostics";

export default function CorpusResolutionPanel() {
  const {
    corpus,
    selectedCorpusEventId,
  } = useCorpus();

  const selectedEvent =
    corpus.find(
      (event) =>
        event.corpus_id ===
        selectedCorpusEventId
    );

  if (!selectedEvent) {
    return (
      <div
        style={{
          padding: "12px",
        }}
      >
        No corpus event selected.
      </div>
    );
  }

  const resolutions =
    selectedEvent.similarity_resolutions ??
    [];

  return (
    <div
      style={{
        padding: "12px",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          marginBottom: "8px",
        }}
      >
        RESOLUTION ANALYSIS
            </div>

      <div
        style={{
          marginBottom: "12px",
          opacity: 0.8,
        }}
      >
        {
          selectedEvent
            .canonical_event
            .event_name
        }
      </div>

      {resolutions.length === 0 ? (
        <div
          style={{
            opacity: 0.6,
          }}
        >
          No similarity
          resolutions available.
        </div>
      ) : (
        resolutions.map(
          (resolution) => (
            <div
              key={
                resolution.target_event_id
              }
              style={{
                padding: "10px",
                marginBottom: "10px",
                border:
                  "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                }}
              >
                {
                  resolution.target_event_name
                }
              </div>

              <div>
                Confidence:{" "}
                {(
                  resolution.confidence *
                  100
                ).toFixed(1)}
                %
              </div>

              <div>
                Narrative:{" "}
                {(
                  resolution.narrative_similarity *
                  100
                ).toFixed(1)}
                %
              </div>

              <div>
                Observability:{" "}
                {(
                  resolution.observability_similarity *
                  100
                ).toFixed(1)}
                %
              </div>

              <div>
                Infrastructure:{" "}
                {(
                  resolution.infrastructure_similarity *
                  100
                ).toFixed(1)}
                %
              </div>

              <div>
                Topology:{" "}
                {(
                  resolution.topology_similarity *
                  100
                ).toFixed(1)}
                %
              </div>

              <div>
                Geo:{" "}
                {(
                  resolution.geo_similarity *
                  100
                ).toFixed(1)}
                %
              </div>

              {resolution.rationale
                .length > 0 && (
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    opacity: 0.8,
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
        )
      )}

      <hr
        style={{
          marginTop: "16px",
          marginBottom: "16px",
          opacity: 0.25,
        }}
      />

      <GraphDiagnostics />
    </div>
  );
}