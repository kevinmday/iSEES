// ============================================================
// src/components/RightPanel.tsx
//
// P56D-H
// SELECTION INTELLIGENCE INSPECTOR
//
// The right panel is a deterministic projection of operator
// inspection state.
//
// It supports two deliberately distinct intelligence paths:
//
// ESTABLISHED GRAPH TOPOLOGY
//
//   GraphContext Selection
//            ↓
//   Selection Intelligence Resolver
//            ↓
//   NODE / EDGE / CLUSTER Inspector
//
// RESOLVE CANDIDATE INTELLIGENCE
//
//   ResolveRuntime candidateEvaluations
//            ↓
//   Resolve Candidate Intelligence
//            ↓
//   WorkspaceRuntime Candidate Selection
//            ↓
//   Candidate Intelligence Inspector
//
// CRITICAL EPISTEMIC DISTINCTION
//
//                 CANDIDATE != EDGE
//
// A Resolve candidate is a potential relationship.
//
// It is NOT:
//
//   • an established GraphEdge
//   • an asserted relationship
//   • graph topology
//   • promoted Knowledge
//   • a Research Vector
//   • REX execution state
//
// RIGHT PANEL INVARIANT
//
// The panel:
//
//   • does NOT own selection
//   • does NOT compute similarity
//   • does NOT evaluate candidates
//   • does NOT infer intelligence
//   • does NOT rank candidates
//   • does NOT apply thresholds
//   • does NOT create relationships
//   • does NOT mutate graph topology
//   • does NOT execute REX
//
// It renders authoritative intelligence already produced by
// deterministic runtime/computational layers.
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

import {
  useResolveRuntimeState,
} from "../resolve/runtime/ResolveRuntimeContext";

import {
  useWorkspaceRuntime,
} from "../workspace/runtime/WorkspaceRuntimeContext";

import {
  resolveCandidateIntelligenceCollection,
} from "../resolve/intelligence/ResolveCandidateIntelligenceResolver";

import {
  resolveOptionalSelectedCandidateIntelligence,
} from "../resolve/intelligence/ResolveCandidateSelection";

import type {
  ResolveCandidateIntelligence,
  ResolveCandidateDimensionIntelligence,
} from "../resolve/intelligence/ResolveCandidateIntelligenceTypes";

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
    selection:
      graphSelection,
  } = useGraph();

  // ==========================================================
  // CANONICAL RUNTIME STATE
  // ==========================================================
  //
  // React observes these runtimes.
  //
  // React does not own their state.
  //
  // ==========================================================

  const resolveState =
    useResolveRuntimeState();

  const workspaceRuntime =
    useWorkspaceRuntime();

  // ==========================================================
  // GRAPH PROJECTION
  // ==========================================================
  //
  // Existing established-topology path.
  //
  // This remains unchanged by Candidate Intelligence
  // integration.
  //
  // ==========================================================

  const graph =
    useMemo(
      () =>
        buildInvestigationGraph(
          corpus,
          activeWorkspace,
        ),
      [
        corpus,
        activeWorkspace,
      ],
    );

  // ==========================================================
  // ESTABLISHED GRAPH SELECTION INTELLIGENCE
  // ==========================================================

  const graphIntelligence =
    useMemo(
      () =>
        resolveSelectionIntelligence(
          graphSelection,
          graph,
        ),
      [
        graphSelection,
        graph,
      ],
    );

  // ==========================================================
  // WORKSPACE OPERATOR SELECTION
  // ==========================================================
  //
  // WorkspaceRuntime owns canonical operator selection.
  //
  // Calling getSelection() performs no computation.
  //
  // WorkspaceRuntimeContext publishes revisions, causing this
  // component to render again whenever runtime state changes.
  //
  // ==========================================================

  const workspaceSelection =
    workspaceRuntime.getSelection();

  // ==========================================================
  // LATEST COMPLETE RESOLVE PRODUCT
  // ==========================================================
  //
  // Candidate evaluations are produced by ResolveEngine and
  // preserved through ResolveRuntime publication.
  //
  // The RightPanel does not produce or modify them.
  //
  // ==========================================================

  const candidateEvaluations =
    resolveState
      .currentExecution
      ?.result
      ?.candidateEvaluations;

  // ==========================================================
  // CANDIDATE INTELLIGENCE PROJECTION
  // ==========================================================
  //
  //                  E -> Ic
  //
  // This resolver is a deterministic explanatory projection.
  //
  // It does NOT recompute similarity.
  // It does NOT assert relationships.
  //
  // ==========================================================

  const candidateIntelligenceCollection =
    useMemo(
      () => {

        if (
          candidateEvaluations ===
          undefined
        ) {

          return undefined;

        }

      return resolveCandidateIntelligenceCollection(
  candidateEvaluations.evaluations,
);

      },
      [
        candidateEvaluations,
      ],
    );

  // ==========================================================
  // SELECTED CANDIDATE INTELLIGENCE
  // ==========================================================
  //
  //                 Ic -> Sc -> Ic
  //
  // Workspace selection identifies which authoritative
  // Candidate Intelligence object the operator is inspecting.
  //
  // NODE / EDGE / NONE selections deliberately resolve no
  // Candidate Intelligence.
  //
  // ==========================================================

  const selectedCandidateIntelligence =
    useMemo(
      () =>
        resolveOptionalSelectedCandidateIntelligence(
          workspaceSelection,
          candidateIntelligenceCollection
            ?.intelligence ??
            [],
        ),
      [
        workspaceSelection,
        candidateIntelligenceCollection,
      ],
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
      {/* RESOLVE CANDIDATE                                    */}
      {/* ===================================================== */}
      {selectedCandidateIntelligence !==
        undefined && (

        <CandidateInspector
          intelligence={
            selectedCandidateIntelligence
          }
        />

      )}

      {/* ===================================================== */}
      {/* LEGACY / ESTABLISHED GRAPH INTELLIGENCE              */}
      {/* ===================================================== */}
      {selectedCandidateIntelligence ===
        undefined && (
        <>

          {/* ================================================= */}
          {/* NONE                                              */}
          {/* ================================================= */}

          {graphIntelligence.kind ===
            "NONE" && (

            <EmptySelection />

          )}

          {/* ================================================= */}
          {/* NODE                                              */}
          {/* ================================================= */}

          {graphIntelligence.kind ===
            "NODE" && (

            <NodeInspector
              intelligence={
                graphIntelligence.intelligence
              }
            />

          )}

          {/* ================================================= */}
          {/* EDGE                                              */}
          {/* ================================================= */}

          {graphIntelligence.kind ===
            "EDGE" && (

            <EdgeInspector
              intelligence={
                graphIntelligence.intelligence
              }
            />

          )}

          {/* ================================================= */}
          {/* CLUSTER                                           */}
          {/* ================================================= */}

          {graphIntelligence.kind ===
            "CLUSTER" && (

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
                {graphIntelligence.clusterId}
              </div>
            </div>

          )}

        </>
      )}

    </div>

  );

}

// ============================================================
// CANDIDATE INSPECTOR
// ============================================================
//
// First operator-visible projection of:
//
//   U -> M -> C -> E -> Ic -> Sc -> Ic -> WHY
//
// Everything displayed here already exists in authoritative
// Candidate Intelligence.
//
// This component calculates no similarity.
//
// ============================================================

function CandidateInspector({
  intelligence,
}: {
  intelligence:
    ResolveCandidateIntelligence;
}) {

  const {
    identity,
    explanation,
  } = intelligence;

  return (

    <div>

      {/* ===================================================== */}
      {/* POTENTIAL RELATIONSHIP                               */}
      {/* ===================================================== */}

      <InspectorSection
        title="Potential Relationship"
      >

        <div
          style={{
            marginBottom: 14,

            color: "#f8fafc",

            fontSize: 13,
            fontWeight: 700,

            lineHeight: 1.5,
          }}
        >
          {identity.leftKnowledgeObjectId}

          <div
            style={{
              padding: "7px 0",

              color: "#60a5fa",

              fontSize: 11,
              fontWeight: 700,

              textTransform:
                "uppercase",

              letterSpacing: 0.8,
            }}
          >
            ↕ Potential relationship
          </div>

          {identity.rightKnowledgeObjectId}
        </div>

        <IntelRow
          label="Status"
          value={
            formatLabel(
              intelligence.epistemicStatus,
            )
          }
        />

        <IntelRow
          label="Intelligence"
          value={
            formatLabel(
              intelligence.kind,
            )
          }
        />

      </InspectorSection>

      {/* ===================================================== */}
      {/* AGGREGATE                                            */}
      {/* ===================================================== */}

      <InspectorSection
        title="Similarity"
      >

        <PercentRow
          label="Aggregate"
          value={
            explanation
              .aggregate
              .aggregateSimilarity
          }
        />

        <IntelRow
          label="Participating"
          value={
            `${explanation.aggregate.participatingDimensionCount} / ${explanation.aggregate.totalDimensionCount}`
          }
        />

      </InspectorSection>

      {/* ===================================================== */}
      {/* EVIDENCE                                             */}
      {/* ===================================================== */}

      <InspectorSection
        title="Evidence"
      >

        <IntelRow
          label="Available"
          value={
            `${explanation.evidence.availableDimensionCount} / ${explanation.evidence.totalDimensionCount}`
          }
        />

        <IntelRow
          label="Unavailable"
          value={
            explanation
              .evidence
              .unavailableDimensionCount
          }
        />

        {explanation
          .evidence
          .availableDimensions
          .length > 0 && (

          <CandidateDimensionList
            label="Participating"
            dimensions={
              explanation
                .evidence
                .availableDimensions
            }
          />

        )}

        {explanation
          .evidence
          .unavailableDimensions
          .length > 0 && (

          <CandidateDimensionList
            label="Unavailable"
            dimensions={
              explanation
                .evidence
                .unavailableDimensions
            }
          />

        )}

      </InspectorSection>

      {/* ===================================================== */}
      {/* DIMENSIONAL WHY                                      */}
      {/* ===================================================== */}

      <InspectorSection
        title="Dimensions"
      >

        {explanation.dimensions.map(
          dimension => (

            <CandidateDimensionRow
              key={
                dimension.dimension
              }
              intelligence={
                dimension
              }
            />

          )
        )}

      </InspectorSection>

      {/* ===================================================== */}
      {/* RATIONALE                                            */}
      {/* ===================================================== */}

      <InspectorSection
        title="Why"
      >

        {explanation
          .similarityRationale
          .length > 0 ? (

          explanation
            .similarityRationale
            .map(
              (
                rationale,
                index,
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
            No canonical similarity
            rationale available.
          </div>

        )}

      </InspectorSection>

      {/* ===================================================== */}
      {/* TECHNICAL LINEAGE                                    */}
      {/* ===================================================== */}

      <InspectorSection
        title="Canonical Lineage"
      >

        <IntelRow
          label="Candidate ID"
          value={
            identity.candidateId
          }
        />

        <IntelRow
          label="Evaluation ID"
          value={
            identity.evaluationId
          }
        />

        <IntelRow
          label="Left Knowledge"
          value={
            identity.leftKnowledgeObjectId
          }
        />

        <IntelRow
          label="Right Knowledge"
          value={
            identity.rightKnowledgeObjectId
          }
        />

      </InspectorSection>

    </div>

  );

}

// ============================================================
// CANDIDATE DIMENSION ROW
// ============================================================
//
// IMPORTANT:
//
//   UNAVAILABLE != AVAILABLE score 0
//
// The authoritative source object already carries that
// distinction.
//
// We inspect it.
//
// We do not reinterpret it.
//
// ============================================================

function CandidateDimensionRow({
  intelligence,
}: {
  intelligence:
    ResolveCandidateDimensionIntelligence;
}) {

  const source =
    intelligence.source;

  const score =
    "score" in source &&
    typeof source.score ===
      "number"
      ? source.score
      : undefined;

  return (

    <div
      style={{
        padding: "9px 0",

        borderBottom:
          "1px solid #182235",
      }}
    >

      <div
        style={{
          display: "flex",

          justifyContent:
            "space-between",

          alignItems:
            "flex-start",

          gap: 12,
        }}
      >

        <div
          style={{
            color: "#e2e8f0",

            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {formatLabel(
            intelligence.dimension,
          )}
        </div>

        <div
          style={{
            color:
              score !== undefined
                ? "#e5e7eb"
                : "#64748b",

            fontSize: 11,
            fontWeight: 600,

            textAlign: "right",
          }}
        >

          {score !== undefined
            ? `${(
                score *
                100
              ).toFixed(1)}%`
            : formatLabel(
                intelligence.status,
              )}

        </div>

      </div>

      <div
        style={{
          marginTop: 4,

          color: "#64748b",

          fontSize: 10,

          textTransform:
            "uppercase",

          letterSpacing: 0.5,
        }}
      >
        {formatLabel(
          intelligence.status,
        )}
      </div>

    </div>

  );

}

// ============================================================
// CANDIDATE DIMENSION LIST
// ============================================================

function CandidateDimensionList({
  label,
  dimensions,
}: {
  label:
    string;

  dimensions:
    readonly string[];
}) {

  return (

    <div
      style={{
        marginTop: 10,
      }}
    >

      <div
        style={{
          marginBottom: 4,

          color: "#64748b",

          fontSize: 10,

          textTransform:
            "uppercase",

          letterSpacing: 0.5,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#cbd5e1",

          fontSize: 11,
          lineHeight: 1.5,
        }}
      >
        {dimensions
          .map(
            formatLabel,
          )
          .join(", ")}
      </div>

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
        Select a node, edge, or
        Resolve candidate to inspect
        its intelligence.
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
      {/* NODE                                                  */}
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
      {/* METADATA                                              */}
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
      {/* TECHNICAL                                             */}
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

// ============================================================
// END
// ============================================================