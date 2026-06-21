// ============================================================
// src/graph/GraphInteractionPanel.tsx
// P26.0 INTERACTIVE TOPOLOGY
// GRAPH INTELLIGENCE SURFACE
// FULL DROP-IN FILE
// ============================================================

import type {
  GraphNodeIntelligence,
  GraphEdgeIntelligence,
} from "./graphInteractionTypes";

// ============================================================
// COMPONENT
// ============================================================

export default function GraphInteractionPanel({
  selectedNode,
  selectedEdge,
}: {
  selectedNode?: GraphNodeIntelligence;
  selectedEdge?: GraphEdgeIntelligence;
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

      <div
        style={{
          fontSize: 11,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: 1.5,
          marginBottom: 16,
        }}
      >
        Graph Intelligence
      </div>

      {!selectedNode &&
       !selectedEdge && (

        <div
          style={{
            color: "#9ca3af",
            fontSize: 12,
          }}
        >
          Select a node or edge
          to inspect graph
          intelligence.
        </div>

      )}

      {/* ====================================== */}
      {/* NODE INTELLIGENCE                      */}
      {/* ====================================== */}

      {selectedNode && (

        <div
          style={{
            background: "#0d1728",
            border: "1px solid #172033",
            borderRadius: 8,
            padding: 12,
          }}
        >

          <div
            style={{
              color: "#e5e7eb",
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            Node Intelligence
          </div>

          <Metric
            label="Title"
            value={selectedNode.title}
          />

          <Metric
            label="Source"
            value={
              selectedNode.sourceType
            }
          />

          <Metric
            label="Connections"
            value={
              selectedNode.connectionCount
            }
          />

          <Metric
            label="Confidence"
            value={
              selectedNode.confidence
                ? `${(
                    selectedNode.confidence *
                    100
                  ).toFixed(1)}%`
                : "N/A"
            }
          />

        </div>

      )}

      {/* ====================================== */}
      {/* EDGE INTELLIGENCE                      */}
      {/* ====================================== */}

      {selectedEdge && (

        <div
          style={{
            background: "#0d1728",
            border: "1px solid #172033",
            borderRadius: 8,
            padding: 12,
          }}
        >

          <div
            style={{
              color: "#e5e7eb",
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            Edge Intelligence
          </div>

          <Metric
            label="Source"
            value={
              selectedEdge.sourceId
            }
          />

          <Metric
            label="Target"
            value={
              selectedEdge.targetId
            }
          />

          <Metric
            label="Confidence"
            value={`${(
              selectedEdge.confidence *
              100
            ).toFixed(1)}%`}
          />

          <Metric
            label="Narrative"
            value={`${(
              selectedEdge.narrative *
              100
            ).toFixed(1)}%`}
          />

          <Metric
            label="Observability"
            value={`${(
              selectedEdge.observability *
              100
            ).toFixed(1)}%`}
          />

          <Metric
            label="Infrastructure"
            value={`${(
              selectedEdge.infrastructure *
              100
            ).toFixed(1)}%`}
          />

          <Metric
            label="Topology"
            value={`${(
              selectedEdge.topology *
              100
            ).toFixed(1)}%`}
          />

          <Metric
            label="Geo"
            value={`${(
              selectedEdge.geo *
              100
            ).toFixed(1)}%`}
          />

          {selectedEdge.rationale
            .length > 0 && (

            <div
              style={{
                marginTop: 12,
              }}
            >

              <div
                style={{
                  color: "#94a3b8",
                  fontSize: 11,
                  textTransform:
                    "uppercase",
                  marginBottom: 6,
                }}
              >
                Rationale
              </div>

              {selectedEdge.rationale.map(
                (
                  rationale,
                  index
                ) => (

                  <div
                    key={index}
                    style={{
                      color: "#cbd5e1",
                      fontSize: 12,
                      marginBottom: 4,
                    }}
                  >
                    • {rationale}
                  </div>

                )
              )}

            </div>

          )}

        </div>

      )}

    </div>

  );
}

// ============================================================
// METRIC
// ============================================================

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {

  return (

    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        padding: "4px 0",
      }}
    >

      <div
        style={{
          color: "#94a3b8",
          fontSize: 12,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#e5e7eb",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {value}
      </div>

    </div>

  );
}

