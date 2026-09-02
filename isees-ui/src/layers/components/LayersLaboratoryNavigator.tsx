import { useWorkspaceRuntime } from "../../workspace/runtime/WorkspaceRuntimeContext";
import { WorkspaceMode, WorkspaceSelectionKind } from "../../workspace/runtime/WorkspaceRuntimeTypes";
import { useLayersExperimentState, LayersExperimentStatus } from "../runtime";
import { resolveLayersNavigatorCounts } from "./LayersNavigatorCounts";
import "./LayersSideInstruments.css";

const list = (ids: readonly string[]) => ids.length ? ids.join(" · ") : "NONE";
const score = (value?: number) => value === undefined ? "UNAVAILABLE" : `${(value * 100).toFixed(1)}%`;

export default function LayersLaboratoryNavigator() {
  const workspaceRuntime = useWorkspaceRuntime();
  const state = useLayersExperimentState();
  const investigation = workspaceRuntime.getActiveInvestigation();
  const workspace = workspaceRuntime.getWorkspace();
  const selection = workspaceRuntime.getSelection();
  const latestCompleted = [...state.history].reverse().find(item => item.result?.experimentalManifoldSnapshot);
  const projection = latestCompleted?.result?.experimentalManifoldSnapshot;
  const counts = resolveLayersNavigatorCounts(state.armedLayers, state.currentExecution?.result?.experimentalManifoldSnapshot);
  const status = state.status === LayersExperimentStatus.READY && state.currentExecution === undefined
    ? "MODIFIED / NOT RUN" : state.status;
  const next = !investigation ? "Start or restore an Investigation."
    : !workspace?.focused_event_id || selection?.kind !== WorkspaceSelectionKind.CANDIDATE ? "Select the Case A–Case B pair in COMPARE."
    : state.armedLayers.length === 0 ? "Arm one or more experimental layers."
    : state.status === LayersExperimentStatus.EXECUTING ? "Wait for the deterministic execution to complete."
    : !projection ? "Run the prepared experiment."
    : "Inspect the result, then publish the immutable finding.";

  return <nav className="layers-side layers-navigator" aria-label="LAYERS Laboratory Navigator">
    <header><span>LAYERS</span><h1>Laboratory Navigator</h1><small>SETUP + NAVIGATION</small></header>
    <Section title="Experiment subject">
      <Row label="Investigation" value={investigation ? `${investigation.name} · ${investigation.id}` : "NO ACTIVE INVESTIGATION"}/>
      <Row label="Case A" value={workspace?.focused_event_id ?? "NO FOCUSED EVENT"}/>
      <Row label="Case B" value={state.scope?.comparisonEventId ?? "NO SELECTED COMPARISON EVENT"}/>
      <Row label="Candidate" value={state.scope?.compareOrigin?.candidateId ?? (selection?.kind === WorkspaceSelectionKind.CANDIDATE ? selection.candidateId : "UNAVAILABLE")}/>
      <button type="button" onClick={() => workspaceRuntime.setActiveMode(WorkspaceMode.COMPARE)}>Change Pair in COMPARE</button>
    </Section>
    <Section title="Baseline configuration">
      <Row label="Active layers" value={list(state.baseline?.canonicalStartingLayerIds ?? workspace?.active_layers ?? [])}/>
      <Row label="Relationship" value={projection ? `${projection.baseline.relationship.availability} · ${score(projection.delta.baselineScore)}` : "NOT MEASURED"}/>
      {(state.baseline?.canonicalStartingLayerIds ?? workspace?.active_layers ?? []).length === 0 && <p>No canonical baseline layers are active, so a baseline relationship cannot be measured.</p>}
    </Section>
    <Section title="Experimental configuration">
      <Row label="Armed" value={list(state.armedLayers.map(layer => layer.id))}/><Row label="Mapped" value={counts.mapped}/>
      <Row label="Unavailable / unmapped" value={counts.unavailable}/><Row label="Status" value={status}/>
    </Section>
    <Section title="Latest completed experiment">
      {projection ? <><Row label="Execution" value={projection.executionId}/><Row label="Delta" value={projection.delta.state}/><Row label="Score" value={score(projection.delta.experimentalScore)}/></> : <p>No genuine completed experiment is available.</p>}
    </Section>
    <Section title="Next action"><p>{next}</p></Section>
  </nav>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section><h2>{title}</h2>{children}</section>; }
function Row({ label, value }: { label: string; value: string | number }) { return <div className="layers-side__row"><span>{label}</span><strong>{value}</strong></div>; }
