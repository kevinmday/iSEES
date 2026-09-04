import IntentionProjectionViewport from "./IntentionProjectionViewport";
import { useIntentionWorkspace } from "../runtime/IntentionWorkspaceContext";
import { IntentionSelectionKind } from "../selection";
import "./IntentionWorkspace.css";

export default function IntentionWorkspace() {
  const { state, resolvedSelection, selectNode, selectLink, selectDerivation } = useIntentionWorkspace();
  if (state.status === "UNAVAILABLE") return <main className="intention-workspace-shell intention-workspace-shell--unavailable"><div><p>INTENTION / DESCRIPTIVE PROJECTION</p><h2>Projection unavailable</h2><strong>{state.reason}</strong><span>No state was repaired or fabricated.</span></div></main>;
  return <main className="intention-workspace-shell">
    <header className="intention-workspace-header"><div><p>INTENTION / EXPERIMENTAL MATHEMATICAL INSPECTION</p><h2>Descriptive projection</h2></div><span>{state.hasComparisonCandidate ? "COHERENT CANDIDATE" : "FOCUSED EVENT ONLY"}</span></header>
    {!state.hasComparisonCandidate && <div className="intention-workspace-notice">No comparison selected. The focused-event projection remains available; choose a candidate in COMPARE to add descriptive pair context.</div>}
    <IntentionProjectionViewport projection={state.projection} selectedDerivationId={resolvedSelection.kind === IntentionSelectionKind.INTENTION_METRIC_DERIVATION ? resolvedSelection.derivation.id : undefined} onProjectedNodeSelect={selectNode} onProjectedLinkSelect={selectLink} onMetricDerivationSelect={selectDerivation} />
  </main>;
}
