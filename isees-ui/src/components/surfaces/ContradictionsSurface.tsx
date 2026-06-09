import SurfaceState from "../SurfaceState";

interface ContradictionsSurfaceProps {
  contradictionDensity: number;
}

export default function ContradictionsSurface({
  contradictionDensity,
}: ContradictionsSurfaceProps) {
  return (
    <SurfaceState
      title="Contradiction Surface"
      state="ACTIVE"
      density="HIGH"
      topology="CONFLICTED"
      pressure="ELEVATED"
      integrity="UNSTABLE"
      glyph="CONTRADICTIONS"
      explanation={[
        "Contradiction density exceeds nominal baseline.",
        "Observer/sensor disagreement remains unresolved.",
        `Contradiction density currently ${contradictionDensity}.`,
      ]}
    />
  );
}