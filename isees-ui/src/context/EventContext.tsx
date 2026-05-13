// ============================================================
// src/context/EventContext.tsx
// GLOBAL OPERATIONAL EVENT CONTEXT (V6)
// GLOBAL OPERATIONAL NODE COGNITION ENABLED
// NARRATIVE INTELLIGENCE ENABLED
// TS STRICT MODE FIXED
// CLEAN FULL DROP-IN REPLACEMENT
// ============================================================

import {
  createContext,
  useContext,
  useState,
} from "react";

import type {
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
// NARRATIVE INTELLIGENCE
// ============================================================

export type NarrativeData = {
  observer_id: string;
  location: string;
  semantic_match: number;
  time_offset: string;
  confidence: number;
  certainty: string;
  text: string;
  traits: string[];
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

  narratives?: NarrativeData[];

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
  | "NARRATIVES"
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
// GLOBAL OPERATIONAL NODE
// ============================================================

export type OperationalNode = {
  name: string;
  type: string;
};

// ============================================================
// DEMO EVENTS
// ============================================================

export const DEMO_EVENTS: EventData[] = [
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

    reasoning: [

      "Semantic convergence detected across independent observers",

      "Temporal compression indicates synchronized observation window",

      "Spatial manifold overlap exceeds emergence threshold",

      "Infrastructure density sufficient for investigation vectors",
    ],

    narratives: [

      {
        observer_id: "OBS-A1",

        location: "North Medford",

        semantic_match: 0.91,

        time_offset: "00m",

        confidence: 0.87,

        certainty: "HIGH",

        text:
          "Observed a silent luminous object maintaining stationary position before accelerating rapidly westward.",

        traits: [
          "silent",
          "stationary",
          "rapid acceleration",
          "luminous",
        ],
      },

      {
        observer_id: "OBS-B2",

        location: "Central Medford",

        semantic_match: 0.84,

        time_offset: "+02m",

        confidence: 0.81,

        certainty: "MEDIUM",

        text:
          "Witnessed a bright object hovering motionless before abruptly changing direction without visible propulsion.",

        traits: [
          "hovering",
          "silent",
          "directional shift",
          "bright object",
        ],
      },

      {
        observer_id: "OBS-C7",

        location: "East Medford",

        semantic_match: 0.79,

        time_offset: "+03m",

        confidence: 0.78,

        certainty: "MEDIUM",

        text:
          "A bright object remained fixed overhead before instantly disappearing without sound or visible transition.",

        traits: [
          "instant disappearance",
          "silent",
          "stationary",
          "bright object",
        ],
      },
    ],

    topology: {

      stability_state: "FRAGMENTED",

      ambiguity_state: "HIGH",

      contradiction_density: 1.0,

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

    observations: [

      {
        id: "OBS-1001",

        time: "21:04 UTC",

        location: "North Medford",

        summary:
          "Stationary luminous object with rapid directional shift",
      },
    ],

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
];

// ============================================================
// CONTEXT TYPE
// ============================================================

type EventContextType = {

  events: EventData[];

  activeEvent:
    EventData | null;

  setActiveEvent: (
    event: EventData
  ) => void;

  activeSurface:
    InvestigationSurface;

  setActiveSurface: (
    surface: InvestigationSurface
  ) => void;

  selectedOperationalNode:
    OperationalNode | null;

  setSelectedOperationalNode: (
    node: OperationalNode | null
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

  const [
    selectedOperationalNode,
    setSelectedOperationalNode,
  ] =
    useState<OperationalNode | null>(
      null
    );

  return (

    <EventContext.Provider
      value={{

        events,

        activeEvent,

        setActiveEvent,

        activeSurface,

        setActiveSurface,

        selectedOperationalNode,

        setSelectedOperationalNode,
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