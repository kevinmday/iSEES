import { useMemo } from "react";
import { useAuthorDocument, useAuthorDocumentDirty, useAuthorDocumentRevision } from "../../author/runtime/AuthorDocumentRuntimeContext.tsx";
import { projectCurrentDraftHtml } from "../projection/StudioHtmlProjection.ts";

export function StudioHtmlProjectionPreview() {
  const document = useAuthorDocument();
  const dirty = useAuthorDocumentDirty();
  const runtimeRevision = useAuthorDocumentRevision();
  const projection = useMemo(() => { void runtimeRevision; return document ? projectCurrentDraftHtml(document) : undefined; }, [document, runtimeRevision]);
  return <section className="studio-inspector__card studio-html-preview" aria-labelledby="studio-html-preview-title">
    <header className="studio-html-preview__header"><div><span>LOCAL / DISPOSABLE</span><h3 id="studio-html-preview-title">HTML PROJECTION — CURRENT DRAFT</h3></div><strong>{dirty ? "DIRTY" : "CLEAN"}</strong></header>
    <p>Disposable preview derived from the active .author document.</p><p className="studio-html-preview__boundary">Not an authority record.</p>
    {!projection ? <div className="studio-html-preview__empty" role="status">No active working .author document is available to project.</div> : <><dl className="studio-html-preview__facts"><dt>Source hash</dt><dd><code>{projection.sourceHash}</code></dd><dt>Renderer</dt><dd>{projection.rendererVersion}</dd></dl><iframe title="Current draft HTML projection" sandbox="" srcDoc={projection.html} /></>}
  </section>;
}
