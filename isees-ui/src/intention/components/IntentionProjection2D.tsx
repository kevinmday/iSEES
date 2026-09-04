import { useMemo, useState } from "react";
import { resolveIntentionEquation, type IntentionMetricDerivation } from "../projection";
import type { IntentionProjectionRenderModel } from "./IntentionProjectionRenderModel";
import type { IntentionProjectionCameraAction } from "./IntentionProjectionCameraInstrument";

export interface IntentionProjection2DProps { readonly model: IntentionProjectionRenderModel; readonly width: number; readonly height: number; readonly cameraAction?: { readonly action: IntentionProjectionCameraAction; readonly sequence: number }; readonly onProjectedNodeSelect?: (nodeId: string) => void; readonly onProjectedLinkSelect?: (linkId: string) => void; readonly onMetricDerivationSelect?: (derivationId: string) => void; }

function DerivationTooltip({ derivation, onSelect }: { readonly derivation: IntentionMetricDerivation; readonly onSelect?: (id: string) => void }) {
  const equation = resolveIntentionEquation(derivation.equationId);
  return <div className={`intention-tooltip status-${derivation.availability.toLowerCase()}`} role="tooltip">
    <div><strong>{derivation.metricName}</strong> <span>{derivation.symbol}</span></div>
    <div>{derivation.availability}{derivation.availability === "AVAILABLE" ? ` · ${derivation.displayValue ?? derivation.value}${derivation.units ? ` ${derivation.units}` : ""}` : ""}</div>
    <div>{derivation.epistemicClassification}</div><code>{equation.displayExpression}</code>
    {derivation.inputs.map((input, index) => <div key={`${input.id}:${index}`}>{index + 1}. {input.symbol} ← {String(input.value ?? input.availability)} · {input.sourcePath}</div>)}
    {derivation.unavailableInputs.length > 0 && <div>Unavailable: {derivation.unavailableInputs.join(", ")}</div>}
    {derivation.reason && <div>{derivation.reason}</div>}
    <div>K: {derivation.sourceKnowledgeIds.join(", ") || "—"}</div><div>R: {derivation.sourceRelationshipIds.join(", ") || "—"}</div>
    <div>{derivation.investigationId} · {derivation.operationalRevisionId}{derivation.resolveExecutionId ? ` · ${derivation.resolveExecutionId}` : ""}</div>
    <div>{derivation.intentionExecutionId} · {derivation.modelId}@{derivation.modelVersion} · {derivation.configurationId}</div>
    <button type="button" onClick={() => onSelect?.(derivation.id)}>{derivation.id}</button>
  </div>;
}

export default function IntentionProjection2D({ model, width, height, cameraAction, onProjectedNodeSelect, onProjectedLinkSelect, onMetricDerivationSelect }: IntentionProjection2DProps) {
  const [hoveredDerivationId, setHoveredDerivationId] = useState<string | null>(null);
  const action = cameraAction?.action;
  const sequence = cameraAction?.sequence ?? 0;
  const camera = useMemo(() => {
    const base = { x: 0, y: 0, scale: 1 };
    if (!sequence || action === "FIT" || action === "RESET") return base;
    if (action === "ZOOM_IN") return { ...base, scale: 1.25 };
    if (action === "ZOOM_OUT") return { ...base, scale: .8 };
    return { ...base, x: action === "PAN_LEFT" ? -32 : action === "PAN_RIGHT" ? 32 : 0, y: action === "PAN_UP" ? -32 : action === "PAN_DOWN" ? 32 : 0 };
  }, [action, sequence]);
  const nodeById = new Map(model.nodes.map(node => [node.id, node]));
  const derivation = model.derivations.find(item => item.id === hoveredDerivationId)?.derivation;
  const cx = width / 2 + camera.x, cy = height / 2 + camera.y;
  return <div className="intention-canvas" data-projection-mode="2D">
    <svg width={Math.max(width, 1)} height={Math.max(height, 1)} role="img" aria-label="INTENTION 2D presentation projection; positions are not scientific results">
      <g transform={`translate(${cx} ${cy}) scale(${camera.scale})`}>
        {model.links.map(link => { const source=nodeById.get(link.sourceNodeId)!; const target=nodeById.get(link.targetNodeId)!; return <line key={link.id} x1={source.coordinates.x} y1={source.coordinates.y} x2={target.coordinates.x} y2={target.coordinates.y} className="intention-link" tabIndex={0} aria-label={`Descriptive comparison link ${link.id}`} onClick={() => onProjectedLinkSelect?.(link.id)} />; })}
        {model.nodes.map(node => <g key={node.id} transform={`translate(${node.coordinates.x} ${node.coordinates.y})`} className={`intention-node ${node.projectedNode.role === "FOCUSED_EVENT" ? "focused" : "comparison"}`} tabIndex={0} role="button" aria-label={`${node.projectedNode.role === "FOCUSED_EVENT" ? "Focused" : "Comparison"} projected event ${node.projectedNode.canonicalEventId}`} onClick={() => onProjectedNodeSelect?.(node.id)}>
          {node.shapeToken === "FOCUSED_DIAMOND" ? <rect x="-14" y="-14" width="28" height="28" rx="3" transform="rotate(45)" /> : <circle r="17" />}
          <text y="34" textAnchor="middle">{node.projectedNode.canonicalEventId}</text>
          {node.derivationIds.map((id, index) => { const item=model.derivations.find(d=>d.id===id); return item ? <circle key={id} cx={-10 + index*10} cy={-27} r="4" className={`metric status-${item.availability.toLowerCase()}`} aria-hidden="true" onMouseEnter={()=>setHoveredDerivationId(id)} onMouseLeave={()=>setHoveredDerivationId(null)} onClick={event=>{event.stopPropagation();onMetricDerivationSelect?.(id);}} /> : null; })}
        </g>)}
      </g>
    </svg>
    {derivation && <DerivationTooltip derivation={derivation} onSelect={onMetricDerivationSelect} />}
  </div>;
}
