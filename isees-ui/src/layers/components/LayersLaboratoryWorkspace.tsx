import { useEffect, useMemo } from "react";
import { useWorkspaceRuntime } from "../../workspace/runtime/WorkspaceRuntimeContext";
import { WorkspaceMode, WorkspaceSelectionKind } from "../../workspace/runtime/WorkspaceRuntimeTypes";
import { useResolveRuntimeState } from "../../resolve/runtime/ResolveRuntimeContext";
import { useKnowledgeObjects } from "../../knowledge/runtime/KnowledgeObjectRuntimeContext";
import { resolveComparePairProjection } from "../../compare/projection/ComparePairProjectionResolver";
import { ComparePairProjectionStatus } from "../../compare/projection/ComparePairProjectionTypes";
import { resolveCandidateIntelligenceCollection } from "../../resolve/intelligence/ResolveCandidateIntelligenceResolver";
import type { LayersExperimentalPairProjection } from "../projection";
import { CanonicalLayerRegistry } from "../../manifold/layers/systemCanonLayers";
import { ArmedLayerClassification, LayersExperimentStatus, isLayersExperimentScopeCurrent, useLayersExperimentRuntime, useLayersExperimentState, type LayersExperimentAuthority } from "../runtime";
import { projectLayersExperimentalPair } from "../projection";
import LayersWireManifoldChamber from "./LayersWireManifoldChamber";
import "./LayersLaboratoryWorkspace.css";
import { useLayersPresentationSelection } from "./LayersPresentationSelection";
import LayerCatalogMatrix from "./LayerCatalogMatrix";
import { restoreCanonicalLayerProfile } from "../catalog/index.ts";
import { normalizeOperationalSelection } from "../presentation/LayerCatalogMatrixProjection.ts";

const pct = (value?: number) => value === undefined ? "UNAVAILABLE" : `${(value * 100).toFixed(1)}%`;
const ids = (value: readonly string[]) => value.length ? value.join(" · ") : "NONE";

export default function LayersLaboratoryWorkspace() {
  const workspaceRuntime = useWorkspaceRuntime();
  const runtime = useLayersExperimentRuntime();
  const state = useLayersExperimentState();
  const resolveState = useResolveRuntimeState();
  const knowledge = useKnowledgeObjects();
  const { selection: inspectionSelection, select: inspect } = useLayersPresentationSelection();
  const workspace = workspaceRuntime.getWorkspace();
  const investigation = workspaceRuntime.getActiveInvestigation();
  const selection = workspaceRuntime.getSelection();
  const completed = resolveState.currentExecution?.result;
  const intelligence = completed ? resolveCandidateIntelligenceCollection(completed.candidateEvaluations.evaluations).intelligence : [];
  const source = useMemo(() => {
    if (!investigation) return { error: "No active investigation. Start or restore an investigation before opening the laboratory." } as const;
    if (!workspace?.focused_event_id) return { error: "No focused canonical EVENT. Focus an EVENT before selecting a COMPARE candidate." } as const;
    if (!completed) return { error: "Run Resolve before running an experiment." } as const;
    if (completed.provenance.investigationId !== investigation.id || resolveState.currentExecution?.executionId !== completed.executionId) return { error: "The completed Resolve execution does not belong to the active investigation." } as const;
    if (selection?.kind !== WorkspaceSelectionKind.CANDIDATE) return { error: "No selected COMPARE candidate. Select a candidate in COMPARE, then return to LAYERS." } as const;
    try {
      const pairView = resolveComparePairProjection(workspace.focused_event_id, knowledge, selection, intelligence);
      if (pairView.status !== ComparePairProjectionStatus.READY) return { error: "The selected COMPARE candidate is stale or malformed. Select a current candidate in COMPARE." } as const;
      const pair = completed.manifold.similarityMatrix.pairs.find(item => item.leftKnowledgeObjectId === pairView.leftKnowledgeObjectId && item.rightKnowledgeObjectId === pairView.rightKnowledgeObjectId);
      const evaluation = completed.candidateEvaluations.evaluations.find(item => item.identity.evaluationId === pairView.evaluationId);
      if (!pair || !evaluation) return { error: "Pair or evaluation inputs are unavailable in the completed Resolve execution." } as const;
      return { pairView, pair, evaluation } as const;
    } catch (error) { return { error: `Stale or malformed selected candidate: ${error instanceof Error ? error.message : "unknown error"}` } as const; }
  }, [completed, intelligence, investigation, knowledge, resolveState.currentExecution?.executionId, selection, workspace?.focused_event_id]);

  const activeAuthority = useMemo<LayersExperimentAuthority | undefined>(() => {
    if ("error" in source || !investigation || !workspace || !workspace.focused_event_id || !completed) return undefined;
    const pairView = source.pairView;
    return {
      investigationId: investigation.id,
      workspaceId: workspace.id,
      focusedEventId: workspace.focused_event_id,
      comparisonEventId: pairView.comparisonEventId,
      subjectIds: [pairView.leftKnowledgeObjectId, pairView.rightKnowledgeObjectId].sort(),
      compareOrigin: {
        pairId: `canonical-pair:${pairView.leftKnowledgeObjectId}:${pairView.rightKnowledgeObjectId}`,
        candidateId: pairView.candidateId,
        evaluationId: pairView.evaluationId,
      },
      resolveOrigin: { executionId: completed.executionId },
    };
  }, [completed, investigation, source, workspace]);
  const scopeIsCurrent = isLayersExperimentScopeCurrent(state.scope, activeAuthority);
  useEffect(() => {
    if (state.scope && !scopeIsCurrent) runtime.reset();
  }, [runtime, scopeIsCurrent, state.scope]);

  const experimentReady = !("error" in source);
  const resolveMissing = !completed;
  const comparisonMissing = selection?.kind !== WorkspaceSelectionKind.CANDIDATE;
  const missingReason = "error" in source
    ? resolveMissing && comparisonMissing ? "Run Resolve, then choose a comparison before running an experiment."
    : resolveMissing ? "Run Resolve before running an experiment."
    : comparisonMissing ? "Choose a comparison before running an experiment."
    : source.error
    : undefined;
  const pairView = experimentReady ? source.pairView : undefined;
  const baselineIds = workspace?.active_layers ?? [];
  const armedIds = experimentReady ? (scopeIsCurrent ? state.armedLayers.map(layer => layer.id) : normalizeOperationalSelection(baselineIds)) : [];
  const projection = scopeIsCurrent ? state.currentExecution?.result?.experimentalManifoldSnapshot : undefined;

  function establish(layerIds: readonly string[]) {
    if (!investigation || !workspace) return;
    if (scopeIsCurrent) { runtime.setArmedLayers({ layerIds }); return; }
    runtime.establish({ scope: activeAuthority!, baseline: { investigationId: investigation.id, workspaceId: workspace.id, subjectIds: activeAuthority!.subjectIds, canonicalStartingLayerIds: baselineIds, startingResolveExecutionId: completed!.executionId, temporalContext: completed!.provenance.temporalContext, investigativeScale: completed!.provenance.investigativeScale }, armedLayers: { layerIds } });
  }
  function run() {
    if (!investigation || "error" in source || !pairView || armedIds.length === 0) return;
    if (!scopeIsCurrent) establish(armedIds);
    const executionId = runtime.beginExecution({ operatorAction: "RUN_RECOMPUTE" });
    try {
      const result = projectLayersExperimentalPair({ executionId, laboratoryInput: runtime.getState().currentExecution!.input, investigationId: investigation.id, sourceKnowledgeObjectId: pairView.leftKnowledgeObjectId, targetKnowledgeObjectId: pairView.rightKnowledgeObjectId, caseAKnowledgeObjectId: pairView.caseAKnowledgeObjectId, caseBKnowledgeObjectId: pairView.caseBKnowledgeObjectId, knowledgeObjects: knowledge, pair: source.pair, evaluation: source.evaluation, baselineLayers: CanonicalLayerRegistry.filter(layer => baselineIds.includes(layer.id)).map(layer => ({ id: layer.id, classification: ArmedLayerClassification.CANONICAL, operational: true, canonicalDefinition: layer })), experimentalLayers: runtime.getState().armedLayers });
      runtime.completeExecution(executionId, investigation.id, result);
    } catch (error) { runtime.failExecution(executionId, investigation.id, { code: "EXPERIMENT_PROJECTION_ERROR", message: error instanceof Error ? error.message : "Experiment failed." }); }
  }

  return <main className="layers-lab">
    <header className="layers-lab__header"><div><p className="layers-lab__eyebrow">LAYERS LABORATORY</p><h1>Experimental relationship chamber</h1><p>Canonical knowledge is untouched by laboratory computation.</p></div><div className="layers-lab__status"><strong>EXPERIMENTAL / NON-CANONICAL</strong><span>{experimentReady ? (scopeIsCurrent ? state.status : LayersExperimentStatus.READY) : "BROWSE"} · deterministic execution</span></div>{experimentReady && <dl><div><dt>Investigation</dt><dd>{investigation?.name} · {investigation?.id}</dd></div><div><dt>Case A</dt><dd>{pairView!.focusedEventId} · {pairView!.caseAKnowledgeObjectId}</dd></div><div><dt>Case B</dt><dd>{pairView!.comparisonEventId} · {pairView!.caseBKnowledgeObjectId}</dd></div></dl>}</header>
    <section className="layers-lab__rack"><Heading number="01" title="Experiment control area" status={!experimentReady ? "BROWSE" : scopeIsCurrent && state.status === LayersExperimentStatus.COMPLETE ? "EXECUTED" : "PREPARED — NOT RUN"}/>{missingReason && <div className="layers-lab__prerequisite" role="status"><div><strong>Experimentation is not ready</strong><p>{missingReason}</p><p>You may still search, expand, and inspect all 48 layers. Canonical knowledge remains untouched.</p></div>{(resolveMissing || comparisonMissing) && <div>{resolveMissing && <button type="button" onClick={() => workspaceRuntime.setActiveMode(WorkspaceMode.MANIFOLD)}>Run Resolve</button>}{comparisonMissing && <button type="button" onClick={() => workspaceRuntime.setActiveMode(WorkspaceMode.COMPARE)}>Choose Comparison</button>}</div>}</div>}<LayerCatalogMatrix experimentReady={experimentReady} inputRequiredReason={missingReason} selectedIds={armedIds} baselineIds={baselineIds} onSelectionChange={establish} restoreProfile={profileId => establish(restoreCanonicalLayerProfile(profileId))}/><div className="layers-lab__primary-action-rail" role="region" aria-label="Experiment execution"><button className="layers-lab__run-action" type="button" disabled={!experimentReady || armedIds.length === 0} onClick={run}>Run / Recompute experiment</button><span>{missingReason ? `Unavailable: ${missingReason}` : armedIds.length === 0 ? "Select at least one available operational layer to prepare experiment input." : "Selection changes prepare input only. Computation runs only on this command."}</span></div></section>
    {state.status === LayersExperimentStatus.ERROR && <section className="layers-lab__error" role="alert"><strong>Experiment runtime error</strong><p>{state.error?.message}</p></section>}
    {projection ? <>
      <LayersWireManifoldChamber projection={projection} caseA={pairView!.focusedEventId} caseB={pairView!.comparisonEventId}/>
      <section className="layers-lab__instrument">
        <button className="layers-lab__inspect-heading" type="button" aria-pressed={inspectionSelection.kind === "DELTA"} onClick={() => inspect({kind:"DELTA"})}><Heading number="04" title="Delta instrument" status={projection.delta.state}/></button>
        <dl className="layers-lab__metrics"><div><dt>Baseline</dt><dd>{pct(projection.delta.baselineScore)}</dd></div><div><dt>Experiment</dt><dd>{pct(projection.delta.experimentalScore)}</dd></div><div><dt>Signed delta</dt><dd>{projection.delta.scoreDelta === undefined ? "NOT MEANINGFUL" : `${projection.delta.scoreDelta >= 0 ? "+" : ""}${(projection.delta.scoreDelta * 100).toFixed(1)} pp`}</dd></div></dl>
        <dl className="layers-lab__sets">{[["Baseline layer set", projection.provenance.baselineLayerIds],["Experimental layer set", projection.provenance.experimentalLayerIds],["Participating layer set", projection.provenance.participatingLayerIds],["Unavailable layer set", projection.provenance.unavailableLayerIds]].map(([label, values]) => <div key={label as string}><dt>{label}</dt><dd>{ids(values as readonly string[])}</dd></div>)}</dl>
      </section>
      <Ledger projection={projection} selected={inspectionSelection} inspect={inspect}/>
      <section className="layers-lab__provenance"><Heading number="06" title="Provenance / epistemic boundary"/><dl>{[["Governing equation",projection.provenance.governingEquation],["Execution ID",projection.executionId],["Pair ID",projection.pairId],["Candidate ID",projection.candidateId],["Evaluation ID",projection.evaluationId]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><details><summary><strong>Canonical Representation</strong><span>Inspect deterministic source</span></summary><div className="layers-lab__canonical"><button type="button" onClick={() => void navigator.clipboard?.writeText(projection.provenance.canonicalRepresentation)}>Copy exact representation</button><pre>{projection.provenance.canonicalRepresentation}</pre></div></details><p><strong>Experimental projection.</strong> Canonical knowledge was not mutated. No canonical relationship was created.</p></section>
    </> : <section className="layers-lab__awaiting" role="status"><h2>No experiment result yet</h2><p>Run the deterministic experiment to populate the concurrent wire chamber, delta, contribution ledger, and provenance.</p></section>}
  </main>;
}

function Heading({ number, title, status }: { number: string; title: string; status?: string }) { return <div className="layers-lab__section-heading"><span>{number}</span><h2>{title}</h2>{status && <strong>{status}</strong>}</div>; }
function Ledger({ projection, selected, inspect }: { projection: LayersExperimentalPairProjection; selected: import("./LayersPresentationSelection").LayersInspectionSelection; inspect: (value: import("./LayersPresentationSelection").LayersInspectionSelection) => void }) { return <section className="layers-lab__ledger"><Heading number="05" title="Contribution ledger"/><div className="layers-lab__table-wrap"><table><thead><tr>{["Layer ID","Classification","Mapping","Dimension","Availability","Similarity","Canonical weight","Participating weight","Weighted contribution / reason"].map(value=><th key={value}>{value}</th>)}</tr></thead><tbody>{projection.layerContributions.map(item => <tr key={item.layerId}><td><button type="button" aria-pressed={selected.kind === "CONTRIBUTION" && selected.layerId === item.layerId} onClick={() => inspect({kind:"CONTRIBUTION",layerId:item.layerId})}>{item.layerId}</button></td><td>{item.classification}</td><td>{item.operationalMappingStatus}</td><td>{item.canonicalDimension ?? "UNMAPPED"}</td><td>{item.availability}</td><td>{pct(item.similarity)}</td><td>{item.canonicalWeight ?? "—"}</td><td>{item.participatingWeight}</td><td>{item.availability === "UNAVAILABLE" ? item.unavailableReason : item.weightedContribution.toFixed(6)}</td></tr>)}</tbody></table></div></section>; }
