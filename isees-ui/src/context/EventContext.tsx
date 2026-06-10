// ============================================================
// src/context/EventContext.tsx
// GLOBAL OPERATIONAL EVENT CONTEXT (V10)
// OPERATOR MODE FOUNDATION INTEGRATED
// LIVE EVENT PRIORITY + OP INTEL RESET FIX
// FULL DROP-IN REPLACEMENT
// ============================================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  adaptCanonicalEvents,
  adaptLiveCluster,
  type CanonicalReplayEvent,
  type LiveCluster,
} from "../adapters/canonicalEventAdapter";

import {
  setTopology,
} from "../state/epistemic/topologyStore";


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

export type NarrativeData = {
observer_id: string;
location: string;
semantic_match: number;
time_offset: string;
confidence: number;
certainty: string;
text: string;
traits: string[];

raw_field_note?: string;

normalized_observation?: string[];

semantic_pressure?: string;

certainty_markers?: number;

hesitation_markers?: number;

perceptual_stability?: string;

physics_conflict?: string;

entanglement_links?: string[];
};

export type TopologyState = {
stability_state: string;
ambiguity_state: string;
contradiction_density: number;
residual_instability: number;
entanglement_score: number;
cluster_fragmentation: number;
};

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
// P22 EVENT COGNITION CONTRACTS
// ============================================================

export type AssessmentCard = {

confidence: string;

topology_state: string;

primary_hypothesis: string;

primary_contradiction: string;

next_best_action: string;
};

export type OperationalIntelligence = {

// ----------------------------------------------------------
// P22 EVENT ASSESSMENT
// ----------------------------------------------------------

assessment?: AssessmentCard;

// ----------------------------------------------------------
// EXISTING CONTRACTS
// PRESERVED FOR COMPATIBILITY
// ----------------------------------------------------------

recommended_actions?: string[];

investigation_vectors?: string[];

domain_inference?: string[];
};

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

operational_intelligence?:
OperationalIntelligence;

topology: TopologyState;

topology_observability:
TopologyObservability;
};

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

export type OperationalNode = {
name: string;
type: string;
};

// ============================================================
// OPERATOR MODES
// ============================================================

export type OperatorMode =
| "REPLAY"
| "LIVE"
| "TRAINING"
| "VALIDATION"
| "ENTANGLEMENT";

// ============================================================
// CANONICAL REPLAY EVENTS
// ============================================================

const CANONICAL_EVENTS:
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

// ============================================================
// DEMO EVENTS
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

  operatorMode:
    OperatorMode;

  setOperatorMode: (
    mode: OperatorMode
  ) => void;

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

  const [
    operatorMode,
    setOperatorMode,
  ] =
    useState<OperatorMode>(
      "REPLAY"
    );

  const [
    events,
    setEvents,
  ] =
    useState<EventData[]>(
      DEMO_EVENTS
    );

  const [
    activeEvent,
    internalSetActiveEvent,
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

  // =========================================================
  // ACTIVE EVENT WRAPPER
  // =========================================================

  function setActiveEvent(
    event: EventData
  ) {

    internalSetActiveEvent(
      event
    );

    setTopology(
      event.topology
    );

    // --------------------------------------------
    // RESET STALE OPERATIONAL INTEL
    // --------------------------------------------

    setSelectedOperationalNode(
      null
    );
  }

  // =========================================================
  // LIVE CLUSTER HYDRATION
  // =========================================================

  useEffect(() => {

    async function hydrateLiveEvents() {

      try {

        const response =
          await fetch(
            "http://localhost:8001/clusters"
          );

        const liveClusters:
          LiveCluster[] =
            await response.json();

        if (
          !Array.isArray(
            liveClusters
          )
        ) {
          return;
        }

        const liveEvents =
          liveClusters.map(
            adaptLiveCluster
          );

        // ----------------------------------------
        // LIVE EVENTS OVERRIDE DEMO EVENTS
        // ----------------------------------------

        if (
          liveEvents.length > 0
        ) {

          setOperatorMode(
            "LIVE"
          );

          setEvents(
            liveEvents
          );

          internalSetActiveEvent(
            liveEvents[0]
          );

          setSelectedOperationalNode(
            null
          );

        } else {

          setOperatorMode(
            "REPLAY"
          );

          setEvents(
            DEMO_EVENTS
          );

          internalSetActiveEvent(
            DEMO_EVENTS[0]
          );
        }

      } catch (err) {

        console.error(
          "LIVE HYDRATION FAILED",
          err
        );

        setOperatorMode(
          "REPLAY"
        );

        setEvents(
          DEMO_EVENTS
        );

        internalSetActiveEvent(
          DEMO_EVENTS[0]
        );
      }
    }

    hydrateLiveEvents();

  }, []);

  return (

    <EventContext.Provider
      value={{

        operatorMode,

        setOperatorMode,

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