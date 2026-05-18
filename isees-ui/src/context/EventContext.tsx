// ============================================================
// src/context/EventContext.tsx
// GLOBAL OPERATIONAL EVENT CONTEXT (V7)
// CANONICAL EVENT HYDRATION ENABLED
// MULTI-EVENT MANIFOLD FOUNDATION ENABLED
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

import {
  adaptCanonicalEvents,
  type CanonicalReplayEvent,
} from "../adapters/canonicalEventAdapter";

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
// CANONICAL REPLAY EVENTS
// ============================================================

const CANONICAL_EVENTS:
  CanonicalReplayEvent[] = [

  // =========================================================
  // MEDFORD
  // =========================================================

  {
    event_id:
      "E-MEDFORD-001",

    event_name:
      "Medford Emergence",

    classification:
      "urban_observability_event",

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

          "Observed a silent luminous object maintaining stationary position before accelerating rapidly westward.",

          "Witnessed a bright object hovering motionless before abruptly changing direction without visible propulsion.",

          "A bright object remained fixed overhead before instantly disappearing without sound or visible transition.",
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

  // =========================================================
  // TIC TAC
  // =========================================================

  {
    event_id:
      "E-TICTAC-2004",

    event_name:
      "Nimitz Tic Tac Encounter",

    classification:
      "multi_sensor_naval_event",

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

  // =========================================================
  // YUCCA
  // =========================================================

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

// ============================================================
// HYDRATED EVENTS
// ============================================================

export const DEMO_EVENTS:
  EventData[] =
    adaptCanonicalEvents(
      CANONICAL_EVENTS
    );

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