import SurfaceBlock from "./SurfaceBlock";
import SurfaceState from "../SurfaceState";
import type { NarrativeData } from "../../context/EventContext";

type NarrativesSurfaceProps = {
  narratives: NarrativeData[];
};

export default function NarrativesSurface({
  narratives,
}: NarrativesSurfaceProps) {
  return (
    <SurfaceBlock title="Observer Narrative Intelligence">
      <SurfaceState
        title="Narrative Surface State"
        state="ACTIVE"
        density="MODERATE"
        topology="SEMANTICALLY COHERENT"
        pressure="RISING"
        integrity="VERIFIED"
        glyph="NARRATIVE"
        explanation={[
          "Observer narrative convergence actively propagating.",
          "Semantic topology coherence stabilized.",
          "Narrative cognition field currently synchronized.",
        ]}
      />

      {narratives.map((narrative, index) => (
        <div
          key={narrative.observer_id}
          style={{
            marginTop: 12,
            padding: 16,
            border: "1px solid #374151",
            borderRadius: 6,
            background: "#08101f",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#d1d5db",
                letterSpacing: 1,
              }}
            >
              OBSERVER REPORT {index + 1}
            </div>

            <div
              style={{
                fontSize: 11,
                color: "#9ca3af",
              }}
            >
              {narrative.location}
            </div>
          </div>

          <div
            style={{
              color: "#f3f4f6",
              lineHeight: 1.7,
              fontSize: 16,
              marginBottom: 14,
              fontStyle: "italic",
            }}
          >
            &ldquo;{narrative.text}&rdquo;
          </div>

          <div
            style={{
              display: "flex",
              gap: 18,
              flexWrap: "wrap",
              fontSize: 11,
              color: "#9ca3af",
              marginBottom: 10,
            }}
          >
            <div>
              Confidence: {(narrative.confidence * 100).toFixed(0)}%
            </div>

            <div>
              Certainty: {narrative.certainty}
            </div>

            <div>
              Semantic Pressure: {narrative.semantic_pressure ?? "UNKNOWN"}
            </div>
          </div>

          {narrative.traits.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {narrative.traits.map((trait) => (
                <div
                  key={trait}
                  style={{
                    padding: "3px 8px",
                    border: "1px solid #374151",
                    borderRadius: 12,
                    fontSize: 10,
                    color: "#93c5fd",
                  }}
                >
                  {trait}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </SurfaceBlock>
  );
}