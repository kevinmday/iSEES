// ============================================================
// synthetic_event_feed.ts
// DEV MODE — SYNTHETIC EVENT ENGINE (V2)
// TOPOLOGY OBSERVABILITY ENABLED
// FULL DROP-IN REPLACEMENT
// ============================================================

export type EventState = {
  t: number;
  reports: number;
  confidence: number;
  cluster_size: number;
  sources: string[];
  state: "emerging" | "forming" | "confirmed" | "decaying";
};

export type SyntheticEvent = {
  id: string;
  location: string;
  lat: number;
  lon: number;
  timeline: EventState[];
};

// ------------------------------------------------------------
// SAMPLE EVENTS
// ------------------------------------------------------------

const EVENTS: SyntheticEvent[] = [

  {
    id: "E-MEDFORD-001",

    location: "Medford, OR",

    lat: 42.3265,
    lon: -122.8756,

    timeline: [

      {
        t: 0,
        reports: 1,
        confidence: 0.32,
        cluster_size: 1,
        sources: ["visual"],
        state: "emerging"
      },

      {
        t: 20,
        reports: 2,
        confidence: 0.48,
        cluster_size: 2,
        sources: ["visual"],
        state: "forming"
      },

      {
        t: 40,
        reports: 3,
        confidence: 0.61,
        cluster_size: 3,
        sources: ["visual", "radar"],
        state: "forming"
      },

      {
        t: 60,
        reports: 5,
        confidence: 0.82,
        cluster_size: 5,
        sources: ["visual", "radar"],
        state: "confirmed"
      },

      {
        t: 90,
        reports: 4,
        confidence: 0.74,
        cluster_size: 4,
        sources: ["radar"],
        state: "decaying"
      },
    ],
  },

  {
    id: "E-PACIFIC-004",

    location: "Pacific Sector",

    lat: 31.4,
    lon: -142.7,

    timeline: [

      {
        t: 0,
        reports: 3,
        confidence: 0.52,
        cluster_size: 2,
        sources: ["visual", "naval"],
        state: "forming"
      },

      {
        t: 25,
        reports: 5,
        confidence: 0.73,
        cluster_size: 3,
        sources: ["visual", "radar", "naval"],
        state: "forming"
      },

      {
        t: 55,
        reports: 7,
        confidence: 0.91,
        cluster_size: 5,
        sources: ["visual", "radar", "naval"],
        state: "confirmed"
      },

      {
        t: 85,
        reports: 7,
        confidence: 0.88,
        cluster_size: 5,
        sources: ["visual", "radar", "naval"],
        state: "confirmed"
      },
    ],
  },
];

// ------------------------------------------------------------
// ENGINE
// ------------------------------------------------------------

export class SyntheticEventEngine {

  private startTime: number;

  private activeEvent: SyntheticEvent;

  constructor(eventId?: string) {

    this.startTime = Date.now();

    this.activeEvent =
      EVENTS.find(
        e => e.id === eventId
      ) || EVENTS[0];
  }

  // ==========================================================
  // CURRENT STATE
  // ==========================================================

  getCurrentState() {

    const elapsed =
      (Date.now() - this.startTime) / 1000;

    let current =
      this.activeEvent.timeline[0];

    for (const state of this.activeEvent.timeline) {

      if (elapsed >= state.t) {

        current = state;
      }
    }

    // ========================================================
    // MEDFORD TOPOLOGY
    // ========================================================

    const medfordTopology = {

      topology: {

        stability_state: "FRAGMENTED",

        ambiguity_state: "HIGH",

        contradiction_density: 1,

        residual_instability: 0.716,

        entanglement_score: 0.75,

        cluster_fragmentation: 0.5,
      },

      topology_observability: {

        overlap_regions: [

          {
            overlap_score: 1.0,

            contributing_candidates: [
              "CAND-AVIATION-1",
              "CAND-AVIATION-2",
            ],

            shared_features: [
              "trajectory continuity",
              "structured maneuvering",
              "speed profile",
            ],
          },

          {
            overlap_score: 0.42,

            contributing_candidates: [
              "CAND-AVIATION-2",
              "CAND-WEATHER-1",
            ],

            shared_features: [
              "altitude consistency",
              "silent behavior",
            ],
          },
        ],

        entanglements: {

          global_entanglement_score: 0.75,

          high_entanglement_domains: [

            ["aviation", "weather"],
          ],
        },

        residual_vectors: {

          global_residual_instability: 0.716,

          high_instability_domains: [
            "weather",
            "aviation",
          ],
        },

        collapse_clusters: {

          cluster_fragmentation: 0.5,

          cluster_types: [
            "aviation",
            "weather",
          ],
        },
      },
    };

    // ========================================================
    // PACIFIC TOPOLOGY
    // ========================================================

    const pacificTopology = {

      topology: {

        stability_state: "UNSTABLE",

        ambiguity_state: "MODERATE",

        contradiction_density: 0.62,

        residual_instability: 0.48,

        entanglement_score: 0.44,

        cluster_fragmentation: 0.21,
      },

      topology_observability: {

        overlap_regions: [

          {
            overlap_score: 0.81,

            contributing_candidates: [
              "CAND-NAVAL-1",
              "CAND-RADAR-1",
            ],

            shared_features: [
              "persistent object continuity",
              "geo-spatial convergence",
              "multi-sensor correlation",
            ],
          },
        ],

        entanglements: {

          global_entanglement_score: 0.44,

          high_entanglement_domains: [

            ["naval", "radar"],
          ],
        },

        residual_vectors: {

          global_residual_instability: 0.48,

          high_instability_domains: [
            "radar",
          ],
        },

        collapse_clusters: {

          cluster_fragmentation: 0.21,

          cluster_types: [
            "naval",
            "radar",
          ],
        },
      },
    };

    // ========================================================
    // SELECT TOPOLOGY
    // ========================================================

    const topologyPayload =
      this.activeEvent.id === "E-PACIFIC-004"
        ? pacificTopology
        : medfordTopology;

    // ========================================================
    // RETURN
    // ========================================================

    return {

      event_id:
        this.activeEvent.id,

      location:
        this.activeEvent.location,

      lat:
        this.activeEvent.lat,

      lon:
        this.activeEvent.lon,

      elapsed,

      ...current,

      // ------------------------------------------------------
      // TOPOLOGY
      // ------------------------------------------------------

      ...topologyPayload,
    };
  }

  // ==========================================================
  // RESET
  // ==========================================================

  reset(eventId?: string) {

    this.startTime = Date.now();

    if (eventId) {

      const found = EVENTS.find(
        e => e.id === eventId
      );

      if (found) {

        this.activeEvent = found;
      }
    }
  }
}