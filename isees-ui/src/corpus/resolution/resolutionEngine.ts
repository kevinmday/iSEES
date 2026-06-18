// ============================================================
// src/corpus/resolution/resolutionEngine.ts
// P24.2 RESOLUTION ENGINE
// DETERMINISTIC CORPUS COMPARISON
// FULL DROP-IN FILE
// ============================================================

import type {
  CorpusEvent,
} from "../corpusTypes";

import type {
  CanonicalReplayEvent,
} from "../../adapters/canonicalEventAdapter";

import type {
  SimilarityResolution,
} from "./resolutionTypes";

import {
  DEFAULT_RESOLUTION_WEIGHTS,
} from "./resolutionTypes";

import {
  jaccardSimilarity,
  facilitySimilarity,
  topologySimilarity,
  weightedScore,
} from "./similarity";

// ============================================================
// RESOLVE AGAINST CORPUS
// ============================================================

export function resolveAgainstCorpus(
  candidate: CanonicalReplayEvent,
  corpus: CorpusEvent[]
): SimilarityResolution[] {

  const results =
    corpus.map((entry) =>
      resolveEventPair(
        candidate,
        entry.canonical_event
      )
    );

  return results.sort(
    (a, b) =>
      b.confidence -
      a.confidence
  );
}

// ============================================================
// EVENT PAIR RESOLUTION
// ============================================================

export function resolveEventPair(
  source: CanonicalReplayEvent,
  target: CanonicalReplayEvent
): SimilarityResolution {

  const narrativeSimilarity =
    computeNarrativeSimilarity(
      source,
      target
    );

  const observabilitySimilarity =
    computeObservabilitySimilarity(
      source,
      target
    );

  const infrastructureSimilarity =
    computeInfrastructureSimilarity(
      source,
      target
    );

  const topologyScore =
    computeTopologySimilarity(
      source,
      target
    );

  const geoSimilarity =
    computeGeoSimilarity(
      source,
      target
    );

  const confidence =
    weightedScore(
      [
        narrativeSimilarity,
        observabilitySimilarity,
        infrastructureSimilarity,
        topologyScore,
        geoSimilarity,
      ],
      [
        DEFAULT_RESOLUTION_WEIGHTS.narrative,
        DEFAULT_RESOLUTION_WEIGHTS.observability,
        DEFAULT_RESOLUTION_WEIGHTS.infrastructure,
        DEFAULT_RESOLUTION_WEIGHTS.topology,
        DEFAULT_RESOLUTION_WEIGHTS.geo,
      ]
    );

  const rationale: string[] = [];

  if (
    narrativeSimilarity >= 0.70
  ) {
    rationale.push(
      "Strong narrative signature overlap"
    );
  }

  if (
    topologyScore >= 0.70
  ) {
    rationale.push(
      "Topology state alignment"
    );
  }

  if (
    infrastructureSimilarity >= 0.70
  ) {
    rationale.push(
      "Infrastructure context similarity"
    );
  }

  return {

    target_event_id:
      target.event_id,

    target_event_name:
      target.event_name,

    confidence,

    narrative_similarity:
      narrativeSimilarity,

    observability_similarity:
      observabilitySimilarity,

    infrastructure_similarity:
      infrastructureSimilarity,

    topology_similarity:
      topologyScore,

    geo_similarity:
      geoSimilarity,

    rationale,
  };
}

// ============================================================
// NARRATIVE
// ============================================================

function computeNarrativeSimilarity(
  a: CanonicalReplayEvent,
  b: CanonicalReplayEvent
): number {

  const traitsA =
    a.core_event
      ?.semantic_signature
      ?.traits ?? [];

  const traitsB =
    b.core_event
      ?.semantic_signature
      ?.traits ?? [];

  return jaccardSimilarity(
    traitsA,
    traitsB
  );
}

// ============================================================
// OBSERVABILITY
// ============================================================

function computeObservabilitySimilarity(
  a: CanonicalReplayEvent,
  b: CanonicalReplayEvent
): number {

  const obsA =
    a.core_event
      ?.observability_profile;

  const obsB =
    b.core_event
      ?.observability_profile;

  if (
    !obsA ||
    !obsB
  ) {
    return 0;
  }

  const confidenceDelta =
    Math.abs(
      (obsA.confidence ?? 0) -
      (obsB.confidence ?? 0)
    );

  const durationDelta =
    Math.abs(
      (obsA.duration_minutes ?? 0) -
      (obsB.duration_minutes ?? 0)
    );

  const confidenceScore =
    Math.max(
      0,
      1 - confidenceDelta
    );

  const durationScore =
    Math.max(
      0,
      1 -
      durationDelta /
        100
    );

  return (
    confidenceScore +
    durationScore
  ) / 2;
}

// ============================================================
// INFRASTRUCTURE
// ============================================================

function computeInfrastructureSimilarity(
  a: CanonicalReplayEvent,
  b: CanonicalReplayEvent
): number {

  const facilitiesA =
    (
      a.core_event
        ?.infrastructure_context
        ?.facilities ?? []
    ).map(
      (f) => f.type
    );

  const facilitiesB =
    (
      b.core_event
        ?.infrastructure_context
        ?.facilities ?? []
    ).map(
      (f) => f.type
    );

  return facilitySimilarity(
    facilitiesA,
    facilitiesB
  );
}

// ============================================================
// TOPOLOGY
// ============================================================

function computeTopologySimilarity(
  a: CanonicalReplayEvent,
  b: CanonicalReplayEvent
): number {

  return topologySimilarity(
    {
      contradiction_density:
        a.topology
          ?.topology_state
          ?.contradiction_density,

      residual_instability:
        a.topology
          ?.topology_state
          ?.residual_instability,

      entanglement_score:
        a.topology
          ?.topology_state
          ?.entanglement_score,

      cluster_fragmentation:
        a.topology
          ?.topology_state
          ?.cluster_fragmentation,
    },
    {
      contradiction_density:
        b.topology
          ?.topology_state
          ?.contradiction_density,

      residual_instability:
        b.topology
          ?.topology_state
          ?.residual_instability,

      entanglement_score:
        b.topology
          ?.topology_state
          ?.entanglement_score,

      cluster_fragmentation:
        b.topology
          ?.topology_state
          ?.cluster_fragmentation,
    }
  );
}

// ============================================================
// GEO
// ============================================================

function computeGeoSimilarity(
  a: CanonicalReplayEvent,
  b: CanonicalReplayEvent
): number {

  const stateA =
    a.core_event
      ?.location
      ?.state;

  const stateB =
    b.core_event
      ?.location
      ?.state;

  if (
    !stateA ||
    !stateB
  ) {
    return 0;
  }

  return (
    stateA === stateB
      ? 1
      : 0
  );
}