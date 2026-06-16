// ============================================================
// src/components/WorkspaceOverview.tsx
// P23.1 WORKSPACE OVERVIEW
// FIRST-CLASS WORKSPACE VISIBILITY
// ============================================================

import { useWorkspace }
  from "../workspace/context/WorkspaceContext";
import { CANONICAL_EVENTS } from "../canonical/runtimeCorpus";

export default function WorkspaceOverview() {

const {
  activeWorkspace,
  removeEventFromWorkspace,
} = useWorkspace();

  const resolveEventName = (
    eventId: string,
  ) => {

    const event =
      CANONICAL_EVENTS.find(
        e => e.event_id === eventId
      );

    return (
      event?.event_name ??
      eventId
    );
  };

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
          marginBottom: 16,
        }}
      >

        <div
          style={{
            fontSize: 11,
            color: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: 1.5,
            marginBottom: 4,
          }}
        >
          Workspace
        </div>

        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#f3f4f6",
          }}
        >
          {activeWorkspace.imported_events.length <= 1
            ? "Single Event Investigation"
            : activeWorkspace.imported_events.length === 2
            ? "Comparative Investigation"
            : "Corpus Investigation"}
        </div>

        <div
          style={{
            fontSize: 12,
            color: "#9ca3af",
            marginTop: 4,
          }}
        >
          {activeWorkspace.imported_events.length} Event
          {activeWorkspace.imported_events.length !== 1
            ? "s"
            : ""}
          {" "}Loaded
        </div>

      </div>

      {/* STATS */}

      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >

        <StatCard
          label="Imported Events"
          value={
            activeWorkspace.imported_events.length
          }
        />

        <StatCard
          label="Investigations"
          value={
            activeWorkspace.investigations.length
          }
        />

        <StatCard
          label="Active Layers"
          value={
            activeWorkspace.active_layers.length
          }
        />

      </div>

           {/* IMPORTED EVENTS */}

      <SectionTitle>
        Imported Events
      </SectionTitle>

      {activeWorkspace.imported_events.length === 0 ? (

        <EmptyText>
          No events imported into workspace.
        </EmptyText>

      ) : (

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 18,
          }}
        >

          {activeWorkspace.imported_events.map(
            (eventRef) => (

              <div
                key={eventRef.event_id}
                style={{
                  background: "#0d1728",
                  border:
                    "1px solid #172033",
                  borderRadius: 8,
                  padding: "10px 12px",
                }}
              >

                <div
                  style={{
                    color: "#e5e7eb",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {resolveEventName(
                    eventRef.event_id
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    marginTop: 2,
                  }}
                >

                  <div
                    style={{
                      color: "#6b7280",
                      fontSize: 11,
                    }}
                  >
                    {eventRef.source}
                  </div>

                  <button
                    onClick={() =>
                      removeEventFromWorkspace(
                        eventRef.event_id
                      )
                    }
                    style={{
                      background:
                        "transparent",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    ×
                  </button>

                </div>

              </div>

            )
          )}

        </div>

      )}

      {/* ACTIVE LAYERS */}

      <SectionTitle>
        Active Layers
      </SectionTitle>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >

        {activeWorkspace.active_layers.map(
          (layer) => (

            <div
              key={layer}
              style={{
                background: "#111827",
                border:
                  "1px solid #374151",
                borderRadius: 999,
                padding:
                  "6px 10px",
                fontSize: 11,
                color: "#d1d5db",
                fontWeight: 600,
              }}
            >
              {layer}
            </div>

          )
        )}

      </div>

    </div>

  );
}

// ============================================================
// HELPERS
// ============================================================

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {

  return (

    <div
      style={{
        fontSize: 11,
        color: "#6b7280",
        textTransform: "uppercase",
        letterSpacing: 1.5,
        marginBottom: 10,
        marginTop: 4,
      }}
    >
      {children}
    </div>

  );
}

function EmptyText({
  children,
}: {
  children: React.ReactNode;
}) {

  return (

    <div
      style={{
        color: "#6b7280",
        fontSize: 12,
        marginBottom: 18,
      }}
    >
      {children}
    </div>

  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {

  return (

    <div
      style={{
        background: "#0d1728",
        border: "1px solid #172033",
        borderRadius: 8,
        padding: "10px 14px",
        minWidth: 110,
      }}
    >

      <div
        style={{
          fontSize: 10,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 4,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 20,
          color: "#f3f4f6",
          fontWeight: 700,
        }}
      >
        {value}
      </div>

    </div>

  );
}