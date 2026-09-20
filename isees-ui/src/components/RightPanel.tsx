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
  useLayoutEffect,
  useMemo,
  useRef,
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
  WorkspaceMode,
} from "../workspace/runtime/WorkspaceRuntimeTypes";
import Tooltip from "./Tooltip";
import {
  formatMetricAvailability,
  type EdgeMetricAvailability,
  type MetricAvailability,
} from "../manifold/selection/selectionIntelligenceResolver";

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

import {
  ResolveCandidateAcceptanceState,
  resolveCandidateAcceptanceState,
  type ResolveCandidateAcceptanceStateResult,
} from "../resolve/acceptance/ResolveCandidateAcceptance";

import {
  resolveCoherentInvestigationSelection,
  resolveCurrentInvestigationExecution,
} from "../intelligence/selection/InvestigationSelectionCoherence";
import {
  resolveCurrentOperationalRevision,
} from "../investigation/revision/OperationalGraphRevision";
import { RexExploreControl } from "../rex/RexExploreControl.tsx";
import type {
  EntityEvidenceProfile,
  EntityProvenanceProfile,
  GraphEdgeIntelligence,
  GraphNodeIntelligence,
  IntelligenceFieldAvailability,
  EntityDossierProjection,
} from "../graph/graphInteractionTypes";

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

  const investigation =
    workspaceRuntime.getActiveInvestigation();

  const workspaceSelection =
    resolveCoherentInvestigationSelection(
      investigation,
      knowledgeObjects,
      workspaceRuntime.getSelection(),
    );

  const currentRevision =
    useMemo(
      () => {
        if (!investigation) return undefined;
        try {
          return resolveCurrentOperationalRevision(investigation);
        } catch {
          return undefined;
        }
      },
      [
        investigation,
      ],
    );

  // ==========================================================
  // ESTABLISHED CANONICAL GRAPH INTELLIGENCE
  // ==========================================================

  const investigationId =
    investigation?.id;

  const currentRevisionId =
    currentRevision?.id;

  const currentRevisionGraph =
    currentRevision?.manifold.graph;

  const graphIntelligence =
    useMemo(
      () =>
        investigation === undefined ||
        currentRevisionGraph === undefined ||
        investigationId === undefined ||
        currentRevisionId === undefined
          ? resolveCanonicalSelectionIntelligence({
              graph: {
                nodes: [],
                edges: [],
                statistics: {
                  nodeCount: 0,
                  edgeCount: 0,
                  eventCount: 0,
                  facilityCount: 0,
                  artifactCount: 0,
                  personCount: 0,
                  organizationCount: 0,
                  locationCount: 0,
                  narrativeCount: 0,
                  hypothesisCount: 0,
                },
              },
              selection: workspaceSelection,
            })
          : resolveCanonicalSelectionIntelligence({
              graph: currentRevisionGraph,
              selection: workspaceSelection,
              investigationId,
              manifoldRevisionId: currentRevisionId,
            }),
      [
        investigation,
        investigationId,
        currentRevisionId,
        currentRevisionGraph,
        workspaceSelection,
      ],
    );

  // ==========================================================
  // LATEST COMPLETE RESOLVE PRODUCT
  // ==========================================================

  const currentExecution =
    resolveCurrentInvestigationExecution(
      investigation,
      resolveState.currentExecution,
    );

  const candidateEvaluations =
    currentExecution
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

  const selectedCandidateAcceptance =
    useMemo(
      () => selectedCandidateIntelligence === undefined
        ? undefined
        : resolveCandidateAcceptanceState(
            selectedCandidateIntelligence,
            knowledgeObjects,
          ),
      [selectedCandidateIntelligence, knowledgeObjects],
    );

  const selectionScrollIdentity = selectedCandidateIntelligence === undefined
    ? graphIntelligence.kind === "NODE"
      ? `NODE:${graphIntelligence.intelligence.nodeId}`
      : graphIntelligence.kind === "EDGE"
        ? `EDGE:${graphIntelligence.intelligence.edgeId}`
        : graphIntelligence.kind === "CLUSTER"
          ? `CLUSTER:${graphIntelligence.clusterId}`
          : "NONE"
    : JSON.stringify([
        "CANDIDATE",
        selectedCandidateIntelligence.identity.candidateId,
        selectedCandidateIntelligence.identity.evaluationId,
        selectedCandidateIntelligence.identity.leftKnowledgeObjectId,
        selectedCandidateIntelligence.identity.rightKnowledgeObjectId,
      ]);

  const projectionRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scrollContainer = projectionRef.current?.closest(
      ".selection-intelligence__body",
    );

    if (scrollContainer instanceof HTMLElement) {
      scrollContainer.scrollTop = 0;
    }
  }, [selectionScrollIdentity]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      ref={projectionRef}
      className="selection-intelligence__projection"
    >

      {/* RESOLVE CANDIDATE */}

      {
        selectedCandidateIntelligence !==
          undefined &&
        selectedCandidateAcceptance !==
          undefined && (
          <CandidateInspector
            intelligence={
              selectedCandidateIntelligence
            }
            acceptance={selectedCandidateAcceptance}
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
                  metricAvailability={graphIntelligence.metricAvailability}
                  hasCompletedResolve={
                    currentExecution?.result !== undefined &&
                    currentExecution.completedAt !== undefined
                  }
                  goToCompare={() =>
                    workspaceRuntime.setActiveMode(WorkspaceMode.COMPARE)
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

      <RexExploreControl selectionBinding={graphIntelligence.kind === "NONE" ? undefined : graphIntelligence.binding} />

    </div>
  );
}

// ============================================================
// CANDIDATE INSPECTOR
// ============================================================

function CandidateInspector({
  intelligence,
  acceptance,
}: {
  intelligence:
    ResolveCandidateIntelligence;
  acceptance:
    ResolveCandidateAcceptanceStateResult;
}) {
  const {
    identity,
    explanation,
  } = intelligence;

  const accepted = acceptance.state === ResolveCandidateAcceptanceState.ACCEPTED;
  const conflict = acceptance.state === ResolveCandidateAcceptanceState.MALFORMED_CONFLICT;
  const relationshipLabel = accepted
    ? "Accepted Relationship"
    : conflict
      ? "Relationship Conflict"
      : "Potential Relationship";

  return (
    <div>

      <InspectorSection
        title={relationshipLabel}
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

            {relationshipLabel}
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
              acceptance.state
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

          {
            accepted && (
              <IntelRow
                label="EDGE ID"
                value={acceptance.relationshipId}
              />
            )
          }

          {
            conflict && (
              <IntelRow
                label="Conflict"
                value={acceptance.message ?? "Malformed canonical relationship state."}
              />
            )
          }
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
// SELECTION-TYPE IDENTITY
// ============================================================

function SelectionTypeIdentity({
  kind,
  definition,
}: {
  kind: "NODE" | "EDGE";
  definition: string;
}) {
  const modifier =
    kind.toLowerCase();

  return (
    <div
      className={[
        "selection-intelligence__selection-type",
        `selection-intelligence__selection-type--${modifier}`,
      ].join(" ")}
      title={`${kind}: ${definition}`}
    >
      <div
        className={
          "selection-intelligence__selection-type-label"
        }
      >
        {kind} SELECTED
      </div>

      <div
        className={
          "selection-intelligence__selection-type-definition"
        }
      >
        {definition}
      </div>

      <div
        className={
          "selection-intelligence__selection-type-actions"
        }
      >
        <span>Single-click: inspect</span>
        <span>Double-click: add to Research Inbox</span>
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
  intelligence: GraphNodeIntelligence;
}) {
  const entity = intelligence.entitySpecific;
  const hiddenRelationships = entity.relationships.totalCount - entity.relationships.returnedCount;
  const subjectNoun = entity.governedDossier.availability === "AVAILABLE" && entity.governedDossier.operationalProfile.profileId === "EVENT"
    ? "event"
    : "entity";
  const roleCopy = {
    ISOLATED: `No established relationships connect this ${subjectNoun} in the active Investigation graph.`,
    TERMINAL: `This ${subjectNoun} is an endpoint in one established Investigation relationship.`,
    CONNECTOR: `This ${subjectNoun} connects multiple established relationships in the active Investigation graph.`,
    HUB: `This ${subjectNoun} has several established relationships in the active Investigation graph.`,
  }[entity.investigationRole];
  return (
    <div
      className={
        "selection-intelligence__inspector selection-intelligence__inspector--node"
      }
    >
      <SelectionTypeIdentity
        kind="NODE"
        definition={
          "A canonical object in the Investigation Graph."
        }
      />

      <InspectorSection title="Selected node">
        <div
          className={
            "selection-intelligence__entity-title"
          }
        >
          {intelligence.title}
        </div>

        <div className="selection-intelligence__rows">
          <IntelRow label="Node type" value={entity.classification.projectedType} />
          <AvailabilityRow label="Canonical type" availability={entity.classification.canonicalType} />
          <AvailabilityRow label="Epistemic status" availability={entity.evidence.epistemicStatus} />
        </div>
      </InspectorSection>

      <GovernedDossierInspector dossier={entity.governedDossier} />

      <InspectorSection title="Why it matters">
        <p className="selection-intelligence__plain-language">{roleCopy}</p>
        <IntelRow label="Investigation role" value={formatLabel(entity.investigationRole)} />
      </InspectorSection>

      <InspectorSection title="Related entities">
        <div className="selection-intelligence__rows">
          <IntelRow label="Established relationships" value={entity.relationships.totalCount} />
          <IntelRow label="Incoming / outgoing" value={`${entity.relationships.incomingCount} / ${entity.relationships.outgoingCount}`} />
        </div>
        {entity.relationships.items.length === 0
          ? <div className="selection-intelligence__muted">No related entities are supplied by the active graph.</div>
          : <div className="selection-intelligence__entity-list">{entity.relationships.items.map(item => <div className="selection-intelligence__entity-card" key={item.edgeId}><div><strong>{item.neighbor.label}</strong><span>{item.neighborClassification.projectedType}</span></div><span>{formatLabel(item.direction)} · {formatLabel(item.relationship)}</span></div>)}</div>}
        {hiddenRelationships > 0 && <p className="selection-intelligence__overflow-notice">{hiddenRelationships} additional relationship{hiddenRelationships === 1 ? " is" : "s are"} not displayed.</p>}
      </InspectorSection>

      <InspectorSection title="Supporting evidence">
        {entity.evidence.candidateEvidenceBoundary === "NON_CANONICAL_REVIEW_ONLY" && <div className="selection-intelligence__review-warning"><strong>NON-CANONICAL / REVIEW ONLY</strong><span>Candidate Evidence requires researcher review and does not change canonical Knowledge.</span></div>}
        <EvidenceRows evidence={entity.evidence} />
      </InspectorSection>

      <InspectorSection title="Provenance">
        <ProvenanceRows provenance={entity.provenance} />
      </InspectorSection>

      <InspectorSection title="Deterministic basis">
        <div className="selection-intelligence__rows">
          <IntelRow label="Connections" value={intelligence.connectionCount} />
          <IntelRow label="Confidence" value={intelligence.confidence === undefined ? "UNAVAILABLE" : `${(intelligence.confidence * 100).toFixed(1)}%`} />
        </div>
        <p className="selection-intelligence__basis-note">Values shown here come from the active Investigation graph. No Selection Intelligence evaluator or equation is claimed.</p>
      </InspectorSection>

      <InspectorSection title="Restrictions">
        <Restrictions evidence={entity.evidence} provenance={entity.provenance} />
      </InspectorSection>

      <InspectorSection
        title="Technical"
        technical
      >
        <div className="selection-intelligence__rows">
          <IntelRow
            label="Node ID"
            value={entity.identity.id}
          />
        </div>
      </InspectorSection>
    </div>
  );
}

// ============================================================
// EDGE INSPECTOR
// ============================================================

function dossierFactValue(fact: Extract<EntityDossierProjection, { availability: "AVAILABLE" }>["acceptedFacts"][number]): string {
  const value = fact.value;
  if (fact.predicate === "event_classification" && value.valueType === "STRING" && value.value === "multi_sensor_naval_event") return "Multi-Sensor Naval Event";
  if (fact.predicate === "observability_profile" && value.valueType === "STRING" && value.value === "multi_sensor") return "Multi-Sensor";
  return value.valueType === "NUMBER" && value.unit !== undefined ? `${value.value} ${value.unit}` : String(value.value);
}

const DOSSIER_SECTION_LABELS: Readonly<Record<string, string>> = Object.freeze({
  IDENTITY: "Identity",
  OPERATIONAL_SUMMARY: "Operational Summary",
  EVENT_ROLE: "Event-Specific Role",
  CAPABILITIES: "Capabilities",
  LIMITATIONS: "Limitations",
  SPECIFICATIONS: "Specifications",
  SYSTEMS: "Systems",
  ORGANIZATION: "Platform and Organization",
  CHRONOLOGY: "Service History / Chronology",
  EXTERNAL_REFERENCES: "Official External References",
  FACT_LINEAGE: "Sources and Fact-Level Lineage",
  INTELLIGENCE_GAPS: "Unavailable, Not Researched, Stale, or Conflicting Intelligence",
  GOVERNANCE: "Technical Governance Metadata",
});

function DossierFactCard({ fact, dossier }: { fact: Extract<EntityDossierProjection, { availability: "AVAILABLE" }>["acceptedFacts"][number]; dossier: Extract<EntityDossierProjection, { availability: "AVAILABLE" }> }) {
  const links = dossier.sourceLinks.filter(link => link.factId === fact.factId);
  const sources = new Map(dossier.sourceRecords.map(source => [source.sourceRecordId, source]));
  const factContext = fact.temporalQualification.kind === "UNSPECIFIED" ? "GLOBAL ENTITY FACT" : "HISTORICALLY BOUNDED FACT";
  return <div className="selection-intelligence__entity-card">
    <div><strong>{fact.displayLabel ?? formatLabel(fact.predicate)}</strong><span>{dossierFactValue(fact)}</span></div>
    <span>{formatLabel(factContext)} · {formatLabel(fact.applicability ?? "UNAVAILABLE")} · {formatLabel(fact.epistemicClassification)} · {formatLabel(fact.reviewStatus)}</span>
    <details><summary>Source lineage</summary>{links.map(link => { const source = sources.get(link.sourceRecordId); return <div className="selection-intelligence__rows" key={link.sourceLinkId}>
      <IntelRow label="Source" value={source?.sourceTitle ?? "UNAVAILABLE"} />
      <IntelRow label="Authority / publisher" value={source === undefined ? "UNAVAILABLE" : `${source.authority} / ${source.publisher}`} />
      <IntelRow label="Official locator" value={source?.locator ?? source?.repositoryIdentity ?? "UNAVAILABLE"} />
      <IntelRow label="Published / revised" value={source?.publicationTime ?? source?.sourceRevisionLabel ?? "NOT SUPPLIED"} />
      <IntelRow label="Retrieved" value={source?.retrievedAt ?? "UNAVAILABLE"} />
      <IntelRow label="Citation" value={link.citationLocator ?? "NOT SUPPLIED"} />
      <IntelRow label="Relationship" value={formatLabel(link.relationship)} />
      <IntelRow label="Retention" value={source?.retentionState ?? "UNAVAILABLE"} />
      <IntelRow label="Snapshot hash" value={source?.contentHash ?? "UNAVAILABLE"} />
      <IntelRow label="Governing revision" value={link.governingDossierRevisionId ?? dossier.dossierRevisionId} />
    </div>; })}</details>
  </div>;
}

function GovernedDossierInspector({ dossier }: { dossier: EntityDossierProjection }) {
  if (dossier.availability === "UNAVAILABLE") {
    return dossier.reason === "NOT_REFERENCED"
      ? null
      : <InspectorSection title="GOVERNED ENTITY DOSSIER"><IntelRow label="Availability" value={`UNAVAILABLE — ${formatLabel(dossier.reason)}`} /></InspectorSection>;
  }
  const isEventProfile = dossier.operationalProfile.profileId === "EVENT";
  const dossierTitle = isEventProfile ? "GOVERNED EVENT DOSSIER" : "GOVERNED ENTITY DOSSIER";
  const facts = new Map(dossier.acceptedFacts.map(fact => [fact.factId, fact]));
  const relationships = new Map(dossier.relationshipFacts.map(fact => [fact.factId, fact]));
  return <InspectorSection title={dossierTitle}>
    <div className="selection-intelligence__rows">
      <IntelRow label="Availability" value="AVAILABLE" />
      <IntelRow label="Entity" value={dossier.entityIdentity.displayName} />
      {dossier.operationalProfile.profileId === "NAVAL_VESSEL" && <IntelRow label="Hull number" value={dossier.entityIdentity.identifiers.find(item => item.scheme === "US_NAVY_HULL_CLASSIFICATION")?.value ?? "UNAVAILABLE"} />}
      <IntelRow label="Operational profile" value={formatLabel(dossier.operationalProfile.profileId)} />
      <IntelRow label="Classification" value={`${formatLabel(dossier.entityIdentity.entityType)} · ${formatLabel(dossier.entityIdentity.entitySubtype ?? "UNAVAILABLE")}`} />
      <IntelRow label="Governance" value={`GOVERNED · REVIEWED · ${formatLabel(dossier.scope)}`} />
    </div>
    {dossier.operationalProfile.sections.map(section => {
      const title = isEventProfile && section.sectionId === "CHRONOLOGY" ? "Chronology" : DOSSIER_SECTION_LABELS[section.sectionId] ?? formatLabel(section.sectionId);
      if (section.sectionId === "GOVERNANCE") return <div key={section.sectionId}><h4>{title}</h4><div className="selection-intelligence__rows">
        <IntelRow label="Governed revision" value={dossier.dossierRevisionId} /><IntelRow label="Governed storage-envelope schema" value={dossier.schemaVersion} /><IntelRow label="Canonical identity" value={dossier.entityIdentity.canonicalEntityId} /><IntelRow label="Profile resolution" value={formatLabel(dossier.operationalProfile.resolutionBasis)} /><IntelRow label="Investigation binding" value={dossier.binding.investigationId} /><IntelRow label="Manifold revision" value={dossier.binding.manifoldRevisionId} /><IntelRow label="Node binding" value={dossier.binding.nodeId} /><IntelRow label="Content hash" value={dossier.binding.effectiveDossierHash} /><IntelRow label="Projection fingerprint" value={dossier.projectionFingerprint} />
      </div></div>;
      if (section.sectionId === "INTELLIGENCE_GAPS") return <div key={section.sectionId}><h4>{title}</h4><div className="selection-intelligence__entity-list">{dossier.unavailableCategories.map(field => <div className="selection-intelligence__entity-card" key={field.field}><div><strong>{formatLabel(field.field)}</strong><span>{formatLabel(field.state)}</span></div></div>)}</div></div>;
      if (section.sectionId === "FACT_LINEAGE") return <div key={section.sectionId}><h4>{title}</h4><div className="selection-intelligence__rows"><IntelRow label="Official sources" value={dossier.sourceRecords.length} /><IntelRow label="Exact fact-source links" value={dossier.sourceLinks.length} /></div></div>;
      const visibleFactIds = isEventProfile && section.sectionId === "IDENTITY"
        ? section.factIds.filter(id => facts.get(id)?.predicate !== "event_classification")
        : section.factIds;
      return <div key={section.sectionId}><h4>{title}</h4><IntelRow label="Section status" value={formatLabel(section.state)} />
        {visibleFactIds.length > 0 && <div className="selection-intelligence__entity-list">{visibleFactIds.map(id => facts.get(id)).filter((fact): fact is NonNullable<typeof fact> => fact !== undefined).map(fact => <DossierFactCard key={fact.factId} fact={fact} dossier={dossier} />)}</div>}
        {section.relationshipFactIds.map(id => relationships.get(id)).filter((fact): fact is NonNullable<typeof fact> => fact !== undefined).map(fact => <div className="selection-intelligence__entity-card" key={fact.factId}><div><strong>{fact.displayLabel ?? formatLabel(fact.relationshipType)}</strong><span>{fact.objectEntityId}</span></div><span>Encounter-specific claim · {formatLabel(fact.epistemicClassification)} · {formatLabel(fact.reviewStatus)}</span></div>)}
        {section.availabilityFields.length > 0 && <div className="selection-intelligence__entity-list">{section.availabilityFields.map(field => { const availability = dossier.unavailableCategories.find(item => item.field === field); return <div className="selection-intelligence__entity-card" key={field}><div><strong>{formatLabel(field)}</strong><span>{formatLabel(availability?.state ?? "UNAVAILABLE")}</span></div></div>; })}</div>}
      </div>;
    })}
  </InspectorSection>;
}

function EdgeInspector({
  intelligence,
  metricAvailability,
  hasCompletedResolve,
  goToCompare,
}: {
  intelligence: GraphEdgeIntelligence;
  metricAvailability: EdgeMetricAvailability;
  hasCompletedResolve: boolean;
  goToCompare: () => void;
}) {
  const entity = intelligence.entitySpecific;
  const [source, target] = entity.endpoints;
  const metrics = [
    ["Confidence", metricAvailability.confidence],
    ["Narrative", metricAvailability.narrative],
    ["Observability", metricAvailability.observability],
    ["Infrastructure", metricAvailability.infrastructure],
    ["Topology", metricAvailability.topology],
    ["Geo", metricAvailability.geo],
  ] as const;
  const hasUnavailableMetrics = metrics.some(([, availability]) =>
    availability.status === "UNAVAILABLE"
  );
  const unavailableExplanation = hasCompletedResolve
    ? "This metric is unavailable, not zero. An applicable metric input was not supplied for this relationship. No automatic action is safe."
    : "This metric is unavailable, not zero. No completed Resolve computation exists for the active investigation revision. Select a comparison candidate and run Resolve.";

  return (
    <div
      className={
        "selection-intelligence__inspector selection-intelligence__inspector--edge"
      }
    >
      <SelectionTypeIdentity
        kind="EDGE"
        definition={
          "A canonical relationship connecting two nodes."
        }
      />

      <InspectorSection title="Selected edge">
        <div className="selection-intelligence__entity-title">{formatLabel(entity.semantics.relationship)}</div>
        <div className="selection-intelligence__rows">
          <IntelRow label="Direction" value={`${source.identity.label} → ${target.identity.label}`} />
          <AvailabilityRow label="Epistemic status" availability={entity.evidence.epistemicStatus} />
        </div>
      </InspectorSection>

      <InspectorSection title="Endpoint profiles">
        <div className="selection-intelligence__relationship">
          <div
            className={
              "selection-intelligence__relationship-role"
            }
          >
            Source node
          </div>

          <div
            className={
              "selection-intelligence__relationship-object"
            }
          >
            {source.identity.label}
          </div>
          <span className="selection-intelligence__endpoint-meta">{source.classification.projectedType} · {source.identity.id}</span>

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

            <span>
              <span
                className={
                  "selection-intelligence__relationship-role"
                }
              >
                Edge
              </span>

              {
                formatLabel(entity.semantics.relationship)
              }
            </span>
          </div>

          <div
            className={
              "selection-intelligence__relationship-role"
            }
          >
            Target node
          </div>

          <div
            className={
              "selection-intelligence__relationship-object"
            }
          >
            {target.identity.label}
          </div>
          <span className="selection-intelligence__endpoint-meta">{target.classification.projectedType} · {target.identity.id}</span>
        </div>
      </InspectorSection>

      <InspectorSection title="Relationship meaning">
        <p className="selection-intelligence__plain-language">The active graph supplies a directed {formatLabel(entity.semantics.relationship).toLocaleLowerCase()} relationship from the source entity to the target entity.</p>
      </InspectorSection>

      <InspectorSection title="Supporting evidence">
        <EvidenceRows evidence={entity.evidence} />
      </InspectorSection>

      <InspectorSection title="Provenance">
        <ProvenanceRows provenance={entity.provenance} />
      </InspectorSection>

      <InspectorSection title="Deterministic basis">
        <div className="selection-intelligence__rows">
          <AvailabilityRow label="Graph weight" availability={entity.weight} format={value => String(value)} />
        </div>
        <p className="selection-intelligence__basis-note">Graph weight and metrics are displayed as supplied. No evaluator definition or equation is registered here.</p>
      </InspectorSection>

      <InspectorSection title="Metrics">
        <div className="selection-intelligence__rows">
          {metrics.map(([label, availability]) => (
            <MetricAvailabilityRow
              key={label}
              label={label}
              availability={availability}
              unavailableExplanation={unavailableExplanation}
            />
          ))}
        </div>
        {hasUnavailableMetrics && (
          <div className="selection-intelligence__empty">
            <div className="selection-intelligence__empty-title">
              Metric intelligence incomplete
            </div>
            <div className="selection-intelligence__empty-copy">
              {hasCompletedResolve
                ? "This edge contains canonical relationship information, but one or more applicable metric inputs are unavailable for the active Manifold revision."
                : "This edge contains canonical relationship information, but applicable metrics have not been computed for the active Manifold revision. Select a comparison candidate and run Resolve."}
            </div>
            {!hasCompletedResolve && (
              <button type="button" onClick={goToCompare}>
                Go to Compare
              </button>
            )}
          </div>
        )}
      </InspectorSection>

      <InspectorSection title="Deterministic rationale">
        <RationaleList
          rationale={entity.rationale}
          emptyMessage={
            "No relationship rationale available."
          }
        />
      </InspectorSection>

      <InspectorSection title="Restrictions">
        <Restrictions evidence={entity.evidence} provenance={entity.provenance} />
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

function MetricAvailabilityRow({
  label,
  availability,
  unavailableExplanation,
}: {
  label: string;
  availability: MetricAvailability;
  unavailableExplanation: string;
}) {
  if (availability.status === "AVAILABLE") {
    return <IntelRow label={label} value={formatMetricAvailability(availability)} />;
  }

  const accessibleName = `Explain unavailable ${label} metric. ${unavailableExplanation}`;
  return (
    <IntelRow
      label={label}
      value={(
        <>
          {formatMetricAvailability(availability)}{" "}
          <Tooltip text={unavailableExplanation} placement="left">
            <button type="button" aria-label={accessibleName}>i</button>
          </Tooltip>
        </>
      )}
    />
  );
}

function AvailabilityRow<T extends string | number>({
  label,
  availability,
  format = value => String(value),
}: {
  label: string;
  availability: IntelligenceFieldAvailability<T>;
  format?: (value: T) => string;
}) {
  return <IntelRow label={label} value={availability.status === "AVAILABLE" ? format(availability.value) : "UNAVAILABLE"} />;
}

function describeLineage(value: Readonly<Record<string, unknown>> | readonly unknown[]): string {
  if (Array.isArray(value)) return `${value.length} supplied lineage item${value.length === 1 ? "" : "s"}`;
  const keys = Object.keys(value).sort();
  return keys.length === 0 ? "Supplied (empty)" : `Supplied fields: ${keys.join(", ")}`;
}

function ProvenanceRows({ provenance }: { provenance: EntityProvenanceProfile }) {
  return <div className="selection-intelligence__rows">
    <AvailabilityRow label="Source" availability={provenance.sourceType} />
    <AvailabilityRow label="Source identity" availability={provenance.sourceId} />
    <AvailabilityRow label="Source revision" availability={provenance.sourceRevision} />
    <AvailabilityRow label="Knowledge revision" availability={provenance.knowledgeRevision} />
    <IntelRow label="Lineage" value={provenance.lineage.status === "AVAILABLE" ? describeLineage(provenance.lineage.value) : "UNAVAILABLE"} />
  </div>;
}

function EvidenceRows({ evidence }: { evidence: EntityEvidenceProfile }) {
  return <div className="selection-intelligence__rows">
    <AvailabilityRow label="Classification" availability={evidence.knowledgeClassification} />
    <AvailabilityRow label="Review status" availability={evidence.reviewStatus} />
    <AvailabilityRow label="Canon effect" availability={evidence.canonEffect} />
  </div>;
}

function Restrictions({ evidence, provenance }: { evidence: EntityEvidenceProfile; provenance: EntityProvenanceProfile }) {
  const sourceUnavailable = provenance.sourceId.status === "UNAVAILABLE" && provenance.sourceType.status === "UNAVAILABLE";
  return <div className="selection-intelligence__restriction-list">
    {evidence.candidateEvidenceBoundary === "NON_CANONICAL_REVIEW_ONLY" && <p>Researcher review is required. This selection does not establish canonical Knowledge.</p>}
    {evidence.canonEffect.status === "AVAILABLE" && <p>Canon effect: {evidence.canonEffect.value}.</p>}
    {sourceUnavailable && <p>Source provenance is unavailable in the active graph; no source claim is inferred.</p>}
    {evidence.candidateEvidenceBoundary === "CANONICAL_OR_UNSPECIFIED" && !sourceUnavailable && evidence.canonEffect.status === "UNAVAILABLE" && <p>No additional restriction is supplied by the active graph.</p>}
  </div>;
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
    number |
    ReactNode;
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
        {typeof value === "string" || typeof value === "number"
          ? String(value)
          : value}
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

// ============================================================
// END
// ============================================================
