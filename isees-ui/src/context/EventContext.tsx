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
  type LiveCluster,
} from "../adapters/canonicalEventAdapter";

import {
  CANONICAL_EVENTS,
} from "../canonical/runtimeCorpus";

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
// P23 WORKSPACE CONTRACT
// ============================================================

export type Workspace = {

  id: string;

  name: string;

  events: EventData[];

  activeSurface:
    InvestigationSurface;
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

activeWorkspace:
  Workspace;

setActiveWorkspace: (
  workspace: Workspace
) => void;

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
  activeWorkspace,
  setActiveWorkspace,
] =
  useState<Workspace>({
    id: "WS-001",

    name:
      "Default Workspace",

    events: [
      DEMO_EVENTS[0]
    ],

    activeSurface:
      "SUMMARY",
  });

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

        activeWorkspace,

        setActiveWorkspace,

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