// ============================================================
// src/components/EventRadar.tsx
// P25.6B UNIFIED INVESTIGATION IMPORT
// LIVE EVENT RADAR
// SINGLE WORKSPACE IMPORT CONTRACT
// FULL DROP-IN REPLACEMENT
// ============================================================

import EventCard from "./EventCard";

import { useEventContext } from "../context/EventContext";

import {
  useWorkspace,
} from "../workspace/context/WorkspaceContext";

// ============================================================
// COMPONENT
// ============================================================

export default function EventRadar() {

  const {
    events,
    activeEvent,
    setActiveEvent,
  } = useEventContext();

  const {
    importInvestigation,
  } = useWorkspace();

  // =========================================================
  // SORTING
  // Highest confidence first
  // =========================================================

  const sortedEvents = [...events].sort(
    (a, b) => b.confidence - a.confidence
  );

  // =========================================================
  // COUNTS
  // =========================================================

  const activeEvents = sortedEvents.filter(
    (e) => e.active
  ).length;

  const highEscalation = sortedEvents.filter(
    (e) => e.escalation === "HIGH"
  ).length;

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div>

      {/* =================================================== */}
      {/* RADAR SUMMARY */}
      {/* =================================================== */}

      <div
        style={{
          background: "#0b1220",
          border: "1px solid #182235",
          borderRadius: 6,
          padding: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "#94a3b8",
            textTransform: "uppercase",
            marginBottom: 10,
            letterSpacing: 0.5,
          }}
        >
          Radar Summary
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          <SummaryMetric
            label="Tracked"
            value={sortedEvents.length}
            color="#38bdf8"
          />

          <SummaryMetric
            label="Active"
            value={activeEvents}
            color="#4ade80"
          />

          <SummaryMetric
            label="High Alert"
            value={highEscalation}
            color="#ef4444"
          />

          <SummaryMetric
            label="Recurrence"
            value={
              sortedEvents.filter(
                (e) =>
                  e.recurrence !== "LOW"
              ).length
            }
            color="#a78bfa"
          />
        </div>
      </div>

      {/* =================================================== */}
      {/* EVENT LIST */}
      {/* =================================================== */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {sortedEvents.map((event) => {

          const isSelected =
            activeEvent?.id === event.id;

          return (
            <div
              key={event.id}
              onClick={() => {

                // ------------------------------------------
                // Legacy Runtime Selection
                // (temporary until EventContext retirement)
                // ------------------------------------------

                setActiveEvent(
                  event
                );

                // ------------------------------------------
                // Unified Workspace Investigation Import
                // ------------------------------------------

                importInvestigation(
                  event.id
                );
              }}
              style={{
                cursor: "pointer",

                transition:
                  "all 0.15s ease",

                borderRadius: 8,

                border: isSelected
                  ? "1px solid #38bdf8"
                  : "1px solid transparent",

                boxShadow: isSelected
                  ? "0 0 12px rgba(56,189,248,0.25)"
                  : "none",
              }}
            >
              <EventCard
                eventId={event.id}
                confidence={event.confidence}
                reports={event.reports}
                clusters={event.clusters}
                duration={event.duration}
                trend={
                  event.trend as
                    | "RISING"
                    | "STABLE"
                    | "FALLING"
                }
                escalation={
                  event.escalation as
                    | "LOW"
                    | "MEDIUM"
                    | "HIGH"
                }
                active={event.active}
                recurrence={
                  event.recurrence !==
                  "LOW"
                }
                updated="LIVE"
                location={event.location}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// SUMMARY METRIC
// ============================================================

function SummaryMetric({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      style={{
        background: "#08101d",
        border: "1px solid #182235",
        borderRadius: 4,
        padding: 10,
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: "#94a3b8",
          textTransform: "uppercase",
          marginBottom: 5,
          letterSpacing: 0.5,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}