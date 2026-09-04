import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthorDocument, useAuthorDocumentDirty, useAuthorDocumentRevision, useAuthorDocumentRuntime } from "../../author/runtime/AuthorDocumentRuntimeContext";
import { useOperatorIdentity } from "../../identity/runtime/OperatorIdentityRuntimeContext";
import { useActiveInvestigation } from "../../workspace/runtime/WorkspaceRuntimeContext";
import { restoreStudioDocument } from "../api/StudioDocumentRestoration";
import { authoredBlockCount, composeStudioVersionCommand, sourceBackedBlockCount } from "../api/StudioAuthorDocumentAdapter";
import { studioApi, StudioApiError, type ProjectionFormat, type StudioArtifactProjection, type StudioLifecycle, type StudioScope } from "../api/StudioApi";
import { hasDurableArtifactVersion, isExpectedUnsavedArtifact, STUDIO_ARTIFACT_EMPTY_ACTION, STUDIO_ARTIFACT_EMPTY_MESSAGE, STUDIO_PROJECTION_EMPTY_MESSAGE } from "./StudioArtifactInspectorSemantics";
import "./StudioArtifactInspector.css";

type RequestState = "LOADING" | "READY" | "EMPTY" | "NOT_CREATED" | "SUCCESS" | "CONFLICT" | "STALE_REVISION" | "FORBIDDEN" | "UNAVAILABLE_BACKEND" | "ERROR";
const lifecycle: StudioLifecycle[] = ["DRAFT", "CANDIDATE_KNOWLEDGE_ARTIFACT", "MANIFOLD_CANDIDATE_NODE", "REVIEW_TEST", "ACCEPTED_KNOWLEDGE"];
const labels: Record<StudioLifecycle, string> = { DRAFT: "Draft", CANDIDATE_KNOWLEDGE_ARTIFACT: "Candidate Knowledge Artifact", MANIFOLD_CANDIDATE_NODE: "Manifold Candidate Node", REVIEW_TEST: "Review / Test", ACCEPTED_KNOWLEDGE: "Accepted Knowledge", RETURNED: "Returned", REJECTED: "Rejected" };
const actionTarget = { candidate: "DRAFT", publication: "CANDIDATE_KNOWLEDGE_ARTIFACT", review: "MANIFOLD_CANDIDATE_NODE", accept: "REVIEW_TEST", return: "REVIEW_TEST", reject: "REVIEW_TEST" } as const;

function idempotency(operation: string): string { return `${operation}:${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`}`; }
function display(value: unknown): string { return typeof value === "string" && value.trim() ? value : "Unavailable / not yet created"; }
function formatTime(value: string | undefined): string { if (!value) return "Unavailable / not yet created"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "Unavailable" : date.toLocaleString(); }

export default function StudioArtifactInspector() {
  const investigation = useActiveInvestigation();
  const operator = useOperatorIdentity();
  const document = useAuthorDocument();
  const dirty = useAuthorDocumentDirty();
  useAuthorDocumentRevision();
  const runtime = useAuthorDocumentRuntime();
  const scope = useMemo<StudioScope | undefined>(() => investigation && operator.identity ? { investigationId: investigation.id, principalId: operator.identity.operatorId } : undefined, [investigation, operator.identity]);
  const [artifact, setArtifact] = useState<StudioArtifactProjection>();
  const [state, setState] = useState<RequestState>("EMPTY");
  const [message, setMessage] = useState("No durable artifact has been created for this draft.");
  const [inFlight, setInFlight] = useState<string>();
  const [reviewReason, setReviewReason] = useState("");
  const [preview, setPreview] = useState<ProjectionFormat>();
  const requestSequence = useRef(0);
  const activeArtifact = artifact && scope && document
    && artifact.artifact.investigationId === scope.investigationId
    && (artifact.currentVersion.document as { identity?: { id?: string } } | undefined)?.identity?.id === document.identity.id
    ? artifact : undefined;

  const handleError = useCallback((error: unknown) => {
    const known = error instanceof StudioApiError ? error : new StudioApiError("ERROR", "The STUDIO operation could not be completed.");
    setState(known.kind); setMessage(known.message);
  }, []);

  const refresh = useCallback(async (expectedScope = scope, expectedDocument = document) => {
    const sequence = ++requestSequence.current;
    setArtifact(undefined);
    setPreview(undefined);
    if (!expectedScope) { setState("EMPTY"); setMessage("Canonical Investigation or principal unavailable."); return undefined; }
    setState("LOADING"); setMessage("Loading the Investigation-scoped artifact…");
    try {
      const result = await studioApi.list(expectedScope);
      if (sequence !== requestSequence.current) return undefined;
      const scoped = result.items.filter(item => item.artifact.investigationId === expectedScope.investigationId);
      const exact = expectedDocument
        ? scoped.find(item => (item.currentVersion.document as { identity?: { id?: string } } | undefined)?.identity?.id === expectedDocument.identity.id)
        : scoped.toSorted((left, right) => right.artifact.updatedAt.localeCompare(left.artifact.updatedAt))[0];
      if (!expectedDocument && exact) {
        const restored = restoreStudioDocument(exact.currentVersion.document);
        if (!restored) { setState("ERROR"); setMessage("The saved artifact document could not be restored safely."); return undefined; }
        runtime.setActiveDocument(restored);
      }
      setArtifact(exact);
      setState(exact ? "READY" : expectedDocument ? "NOT_CREATED" : "EMPTY");
      setMessage(exact ? "Canonical artifact synchronized." : expectedDocument ? STUDIO_ARTIFACT_EMPTY_MESSAGE : "No durable artifact has been created for this draft.");
      return exact;
    } catch (error) {
      if (sequence === requestSequence.current) {
        if (isExpectedUnsavedArtifact(error, Boolean(expectedScope && expectedDocument))) {
          setState("NOT_CREATED"); setMessage(STUDIO_ARTIFACT_EMPTY_MESSAGE);
        } else handleError(error);
      }
      return undefined;
    }
  }, [document, handleError, runtime, scope]);

  useEffect(() => { void refresh(); return () => { requestSequence.current += 1; }; }, [refresh]);

  const mutate = useCallback(async (operation: string, path: string, command: object, markClean = false) => {
    if (!scope || inFlight) return;
    setInFlight(operation); setMessage(`${operation} in progress…`);
    try {
      await studioApi.post(scope, path, command);
      const refreshed = await refresh(scope, document);
      if (!refreshed) return;
      if (markClean) runtime.markClean();
      setState("SUCCESS"); setMessage(`${operation} completed and canonical state refreshed.`);
    } catch (error) { handleError(error); }
    finally { setInFlight(undefined); }
  }, [document, handleError, inFlight, refresh, runtime, scope]);

  const save = () => {
    if (!scope || !document || inFlight) return;
    const base = composeStudioVersionCommand(scope, document);
    if (!activeArtifact) void mutate("Save Draft", "", { ...base, artifactId: document.identity.id, versionId: `${document.identity.id}:v1`, idempotencyKey: idempotency("create") }, true);
    else void mutate("Save Draft", `/${encodeURIComponent(activeArtifact.artifact.artifactId)}/versions`, { ...base, artifactId: activeArtifact.artifact.artifactId, expectedRevision: activeArtifact.artifact.revision, idempotencyKey: idempotency("save") }, true);
  };

  const lifecycleAction = (operation: keyof typeof actionTarget) => {
    if (!scope || !activeArtifact || inFlight) return;
    const a = activeArtifact.artifact;
    const routes = { candidate: "candidate", publication: "candidate/publication", review: "review-submissions", accept: "acceptance", return: "returns", reject: "rejections" };
    const command: Record<string, unknown> = { schemaVersion: "studio-command/v1", investigationId: scope.investigationId, principalId: scope.principalId, artifactId: a.artifactId, expectedRevision: a.revision, idempotencyKey: idempotency(operation) };
    if (operation !== "candidate") command.candidateArtifactId = a.candidateArtifactId;
    if (["accept", "return", "reject"].includes(operation)) Object.assign(command, { targetScope: "ARTIFACT", reason: reviewReason.trim() });
    void mutate(operation === "candidate" ? "Save as Candidate Knowledge" : operation === "publication" ? "Publish Candidate to Manifold" : operation === "review" ? "Submit for Review" : labels[operation === "accept" ? "ACCEPTED_KNOWLEDGE" : operation === "return" ? "RETURNED" : "REJECTED"], `/${encodeURIComponent(a.artifactId)}/${routes[operation]}`, command);
  };

  const validate = (format: ProjectionFormat) => {
    if (!scope || !activeArtifact || inFlight) return;
    const a = activeArtifact.artifact;
    void mutate(`Validate ${format}`, `/${encodeURIComponent(a.artifactId)}/projections/validations`, { schemaVersion: "studio-command/v1", investigationId: scope.investigationId, principalId: scope.principalId, artifactId: a.artifactId, expectedRevision: a.revision, idempotencyKey: idempotency(`validate-${format}`), artifactVersionId: a.currentVersionId, projectionFormat: format, citationStyleConfiguration: {}, validatorVersion: "studio-ui-i2e/v1" });
  };

  const current = activeArtifact?.artifact;
  const version = activeArtifact?.currentVersion;
  const durableVersionExists = hasDurableArtifactVersion(current?.artifactId, current?.currentVersionId, version?.versionId);
  const contentConsistent = activeArtifact && document ? JSON.stringify(version?.document) === JSON.stringify(document) : undefined;
  const activeSnapshots = activeArtifact?.sourceSnapshots.filter(snapshot => version?.sourceSnapshotIds.includes(snapshot.snapshotId)) ?? [];
  const snapshotState = !activeArtifact ? "Not yet captured" : activeSnapshots.some(item => item.resolutionStatus === "STALE") ? "Stale" : activeSnapshots.some(item => ["MISSING", "UNAVAILABLE", "REDACTED"].includes(item.resolutionStatus)) ? "Unavailable" : activeSnapshots.length ? (activeSnapshots.every(item => item.resolutionStatus === "AVAILABLE") ? "Consistent" : "Not yet resolved") : "No snapshots";
  const actionReason = (operation: keyof typeof actionTarget) => !activeArtifact ? "Create and save a draft first." : current?.lifecycleState !== actionTarget[operation] ? `Requires ${labels[actionTarget[operation]]}.` : (["accept", "return", "reject"].includes(operation) && !reviewReason.trim()) ? "A review reason is required." : undefined;
  const saveReason = !scope ? "Select an Investigation and establish an operator identity." : !document ? "Create or restore a canonical author draft." : inFlight ? `${inFlight} is in progress.` : activeArtifact && !dirty ? "The canonical draft has no unsaved changes." : current && !["DRAFT", "RETURNED"].includes(current.lifecycleState) ? "Versions may be saved only in Draft or Returned." : undefined;

  return <aside className="studio-inspector" data-permanent="true" aria-label="Artifact Inspector">
    <header className="studio-inspector__header"><div className="studio-inspector__kicker">STUDIO / CANONICAL</div><h2>Artifact Inspector</h2><span className={`studio-inspector__state studio-inspector__state--${state.toLowerCase()}`}>{state.replaceAll("_", " ")}</span></header>
    <p className="studio-inspector__message" role={state === "ERROR" || state === "CONFLICT" || state === "STALE_REVISION" || state === "FORBIDDEN" || state === "UNAVAILABLE_BACKEND" ? "alert" : "status"}>{message}{state === "NOT_CREATED" && <> {STUDIO_ARTIFACT_EMPTY_ACTION}</>}</p>
    <section className="studio-inspector__card"><h3>Artifact identity</h3><dl className="studio-inspector__facts">
      <dt>Artifact ID</dt><dd>{display(current?.artifactId)}</dd><dt>Author / principal</dt><dd>{display(current?.ownerPrincipalId ?? operator.identity?.operatorId)}</dd><dt>Investigation</dt><dd>{display(investigation?.id)}</dd><dt>Focused event</dt><dd>{display(investigation?.workspace.focused_event_id)}</dd><dt>Compared event</dt><dd>{display(version?.comparisonContext?.comparisonEventId)}</dd><dt>Version</dt><dd>{current ? `v${current.currentVersionNumber} · r${current.revision}` : "Not yet created"}</dd><dt>Created</dt><dd>{formatTime(current?.createdAt)}</dd><dt>Modified</dt><dd>{formatTime(current?.updatedAt)}</dd><dt>Source snapshot</dt><dd>{version?.sourceSnapshotIds.length === 1 ? version.sourceSnapshotIds[0] : version?.sourceSnapshotIds.length ? `${version.sourceSnapshotIds.length} snapshots` : "Unavailable / not yet created"}</dd><dt>Citations / claims</dt><dd>{version ? `${version.citations.length} / ${version.claims.length}` : "Not yet represented"}</dd><dt>Lifecycle</dt><dd>{current ? labels[current.lifecycleState] : "Not yet created"}</dd><dt>Draft state</dt><dd>{dirty ? "Dirty · unsaved changes" : artifact ? "Saved" : "Not yet saved"}</dd>
    </dl><button className="studio-inspector__button studio-inspector__button--primary" disabled={Boolean(saveReason)} aria-describedby={saveReason ? "studio-save-reason" : undefined} onClick={save}>{inFlight === "Save Draft" ? "Saving Draft…" : "Save Draft"}</button>{saveReason && <p id="studio-save-reason" className="studio-inspector__disabled-reason">{saveReason}</p>}</section>

    <section className="studio-inspector__card"><h3>Knowledge lifecycle</h3><ol className="studio-inspector__lifecycle">{lifecycle.map(item => <li key={item} className={current?.lifecycleState === item ? "is-current" : ""}>{labels[item]}</li>)}</ol>{current && ["RETURNED", "REJECTED"].includes(current.lifecycleState) && <div className={`studio-inspector__terminal studio-inspector__terminal--${current.lifecycleState.toLowerCase()}`}>{labels[current.lifecycleState]}</div>}
      <div className="studio-inspector__actions">{(["candidate", "publication", "review"] as const).map(action => { const reason = dirty ? "Save current changes before advancing lifecycle." : actionReason(action); const label = action === "candidate" ? "Save as Candidate Knowledge" : action === "publication" ? "Publish Candidate to Manifold" : "Submit for Review"; return <div className="studio-inspector__action" key={action}><button className="studio-inspector__button" disabled={Boolean(reason || inFlight)} aria-describedby={reason ? `studio-${action}-reason` : undefined} onClick={() => lifecycleAction(action)}>{inFlight === label ? `${label}…` : label}</button>{reason && <span id={`studio-${action}-reason`}>{reason}</span>}</div>; })}</div>
      <label className="studio-inspector__reason">Review reason<input value={reviewReason} onChange={event => setReviewReason(event.target.value)} placeholder="Required for a decision" /></label><div className="studio-inspector__review-actions">{(["accept", "return", "reject"] as const).map(action => { const reason = actionReason(action); return <button key={action} className={`studio-inspector__button studio-inspector__button--${action === "accept" ? "primary" : action === "reject" ? "danger" : "secondary"}`} disabled={Boolean(reason || inFlight)} aria-label={`${action === "return" ? "Return candidate for revision" : action === "reject" ? "Reject candidate knowledge" : "Accept candidate as knowledge"}${reason ? `. Unavailable: ${reason}` : ""}`} onClick={() => lifecycleAction(action)}>{action === "accept" ? "Accept as Knowledge" : action === "return" ? "Return for Revision" : "Reject Candidate"}</button>; })}</div><p className="studio-inspector__boundary"><strong>Candidate boundary:</strong> publication creates a candidate node only. It does not create accepted knowledge or an accepted relationship.</p>
    </section>

    <section className="studio-inspector__card"><h3>Source &amp; claim lineage</h3><div className="studio-inspector__metrics"><span><b>{sourceBackedBlockCount(document)}</b> source-backed blocks</span><span><b>{authoredBlockCount(document)}</b> authored blocks</span></div><p>Snapshot: {snapshotState}</p>{version ? <div className="studio-inspector__lineage-list">{version.claims.length ? version.claims.map(claim => { const mappings = version.claimSourceMappings?.filter(mapping => mapping.claimId === claim.claimId) ?? []; return <article key={claim.claimId} className="studio-inspector__lineage-row"><strong>{claim.claimId}</strong><span>{claim.lineageState === "ORPHANED" ? "MISSING CITATION" : claim.lineageState}</span><small>{claim.claimText || "Authored claim text unavailable"}</small>{mappings.length ? mappings.map(mapping => { const source = activeSnapshots.find(snapshot => snapshot.snapshotId === mapping.sourceSnapshotId); return <dl key={mapping.mappingId}><dt>Source block</dt><dd>{mapping.sourceSnapshotId}</dd><dt>Canonical source</dt><dd>{source?.sourceIdentity ?? "Canonical identity unavailable"}</dd><dt>Provenance</dt><dd>{source?.resolutionStatus ?? "UNKNOWN"}</dd></dl>; }) : <em>No canonical claim/source mapping.</em>}</article>; }) : <p className="studio-inspector__empty-lineage">No authored claims are represented in this version.</p>}{activeSnapshots.length ? activeSnapshots.map(source => <div className="studio-inspector__source-row" key={source.snapshotId}><strong>{source.snapshotId}</strong><span>{source.sourceIdentity}</span><small>{source.sourceWorkspace} · {source.sourceKind} · {source.resolutionStatus}</small></div>) : <p className="studio-inspector__empty-lineage">No source-backed blocks are represented in this version.</p>}</div> : <p className="studio-inspector__empty-lineage">Lineage is empty until a canonical artifact version is saved.</p>}<p className="studio-inspector__boundary">Only canonical mappings are shown. Source presence records lineage; it does not establish scientific validity.</p></section>

    <section className="studio-inspector__card"><h3>Output projections</h3>{!durableVersionExists && <p className="studio-inspector__disabled-reason">{STUDIO_PROJECTION_EMPTY_MESSAGE}</p>}<div className="studio-inspector__projections">{(["PDF", "DOCX", "HTML"] as ProjectionFormat[]).map(format => { const records = activeArtifact?.projections.filter(item => item.projectionFormat === format && item.artifactVersionId === current?.currentVersionId) ?? []; const latest = records.at(-1); return <article className="studio-inspector__projection" key={format}><div><strong>{format}</strong><span>{latest ? latest.readinessState.replaceAll("_", " ") : "NOT VALIDATED"}</span></div><dl><dt>Consistency</dt><dd>{contentConsistent === undefined ? "Unavailable" : contentConsistent ? "Current version" : "Draft changed"}</dd><dt>Validation</dt><dd>{latest ? `${latest.validatorVersion} · ${formatTime(latest.validatedAt)}` : "Not yet run"}</dd><dt>Materialization</dt><dd>{latest?.outputIdentity ? latest.outputIdentity : latest?.materializationState ?? "Not materialized"}</dd></dl><div className="studio-inspector__projection-actions"><button className="studio-inspector__button" disabled={!durableVersionExists || dirty || Boolean(inFlight)} title={dirty ? "Save the current draft before validation." : undefined} onClick={() => validate(format)}>Validate</button><button className="studio-inspector__button" disabled={!durableVersionExists} onClick={() => setPreview(preview === format ? undefined : format)}>Preview</button><button className="studio-inspector__button" disabled title="No authoritative output materializer is configured in the browser.">Materialize</button></div>{durableVersionExists && preview === format && <p className="studio-inspector__preview">Browser-only content preview. This is not an authoritative exported {format} file. {document?.metadata.title}</p>}{latest?.validationWarnings.map(warning => <p className="studio-inspector__warning" key={warning}>{warning}</p>)}</article>; })}</div></section>
  </aside>;
}
