import { useMemo } from "react";
import { useKnowledgeObjects } from "../../knowledge/runtime/KnowledgeObjectRuntimeContext";
import { resolveCandidateIntelligenceCollection } from "../../resolve/intelligence/ResolveCandidateIntelligenceResolver";
import { useResolveRuntimeState } from "../../resolve/runtime/ResolveRuntimeContext";
import { useWorkspaceRuntime } from "../../workspace/runtime/WorkspaceRuntimeContext";
import { CompareCandidateOptionProjectionStatus, resolveCompareCandidateOptionProjection, type CompareCandidateOption } from "../projection/CompareCandidateOptionProjection";
import "./CompareSetController.css";
import { resolveCurrentInvestigationExecution } from "../../intelligence/selection/InvestigationSelectionCoherence";

function percent(value: number): string { return `${(value * 100).toFixed(1)}%`; }
function errorReason(error: unknown): string { return error instanceof Error ? error.message : "Unknown COMPARE Set projection error."; }

function State({ title, detail }: { title: string; detail?: string }) {
  return <section className="compare-set__state"><strong>{title}</strong>{detail && <span>{detail}</span>}</section>;
}

function Aggregate({ option }: { option: CompareCandidateOption }) {
  return option.aggregate.availability === "AVAILABLE"
    ? <span className="compare-set__available">{percent(option.aggregate.similarity)}</span>
    : <span className="compare-set__unavailable">UNAVAILABLE</span>;
}

export default function CompareSetController() {
  const knowledgeObjects = useKnowledgeObjects();
  const resolveState = useResolveRuntimeState();
  const workspaceRuntime = useWorkspaceRuntime();
  const workspace = workspaceRuntime.getWorkspace();
  const investigation = workspaceRuntime.getActiveInvestigation();
  const selection = workspaceRuntime.getSelection();
  const currentExecution = resolveCurrentInvestigationExecution(investigation, resolveState.currentExecution);
  const evaluations = currentExecution?.result?.candidateEvaluations;

  const projected = useMemo(() => {
    try {
      const intelligence = evaluations === undefined
        ? []
        : resolveCandidateIntelligenceCollection(evaluations.evaluations).intelligence;
      return { kind: "RESULT" as const, value: resolveCompareCandidateOptionProjection(workspace?.focused_event_id, knowledgeObjects, intelligence, selection) };
    } catch (error) {
      return { kind: "ERROR" as const, reason: errorReason(error) };
    }
  }, [evaluations, knowledgeObjects, selection, workspace?.focused_event_id]);

  const ready = projected.kind === "RESULT" && projected.value.status === CompareCandidateOptionProjectionStatus.READY
    ? projected.value
    : undefined;
  const selected = ready?.selectedOption;

  return (
    <div className="compare-set">
      <header className="compare-set__header">
        <div className="compare-set__eyebrow">COMPARE SET</div>
        <h2 className="compare-set__title">Pair Inspection</h2>
        <p>Choose an inspectable Resolve candidate while preserving the focused canonical EVENT.</p>
      </header>

      {!investigation ? <State title="No active investigation" detail="COMPARE requires an active canonical investigation." /> : (
        <>
          <section className="compare-set__section">
            <h3>Active Investigation</h3>
            <strong className="compare-set__primary">{investigation.name}</strong>
            <dl className="compare-set__facts">
              <div><dt>Investigation ID</dt><dd>{investigation.id || "UNAVAILABLE"}</dd></div>
              <div><dt>Focused EVENT</dt><dd>{workspace?.focused_event_id || "NONE"}</dd></div>
              <div><dt>Status</dt><dd>{investigation.status}</dd></div>
            </dl>
          </section>

          {projected.kind === "ERROR" && <State title="Malformed or stale projection" detail={projected.reason} />}
          {projected.kind === "RESULT" && projected.value.status === CompareCandidateOptionProjectionStatus.NO_FOCUSED_EVENT && <State title="No focused EVENT" />}
          {projected.kind === "RESULT" && projected.value.status === CompareCandidateOptionProjectionStatus.FOCUSED_EVENT_KNOWLEDGE_UNAVAILABLE && <State title="Focused EVENT Knowledge unavailable" detail={projected.value.focusedEventId} />}
          {projected.kind === "RESULT" && projected.value.status === CompareCandidateOptionProjectionStatus.NO_COMPLETED_CANDIDATES && <State title="No completed Resolve execution" detail="Resolve must complete before candidates can be chosen." />}

          {ready && <>
            <section className="compare-set__case compare-set__case--a">
              <div className="compare-set__case-line"><span className="compare-set__marker">A</span><span className="compare-set__badge compare-set__badge--canonical">CANONICAL</span></div>
              <div className="compare-set__role">FOCUSED EVENT</div>
              <strong>{ready.focusedEventId}</strong>
              <small>{ready.focusedEventKnowledgeObjectId}</small>
              <span className="compare-set__locked">Fixed in this COMPARE set</span>
            </section>

            <section className="compare-set__case compare-set__case--b">
              <div className="compare-set__case-line"><span className="compare-set__marker">B</span>{selected && <span className="compare-set__badge">CANDIDATE</span>}</div>
              <div className="compare-set__role">COMPARISON EVENT</div>
              {selected ? <><strong>{selected.comparisonEventId}</strong><small>{selected.comparisonEventKnowledgeObjectId}</small><Aggregate option={selected} /></> : <span className="compare-set__unselected">No Case B selected</span>}
            </section>

            <section className="compare-set__section">
              <h3>{selected ? "Change Comparison" : "Choose Comparison"}</h3>
              {ready.options.length === 0 ? <State title="Zero eligible comparisons" /> : (
                <div className="compare-set__options">
                  {ready.options.map(option => (
                    <button key={`${option.candidateId}:${option.evaluationId}`} type="button" className={`compare-set__option${option.selected ? " compare-set__option--selected" : ""}`} aria-pressed={option.selected} onClick={() => workspaceRuntime.setSelection(option.selection)}>
                      <span className="compare-set__option-line"><strong>{option.comparisonEventId}</strong><Aggregate option={option} /></span>
                      <span>{option.participatingDimensionCount}/{option.totalDimensionCount} participating</span>
                      <span>{option.availableDimensionCount} available · {option.unavailableDimensionCount} unavailable</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>}

          <section className="compare-set__section">
            <h3>Comparison Context</h3>
            <dl className="compare-set__facts">
              <div><dt>Active layers</dt><dd>{workspaceRuntime.getActiveLayers().length}</dd></div>
              <div><dt>Resolve status</dt><dd>{resolveState.status}</dd></div>
              <div><dt>Total candidates</dt><dd>{evaluations?.candidateCount ?? 0}</dd></div>
              <div><dt>Eligible options</dt><dd>{ready?.options.length ?? 0}</dd></div>
              <div><dt>Scope</dt><dd>Focused EVENT × canonical EVENT</dd></div>
            </dl>
          </section>
        </>
      )}

      <aside className="compare-set__note">No relationship is accepted in COMPARE. Selection opens an inspectable Resolve candidate.</aside>
    </div>
  );
}
