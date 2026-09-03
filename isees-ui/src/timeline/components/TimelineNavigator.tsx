import { useTimelineInspection } from "../context/TimelineInspectionContext";
import { useWorkspaceRuntime } from "../../workspace/runtime/WorkspaceRuntimeContext";
import { WorkspaceMode } from "../../workspace/runtime/WorkspaceRuntimeTypes";
import "./TimelinePanels.css";

export default function TimelineNavigator() {
  const timeline = useTimelineInspection();
  const runtime = useWorkspaceRuntime();
  return <nav className="timeline-panel" aria-labelledby="timeline-navigator-title">
    <header><p>TIMELINE NAVIGATOR</p><h2 id="timeline-navigator-title">Event chronology</h2></header>
    <section><h3>Focused Event</h3><strong>{timeline.focusedEventId ? timeline.eventName(timeline.focusedEventId) : "No focused Event"}</strong>{timeline.focusedEventId && <code>{timeline.focusedEventId}</code>}</section>
    <section><h3>View</h3><p>{timeline.effectiveCandidate ? "Pairwise inspection" : timeline.candidates.length > 1 ? "Multi-event overview" : "Focused chronology"}</p>{timeline.candidates.length > 1 && timeline.effectiveCandidate && <button type="button" className="timeline-panel__back" onClick={timeline.backToOverview}>Back to Overview</button>}</section>
    <section><div className="timeline-panel__heading"><h3>Qualified comparisons</h3><span>{timeline.candidates.length}</span></div>
      {timeline.candidateError ? <p className="timeline-panel__unavailable">Candidate intelligence unavailable: {timeline.candidateError}</p> : timeline.candidates.length === 0 ? <div className="timeline-panel__empty"><strong>No qualified comparisons yet</strong><p>Run Resolve to identify Events that qualify for temporal comparison.</p><button type="button" className="timeline-panel__primary-action" onClick={() => runtime.setActiveMode(WorkspaceMode.MANIFOLD)}>OPEN COMPUTE</button></div> : <div className="timeline-panel__options">{timeline.candidates.map(option => <button type="button" key={`${option.candidateId}:${option.evaluationId}`} aria-pressed={timeline.effectiveCandidate?.candidateId === option.candidateId} onClick={() => timeline.selectCandidate(option)}><strong>{timeline.eventName(option.comparisonEventId)}</strong><code>{option.comparisonEventId}</code><span>{option.participatingDimensionCount}/{option.totalDimensionCount} comparable dimensions · Candidate comparison; not an accepted relationship.</span></button>)}</div>}
    </section>
    <section><h3>Temporal basis</h3><div className="timeline-panel__basis"><button type="button" aria-pressed="true">Event-relative</button><button type="button" disabled title="No admitted historical occurrence instants are available">Historical time unavailable</button></div></section>
    <footer>Candidate inspection does not accept a relationship or alter graph topology. Case intake remains available in EXPLORE.</footer>
  </nav>;
}
