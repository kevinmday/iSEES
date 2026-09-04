import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph3D from "react-force-graph-3d";
import type { ForceGraphMethods } from "react-force-graph-3d";
import { createIntentionInitialCameraPose, resolveIntentionRenderDerivations, type IntentionProjectionRenderModel } from "./IntentionProjectionRenderModel";
import type { IntentionProjectionCameraAction } from "./IntentionProjectionCameraInstrument";

export interface IntentionProjection3DProps { readonly model: IntentionProjectionRenderModel; readonly width: number; readonly height: number; readonly cameraAction?: { readonly action: IntentionProjectionCameraAction; readonly sequence: number }; readonly onProjectedNodeSelect?: (nodeId: string) => void; readonly onProjectedLinkSelect?: (linkId: string) => void; readonly onMetricDerivationSelect?: (derivationId: string) => void; }
interface Node3D { readonly id: string; readonly fx: number; readonly fy: number; readonly fz: number; readonly role: "FOCUSED_EVENT" | "COMPARE_EVENT"; readonly derivationIds: readonly string[]; }
interface Link3D { readonly id: string; readonly source: string; readonly target: string; readonly derivationIds: readonly string[]; }

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

export default function IntentionProjection3D({ model, width, height, cameraAction, onProjectedNodeSelect, onProjectedLinkSelect, onMetricDerivationSelect }: IntentionProjection3DProps) {
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
  const initializedGraphIdentityRef = useRef<string | null>(null);
  const lastCameraSequenceRef = useRef(cameraAction?.sequence ?? 0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const graphData = useMemo(() => ({ nodes: model.nodes.map(node => ({ id: node.id, fx: node.coordinates.x, fy: node.coordinates.y, fz: node.coordinates.z, role: node.projectedNode.role, derivationIds: node.derivationIds })), links: model.links.map(link => ({ id: link.id, source: link.sourceNodeId, target: link.targetNodeId, derivationIds: link.derivationIds })) }), [model]);
  const graphIdentity = useMemo(() => `${model.projectionId}:${model.executionId}:${model.nodes.map(node => `${node.id}@${node.coordinates.x},${node.coordinates.y},${node.coordinates.z}`).join("|")}:${model.links.map(link => `${link.id}@${link.sourceNodeId}>${link.targetNodeId}`).join("|")}`, [model]);
  const activeNode = model.nodes.find(node => node.id === activeNodeId);
  const activeDerivations = activeNode ? resolveIntentionRenderDerivations(model, activeNode.derivationIds) : Object.freeze([]);
  useEffect(() => { if (activeNodeId !== null && !model.nodes.some(node => node.id === activeNodeId)) setActiveNodeId(null); }, [activeNodeId, model]);
  const fit = useCallback(() => graphRef.current?.zoomToFit(0, 72), []);
  const reset = useCallback(() => {
    const graph = graphRef.current;
    const pose = createIntentionInitialCameraPose(model);
    if (!graph || !pose) return;
    graph.cameraPosition(pose.position, pose.target, 0);
  }, [model]);
  useEffect(() => {
    if (width <= 0 || height <= 0 || graphData.nodes.length === 0 || initializedGraphIdentityRef.current === graphIdentity) return;
    reset();
    initializedGraphIdentityRef.current = graphIdentity;
  }, [graphData.nodes.length, graphIdentity, height, reset, width]);
  useEffect(() => { const action=cameraAction?.action; if (!action || !cameraAction.sequence || cameraAction.sequence <= lastCameraSequenceRef.current) return; lastCameraSequenceRef.current = cameraAction.sequence; const graph=graphRef.current; if (!graph) return; if (action === "FIT") { fit(); return; } if (action === "RESET") { reset(); return; } const camera=graph.camera(); const controls=graph.controls() as { target:{x:number;y:number;z:number;set?:(x:number,y:number,z:number)=>void}; update?:()=>void; minDistance:number; maxDistance:number }; const target={x:controls.target.x,y:controls.target.y,z:controls.target.z}; const position={x:camera.position.x,y:camera.position.y,z:camera.position.z}; if (action.startsWith("PAN_")) { const x=action==="PAN_LEFT"?-32:action==="PAN_RIGHT"?32:0; const y=action==="PAN_UP"?32:action==="PAN_DOWN"?-32:0; controls.target.set?.(target.x+x,target.y+y,target.z); controls.update?.(); graph.cameraPosition({x:position.x+x,y:position.y+y,z:position.z},{x:target.x+x,y:target.y+y,z:target.z},0); return; } const factor=action==="ZOOM_IN"?.8:1.25; graph.cameraPosition({x:target.x+(position.x-target.x)*factor,y:target.y+(position.y-target.y)*factor,z:target.z+(position.z-target.z)*factor},target,0); }, [cameraAction, fit, reset]);
  return <div className="intention-canvas" data-projection-mode="3D" aria-label="INTENTION 3D presentation projection; depth and position are not scientific results">
    <ForceGraph3D ref={graphRef} width={Math.max(width,1)} height={Math.max(height,1)} graphData={graphData} backgroundColor="#050b16" showNavInfo={false} enableNodeDrag={false} cooldownTicks={0}
      nodeColor={node => (node as Node3D).role === "FOCUSED_EVENT" ? "#38bdf8" : "#f59e0b"} nodeVal={node => (node as Node3D).role === "FOCUSED_EVENT" ? 9 : 7}
      nodeLabel={node => { const item=node as Node3D; return `${escapeHtml(item.role)} · ${escapeHtml(item.id)}<br />Presentation coordinates only; no scientific geometry.`; }}
      linkLabel={link => `DESCRIPTIVE LINK · ${escapeHtml((link as Link3D).id)}<br />Presentation curvature and proximity are not scientific results.`} linkColor={()=>"#64748b"} linkOpacity={.55} linkWidth={1.5}
      onNodeHover={node=>setHoveredId(node ? (node as Node3D).id : null)} onLinkHover={link=>setHoveredId(link ? (link as Link3D).id : null)}
      onNodeClick={node=>{const item=node as Node3D;setActiveNodeId(item.id);onProjectedNodeSelect?.(item.id);}}
      onLinkClick={link=>onProjectedLinkSelect?.((link as Link3D).id)} />
    <span className="intention-hover-id" aria-live="polite">{hoveredId ?? ""}</span>
    {activeNode && <aside className="intention-tooltip" aria-label={`Metric derivations for projected node ${activeNode.id}`}>
      {activeDerivations.map(item => <button type="button" key={item.id} onClick={() => onMetricDerivationSelect?.(item.id)}>
        <strong>{item.derivation.metricName}</strong> <span>{item.derivation.symbol}</span> · {item.availability} · {item.epistemicClassification} · <code>{item.id}</code>
      </button>)}
    </aside>}
  </div>;
}
