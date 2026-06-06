// ============================================================
// src/adapters/canonicalEventAdapter.ts
// PHASE: CANONICAL EVENT ADAPTER FOUNDATION (V4)
// LIVE CLUSTER IDENTITY PROPAGATION FIXED
// LIVE LOCATION PROPAGATION FIXED
// OPERATIONAL INTEL SYNCHRONIZATION READY
// LIVE FACILITY HYDRATION ENABLED
// BACKEND REASONING CONTRACT READY
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

  // ----------------------------------------------------------
  // OPERATIONAL INTELLIGENCE
  // ----------------------------------------------------------

operational_intelligence?: {

  assessment?: {

    confidence: string;

    topology_state: string;

    primary_hypothesis: string;

    primary_contradiction: string;

    next_best_action: string;
  };

  recommended_actions?: string[];

  investigation_vectors?: string[];

  domain_inference?: string[];
};

  // ----------------------------------------------------------
  // EPISTEMIC STATE
  // ----------------------------------------------------------

  epistemic_state?: {

    current_layer?: number;

    total_layers?: number;
  };

  // ----------------------------------------------------------
  // CORE EVENT
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // TOPOLOGY
  // ----------------------------------------------------------

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
// LIVE CLUSTER TYPES
// ============================================================

export type LiveCluster = {

  cluster_id?: string;

  event_id?: string;

  location?: string;

  confidence?: number;

  cluster_size?: number;

  reasoning?: string[];

  operational_intelligence?: {

    facilities?: Array<{
      name?: string;
      type?: string;
      distance?: string;
    }>;

    recommended_actions?: string[];

    investigation_vectors?: string[];

    domain_inference?: string[];
  };

  raw?: {
    event_id?: string;
  };

  reports?: Array<{
    narrative_raw?: string;
    semantic_ready_text?: string;
    normalized_geo?: {
      city?: string;
      state?: string;
    };
  }>;

  reportsData?: Array<{
    narrative_raw?: string;
    semantic_ready_text?: string;
    normalized_geo?: {
      city?: string;
      state?: string;
    };
  }>;

  topology_state?: {
    stability_state?: string;
    ambiguity_state?: string;
    contradiction_density?: number;
    residual_instability?: number;
    entanglement_score?: number;
    cluster_fragmentation?: number;
  };
};

// ============================================================
// NORMALIZATION HELPERS
// ============================================================

function normalizeObservation(
  text: string
): string[] {

  const normalized: string[] = [];

  const lower =
    text.toLowerCase();

  if (
    lower.includes("hover") ||
    lower.includes("motionless") ||
    lower.includes("stationary")
  ) {
    normalized.push(
      "motion_state: stationary-hover"
    );
  }

  if (
    lower.includes("zig-zag") ||
    lower.includes("instant") ||
    lower.includes("suddenly")
  ) {
    normalized.push(
      "motion_state: non-ballistic-transition"
    );
  }

  if (
    lower.includes("glow") ||
    lower.includes("bright") ||
    lower.includes("light") ||
    lower.includes("luminous")
  ) {
    normalized.push(
      "luminosity: elevated"
    );
  }

  if (
    lower.includes("silent") ||
    lower.includes("no sound")
  ) {
    normalized.push(
      "acoustic_profile: silent"
    );
  }

  if (
    lower.includes("smooth") ||
    lower.includes("featureless") ||
    lower.includes("white")
  ) {
    normalized.push(
      "surface_profile: low-feature"
    );
  }

  if (
    lower.includes("impossible") ||
    lower.includes("instant") ||
    lower.includes("vanished")
  ) {
    normalized.push(
      "physics_conflict: elevated"
    );
  }

  if (normalized.length === 0) {

    normalized.push(
      "semantic_state: unresolved"
    );
  }

  return normalized;
}

// ============================================================
// SEMANTIC PRESSURE
// ============================================================

function deriveSemanticPressure(
  text: string
) {

  const lower =
    text.toLowerCase();

  const hesitationMarkers = [
    "seemed",
    "appeared",
    "maybe",
    "possibly",
    "i think",
  ];

  const certaintyMarkers = [
    "definitely",
    "clearly",
    "absolutely",
    "directly",
    "without doubt",
  ];

  const hesitationCount =
    hesitationMarkers.filter((m) =>
      lower.includes(m)
    ).length;

  const certaintyCount =
    certaintyMarkers.filter((m) =>
      lower.includes(m)
    ).length;

  return {

    hesitation_markers:
      hesitationCount,

    certainty_markers:
      certaintyCount,

    perceptual_stability:
      hesitationCount > certaintyCount
        ? "MODERATE"
        : "HIGH",

    semantic_pressure:
      certaintyCount > 1
        ? "ELEVATED"
        : "MODERATE",
  };
}

// ============================================================
// CANONICAL ADAPTER
// ============================================================

export function adaptCanonicalEvent(
  event: CanonicalReplayEvent
): EventData {

  const location =
    event.core_event?.location
      ? [
          event.core_event.location.city,
          event.core_event.location.state,
        ]
          .filter(Boolean)
          .join(", ")
      : "UNKNOWN";

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

  const narrativeTexts =
    event.core_event?.semantic_signature
      ?.narratives ?? [];

  const narratives:
    NarrativeData[] =
      narrativeTexts.map(
        (
          text,
          index
        ) => {

          const normalized =
            normalizeObservation(text);

          const semanticPressure =
            deriveSemanticPressure(text);

          return {

            observer_id:
              `OBS-${index + 1}`,

            location,

            semantic_match: 0.82,

            time_offset:
              `+${index}m`,

            confidence,

            certainty:
              semanticPressure
                .certainty_markers > 0
                  ? "HIGH"
                  : "MEDIUM",

            text,

            traits:
              event.core_event
                ?.semantic_signature
                ?.traits ?? [],

            raw_field_note:
              text,

            normalized_observation:
              normalized,

            semantic_pressure:
              semanticPressure
                .semantic_pressure,

            certainty_markers:
              semanticPressure
                .certainty_markers,

            hesitation_markers:
              semanticPressure
                .hesitation_markers,

            perceptual_stability:
              semanticPressure
                .perceptual_stability,

            physics_conflict:
              normalized.some((n) =>
                n.includes(
                  "physics_conflict"
                )
              )
                ? "HIGH"
                : "LOW",

            entanglement_links: [],
          } as NarrativeData;
        }
      );

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

  return {

    id: event.event_id,

    location,

    confidence,

    reports,

    clusters,

    duration:
      `${durationMinutes}m`,

    escalation:
      confidence >= 0.85
        ? "HIGH"
        : confidence >= 0.65
          ? "MEDIUM"
          : "LOW",

    recurrence:
      confidence >= 0.7
        ? "MODERATE"
        : "LOW",

    trend:
      confidence >= 0.85
        ? "RISING"
        : confidence < 0.45
          ? "FALLING"
          : "STABLE",

       active: true,

    operational_intelligence:
      event.operational_intelligence,

    reasoning: [

      "Canonical replay-normalized event",

      "Manifold topology reconstruction active",

      "Observability normalization applied",

      "Narrative cognition structures hydrated",
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
// LIVE CLUSTER ADAPTER
// ============================================================

export function adaptLiveCluster(
  cluster: LiveCluster
): EventData {

  const reports =
    cluster.reports ??
    cluster.reportsData ??
    [];

  const firstReport =
    reports[0];

  const resolvedLocation =
    cluster.location ??
    (
      firstReport?.normalized_geo
        ? [
            firstReport.normalized_geo.city,
            firstReport.normalized_geo.state,
          ]
            .filter(Boolean)
            .join(", ")
        : null
    ) ??
    "UNKNOWN";

  const resolvedId =
    cluster.event_id ??
    cluster.raw?.event_id ??
    cluster.cluster_id ??
    "LIVE-EVENT";

  const narrativeTexts =
    reports.map((r) =>
      r.narrative_raw ||
      r.semantic_ready_text ||
      "Unresolved observer narrative"
    );

  const narratives:
    NarrativeData[] =
      narrativeTexts.map(
        (
          text,
          index
        ) => {

          const normalized =
            normalizeObservation(text);

          const semanticPressure =
            deriveSemanticPressure(text);

          return {

            observer_id:
              `LIVE-${index + 1}`,

            location:
              resolvedLocation,

            semantic_match: 0.91,

            time_offset:
              `+${index}m`,

            confidence:
              cluster.confidence ??
              0.72,

            certainty:
              semanticPressure
                .certainty_markers > 0
                  ? "HIGH"
                  : "MEDIUM",

            text,

            traits: [],

            raw_field_note:
              text,

            normalized_observation:
              normalized,

            semantic_pressure:
              semanticPressure
                .semantic_pressure,

            certainty_markers:
              semanticPressure
                .certainty_markers,

            hesitation_markers:
              semanticPressure
                .hesitation_markers,

            perceptual_stability:
              semanticPressure
                .perceptual_stability,

            physics_conflict:
              normalized.some((n) =>
                n.includes(
                  "physics_conflict"
                )
              )
                ? "HIGH"
                : "LOW",

            entanglement_links: [],
          } as NarrativeData;
        }
      );

  const observations:
    Observation[] =
      narrativeTexts.map(
        (
          text,
          index
        ) => ({

          id:
            `LIVE-OBS-${index + 1}`,

          time:
            `T+${index}m`,

          location:
            resolvedLocation,

          summary: text,
        })
      );

  return {

    id:
      resolvedId,

    location:
      resolvedLocation,

    confidence:
      cluster.confidence ??
      0.72,

    reports:
      reports.length,

    clusters:
      cluster.cluster_size ?? 1,

    duration: "LIVE",

    escalation: "MEDIUM",

    recurrence: "LOW",

    trend: "RISING",

    active: true,

operational_intelligence:
  cluster.operational_intelligence,

    reasoning:
      cluster.reasoning ?? [

        "Live ROR/EOR ingestion active",

        "Operational cognition propagation active",

        "Live topology hydration enabled",
      ],

    narratives,

    observations,

    facilities:
      (
        cluster.operational_intelligence
          ?.facilities ?? []
      ).map((facility) => ({

        name:
          facility.name ?? "Unknown Facility",

        type:
          facility.type ?? "UNKNOWN",

        distance:
          facility.distance ?? "N/A",
      })),

    topology: {

      stability_state:
        cluster.topology_state
          ?.stability_state ??
        "LIVE",

      ambiguity_state:
        cluster.topology_state
          ?.ambiguity_state ??
        "ACTIVE",

      contradiction_density:
        cluster.topology_state
          ?.contradiction_density ??
        0,

      residual_instability:
        cluster.topology_state
          ?.residual_instability ??
        0,

      entanglement_score:
        cluster.topology_state
          ?.entanglement_score ??
        0,

      cluster_fragmentation:
        cluster.topology_state
          ?.cluster_fragmentation ??
        0,
    },

    topology_observability: {

      overlap_regions: [],

      entanglements: {

        global_entanglement_score: 0,

        high_entanglement_domains: [],
      },

      residual_vectors: {

        global_residual_instability: 0,

        high_instability_domains: [],
      },

      collapse_clusters: {

        cluster_fragmentation: 0,

        cluster_types: [],
      },
    },
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