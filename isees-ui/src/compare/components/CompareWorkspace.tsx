import {
  useMemo,
} from "react";

import {
  useKnowledgeObjects,
} from "../../knowledge/runtime/KnowledgeObjectRuntimeContext";

import {
  resolveCandidateIntelligenceCollection,
} from "../../resolve/intelligence/ResolveCandidateIntelligenceResolver";

import type {
  ResolveCandidateDimensionIntelligence,
} from "../../resolve/intelligence/ResolveCandidateIntelligenceTypes";

import {
  useResolveRuntimeState,
} from "../../resolve/runtime/ResolveRuntimeContext";

import {
  useWorkspaceRuntime,
} from "../../workspace/runtime/WorkspaceRuntimeContext";

import {
  resolveComparePairProjection,
} from "../projection/ComparePairProjectionResolver";

import {
  ComparePairProjectionStatus,

  type ComparePairProjectionReady,
  type ComparePairProjectionResult,
} from "../projection/ComparePairProjectionTypes";

const DIMENSION_LABELS = {
  NARRATIVE: "Narrative",
  OBSERVABILITY: "Observability",
  INFRASTRUCTURE: "Infrastructure",
  TOPOLOGY: "Topology",
  GEOGRAPHY: "Geography",
} as const;

type ProjectionState =
  | {
      kind: "RESULT";
      result: ComparePairProjectionResult;
    }
  | {
      kind: "ERROR";
      reason: string;
    };

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function clampMeterPercent(value: number): number {
  return Math.min(100, Math.max(0, value * 100));
}

function technicalReason(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "COMPARE Pair Projection failed with an unknown technical error.";
}

function EmptyState({
  title,
  guidance,
  detail,
}: {
  title: string;
  guidance: string;
  detail?: string;
}) {
  return (
    <section className="compare-workspace__state" aria-labelledby="compare-state-title">
      <div className="compare-workspace__eyebrow">COMPARE / PAIR INSPECTION</div>
      <h2 id="compare-state-title" className="compare-workspace__state-title">{title}</h2>
      <p className="compare-workspace__state-guidance">{guidance}</p>
      {detail && <p className="compare-workspace__technical">{detail}</p>}
    </section>
  );
}

function CaseCard({
  caseLabel,
  role,
  eventId,
  knowledgeObjectId,
  canonicalSide,
  accent,
}: {
  caseLabel: "CASE A" | "CASE B";
  role: "FOCUSED EVENT" | "COMPARISON EVENT";
  eventId: string;
  knowledgeObjectId: string;
  canonicalSide: "LEFT" | "RIGHT";
  accent: "a" | "b";
}) {
  return (
    <article className={`compare-workspace__case compare-workspace__case--${accent}`}>
      <div className="compare-workspace__case-topline">
        <span className="compare-workspace__case-label">{caseLabel}</span>
        <span className="compare-workspace__badge compare-workspace__badge--canonical">CANONICAL</span>
      </div>
      <div className="compare-workspace__case-role">{role}</div>
      <h3 className="compare-workspace__case-event">{eventId}</h3>
      <dl className="compare-workspace__identity-list">
        <div>
          <dt>Knowledge Object</dt>
          <dd>{knowledgeObjectId}</dd>
        </div>
        <div>
          <dt>Canonical side</dt>
          <dd>{canonicalSide}</dd>
        </div>
      </dl>
    </article>
  );
}

function DimensionRow({
  item,
}: {
  item: ResolveCandidateDimensionIntelligence;
}) {
  const label = DIMENSION_LABELS[item.dimension];

  if (item.source.availability === "UNAVAILABLE") {
    return (
      <li className="compare-workspace__dimension compare-workspace__dimension--unavailable">
        <div className="compare-workspace__dimension-heading">
          <h3>{label}</h3>
          <span className="compare-workspace__badge compare-workspace__badge--unavailable">UNAVAILABLE</span>
        </div>
        <p className="compare-workspace__dimension-reason">{item.source.reason}</p>
      </li>
    );
  }

  const textualValue = formatPercent(item.source.similarity);
  const meterPercent = clampMeterPercent(item.source.similarity);

  return (
    <li className="compare-workspace__dimension compare-workspace__dimension--available">
      <div className="compare-workspace__dimension-heading">
        <h3>{label}</h3>
        <span className="compare-workspace__badge compare-workspace__badge--available">AVAILABLE</span>
      </div>
      <div className="compare-workspace__dimension-score">{textualValue}</div>
      <div
        className="compare-workspace__meter"
        role="meter"
        aria-label={`${label} pairwise correspondence`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={item.source.similarity * 100}
        aria-valuetext={textualValue}
      >
        <span
          className="compare-workspace__meter-fill"
          style={{ width: `${meterPercent}%` }}
        />
      </div>
      <div className="compare-workspace__technical">Configured weight: {item.source.weight}</div>
    </li>
  );
}

function ReadyWorkspace({ projection }: { projection: ComparePairProjectionReady }) {
  const caseASide = projection.caseAKnowledgeObjectId === projection.leftKnowledgeObjectId
    ? "LEFT"
    : "RIGHT";
  const caseBSide = projection.caseBKnowledgeObjectId === projection.leftKnowledgeObjectId
    ? "LEFT"
    : "RIGHT";

  return (
    <div className="compare-workspace__content">
      <header className="compare-workspace__pair-heading">
        <div className="compare-workspace__eyebrow">COMPARE / PAIR INSPECTION</div>
        <div className="compare-workspace__heading-line">
          <div>
            <h2 className="compare-workspace__title">
              {projection.focusedEventId} <span aria-hidden="true">↔</span> {projection.comparisonEventId}
            </h2>
            <p className="compare-workspace__subtitle">Deterministic projection of the selected canonical candidate</p>
          </div>
          <span className="compare-workspace__badge compare-workspace__badge--candidate">CANDIDATE</span>
        </div>
        <div className="compare-workspace__technical">Candidate ID: {projection.candidateId}</div>
      </header>

      <section className="compare-workspace__cases" aria-label="Compared canonical cases">
        <CaseCard caseLabel="CASE A" role="FOCUSED EVENT" eventId={projection.focusedEventId} knowledgeObjectId={projection.focusedEventKnowledgeObjectId} canonicalSide={caseASide} accent="a" />
        <CaseCard caseLabel="CASE B" role="COMPARISON EVENT" eventId={projection.comparisonEventId} knowledgeObjectId={projection.comparisonEventKnowledgeObjectId} canonicalSide={caseBSide} accent="b" />
      </section>

      <section className="compare-workspace__section" aria-labelledby="compare-dimensions-title">
        <div className="compare-workspace__section-heading">
          <div className="compare-workspace__section-kicker">PAIRWISE CORRESPONDENCE</div>
          <h2 id="compare-dimensions-title">Dimension correspondence</h2>
        </div>
        <ol className="compare-workspace__dimensions">
          {projection.dimensions.map(item => <DimensionRow key={item.dimension} item={item} />)}
        </ol>
      </section>

      <section className="compare-workspace__section" aria-labelledby="compare-summary-title">
        <div className="compare-workspace__section-heading">
          <div className="compare-workspace__section-kicker">DETERMINISTIC RESULT</div>
          <h2 id="compare-summary-title">Pair summary</h2>
        </div>
        <div className="compare-workspace__summary-grid">
          <div className="compare-workspace__summary-primary">
            <span>Aggregate similarity</span>
            <strong>{formatPercent(projection.aggregate.aggregateSimilarity)}</strong>
            <span className="compare-workspace__badge compare-workspace__badge--available">AVAILABLE</span>
          </div>
          <dl className="compare-workspace__metrics">
            <div><dt>Participating</dt><dd>{projection.aggregate.participatingDimensionCount}</dd></div>
            <div><dt>Total</dt><dd>{projection.aggregate.totalDimensionCount}</dd></div>
            <div><dt>Available</dt><dd>{projection.evidence.availableDimensionCount}</dd></div>
            <div><dt>Unavailable</dt><dd>{projection.evidence.unavailableDimensionCount}</dd></div>
          </dl>
        </div>
        <div className="compare-workspace__epistemic-status">
          <span>Candidate epistemic status</span>
          <strong>{projection.epistemicStatus}</strong>
        </div>
      </section>

      <section className="compare-workspace__section compare-workspace__section--technical" aria-labelledby="compare-lineage-title">
        <div className="compare-workspace__section-heading">
          <div className="compare-workspace__section-kicker">ORDER PRESERVATION</div>
          <h2 id="compare-lineage-title">Canonical lineage</h2>
        </div>
        <dl className="compare-workspace__lineage">
          <div><dt>Candidate ID</dt><dd>{projection.candidateId}</dd></div>
          <div><dt>Evaluation ID</dt><dd>{projection.evaluationId}</dd></div>
          <div><dt>Original left Knowledge Object ID</dt><dd>{projection.leftKnowledgeObjectId}</dd></div>
          <div><dt>Original right Knowledge Object ID</dt><dd>{projection.rightKnowledgeObjectId}</dd></div>
          <div><dt>Case A canonical side</dt><dd>{caseASide}</dd></div>
          <div><dt>Case B canonical side</dt><dd>{caseBSide}</dd></div>
        </dl>
      </section>

      <section className="compare-workspace__boundary" aria-labelledby="compare-boundary-title">
        <div className="compare-workspace__section-kicker">EPISTEMIC BOUNDARY</div>
        <h2 id="compare-boundary-title">Inspection, not assertion</h2>
        <ul>
          <li>One Knowledge graph</li>
          <li>Two canonical EVENT anchors</li>
          <li>One deterministic comparison</li>
          <li>No canonical relationship has been created</li>
        </ul>
      </section>
    </div>
  );
}

export default function CompareWorkspace() {
  const knowledgeObjects = useKnowledgeObjects();
  const resolveState = useResolveRuntimeState();
  const workspaceRuntime = useWorkspaceRuntime();
  const workspace = workspaceRuntime.getWorkspace();
  const selection = workspaceRuntime.getSelection();
  const candidateEvaluations = resolveState.currentExecution?.result?.candidateEvaluations;

  const projectionState = useMemo<ProjectionState>(() => {
    if (candidateEvaluations === undefined) {
      if (!workspace?.focused_event_id) {
        return {
          kind: "RESULT",
          result: resolveComparePairProjection(
            workspace?.focused_event_id,
            knowledgeObjects,
            selection,
            [],
          ),
        };
      }

      return {
        kind: "ERROR",
        reason: "NO_COMPLETED_RESOLVE_CANDIDATE_POPULATION",
      };
    }

    try {
      const candidateIntelligence = resolveCandidateIntelligenceCollection(
        candidateEvaluations.evaluations,
      );

      return {
        kind: "RESULT",
        result: resolveComparePairProjection(
          workspace?.focused_event_id,
          knowledgeObjects,
          selection,
          candidateIntelligence.intelligence,
        ),
      };
    } catch (error) {
      return {
        kind: "ERROR",
        reason: technicalReason(error),
      };
    }
  }, [candidateEvaluations, knowledgeObjects, selection, workspace?.focused_event_id]);

  if (
    candidateEvaluations === undefined &&
    projectionState.kind === "ERROR"
  ) {
    return (
      <main className="compare-workspace">
        <EmptyState title="Resolve candidate population unavailable" guidance="Resolve must complete before a pair can be inspected." detail={projectionState.kind === "ERROR" ? projectionState.reason : undefined} />
      </main>
    );
  }

  if (projectionState.kind === "ERROR") {
    return (
      <main className="compare-workspace">
        <EmptyState title="Pair cannot be projected" guidance="The selected pair state is malformed, stale, ambiguous, unrelated, or outside the canonical EVENT boundary. Inspect the technical reason; the UI has not repaired this state." detail={projectionState.reason} />
      </main>
    );
  }

  switch (projectionState.result.status) {
    case ComparePairProjectionStatus.NO_FOCUSED_EVENT:
      return <main className="compare-workspace"><EmptyState title="No focused EVENT" guidance="Open a canonical case before entering pair comparison." /></main>;
    case ComparePairProjectionStatus.NO_CANDIDATE_SELECTION:
      return <main className="compare-workspace"><EmptyState title="No Resolve candidate selected" guidance="Select a Resolve candidate for deterministic pair inspection. COMPARE will not fabricate or automatically select a case." detail={`Focused EVENT: ${projectionState.result.focusedEventId}`} /></main>;
    case ComparePairProjectionStatus.FOCUSED_EVENT_KNOWLEDGE_UNAVAILABLE:
      return <main className="compare-workspace"><EmptyState title="Focused EVENT Knowledge unavailable" guidance="The I1B projection cannot resolve canonical Knowledge for the focused EVENT. Case A has not been fabricated." detail={`Focused EVENT: ${projectionState.result.focusedEventId}`} /></main>;
    case ComparePairProjectionStatus.READY:
      return <main className="compare-workspace"><ReadyWorkspace projection={projectionState.result} /></main>;
  }
}
