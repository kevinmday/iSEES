import SurfaceState from "../SurfaceState";

export default function CollapseSurface() {
  return (
    <SurfaceState
      title="Collapse Surface"
      state="ACTIVE"
      density="HIGH"
      topology="COLLAPSING"
      pressure="SEVERE"
      integrity="UNSTABLE"
      glyph="COLLAPSE"
      explanation={[
        "Topology collapse pathways currently active.",
        "Sensor coherence degrading under manifold stress.",
        "Collapse basin convergence detected.",
      ]}
    />
  );
}