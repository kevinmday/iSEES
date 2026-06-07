import SurfaceState from "../SurfaceState";

export default function ClustersSurface({
  topology,
}: {
  topology: any;
}) {
  return (
    <SurfaceState
      title="Cluster Surface"
      state="ACTIVE"
      density="HIGH"
      topology="FRAGMENTED"
      pressure="MODERATE"
      integrity="VERIFIED"
      glyph="CLUSTERS"
      explanation={[
        "Independent collapse basins currently detected.",
        "Cluster divergence remains active.",
        `Cluster fragmentation currently ${topology.cluster_fragmentation || 0}.`,
      ]}
    />
  );
}