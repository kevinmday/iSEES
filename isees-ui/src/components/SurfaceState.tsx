// ============================================================
// src/components/SurfaceState.tsx
// UNIVERSAL SURFACE STATE ENGINE (V1)
// EPISTEMIC COGNITION SURFACE
// FULL DROP-IN REPLACEMENT
// ============================================================

type SurfaceStateType =
  | "ACTIVE"
  | "SPARSE"
  | "DORMANT"
  | "UNRESOLVED"
  | "DEGRADED"
  | "COLLAPSED"
  | "DISCONNECTED"
  | "LOCKED"
  | "REPLAY_ONLY";

interface SurfaceStateProps {

  title?: string;

  state: SurfaceStateType;

  density?: string;

  topology?: string;

  pressure?: string;

  integrity?: string;

  explanation?: string[];

  glyph?: "OVERLAP" | "ENTANGLEMENT" | "RESIDUAL" | "CONTRADICTIONS" | "HOTSPOT" | "NONE";
}

// ============================================================
// STATE COLOR
// ============================================================

function getStateColor(state: SurfaceStateType) {

  switch (state) {

    case "ACTIVE":
      return "#86efac";

    case "SPARSE":
      return "#fbbf24";

    case "DORMANT":
      return "#60a5fa";

    case "UNRESOLVED":
      return "#c084fc";

    case "DEGRADED":
      return "#fb7185";

    case "COLLAPSED":
      return "#ef4444";

    case "DISCONNECTED":
      return "#9ca3af";

    case "LOCKED":
      return "#f59e0b";

    case "REPLAY_ONLY":
      return "#38bdf8";

    default:
      return "#9ca3af";
  }
}

// ============================================================
// TOPOLOGY GLYPH
// ============================================================

function TopologyGlyph({
  glyph,
}: {
  glyph?: SurfaceStateProps["glyph"];
}) {

  if (!glyph || glyph === "NONE") {

    return null;
  }

  return (

    <div
      style={{
        height: 90,
        border: "1px solid #172033",
        borderRadius: 10,
        background: "#09111d",
        position: "relative",
        overflow: "hidden",
      }}
    >

      {/* ================================================= */}
      {/* OVERLAP */}
      {/* ================================================= */}

      {glyph === "OVERLAP" && (

        <>

          <div
            style={{
              position: "absolute",
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: "1px solid #374151",
              top: 22,
              left: 70,
            }}
          />

          <div
            style={{
              position: "absolute",
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: "1px solid #374151",
              top: 22,
              left: 115,
            }}
          />

          <div
            style={{
              position: "absolute",
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#1e293b",
              top: 36,
              left: 108,
            }}
          />

        </>

      )}

      {/* ================================================= */}
      {/* ENTANGLEMENT */}
      {/* ================================================= */}

      {glyph === "ENTANGLEMENT" && (

        <>

          <div
            style={{
              position: "absolute",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#334155",
              top: 26,
              left: 70,
            }}
          />

          <div
            style={{
              position: "absolute",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#334155",
              top: 58,
              left: 170,
            }}
          />

          <div
            style={{
              position: "absolute",
              width: 90,
              height: 1,
              background: "#1e293b",
              top: 42,
              left: 82,
              transform: "rotate(18deg)",
              transformOrigin: "left center",
            }}
          />

        </>

      )}

      {/* ================================================= */}
      {/* RESIDUAL */}
      {/* ================================================= */}

      {glyph === "RESIDUAL" && (

        <>
          {[...Array(5)].map((_, idx) => (

            <div
              key={idx}
              style={{
                position: "absolute",
                height: 8,
                width: `${120 + idx * 12}px`,
                background: "#111827",
                borderRadius: 999,
                top: `${16 + idx * 14}px`,
                left: `${40 - idx * 4}px`,
                opacity: 0.7,
              }}
            />

          ))}
        </>

      )}

      {/* ================================================= */}
      {/* CONTRADICTIONS */}
      {/* ================================================= */}

      {glyph === "CONTRADICTIONS" && (

        <>

          <div
            style={{
              position: "absolute",
              width: 90,
              height: 1,
              background: "#7f1d1d",
              top: 30,
              left: 60,
              transform: "rotate(12deg)",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: 90,
              height: 1,
              background: "#1d4ed8",
              top: 56,
              left: 100,
              transform: "rotate(-16deg)",
            }}
          />

        </>

      )}

      {/* ================================================= */}
      {/* HOTSPOT */}
      {/* ================================================= */}

      {glyph === "HOTSPOT" && (

        <>
          {[...Array(3)].map((_, idx) => (

            <div
              key={idx}
              style={{
                position: "absolute",
                width: `${30 + idx * 22}px`,
                height: `${30 + idx * 22}px`,
                borderRadius: "50%",
                border: "1px solid #1e293b",
                top: `${30 - idx * 11}px`,
                left: `${110 - idx * 11}px`,
              }}
            />

          ))}
        </>

      )}

    </div>
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function SurfaceState({

  title = "Surface State",

  state,

  density = "UNKNOWN",

  topology = "UNKNOWN",

  pressure = "UNKNOWN",

  integrity = "UNKNOWN",

  explanation = [],

  glyph = "NONE",

}: SurfaceStateProps) {

  const stateColor =
    getStateColor(state);

  return (

    <div
      style={{
        border: "1px solid #1f2937",
        borderRadius: 10,
        padding: 18,
        background: "#08101f",
        display: "flex",
        flexDirection: "column",
        gap: 18,
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

        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: "#d1d5db",
          }}
        >
          {title}
        </div>

        <div
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            border: `1px solid ${stateColor}33`,
            background: `${stateColor}10`,
            color: stateColor,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          {state}
        </div>

      </div>

      {/* ================================================= */}
      {/* DIAGNOSTICS */}
      {/* ================================================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
        }}
      >

        {[
          ["Density", density],
          ["Topology", topology],
          ["Pressure", pressure],
          ["Integrity", integrity],
        ].map(([label, value]) => (

          <div
            key={label}
            style={{
              border: "1px solid #172033",
              borderRadius: 8,
              padding: 12,
              background: "#09111d",
            }}
          >

            <div
              style={{
                fontSize: 10,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              {label}
            </div>

            <div
              style={{
                fontSize: 13,
                color: "#d1d5db",
                fontWeight: 700,
              }}
            >
              {value}
            </div>

          </div>

        ))}

      </div>

      {/* ================================================= */}
      {/* GLYPH */}
      {/* ================================================= */}

      <TopologyGlyph glyph={glyph} />

      {/* ================================================= */}
      {/* EXPLANATION */}
      {/* ================================================= */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >

        {explanation.map((item, idx) => (

          <div
            key={idx}
            style={{
              padding: 14,
              border: "1px solid #172033",
              borderRadius: 8,
              background: "#0b1220",
              color: "#cbd5e1",
              fontSize: 13,
              lineHeight: 1.6,
              borderLeft: `3px solid ${stateColor}`,
            }}
          >
            {item}
          </div>

        ))}

      </div>

    </div>
  );
}