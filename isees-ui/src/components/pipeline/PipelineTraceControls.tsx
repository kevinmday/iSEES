// ============================================================
// src/components/pipeline/PipelineTraceControls.tsx
// LIVE / REPLAY TEMPORAL COGNITION CONTROLS
// OPERATOR-GRADE TEMPORAL AUTHORITY SURFACE
// FULL DROP-IN REPLACEMENT
// ============================================================

import type { PipelineMode } from "../../types/pipeline";

// ============================================================
// PROPS
// ============================================================

type Props = {
  mode: PipelineMode;

  onModeChange: (mode: PipelineMode) => void;

  replayAvailable?: boolean;

  liveConnected?: boolean;
};

// ============================================================
// MODE BUTTON
// ============================================================

function ModeButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "#111827" : "#08101f",

        border: active
          ? "1px solid #374151"
          : "1px solid #1f2937",

        color: active ? "#f3f4f6" : "#9ca3af",

        padding: "10px 16px",

        borderRadius: 8,

        fontSize: 11,

        fontWeight: 700,

        letterSpacing: 1,

        textTransform: "uppercase",

        cursor: "pointer",

        transition: "all 0.15s ease",

        minWidth: 110,
      }}
    >
      {label}
    </button>
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function PipelineTraceControls({
  mode,
  onModeChange,
  replayAvailable = true,
  liveConnected = true,
}: Props) {
  return (
    <div
      style={{
        border: "1px solid #1f2937",

        borderRadius: 10,

        background: "#08101f",

        padding: 16,

        display: "flex",

        flexDirection: "column",

        gap: 14,
      }}
    >
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "#f3f4f6",
            }}
          >
            Event Observation Mode
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              color: "#94a3b8",
              lineHeight: 1.5,
            }}
          >
            {mode === "live"
              ? "Observing active manifold intake and event formation."
              : "Reconstructing deterministic event genesis and cognition progression."}
          </div>
        </div>

        <div
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: liveConnected
              ? "#4ade80"
              : "#f87171",
            fontWeight: 700,
          }}
        >
          {liveConnected
            ? "Connected"
            : "Disconnected"}
        </div>
      </div>

      {/* ================================================= */}
      {/* CONTROLS */}
      {/* ================================================= */}

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <ModeButton
          label="Live"
          active={mode === "live"}
          onClick={() =>
            onModeChange("live")
          }
        />

        <ModeButton
          label="Replay"
          active={mode === "replay"}
          onClick={() =>
            onModeChange("replay")
          }
        />
      </div>

      {/* ================================================= */}
      {/* STATUS STRIP */}
      {/* ================================================= */}

      <div
        style={{
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          paddingTop: 4,
          borderTop: "1px solid #172033",
          paddingBottom: 2,
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          MODE:

          <span
            style={{
              marginLeft: 6,
              color: "#d1d5db",
              fontWeight: 700,
            }}
          >
            {mode.toUpperCase()}
          </span>
        </div>

        <div
          style={{
            fontSize: 10,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          REPLAY:

          <span
            style={{
              marginLeft: 6,
              color: replayAvailable
                ? "#86efac"
                : "#f87171",
              fontWeight: 700,
            }}
          >
            {replayAvailable
              ? "AVAILABLE"
              : "UNAVAILABLE"}
          </span>
        </div>

        <div
          style={{
            fontSize: 10,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          TEMPORAL AUTHORITY:

          <span
            style={{
              marginLeft: 6,
              color: "#60a5fa",
              fontWeight: 700,
            }}
          >
            {mode === "live"
              ? "LIVE CLOCK"
              : "REPLAY CLOCK"}
          </span>
        </div>
      </div>
    </div>
  );
}