import SurfaceBlock from "./SurfaceBlock";
import MetricBox from "./MetricBox";

export default function SummarySurface({
  event,
  topology,
}: {
  event: any;
  topology: any;
}) {
  return (
    <>
      <SurfaceBlock title="Manifold Reasoning">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {(event.reasoning || []).map(
            (item: string, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: 12,
                  border: "1px solid #1f2937",
                  borderRadius: 8,
                  background: "#0b1220",
                  color: "#cbd5e1",
                  fontSize: 13,
                }}
              >
                {item}
              </div>
            )
          )}
        </div>
      </SurfaceBlock>

      <SurfaceBlock title="Topology State">
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          <MetricBox
            label="Stability"
            value={
              topology.stability_state ||
              "UNKNOWN"
            }
          />

          <MetricBox
            label="Ambiguity"
            value={
              topology.ambiguity_state ||
              "UNKNOWN"
            }
          />

          <MetricBox
            label="Residual"
            value={
              topology.residual_instability || 0
            }
          />

          <MetricBox
            label="Entanglement"
            value={
              topology.entanglement_score || 0
            }
          />

          <MetricBox
            label="Contradiction"
            value={
              topology.contradiction_density || 0
            }
          />

          <MetricBox
            label="Fragmentation"
            value={
              topology.cluster_fragmentation || 0
            }
          />
        </div>
      </SurfaceBlock>
    </>
  );
}