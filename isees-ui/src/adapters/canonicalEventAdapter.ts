// ============================================================
// src/adapters/canonicalEventAdapter.ts
// PHASE: CANONICAL EVENT ADAPTER FOUNDATION
// CANONICAL REPLAY → FRONTEND EVENT HYDRATION
// FULL DROP-IN FILE
// ============================================================

import type {
  EventData,
  NarrativeData,
  Observation,
  Facility,
  TopologyState,
  TopologyObservability,
} from "../context/EventContext";

// ============================================================
// CANONICAL TYPES
// ============================================================

export type CanonicalReplayEvent = {
  event_id: string;
  event_name: string;
  classification: string;

  epistemic_state?: {
    current_layer?: number;
    total_layers?: number;
  };

  core_event?: {
    location?: {
      city?: string;
      state?: string;
      lat?: number;
      lon?: number;
    };

    observability_profile?: {
      confidence?: number;
      reports?: number;
      clusters?: number;
      duration_minutes?: number;
    };

    semantic_signature?: {
      traits?: string[];
      narratives?: string[];
    };

    infrastructure_context?: {
      facilities?: Array<{
        name: string;
        type: string;
        distance: string;
      }>;
    };
  };

  topology?: {
    contradiction_load?: {
      contradiction_density?: number;
    };

    topology_state?: {
      stability_state?: string;
      ambiguity_state?: string;
      contradiction_density?: number;
      residual_instability?: number;
      entanglement_score?: number;
      cluster_fragmentation?: number;
    };
  };
};

// ============================================================
// ADAPTER
// ============================================================

export function adaptCanonicalEvent(
  event: CanonicalReplayEvent
): EventData {

  // =========================================================
  // LOCATION
  // =========================================================

  const location =
    event.core_event?.location
      ? [
          event.core_event.location.city,
          event.core_event.location.state,
        ]
          .filter(Boolean)
          .join(", ")
      : "UNKNOWN";

  // =========================================================
  // OBSERVABILITY
  // =========================================================

  const observability =
    event.core_event?.observability_profile;

  const confidence =
    observability?.confidence ?? 0.5;

  const reports =
    observability?.reports ?? 1;

  const clusters =
    observability?.clusters ?? 1;

  const durationMinutes =
    observability?.duration_minutes ?? 0;

  // =========================================================
  // TOPOLOGY
  // =========================================================

  const topologyState:
    TopologyState = {

    stability_state:
      event.topology?.topology_state
        ?.stability_state ??
      "UNKNOWN",

    ambiguity_state:
      event.topology?.topology_state
        ?.ambiguity_state ??
      "UNKNOWN",

    contradiction_density:
      event.topology?.topology_state
        ?.contradiction_density ??
      0,

    residual_instability:
      event.topology?.topology_state
        ?.residual_instability ??
      0,

    entanglement_score:
      event.topology?.topology_state
        ?.entanglement_score ??
      0,

    cluster_fragmentation:
      event.topology?.topology_state
        ?.cluster_fragmentation ??
      0,
  };

  // =========================================================
  // TOPOLOGY OBSERVABILITY
  // =========================================================

  const topologyObservability:
    TopologyObservability = {

    overlap_regions: [],

    entanglements: {

      global_entanglement_score:
        topologyState.entanglement_score,

      high_entanglement_domains: [],
    },

    residual_vectors: {

      global_residual_instability:
        topologyState.residual_instability,

      high_instability_domains: [],
    },

    collapse_clusters: {

      cluster_fragmentation:
        topologyState.cluster_fragmentation,

      cluster_types: [],
    },
  };

  // =========================================================
  // FACILITIES
  // =========================================================

  const facilities:
    Facility[] =
      (
        event.core_event
          ?.infrastructure_context
          ?.facilities ?? []
      ).map((facility) => ({

        name: facility.name,

        type: facility.type,

        distance: facility.distance,
      }));

  // =========================================================
  // NARRATIVES
  // =========================================================

  const narrativeTexts =
    event.core_event?.semantic_signature
      ?.narratives ?? [];

  const narratives:
    NarrativeData[] =
      narrativeTexts.map(
        (
          text,
          index
        ) => ({

          observer_id:
            `OBS-${index + 1}`,

          location,

          semantic_match: 0.82,

          time_offset:
            `+${index}m`,

          confidence,

          certainty: "MEDIUM",

          text,

          traits:
            event.core_event
              ?.semantic_signature
              ?.traits ?? [],
        })
      );

  // =========================================================
  // OBSERVATIONS
  // =========================================================

  const observations:
    Observation[] =
      narrativeTexts.map(
        (
          text,
          index
        ) => ({

          id:
            `OBS-${index + 1}`,

          time:
            `T+${index}m`,

          location,

          summary: text,
        })
      );

  // =========================================================
  // TREND
  // =========================================================

  let trend:
    "RISING"
    | "STABLE"
    | "FALLING" =
      "STABLE";

  if (confidence >= 0.85) {
    trend = "RISING";
  }

  if (confidence < 0.45) {
    trend = "FALLING";
  }

  // =========================================================
  // ESCALATION
  // =========================================================

  let escalation:
    "LOW"
    | "MEDIUM"
    | "HIGH" =
      "LOW";

  if (confidence >= 0.65) {
    escalation = "MEDIUM";
  }

  if (confidence >= 0.85) {
    escalation = "HIGH";
  }

  // =========================================================
  // FINAL EVENTDATA
  // =========================================================

  return {

    id: event.event_id,

    location,

    confidence,

    reports,

    clusters,

    duration:
      `${durationMinutes}m`,

    escalation,

    recurrence:
      confidence >= 0.7
        ? "MODERATE"
        : "LOW",

    trend,

    active: true,

    reasoning: [

      "Canonical replay-normalized event",

      "Manifold topology reconstruction active",

      "Observability normalization applied",

      "Topology cognition structures hydrated",
    ],

    narratives,

    observations,

    facilities,

    topology: topologyState,

    topology_observability:
      topologyObservability,
  };
}

// ============================================================
// MULTI-EVENT ADAPTER
// ============================================================

export function adaptCanonicalEvents(
  events: CanonicalReplayEvent[]
): EventData[] {

  return events.map(
    adaptCanonicalEvent
  );
}