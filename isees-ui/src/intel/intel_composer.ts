// ============================================================
// intel_composer.ts — RUNTIME INTELLIGENCE ENGINE (STRUCTURED)
// TS STRICT MODE FIXED
// FULL DROP-IN REPLACEMENT
// ============================================================

import { objectRegistry } from "./object_registry";

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildIntel(
  asset: any,
  event: any
) {

  const base =
    objectRegistry[asset.type];

  if (!base) {
    return null;
  }

  return {

    name: asset.name,

    type: base.type,

    // ======================================================
    // STATIC KNOWLEDGE
    // ======================================================

    capabilities:
      base.capabilities,

    limitations:
      base.limitations,

    // ======================================================
    // CONTACT PASSTHROUGH
    // ======================================================

    contact:
      base.contact || {

        role: "Unknown",

        phone: "Unknown",

        freq: "Unknown",
      },

    // ======================================================
    // DYNAMIC LAYERS
    // ======================================================

    environment:
      deriveEnvironment(
        event,
        asset
      ),

    relevance:
      deriveRelevance(
        asset,
        event
      ),

    // ======================================================
    // ACTIONS
    // ======================================================

    actions:
      deriveActions(asset),
  };
}

// ============================================================
// ENVIRONMENT
// ============================================================

function deriveEnvironment(
  event: any,
  asset: any
) {

  return {

    visibility:
      event.visibility ||
      "Unknown",

    weather:
      event.weather ||
      "Unknown",

    impact:
      deriveEnvironmentalImpact(
        asset
      ),
  };
}

function deriveEnvironmentalImpact(
  asset: any
) {

  if (
    asset.type ===
    "ATC_TOWER"
  ) {

    return (
      "Weather may affect visual confirmation"
    );
  }

  if (
    asset.type ===
    "NEXRAD_RADAR"
  ) {

    return (
      "Minimal impact — radar remains operational"
    );
  }

  return "Unknown impact";
}

// ============================================================
// RELEVANCE
// ============================================================

function deriveRelevance(
  asset: any,
  event: any
) {

  const r: string[] = [];

  // ==========================================================
  // ATC
  // ==========================================================

  if (
    asset.type ===
    "ATC_TOWER"
  ) {

    r.push(
      "Primary local airspace authority"
    );

    if (
      event.cluster_size > 1
    ) {

      r.push(
        "Multiple reports — tower validation possible"
      );
    }

    if (
      event.altitude &&
      event.altitude < 10000
    ) {

      r.push(
        "Event likely within controlled airspace"
      );
    }
  }

  // ==========================================================
  // NEXRAD
  // ==========================================================

  if (
    asset.type ===
    "NEXRAD_RADAR"
  ) {

    r.push(
      "Regional radar coverage available"
    );

    if (
      event.reports === 1
    ) {

      r.push(
        "Single report — radar confirmation critical"
      );
    }

    if (
      event.altitude &&
      event.altitude > 10000
    ) {

      r.push(
        "High-altitude detection possible"
      );
    }
  }

  // ==========================================================
  // FALLBACK
  // ==========================================================

  if (r.length === 0) {

    r.push(
      "General observation relevance"
    );
  }

  return r;
}

// ============================================================
// ACTION BUILDER
// ============================================================

function deriveActions(
  asset: any
) {

  // ==========================================================
  // FALLBACK
  // ==========================================================

  const fallback = [

    {
      label:
        "Observe and await additional data",

      type:
        "OBSERVE",

      target:
        null,
    },
  ];

  if (!asset) {
    return fallback;
  }

  // ==========================================================
  // ATC
  // ==========================================================

  switch (asset.type) {

    case "ATC_TOWER":

      return [

        {
          label:
            "Request tower logs",

          type:
            "REQUEST_TOWER_LOGS",

          target:
            "ATC_TOWER",
        },

        {
          label:
            "Check pilot communications",

          type:
            "CHECK_PILOT_COMMS",

          target:
            "ATC_TOWER",
        },

        {
          label:
            "Confirm radar coordination",

          type:
            "CONFIRM_RADAR_CORRELATION",

          target:
            "NEXRAD_RADAR",
        },
      ];

    // ========================================================
    // NEXRAD
    // ========================================================

    case "NEXRAD_RADAR":

      return [

        {
          label:
            "Query radar archive",

          type:
            "RADAR_ARCHIVE_QUERY",

          target:
            "NEXRAD_RADAR",
        },

        {
          label:
            "Check anomalous returns",

          type:
            "RADAR_ANOMALY_SCAN",

          target:
            "NEXRAD_RADAR",
        },

        {
          label:
            "Validate altitude consistency",

          type:
            "RADAR_ALTITUDE_CHECK",

          target:
            "NEXRAD_RADAR",
        },
      ];

    // ========================================================
    // AIRPORT OPS
    // ========================================================

    case "AIRPORT_OPS":

      return [

        {
          label:
            "Check ground activity logs",

          type:
            "GROUND_LOGS",

          target:
            "AIRPORT_OPS",
        },

        {
          label:
            "Coordinate with tower",

          type:
            "COORDINATE_ATC",

          target:
            "ATC_TOWER",
        },

        {
          label:
            "Review incident reports",

          type:
            "INCIDENT_REPORTS",

          target:
            "AIRPORT_OPS",
        },
      ];

    // ========================================================
    // DEFAULT
    // ========================================================

    default:

      return fallback;
  }
}