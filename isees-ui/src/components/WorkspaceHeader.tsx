// ============================================================
// src/components/WorkspaceHeader.tsx
// P32
// INVESTIGATION OWNERSHIP FOUNDATION
//
// The header now represents the Investigation rather than simply
// the currently focused event. The focused event is presented as
// the Primary Subject of the active Investigation.
//
// FULL DROP-IN REPLACEMENT
// ============================================================

import MetricBox from "./surfaces/MetricBox";

interface WorkspaceHeaderProps {
  event: any;
}

export function WorkspaceHeader({
  event,
}: WorkspaceHeaderProps) {
  return (
    <div
      style={{
        border: "1px solid #1f2937",
        borderRadius: 10,
        padding: 18,
        background: "#08101f",
      }}
    >
      {/* ===================================================== */}
      {/* INVESTIGATION HEADER */}
      {/* ===================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 18,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: "#60a5fa",
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Investigation
          </div>

          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: 0.5,
              color: "#f3f4f6",
            }}
          >
            Nimitz Investigation
          </div>

          <div
            style={{
              marginTop: 6,
              color: "#9ca3af",
              fontSize: 13,
            }}
          >
            Comparative Investigation • System Canon
          </div>

          <div
            style={{
              marginTop: 14,
              color: "#d1d5db",
              fontSize: 14,
            }}
          >
            <span
              style={{
                color: "#6b7280",
                textTransform: "uppercase",
                fontSize: 11,
                letterSpacing: 1,
                marginRight: 8,
              }}
            >
              Primary Subject
            </span>

            {event.id}
          </div>

          <div
            style={{
              marginTop: 4,
              color: "#9ca3af",
              fontSize: 13,
            }}
          >
            {event.location}
          </div>
        </div>

        <div
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            background: "#0f172a",
            border: "1px solid #1f2937",
            color:
              event.escalation === "HIGH"
                ? "#f87171"
                : "#86efac",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          {event.escalation}
        </div>
      </div>

      {/* ===================================================== */}
      {/* INVESTIGATION METRICS */}
      {/* ===================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 12,
        }}
      >
        <MetricBox
          label="Confidence"
          value={event.confidence}
        />

        <MetricBox
          label="Reports"
          value={event.reports}
        />

        <MetricBox
          label="Clusters"
          value={event.clusters}
        />

        <MetricBox
          label="Duration"
          value={event.duration}
        />

        <MetricBox
          label="Recurrence"
          value={event.recurrence}
        />

        <MetricBox
          label="Trend"
          value={event.trend}
        />
      </div>
    </div>
  );
}