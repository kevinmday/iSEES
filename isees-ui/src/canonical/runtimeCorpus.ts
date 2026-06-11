// ============================================================
// RUNTIME CANONICAL CORPUS
// ============================================================

import type {
  CanonicalReplayEvent,
} from "../adapters/canonicalEventAdapter";

// ============================================================
// CANONICAL REPLAY EVENTS
// ============================================================

export const CANONICAL_EVENTS:
  CanonicalReplayEvent[] = [

  {
    event_id:
      "E-MEDFORD-001",

    event_name:
      "Medford Emergence",

    classification:
      "urban_observability_event",

operational_intelligence: {

assessment: {


confidence:
  "MODERATE",

topology_state:
  "PARTIALLY_RESOLVED",

primary_hypothesis:
  "Regional observability event requiring infrastructure correlation",

primary_contradiction:
  "Insufficient sensor convergence across independent sources",

next_best_action:
  "Review airport radar coverage and correlate witness timelines",


},

recommended_actions: [


"Review airport radar coverage",

"Correlate civilian witness reports",

"Check weather and atmospheric conditions",

"Assess recurrence patterns in regional reports",


],

investigation_vectors: [


"Regional observability analysis",

"Civilian witness correlation",

"Airport infrastructure topology",

"Environmental anomaly screening",


],

domain_inference: [


"CIVILIAN",

"AIRPORT",

"OBSERVABILITY",


],
},


    core_event: {

      location: {
        city: "Medford",
        state: "OR",
      },

      observability_profile: {
        confidence: 0.82,
        reports: 4,
        clusters: 2,
        duration_minutes: 36,
      },

      semantic_signature: {

        traits: [
          "silent",
          "stationary",
          "rapid acceleration",
          "luminous",
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
              "Medford ATC Tower",

            type:
              "ATC",

            distance:
              "4.1km",
          },

          {
            name:
              "Rogue Valley Intl Airport",

            type:
              "AIRPORT OPS",

            distance:
              "5.2km",
          },

          {
            name:
              "KMAX NEXRAD",

            type:
              "RADAR",

            distance:
              "41km",
          },
        ],
      },
    },

    topology: {

      topology_state: {

        stability_state:
          "FRAGMENTED",

        ambiguity_state:
          "HIGH",

        contradiction_density:
          1.0,

        residual_instability:
          0.716,

        entanglement_score:
          0.75,

        cluster_fragmentation:
          0.5,
      },
    },
  },

  {
    event_id:
      "E-TICTAC-2004",

    event_name:
      "Nimitz Tic Tac Encounter",

    classification:
      "multi_sensor_naval_event",

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

    core_event: {

      location: {
        city: "Pacific Sector",
        state: "CA",
      },

      observability_profile: {
        confidence: 0.94,
        reports: 7,
        clusters: 5,
        duration_minutes: 85,
      },

      semantic_signature: {

        traits: [
          "multi-sensor",
          "instant acceleration",
          "naval radar",
          "structured maneuvering",
          "non-ballistic movement",
        ],

        narratives: [

          "Naval radar operators tracked anomalous descending objects demonstrating abrupt directional shifts and rapid acceleration.",

          "Visual intercept confirmed smooth white tic tac shaped object exhibiting controlled movement without visible propulsion.",

          "Objects appeared to anticipate aircraft vectoring and reposition before pilot arrival.",
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

    topology: {

      topology_state: {

        stability_state:
          "UNSTABLE",

        ambiguity_state:
          "MODERATE",

        contradiction_density:
          0.42,

        residual_instability:
          0.31,

        entanglement_score:
          0.92,

        cluster_fragmentation:
          0.18,
      },
    },
  },

  {
    event_id:
      "E-YUCCA-002",

    event_name:
      "Yucca Valley Emergence",

    classification:
      "remote_desert_event",

    core_event: {

      location: {
        city: "Yucca Valley",
        state: "CA",
      },

      observability_profile: {
        confidence: 0.71,
        reports: 3,
        clusters: 2,
        duration_minutes: 24,
      },

      semantic_signature: {

        traits: [
          "desert emergence",
          "orbital movement",
          "silent",
          "formation behavior",
        ],

        narratives: [

          "Witnesses observed multiple luminous spheres maneuvering silently across the desert horizon in coordinated patterns.",

          "Objects maintained geometric spacing before abruptly dispersing at high speed.",

          "No aircraft sound or conventional lighting signatures were detected during the event.",
        ],
      },

      infrastructure_context: {

        facilities: [

          {
            name:
              "Twentynine Palms Airspace",

            type:
              "MILITARY AIRSPACE",

            distance:
              "21km",
          },

          {
            name:
              "Joshua Tree Observation Corridor",

            type:
              "VISUAL OBSERVATION REGION",

            distance:
              "8km",
          },
        ],
      },
    },

    topology: {

      topology_state: {

        stability_state:
          "PARTIAL",

        ambiguity_state:
          "MODERATE",

        contradiction_density:
          0.58,

        residual_instability:
          0.44,

        entanglement_score:
          0.63,

        cluster_fragmentation:
          0.39,
      },
    },
  },
];
