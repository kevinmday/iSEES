// ============================================================
// ROOSEVELT TRAINING RANGE ENCOUNTERS
// CANONICAL EVENT
// FULLY HYDRATED REPLAY ARTIFACT
// ============================================================

import type {
CanonicalReplayEvent,
} from "../adapters/canonicalEventAdapter";

export const ROOSEVELT_2015:
CanonicalReplayEvent = {

event_id:
"E-ROOSEVELT-2015",

event_name:
"Roosevelt Training Range Encounters",

classification:
"multi_sensor_naval_event",

// ----------------------------------------------------------
// OPERATIONAL INTELLIGENCE
// ----------------------------------------------------------

operational_intelligence: {


recommended_actions: [

  "Review airborne sensor recordings",

  "Correlate pilot observations across reporting periods",

  "Assess recurring object behavior patterns",

  "Compare signatures against Nimitz event topology",
],

investigation_vectors: [

  "Persistent training-range incursions",

  "Formation behavior analysis",

  "Multi-sensor correlation",

  "Cross-event manifold comparison",
],

domain_inference: [

  "NAVAL",

  "MULTI-SENSOR",

  "TRAINING RANGE",
],


},

// ----------------------------------------------------------
// CORE EVENT
// ----------------------------------------------------------

core_event: {


location: {

  city:
    "Atlantic Ocean",

  state:
    "Virginia Training Areas",

  lat:
    36.0,

  lon:
    -74.0,
},

observability_profile: {

  confidence:
    0.93,

  reports:
    5,

  clusters:
    1,

  duration_minutes:
    1095,
},

semantic_signature: {

  traits: [

    "cube-inside-sphere",

    "persistent-incursion",

    "formation-behavior",

    "near-collision",

    "multi-sensor",

    "training-range-presence",

    "daily-contact",
  ],

  narratives: [

    "Naval aviators reported repeated encounters with unidentified objects operating within restricted training ranges over an extended period despite ongoing flight operations.",

    "One aircraft nearly collided with an object described as a dark cube suspended within a transparent spherical enclosure while conducting routine training maneuvers.",

    "Advanced airborne radar systems repeatedly detected unknown contacts demonstrating persistent presence and unusual flight characteristics across multiple sorties.",

    "Witnesses reported formations of objects maintaining position against prevailing winds and exhibiting flight behavior inconsistent with conventional aircraft performance.",

    "Recurring observations across crews, sensors, and training cycles suggested a sustained operational pattern rather than an isolated event.",
  ],
},

infrastructure_context: {

  facilities: [

    {
      name:
        "USS Theodore Roosevelt Carrier Group",

      type:
        "NAVAL STRIKE GROUP",

      distance:
        "0km",
    },

    {
      name:
        "AN/APG-79 AESA Radar",

      type:
        "AIRBORNE SENSOR",

      distance:
        "1km",
    },

    {
      name:
        "ATFLIR Sensor Systems",

      type:
        "TARGETING POD",

      distance:
        "1km",
    },

    {
      name:
        "East Coast Training Range",

      type:
        "MILITARY AIRSPACE",

      distance:
        "0km",
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
    0.18,
},

topology_state: {

  stability_state:
    "UNSTABLE",

  ambiguity_state:
    "MODERATE",

  contradiction_density:
    0.18,

  residual_instability:
    0.82,

  entanglement_score:
    0.91,

  cluster_fragmentation:
    0.08,
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
