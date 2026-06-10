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

      {narratives.map((narrative) => (
        <div
          key={narrative.observer_id}
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid #374151",
            borderRadius: 6,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#9ca3af",
              marginBottom: 6,
            }}
          >
            {narrative.observer_id}
          </div>

          <div
            style={{
              color: "#d1d5db",
              lineHeight: 1.5,
            }}
          >
            {narrative.text}
          </div>
        </div>
      ))}
    </SurfaceBlock>
  );
}