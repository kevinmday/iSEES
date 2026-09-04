import { resolveIntentionEquation, type IntentionMetricDerivation } from "../projection";
import { IntentionSelectionKind } from "../selection";
import { useIntentionWorkspace } from "../runtime/IntentionWorkspaceContext";
import "./IntentionWorkspace.css";
import { useState } from "react";
import { useResearchBridge } from "../../research/ResearchBridgeContext";
import { intentionDerivationResearchAnchor, intentionHypothesisResearchAnchor } from "../../studio/sources/TypedResearchSourceAdapters";
import { collectTypedResearchSource } from "../../studio/sources/DirectResearchPublication";

function Id({ children }: { readonly children: string | undefined }) { return <code>{children ?? "NONE"}</code>; }
function Derivations({ ids }: { readonly ids: readonly string[] }) {
  const { state, resolvedSelection, selectDerivation } = useIntentionWorkspace();
  if (state.status !== "AVAILABLE") return null;
  return <section><h3>Associated derivations</h3><div className="intention-derivation-list">{ids.map(id => { const item = state.projection.derivations.find(value => value.id === id); const selected = resolvedSelection.kind === IntentionSelectionKind.INTENTION_METRIC_DERIVATION && resolvedSelection.derivation.id === id; return item ? <button type="button" key={id} className="intention-derivation-control" aria-label={`Select ${item.metricName} derivation, ${item.availability}`} aria-pressed={selected} onClick={() => selectDerivation(id)}><strong>{item.metricName}</strong><span>{item.symbol} · {item.availability}</span><code>{item.id}</code></button> : null; })}</div></section>;
}
function Derivation({ value, projectionId, onFeedback }: { readonly value: IntentionMetricDerivation; readonly projectionId?: string; readonly onFeedback: (message: string) => void }) {
  const equation = resolveIntentionEquation(value.equationId);
  const research = useResearchBridge();
  return <><section><h3>{value.metricName} · {value.symbol}</h3><strong>{value.availability === "AVAILABLE" ? `${value.displayValue ?? value.value}${value.units ? ` ${value.units}` : ""}` : value.availability}</strong><p>{value.availability} · {value.epistemicClassification}</p><p>Computational projection; not canonical Evidence.</p></section>
    <section><h3>Inert equation display</h3><code>{equation.displayExpression}</code><p>{value.reason ?? equation.description}</p></section>
    <section><h3>Exact ordered inputs</h3>{value.inputs.map((input, index) => <p key={`${input.id}:${index}`}>{index + 1}. {input.symbol} = {String(input.value ?? input.availability)}<br /><Id>{input.sourcePath}</Id><br />K: {input.sourceKnowledgeIds.join(", ") || "NONE"}<br />R: {input.sourceRelationshipIds.join(", ") || "NONE"}{input.reason ? <><br />{input.reason}</> : null}</p>)}{value.unavailableInputs.length > 0 && <p>Unavailable inputs: {value.unavailableInputs.join(", ")}</p>}</section>
    <section><h3>Assumptions and lineage</h3><p>Assumptions: {value.assumptions.join(" · ") || "NONE"}</p><p>Knowledge: {value.sourceKnowledgeIds.join(", ") || "NONE"}<br />Relationships: {value.sourceRelationshipIds.join(", ") || "NONE"}</p><dl><div><dt>Investigation</dt><dd>{value.investigationId}</dd></div><div><dt>Revision</dt><dd>{value.operationalRevisionId}</dd></div><div><dt>Resolve</dt><dd>{value.resolveExecutionId ?? "NONE"}</dd></div><div><dt>INTENTION execution</dt><dd>{value.intentionExecutionId}</dd></div><div><dt>Model</dt><dd>{value.modelId}@{value.modelVersion}</dd></div><div><dt>Configuration</dt><dd>{value.configurationId}</dd></div><div><dt>Derivation</dt><dd>{value.id}</dd></div></dl><button type="button" onClick={() => onFeedback(collectTypedResearchSource(research, () => intentionDerivationResearchAnchor({ investigationId: value.investigationId, projectionId, derivation: value })).message)}>Add to Research Inbox</button></section></>;
}

export default function IntentionInspector() {
  const { state, resolvedSelection } = useIntentionWorkspace();
  const projection = state.status === "AVAILABLE" ? state.projection : undefined;
  const research = useResearchBridge();
  const [feedback, setFeedback] = useState<string>();
  return <aside className="intention-side-panel intention-inspector" aria-labelledby="intention-inspector-title"><header><p>INTENTION INSPECTOR</p><h2 id="intention-inspector-title">Deterministic inspection</h2></header>
    {resolvedSelection.kind === IntentionSelectionKind.NONE ? <section><strong>Nothing selected</strong><p>Select a projected node, descriptive link, or metric derivation. Generic MANIFOLD intelligence is not shown here.</p></section> : resolvedSelection.kind === IntentionSelectionKind.INTENTION_PROJECTED_NODE ? <><section><h3>Projected node</h3><dl><div><dt>ID</dt><dd>{resolvedSelection.node.id}</dd></div><div><dt>Role</dt><dd>{resolvedSelection.node.role}</dd></div><div><dt>Knowledge</dt><dd>{resolvedSelection.node.sourceKnowledgeId}</dd></div><div><dt>Canonical EVENT</dt><dd>{resolvedSelection.node.canonicalEventId}</dd></div><div><dt>Projection</dt><dd>{projection?.id}</dd></div><div><dt>Execution</dt><dd>{projection?.executionId}</dd></div><div><dt>Model</dt><dd>{projection ? `${projection.lineage.modelId}@${projection.lineage.modelVersion} · ${projection.lineage.configurationId}` : "NONE"}</dd></div></dl><p>Coordinates are presentation-only and have no scientific meaning.</p></section><Derivations ids={resolvedSelection.node.metricDerivationIds} /></> : resolvedSelection.kind === IntentionSelectionKind.INTENTION_PROJECTED_LINK ? <><section><h3>Descriptive link</h3><dl><div><dt>ID</dt><dd>{resolvedSelection.link.id}</dd></div><div><dt>Source</dt><dd>{resolvedSelection.link.sourceNodeId}</dd></div><div><dt>Target</dt><dd>{resolvedSelection.link.targetNodeId}</dd></div><div><dt>Kind</dt><dd>{resolvedSelection.link.kind}</dd></div><div><dt>Candidate</dt><dd>{projection?.lineage.candidateId ?? "NONE"}</dd></div><div><dt>Evaluation</dt><dd>{projection?.lineage.evaluationId ?? "NONE"}</dd></div><div><dt>Resolve</dt><dd>{projection?.lineage.resolveExecutionId ?? "NONE"}</dd></div></dl><p>This descriptive link is not an accepted canonical relationship.</p></section><Derivations ids={resolvedSelection.link.metricDerivationIds} /></> : <Derivation value={resolvedSelection.derivation} projectionId={projection?.id} onFeedback={setFeedback} />}
    {projection?.hypotheses.map(hypothesis => <section key={hypothesis.id}><h3>Explicit hypothesis</h3><p>{hypothesis.statement}</p><button type="button" onClick={() => setFeedback(collectTypedResearchSource(research, () => intentionHypothesisResearchAnchor({ investigationId: projection.lineage.investigationId, projectionId: projection.id, revisionId: projection.lineage.operationalRevisionId, executionId: projection.executionId, hypothesis })).message)}>Add hypothesis to Research Inbox</button></section>)}
    {feedback && <p role="status" aria-live="polite">{feedback}</p>}
  </aside>;
}
