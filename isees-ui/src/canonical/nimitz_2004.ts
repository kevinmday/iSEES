// ============================================================
// NIMITZ TIC TAC 2004
// CANONICAL EVENT
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
};