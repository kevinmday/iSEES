// ============================================================
// Resolution Types
// P24.2
// ============================================================

export interface SimilarityResolution {

  target_event_id: string;

  target_event_name: string;

  confidence: number;

  narrative_similarity: number;

  observability_similarity: number;

  infrastructure_similarity: number;

  topology_similarity: number;

  geo_similarity: number;

  rationale: string[];
}

export interface ResolutionWeights {

  narrative: number;

  observability: number;

  infrastructure: number;

  topology: number;

  geo: number;
}

export const DEFAULT_RESOLUTION_WEIGHTS:
  ResolutionWeights = {

  narrative: 0.30,

  observability: 0.20,

  infrastructure: 0.15,

  topology: 0.25,

  geo: 0.10,
};