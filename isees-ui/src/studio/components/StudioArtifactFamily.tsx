import type { StudioV1SaveState } from "../v1/runtime/StudioV1SaveOrchestrator.ts";
import { projectStudioArtifactFamily } from "./StudioArtifactFamilySemantics.ts";

export function StudioArtifactFamily({ state, dirty }: { readonly state: StudioV1SaveState; readonly dirty: boolean }) {
  const children = projectStudioArtifactFamily(state.projections, state.headRevisionId);
  const revision = state.revisionNumber ? `revision ${state.revisionNumber}` : "unsaved draft";
  return <div className="studio-artifact-family" aria-label={`Canonical .author ${revision} and governed child projections`}>
    <div className={`studio-artifact-family__source studio-artifact-family__source--${dirty ? "dirty" : state.headRevisionId ? "saved" : "local"}`}>
      <span className="studio-artifact-family__glyph" role="img" aria-label="Canonical dot author source glyph"><b>A</b><small>.author</small></span>
      <span><strong>Canonical source</strong><small>{state.headRevisionId ? `.author · immutable revision ${state.revisionNumber}` : ".author · local draft"}</small></span>
      <em>{dirty ? "Dirty · next saved revision pending" : state.status === "LOADING" ? "Restoring" : state.status === "FAILED" ? "Failed · draft preserved" : state.headRevisionId ? "Saved" : "Local"}</em>
    </div>
    <div className="studio-artifact-family__arrow" aria-hidden="true">→</div>
    <div className="studio-artifact-family__children" aria-label="Governed child projections">
      {children.map(child => <article key={child.format} className={`studio-artifact-family__child studio-artifact-family__child--${child.state.toLowerCase()}`} aria-label={`${child.format} child projection. ${child.label}. ${child.parentRevisionId ? `Parent ${child.parentRevisionId}.` : "No authoritative projection record."}`} title={`${child.format}: ${child.label}${child.parentRevisionId ? ` · parent ${child.parentRevisionId}` : " · no authoritative record"}`}>
        <span className="studio-artifact-family__file-glyph" aria-hidden="true">{child.format}</span><strong>{child.format}</strong><span>{child.label}</span>
        <small>{child.parentRevisionId ? `Parent: ${child.parentRevisionId}` : "No authoritative projection"}</small>
        {child.projection?.failureCategory && <small className="studio-artifact-family__failure">Failure: {child.projection.failureCategory}</small>}
      </article>)}
    </div>
    {dirty && state.headRevisionId && <p className="studio-artifact-family__note">Local changes do not alter these saved projection records. Future output derives only after the next immutable .author revision is saved.</p>}
  </div>;
}
