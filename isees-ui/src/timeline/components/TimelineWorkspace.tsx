import { useEffect, useMemo, useState } from "react";
import { useKnowledgeObjects } from "../../knowledge/runtime/KnowledgeObjectRuntimeContext";
import { useWorkspaceRuntime } from "../../workspace/runtime/WorkspaceRuntimeContext";
import { projectTimelineTemporal, TimelineTemporalProjectionStatus, type TimelineTemporalItem } from "../projection";
import { adaptFocusedEventTimelineSourceRecords } from "../projection/TimelineSourceRecordAdapter";
import { presentTimelinePrecision, presentTimelineSemantic, presentTimelineTemporalValue } from "../presentation/TimelineTemporalPresentation";
import { presentTimelineComposition, resolveTimelineComposition } from "../presentation/TimelineComposition";
import "./TimelineWorkspace.css";

type Inspection = Readonly<{ investigationId: string; focusedEventId: string; itemId: string }>;

function State({ title, message }: { title: string; message: string }) {
  return <section className="timeline-workspace__state" role="status"><p className="timeline-workspace__eyebrow">TIMELINE</p><h2>{title}</h2><p>{message}</p></section>;
}

function TimelineItemButton({ item, selected, onInspect }: { item: TimelineTemporalItem; selected: boolean; onInspect: () => void }) {
  return <li className="timeline-workspace__entry">
    <button type="button" aria-pressed={selected} onClick={onInspect}>
      <span className="timeline-workspace__time">{presentTimelineTemporalValue(item.temporal)}</span>
      <span className="timeline-workspace__labels"><strong>{presentTimelinePrecision(item)}</strong><span>{presentTimelineSemantic(item)}</span></span>
      <span className="timeline-workspace__source">Source: {item.provenance.sourceType} / {item.provenance.sourceField}</span>
    </button>
  </li>;
}

export default function TimelineWorkspace() {
  const runtime = useWorkspaceRuntime();
  const knowledgeObjects = useKnowledgeObjects();
  const investigation = runtime.getActiveInvestigation();
  const focusedEventId = investigation?.workspace.focused_event_id ?? null;
  const records = useMemo(() => investigation ? adaptFocusedEventTimelineSourceRecords(investigation, knowledgeObjects) : Object.freeze([]), [investigation, knowledgeObjects]);
  const projection = useMemo(() => projectTimelineTemporal({ investigation, knowledgeObjects, records }), [investigation, knowledgeObjects, records]);
  const [inspection, setInspection] = useState<Inspection>();

  useEffect(() => { setInspection(undefined); }, [investigation?.id, focusedEventId]);
  const inspected = projection.status === TimelineTemporalProjectionStatus.READY && inspection?.investigationId === projection.investigationId && inspection.focusedEventId === projection.focusedEventId
    ? projection.focusedItems.find(item => item.itemId === inspection.itemId)
    : undefined;

  if (!investigation) return <main className="timeline-workspace"><State title="No active Investigation" message="Open or create an Investigation before reviewing temporal records." /></main>;
  if (!focusedEventId) return <main className="timeline-workspace"><State title="No focused Event" message="Select an Event in this Investigation to establish timeline ownership." /></main>;
  if (projection.status === TimelineTemporalProjectionStatus.NO_TEMPORAL_RECORDS) return <main className="timeline-workspace"><State title="No admitted temporal records" message="This Event has no semantically admitted occurrence, observation, capture, publication, or knowledge-state time. No date has been inferred from identity or prose." /></main>;
  if (projection.status !== TimelineTemporalProjectionStatus.READY) {
    const detail = "reason" in projection ? projection.reason : "issues" in projection ? projection.issues.join(" ") : undefined;
    return <main className="timeline-workspace"><State title="Timeline unavailable" message={detail ?? `Projection state: ${projection.status}`} /></main>;
  }

  // A13-I2 has not connected canonical qualified comparison intelligence.
  // Imported Investigation membership is not comparison qualification.
  const qualifiedComparisonCount = 0;
  const composition = resolveTimelineComposition(qualifiedComparisonCount);
  return <main className="timeline-workspace">
    <header className="timeline-workspace__header">
      <div><p className="timeline-workspace__eyebrow">TIMELINE / FOCUSED EVENT</p><h2>Focused chronology</h2><p>{investigation.name} · <code>{focusedEventId}</code></p></div>
      <div className="timeline-workspace__composition"><span>Composition</span><strong>{composition}</strong><small>{presentTimelineComposition(composition)}</small></div>
    </header>
    <div className="timeline-workspace__body">
      <section className="timeline-workspace__register" aria-labelledby="timeline-register-title">
        <div className="timeline-workspace__section-heading"><h3 id="timeline-register-title">Temporal record</h3><span>{projection.focusedItems.length} admitted</span></div>
        <ol>{projection.focusedItems.map(item => <TimelineItemButton key={item.itemId} item={item} selected={inspected?.itemId === item.itemId} onInspect={() => setInspection({ investigationId: projection.investigationId, focusedEventId: projection.focusedEventId, itemId: item.itemId })} />)}</ol>
      </section>
      <aside className="timeline-workspace__inspector" aria-label="Timeline item inspection">
        <h3>Inspection</h3>
        {!inspected ? <p>Select a temporal record to inspect its canonical meaning and provenance.</p> : <dl>
          <div><dt>Item identity</dt><dd><code>{inspected.itemId}</code></dd></div>
          <div><dt>Temporal value</dt><dd>{presentTimelineTemporalValue(inspected.temporal)}</dd></div>
          <div><dt>Precision</dt><dd>{presentTimelinePrecision(inspected)}</dd></div>
          <div><dt>Semantic</dt><dd>{presentTimelineSemantic(inspected)}</dd></div>
          <div><dt>Source Event</dt><dd><code>{inspected.eventId}</code></dd></div>
          <div><dt>Provenance</dt><dd>{inspected.provenance.sourceType} · {inspected.provenance.sourceField}</dd></div>
          <div><dt>Canonical subject</dt><dd>{inspected.subject.availability === "AVAILABLE" ? `${inspected.subject.type} · ${inspected.subject.id}` : inspected.subject.reason}</dd></div>
          <div><dt>Evidence / media</dt><dd>{inspected.evidenceReferenceIds.length} / {inspected.mediaReferenceIds.length}</dd></div>
        </dl>}
      </aside>
    </div>
  </main>;
}
