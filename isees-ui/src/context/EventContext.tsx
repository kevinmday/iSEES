// ============================================================
// src/context/EventContext.tsx
// GLOBAL OPERATIONAL EVENT CONTEXT (V2)
// ACTIVE EVENT + INVESTIGATION SURFACE STATE
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
};

// ============================================================
// INVESTIGATION SURFACES
// ============================================================

export type InvestigationSurface =
  | "SUMMARY"
  | "COLLAPSE"
  | "CANDIDATES"
  | "CONTRADICTIONS"
  | "HOTSPOT"
  | "GEO";

// ============================================================
// DEMO EVENT SET
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

    reasoning: [
      "Multi-observer semantic resonance detected",
      "Behavioral convergence suggests persistent object continuity",
      "Geo-spatial density stabilized rapidly",
      "Historical recurrence similarity identified",
    ],

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

  setActiveEvent: (event: EventData) => void;

  activeSurface: InvestigationSurface;

  setActiveSurface: (
    surface: InvestigationSurface
  ) => void;
};

// ============================================================
// CONTEXT
// ============================================================

const EventContext =
  createContext<EventContextType | undefined>(
    undefined
  );

// ============================================================
// PROVIDER
// ============================================================

export function EventProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [events] =
    useState<EventData[]>(DEMO_EVENTS);

  const [activeEvent, setActiveEvent] =
    useState<EventData | null>(DEMO_EVENTS[0]);

  const [activeSurface, setActiveSurface] =
    useState<InvestigationSurface>("SUMMARY");

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
  const context = useContext(EventContext);

  if (!context) {
    throw new Error(
      "useEventContext must be used inside EventProvider"
    );
  }

  return context;
}