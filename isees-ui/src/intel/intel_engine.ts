// ============================================================
// intel_engine.ts — CONTEXT-AWARE INTEL BUILDER (V2)
// CANONICAL NODE RESOLUTION + CONTEXTUAL INTELLIGENCE
// FULL DROP-IN REPLACEMENT
// ============================================================

import { objectRegistry } from "./object_registry";

// ============================================================
// NODE RESOLUTION
// ============================================================

function resolveObjectKey(
  objectName: string
): string | null {
  const lower =
    objectName.toLowerCase();

  // ----------------------------------------------------------
  // ATC
  // ----------------------------------------------------------

  if (
    lower.includes("tower")
  ) {
    return "ATC_TOWER";
  }

  // ----------------------------------------------------------
  // RADAR
  // ----------------------------------------------------------

  if (
    lower.includes("radar") ||
    lower.includes("nexrad")
  ) {
    return "NEXRAD_RADAR";
  }

  // ----------------------------------------------------------
  // AIRPORT OPS
  // ----------------------------------------------------------

  if (
    lower.includes("airport")
  ) {
    return "AIRPORT_OPS";
  }

  // ----------------------------------------------------------
  // NAVAL / MILITARY
  // ----------------------------------------------------------

  if (
    lower.includes("naval") ||
    lower.includes("military")
  ) {
    return "MILITARY_SENSOR";
  }

  // ----------------------------------------------------------
  // FAA FALLBACK
  // ----------------------------------------------------------

  return "FAA_RADAR";
}

// ============================================================
// CONTEXTUAL INTELLIGENCE BUILDER
// ============================================================

export function buildContextualIntel(
  objectName: string,
  eventType: string,
  clusterSize: number
) {
  // ----------------------------------------------------------
  // RESOLVE NODE
  // ----------------------------------------------------------

  const resolvedKey =
    resolveObjectKey(
      objectName
    );

  if (!resolvedKey) {
    return null;
  }

  // ----------------------------------------------------------
  // LOOKUP REGISTRY
  // ----------------------------------------------------------

  const base =
    objectRegistry[
      resolvedKey
    ];

  if (!base) {
    return null;
  }

  // ==========================================================
  // CONTEXT VARIABLES
  // ==========================================================

  let role =
    "General operational support node";

  let confidence =
    "MEDIUM";

  let priority =
    "NORMAL";

  let relevance =
    "Contextual infrastructure relevance";

  let whyMatters =
    "Provides supporting observational pathways";

  // ==========================================================
  // EVENT CONTEXT LOGIC
  // ==========================================================

  switch (eventType) {
    // --------------------------------------------------------
    // HIGH
    // --------------------------------------------------------

    case "HIGH":
      role =
        "Critical infrastructure intelligence node";

      confidence =
        clusterSize >= 2
          ? "HIGH — multi-observer convergence"
          : "MEDIUM — isolated high-priority event";

      priority =
        "CRITICAL";

      relevance =
        "Node likely relevant to emergence persistence";

      whyMatters =
        "High escalation events require infrastructure correlation";

      break;

    // --------------------------------------------------------
    // TRACKING
    // --------------------------------------------------------

    case "TRACKING":
      role =
        "Active monitoring and validation node";

      confidence =
        clusterSize >= 2
          ? "MEDIUM — converging observations"
          : "LOW — limited convergence";

      priority =
        "HIGH";

      relevance =
        "Node may assist with persistence analysis";

      whyMatters =
        "Tracking events benefit from sensor correlation";

      break;

    // --------------------------------------------------------
    // LOW
    // --------------------------------------------------------

    case "LOW":
      role =
        "Secondary observation support node";

      confidence =
        "LOW — insufficient corroboration";

      priority =
        "NORMAL";

      relevance =
        "Limited operational significance";

      whyMatters =
        "Low escalation event";

      break;

    // --------------------------------------------------------
    // DEFAULT
    // --------------------------------------------------------

    default:
      role =
        "General operational intelligence node";

      confidence =
        "MEDIUM";

      priority =
        "NORMAL";

      relevance =
        "Context-dependent";

      whyMatters =
        "Potential infrastructure relevance";

      break;
  }

  // ==========================================================
  // OUTPUT
  // ==========================================================

  return {
    // --------------------------------------------------------
    // RESOLUTION
    // --------------------------------------------------------

    name: objectName,

    resolved_key:
      resolvedKey,

    type: base.type,

    category:
      base.category,

    role,

    confidence,

    priority,

    relevance,

    whyMatters,

    // --------------------------------------------------------
    // INTELLIGENCE
    // --------------------------------------------------------

    capabilities:
      base.capabilities,

    limitations:
      base.limitations,

    observation_vectors:
      base.observation_vectors,

    contradiction_vectors:
      base.contradiction_vectors,

    collapse_failure_modes:
      base.collapse_failure_modes,

    geo_constraints:
      base.geo_constraints,

    recommended_actions:
      base.recommended_actions,

    operational_notes:
      base.operational_notes,

    confidence_weight:
      base.confidence_weight,

    // --------------------------------------------------------
    // QUICK ACTIONS
    // --------------------------------------------------------

    actions:
      base.recommended_actions?.slice(
        0,
        3
      ) || [],
  };
}