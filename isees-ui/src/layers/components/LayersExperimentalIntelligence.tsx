import { useMemo } from "react";
import { useResearchBridge, useResearchDesk } from "../../research/ResearchBridgeContext";
import { useLayersExperimentState, LayersExperimentStatus } from "../runtime";
import { publishLayersExperimentToResearch } from "../research/LayersExperimentResearchPublication";
import { useLayersPresentationSelection } from "./LayersPresentationSelection";
import "./LayersSideInstruments.css";

const pct = (value?: number) => value === undefined ? "UNAVAILABLE" : `${(value * 100).toFixed(1)}%`;
const unavailableReason = (reason?: string) => reason?.replaceAll("_", " ") ?? "Evidence unavailable for the active baseline layers";
export default function LayersExperimentalIntelligence() {
  const state = useLayersExperimentState();
  const bridge = useResearchBridge();
  const desk = useResearchDesk();
  const { selection, select } = useLayersPresentationSelection();
  const execution = [...state.history].reverse().find(item => item.result?.experimentalManifoldSnapshot);
  const projection = execution?.result?.experimentalManifoldSnapshot;
  const published = !!projection && desk.entries.some(entry => entry.anchor.anchorId === `research:${projection.investigationId}:EXPERIMENT:${projection.projectionId}`);
  const contribution = projection && (selection.kind === "LAYER" || selection.kind === "CONTRIBUTION") ? projection.layerContributions.find(item => item.layerId === selection.layerId) : undefined;
  const canPublish = !!execution?.result && !!projection && execution.executionId === projection.executionId;
  const guidance = state.status === LayersExperimentStatus.EXECUTING ? "Experiment executing. Inspection will update on completion."
    : state.status === LayersExperimentStatus.ERROR ? `Experiment runtime error: ${state.error?.message ?? "unknown error"}`
    : "Prepare and run an experiment to inspect its immutable result.";
  const subjectLabels = useMemo(() => ({ a: state.scope?.focusedEventId ?? projection?.subjects[0].knowledgeObjectId ?? "UNAVAILABLE", b: state.scope?.comparisonEventId ?? projection?.subjects[1].knowledgeObjectId ?? "UNAVAILABLE" }), [projection, state.scope]);
  function publish() {
    if (!canPublish || !execution || !projection) return;
    publishLayersExperimentToResearch({ investigationId: projection.investigationId, caseAEventId: subjectLabels.a, caseBEventId: subjectLabels.b, execution, projection, researchBridgeRuntime: bridge });
  }
  return <aside className="layers-side layers-intelligence" aria-label="Experimental Intelligence">
    <header><span>EXPERIMENTAL INTELLIGENCE</span><h1>NON-CANONICAL</h1><small>INSPECTION + PUBLICATION</small></header>
    <div className="layers-side__tabs" aria-label="Laboratory inspection target">
      <button type="button" aria-pressed={selection.kind === "SUMMARY"} onClick={() => select({ kind: "SUMMARY" })}>Summary</button>
      <button type="button" aria-pressed={selection.kind === "CASE_A"} onClick={() => select({ kind: "CASE_A" })}>Case A</button>
      <button type="button" aria-pressed={selection.kind === "CASE_B"} onClick={() => select({ kind: "CASE_B" })}>Case B</button>
      <button type="button" aria-pressed={selection.kind === "DELTA"} onClick={() => select({ kind: "DELTA" })}>Delta</button>
    </div>
    {!projection ? <section role="status"><h2>Preparation</h2><p>{guidance}</p></section> : <>
      <section><h2>{selection.kind.replaceAll("_", " ")}</h2>
        {contribution ? <><Row label="Layer ID / class" value={`${contribution.layerId} · ${contribution.classification}`}/><Row label="Mapping" value={`${contribution.operationalMappingStatus} · ${contribution.canonicalDimension ?? "UNMAPPED"}`}/><Row label="Availability" value={contribution.availability}/><Row label="Similarity" value={pct(contribution.similarity)}/><Row label="Canonical weight" value={contribution.canonicalWeight ?? "UNAVAILABLE"}/><Row label="Participating weight" value={contribution.participatingWeight}/><Row label="Weighted contribution" value={contribution.availability === "AVAILABLE" ? contribution.weightedContribution : "UNAVAILABLE"}/><Row label="Reason" value={contribution.unavailableReason ?? "—"}/><Row label="Membership" value={`${projection.provenance.baselineLayerIds.includes(contribution.layerId) ? "BASELINE" : "NOT BASELINE"} · ${projection.provenance.experimentalLayerIds.includes(contribution.layerId) ? "EXPERIMENTAL" : "NOT EXPERIMENTAL"}`}/></>
        : selection.kind === "CASE_A" || selection.kind === "CASE_B" ? <Row label={selection.kind === "CASE_A" ? "Case A" : "Case B"} value={selection.kind === "CASE_A" ? subjectLabels.a : subjectLabels.b}/>
        : <><Row label="Baseline" value={pct(projection.delta.baselineScore)}/>{projection.baseline.relationship.availability === "UNAVAILABLE" && <p>{projection.provenance.baselineLayerIds.length === 0 ? "No active baseline layers" : unavailableReason(projection.baseline.relationship.reason)}</p>}<Row label="Experimental" value={pct(projection.delta.experimentalScore)}/><Row label="Delta" value={`${projection.delta.state}${projection.delta.scoreDelta === undefined ? " · NOT MEANINGFUL" : ` · ${projection.delta.scoreDelta >= 0 ? "+" : ""}${(projection.delta.scoreDelta * 100).toFixed(1)} pp`}`}/><Row label="Participating" value={projection.provenance.participatingLayerIds.join(" · ") || "NONE"}/><Row label="Unavailable" value={projection.provenance.unavailableLayerIds.join(" · ") || "NONE"}/><Row label="Execution" value={projection.executionId}/><p><strong>Experimental result.</strong> No canonical relationship was created.</p></>}
      </section>
      <section><h2>Research publication</h2><button type="button" disabled={!canPublish || published} onClick={publish}>{published ? "PUBLISHED TO RESEARCH" : "Publish Experiment to Research"}</button>{published && <p>Experimental projection preserved.<br/>Canonical knowledge unchanged.</p>}</section>
    </>}
  </aside>;
}
function Row({ label, value }: { label: string; value: string | number }) { return <div className="layers-side__row"><span>{label}</span><strong>{String(value)}</strong></div>; }
