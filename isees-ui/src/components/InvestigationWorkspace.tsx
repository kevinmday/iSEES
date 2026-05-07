// ============================================================
// src/components/InvestigationWorkspace.tsx
// OPERATIONAL INVESTIGATION WORKSPACE (V2 CONTEXT WIRED)
// FULL DROP-IN REPLACEMENT
// ============================================================

import { useEventContext } from "../context/EventContext";

// ============================================================
// METRIC BOX
// ============================================================

function MetricBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        border: "1px solid #1f2937",
        borderRadius: 8,
        padding: 14,
        background: "#08101f",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 10,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#d1d5db",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function InvestigationWorkspace() {
  const { activeEvent } = useEventContext();

  // ----------------------------------------------------------
  // NO ACTIVE EVENT
  // ----------------------------------------------------------

  if (!activeEvent) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          color: "#9ca3af",
          fontSize: 18,
        }}
      >
        Awaiting active event selection
      </div>
    );
  }

  const event = activeEvent;

  // ----------------------------------------------------------
  // ACTIVE WORKSPACE
  // ----------------------------------------------------------

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {/* ================================================= */}
      {/* ACTIVE EVENT HEADER */}
      {/* ================================================= */}

      <div
        style={{
          border: "1px solid #1f2937",
          borderRadius: 10,
          padding: 18,
          background: "#08101f",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: 1,
              }}
            >
              {event.id}
            </div>

            <div
              style={{
                marginTop: 6,
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

        {/* ================================================= */}
        {/* METRICS */}
        {/* ================================================= */}

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

      {/* ================================================= */}
      {/* MANIFOLD REASONING */}
      {/* ================================================= */}

      <div
        style={{
          border: "1px solid #1f2937",
          borderRadius: 10,
          padding: 18,
          background: "#08101f",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 18,
          }}
        >
          Manifold Reasoning
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {event.reasoning.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: 12,
                border: "1px solid #1f2937",
                borderRadius: 8,
                background: "#0b1220",
                color: "#cbd5e1",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ================================================= */}
      {/* OBSERVATION TIMELINE */}
      {/* ================================================= */}

      <div
        style={{
          border: "1px solid #1f2937",
          borderRadius: 10,
          padding: 18,
          background: "#08101f",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 18,
          }}
        >
          Observation Timeline
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {event.observations.map((obs) => (
            <div
              key={obs.id}
              style={{
                border: "1px solid #1f2937",
                borderRadius: 8,
                padding: 14,
                background: "#0b1220",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {obs.id}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                  }}
                >
                  {obs.time}
                </div>
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: "#60a5fa",
                  marginBottom: 8,
                }}
              >
                {obs.location}
              </div>

              <div
                style={{
                  color: "#d1d5db",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {obs.summary}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================================================= */}
      {/* INFRASTRUCTURE CONTEXT */}
      {/* ================================================= */}

      <div
        style={{
          border: "1px solid #1f2937",
          borderRadius: 10,
          padding: 18,
          background: "#08101f",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 18,
          }}
        >
          Infrastructure Context
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          {event.facilities.map((facility, idx) => (
            <div
              key={idx}
              style={{
                border: "1px solid #1f2937",
                borderRadius: 8,
                padding: 14,
                background: "#0b1220",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 10,
                }}
              >
                {facility.name}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "#60a5fa",
                  marginBottom: 6,
                }}
              >
                {facility.type}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                }}
              >
                Distance: {facility.distance}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}