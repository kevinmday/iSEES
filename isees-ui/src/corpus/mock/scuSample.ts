// ============================================================
// SCU SAMPLE EVENT
// P24.2B
// FEDERATION VALIDATION FIXTURE
// ============================================================

import type {
  CanonicalReplayEvent,
} from "../../adapters/canonicalEventAdapter";

export const SCU_SAMPLE_EVENT: CanonicalReplayEvent = {

  event_id:
    "SCU-NIMITZ-2004",

  event_name:
    "SCU Nimitz Incident",

  classification:
    "UAP",

  operational_intelligence: {

    assessment: {

      confidence:
        "HIGH",

      topology_state:
        "STABLE",

      primary_hypothesis:
        "Multi-sensor correlated anomalous object",

      primary_contradiction:
        "Unknown propulsion mechanism",

      next_best_action:
        "Cross-reference against System Canon",
    },

    recommended_actions: [

      "Compare against USS Nimitz canonical event",

      "Review radar correlation timeline",

      "Evaluate observability overlap",
    ],

    investigation_vectors: [

      "sensor-correlation",

      "topology-overlap",

      "facility-analysis",
    ],

    domain_inference: [

      "aviation",

      "radar",

      "multi-sensor",
    ],
  },

  epistemic_state: {

    current_layer: 1,

    total_layers: 5,
  },

  core_event: {

    location: {

      city:
        "Pacific Ocean",

      state:
        "CA",

      lat:
        31.0,

      lon:
        -117.0,
    },

    observability_profile: {

      confidence:
        0.91,

      reports:
        4,

      clusters:
        1,

      duration_minutes:
        5,
    },

    semantic_signature: {

      traits: [

        "multi-sensor",

        "radar-confirmed",

        "visual-confirmed",
      ],

      narratives: [

        "Object descended rapidly from high altitude.",

        "Visual observers reported a smooth white object.",

        "Target maneuvered without visible propulsion.",

        "Radar contact correlated with observer reports.",
      ],
    },

    infrastructure_context: {

      facilities: [

        {
          name:
            "USS Princeton",

          type:
            "AEGIS",

          distance:
            "0 km",
        },

        {
          name:
            "USS Nimitz",

          type:
            "Carrier",

          distance:
            "3 km",
        },
      ],
    },
  },

  topology: {

    contradiction_load: {

      contradiction_density:
        0.18,
    },

    topology_state: {

      stability_state:
        "HIGH",

      ambiguity_state:
        "MODERATE",

      contradiction_density:
        0.18,

      residual_instability:
        0.11,

      entanglement_score:
        0.88,

      cluster_fragmentation:
        0.05,
    },
  },
};