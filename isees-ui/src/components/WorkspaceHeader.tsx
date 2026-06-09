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