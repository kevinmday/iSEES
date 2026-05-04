// ============================================================
// synthetic_event_feed.ts
// DEV MODE — SYNTHETIC EVENT ENGINE
// ============================================================

export type EventState = {
  t: number;
  reports: number;
  confidence: number;
  cluster_size: number;
  sources: string[];
  state: "emerging" | "forming" | "confirmed" | "decaying";
};

export type SyntheticEvent = {
  id: string;
  location: string;
  lat: number;
  lon: number;
  timeline: EventState[];
};

// ------------------------------------------------------------
// SAMPLE EVENTS
// ------------------------------------------------------------
const EVENTS: SyntheticEvent[] = [
  {
    id: "E-MEDFORD-001",
    location: "Medford, OR",
    lat: 42.3265,
    lon: -122.8756,
    timeline: [
      { t: 0, reports: 1, confidence: 0.32, cluster_size: 1, sources: ["visual"], state: "emerging" },
      { t: 20, reports: 2, confidence: 0.48, cluster_size: 2, sources: ["visual"], state: "forming" },
      { t: 40, reports: 3, confidence: 0.61, cluster_size: 3, sources: ["visual", "radar"], state: "forming" },
      { t: 60, reports: 5, confidence: 0.82, cluster_size: 5, sources: ["visual", "radar"], state: "confirmed" },
      { t: 90, reports: 4, confidence: 0.74, cluster_size: 4, sources: ["radar"], state: "decaying" }
    ]
  }
];

// ------------------------------------------------------------
// ENGINE
// ------------------------------------------------------------
export class SyntheticEventEngine {
  private startTime: number;
  private activeEvent: SyntheticEvent;

  constructor(eventId?: string) {
    this.startTime = Date.now();
    this.activeEvent =
      EVENTS.find(e => e.id === eventId) || EVENTS[0];
  }

  getCurrentState() {
    const elapsed = (Date.now() - this.startTime) / 1000;

    let current = this.activeEvent.timeline[0];

    for (const state of this.activeEvent.timeline) {
      if (elapsed >= state.t) {
        current = state;
      }
    }

    return {
      event_id: this.activeEvent.id,
      location: this.activeEvent.location,
      lat: this.activeEvent.lat,
      lon: this.activeEvent.lon,
      elapsed,
      ...current
    };
  }

  reset(eventId?: string) {
    this.startTime = Date.now();

    if (eventId) {
      const found = EVENTS.find(e => e.id === eventId);
      if (found) {
        this.activeEvent = found;
      }
    }
  }
}