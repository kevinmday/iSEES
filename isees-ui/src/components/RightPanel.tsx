// ============================================================
// src/components/RightPanel.tsx
// P45B
// SELECTION INTELLIGENCE INSPECTOR
//
// The right panel is a deterministic projection of the
// operator's current Investigation Manifold selection.
//
// It does NOT own selection.
// It does NOT infer intelligence.
// It does NOT duplicate global event state.
//
// Ownership:
//
// Operator
//      ↓
// Investigation Manifold
//      ↓
// GraphContext Selection
//      ↓
// Selection Intelligence Resolver
//      ↓
// Selection Intelligence Inspector
//
// ============================================================

import {
  useMemo,
} from "react";

import {
  useCorpus,
} from "../corpus/context/CorpusContext";

import {
  useWorkspace,
} from "../workspace/context/WorkspaceContext";

import {
  useGraph,
} from "../manifold/context/GraphContext";

import {
  buildInvestigationGraph,
} from "../manifold/graphBuilder";

import {
  resolveSelectionIntelligence,
} from "../manifold/selection/selectionIntelligenceResolver";

// ============================================================
// COMPONENT
// ============================================================

export default function RightPanel() {

  const {
    corpus,
  } = useCorpus();

  const {
    activeWorkspace,
  } = useWorkspace();

  const {
    selection,
  } = useGraph();

  // ==========================================================
  // GRAPH PROJECTION
  // ==========================================================

  const graph =
    useMemo(
      () =>
        buildInvestigationGraph(
          corpus,
          activeWorkspace
        ),
      [
        corpus,
        activeWorkspace,
      ]
    );

  // ==========================================================
  // SELECTION INTELLIGENCE
  // ==========================================================

  const intelligence =
    useMemo(
      () =>
        resolveSelectionIntelligence(
          selection,
          graph
        ),
      [
        selection,
        graph,
      ]
    );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      style={{
        width: "100%",

        display: "flex",
        flexDirection: "column",

        fontFamily:
          "Consolas, monospace",

        color: "#e5e7eb",
      }}
    >

      {/* ===================================================== */}
      {/* NONE                                                  */}
      {/* ===================================================== */}

      {intelligence.kind === "NONE" && (

        <EmptySelection />

      )}

      {/* ===================================================== */}
      {/* NODE                                                  */}
      {/* ===================================================== */}

      {intelligence.kind === "NODE" && (

        <NodeInspector
          intelligence={
            intelligence.intelligence
          }
        />

      )}

      {/* ===================================================== */}
      {/* EDGE                                                  */}
      {/* ===================================================== */}

      {intelligence.kind === "EDGE" && (

        <EdgeInspector
          intelligence={
            intelligence.intelligence
          }
        />

      )}

      {/* ===================================================== */}
      {/* CLUSTER                                               */}
      {/* ===================================================== */}

      {intelligence.kind === "CLUSTER" && (

        <div
          style={{
            padding: 12,

            color: "#94a3b8",

            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          Cluster intelligence
          projection is not yet
          implemented.

          <div
            style={{
              marginTop: 10,

              color: "#64748b",
            }}
          >
            {intelligence.clusterId}
          </div>
        </div>

      )}

    </div>

  );
}

// ============================================================
// EMPTY SELECTION
// ============================================================

function EmptySelection() {

  return (

    <div
      style={{
        padding: "20px 12px",

        color: "#94a3b8",

        fontSize: 12,
        lineHeight: 1.7,
      }}
    >

      <div
        style={{
          color: "#e2e8f0",

          fontSize: 13,
          fontWeight: 700,

          marginBottom: 8,
        }}
      >
        Nothing selected
      </div>

      <div>
        Select a node or edge in
        the Investigation Manifold
        to inspect its intelligence.
      </div>

    </div>

  );
}

// ============================================================
// NODE INSPECTOR
// ============================================================

function NodeInspector({
  intelligence,
}: {
  intelligence: {
    nodeId: string;
    title: string;
    sourceType: string;
    confidence?: number;
    connectionCount: number;
    metadata?: Record<
      string,
      unknown
    >;
  };
}) {

  return (

    <div>

      {/* ===================================================== */}
      {/* NODE                                                 */}
      {/* ===================================================== */}

      <InspectorSection
        title="Node"
      >

        <div
          style={{
            fontSize: 16,

            fontWeight: 700,

            color: "#f8fafc",

            marginBottom: 14,
          }}
        >
          {intelligence.title}
        </div>

        <IntelRow
          label="Source"
          value={
            intelligence.sourceType
          }
        />

        <IntelRow
          label="Connections"
          value={
            intelligence.connectionCount
          }
        />

        <IntelRow
          label="Confidence"
          value={
            intelligence.confidence !==
            undefined
              ? `${(
                  intelligence.confidence *
                  100
                ).toFixed(1)}%`
              : "N/A"
          }
        />

      </InspectorSection>

      {/* ===================================================== */}
      {/* METADATA                                             */}
      {/* ===================================================== */}

      <InspectorSection
        title="Metadata"
      >

        <MetadataRows
          metadata={
            intelligence.metadata
          }
        />

      </InspectorSection>

      {/* ===================================================== */}
      {/* TECHNICAL                                            */}
      {/* ===================================================== */}

      <InspectorSection
        title="Technical"
      >

        <IntelRow
          label="Node ID"
          value={
            intelligence.nodeId
          }
        />

      </InspectorSection>

    </div>

  );
}
// ============================================================
// EDGE INSPECTOR
// ============================================================

function EdgeInspector({
  intelligence,
}: {
  intelligence: {
    edgeId: string;
    sourceId: string;
    sourceLabel: string;
    targetId: string;
    targetLabel: string;
    relationship: string;
    confidence: number;
    narrative: number;
    observability: number;
    infrastructure: number;
    topology: number;
    geo: number;
    rationale: string[];
  };
}) {

  return (

    <div>

      {/* ===================================================== */}
      {/* RELATIONSHIP                                         */}
      {/* ===================================================== */}

      <InspectorSection
        title="Relationship"
      >

        <div
          style={{
            marginBottom: 16,
          }}
        >

          <div
            style={{
              color: "#f8fafc",
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.4,
            }}
          >
            {intelligence.sourceLabel}
          </div>

          <div
            style={{
              padding: "8px 0",

              color: "#60a5fa",

              fontSize: 11,
              fontWeight: 700,

              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            ↓ {formatLabel(
              intelligence.relationship
            )}
          </div>

          <div
            style={{
              color: "#f8fafc",
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.4,
            }}
          >
            {intelligence.targetLabel}
          </div>

        </div>

      </InspectorSection>

      {/* ===================================================== */}
      {/* METRICS                                              */}
      {/* ===================================================== */}

      <InspectorSection
        title="Metrics"
      >

        <PercentRow
          label="Confidence"
          value={
            intelligence.confidence
          }
        />

        <PercentRow
          label="Narrative"
          value={
            intelligence.narrative
          }
        />

        <PercentRow
          label="Observability"
          value={
            intelligence.observability
          }
        />

        <PercentRow
          label="Infrastructure"
          value={
            intelligence.infrastructure
          }
        />

        <PercentRow
          label="Topology"
          value={
            intelligence.topology
          }
        />

        <PercentRow
          label="Geo"
          value={
            intelligence.geo
          }
        />

      </InspectorSection>

      {/* ===================================================== */}
      {/* RATIONALE                                            */}
      {/* ===================================================== */}

      <InspectorSection
        title="Rationale"
      >

        {intelligence.rationale.length >
        0 ? (

          intelligence.rationale.map(
            (
              rationale,
              index
            ) => (

              <div
                key={index}
                style={{
                  padding:
                    "7px 0 7px 10px",

                  borderLeft:
                    "2px solid #263347",

                  color: "#cbd5e1",

                  fontSize: 12,
                  lineHeight: 1.5,

                  marginBottom: 8,
                }}
              >
                {rationale}
              </div>

            )
          )

        ) : (

          <div
            style={{
              color: "#64748b",

              fontSize: 12,

              fontStyle: "italic",
            }}
          >
            No relationship rationale
            available.
          </div>

        )}

      </InspectorSection>

      {/* ===================================================== */}
      {/* TECHNICAL                                            */}
      {/* ===================================================== */}

      <InspectorSection
        title="Technical"
      >

        <IntelRow
          label="Edge ID"
          value={
            intelligence.edgeId
          }
        />

        <IntelRow
          label="Source ID"
          value={
            intelligence.sourceId
          }
        />

        <IntelRow
          label="Target ID"
          value={
            intelligence.targetId
          }
        />

      </InspectorSection>

    </div>

  );
}
// ============================================================
// INSPECTOR SECTION
// ============================================================

function InspectorSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {

  return (

    <div
      style={{
        padding: "14px 12px",

        borderBottom:
          "1px solid #182235",
      }}
    >

      <div
        style={{
          marginBottom: 12,

          color: "#60a5fa",

          fontSize: 10,

          fontWeight: 700,

          textTransform:
            "uppercase",

          letterSpacing: 1,
        }}
      >
        {title}
      </div>

      {children}

    </div>

  );
}

// ============================================================
// METADATA
// ============================================================

function MetadataRows({
  metadata,
}: {
  metadata?: Record<
    string,
    unknown
  >;
}) {

  if (
    !metadata ||
    Object.keys(metadata).length === 0
  ) {

    return (

      <div
        style={{
          color: "#64748b",

          fontSize: 12,

          fontStyle: "italic",
        }}
      >
        No metadata available.
      </div>

    );
  }

  return (

    <>

      {Object.entries(
        metadata
      ).map(
        ([key, value]) => (

          <IntelRow
            key={key}
            label={formatLabel(key)}
            value={
              formatValue(value)
            }
          />

        )
      )}

    </>

  );
}

// ============================================================
// PERCENT ROW
// ============================================================

function PercentRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {

  return (

    <IntelRow
      label={label}
      value={`${(
        value * 100
      ).toFixed(1)}%`}
    />

  );
}

// ============================================================
// INTELLIGENCE ROW
// ============================================================

function IntelRow({
  label,
  value,
}: {
  label: string;
  value:
    string |
    number;
}) {

  return (

    <div
      style={{
        display: "flex",

        justifyContent:
          "space-between",

        alignItems:
          "flex-start",

        gap: 12,

        padding: "6px 0",
      }}
    >

      <div
        style={{
          color: "#94a3b8",

          fontSize: 11,

          flexShrink: 0,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#e5e7eb",

          fontSize: 11,

          fontWeight: 600,

          textAlign: "right",

          overflowWrap:
            "anywhere",
        }}
      >
        {String(value)}
      </div>

    </div>

  );
}

// ============================================================
// FORMATTERS
// ============================================================

function formatLabel(
  value: string
): string {

  return value
    .replace(
      /([a-z])([A-Z])/g,
      "$1 $2"
    )
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      character =>
        character.toUpperCase()
    );
}

function formatValue(
  value: unknown
): string {

  if (
    value === null ||
    value === undefined
  ) {
    return "N/A";
  }

  if (
    typeof value === "object"
  ) {

    return JSON.stringify(
      value
    );
  }

  return String(value);
}