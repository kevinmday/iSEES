import { useEffect, useMemo, useState } from "react";
import { useOperatorIdentity } from "../../identity/runtime/OperatorIdentityRuntimeContext";
import { candidateEvidenceApi } from "../../evidence/candidates/CandidateEvidenceApi";
import type { ApiCandidateRecord, CandidateEvidenceApiScope } from "../../evidence/candidates/CandidateEvidenceApi";
import { beginCandidateRequest, EMPTY_CANDIDATE_REQUEST, partitionCandidateEvidence, permittedReviewActions, reconcileCandidateTransition, reviewActionLabel, settleCandidateRequest } from "../../evidence/candidates/CandidateEvidenceRuntime";
import type { CandidateRequestState } from "../../evidence/candidates/CandidateEvidenceRuntime";
import { createEvidenceWorkspaceView, projectInvestigationEvidence, resolveEvidenceInspection } from "../../evidence/projection/EvidenceWorkspaceProjection";
import type { EvidenceInspectionSelection, EvidenceOptionalValue, EvidenceWorkspaceFilters } from "../../evidence/projection/EvidenceWorkspaceProjectionTypes";
import { useWorkspaceRuntime } from "../runtime/WorkspaceRuntimeContext";
import "./EvidenceWorkspace.css";
import { useResearchBridge } from "../../research/ResearchBridgeContext";
import { evidenceRecordResearchAnchor } from "../../studio/sources/TypedResearchSourceAdapters";
import { collectTypedResearchSource } from "../../studio/sources/DirectResearchPublication";

function presentOptional<T>(field: EvidenceOptionalValue<T>, format: (value: T) => string = String): string {
  return field.status === "KNOWN" ? format(field.value) : "UNKNOWN";
}
function presentUnknown(value: unknown): string { return value === undefined || value === null || value === "" ? "UNKNOWN" : typeof value === "object" ? JSON.stringify(value) : String(value); }
function sourceLocator(record: ApiCandidateRecord): string { const reference = record.lineage.repositoryReference as Readonly<Record<string, unknown>> | undefined; return presentUnknown(record.source.originalLocator ?? record.source.normalizedUrl ?? reference?.sourceLocator); }

export default function EvidenceWorkspace() {
  const runtime = useWorkspaceRuntime();
  const research = useResearchBridge();
  const operator = useOperatorIdentity();
  const investigation = runtime.getActiveInvestigation();
  const projection = useMemo(
    () => investigation === undefined ? undefined : projectInvestigationEvidence(investigation),
    [investigation],
  );
  const [selection, setSelection] = useState<EvidenceInspectionSelection>();
  const [filters, setFilters] = useState<EvidenceWorkspaceFilters>({});
  const [lane, setLane] = useState<"INVESTIGATION" | "CANDIDATE" | "CURATED">("INVESTIGATION");
  const [candidateRequest, setCandidateRequest] = useState<CandidateRequestState>(EMPTY_CANDIDATE_REQUEST);
  const [candidateBinding, setCandidateBinding] = useState<{ investigationAggregateRevision: number; manifoldRevisionId: string }>();
  const [submission, setSubmission] = useState({ pathway: "DIRECT_URL" as "DIRECT_URL" | "RESEARCHER_NOTE" | "DIRECT_UPLOAD", title: "", value: "" });
  const [uploadFile, setUploadFile] = useState<File>();
  const [fileInputKey, setFileInputKey] = useState(0);
  const [commandError, setCommandError] = useState<string>();
  const [commandSuccess, setCommandSuccess] = useState<string>();
  const [collectionFeedback, setCollectionFeedback] = useState<string>();
  const principalId = operator.identity?.operatorId;
  const apiScope = useMemo<CandidateEvidenceApiScope | undefined>(() => investigation && principalId ? { investigationId: investigation.id, principalId } : undefined, [investigation, principalId]);

  async function fetchCandidates(scope: CandidateEvidenceApiScope, signal?: AbortSignal) {
    try {
      const response = await candidateEvidenceApi.list(scope, signal);
      setCandidateBinding({ investigationAggregateRevision: response.investigationAggregateRevision, manifoldRevisionId: response.manifoldRevisionId });
      setCandidateRequest((current) => settleCandidateRequest(current, scope, "READY", response.items));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setCandidateRequest((current) => settleCandidateRequest(current, scope, error instanceof TypeError ? "UNAVAILABLE" : "FAILED", [], error instanceof Error ? error.message : "Unknown request failure"));
    }
  }

  useEffect(() => {
    setSelection(undefined);
    setFilters({});
    setLane("INVESTIGATION");
    setCommandError(undefined);
    setCandidateBinding(undefined);
    if (!apiScope) { setCandidateRequest(EMPTY_CANDIDATE_REQUEST); return; }
    setCandidateRequest(beginCandidateRequest(apiScope));
    const controller = new AbortController();
    void fetchCandidates(apiScope, controller.signal);
    return () => controller.abort();
  }, [projection?.investigation.id, apiScope]);

  const scopedRequest = candidateRequest.scope?.investigationId === apiScope?.investigationId && candidateRequest.scope?.principalId === apiScope?.principalId ? candidateRequest : apiScope ? beginCandidateRequest(apiScope) : EMPTY_CANDIDATE_REQUEST;
  const candidateLanes = useMemo(() => partitionCandidateEvidence(scopedRequest.records), [scopedRequest.records]);
  const selectedCandidate = scopedRequest.records.find((record) => record.candidateId === scopedRequest.selectedCandidateId);

  function selectCandidate(record: ApiCandidateRecord) { setCandidateRequest((current) => current.scope?.investigationId === record.investigationId ? { ...current, selectedCandidateId: record.candidateId } : current); }
  async function review(record: ApiCandidateRecord, to: "REFERENCED" | "IN_REVIEW" | "DEFERRED" | "EXCLUDED") {
    if (!apiScope || !window.confirm(`Confirm ${record.lifecycleState} → ${to}?`)) return;
    const reason = to === "DEFERRED" || to === "EXCLUDED" ? window.prompt(`${to} requires a reason:`)?.trim() : undefined;
    if ((to === "DEFERRED" || to === "EXCLUDED") && !reason) { setCommandError(`${to} requires an explicit reason.`); return; }
    try { const updated = await candidateEvidenceApi.transition(apiScope, record.candidateId, { schemaVersion: "candidate-evidence-command/v1", investigationId: apiScope.investigationId, expectedRevision: record.revision, to, reviewDecision: reason ? { decision: to as "DEFERRED" | "EXCLUDED", reason } : undefined, idempotencyKey: `review-${Date.now()}-${crypto.randomUUID()}` }); setCommandError(undefined); setCandidateRequest((current) => reconcileCandidateTransition(current, apiScope, updated)); await fetchCandidates(apiScope); }
    catch (error) { setCommandError(error instanceof Error ? error.message : "Review request failed."); }
  }
  async function submitCandidate(event: React.FormEvent) {
    event.preventDefault(); if (!apiScope || !investigation || !candidateBinding || (submission.pathway === "DIRECT_UPLOAD" ? !uploadFile : !submission.value.trim())) return;
    const activeInvestigationRevision = candidateBinding.investigationAggregateRevision;
    const activeRevisionId = candidateBinding.manifoldRevisionId;
    const identity = `intake-${crypto.randomUUID()}`;
    try { const shared = { investigationId: apiScope.investigationId, expectedInvestigationRevision: activeInvestigationRevision, manifoldRevisionId: activeRevisionId, operationId: identity, ...(submission.title.trim() ? { title: submission.title.trim() } : {}), idempotencyKey: identity }; const created = submission.pathway === "DIRECT_UPLOAD" ? await candidateEvidenceApi.upload(apiScope, { schemaVersion: "candidate-evidence-upload/v1", ...shared, ...(submission.value.trim() ? { noteText: submission.value.trim() } : {}), file: uploadFile! }) : await candidateEvidenceApi.intake(apiScope, { schemaVersion: "candidate-evidence-intake/v1", ...shared, pathway: submission.pathway, ...(submission.pathway === "DIRECT_URL" ? { submittedUrl: submission.value.trim() } : { noteText: submission.value.trim() }) }); setSubmission({ pathway: submission.pathway, title: "", value: "" }); setUploadFile(undefined); setFileInputKey((value) => value + 1); setCommandError(undefined); setCommandSuccess(`Candidate Evidence ${created.candidateId} created for review only. Research Inbox, Investigation Evidence, Curated Context, and the Manifold are unchanged.`); setCandidateRequest(beginCandidateRequest(apiScope)); const refreshed = await candidateEvidenceApi.list(apiScope); setCandidateBinding({ investigationAggregateRevision: refreshed.investigationAggregateRevision, manifoldRevisionId: refreshed.manifoldRevisionId }); setCandidateRequest({ scope: apiScope, status: "READY", records: refreshed.items, selectedCandidateId: created.candidateId }); }
    catch (error) { setCommandError(error instanceof Error ? error.message : "Submission failed."); }
  }

  const view = useMemo(
    () => projection === undefined ? undefined : createEvidenceWorkspaceView(projection, filters),
    [projection, filters],
  );
  const inspected = resolveEvidenceInspection(
    projection === undefined || view === undefined ? undefined : { ...projection, records: view.records },
    selection,
  );

  useEffect(() => {
    if (selection !== undefined && inspected === undefined) setSelection(undefined);
  }, [inspected, selection]);

  if (projection === undefined) {
    return (
      <main className="evidence-workspace evidence-workspace--empty">
        <p className="evidence-eyebrow">EVIDENCE · READ-ONLY</p>
        <h1>No active Investigation</h1>
        <p>Evidence becomes available only within an active Investigation.</p>
      </main>
    );
  }

  return (
    <main className="evidence-workspace">
      <header className="evidence-header">
        <div>
          <p className="evidence-eyebrow">EVIDENCE · READ-ONLY PROJECTION</p>
          <h1>Evidence Chamber</h1>
          <p><strong>{projection.investigation.name}</strong> · Investigation <code>{projection.investigation.id}</code></p>
        </div>
        <div className="evidence-status" aria-label="Evidence projection status">
          Investigation-scoped projection
        </div>
      </header>

      <section className="evidence-lanes" aria-label="Evidence lanes">
        <button type="button" aria-pressed={lane === "INVESTIGATION"} onClick={() => setLane("INVESTIGATION")}><strong>{projection.records.length}</strong><span>Investigation Evidence</span><small>Canonical workspace projection</small></button>
        <button type="button" aria-pressed={lane === "CANDIDATE"} onClick={() => setLane("CANDIDATE")}><strong>{scopedRequest.status === "READY" ? candidateLanes.candidate.length : "—"}</strong><span>Candidate Evidence</span><small>Discovery & submission</small></button>
        <button type="button" aria-pressed={lane === "CURATED"} onClick={() => setLane("CURATED")}><strong>{scopedRequest.status === "READY" ? candidateLanes.curated.length : "—"}</strong><span>Curated Context</span><small>Repository-owned references</small></button>
      </section>
      {commandError && <p className="evidence-api-error" role="alert">{commandError}</p>}
      {commandSuccess && <p className="evidence-api-state" role="status">{commandSuccess}</p>}

      {lane !== "INVESTIGATION" ? (() => {
        const records = lane === "CANDIDATE" ? candidateLanes.candidate : candidateLanes.curated;
        return <>
          <div className="evidence-api-state" aria-live="polite">{scopedRequest.status === "LOADING" ? "Loading Investigation-qualified records…" : scopedRequest.status === "UNAVAILABLE" ? "Candidate Evidence API unavailable — count unknown, not zero." : scopedRequest.status === "FAILED" ? `Candidate Evidence request failed — ${scopedRequest.error}` : scopedRequest.status === "READY" && records.length === 0 ? "Zero records returned for this principal and Investigation." : `${records.length} records`}</div>
          {lane === "CURATED" && <p className="evidence-boundary">Curated Context is repository-owned reference material. It is not admission, claim support, canonical Knowledge, or Accepted Knowledge.</p>}
          {lane === "CANDIDATE" && <form className="evidence-submission" onSubmit={submitCandidate}><strong>Researcher-directed intake</strong><select aria-label="Intake pathway" value={submission.pathway} onChange={(event) => { setSubmission({ ...submission, pathway: event.target.value as "DIRECT_URL" | "RESEARCHER_NOTE" | "DIRECT_UPLOAD", value: "" }); setUploadFile(undefined); }}><option value="DIRECT_URL">Public URL</option><option value="RESEARCHER_NOTE">Researcher note</option><option value="DIRECT_UPLOAD">Direct media upload</option></select><input aria-label="Candidate title" placeholder="Title (optional)" maxLength={500} value={submission.title} onChange={(event) => setSubmission({ ...submission, title: event.target.value })}/>{submission.pathway === "DIRECT_URL" ? <input aria-label="Candidate URL" placeholder="https://…" type="url" maxLength={4096} required value={submission.value} onChange={(event) => setSubmission({ ...submission, value: event.target.value })}/> : submission.pathway === "RESEARCHER_NOTE" ? <textarea aria-label="Researcher note" placeholder="Researcher-authored note" maxLength={20000} required value={submission.value} onChange={(event) => setSubmission({ ...submission, value: event.target.value })}/> : <><input key={fileInputKey} aria-label="Evidence file" type="file" required accept=".pdf,.txt,.png,.jpg,.jpeg,.webp,.mp3,.wav,.m4a,.mp4,.webm,.mov" onChange={(event) => setUploadFile(event.target.files?.[0])}/><textarea aria-label="Upload note" placeholder="Note or description (optional)" maxLength={20000} value={submission.value} onChange={(event) => setSubmission({ ...submission, value: event.target.value })}/>{uploadFile && <output className="evidence-upload-selection"><strong>{uploadFile.name}</strong><span>{uploadFile.type || "Media category will be detected by the server"}</span><span>{uploadFile.size.toLocaleString()} bytes</span></output>}</>}<button type="submit" disabled={submission.pathway === "DIRECT_UPLOAD" && !uploadFile}>Create Candidate Evidence</button><small>{submission.pathway === "DIRECT_UPLOAD" ? "Accepted: PDF, plain text, PNG, JPEG, WEBP, MP3, WAV, M4A, MP4, WEBM, MOV. Maximum 25 MiB. Server-side signature validation is required. Upload creates review-only Candidate Evidence; it does not enter Investigation Evidence, Research Inbox, Curated Context, or the Manifold." : "Review-only metadata/text capture. No URL fetch, publication, graph change, or binary upload occurs."}</small></form>}
          <div className="evidence-chamber evidence-chamber--candidate"><section className="evidence-inventory"><div className="evidence-section-heading"><h2>{lane === "CANDIDATE" ? "Candidate Evidence" : "Curated Context"}</h2><span>{scopedRequest.status === "READY" ? `${records.length} records` : "count unavailable"}</span></div><ul>{records.map((record) => <li key={record.candidateId}><button type="button" className={record.candidateId === selectedCandidate?.candidateId ? "is-selected" : undefined} aria-pressed={record.candidateId === selectedCandidate?.candidateId} onClick={() => selectCandidate(record)}><strong>{record.source.title || "UNKNOWN TITLE"}</strong><span>{record.origin} · {record.lifecycleState}</span><code>{record.candidateId}</code></button></li>)}</ul></section>
            <aside className="evidence-inspector" aria-label="Candidate inspection">{selectedCandidate === undefined ? <div className="evidence-inspection-prompt"><h2>Inspection</h2><p>Select a record for deterministic metadata and review.</p></div> : <><div className="evidence-section-heading"><h2>{selectedCandidate.source.title || "UNKNOWN TITLE"}</h2><span>{selectedCandidate.lifecycleState}</span></div><dl><div><dt>Candidate Evidence identity</dt><dd><code>{selectedCandidate.candidateId}</code></dd></div><div><dt>Title</dt><dd>{selectedCandidate.source.title || "UNKNOWN"}</dd></div><div><dt>Origin</dt><dd>{selectedCandidate.origin} · <code>{selectedCandidate.originIdentity}</code></dd></div><div><dt>Intake pathway</dt><dd>{selectedCandidate.intakePathway}</dd></div><div><dt>Lifecycle state</dt><dd>{selectedCandidate.lifecycleState}</dd></div><div><dt>Acquisition state</dt><dd>{selectedCandidate.acquisitionState}</dd></div><div><dt>Publication state</dt><dd>{selectedCandidate.publicationState}</dd></div><div><dt>Investigation identity</dt><dd><code>{selectedCandidate.investigationId}</code></dd></div><div><dt>Investigation aggregate revision</dt><dd>{presentUnknown(selectedCandidate.investigationAggregateRevision)}</dd></div><div><dt>Manifold revision identity</dt><dd><code>{selectedCandidate.manifoldRevisionId || "UNKNOWN"}</code></dd></div><div><dt>Principal ownership</dt><dd><code>{selectedCandidate.principalOwnership}</code></dd></div>{selectedCandidate.upload && <><div><dt>Original filename</dt><dd>{selectedCandidate.upload.originalFilename}</dd></div><div><dt>Safe display filename</dt><dd>{selectedCandidate.upload.displayFilename}</dd></div><div><dt>Byte size</dt><dd>{selectedCandidate.upload.byteSize.toLocaleString()}</dd></div><div><dt>Detected media</dt><dd>{selectedCandidate.upload.mediaCategory} · {selectedCandidate.upload.detectedMediaType}</dd></div><div><dt>Content hash</dt><dd><code>{selectedCandidate.upload.contentHash.algorithm}:{selectedCandidate.upload.contentHash.digest}</code></dd></div><div><dt>Storage receipt</dt><dd><code>{selectedCandidate.upload.storageIdentity}</code></dd></div></>}<div><dt>Repository ownership</dt><dd>{selectedCandidate.origin === "CURATED_REPOSITORY" ? presentUnknown(selectedCandidate.lineage.ownership) : "NOT APPLICABLE"}</dd></div><div><dt>Provenance</dt><dd>{presentUnknown(selectedCandidate.lineage.provenance ?? selectedCandidate.lineage.intakeProvenance)}</dd></div><div><dt>Custody</dt><dd>{presentUnknown(selectedCandidate.lineage.custody)}</dd></div><div><dt>Availability</dt><dd>{selectedCandidate.availability || "UNKNOWN"}</dd></div><div><dt>Source locator</dt><dd>{sourceLocator(selectedCandidate)}</dd></div><div><dt>Association</dt><dd>{selectedCandidate.association ? `${selectedCandidate.association.kind} · ${selectedCandidate.association.canonicalIdentity}` : "NONE"}</dd></div></dl><div className="evidence-review-actions">{permittedReviewActions(selectedCandidate).map((to) => <button type="button" key={to} onClick={() => void review(selectedCandidate, to as "REFERENCED" | "IN_REVIEW" | "DEFERRED" | "EXCLUDED")}>{reviewActionLabel(selectedCandidate, to)}</button>)}</div><p className="evidence-boundary">Review-only Candidate Evidence. It is not ADMITTED or canonically materialized and has not entered the Manifold or Research Inbox.</p></>}</aside></div>
        </>;
      })() : projection.records.length === 0 ? (
        <section className="evidence-empty" aria-live="polite">
          <h2>No evidence records available in this investigation projection.</h2>
          <p>This does not establish that zero evidence exists.</p>
        </section>
      ) : (
        <>
          <section className="evidence-summary" aria-label="Evidence projection summary">
            <div><strong>{view!.totalCount}</strong><span>Projected records</span></div>
            <div><strong>{view!.visibleCount}</strong><span>Visible records</span></div>
            <div><strong>{view!.navigator.filter((entry) => entry.count > 0).length}</strong><span>Artifact types</span></div>
            <div><strong>{view!.availabilityCounts.UNAVAILABLE}</strong><span>Payload unavailable</span></div>
          </section>

          <div className="evidence-chamber">
          <nav className="evidence-navigator" aria-label="Evidence Navigator">
            <div className="evidence-section-heading">
              <h2>Evidence Navigator</h2>
              <span>{view!.totalCount} total</span>
            </div>
            <div className="evidence-filter-group" aria-label="Artifact type filters">
              {view!.navigator.map((entry) => (
                <button key={entry.artifactType} type="button"
                  aria-pressed={filters.artifactType === entry.artifactType}
                  onClick={() => setFilters((current) => ({ ...current, artifactType: current.artifactType === entry.artifactType ? undefined : entry.artifactType }))}>
                  <span>{entry.artifactType}</span><strong>{entry.count}</strong>
                </button>
              ))}
            </div>
            <div className="evidence-filter-group" aria-label="Payload availability filters">
              <button type="button" aria-pressed={filters.availability === "UNAVAILABLE"}
                onClick={() => setFilters((current) => ({ ...current, availability: current.availability === "UNAVAILABLE" ? undefined : "UNAVAILABLE" }))}>
                <span>UNAVAILABLE</span><strong>{view!.availabilityCounts.UNAVAILABLE}</strong>
              </button>
            </div>
            <button className="evidence-reset" type="button" disabled={filters.artifactType === undefined && filters.availability === undefined}
              onClick={() => setFilters({})}>Show all evidence</button>
          </nav>

          <section className="evidence-inventory" aria-label="Evidence Chamber register">
            <div className="evidence-section-heading">
              <h2>Evidence register</h2>
              <span aria-live="polite" aria-atomic="true">Showing {view!.visibleCount} of {view!.totalCount}</span>
            </div>
            {(filters.artifactType !== undefined || filters.availability !== undefined) && <p className="evidence-active-filter">
              Active filters: {filters.artifactType ?? "all types"} · {filters.availability ?? "all availability states"}
            </p>}
            {view!.visibleCount === 0 ? <div className="evidence-filtered-empty" role="status">
              <h3>No evidence records match the active filters.</h3>
              <p>The Investigation projection still contains {view!.totalCount} record{view!.totalCount === 1 ? "" : "s"}.</p>
              <button type="button" onClick={() => setFilters({})}>Reset filters</button>
            </div> : <ul>
              {view!.records.map((record) => (
                <li key={record.evidenceId}>
                  <button
                    type="button"
                    className={record.evidenceId === inspected?.evidenceId ? "is-selected" : undefined}
                    aria-pressed={record.evidenceId === inspected?.evidenceId}
                    onClick={() => setSelection({
                      investigationId: projection.investigation.id,
                      evidenceId: record.evidenceId,
                    })}
                  >
                    <strong>{record.title}</strong>
                    <span>{record.artifactType} · {record.provenance.repository}</span>
                    <code>{record.sourceArtifactId}</code>
                  </button>
                </li>
              ))}
            </ul>}
          </section>

          <aside className="evidence-inspector" aria-label="Evidence inspection">
            {inspected === undefined ? (
              <div className="evidence-inspection-prompt">
                <h2>Inspection</h2>
                <p>Select an artifact to inspect its available canonical metadata.</p>
              </div>
            ) : (
              <>
                <div className="evidence-section-heading">
                  <h2>{inspected.title}</h2>
                  <span>Local inspection only</span>
                </div>
                <dl>
                  <div><dt>Projected identity</dt><dd><code>{inspected.evidenceId}</code></dd></div>
                  <div><dt>Source artifact</dt><dd><code>{inspected.sourceArtifactId}</code></dd></div>
                  <div><dt>Investigation</dt><dd><code>{inspected.investigationId}</code></dd></div>
                  <div><dt>Type</dt><dd>{inspected.artifactType}</dd></div>
                  <div><dt>Repository</dt><dd>{inspected.provenance.repository}</dd></div>
                  <div><dt>Created</dt><dd>{inspected.provenance.createdAt}</dd></div>
                  <div><dt>Description</dt><dd>{presentOptional(inspected.description)}</dd></div>
                  <div><dt>Confidence</dt><dd>{presentOptional(inspected.confidence, String)}</dd></div>
                  <div><dt>DOI</dt><dd>{presentOptional(inspected.doi)}</dd></div>
                  <div><dt>URL</dt><dd>{presentOptional(inspected.url)}</dd></div>
                  <div><dt>Tags</dt><dd>{presentOptional(inspected.tags, (tags) => tags.join(", "))}</dd></div>
                  <div><dt>Source derivation identifiers</dt><dd>{presentOptional(inspected.sourceDerivationIdentifiers, (ids) => ids.join(", "))}</dd></div>
                  <div><dt>Payload</dt><dd>{inspected.payload.status} · {inspected.payload.reason}</dd></div>
                </dl>
                <button type="button" onClick={() => setCollectionFeedback(collectTypedResearchSource(research, () => evidenceRecordResearchAnchor(inspected)).message)}>Add to Research Inbox</button>
                {collectionFeedback && <p role="status" aria-live="polite">{collectionFeedback}</p>}
              </>
            )}
          </aside>
          </div>
        </>
      )}
    </main>
  );
}
