// ============================================================
// src/context/EventContext.tsx
// GLOBAL OPERATIONAL EVENT CONTEXT (V4)
// TOPOLOGY OBSERVABILITY ENABLED
// FULL DROP-IN REPLACEMENT
// ============================================================

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

// ============================================================
// TYPES
// ============================================================

export type Observation = {
  id: string;
  time: string;
  location: string;
  summary: string;
};

export type Facility = {
  name: string;
  type: string;
  distance: string;
};

// ============================================================
// TOPOLOGY STATE
// ============================================================

export type TopologyState = {

  stability_state: string;

  ambiguity_state: string;

  contradiction_density: number;

  residual_instability: number;

  entanglement_score: number;

  cluster_fragmentation: number;
};

// ============================================================
// TOPOLOGY OBSERVABILITY
// ============================================================

export type OverlapRegion = {

  overlap_score: number;

  contributing_candidates: string[];

  shared_features: string[];
};

export type EntanglementData = {

  global_entanglement_score: number;

  high_entanglement_domains: string[][];
};

export type ResidualVectorData = {

  global_residual_instability: number;

  high_instability_domains: string[];
};

export type CollapseClusterData = {

  cluster_fragmentation: number;

  cluster_types: string[];
};

export type TopologyObservability = {

  overlap_regions: OverlapRegion[];

  entanglements: EntanglementData;

  residual_vectors: ResidualVectorData;

  collapse_clusters: CollapseClusterData;
};

// ============================================================
// EVENT DATA
// ============================================================

export type EventData = {

  id: string;

  location: string;

  confidence: number;

  reports: number;

  clusters: number;

  duration: string;

  escalation: string;

  recurrence: string;

  trend: string;

  active: boolean;

  reasoning: string[];

  observations: Observation[];

  facilities: Facility[];

  topology: TopologyState;

  topology_observability:
    TopologyObservability;
};

// ============================================================
// INVESTIGATION SURFACES
// ============================================================

export type InvestigationSurface =
  | "SUMMARY"
  | "OVERLAP"
  | "ENTANGLEMENT"
  | "RESIDUAL"
  | "CLUSTERS"
  | "COLLAPSE"
  | "CANDIDATES"
  | "CONTRADICTIONS"
  | "HOTSPOT"
  | "GEO";

// ============================================================
// DEMO EVENTS
// ============================================================

export const DEMO_EVENTS: EventData[] = [

  // ========================================================
  // MEDFORD EVENT
  // ========================================================

  {
    id: "E-MEDFORD-001",

    location: "Medford, OR",

    confidence: 0.82,

    reports: 4,

    clusters: 2,

    duration: "36m",

    escalation: "TRACKING",

    recurrence: "LOW",

    trend: "STABLE",

    active: true,

    // ------------------------------------------------------
    // REASONING
    // ------------------------------------------------------

    reasoning: [

      "Semantic convergence detected across independent observers",

      "Temporal compression indicates synchronized observation window",

      "Spatial manifold overlap exceeds emergence threshold",

      "Infrastructure density sufficient for investigation vectors",
    ],

    // ------------------------------------------------------
    // TOPOLOGY
    // ------------------------------------------------------

    topology: {

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
        0.50,
    },

    // ------------------------------------------------------
    // TOPOLOGY OBSERVABILITY
    // ------------------------------------------------------

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

        global_entanglement_score:
          0.75,

        high_entanglement_domains: [

          ["aviation", "weather"],
        ],
      },

      residual_vectors: {

        global_residual_instability:
          0.716,

        high_instability_domains: [
          "weather",
          "aviation",
        ],
      },

      collapse_clusters: {

        cluster_fragmentation:
          0.5,

        cluster_types: [
          "aviation",
          "weather",
        ],
      },
    },

    // ------------------------------------------------------
    // OBSERVATIONS
    // ------------------------------------------------------

    observations: [

      {
        id: "OBS-1001",

        time: "21:04 UTC",

        location: "North Medford",

        summary:
          "Stationary luminous object with rapid directional shift",
      },

      {
        id: "OBS-1002",

        time: "21:08 UTC",

        location: "Central Point",

        summary:
          "Triangular formation observed moving silently",
      },

      {
        id: "OBS-1003",

        time: "21:12 UTC",

        location: "Jacksonville",

        summary:
          "Bright object accelerating beyond visible range",
      },

      {
        id: "OBS-1004",

        time: "21:16 UTC",

        location: "East Medford",

        summary:
          "Repeated hovering behavior with intermittent luminosity",
      },
    ],

    // ------------------------------------------------------
    // FACILITIES
    // ------------------------------------------------------

    facilities: [

      {
        name: "Medford ATC Tower",

        type: "ATC",

        distance: "4.1km",
      },

      {
        name: "Rogue Valley Intl Airport",

        type: "AIRPORT OPS",

        distance: "5.2km",
      },

      {
        name: "KMAX NEXRAD",

        type: "RADAR",

        distance: "41km",
      },
    ],
  },

  // ========================================================
  // PACIFIC EVENT
  // ========================================================

  {
    id: "E-PACIFIC-004",

    location: "Pacific Sector",

    confidence: 0.91,

    reports: 7,

    clusters: 1,

    duration: "42m",

    escalation: "HIGH",

    recurrence: "SIGNATURE DETECTED",

    trend: "STABLE",

    active: true,

    // ------------------------------------------------------
    // REASONING
    // ------------------------------------------------------

    reasoning: [

      "Multi-observer semantic resonance detected",

      "Behavioral convergence suggests persistent object continuity",

      "Geo-spatial density stabilized rapidly",

      "Historical recurrence similarity identified",
    ],

    // ------------------------------------------------------
    // TOPOLOGY
    // ------------------------------------------------------

    topology: {

      stability_state:
        "UNSTABLE",

      ambiguity_state:
        "MODERATE",

      contradiction_density:
        0.62,

      residual_instability:
        0.48,

      entanglement_score:
        0.44,

      cluster_fragmentation:
        0.21,
    },

    // ------------------------------------------------------
    // TOPOLOGY OBSERVABILITY
    // ------------------------------------------------------

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

        global_entanglement_score:
          0.44,

        high_entanglement_domains: [

          ["naval", "radar"],
        ],
      },

      residual_vectors: {

        global_residual_instability:
          0.48,

        high_instability_domains: [
          "radar",
        ],
      },

      collapse_clusters: {

        cluster_fragmentation:
          0.21,

        cluster_types: [
          "naval",
          "radar",
        ],
      },
    },

    // ------------------------------------------------------
    // OBSERVATIONS
    // ------------------------------------------------------

    observations: [

      {
        id: "OBS-2001",

        time: "04:11 UTC",

        location: "Pacific Corridor",

        summary:
          "Fast-moving luminous object with abrupt stop",
      },

      {
        id: "OBS-2002",

        time: "04:14 UTC",

        location: "Marine Observation Zone",

        summary:
          "Object observed accelerating without visible propulsion",
      },
    ],

    // ------------------------------------------------------
    // FACILITIES
    // ------------------------------------------------------

    facilities: [

      {
        name: "Pacific Radar Grid",

        type: "RADAR",

        distance: "12km",
      },

      {
        name: "Naval Monitoring Node",

        type: "MIL OPS",

        distance: "18km",
      },
    ],
  },
];

// ============================================================
// CONTEXT TYPE
// ============================================================

type EventContextType = {

  events: EventData[];

  activeEvent: EventData | null;

  setActiveEvent: (
    event: EventData
  ) => void;

  activeSurface:
    InvestigationSurface;

  setActiveSurface: (
    surface: InvestigationSurface
  ) => void;
};

// ============================================================
// CONTEXT
// ============================================================

const EventContext =
  createContext<
    EventContextType | undefined
  >(undefined);

// ============================================================
// PROVIDER
// ============================================================

export function EventProvider({
  children,
}: {
  children: ReactNode;
}) {

  const [events] =
    useState<EventData[]>(
      DEMO_EVENTS
    );

  const [
    activeEvent,
    setActiveEvent,
  ] =
    useState<EventData | null>(
      DEMO_EVENTS[0]
    );

  const [
    activeSurface,
    setActiveSurface,
  ] =
    useState<InvestigationSurface>(
      "SUMMARY"
    );

  return (

    <EventContext.Provider
      value={{

        events,

        activeEvent,

        setActiveEvent,

        activeSurface,

        setActiveSurface,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================

export function useEventContext() {

  const context =
    useContext(EventContext);

  if (!context) {

    throw new Error(
      "useEventContext must be used inside EventProvider"
    );
  }

  return context;
}