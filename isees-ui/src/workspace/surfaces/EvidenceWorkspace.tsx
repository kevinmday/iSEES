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
  const [submission, setSubmission] = useState({ title: "", url: "" });
  const [commandError, setCommandError] = useState<string>();
  const [collectionFeedback, setCollectionFeedback] = useState<string>();
  const principalId = operator.identity?.operatorId;
  const apiScope = useMemo<CandidateEvidenceApiScope | undefined>(() => investigation && principalId ? { investigationId: investigation.id, principalId } : undefined, [investigation, principalId]);

  async function fetchCandidates(scope: CandidateEvidenceApiScope, signal?: AbortSignal) {
    try {
      const response = await candidateEvidenceApi.list(scope, signal);
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
    event.preventDefault(); if (!apiScope || (!submission.title.trim() && !submission.url.trim())) return;
    const identity = `submission-${Date.now()}-${crypto.randomUUID()}`;
    try { await candidateEvidenceApi.submit(apiScope, { schemaVersion: "candidate-evidence-command/v1", investigationId: apiScope.investigationId, submissionIdentity: identity, submittedLocator: submission.url.trim() || undefined, source: { ...(submission.title.trim() ? { title: submission.title.trim() } : {}), ...(submission.url.trim() ? { originalLocator: submission.url.trim() } : {}) }, idempotencyKey: identity }); setSubmission({ title: "", url: "" }); setCandidateRequest(beginCandidateRequest(apiScope)); await fetchCandidates(apiScope); }
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

      {lane !== "INVESTIGATION" ? (() => {
        const records = lane === "CANDIDATE" ? candidateLanes.candidate : candidateLanes.curated;
        return <>
          <div className="evidence-api-state" aria-live="polite">{scopedRequest.status === "LOADING" ? "Loading Investigation-qualified records…" : scopedRequest.status === "UNAVAILABLE" ? "Candidate Evidence API unavailable — count unknown, not zero." : scopedRequest.status === "FAILED" ? `Candidate Evidence request failed — ${scopedRequest.error}` : scopedRequest.status === "READY" && records.length === 0 ? "Zero records returned for this principal and Investigation." : `${records.length} records`}</div>
          {lane === "CURATED" && <p className="evidence-boundary">Curated Context is repository-owned reference material. It is not admission, claim support, canonical Knowledge, or Accepted Knowledge.</p>}
          {lane === "CANDIDATE" && <form className="evidence-submission" onSubmit={submitCandidate}><strong>Direct metadata / URL submission</strong><input aria-label="Candidate title" placeholder="Title" value={submission.title} onChange={(event) => setSubmission({ ...submission, title: event.target.value })}/><input aria-label="Candidate URL" placeholder="https://…" type="url" value={submission.url} onChange={(event) => setSubmission({ ...submission, url: event.target.value })}/><button type="submit">Submit</button><small>Metadata only. Binary uploads are not implemented.</small></form>}
          <div className="evidence-chamber evidence-chamber--candidate"><section className="evidence-inventory"><div className="evidence-section-heading"><h2>{lane === "CANDIDATE" ? "Candidate Evidence" : "Curated Context"}</h2><span>{scopedRequest.status === "READY" ? `${records.length} records` : "count unavailable"}</span></div><ul>{records.map((record) => <li key={record.candidateId}><button type="button" className={record.candidateId === selectedCandidate?.candidateId ? "is-selected" : undefined} aria-pressed={record.candidateId === selectedCandidate?.candidateId} onClick={() => selectCandidate(record)}><strong>{record.source.title || "UNKNOWN TITLE"}</strong><span>{record.origin} · {record.lifecycleState}</span><code>{record.candidateId}</code></button></li>)}</ul></section>
            <aside className="evidence-inspector" aria-label="Candidate inspection">{selectedCandidate === undefined ? <div className="evidence-inspection-prompt"><h2>Inspection</h2><p>Select a record for deterministic metadata and review.</p></div> : <><div className="evidence-section-heading"><h2>{selectedCandidate.source.title || "UNKNOWN TITLE"}</h2><span>{selectedCandidate.lifecycleState}</span></div><dl><div><dt>Identity</dt><dd><code>{selectedCandidate.candidateId}</code></dd></div><div><dt>Origin</dt><dd>{selectedCandidate.origin} · <code>{selectedCandidate.originIdentity}</code></dd></div><div><dt>Lifecycle state</dt><dd>{selectedCandidate.lifecycleState}</dd></div><div><dt>Repository ownership</dt><dd>{selectedCandidate.origin === "CURATED_REPOSITORY" ? presentUnknown(selectedCandidate.lineage.ownership) : "NOT APPLICABLE"}</dd></div><div><dt>Provenance</dt><dd>{presentUnknown(selectedCandidate.lineage.provenance)}</dd></div><div><dt>Custody</dt><dd>{presentUnknown(selectedCandidate.lineage.custody)}</dd></div><div><dt>Availability</dt><dd>{selectedCandidate.availability || "UNKNOWN"}</dd></div><div><dt>Source locator</dt><dd>{sourceLocator(selectedCandidate)}</dd></div><div><dt>Association</dt><dd>{selectedCandidate.association ? `${selectedCandidate.association.kind} · ${selectedCandidate.association.canonicalIdentity}` : "UNKNOWN"}</dd></div><div><dt>Payload</dt><dd>Unavailable for inspection · binary storage is not implemented</dd></div></dl><div className="evidence-review-actions">{permittedReviewActions(selectedCandidate).map((to) => <button type="button" key={to} onClick={() => void review(selectedCandidate, to as "REFERENCED" | "IN_REVIEW" | "DEFERRED" | "EXCLUDED")}>{reviewActionLabel(selectedCandidate, to)}</button>)}</div><p className="evidence-boundary">No ADMITTED or canonical-materialization controls.</p></>}</aside></div>
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
