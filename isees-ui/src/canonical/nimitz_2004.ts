// ============================================================
// NIMITZ TIC TAC 2004
// CANONICAL EVENT
// FULLY HYDRATED REPLAY ARTIFACT
// ============================================================

import type {
  CanonicalReplayEvent,
} from "../adapters/canonicalEventAdapter";

export const NIMITZ_2004:
  CanonicalReplayEvent = {

  event_id:
    "E-TICTAC-2004",

  event_name:
    "Nimitz Tic Tac Encounter",

  classification:
    "multi_sensor_naval_event",

  // ----------------------------------------------------------
  // OPERATIONAL INTELLIGENCE
  // ----------------------------------------------------------

  operational_intelligence: {

    recommended_actions: [

      "Review USS Princeton SPY-1 radar tracks",

      "Correlate E2 Hawkeye sensor observations",

      "Compare pilot observations against radar detections",

      "Assess recurrence signatures across carrier group assets",
    ],

    investigation_vectors: [

      "Multi-sensor correlation analysis",

      "Carrier strike group observability topology",

      "Object anticipation behavior",

      "Cross-domain maneuver characterization",
    ],

    domain_inference: [

      "NAVAL",

      "MULTI-SENSOR",

      "AIR INTERCEPT",
    ],
  },

  // ----------------------------------------------------------
  // CORE EVENT
  // ----------------------------------------------------------

  core_event: {

    location: {

      city:
        "Pacific Ocean",

      state:
        "California",

      lat:
        31.0,

      lon:
        -117.0,
    },

    observability_profile: {

      confidence:
        0.96,

      reports:
        4,

      clusters:
        1,

      duration_minutes:
        300,
    },

    semantic_signature: {

      traits: [

        "tic-tac",

        "silent",

        "stationary-hover",

        "instant-acceleration",

        "multi-sensor",

        "object-anticipation",

        "cross-domain-maneuver",
      ],

      narratives: [

        "USS Princeton radar operators tracked multiple unknown contacts descending from approximately 80000 feet to near sea level in seconds before stabilizing and remaining on station for extended periods.",

        "F/A-18 pilot visual intercept confirmed a smooth white tic tac shaped object approximately forty feet in length exhibiting abrupt directional changes without visible wings, exhaust, or control surfaces.",

        "Witnesses reported the object reacting to interceptor maneuvers, mirroring aircraft descent before accelerating away at extraordinary speed beyond conventional aircraft performance expectations.",

        "Following termination of the intercept, the object appeared near the pre-briefed combat air patrol rendezvous point approximately sixty nautical miles away, suggesting anticipatory awareness of aircraft routing.",
      ],
    },

    infrastructure_context: {

      facilities: [

        {
          name:
            "USS Princeton",

          type:
            "AEGIS RADAR",

          distance:
            "0km",
        },

        {
          name:
            "USS Nimitz Carrier Group",

          type:
            "NAVAL STRIKE GROUP",

          distance:
            "3km",
        },

        {
          name:
            "E2 Hawkeye Sensor Grid",

          type:
            "AIRBORNE SENSOR",

          distance:
            "12km",
        },
      ],
    },
  },

  // ----------------------------------------------------------
  // TOPOLOGY
  // ----------------------------------------------------------

  topology: {

    contradiction_load: {

      contradiction_density:
        0.22,
    },

    topology_state: {

      stability_state:
        "UNSTABLE",

      ambiguity_state:
        "MODERATE",

      contradiction_density:
        0.22,

      residual_instability:
        0.71,

      entanglement_score:
        0.88,

      cluster_fragmentation:
        0.12,
    },
  },

  // ----------------------------------------------------------
  // EPISTEMIC STATE
  // ----------------------------------------------------------

  epistemic_state: {

    current_layer:
      7,

    total_layers:
      12,
  },
};