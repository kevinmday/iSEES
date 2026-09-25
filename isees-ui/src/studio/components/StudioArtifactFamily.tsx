import { useRef } from "react";
import type { StudioV1SaveState } from "../v1/runtime/StudioV1SaveOrchestrator.ts";
import { useStudioSaveAction } from "../runtime/StudioSaveActionContext.ts";
import { projectStudioArtifactFamily } from "./StudioArtifactFamilySemantics.ts";
import { StudioManifoldArtifactInspector } from "./StudioManifoldArtifactInspector.tsx";

export function StudioArtifactFamily({ state, dirty }: { readonly state: StudioV1SaveState; readonly dirty: boolean }) {
  const actions=useStudioSaveAction(),inspectTrigger=useRef<HTMLButtonElement>(null);
  const selectedRevisionId=state.historicalRevisionId??state.headRevisionId;
  const children = projectStudioArtifactFamily(state.projections, selectedRevisionId);
  const ordinary=children.filter(child=>child.format!=="MANIFOLD_ARTIFACT"),manifold=children.find(child=>child.format==="MANIFOLD_ARTIFACT")!;
  const successful=state.projections?.items.find(item=>item.format==="MANIFOLD_ARTIFACT"&&item.parentRevisionId===selectedRevisionId&&Boolean(item.outputHash)&&["CURRENT","PUBLISHED","STALE","SUPERSEDED"].includes(item.state));
  const selectedNumber=state.selectedRevision?.revision.revisionNumber??state.revisionNumber;
  const authorityUnavailable=!state.ownerPrincipalId||state.status==="UNAUTHENTICATED";
  const closeInspector=()=>{actions.closeManifoldInspector();queueMicrotask(()=>inspectTrigger.current?.focus())};
  const revision = state.revisionNumber ? `revision ${state.revisionNumber}` : "unsaved draft";
  return <div className="studio-artifact-family" aria-label={`Canonical .author ${revision} and governed child projections`}>
    <div className={`studio-artifact-family__source studio-artifact-family__source--${dirty ? "dirty" : state.headRevisionId ? "saved" : "local"}`}>
      <span className="studio-artifact-family__glyph" role="img" aria-label="Canonical dot author source glyph"><b>A</b><small>.author</small></span>
      <span><strong>Canonical source</strong><small>{state.headRevisionId ? `.author · immutable revision ${state.revisionNumber}` : ".author · local draft"}</small></span>
      <em>{dirty ? "Dirty · next saved revision pending" : state.status === "LOADING" ? "Restoring" : state.status === "FAILED" ? "Failed · draft preserved" : state.headRevisionId ? "Saved" : "Local"}</em>
    </div>
    <div className="studio-artifact-family__arrow" aria-hidden="true">→</div>
    <div className="studio-artifact-family__children" aria-label="Governed child projections">
      {ordinary.map(child => <article key={child.format} className={`studio-artifact-family__child studio-artifact-family__child--${child.state.toLowerCase()}`} aria-label={`${child.format} child projection. ${child.label}. ${child.parentRevisionId ? `Parent ${child.parentRevisionId}.` : "No authoritative projection record."}`} title={`${child.format}: ${child.label}${child.parentRevisionId ? ` · parent ${child.parentRevisionId}` : " · no authoritative record"}`}>
        <span className="studio-artifact-family__file-glyph" aria-hidden="true">{child.format}</span><strong>{child.format}</strong><span>{child.label}</span>
        <small>{child.parentRevisionId ? `Parent: ${child.parentRevisionId}` : "No authoritative projection"}</small>
        {child.projection?.failureCategory && <small className="studio-artifact-family__failure">Failure: {child.projection.failureCategory}</small>}
      </article>)}
      <article className={`studio-artifact-family__child studio-artifact-family__manifold studio-artifact-family__child--${manifold.state.toLowerCase()}`} aria-labelledby="studio-manifold-card-title">
        <span className="studio-artifact-family__file-glyph" aria-hidden="true">MFA</span><strong id="studio-manifold-card-title">MANIFOLD ARTIFACT</strong><span>Machine-readable event-space projection</span>
        <b className="studio-artifact-family__projection-state">{manifold.projection?.state??"NOT_GENERATED"}</b>
        <small>{selectedRevisionId?`Exact saved .author revision ${selectedNumber??"selected"}: ${selectedRevisionId}`:authorityUnavailable?"Unavailable · authenticated account authority required":"Unavailable · save an authoritative .author revision first"}</small>
        <p>For future governed Manifold admission and REX expansion. Creating this projection adds nothing to the Manifold. It contains only explicit structured declarations and frozen references; no prose parsing or AI interpretation occurs.</p>
        {manifold.projection?.state==="CURRENT"&&<p className="studio-artifact-family__projected">Projected · Not admitted to Manifold.</p>}
        {dirty&&selectedRevisionId&&<p className="studio-artifact-family__warning">The artifact represents the last saved revision. Unsaved changes are not projected or saved by these actions.</p>}
        {manifold.projection?.state==="FAILED"&&successful&&<p className="studio-artifact-family__warning">Latest attempt failed. Prior successful projection {successful.projectionId} is retained.</p>}
        <div className="studio-artifact-family__actions"><button type="button" className="studio-inspector__button studio-inspector__button--primary" disabled={!selectedRevisionId||authorityUnavailable||Boolean(state.manifoldBusy)} onClick={()=>void actions.materializeManifoldArtifact()}>CREATE MANIFOLD ARTIFACT</button><button ref={inspectTrigger} type="button" className="studio-inspector__button" disabled={!successful||Boolean(state.manifoldBusy)} onClick={()=>void actions.inspectManifoldArtifact()}>INSPECT MANIFEST</button><button type="button" className="studio-inspector__button" disabled={!successful||Boolean(state.manifoldBusy)} onClick={()=>void actions.downloadManifoldArtifact()}>DOWNLOAD MANIFOLD ARTIFACT</button></div>
        <p className="studio-artifact-family__status" role={state.manifoldMessage?.includes("failed")||state.manifoldMessage?.includes("malformed")?"alert":"status"} aria-live="polite">{state.manifoldMessage??(authorityUnavailable?"Unavailable for guest or session-only authority.":!selectedRevisionId?"No authoritative saved revision.":manifold.label)}</p>
      </article>
    </div>
    {dirty && state.headRevisionId && <p className="studio-artifact-family__note">Local changes do not alter these saved projection records. Future output derives only after the next immutable .author revision is saved.</p>}
    {state.manifoldManifest&&state.manifoldArtifact&&<StudioManifoldArtifactInspector manifest={state.manifoldManifest} projectionId={state.manifoldArtifact.projectionId} outputHash={state.manifoldArtifact.outputHash!} onClose={closeInspector}/>}
  </div>;
}
