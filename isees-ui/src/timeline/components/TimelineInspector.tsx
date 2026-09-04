import { presentTimelinePrecision, presentTimelineSemantic, presentTimelineTemporalValue } from "../presentation/TimelineTemporalPresentation";
import { useTimelineInspection } from "../context/TimelineInspectionContext";
import "./TimelinePanels.css";
import { useState } from "react";
import { useResearchBridge } from "../../research/ResearchBridgeContext";
import { timelineCorrespondenceResearchAnchor, timelineMomentResearchAnchor } from "../../studio/sources/TypedResearchSourceAdapters";
import { collectTypedResearchSource } from "../../studio/sources/DirectResearchPublication";

export default function TimelineInspector() {
  const { inspection, eventName, investigation } = useTimelineInspection();
  const research = useResearchBridge();
  const [feedback, setFeedback] = useState<string>();
  const revisionId = investigation?.currentRevisionId;
  const projectionId = revisionId ? `timeline:${revisionId}` : undefined;
  return <aside className="timeline-panel timeline-inspector" aria-labelledby="timeline-inspector-title"><header><p>TIMELINE INSPECTOR</p><h2 id="timeline-inspector-title">Temporal context</h2></header>
    {!inspection ? <p>Select a temporal record, Event lane, or correspondence to inspect its provenance and supporting evidence.</p> : inspection.kind === "ITEM" ? <>
      <section><h3>{presentTimelineSemantic(inspection.item)} record</h3><strong>{presentTimelineTemporalValue(inspection.item.temporal)}</strong><p>{presentTimelinePrecision(inspection.item)} · {eventName(inspection.item.eventId)}</p></section>
      <section><h3>Supporting material</h3><p>{inspection.item.evidenceReferenceIds.length} evidence · {inspection.item.mediaReferenceIds.length} media</p></section>
      <section><h3>Canonical subject</h3>{inspection.item.subject.availability === "AVAILABLE" ? <p>{inspection.item.subject.type} available for future Research publication.</p> : <><strong>Research publication unavailable</strong><p>This temporal record is not linked to a unique canonical NODE or EDGE.</p></>}</section>
      <details><summary>Technical details and provenance</summary><dl><div><dt>Item identity</dt><dd><code>{inspection.item.itemId}</code></dd></div><div><dt>Source Event</dt><dd><code>{inspection.item.eventId}</code></dd></div><div><dt>Source</dt><dd>{inspection.item.provenance.sourceType} · {inspection.item.provenance.sourceField}</dd></div></dl></details>
      <button type="button" onClick={() => setFeedback(collectTypedResearchSource(research, () => timelineMomentResearchAnchor({ investigationId: inspection.investigationId, moment: inspection.item, revisionId: revisionId ?? "", projectionId })).message)}>Add to Research Inbox</button>
    </> : inspection.kind === "LANE" ? <section><h3>{inspection.role === "FOCUSED" ? "Focused" : "Compared"} Event lane</h3><strong>{eventName(inspection.eventId)}</strong><code>{inspection.eventId}</code><p>This lane is an analytical view, not an accepted relationship.</p></section> : <section><h3>Temporal correspondence</h3><strong>{inspection.correspondence.status.replaceAll("_", " ").toLowerCase()}</strong><p>{inspection.correspondence.explanation}</p><p>No canonical relationship or EDGE has been created.</p><button type="button" onClick={() => setFeedback(collectTypedResearchSource(research, () => timelineCorrespondenceResearchAnchor({ investigationId: inspection.investigationId, correspondence: inspection.correspondence, revisionId: revisionId ?? "", projectionId })).message)}>Add to Research Inbox</button></section>}
    {feedback && <p role="status" aria-live="polite">{feedback}</p>}
  </aside>;
}
