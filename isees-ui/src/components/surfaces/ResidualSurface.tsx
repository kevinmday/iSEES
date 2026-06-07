import SurfaceState from "../SurfaceState";

export default function ResidualSurface({
  topology,
}: {
  topology: any;
}) {
  return (
    <SurfaceState
      title="Residual Surface"
      state="ACTIVE"
      density="MODERATE"
      topology="PROPAGATING"
      pressure="UNRESOLVED"
      integrity="PARTIAL"
      glyph="RESIDUAL"
      explanation={[
        "Residual instability continues propagating through active topology.",
        "Observer geometry remains partially unresolved.",
        `Residual instability currently ${topology.residual_instability || 0}.`,
      ]}
    />
  );
}