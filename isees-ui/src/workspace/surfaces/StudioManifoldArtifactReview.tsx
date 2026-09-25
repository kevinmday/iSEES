import { useEffect, useRef, useState } from "react";
import type { ManifoldDeclaration, ManifoldReference } from "../../studio/contracts/StudioV1Contract";
import type { StudioManifoldArtifactDraft } from "../../studio/drafting/StudioDraftingTypes";
import "./StudioManifoldArtifactReview.css";
import { useStudioSaveAction } from "../../studio/runtime/StudioSaveActionContext.ts";
import { StudioManifoldArtifactInspector } from "../../studio/components/StudioManifoldArtifactInspector.tsx";

const reference = (value: ManifoldReference) => `${value.kind}:${value.identity}`;
const declarationDetail = (value: ManifoldDeclaration): string => {
  switch (value.declarationType) {
    case "PROPOSED_RELATIONSHIP": return `${reference(value.subject)} — ${value.predicate} → ${reference(value.object)}`;
    case "RESEARCHER_ASSERTION": return value.statement;
    case "DECLARED_UNKNOWN": return value.question;
    case "DECLARED_CONTRADICTION": return value.statement;
    case "RESEARCH_VECTOR": return value.researchQuestion;
    case "SCOPE_CONSTRAINT": return value.constraint;
    case "EXCLUSION": return `${reference(value.excludedReference)} — ${value.rationale}`;
  }
};

export default function StudioManifoldArtifactReview({ artifact, onReturnToStudio }: { readonly artifact: StudioManifoldArtifactDraft; readonly onReturnToStudio: () => void }) {
  const panel = useRef<HTMLElement>(null),actions=useStudioSaveAction(),[admissionOpen,setAdmissionOpen]=useState(false);
  useEffect(() => panel.current?.focus(), [artifact]);
  const { projection, contextManifest } = artifact;
  const proposals = projection.declarations.filter(value => value.declarationType === "PROPOSED_RELATIONSHIP");
  return <section ref={panel} tabIndex={-1} className="manifold-artifact-review" aria-labelledby="manifold-artifact-review-title">
    <header><div><span>MANIFOLD / GOVERNED ADMISSION REVIEW</span><h2 id="manifold-artifact-review-title">Proposed Manifold Artifact</h2></div><div className="manifold-artifact-review__header-actions"><strong>PROPOSED · UNADMITTED</strong>{actions.admission.eligible&&<button type="button" onClick={()=>setAdmissionOpen(true)}>ADMIT &amp; RECOMPUTE</button>}<button type="button" onClick={onReturnToStudio}>RETURN TO STUDIO</button></div></header>
    <p className="manifold-artifact-review__boundary">Read-only session projection. No nodes or edges have been admitted, and the canonical Manifold has not been recomputed.</p>
    <section><h3>Validation and authority</h3><dl><dt>Contract validation</dt><dd>PASS · {projection.schemaVersion}</dd><dt>Output integrity</dt><dd>{artifact.outputHash}</dd><dt>Canon effect</dt><dd>{projection.canonEffect}</dd><dt>Confidence status</dt><dd>NOT COMPUTED · confidence fields are excluded by contract</dd><dt>Admission authority</dt><dd>{actions.admission.eligible?actions.admission.guest?"AVAILABLE · disposable guest investigation only":"AVAILABLE · authenticated owned investigation":"UNAVAILABLE · review only; no Admit & Recompute command is exposed"}</dd></dl></section>
    <section><h3>Exact source identity</h3><dl><dt>Investigation</dt><dd>{projection.source.investigationId}</dd><dt>Artifact</dt><dd>{projection.source.artifactId}</dd><dt>Document</dt><dd>{projection.source.documentId}</dd><dt>Revision</dt><dd>{projection.source.revisionId} · r{projection.source.revisionNumber}</dd><dt>Content hash</dt><dd>{projection.source.contentHash}</dd><dt>Context hash</dt><dd>{contextManifest.contextHash}</dd></dl></section>
    <section><h3>Proposed nodes and edges</h3><p>{projection.sourceKnowledgeIdentities.length + projection.evidenceReferences.length} referenced node identities · {proposals.length} proposed edges</p>
      {[...projection.sourceKnowledgeIdentities, ...projection.evidenceReferences].length ? <ul>{[...projection.sourceKnowledgeIdentities, ...projection.evidenceReferences].map(value => <li key={reference(value)}><code>{reference(value)}</code></li>)}</ul> : <p>None proposed.</p>}
      {proposals.length ? <ul>{proposals.map(value => <li key={value.declarationId}><strong>{value.declarationId}</strong><br />{declarationDetail(value)}</li>)}</ul> : <p>No proposed relationship declarations.</p>}
    </section>
    <section><h3>Provenance</h3>{projection.normalizedProvenance.length ? <ul>{projection.normalizedProvenance.map(value => <li key={value.provenanceId}><strong>{value.sourceIdentity}</strong><br /><code>{reference(value.reference)}</code>{value.reference.integrityHash ? <> · <code>{value.reference.integrityHash}</code></> : null}</li>)}</ul> : <p>No normalized provenance entries.</p>}</section>
    <section><h3>Declarations</h3>{projection.declarations.length ? <ul>{projection.declarations.map(value => <li key={value.declarationId}><strong>{value.declarationType.replaceAll("_", " ")}</strong> · {value.declarationId}<br />{declarationDetail(value)}<br /><small>Source: {value.source.authorship} · {value.source.sourceIdentity}</small></li>)}</ul> : <p>No declarations.</p>}</section>
    <section><h3>Exclusions</h3>{contextManifest.excludedSources.length ? <ul>{contextManifest.excludedSources.map(value => <li key={value.anchorId}><strong>{value.anchorId}</strong> · {value.reason}</li>)}</ul> : <p>No sources were excluded.</p>}</section>
    {admissionOpen&&<StudioManifoldArtifactInspector manifest={projection} projectionId={`session:${artifact.outputHash}`} outputHash={artifact.outputHash} onClose={()=>setAdmissionOpen(false)}/>}
  </section>;
}
