import { IntentionAvailability } from "../projection";
import { useIntentionWorkspace } from "../runtime/IntentionWorkspaceContext";
import "./IntentionWorkspace.css";

export default function IntentionNavigator() {
  const { state } = useIntentionWorkspace();
  if (state.status === "UNAVAILABLE") return <nav className="intention-side-panel" aria-labelledby="intention-nav-title"><header><p>INTENTION NAVIGATOR</p><h2 id="intention-nav-title">Unavailable context</h2></header><section><strong>{state.reason}</strong><p>Restore coherent Investigation, revision, and focus data to inspect a descriptive projection.</p></section></nav>;
  const { projection } = state;
  const count = (availability: string) => projection.derivations.filter(item => item.availability === availability).length;
  return <nav className="intention-side-panel" aria-labelledby="intention-nav-title">
    <header><p>INTENTION NAVIGATOR</p><h2 id="intention-nav-title">Projection context</h2></header>
    <section><h3>Active Investigation</h3><dl><div><dt>Investigation</dt><dd>{projection.lineage.investigationId}</dd></div><div><dt>Focused EVENT</dt><dd>{projection.lineage.focusedEventId}</dd></div><div><dt>Revision</dt><dd>{projection.lineage.operationalRevisionId}</dd></div></dl></section>
    <section><h3>Projection identity</h3><dl><div><dt>Projection</dt><dd>{projection.id}</dd></div><div><dt>Execution</dt><dd>{projection.executionId}</dd></div><div><dt>Model</dt><dd>{projection.lineage.modelId}@{projection.lineage.modelVersion}</dd></div><div><dt>Configuration</dt><dd>{projection.lineage.configurationId}</dd></div></dl></section>
    <section><h3>Comparison</h3>{state.hasComparisonCandidate ? <dl><div><dt>Candidate</dt><dd>{projection.lineage.candidateId}</dd></div><div><dt>Evaluation</dt><dd>{projection.lineage.evaluationId}</dd></div><div><dt>Resolve</dt><dd>{projection.lineage.resolveExecutionId}</dd></div></dl> : <><strong>No comparison selected</strong><p>Choose a comparison in COMPARE; INTENTION does not auto-select one.</p></>}</section>
    <section><h3>Availability</h3><p>{projection.nodes.length} nodes · {projection.links.length} links · {projection.derivations.length} derivations</p><p>{count(IntentionAvailability.AVAILABLE)} AVAILABLE · {count(IntentionAvailability.UNAVAILABLE)} UNAVAILABLE · {count(IntentionAvailability.THEORETICAL)} THEORETICAL</p></section>
    <footer>Select a projected object to inspect its deterministic derivation. Metric collection will be introduced later.</footer>
  </nav>;
}
