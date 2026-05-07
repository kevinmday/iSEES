// ============================================================
// src/components/EventCard.tsx — EVENT RADAR CARD (V1)
// FULL DROP-IN FILE
// ============================================================

type Props = {
  eventId: string
  confidence: number
  reports: number
  clusters: number
  duration: string
  trend?: "RISING" | "STABLE" | "FALLING"
  escalation?: "LOW" | "MEDIUM" | "HIGH"
  active?: boolean
  recurrence?: boolean
  updated?: string
  location?: string
}

export default function EventCard({
  eventId,
  confidence,
  reports,
  clusters,
  duration,
  trend = "STABLE",
  escalation = "LOW",
  active = true,
  recurrence = false,
  updated = "LIVE",
  location = "UNKNOWN"
}: Props) {
  // =========================================================
  // STATE COLORS
  // =========================================================

  const escalationColor =
    escalation === "HIGH"
      ? "#ef4444"
      : escalation === "MEDIUM"
      ? "#facc15"
      : "#4ade80"

  const trendColor =
    trend === "RISING"
      ? "#4ade80"
      : trend === "FALLING"
      ? "#ef4444"
      : "#38bdf8"

  const activeColor = active ? "#4ade80" : "#6b7280"

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      style={{
        background: "#0b1220",
        border: "1px solid #182235",
        borderLeft: `4px solid ${escalationColor}`,
        borderRadius: 6,
        padding: 12,
        marginBottom: 10,
        cursor: "pointer",
        transition: "all 120ms ease"
      }}
    >
      {/* =================================================== */}
      {/* TOP ROW */}
      {/* =================================================== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        {/* EVENT ID */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 0.8,
            color: "#f8fafc"
          }}
        >
          {eventId}
        </div>

        {/* ACTIVE STATE */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: activeColor
            }}
          />

          <span
            style={{
              fontSize: 10,
              color: "#94a3b8",
              textTransform: "uppercase"
            }}
          >
            {active ? "ACTIVE" : "DORMANT"}
          </span>
        </div>
      </div>

      {/* =================================================== */}
      {/* LOCATION */}
      {/* =================================================== */}
      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          color: "#cbd5e1"
        }}
      >
        {location}
      </div>

      {/* =================================================== */}
      {/* CONFIDENCE */}
      {/* =================================================== */}
      <div
        style={{
          marginTop: 10
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 5
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: "#94a3b8",
              textTransform: "uppercase"
            }}
          >
            Confidence
          </span>

          <span
            style={{
              fontSize: 11,
              color: "#f8fafc",
              fontWeight: 700
            }}
          >
            {confidence.toFixed(2)}
          </span>
        </div>

        {/* BAR */}
        <div
          style={{
            width: "100%",
            height: 6,
            background: "#111827",
            borderRadius: 999
          }}
        >
          <div
            style={{
              width: `${confidence * 100}%`,
              height: "100%",
              background: escalationColor,
              borderRadius: 999
            }}
          />
        </div>
      </div>

      {/* =================================================== */}
      {/* EVENT METRICS */}
      {/* =================================================== */}
      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8
        }}
      >
        <Metric
          label="Reports"
          value={reports}
        />

        <Metric
          label="Clusters"
          value={clusters}
        />

        <Metric
          label="Duration"
          value={duration}
        />

        <Metric
          label="Updated"
          value={updated}
        />
      </div>

      {/* =================================================== */}
      {/* TREND + ESCALATION */}
      {/* =================================================== */}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        {/* TREND */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: "#94a3b8",
              textTransform: "uppercase"
            }}
          >
            Trend
          </span>

          <span
            style={{
              fontSize: 11,
              color: trendColor,
              fontWeight: 700
            }}
          >
            {trend}
          </span>
        </div>

        {/* ESCALATION */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: "#94a3b8",
              textTransform: "uppercase"
            }}
          >
            Escalation
          </span>

          <span
            style={{
              fontSize: 11,
              color: escalationColor,
              fontWeight: 700
            }}
          >
            {escalation}
          </span>
        </div>
      </div>

      {/* =================================================== */}
      {/* RECURRENCE */}
      {/* =================================================== */}
      {recurrence && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid #182235",
            fontSize: 10,
            color: "#38bdf8",
            textTransform: "uppercase",
            letterSpacing: 0.5
          }}
        >
          Recurrence Signature Detected
        </div>
      )}
    </div>
  )
}

// ===========================================================
// INTERNAL METRIC BLOCK
// ===========================================================

function Metric({
  label,
  value
}: {
  label: string
  value: string | number
}) {
  return (
    <div
      style={{
        background: "#08101d",
        border: "1px solid #182235",
        borderRadius: 4,
        padding: 8
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: "#94a3b8",
          textTransform: "uppercase",
          marginBottom: 4,
          letterSpacing: 0.5
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 12,
          color: "#f8fafc",
          fontWeight: 700
        }}
      >
        {value}
      </div>
    </div>
  )
}