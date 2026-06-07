import SurfaceBlock from "./SurfaceBlock";
import SurfaceState from "../SurfaceState";

export default function OverlapSurface({
  overlapRegions,
  DetailRow,
}: {
  overlapRegions: any[];
  DetailRow: any;
}) {
  return (
    <SurfaceBlock title="Overlap Regions">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {overlapRegions.length === 0 && (
          <SurfaceState
            title="Overlap Surface State"
            state="SPARSE"
            density="LOW"
            topology="DISCONNECTED"
            pressure="MINIMAL"
            integrity="VERIFIED"
            glyph="OVERLAP"
            explanation={[
              "No statistically significant overlap manifold regions detected.",
              "Observer geometry currently lacks synchronized spatial convergence.",
              "Spatial overlap activation threshold has not been reached.",
            ]}
          />
        )}

        {overlapRegions.map(
          (region: any, idx: number) => (
            <div
              key={idx}
              style={{
                border: "1px solid #1f2937",
                borderRadius: 8,
                padding: 14,
                background: "#0b1220",
              }}
            >
              <DetailRow
                label="Overlap Score"
                value={region.overlap_score}
              />

              <DetailRow
                label="Candidates"
                value={region.contributing_candidates?.join(
                  " ↔ "
                )}
              />
            </div>
          )
        )}
      </div>
    </SurfaceBlock>
  );
}