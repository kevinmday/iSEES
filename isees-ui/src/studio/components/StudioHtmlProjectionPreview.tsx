import { useEffect, useMemo, useRef } from "react";
import { useAuthorDocument, useAuthorDocumentDirty, useAuthorDocumentRevision } from "../../author/runtime/AuthorDocumentRuntimeContext.tsx";
import { projectAuthorRevisionHtml, projectCurrentDraftHtml } from "../projection/StudioHtmlProjection.ts";
import { useStudioSaveAction } from "../runtime/StudioSaveActionContext.ts";

export function StudioHtmlProjectionPreview() {
  const document = useAuthorDocument();
  const dirty = useAuthorDocumentDirty();
  const runtimeRevision = useAuthorDocumentRevision();
  const saveAction = useStudioSaveAction();
  const listedHead = useRef<string | undefined>(undefined);
  const liveProjection = useMemo(() => { void runtimeRevision; return document ? projectCurrentDraftHtml(document) : undefined; }, [document, runtimeRevision]);
  const selectedDetail = saveAction.state.selectedRevision;
  const revisionProjection = useMemo(() => selectedDetail ? projectAuthorRevisionHtml(selectedDetail.revision) : undefined, [selectedDetail]);
  const revisionAvailable = Boolean(saveAction.state.artifactId && saveAction.state.headRevisionId);
  useEffect(() => {
    const key = revisionAvailable ? `${saveAction.state.artifactId}:${saveAction.state.headRevisionId}` : undefined;
    if (!key || listedHead.current === key) return;
    listedHead.current = key; void saveAction.listRevisions();
  }, [revisionAvailable, saveAction, saveAction.state.artifactId, saveAction.state.headRevisionId]);
  const selected = saveAction.state.historicalRevisionId ?? "CURRENT_DRAFT";
  const isHead = selectedDetail?.revision.revisionId === saveAction.state.headRevisionId;
  const projection = revisionProjection ?? liveProjection;
  const title = selectedDetail ? `HTML PROJECTION — ${isHead ? "SAVED" : "HISTORICAL"} REVISION ${selectedDetail.revision.revisionNumber}` : "HTML PROJECTION — CURRENT DRAFT";
  const description = selectedDetail ? "Read-only reconstruction from immutable AuthorRevision." : "Disposable preview derived from the active .author document.";
  return <section className="studio-inspector__card studio-html-preview" aria-labelledby="studio-html-preview-title">
    <header className="studio-html-preview__header"><div><span>LOCAL / DISPOSABLE</span><h3 id="studio-html-preview-title">{title}</h3></div><strong>{selectedDetail ? "READ ONLY" : dirty ? "DIRTY" : "CLEAN"}</strong></header>
    <label className="studio-html-preview__selector">Preview source<select value={selected} disabled={!revisionAvailable && selected === "CURRENT_DRAFT"} onChange={event => event.target.value === "CURRENT_DRAFT" ? saveAction.clearRevisionPreview() : void saveAction.loadRevision(event.target.value)}><option value="CURRENT_DRAFT">Current Draft</option>{saveAction.state.revisions.map(revision => <option key={revision.revisionId} value={revision.revisionId}>{revision.revisionId === saveAction.state.headRevisionId ? `Saved Revision ${revision.revisionNumber}` : `Historical Revision ${revision.revisionNumber}`}</option>)}</select></label>
    {!revisionAvailable && <p className="studio-html-preview__availability">Saved revision preview is unavailable. Current Draft remains operational.</p>}
    <p>{description}</p><p className="studio-html-preview__boundary">Not an authority record.</p>
    {saveAction.state.revisionPreviewStatus === "LIST_LOADING" && <p role="status">Loading immutable revision history…</p>}
    {saveAction.state.revisionPreviewStatus === "REVISION_LOADING" && <div className="studio-html-preview__empty" role="status">Loading exact immutable AuthorRevision…</div>}
    {saveAction.state.revisionPreviewError && <div className="studio-html-preview__error" role="alert">{saveAction.state.revisionPreviewError}</div>}
    {!projection ? <div className="studio-html-preview__empty" role="status">No active working .author document is available to project.</div> : saveAction.state.revisionPreviewStatus !== "REVISION_LOADING" && <><dl className="studio-html-preview__facts">{selectedDetail && <><dt>Revision</dt><dd>{selectedDetail.revision.revisionNumber}</dd><dt>Revision ID</dt><dd><code>{selectedDetail.revision.revisionId}</code></dd></>}<dt>Source hash</dt><dd><code>{projection.sourceHash}</code></dd><dt>Renderer</dt><dd>{projection.rendererVersion}</dd></dl><iframe title={selectedDetail ? `Revision ${selectedDetail.revision.revisionNumber} HTML projection` : "Current draft HTML projection"} sandbox="" srcDoc={projection.html} /></>}
  </section>;
}
