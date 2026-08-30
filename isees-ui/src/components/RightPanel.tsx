// ============================================================
// src/components/RightPanel.tsx
//
// P57-UI-A5
// CANONICAL SELECTION INTELLIGENCE INSPECTOR
//
// Established graph intelligence:
//
//   Canonical Knowledge
//       ↓
//   Canonical Selection Intelligence
//       ↓
//   NODE / EDGE / CLUSTER / NONE
//
// Resolve candidate intelligence:
//
//   Resolve candidate evaluations
//       ↓
//   Candidate Intelligence
//       ↓
//   Workspace candidate selection
//
// Projection precedence:
//
//   Selected Resolve candidate
//       before
//   Established canonical graph selection
//
// Critical epistemic distinction:
//
//   CANDIDATE != EDGE
//
// This component:
//
//   • does not own selection
//   • does not construct topology
//   • does not compute similarity
//   • does not evaluate candidates
//   • does not infer intelligence
//   • does not mutate graph topology
//   • does not execute REX
//   • does not invoke AI
//
// FULL DROP-IN REPLACEMENT
// ============================================================

import {
  useMemo,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  useKnowledgeObjects,
} from "../knowledge/runtime/KnowledgeObjectRuntimeContext";

import {
  resolveCanonicalSelectionIntelligence,
} from "../intelligence/selection/CanonicalSelectionIntelligence";

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
  const knowledgeObjects =
    useKnowledgeObjects();

  // ==========================================================
  // CANONICAL RUNTIME STATE
  // ==========================================================

  const resolveState =
    useResolveRuntimeState();

  const workspaceRuntime =
    useWorkspaceRuntime();

  const workspaceSelection =
    workspaceRuntime.getSelection();

  // ==========================================================
  // ESTABLISHED CANONICAL GRAPH INTELLIGENCE
  // ==========================================================

  const graphIntelligence =
    useMemo(
      () =>
        resolveCanonicalSelectionIntelligence({
          knowledgeObjects,
          selection:
            workspaceSelection,
        }),
      [
        knowledgeObjects,
        workspaceSelection,
      ],
    );

  // ==========================================================
  // LATEST COMPLETE RESOLVE PRODUCT
  // ==========================================================

  const candidateEvaluations =
    resolveState
      .currentExecution
      ?.result
      ?.candidateEvaluations;

  // ==========================================================
  // CANDIDATE INTELLIGENCE PROJECTION
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
    <div className="selection-intelligence__projection">

      {/* RESOLVE CANDIDATE */}

      {
        selectedCandidateIntelligence !==
          undefined && (
          <CandidateInspector
            intelligence={
              selectedCandidateIntelligence
            }
          />
        )
      }

      {/* ESTABLISHED CANONICAL GRAPH INTELLIGENCE */}

      {
        selectedCandidateIntelligence ===
          undefined && (
          <>
            {
              graphIntelligence.kind ===
                "NONE" && (
                <EmptySelection />
              )
            }

            {
              graphIntelligence.kind ===
                "NODE" && (
                <NodeInspector
                  intelligence={
                    graphIntelligence.intelligence
                  }
                />
              )
            }

            {
              graphIntelligence.kind ===
                "EDGE" && (
                <EdgeInspector
                  intelligence={
                    graphIntelligence.intelligence
                  }
                />
              )
            }

            {
              graphIntelligence.kind ===
                "CLUSTER" && (
                <ClusterInspector
                  clusterId={
                    graphIntelligence.clusterId
                  }
                />
              )
            }
          </>
        )
      }

    </div>
  );
}

// ============================================================
// CANDIDATE INSPECTOR
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

      <InspectorSection
        title="Potential Relationship"
      >
        <div className="selection-intelligence__relationship">
          <div
            className={
              "selection-intelligence__relationship-object"
            }
          >
            {identity.leftKnowledgeObjectId}
          </div>

          <div
            className={
              "selection-intelligence__relationship-bridge"
            }
          >
            <span
              className={
                "selection-intelligence__relationship-symbol"
              }
              aria-hidden="true"
            >
              ↕
            </span>

            Potential relationship
          </div>

          <div
            className={
              "selection-intelligence__relationship-object"
            }
          >
            {identity.rightKnowledgeObjectId}
          </div>
        </div>

        <div className="selection-intelligence__rows">
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
        </div>
      </InspectorSection>

      <InspectorSection title="Similarity">
        <div className="selection-intelligence__rows">
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
        </div>
      </InspectorSection>

      <InspectorSection title="Evidence">
        <div className="selection-intelligence__rows">
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
        </div>

        {
          explanation
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
          )
        }

        {
          explanation
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
          )
        }
      </InspectorSection>

      <InspectorSection title="Dimensions">
        {
          explanation.dimensions.map(
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
          )
        }
      </InspectorSection>

      <InspectorSection title="Why">
        <RationaleList
          rationale={
            explanation
              .similarityRationale
          }
          emptyMessage={
            "No canonical similarity rationale available."
          }
        />
      </InspectorSection>

      <InspectorSection
        title="Canonical Lineage"
        technical
      >
        <div className="selection-intelligence__rows">
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
        </div>
      </InspectorSection>

    </div>
  );
}

// ============================================================
// CANDIDATE DIMENSION ROW
//
// UNAVAILABLE != AVAILABLE score 0
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

  const scoreClassName = [
    "selection-intelligence__dimension-score",
    score === undefined
      ? "selection-intelligence__dimension-score--unavailable"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="selection-intelligence__dimension">
      <div
        className={
          "selection-intelligence__dimension-header"
        }
      >
        <div
          className={
            "selection-intelligence__dimension-name"
          }
        >
          {
            formatLabel(
              intelligence.dimension,
            )
          }
        </div>

        <div className={scoreClassName}>
          {
            score !== undefined
              ? `${(
                  score * 100
                ).toFixed(1)}%`
              : formatLabel(
                  intelligence.status,
                )
          }
        </div>
      </div>

      <div
        className={
          "selection-intelligence__dimension-status"
        }
      >
        {
          formatLabel(
            intelligence.status,
          )
        }
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
  label: string;
  dimensions:
    readonly string[];
}) {
  return (
    <div
      className={
        "selection-intelligence__dimension-list"
      }
    >
      <div
        className={
          "selection-intelligence__dimension-list-label"
        }
      >
        {label}
      </div>

      <div
        className={
          "selection-intelligence__dimension-list-values"
        }
      >
        {
          dimensions
            .map(
              formatLabel,
            )
            .join(", ")
        }
      </div>
    </div>
  );
}

// ============================================================
// EMPTY SELECTION
// ============================================================

function EmptySelection() {
  return (
    <div className="selection-intelligence__empty">
      <div
        className={
          "selection-intelligence__empty-eyebrow"
        }
      >
        Inspector ready
      </div>

      <div
        className={
          "selection-intelligence__empty-title"
        }
      >
        Nothing selected
      </div>

      <div
        className={
          "selection-intelligence__empty-copy"
        }
      >
        Select a node, edge, cluster, or Resolve candidate
        to inspect its deterministic intelligence.
      </div>
    </div>
  );
}

// ============================================================
// CLUSTER PLACEHOLDER
// ============================================================

function ClusterInspector({
  clusterId,
}: {
  clusterId: string;
}) {
  return (
    <div className="selection-intelligence__cluster">
      <div
        className={
          "selection-intelligence__cluster-title"
        }
      >
        Cluster selected
      </div>

      <div
        className={
          "selection-intelligence__cluster-copy"
        }
      >
        Cluster intelligence projection is not yet
        implemented.
      </div>

      <div
        className={
          "selection-intelligence__cluster-id"
        }
      >
        {clusterId}
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
      <InspectorSection title="Node">
        <div
          className={
            "selection-intelligence__entity-title"
          }
        >
          {intelligence.title}
        </div>

        <div className="selection-intelligence__rows">
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
        </div>
      </InspectorSection>

      <InspectorSection title="Metadata">
        <MetadataRows
          metadata={
            intelligence.metadata
          }
        />
      </InspectorSection>

      <InspectorSection
        title="Technical"
        technical
      >
        <div className="selection-intelligence__rows">
          <IntelRow
            label="Node ID"
            value={
              intelligence.nodeId
            }
          />
        </div>
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
      <InspectorSection title="Relationship">
        <div className="selection-intelligence__relationship">
          <div
            className={
              "selection-intelligence__relationship-object"
            }
          >
            {intelligence.sourceLabel}
          </div>

          <div
            className={
              "selection-intelligence__relationship-bridge"
            }
          >
            <span
              className={
                "selection-intelligence__relationship-symbol"
              }
              aria-hidden="true"
            >
              ↓
            </span>

            {
              formatLabel(
                intelligence.relationship
              )
            }
          </div>

          <div
            className={
              "selection-intelligence__relationship-object"
            }
          >
            {intelligence.targetLabel}
          </div>
        </div>
      </InspectorSection>

      <InspectorSection title="Metrics">
        <div className="selection-intelligence__rows">
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
        </div>
      </InspectorSection>

      <InspectorSection title="Rationale">
        <RationaleList
          rationale={
            intelligence.rationale
          }
          emptyMessage={
            "No relationship rationale available."
          }
        />
      </InspectorSection>

      <InspectorSection
        title="Technical"
        technical
      >
        <div className="selection-intelligence__rows">
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
        </div>
      </InspectorSection>
    </div>
  );
}

// ============================================================
// INSPECTOR SECTION
// ============================================================

function InspectorSection({
  title,
  technical = false,
  children,
}: {
  title: string;
  technical?: boolean;
  children: ReactNode;
}) {
  const className = [
    "selection-intelligence__section",
    technical
      ? "selection-intelligence__section--technical"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={className}>
      <h2
        className={
          "selection-intelligence__section-title"
        }
      >
        {title}
      </h2>

      {children}
    </section>
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
      <div className="selection-intelligence__muted">
        No metadata available.
      </div>
    );
  }

  return (
    <div className="selection-intelligence__rows">
      {
        Object.entries(
          metadata
        ).map(
          ([key, value]) => (
            <IntelRow
              key={key}
              label={
                formatLabel(key)
              }
              value={
                formatValue(value)
              }
            />
          )
        )
      }
    </div>
  );
}

// ============================================================
// RATIONALE LIST
// ============================================================

function RationaleList({
  rationale,
  emptyMessage,
}: {
  rationale:
    readonly string[];
  emptyMessage: string;
}) {
  if (rationale.length === 0) {
    return (
      <div className="selection-intelligence__muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={
        "selection-intelligence__rationale-list"
      }
    >
      {
        rationale.map(
          (
            statement,
            index,
          ) => (
            <div
              key={index}
              className={
                "selection-intelligence__rationale"
              }
            >
              {statement}
            </div>
          )
        )
      }
    </div>
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
    <div className="selection-intelligence__row">
      <div
        className={
          "selection-intelligence__row-label"
        }
      >
        {label}
      </div>

      <div
        className={
          "selection-intelligence__row-value"
        }
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