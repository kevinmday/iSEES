import { useMemo } from "react";
import { useWorkspaceRuntime } from "../../workspace/runtime/WorkspaceRuntimeContext";
import { WorkspaceSelectionKind } from "../../workspace/runtime/WorkspaceRuntimeTypes";
import { useResolveRuntimeState } from "../../resolve/runtime/ResolveRuntimeContext";
import { useKnowledgeObjects } from "../../knowledge/runtime/KnowledgeObjectRuntimeContext";
import { resolveComparePairProjection } from "../../compare/projection/ComparePairProjectionResolver";
import { ComparePairProjectionStatus } from "../../compare/projection/ComparePairProjectionTypes";
import { resolveCandidateIntelligenceCollection } from "../../resolve/intelligence/ResolveCandidateIntelligenceResolver";
import { useResearchBridge, useResearchDesk } from "../../research/ResearchBridgeContext";
import { useLayersExperimentState, LayersExperimentStatus, isLayersExperimentExecutionCurrent, type LayersExperimentAuthority } from "../runtime";
import { publishLayersExperimentToResearch } from "../research/LayersExperimentResearchPublication";
import { useLayersPresentationSelection } from "./LayersPresentationSelection";
import "./LayersSideInstruments.css";
import { CanonicalFeatureDimension } from "../../resolve/features/CanonicalKnowledgeFeatureTypes";
import { canonicalLayerIdFromContribution, layersContributionId, LayersContributionSet } from "../projection";
import { assembleTopologySimilarityBriefing, collectMetricFinding, MetricIntelligenceTrigger, topologySimilaritySourceFromProjection } from "../../metric-intelligence";
import { researchAnchorId } from "../../research/ResearchAnchorContract";
import { eventDisplayName } from "../../research/LayersExperimentReferencePresentation";
import { composeGuestOperationalKnowledgeObjects } from "../../knowledge/ingestion/GuestCandidateKnowledgeAdapter.ts";

const pct = (value?: number) => value === undefined ? "UNAVAILABLE" : `${(value * 100).toFixed(1)}%`;
const unavailableReason = (reason?: string) => reason?.replaceAll("_", " ") ?? "Evidence unavailable for the active baseline layers";
export default function LayersExperimentalIntelligence() {
  const state = useLayersExperimentState();
  const workspaceRuntime = useWorkspaceRuntime();
  const resolveState = useResolveRuntimeState();
  const canonicalKnowledge = useKnowledgeObjects();
  const bridge = useResearchBridge();
  const desk = useResearchDesk();
  const { selection, select } = useLayersPresentationSelection();
  const workspace = workspaceRuntime.getWorkspace();
  const knowledge = useMemo(() => composeGuestOperationalKnowledgeObjects(workspace, canonicalKnowledge), [canonicalKnowledge, workspace]);
  const investigation = workspaceRuntime.getActiveInvestigation();
  const candidateSelection = workspaceRuntime.getSelection();
  const completedResolve = resolveState.currentExecution?.result;
  const activeAuthority = useMemo<LayersExperimentAuthority | undefined>(() => {
    if (!workspace?.focused_event_id || !investigation || !completedResolve || candidateSelection?.kind !== WorkspaceSelectionKind.CANDIDATE) return undefined;
    if (completedResolve.provenance.investigationId !== investigation.id || resolveState.currentExecution?.executionId !== completedResolve.executionId) return undefined;
    const intelligence = resolveCandidateIntelligenceCollection(completedResolve.candidateEvaluations.evaluations).intelligence;
    try {
      const pair = resolveComparePairProjection(workspace.focused_event_id, knowledge, candidateSelection, intelligence);
      if (pair.status !== ComparePairProjectionStatus.READY) return undefined;
      return { investigationId: investigation.id, workspaceId: workspace.id, focusedEventId: workspace.focused_event_id, comparisonEventId: pair.comparisonEventId, subjectIds: [pair.leftKnowledgeObjectId, pair.rightKnowledgeObjectId].sort(), compareOrigin: { pairId: `canonical-pair:${pair.leftKnowledgeObjectId}:${pair.rightKnowledgeObjectId}`, candidateId: pair.candidateId, evaluationId: pair.evaluationId }, resolveOrigin: { executionId: completedResolve.executionId } };
    } catch { return undefined; }
  }, [candidateSelection, completedResolve, investigation, knowledge, resolveState.currentExecution?.executionId, workspace]);
  const execution = isLayersExperimentExecutionCurrent(state.currentExecution, activeAuthority) ? state.currentExecution : undefined;
  const projection = execution?.result?.experimentalManifoldSnapshot;
  const metricBriefing = useMemo(() => {
    if (!projection) return undefined;
    try { return assembleTopologySimilarityBriefing(topologySimilaritySourceFromProjection(projection, { caseA: eventDisplayName(projection.evaluatorInput.endpoints[0].subjectIdentity), caseB: eventDisplayName(projection.evaluatorInput.endpoints[1].subjectIdentity) })); } catch { return undefined; }
  }, [projection]);
  const metricCollected = !!metricBriefing && desk.entries.some(entry => entry.anchor.anchorId === researchAnchorId(metricBriefing.source.investigationId, "METRIC_FINDING", metricBriefing.findingId));
  const published = !!projection && desk.entries.some(entry => entry.anchor.anchorId === `research:${projection.investigationId}:EXPERIMENT:${projection.projectionId}`);
  const contribution = projection && (selection.kind === "LAYER" || selection.kind === "CONTRIBUTION") ? projection.layerContributions.find(item => item.layerId === selection.layerId) : undefined;
  const canPublish = isLayersExperimentExecutionCurrent(execution, activeAuthority);
  const guidance = state.status === LayersExperimentStatus.EXECUTING ? "Experiment executing. Inspection will update on completion."
    : state.status === LayersExperimentStatus.ERROR ? `Experiment runtime error: ${state.error?.message ?? "unknown error"}`
    : "Prepare and run an experiment to inspect its immutable result.";
  const subjectLabels = useMemo(() => ({ a: activeAuthority?.focusedEventId ?? "UNAVAILABLE", b: activeAuthority?.comparisonEventId ?? "UNAVAILABLE" }), [activeAuthority]);
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
        {contribution ? <><Row label="Layer ID / class" value={`${contribution.layerId} · ${contribution.classification}`}/><Row label="Mapping" value={`${contribution.operationalMappingStatus} · ${contribution.canonicalDimension ?? "UNMAPPED"}`}/><Row label="Availability" value={contribution.availability}/><Row label="Similarity" value={pct(contribution.similarity)}/><Row label="Canonical weight" value={contribution.canonicalWeight ?? "UNAVAILABLE"}/><Row label="Participating weight" value={contribution.participatingWeight}/><Row label="Weighted contribution" value={contribution.availability === "AVAILABLE" ? contribution.weightedContribution : "UNAVAILABLE"}/><Row label="Reason" value={contribution.unavailableReason ?? "—"}/><Row label="Membership" value={contributionMembership(projection, contribution.layerId)}/></>
        : selection.kind === "CASE_A" || selection.kind === "CASE_B" ? <FrozenEndpoint projection={projection} role={selection.kind}/>
        : <><Row label="Baseline" value={pct(projection.delta.baselineScore)}/>{projection.baseline.relationship.availability === "UNAVAILABLE" && <p>{projection.provenance.baselineLayerIds.length === 0 ? "No active baseline layers" : unavailableReason(projection.baseline.relationship.reason)}</p>}<div className="layers-side__row"><span>Experimental</span><strong>{metricBriefing ? <MetricIntelligenceTrigger briefing={metricBriefing} collected={metricCollected} onCollect={() => collectMetricFinding(metricBriefing, bridge)}/> : pct(projection.delta.experimentalScore)}</strong></div><Row label="Delta" value={`${projection.delta.state}${projection.delta.scoreDelta === undefined ? " · NOT MEANINGFUL" : ` · ${projection.delta.scoreDelta >= 0 ? "+" : ""}${(projection.delta.scoreDelta * 100).toFixed(1)} pp`}`}/><Row label="Participating" value={projection.provenance.participatingLayerIds.join(" · ") || "NONE"}/><Row label="Unavailable" value={projection.provenance.unavailableLayerIds.join(" · ") || "NONE"}/><Row label="Execution" value={projection.executionId}/><p><strong>Experimental result.</strong> No canonical relationship was created.</p></>}
      </section>
      <section><h2>Research publication</h2><button type="button" disabled={!canPublish || published} onClick={publish}>{published ? "PUBLISHED TO RESEARCH" : "Publish Experiment to Research"}</button>{published && <p>Experimental projection preserved.<br/>Canonical knowledge unchanged.</p>}</section>
    </>}
  </aside>;
}
function Row({ label, value }: { label: string; value: string | number }) { return <div className="layers-side__row"><span>{label}</span><strong>{String(value)}</strong></div>; }
function contributionMembership(projection: import("../projection").LayersExperimentalPairProjection, contributionId: string): string {
  const baselineId = canonicalLayerIdFromContribution(LayersContributionSet.BASELINE, contributionId);
  const experimentalId = canonicalLayerIdFromContribution(LayersContributionSet.EXPERIMENTAL, contributionId);
  return `${baselineId && projection.provenance.baselineLayerIds.includes(baselineId) ? "BASELINE" : "NOT BASELINE"} · ${experimentalId && projection.provenance.experimentalLayerIds.includes(experimentalId) ? "EXPERIMENTAL" : "NOT EXPERIMENTAL"}`;
}
function FrozenEndpoint({ projection, role }: { projection: import("../projection").LayersExperimentalPairProjection; role: "CASE_A" | "CASE_B" }) {
  const endpoint = projection.evaluatorInput.endpoints.find(item => item.subjectRole === role)!;
  const topology = projection.layerContributions.find(item => item.layerId === layersContributionId(LayersContributionSet.EXPERIMENTAL, CanonicalFeatureDimension.TOPOLOGY) && item.canonicalDimension === CanonicalFeatureDimension.TOPOLOGY);
  const components = endpoint.components.filter(item => item.componentIdentity.startsWith(`${CanonicalFeatureDimension.TOPOLOGY}.`));
  return <><Row label={role === "CASE_A" ? "Case A" : "Case B"} value={endpoint.subjectIdentity}/><Row label="Knowledge object" value={endpoint.knowledgeObjectId}/><Row label="Frozen input snapshot" value={endpoint.endpointSnapshotId}/><Row label="Evaluator" value={topology?.evaluatorKey && topology.evaluatorVersion ? `${topology.evaluatorKey}@${topology.evaluatorVersion}` : "NOT SELECTED"}/><Row label="Normalization" value={topology?.normalization ? `${topology.normalization.normalizationKey}@${topology.normalization.normalizationVersion}` : "NOT AVAILABLE"}/><Row label="Normalized result" value={pct(topology?.normalizedResult)}/><details><summary>Frozen topology-state vector</summary><pre>{JSON.stringify(components, null, 2)}</pre></details></>;
}
