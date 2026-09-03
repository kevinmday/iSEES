import { useMemo } from "react";
import { useResolveRuntimeState } from "../../resolve/runtime/ResolveRuntimeContext";
import { projectTimelineCorrespondences, projectTimelineTemporal, TimelineTemporalProjectionStatus, type TimelineCorrespondence, type TimelineTemporalItem } from "../projection";
import { useTimelineInspection } from "../context/TimelineInspectionContext";
import { presentTimelinePrecision, presentTimelineSemantic, presentTimelineTemporalValue } from "../presentation/TimelineTemporalPresentation";
import { TimelineCompositionKind, resolveTimelineComposition } from "../presentation/TimelineComposition";
import "./TimelineWorkspace.css";

function State({ title, message }: { title: string; message: string }) {
  return <section className="timeline-workspace__state" role="status"><p className="timeline-workspace__eyebrow">TIMELINE</p><h2>{title}</h2><p>{message}</p></section>;
}

function TimelineItemButton({ item, selected, compact, onInspect }: { item: TimelineTemporalItem; selected: boolean; compact: boolean; onInspect: () => void }) {
  return <li className={`timeline-workspace__entry${compact ? " timeline-workspace__entry--pairwise" : ""}`}><button type="button" aria-pressed={selected} onClick={onInspect}><span className="timeline-workspace__time">{presentTimelineTemporalValue(item.temporal)}</span><span className="timeline-workspace__labels"><strong>{presentTimelinePrecision(item)} · {presentTimelineSemantic(item).toLowerCase()}</strong></span><span className="timeline-workspace__source">{item.temporal.kind === "DURATION" ? "Duration band" : "Temporal record"}</span></button></li>;
}

function EventLane({ eventId, role, items, compact = false }: { eventId: string; role: "FOCUSED" | "COMPARED"; items: readonly TimelineTemporalItem[]; compact?: boolean }) {
  const timeline = useTimelineInspection();
  return <section className={`timeline-lane timeline-lane--${role.toLowerCase()}`} aria-label={`${role === "FOCUSED" ? "Focused" : "Compared"} Event ${eventId}`}><button type="button" className="timeline-lane__identity" onClick={() => timeline.inspect({ kind: "LANE", investigationId: timeline.investigation!.id, focusedEventId: timeline.focusedEventId!, comparedEventId: role === "COMPARED" ? eventId : timeline.effectiveCandidate?.comparisonEventId, eventId, role })}><span>{role === "FOCUSED" ? "Focused Event" : "Compared Event"}</span><strong>{timeline.eventName(eventId)}</strong><code>{eventId}</code></button>{items.length === 0 ? <div className="timeline-lane__empty"><strong>No admitted temporal records</strong><p>{role === "COMPARED" ? "No time was inferred. Add sourced temporal evidence in EVIDENCE or inspect another qualified comparison." : "No time was inferred from identity or prose."}</p></div> : <ol>{items.map(item => <TimelineItemButton key={item.itemId} item={item} compact={compact} selected={timeline.inspection?.kind === "ITEM" && timeline.inspection.item.itemId === item.itemId} onInspect={() => timeline.inspect({ kind: "ITEM", investigationId: timeline.investigation!.id, focusedEventId: timeline.focusedEventId!, comparedEventId: role === "COMPARED" ? eventId : timeline.effectiveCandidate?.comparisonEventId, item })} />)}</ol>}</section>;
}

function CorrespondenceColumn({ values }: { values: readonly TimelineCorrespondence[] }) {
  const timeline = useTimelineInspection();
  return <section className="timeline-correspondence"><h3>Potential correspondences</h3>{values.length === 0 ? <p>No comparable admitted records.</p> : values.map(value => <button type="button" key={value.correspondenceId} aria-pressed={timeline.inspection?.kind === "CORRESPONDENCE" && timeline.inspection.correspondenceId === value.correspondenceId} onClick={() => timeline.inspect({ kind: "CORRESPONDENCE", investigationId: timeline.investigation!.id, focusedEventId: timeline.focusedEventId!, comparedEventId: timeline.effectiveCandidate!.comparisonEventId, correspondenceId: value.correspondenceId, explanation: value.explanation, status: value.status })}><strong>{value.status === "UNRESOLVED" ? "Comparable · unresolved" : "Unavailable"}</strong><span>{value.explanation}</span></button>)}</section>;
}

export default function TimelineWorkspace() {
  const timeline = useTimelineInspection();
  const resolveState = useResolveRuntimeState();
  const { investigation, focusedEventId, knowledgeObjects } = timeline;
  const focusedRecords = useMemo(() => focusedEventId ? timeline.recordsFor(focusedEventId) : Object.freeze([]), [focusedEventId, investigation, knowledgeObjects]);
  const projection = useMemo(() => projectTimelineTemporal({ investigation, knowledgeObjects, records: focusedRecords }), [focusedRecords, investigation, knowledgeObjects]);
  const pairProjection = useMemo(() => {
    const candidate = timeline.effectiveCandidate;
    if (!investigation || !candidate) return undefined;
    return projectTimelineTemporal({ investigation, knowledgeObjects, records: Object.freeze([...focusedRecords, ...timeline.recordsFor(candidate.comparisonEventId)]), comparisonRequested: true, selection: candidate.selection, currentExecution: resolveState.currentExecution });
  }, [focusedRecords, investigation, knowledgeObjects, resolveState.currentExecution, timeline.effectiveCandidate]);

  if (!investigation) return <main className="timeline-workspace"><State title="No active Investigation" message="Open or create an Investigation before reviewing temporal records." /></main>;
  if (!focusedEventId) return <main className="timeline-workspace"><State title="No focused Event" message="Select an Event in this Investigation to establish timeline ownership." /></main>;
  if (projection.status === TimelineTemporalProjectionStatus.NO_TEMPORAL_RECORDS) return <main className="timeline-workspace"><State title="No admitted temporal records" message="This Event has no semantically admitted occurrence, observation, capture, publication, or knowledge-state time. No date has been inferred from identity or prose." /></main>;
  if (projection.status !== TimelineTemporalProjectionStatus.READY) {
    const detail = "reason" in projection ? projection.reason : "issues" in projection ? projection.issues.join(" ") : undefined;
    return <main className="timeline-workspace"><State title="Timeline unavailable" message={detail ?? `Projection state: ${projection.status}`} /></main>;
  }

  const composition = resolveTimelineComposition({ qualifiedComparisonCount: timeline.candidates.length, selectedComparisonAvailable: Boolean(timeline.effectiveCandidate), overviewRequested: timeline.overviewRequested });
  const pairReady = pairProjection?.status === TimelineTemporalProjectionStatus.READY ? pairProjection : undefined;
  const correspondences = pairReady ? projectTimelineCorrespondences(pairReady.focusedItems, pairReady.comparedItems) : Object.freeze([]);
  return <main className="timeline-workspace">
    <header className="timeline-workspace__header">
      <div><p className="timeline-workspace__eyebrow">TIMELINE</p><h2>{composition === TimelineCompositionKind.PAIRWISE ? "Compare Event histories" : composition === TimelineCompositionKind.MULTI_EVENT_OVERVIEW ? "Event history overview" : "Focused chronology"}</h2><p>{investigation.name} · temporal claims remain evidence-bound</p></div>
    </header>
    {composition === TimelineCompositionKind.FOCUSED_ONLY && <EventLane eventId={focusedEventId} role="FOCUSED" items={projection.focusedItems} />}
    {composition === TimelineCompositionKind.PAIRWISE && pairReady && <div className="timeline-workspace__pair"><EventLane eventId={focusedEventId} role="FOCUSED" items={pairReady.focusedItems} compact /><CorrespondenceColumn values={correspondences} /><EventLane eventId={pairReady.comparedEventId!} role="COMPARED" items={pairReady.comparedItems} compact /></div>}
    {composition === TimelineCompositionKind.PAIRWISE && !pairReady && <State title="Qualified comparison unavailable" message="The comparison could not be resolved safely against the current Investigation and Resolve execution." />}
    {composition === TimelineCompositionKind.MULTI_EVENT_OVERVIEW && <div className="timeline-workspace__overview" aria-label="Qualified Event history overview"><EventLane eventId={focusedEventId} role="FOCUSED" items={projection.focusedItems} />{timeline.candidates.map(option => { const candidateProjection = projectTimelineTemporal({ investigation, knowledgeObjects, records: Object.freeze([...focusedRecords, ...timeline.recordsFor(option.comparisonEventId)]), comparisonRequested: true, selection: option.selection, currentExecution: resolveState.currentExecution }); const items = candidateProjection.status === TimelineTemporalProjectionStatus.READY ? candidateProjection.comparedItems : Object.freeze([]); return <section className="timeline-workspace__overview-lane" key={`${option.candidateId}:${option.evaluationId}`}><button type="button" className="timeline-workspace__overview-choice" onClick={() => timeline.selectCandidate(option)}><span><strong>{timeline.eventName(option.comparisonEventId)}</strong><code>{option.comparisonEventId}</code></span><strong>INSPECT PAIR →</strong></button><EventLane eventId={option.comparisonEventId} role="COMPARED" items={items} /></section>; })}</div>}
  </main>;
}
