// ============================================================
// topology.ts
// IMMUTABLE TOPOLOGY SNAPSHOT CONTRACT
// ============================================================

export interface TopologySnapshot {

  stability_state?: string;

  ambiguity_state?: string;

  ambiguity_score?: number;

  contradiction_density?: number;

  residual_instability?: number;

  entanglement_score?: number;

  cluster_fragmentation?: number;

  topology_weight?: number;

}