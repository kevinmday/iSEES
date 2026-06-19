// ============================================================
// src/components/ResolutionPanel.tsx
// P24.2 RESOLUTION PANEL
// PROP-WIRED FOUNDATION UI
// FULL DROP-IN REPLACEMENT
// ============================================================

export default function ResolutionPanel({
  focusedEventId,
}: {
  focusedEventId: string;
}) {

  return (

    <div
      style={{
        background: "#08101f",
        border: "1px solid #172033",
        borderRadius: 10,
        padding: 16,
      }}
    >

      {/* HEADER */}

      <div
        style={{
          fontSize: 11,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: 1.5,
          marginBottom: 12,
        }}
      >
        Similar Cases
      </div>

      {/* CONTENT */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >

        <div
          style={{
            background: "#0d1728",
            border: "1px solid #172033",
            borderRadius: 8,
            padding: "12px 14px",
          }}
        >

          <div
            style={{
              color: "#e5e7eb",
              fontWeight: 600,
              fontSize: 13,
              marginBottom: 4,
            }}
          >
            Resolution Engine
          </div>

          <div
            style={{
              color: "#9ca3af",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            Focused Event:
            {" "}
            {focusedEventId}
          </div>

        </div>

        <div
          style={{
            background: "#0d1728",
            border: "1px solid #172033",
            borderRadius: 8,
            padding: "10px 14px",
          }}
        >

          <div
            style={{
              color: "#6b7280",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            Status
          </div>

          <div
            style={{
              color: "#22c55e",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Resolution Data Ready
          </div>

        </div>

      </div>

    </div>

  );
}