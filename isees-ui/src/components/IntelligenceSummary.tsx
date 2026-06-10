// ============================================================
// src/components/IntelligenceSummary.tsx
// EVENT INTELLIGENCE SUMMARY
// P22.5 EXTRACTION
// ============================================================

import React from "react";

// ============================================================
// SURFACE BLOCK
// ============================================================

function SurfaceBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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
          fontSize: 13,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 18,
        }}
      >
        {title}
      </div>

      {children}
    </div>
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function IntelligenceSummary({
  event,
}: {
  event: any;
}) {
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
          fontSize: 13,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 16,
        }}
      >
        Event Intelligence Summary
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
        }}
      >
        <SurfaceBlock title="What Happened">
          <div
            style={{
              fontSize: 13,
              color: "#cbd5e1",
              lineHeight: 1.6,
            }}
          >
            {(event.reasoning?.[0]) ||
              "No event summary available."}
          </div>
        </SurfaceBlock>

        <SurfaceBlock title="What It Means">
          <div
            style={{
              fontSize: 13,
              color: "#cbd5e1",
              lineHeight: 1.6,
            }}
          >
            Escalation: {event.escalation}
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 13,
              color: "#cbd5e1",
            }}
          >
            Confidence: {event.confidence}
          </div>
        </SurfaceBlock>

        <SurfaceBlock title="What To Do Next">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {(
              event.operational_intelligence
                ?.recommended_actions || []
            )
              .slice(0, 3)
              .map(
                (
                  action: string,
                  idx: number
                ) => (
                  <div key={idx}>
                    • {action}
                  </div>
                )
              )}

            {(
              event.operational_intelligence
                ?.recommended_actions || []
            ).length === 0 && (
              <div
                style={{
                  color: "#64748b",
                  fontStyle: "italic",
                }}
              >
                No recommended actions available
              </div>
            )}
          </div>
        </SurfaceBlock>

        <SurfaceBlock title="Operational Significance">
          <div
            style={{
              fontSize: 13,
              color: "#cbd5e1",
              lineHeight: 1.8,
            }}
          >
            Facilities Involved:
            {" "}
            {event.facilities?.length || 0}

            <br />

            Research Targets:
            {" "}
            {(
              event.operational_intelligence
                ?.investigation_vectors || []
            ).length}

            <br />

            Escalation Level:
            {" "}
            {event.escalation}

            <br />

            Confidence:
            {" "}
            {event.confidence}
          </div>
        </SurfaceBlock>

        <SurfaceBlock title="Related Intelligence">
          <div
            style={{
              fontSize: 13,
              color: "#cbd5e1",
              lineHeight: 1.8,
            }}
          >
            Clusters: {event.clusters}

            <br />

            Reports: {event.reports}

            <br />

            Recurrence: {event.recurrence}

            <br />

            Trend: {event.trend}
          </div>
        </SurfaceBlock>
      </div>
    </div>
  );
}