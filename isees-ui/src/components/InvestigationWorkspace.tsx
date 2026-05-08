// ============================================================
// src/components/InvestigationWorkspace.tsx
// OPERATIONAL INVESTIGATION WORKSPACE (V4)
// GLOBAL INVESTIGATION SURFACE STATE
// FULL DROP-IN REPLACEMENT
// ============================================================

import { useEventContext } from "../context/EventContext";

// ============================================================
// INVESTIGATION SURFACES
// ============================================================

const SURFACES = [
  "SUMMARY",
  "COLLAPSE",
  "CANDIDATES",
  "CONTRADICTIONS",
  "HOTSPOT",
  "GEO",
];

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
// SURFACE BUTTON
// ============================================================

function SurfaceButton({
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
        padding: "8px 12px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1,
        cursor: "pointer",
        textTransform: "uppercase",
      }}
    >
      {label}
    </button>
  );
}

// ============================================================
// OPERATIONAL SURFACE BLOCK
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

export default function InvestigationWorkspace() {
  const {
    activeEvent,
    activeSurface,
    setActiveSurface,
  } = useEventContext();

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

  // ==========================================================
  // RENDER
  // ==========================================================

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
      {/* INVESTIGATION SURFACE SELECTOR */}
      {/* ================================================= */}

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {SURFACES.map((surface) => (
          <SurfaceButton
            key={surface}
            label={surface}
            active={activeSurface === surface}
            onClick={() =>
              setActiveSurface(surface as any)
            }
          />
        ))}
      </div>

      {/* ================================================= */}
      {/* SUMMARY SURFACE */}
      {/* ================================================= */}

      {activeSurface === "SUMMARY" && (
        <>
          <SurfaceBlock title="Manifold Reasoning">
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
          </SurfaceBlock>

          <SurfaceBlock title="Observation Timeline">
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
          </SurfaceBlock>

          <SurfaceBlock title="Infrastructure Context">
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, 1fr)",
                gap: 12,
              }}
            >
              {event.facilities.map(
                (facility, idx) => (
                  <div
                    key={idx}
                    style={{
                      border:
                        "1px solid #1f2937",
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
                      Distance:{" "}
                      {facility.distance}
                    </div>
                  </div>
                )
              )}
            </div>
          </SurfaceBlock>
        </>
      )}

      {/* ================================================= */}
      {/* COLLAPSE SURFACE */}
      {/* ================================================= */}

      {activeSurface === "COLLAPSE" && (
        <SurfaceBlock title="Collapse Analysis">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              style={{
                border: "1px solid #1f2937",
                borderRadius: 8,
                padding: 14,
                background: "#0b1220",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 10,
                  color: "#f3f4f6",
                }}
              >
                PRIMARY FAILURE VECTOR
              </div>

              <div
                style={{
                  color: "#cbd5e1",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                Temporal mismatch between
                observation timeline and
                aviation reconstruction
                envelope.
              </div>
            </div>

            <div
              style={{
                border: "1px solid #1f2937",
                borderRadius: 8,
                padding: 14,
                background: "#0b1220",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 10,
                  color: "#f3f4f6",
                }}
              >
                SECONDARY CONTRADICTION
              </div>

              <div
                style={{
                  color: "#cbd5e1",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                Velocity profile exceeds
                expected civilian aviation
                behavior.
              </div>
            </div>
          </div>
        </SurfaceBlock>
      )}

      {/* ================================================= */}
      {/* CANDIDATES SURFACE */}
      {/* ================================================= */}

      {activeSurface === "CANDIDATES" && (
        <SurfaceBlock title="Candidate Ladder">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {[
              ["COMMERCIAL AVIATION", "0.71"],
              ["MILITARY AVIATION", "0.52"],
              ["ATMOSPHERIC", "0.28"],
              ["ASTRONOMICAL", "0.11"],
            ].map(([label, score]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
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
                    color: "#d1d5db",
                  }}
                >
                  {label}
                </div>

                <div
                  style={{
                    color: "#60a5fa",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {score}
                </div>
              </div>
            ))}
          </div>
        </SurfaceBlock>
      )}

      {/* ================================================= */}
      {/* CONTRADICTIONS SURFACE */}
      {/* ================================================= */}

      {activeSurface === "CONTRADICTIONS" && (
        <SurfaceBlock title="Contradiction Matrix">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {[
              "Temporal contradiction",
              "Motion inconsistency",
              "Observer asymmetry",
              "Sensor divergence",
              "Geo inconsistency",
            ].map((item) => (
              <div
                key={item}
                style={{
                  border: "1px solid #1f2937",
                  borderRadius: 8,
                  padding: 14,
                  background: "#0b1220",
                  color: "#d1d5db",
                  fontSize: 13,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </SurfaceBlock>
      )}

      {/* ================================================= */}
      {/* HOTSPOT SURFACE */}
      {/* ================================================= */}

      {activeSurface === "HOTSPOT" && (
        <SurfaceBlock title="Hotspot Memory">
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, 1fr)",
              gap: 12,
            }}
          >
            <MetricBox
              label="Region Recurrence"
              value="ACTIVE"
            />

            <MetricBox
              label="Similar Events"
              value="12"
            />

            <MetricBox
              label="Last Recurrence"
              value="18H"
            />

            <MetricBox
              label="Memory State"
              value="STABLE"
            />
          </div>
        </SurfaceBlock>
      )}

      {/* ================================================= */}
      {/* GEO SURFACE */}
      {/* ================================================= */}

      {activeSurface === "GEO" && (
        <SurfaceBlock title="Geo Context">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {[
              "KMFR Tower",
              "KMAX NEXRAD",
              "Airport Operations",
              "FAA Radar Coverage",
              "Terrain Masking Analysis",
            ].map((item) => (
              <div
                key={item}
                style={{
                  border: "1px solid #1f2937",
                  borderRadius: 8,
                  padding: 14,
                  background: "#0b1220",
                  color: "#d1d5db",
                  fontSize: 13,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </SurfaceBlock>
      )}
    </div>
  );
}