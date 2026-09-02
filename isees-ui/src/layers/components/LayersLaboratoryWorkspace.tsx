import { useMemo } from "react";
import { useWorkspaceRuntime } from "../../workspace/runtime/WorkspaceRuntimeContext";
import { WorkspaceSelectionKind } from "../../workspace/runtime/WorkspaceRuntimeTypes";
import { useResolveRuntimeState } from "../../resolve/runtime/ResolveRuntimeContext";
import { useKnowledgeObjects } from "../../knowledge/runtime/KnowledgeObjectRuntimeContext";
import { resolveComparePairProjection } from "../../compare/projection/ComparePairProjectionResolver";
import { ComparePairProjectionStatus } from "../../compare/projection/ComparePairProjectionTypes";
import { resolveCandidateIntelligenceCollection } from "../../resolve/intelligence/ResolveCandidateIntelligenceResolver";
import type { LayersExperimentalPairProjection } from "../projection";
import { CanonicalLayerRegistry } from "../../manifold/layers/systemCanonLayers";
import { ArmedLayerClassification, LayersExperimentStatus, useLayersExperimentRuntime, useLayersExperimentState } from "../runtime";
import { projectLayersExperimentalPair } from "../projection";
import LayersWireManifoldChamber from "./LayersWireManifoldChamber";
import "./LayersLaboratoryWorkspace.css";

const pct = (value?: number) => value === undefined ? "UNAVAILABLE" : `${(value * 100).toFixed(1)}%`;
const ids = (value: readonly string[]) => value.length ? value.join(" · ") : "NONE";

export default function LayersLaboratoryWorkspace() {
  const workspaceRuntime = useWorkspaceRuntime();
  const runtime = useLayersExperimentRuntime();
  const state = useLayersExperimentState();
  const resolveState = useResolveRuntimeState();
  const knowledge = useKnowledgeObjects();
  const workspace = workspaceRuntime.getWorkspace();
  const investigation = workspaceRuntime.getActiveInvestigation();
  const selection = workspaceRuntime.getSelection();
  const completed = resolveState.currentExecution?.result;
  const intelligence = completed ? resolveCandidateIntelligenceCollection(completed.candidateEvaluations.evaluations).intelligence : [];
  const source = useMemo(() => {
    if (!investigation) return { error: "No active investigation. Start or restore an investigation before opening the laboratory." } as const;
    if (!workspace?.focused_event_id) return { error: "No focused canonical EVENT. Focus an EVENT before selecting a COMPARE candidate." } as const;
    if (!completed) return { error: "No completed Resolve execution. Run Resolve before entering the laboratory." } as const;
    if (selection?.kind !== WorkspaceSelectionKind.CANDIDATE) return { error: "No selected COMPARE candidate. Select a candidate in COMPARE, then return to LAYERS." } as const;
    try {
      const pairView = resolveComparePairProjection(workspace.focused_event_id, knowledge, selection, intelligence);
      if (pairView.status !== ComparePairProjectionStatus.READY) return { error: "The selected COMPARE candidate is stale or malformed. Select a current candidate in COMPARE." } as const;
      const pair = completed.manifold.similarityMatrix.pairs.find(item => item.leftKnowledgeObjectId === pairView.leftKnowledgeObjectId && item.rightKnowledgeObjectId === pairView.rightKnowledgeObjectId);
      const evaluation = completed.candidateEvaluations.evaluations.find(item => item.identity.evaluationId === pairView.evaluationId);
      if (!pair || !evaluation) return { error: "Pair or evaluation inputs are unavailable in the completed Resolve execution." } as const;
      return { pairView, pair, evaluation } as const;
    } catch (error) { return { error: `Stale or malformed selected candidate: ${error instanceof Error ? error.message : "unknown error"}` } as const; }
  }, [completed, intelligence, investigation, knowledge, selection, workspace?.focused_event_id]);

  if ("error" in source) return <main className="layers-lab layers-lab--empty"><section role="status"><p className="layers-lab__eyebrow">LAYERS LABORATORY</p><h1>Laboratory input required</h1><p>{source.error}</p><p>Canonical knowledge remains untouched.</p></section></main>;
  const pairView = source.pairView!;
  const baselineIds = workspace?.active_layers ?? [];
  const samePair = state.scope?.compareOrigin?.candidateId === pairView.candidateId;
  const armedIds = samePair ? state.armedLayers.map(layer => layer.id) : baselineIds;
  const projection = samePair ? state.currentExecution?.result?.experimentalManifoldSnapshot : undefined;

  function establish(layerIds: readonly string[]) {
    if (!investigation || !workspace) return;
    runtime.establish({ scope: { investigationId: investigation.id, workspaceId: workspace.id, focusedEventId: workspace.focused_event_id ?? undefined, subjectIds: [pairView.leftKnowledgeObjectId, pairView.rightKnowledgeObjectId], compareOrigin: { pairId: `canonical-pair:${pairView.leftKnowledgeObjectId}:${pairView.rightKnowledgeObjectId}`, candidateId: pairView.candidateId }, resolveOrigin: { executionId: completed?.executionId } }, baseline: { investigationId: investigation.id, workspaceId: workspace.id, subjectIds: [pairView.leftKnowledgeObjectId, pairView.rightKnowledgeObjectId], canonicalStartingLayerIds: baselineIds, startingResolveExecutionId: completed?.executionId, temporalContext: completed?.provenance.temporalContext, investigativeScale: completed?.provenance.investigativeScale }, armedLayers: { layerIds } });
  }
  function run() {
    if (!investigation) return;
    if (!samePair) establish(armedIds);
    const executionId = runtime.beginExecution({ operatorAction: "RUN_RECOMPUTE" });
    try {
      const result = projectLayersExperimentalPair({ executionId, laboratoryInput: runtime.getState().currentExecution!.input, investigationId: investigation.id, sourceKnowledgeObjectId: pairView.leftKnowledgeObjectId, targetKnowledgeObjectId: pairView.rightKnowledgeObjectId, pair: source.pair!, evaluation: source.evaluation!, baselineLayers: CanonicalLayerRegistry.filter(layer => baselineIds.includes(layer.id)).map(layer => ({ id: layer.id, classification: ArmedLayerClassification.CANONICAL, operational: true, canonicalDefinition: layer })), experimentalLayers: runtime.getState().armedLayers });
      runtime.completeExecution(executionId, investigation.id, result);
    } catch (error) { runtime.failExecution(executionId, investigation.id, { code: "EXPERIMENT_PROJECTION_ERROR", message: error instanceof Error ? error.message : "Experiment failed." }); }
  }

  return <main className="layers-lab">
    <header className="layers-lab__header"><div><p className="layers-lab__eyebrow">LAYERS LABORATORY</p><h1>Experimental relationship chamber</h1><p>Canonical knowledge is untouched by laboratory computation.</p></div><div className="layers-lab__status"><strong>EXPERIMENTAL / NON-CANONICAL</strong><span>{state.status} · deterministic execution</span></div><dl><div><dt>Investigation</dt><dd>{investigation?.name} · {investigation?.id}</dd></div><div><dt>Case A</dt><dd>{pairView.focusedEventId} · {pairView.caseAKnowledgeObjectId}</dd></div><div><dt>Case B</dt><dd>{pairView.comparisonEventId} · {pairView.caseBKnowledgeObjectId}</dd></div></dl></header>
    <section className="layers-lab__rack"><Heading number="01" title="Experiment control rack" status={state.status === LayersExperimentStatus.COMPLETE ? "EXECUTED" : "PREPARED — NOT RUN"}/><div className="layers-lab__controls">{CanonicalLayerRegistry.map(layer => { const armed = armedIds.includes(layer.id), baseline = baselineIds.includes(layer.id), unavailable = layer.id === "TEMPORAL"; return <button type="button" key={layer.id} aria-pressed={armed} className="layers-lab__layer" onClick={() => establish(armed ? armedIds.filter(id => id !== layer.id) : [...armedIds, layer.id])}><span>{layer.id}</span><small>{baseline ? "BASELINE-ACTIVE" : "BASELINE-INACTIVE"} · {armed ? "ARMED" : "DISARMED"} · {unavailable ? "UNAVAILABLE / UNMAPPED" : "MAPPED"}</small></button>; })}</div><div className="layers-lab__actions"><button type="button" onClick={run}>Run / Recompute experiment</button><button type="button" onClick={() => establish(baselineIds)}>Reset to baseline</button><span>Control changes prepare input; computation runs only on command.</span></div></section>
    {state.status === LayersExperimentStatus.ERROR && <section className="layers-lab__error" role="alert"><strong>Experiment runtime error</strong><p>{state.error?.message}</p></section>}
    {projection ? <><LayersWireManifoldChamber projection={projection} caseA={pairView.focusedEventId} caseB={pairView.comparisonEventId}/><section className="layers-lab__instrument"><Heading number="04" title="Delta instrument" status={projection.delta.state}/><dl className="layers-lab__metrics"><div><dt>Baseline</dt><dd>{pct(projection.delta.baselineScore)}</dd></div><div><dt>Experiment</dt><dd>{pct(projection.delta.experimentalScore)}</dd></div><div><dt>Signed delta</dt><dd>{projection.delta.scoreDelta === undefined ? "NOT MEANINGFUL" : `${projection.delta.scoreDelta >= 0 ? "+" : ""}${(projection.delta.scoreDelta * 100).toFixed(1)} pp`}</dd></div></dl><dl className="layers-lab__sets">{[["Baseline layer set", projection.provenance.baselineLayerIds],["Experimental layer set", projection.provenance.experimentalLayerIds],["Participating layer set", projection.provenance.participatingLayerIds],["Unavailable layer set", projection.provenance.unavailableLayerIds]].map(([label, values]) => <div key={label as string}><dt>{label}</dt><dd>{ids(values as readonly string[])}</dd></div>)}</dl></section><Ledger projection={projection}/><section className="layers-lab__provenance"><Heading number="06" title="Provenance / epistemic boundary"/><dl>{[["Governing equation",projection.provenance.governingEquation],["Execution ID",projection.executionId],["Pair ID",projection.pairId],["Candidate ID",projection.candidateId],["Evaluation ID",projection.evaluationId],["Canonical representation",projection.provenance.canonicalRepresentation]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p><strong>Experimental projection.</strong> Canonical knowledge was not mutated. No canonical relationship was created.</p><button type="button" disabled>Publication to Research is a later explicit action</button></section></> : <section className="layers-lab__awaiting" role="status"><h2>No experiment result yet</h2><p>Run the deterministic experiment to populate the concurrent wire chamber, delta, contribution ledger, and provenance.</p></section>}
  </main>;
}

function Heading({ number, title, status }: { number: string; title: string; status?: string }) { return <div className="layers-lab__section-heading"><span>{number}</span><h2>{title}</h2>{status && <strong>{status}</strong>}</div>; }
function Ledger({ projection }: { projection: LayersExperimentalPairProjection }) { return <section className="layers-lab__ledger"><Heading number="05" title="Contribution ledger"/><div className="layers-lab__table-wrap"><table><thead><tr>{["Layer ID","Classification","Mapping","Dimension","Availability","Similarity","Canonical weight","Participating weight","Weighted contribution / reason"].map(value=><th key={value}>{value}</th>)}</tr></thead><tbody>{projection.layerContributions.map(item => <tr key={item.layerId}><td>{item.layerId}</td><td>{item.classification}</td><td>{item.operationalMappingStatus}</td><td>{item.canonicalDimension ?? "UNMAPPED"}</td><td>{item.availability}</td><td>{pct(item.similarity)}</td><td>{item.canonicalWeight ?? "—"}</td><td>{item.participatingWeight}</td><td>{item.availability === "UNAVAILABLE" ? item.unavailableReason : item.weightedContribution.toFixed(6)}</td></tr>)}</tbody></table></div></section>; }
