// ============================================================
// src/intel/surfaceResolver.ts
// CANONICAL SURFACE INTELLIGENCE RESOLVER (V1)
// SINGLE SOURCE OF SURFACE COGNITION TRUTH
// FULL DROP-IN FILE
// ============================================================

import type {

  EventData,

  InvestigationSurface,

  OperationalNode,

} from "../context/EventContext";

// ============================================================
// TYPES
// ============================================================

export type SurfaceStateType =
  | "ACTIVE"
  | "SPARSE"
  | "DORMANT"
  | "UNRESOLVED"
  | "DEGRADED"
  | "COLLAPSED"
  | "DISCONNECTED"
  | "LOCKED"
  | "REPLAY_ONLY";

// ============================================================
// GLYPH
// ============================================================

export type SurfaceGlyph =
  | "OVERLAP"
  | "ENTANGLEMENT"
  | "RESIDUAL"
  | "CONTRADICTIONS"
  | "HOTSPOT"
  | "NONE";

// ============================================================
// SURFACE INTELLIGENCE STATE
// ============================================================

export interface SurfaceIntelligenceState {

  surface:
    InvestigationSurface;

  label:
    string;

  title:
    string;

  interpretation:
    string;

  state:
    SurfaceStateType;

  density:
    string;

  topology:
    string;

  pressure:
    string;

  integrity:
    string;

  glyph:
    SurfaceGlyph;

  severity:
    "LOW"
    | "MODERATE"
    | "HIGH"
    | "SEVERE";

  reasoning:
    string[];

  operationalContext:
    string[];

  topologyMetrics: {

    contradiction:
      number;

    residual:
      number;

    entanglement:
      number;

    fragmentation:
      number;
  };

  focusedNode:
    OperationalNode | null;
}

// ============================================================
// RESOLVER
// ============================================================

export function resolveSurfaceState(

  event: EventData,

  surface: InvestigationSurface,

  selectedNode:
    OperationalNode | null

): SurfaceIntelligenceState {

  const topology =
    event.topology;

  // ==========================================================
  // COMMON METRICS
  // ==========================================================

  const contradiction =
    topology.contradiction_density;

  const residual =
    topology.residual_instability;

  const entanglement =
    topology.entanglement_score;

  const fragmentation =
    topology.cluster_fragmentation;

  // ==========================================================
  // SUMMARY
  // ==========================================================

  if (surface === "SUMMARY") {

    return {

      surface,

      label:
        "Operational Intelligence",

      title:
        "Summary Surface",

      interpretation:
        "Global manifold interpretation layer",

      state:
        "ACTIVE",

      density:
        "HIGH",

      topology:
        topology.stability_state,

      pressure:
        topology.ambiguity_state,

      integrity:
        "VERIFIED",

      glyph:
        "NONE",

      severity:
        "MODERATE",

      reasoning: [

        "Global topology reasoning active.",

        "Observability normalization synchronized.",

        "Manifold reconstruction remains coherent.",
      ],

      operationalContext: [

        "Surface acting as primary operational cognition layer.",

        "Topology stabilization currently active.",
      ],

      topologyMetrics: {

        contradiction,

        residual,

        entanglement,

        fragmentation,
      },

      focusedNode:
        selectedNode,
    };
  }

  // ==========================================================
  // NARRATIVES
  // ==========================================================

  if (surface === "NARRATIVES") {

    return {

      surface,

      label:
        "Narrative Intelligence",

      title:
        "Narrative Surface",

      interpretation:
        "Semantic observer convergence analysis",

      state:
        "ACTIVE",

      density:
        "MODERATE",

      topology:
        "SEMANTICALLY COHERENT",

      pressure:
        "RISING",

      integrity:
        "VERIFIED",

      glyph:
        "NONE",

      severity:
        "MODERATE",

      reasoning: [

        "Narrative convergence currently active.",

        "Observer semantic structures synchronized.",

        "Narrative propagation stabilized.",
      ],

      operationalContext: [

        "Observer testimony alignment under analysis.",

        "Semantic coherence pressure elevated.",
      ],

      topologyMetrics: {

        contradiction,

        residual,

        entanglement,

        fragmentation,
      },

      focusedNode:
        selectedNode,
    };
  }

  // ==========================================================
  // OVERLAP
  // ==========================================================

  if (surface === "OVERLAP") {

    return {

      surface,

      label:
        "Overlap Intelligence",

      title:
        "Overlap Surface",

      interpretation:
        "Spatial convergence manifold",

      state:
        event.topology_observability
          .overlap_regions.length > 0
            ? "ACTIVE"
            : "SPARSE",

      density:
        event.topology_observability
          .overlap_regions.length > 0
            ? "HIGH"
            : "LOW",

      topology:
        "SPATIALLY CONVERGENT",

      pressure:
        "MODERATE",

      integrity:
        "VERIFIED",

      glyph:
        "OVERLAP",

      severity:
        "MODERATE",

      reasoning: [

        "Observer geometry overlap evaluated.",

        "Convergence manifold stabilized.",

        "Shared observational structures detected.",
      ],

      operationalContext: [

        "Spatial overlap regions under active analysis.",

        "Observer synchronization pressure present.",
      ],

      topologyMetrics: {

        contradiction,

        residual,

        entanglement,

        fragmentation,
      },

      focusedNode:
        selectedNode,
    };
  }

  // ==========================================================
  // ENTANGLEMENT
  // ==========================================================

  if (surface === "ENTANGLEMENT") {

    return {

      surface,

      label:
        "Entanglement Intelligence",

      title:
        "Entanglement Surface",

      interpretation:
        "Cross-domain topology coupling",

      state:
        "ACTIVE",

      density:
        "HIGH",

      topology:
        "COUPLED",

      pressure:
        "ELEVATED",

      integrity:
        "VERIFIED",

      glyph:
        "ENTANGLEMENT",

      severity:
        entanglement > 0.8
          ? "HIGH"
          : "MODERATE",

      reasoning: [

        "Cross-domain entanglement active.",

        "Observer coupling remains elevated.",

        "Topology synchronization pressure detected.",
      ],

      operationalContext: [

        "Cross-sensor correlation layer active.",

        "Coupled topology structures propagating.",
      ],

      topologyMetrics: {

        contradiction,

        residual,

        entanglement,

        fragmentation,
      },

      focusedNode:
        selectedNode,
    };
  }

  // ==========================================================
  // RESIDUAL
  // ==========================================================

  if (surface === "RESIDUAL") {

    return {

      surface,

      label:
        "Residual Intelligence",

      title:
        "Residual Surface",

      interpretation:
        "Unresolved anomaly propagation",

      state:
        residual > 0.65
          ? "UNRESOLVED"
          : "ACTIVE",

      density:
        "MODERATE",

      topology:
        "PROPAGATING",

      pressure:
        "UNRESOLVED",

      integrity:
        "PARTIAL",

      glyph:
        "RESIDUAL",

      severity:
        residual > 0.7
          ? "HIGH"
          : "MODERATE",

      reasoning: [

        "Residual topology instability persists.",

        "Unresolved emergence vectors remain active.",

        "Anomaly propagation continuing.",
      ],

      operationalContext: [

        "Residual instability exceeds nominal baseline.",

        "Reconstruction confidence partially degraded.",
      ],

      topologyMetrics: {

        contradiction,

        residual,

        entanglement,

        fragmentation,
      },

      focusedNode:
        selectedNode,
    };
  }

  // ==========================================================
  // CLUSTERS
  // ==========================================================

  if (surface === "CLUSTERS") {

    return {

      surface,

      label:
        "Cluster Intelligence",

      title:
        "Cluster Surface",

      interpretation:
        "Collapse basin fragmentation analysis",

      state:
        "ACTIVE",

      density:
        "HIGH",

      topology:
        "FRAGMENTED",

      pressure:
        "MODERATE",

      integrity:
        "VERIFIED",

      glyph:
        "NONE",

      severity:
        fragmentation > 0.5
          ? "HIGH"
          : "MODERATE",

      reasoning: [

        "Cluster fragmentation detected.",

        "Independent collapse basins active.",

        "Topology segmentation under evaluation.",
      ],

      operationalContext: [

        "Cluster divergence currently propagating.",

        "Manifold segmentation analysis active.",
      ],

      topologyMetrics: {

        contradiction,

        residual,

        entanglement,

        fragmentation,
      },

      focusedNode:
        selectedNode,
    };
  }

  // ==========================================================
  // COLLAPSE
  // ==========================================================

  if (surface === "COLLAPSE") {

    return {

      surface,

      label:
        "Collapse Intelligence",

      title:
        "Collapse Surface",

      interpretation:
        "Topology failure-state analysis",

      state:
        contradiction > 0.9
          ? "COLLAPSED"
          : "DEGRADED",

      density:
        "HIGH",

      topology:
        "COLLAPSING",

      pressure:
        "SEVERE",

      integrity:
        "UNSTABLE",

      glyph:
        "NONE",

      severity:
        "SEVERE",

      reasoning: [

        "Topology collapse conditions active.",

        "Sensor coherence degradation detected.",

        "Collapse basin propagation underway.",
      ],

      operationalContext: [

        "Observability collapse vectors present.",

        "Topology stabilization compromised.",
      ],

      topologyMetrics: {

        contradiction,

        residual,

        entanglement,

        fragmentation,
      },

      focusedNode:
        selectedNode,
    };
  }

  // ==========================================================
  // CANDIDATES
  // ==========================================================

  if (surface === "CANDIDATES") {

    return {

      surface,

      label:
        "Candidate Intelligence",

      title:
        "Candidate Surface",

      interpretation:
        "Object alignment and deconfliction",

      state:
        "ACTIVE",

      density:
        "MODERATE",

      topology:
        "EVALUATING",

      pressure:
        "RISING",

      integrity:
        "VERIFIED",

      glyph:
        "NONE",

      severity:
        "MODERATE",

      reasoning: [

        "Candidate deconfliction active.",

        "Known object elimination underway.",

        "Alignment topology propagating.",
      ],

      operationalContext: [

        "Candidate object analysis active.",

        "Operational filtering structures synchronized.",
      ],

      topologyMetrics: {

        contradiction,

        residual,

        entanglement,

        fragmentation,
      },

      focusedNode:
        selectedNode,
    };
  }

  // ==========================================================
  // CONTRADICTIONS
  // ==========================================================

  return {

    surface,

    label:
      surface === "HOTSPOT"
        ? "Hotspot Intelligence"
        : surface === "GEO"
        ? "Geo Intelligence"
        : "Contradiction Intelligence",

    title:
      surface === "HOTSPOT"
        ? "Hotspot Surface"
        : surface === "GEO"
        ? "Geospatial Surface"
        : "Contradiction Surface",

    interpretation:
      surface === "HOTSPOT"
        ? "Historical recurrence topology"
        : surface === "GEO"
        ? "Terrain-aware observability"
        : "Conflict topology analysis",

    state:
      "ACTIVE",

    density:
      "HIGH",

    topology:
      surface === "HOTSPOT"
        ? "RECURSIVE"
        : surface === "GEO"
        ? "TERRAIN-BOUND"
        : "CONFLICTED",

    pressure:
      surface === "GEO"
        ? "STABLE"
        : "ELEVATED",

    integrity:
      surface === "GEO"
        ? "VERIFIED"
        : "UNSTABLE",

    glyph:
      surface === "HOTSPOT"
        ? "HOTSPOT"
        : surface === "GEO"
        ? "NONE"
        : "CONTRADICTIONS",

    severity:
      surface === "GEO"
        ? "LOW"
        : "HIGH",

    reasoning:

      surface === "HOTSPOT"

        ? [

            "Historical recurrence structures active.",

            "Persistent emergence geometry synchronized.",

            "Hotspot memory propagation underway.",
          ]

        : surface === "GEO"

        ? [

            "Terrain-aware topology active.",

            "Infrastructure geometry synchronized.",

            "Observability normalization applied.",
          ]

        : [

            "Contradiction density elevated.",

            "Sensor disagreement unresolved.",

            "Topology conflict vectors active.",
          ],

    operationalContext:

      surface === "HOTSPOT"

        ? [

            "Hotspot intelligence recursion active.",

            "Regional memory synchronization underway.",
          ]

        : surface === "GEO"

        ? [

            "Geo infrastructure context stabilized.",

            "Terrain masking actively modeled.",
          ]

        : [

            "Conflict topology under investigation.",

            "Observational divergence remains unresolved.",
          ],

    topologyMetrics: {

      contradiction,

      residual,

      entanglement,

      fragmentation,
    },

    focusedNode:
      selectedNode,
  };
}