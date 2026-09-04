import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { IntentionProjection } from "../projection";
import { createIntentionProjectionRenderModel, groupIntentionRenderDerivationsByOwner } from "./IntentionProjectionRenderModel";
import IntentionProjection2D from "./IntentionProjection2D";
import IntentionProjectionCameraInstrument, { type IntentionProjectionCameraAction } from "./IntentionProjectionCameraInstrument";
import "./IntentionProjectionRenderer.css";

const IntentionProjection3D = lazy(() => import("./IntentionProjection3D"));
export interface IntentionProjectionViewportProps { readonly projection: IntentionProjection; readonly selectedDerivationId?: string; readonly onProjectedNodeSelect?: (nodeId: string) => void; readonly onProjectedLinkSelect?: (linkId: string) => void; readonly onMetricDerivationSelect?: (derivationId: string) => void; }

export default function IntentionProjectionViewport(props: IntentionProjectionViewportProps) {
  const { projection, selectedDerivationId, onProjectedNodeSelect, onProjectedLinkSelect, onMetricDerivationSelect } = props;
  const hostRef=useRef<HTMLDivElement|null>(null); const [size,setSize]=useState({width:0,height:0}); const [mode,setMode]=useState<"2D"|"3D">("2D"); const [cameraAction,setCameraAction]=useState<{action:IntentionProjectionCameraAction;sequence:number}>({action:"FIT",sequence:0});
  const model=useMemo(()=>createIntentionProjectionRenderModel(projection),[projection]);
  const derivationOwnerGroups=useMemo(()=>groupIntentionRenderDerivationsByOwner(model),[model]);
  useEffect(()=>{const host=hostRef.current;if(!host)return;const measure=()=>{const rect=host.getBoundingClientRect();setSize({width:rect.width,height:rect.height});};measure();const observer=new ResizeObserver(measure);observer.observe(host);return()=>observer.disconnect();},[]);
  const rendererProps={model,width:size.width,height:size.height,cameraAction,onProjectedNodeSelect,onProjectedLinkSelect,onMetricDerivationSelect};
  return <section ref={hostRef} className="intention-viewport" aria-label="INTENTION mathematical projection renderer">
    <div className="intention-mode-switch" role="group" aria-label="Projection dimension"><button type="button" aria-pressed={mode==="2D"} onClick={()=>setMode("2D")}>2D</button><button type="button" aria-pressed={mode==="3D"} onClick={()=>setMode("3D")}>3D</button></div>
    <IntentionProjectionCameraInstrument onAction={action=>setCameraAction(current=>({action,sequence:current.sequence+1}))}/>
    <div className="intention-derivation-controls" role="group" aria-label="Metric derivations">
      {derivationOwnerGroups.map(group => <div className="intention-derivation-owner" role="group" aria-label={`${group.kind === "EVENT" ? "Canonical event" : "Descriptive link"} ${group.identity}`} key={group.id}><strong title={group.identity}>{group.label}</strong><div>{group.derivations.map(item => <button type="button" key={item.id} className="intention-derivation-control" aria-label={`Select ${item.derivation.metricName} derivation, ${item.availability}, owner ${group.kind === "EVENT" ? `canonical event ${group.identity}` : `descriptive link ${group.identity}`}`} aria-pressed={selectedDerivationId === item.id} title={`${item.derivation.metricName} · ${item.availability} · ${group.identity}`} onClick={() => onMetricDerivationSelect?.(item.id)}><span>{item.derivation.symbol}</span><small>{item.availability}</small></button>)}</div></div>)}
    </div>
    {mode === "2D" ? <IntentionProjection2D {...rendererProps}/> : <Suspense fallback={<div className="intention-loading" role="status">Loading isolated 3D projection…</div>}><IntentionProjection3D {...rendererProps}/></Suspense>}
    <div className="intention-disclaimer">PRESENTATION LAYOUT · NOT A SCIENTIFIC RESULT</div>
  </section>;
}
