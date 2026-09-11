import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthorDocument, useAuthorDocumentDirty } from "../../author/runtime/AuthorDocumentRuntimeContext";
import { useOperatorIdentity } from "../../identity/runtime/OperatorIdentityRuntimeContext";
import { useActiveInvestigation } from "../../workspace/runtime/WorkspaceRuntimeContext";
import { authoredBlockCount, sourceBackedBlockCount } from "../api/StudioAuthorDocumentAdapter";
import { studioApi, StudioApiError, type StudioArtifactProjection, type StudioLifecycle, type StudioScope } from "../api/StudioApi";
import { isExpectedUnsavedArtifact, STUDIO_ARTIFACT_EMPTY_ACTION, STUDIO_ARTIFACT_EMPTY_MESSAGE } from "./StudioArtifactInspectorSemantics";
import "./StudioArtifactInspector.css";
import { useStudioSaveAction } from "../runtime/StudioSaveActionContext.ts";
import { StudioArtifactFamily } from "./StudioArtifactFamily.tsx";

type RequestState = "LOADING" | "READY" | "EMPTY" | "NOT_CREATED" | "SUCCESS" | "CONFLICT" | "STALE_REVISION" | "FORBIDDEN" | "UNAVAILABLE_BACKEND" | "ERROR";
const lifecycle: StudioLifecycle[] = ["DRAFT", "CANDIDATE_KNOWLEDGE_ARTIFACT", "MANIFOLD_CANDIDATE_NODE", "REVIEW_TEST", "ACCEPTED_KNOWLEDGE"];
const labels: Record<StudioLifecycle, string> = { DRAFT: "Draft", CANDIDATE_KNOWLEDGE_ARTIFACT: "Candidate Knowledge Artifact", MANIFOLD_CANDIDATE_NODE: "Manifold Candidate Node", REVIEW_TEST: "Review / Test", ACCEPTED_KNOWLEDGE: "Accepted Knowledge", RETURNED: "Returned", REJECTED: "Rejected" };
const actionTarget = { candidate: "DRAFT", publication: "CANDIDATE_KNOWLEDGE_ARTIFACT", review: "MANIFOLD_CANDIDATE_NODE", accept: "REVIEW_TEST", return: "REVIEW_TEST", reject: "REVIEW_TEST" } as const;

function idempotency(operation: string): string { return `${operation}:${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`}`; }
function formatTime(value: string | undefined): string { if (!value) return "Unavailable / not yet created"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "Unavailable" : date.toLocaleString(); }
export default function StudioArtifactInspector() {
  const investigation = useActiveInvestigation();
  const operator = useOperatorIdentity();
  const document = useAuthorDocument();
  const dirty = useAuthorDocumentDirty();
  const saveAction = useStudioSaveAction();
  const scope = useMemo<StudioScope | undefined>(() => investigation && operator.identity ? { investigationId: investigation.id, principalId: operator.identity.operatorId } : undefined, [investigation, operator.identity]);
  const [artifact, setArtifact] = useState<StudioArtifactProjection>();
  const [state, setState] = useState<RequestState>("EMPTY");
  const [message, setMessage] = useState("No durable artifact has been created for this draft.");
  const [inFlight, setInFlight] = useState<string>();
  const [reviewReason, setReviewReason] = useState("");
  const requestSequence = useRef(0);
  const activeArtifact = artifact && scope && document
    && artifact.artifact.investigationId === scope.investigationId
    && artifact.artifact.ownerPrincipalId === scope.principalId
    && artifact.artifact.artifactId === document.identity.id
    && (artifact.currentVersion.document as { identity?: { id?: string } } | undefined)?.identity?.id === document.identity.id
    ? artifact : undefined;

  const handleError = useCallback((error: unknown) => {
    const known = error instanceof StudioApiError ? error : new StudioApiError("ERROR", "The STUDIO operation could not be completed.");
    setState(known.kind); setMessage(known.message);
  }, []);

  const refresh = useCallback(async (expectedScope = scope, expectedDocument = document) => {
    const sequence = ++requestSequence.current;
    setArtifact(undefined);
    if (!expectedScope) { setState("EMPTY"); setMessage("Canonical Investigation or principal unavailable."); return undefined; }
    setState("LOADING"); setMessage("Loading the Investigation-scoped artifact…");
    try {
      const result = await studioApi.list(expectedScope);
      if (sequence !== requestSequence.current) return undefined;
      const scoped = result.items.filter(item => item.artifact.investigationId === expectedScope.investigationId && item.artifact.ownerPrincipalId === expectedScope.principalId);
      const exact = expectedDocument
        ? scoped.find(item => item.artifact.artifactId === expectedDocument.identity.id && (item.currentVersion.document as { identity?: { id?: string } } | undefined)?.identity?.id === expectedDocument.identity.id)
        : scoped.toSorted((left, right) => right.artifact.updatedAt.localeCompare(left.artifact.updatedAt))[0];
      setArtifact(exact);
      setState(exact ? "READY" : expectedDocument ? "NOT_CREATED" : "EMPTY");
      setMessage(exact ? "Canonical artifact loaded; comparing the active draft." : expectedDocument ? STUDIO_ARTIFACT_EMPTY_MESSAGE : "No durable artifact has been created for this draft.");
      return exact;
    } catch (error) {
      if (sequence === requestSequence.current) {
        if (isExpectedUnsavedArtifact(error, Boolean(expectedScope && expectedDocument))) {
          setState("NOT_CREATED"); setMessage(STUDIO_ARTIFACT_EMPTY_MESSAGE);
        } else handleError(error);
      }
      return undefined;
    }
  }, [document, handleError, scope]);

  useEffect(() => { queueMicrotask(() => void refresh()); return () => { requestSequence.current += 1; }; }, [refresh]);

  const mutate = useCallback(async (operation: string, path: string, command: object) => {
    if (!scope || inFlight) return;
    setInFlight(operation); setMessage(`${operation} in progress…`);
    try {
      await studioApi.post(scope, path, command);
      const refreshed = await refresh(scope, document);
      if (!refreshed) return;
      setState("SUCCESS"); setMessage(`${operation} completed and canonical state refreshed.`);
    } catch (error) { handleError(error); }
    finally { setInFlight(undefined); }
  }, [document, handleError, inFlight, refresh, scope]);

  const save = useCallback(async () => {
    if (!scope || !document || inFlight) return;
    setInFlight("Save Draft");
    try {
      await saveAction.save();
    } finally { setInFlight(undefined); }
  }, [document, inFlight, saveAction, scope]);

  const lifecycleAction = (operation: keyof typeof actionTarget) => {
    if (!scope || !activeArtifact || inFlight) return;
    const a = activeArtifact.artifact;
    const routes = { candidate: "candidate", publication: "candidate/publication", review: "review-submissions", accept: "acceptance", return: "returns", reject: "rejections" };
    const command: Record<string, unknown> = { schemaVersion: "studio-command/v1", investigationId: scope.investigationId, principalId: scope.principalId, artifactId: a.artifactId, expectedRevision: a.revision, idempotencyKey: idempotency(operation) };
    if (operation !== "candidate") command.candidateArtifactId = a.candidateArtifactId;
    if (["accept", "return", "reject"].includes(operation)) Object.assign(command, { targetScope: "ARTIFACT", reason: reviewReason.trim() });
    void mutate(operation === "candidate" ? "Save as Candidate Knowledge" : operation === "publication" ? "Publish Candidate to Manifold" : operation === "review" ? "Submit for Review" : labels[operation === "accept" ? "ACCEPTED_KNOWLEDGE" : operation === "return" ? "RETURNED" : "REJECTED"], `/${encodeURIComponent(a.artifactId)}/${routes[operation]}`, command);
  };

  const current = activeArtifact?.artifact;
  const version = activeArtifact?.currentVersion;
  const activeSnapshots = activeArtifact?.sourceSnapshots.filter(snapshot => version?.sourceSnapshotIds.includes(snapshot.snapshotId)) ?? [];
  const snapshotState = !activeArtifact ? "Not yet captured" : activeSnapshots.some(item => item.resolutionStatus === "STALE") ? "Stale" : activeSnapshots.some(item => ["MISSING", "UNAVAILABLE", "REDACTED"].includes(item.resolutionStatus)) ? "Unavailable" : activeSnapshots.length ? (activeSnapshots.every(item => item.resolutionStatus === "AVAILABLE") ? "Consistent" : "Not yet resolved") : "No snapshots";
  const actionReason = (operation: keyof typeof actionTarget) => !activeArtifact ? "Create and save a draft first." : current?.lifecycleState !== actionTarget[operation] ? `Requires ${labels[actionTarget[operation]]}.` : (["accept", "return", "reject"].includes(operation) && !reviewReason.trim()) ? "A review reason is required." : undefined;
  const saveReason = !scope ? "Select an Investigation and establish an operator identity." : !document ? "Create or restore a canonical author draft." : inFlight ? `${inFlight} is in progress.` : activeArtifact && !dirty ? "The canonical draft has no unsaved changes." : current && !["DRAFT", "RETURNED"].includes(current.lifecycleState) ? "Versions may be saved only in Draft or Returned." : undefined;
  const saveAvailable = !saveReason && saveAction.state.canSave;
  const v1SaveFailed = ["FAILED", "UNAVAILABLE", "UNAUTHENTICATED", "CONFLICT"].includes(saveAction.state.status);
  const v1Durable = Boolean(saveAction.state.artifactId && saveAction.state.headRevisionId && saveAction.state.revisionNumber);
  const v1AuthorityUnavailable = Boolean(saveAction.state.restorationFailure || (!v1Durable && ["FAILED", "UNAVAILABLE"].includes(saveAction.state.status)));
  const serviceAvailability = saveAction.state.status === "UNAVAILABLE" ? "Unavailable" : saveAction.state.status === "LOADING" ? "Restoring" : operator.identity?.kind === "ACCOUNT" ? "Available" : "Not yet established";

  return <aside className="studio-inspector" data-permanent="true" aria-label="Artifact Inspector">
    <header className="studio-inspector__header"><div className="studio-inspector__kicker">STUDIO V1 / AUTHORITATIVE</div><h2>Artifact Inspector</h2><span className={`studio-inspector__state studio-inspector__state--${saveAction.state.status.toLowerCase()}`}>{saveAction.state.status.replaceAll("_", " ")}</span></header>
    <p className="studio-inspector__message" role={v1SaveFailed ? "alert" : "status"}>{saveAction.state.message}</p>
    <p className="studio-inspector__message" role="status">Studio V1 author service: {serviceAvailability}.</p>
    <section className="studio-inspector__card"><h3>Artifact identity</h3><dl className="studio-inspector__facts">
      <dt>Artifact ID</dt><dd>{saveAction.state.artifactId ?? "Not yet created"}</dd><dt>Immutable revision</dt><dd>{saveAction.state.revisionNumber ? `Revision ${saveAction.state.revisionNumber}` : "Not yet created"}</dd><dt>Durable head</dt><dd>{saveAction.state.headRevisionId ?? "Not yet created"}</dd><dt>Author / principal</dt><dd>{saveAction.state.ownerPrincipalId ?? "Not yet created"}</dd><dt>Investigation</dt><dd>{saveAction.state.investigationId ?? investigation?.id ?? "Not yet created"}</dd><dt>Created</dt><dd>{saveAction.state.artifactCreatedAt ? formatTime(saveAction.state.artifactCreatedAt) : "Not yet created"}</dd><dt>Modified / saved</dt><dd>{saveAction.state.savedAt ? formatTime(saveAction.state.savedAt) : "Not yet created"}</dd><dt>Lifecycle / save state</dt><dd>{saveAction.state.lifecycleClassification ?? (v1Durable ? "Saved revision" : "Not yet created")}</dd><dt>Draft state</dt><dd>{dirty ? "Dirty · unsaved changes" : v1Durable ? "Saved · clean" : "Not yet saved"}</dd><dt>Source snapshots</dt><dd>{saveAction.state.sourceSnapshotCount ?? "Not yet created"}</dd><dt>Citations</dt><dd>{saveAction.state.citationCount ?? "Not yet created"}</dd><dt>Claims</dt><dd>{saveAction.state.claimCount ?? "Not yet created"}</dd><dt>Projection status</dt><dd>{saveAction.state.projections ? saveAction.state.projections.items.length ? "Authoritative statuses available" : "Not validated · not materialized" : "Not yet available"}</dd>
    </dl>{dirty && v1Durable && <p className="studio-inspector__historical-note">Saved revision {saveAction.state.revisionNumber} remains authoritative; projections do not include these unsaved changes.</p>}{v1SaveFailed && <div className="studio-inspector__operation-error" role="alert"><strong>Studio V1 operation requires attention</strong><span>{saveAction.state.message} Your unsaved draft is preserved.</span>{saveAction.state.status === "CONFLICT" && saveAction.state.artifactId && <button className="studio-inspector__button" onClick={() => void saveAction.reloadHead()}>Reload saved head</button>}</div>}<button className="studio-inspector__button studio-inspector__button--primary" disabled={!saveAvailable} aria-describedby={saveReason ? "studio-save-reason" : undefined} onClick={() => void save()}>{inFlight === "Save Draft" ? "Saving Draft…" : saveAction.state.retryable ? "Retry Save" : "Save Draft"}</button>{saveReason && <p id="studio-save-reason" className="studio-inspector__disabled-reason">{saveReason}</p>}</section>

    <p className="studio-inspector__message" role={state === "UNAVAILABLE_BACKEND" ? "alert" : "status"}>Legacy lifecycle/artifact service (secondary): {message}{state === "NOT_CREATED" && <> {STUDIO_ARTIFACT_EMPTY_ACTION}</>}</p>

    {v1AuthorityUnavailable ? <section className="studio-inspector__card"><h3>Knowledge lifecycle</h3><p className="studio-inspector__authority-unavailable" role="alert">Studio V1 authority cannot be established. Lifecycle state is unavailable; the active draft is preserved.</p></section> : v1Durable ? <section className="studio-inspector__card"><h3>Knowledge lifecycle</h3><p className="studio-inspector__authority-label">Authoritative Studio V1 lifecycle</p><ol className="studio-inspector__lifecycle"><li className="is-current">{saveAction.state.lifecycleClassification === "CANDIDATE_KNOWLEDGE" ? "Candidate Knowledge" : saveAction.state.lifecycleClassification ?? "Saved .author revision"}</li></ol><p className="studio-inspector__boundary">Lifecycle actions are unavailable until governed Studio V1 lifecycle commands are introduced.</p><div className="studio-inspector__actions">{["Publish Candidate to Manifold","Submit for Review","Accept as Knowledge"].map(label=><button key={label} className="studio-inspector__button" disabled title={`${label} requires a future governed Studio V1 lifecycle command.`}>{label}</button>)}</div></section> : <section className="studio-inspector__card"><h3>Knowledge lifecycle</h3><ol className="studio-inspector__lifecycle">{lifecycle.map(item => <li key={item} className={current?.lifecycleState === item ? "is-current" : ""}>{labels[item]}</li>)}</ol>{current && ["RETURNED", "REJECTED"].includes(current.lifecycleState) && <div className={`studio-inspector__terminal studio-inspector__terminal--${current.lifecycleState.toLowerCase()}`}>{labels[current.lifecycleState]}</div>}
      <div className="studio-inspector__actions">{(["candidate", "publication", "review"] as const).map(action => { const reason = dirty ? "Save current changes before advancing lifecycle." : actionReason(action); const label = action === "candidate" ? "Save as Candidate Knowledge" : action === "publication" ? "Publish Candidate to Manifold" : "Submit for Review"; return <div className="studio-inspector__action" key={action}><button className="studio-inspector__button" disabled={Boolean(reason || inFlight)} aria-describedby={reason ? `studio-${action}-reason` : undefined} onClick={() => lifecycleAction(action)}>{inFlight === label ? `${label}…` : label}</button>{reason && <span id={`studio-${action}-reason`}>{reason}</span>}</div>; })}</div>
      <label className="studio-inspector__reason">Review reason<input value={reviewReason} onChange={event => setReviewReason(event.target.value)} placeholder="Required for a decision" /></label><div className="studio-inspector__review-actions">{(["accept", "return", "reject"] as const).map(action => { const reason = actionReason(action); return <button key={action} className={`studio-inspector__button studio-inspector__button--${action === "accept" ? "primary" : action === "reject" ? "danger" : "secondary"}`} disabled={Boolean(reason || inFlight)} aria-label={`${action === "return" ? "Return candidate for revision" : action === "reject" ? "Reject candidate knowledge" : "Accept candidate as knowledge"}${reason ? `. Unavailable: ${reason}` : ""}`} onClick={() => lifecycleAction(action)}>{action === "accept" ? "Accept as Knowledge" : action === "return" ? "Return for Revision" : "Reject Candidate"}</button>; })}</div><p className="studio-inspector__boundary"><strong>Candidate boundary:</strong> publication creates a candidate node only. It does not create accepted knowledge or an accepted relationship.</p>
    </section>}

    {v1AuthorityUnavailable ? <section className="studio-inspector__card"><h3>Source &amp; claim lineage</h3><p className="studio-inspector__authority-unavailable" role="alert">Studio V1 authority cannot be established. Saved lineage is unavailable; local content is preserved.</p></section> : v1Durable ? <section className="studio-inspector__card"><h3>Source &amp; claim lineage</h3><p className="studio-inspector__authority-label">Authoritative .author revision {saveAction.state.revisionNumber}</p><div className="studio-inspector__metrics"><span><b>{saveAction.state.sourceSnapshotCount ?? 0}</b> saved source snapshots</span><span><b>{saveAction.state.citationCount ?? 0}</b> saved citations</span><span><b>{saveAction.state.claimCount ?? 0}</b> saved claims</span><span><b>{sourceBackedBlockCount(document)}</b> local source-backed blocks</span><span><b>{authoredBlockCount(document)}</b> local authored blocks</span></div>{(saveAction.state.sourceSnapshotCount ?? 0) === 0 ? <p className="studio-inspector__empty-lineage">No source-backed lineage is recorded for .author revision {saveAction.state.revisionNumber}.</p> : <p>Source snapshot lineage is recorded for immutable .author revision {saveAction.state.revisionNumber}.</p>}{dirty && <p className="studio-inspector__historical-note">These counts describe the last saved revision {saveAction.state.revisionNumber}; local changes remain unsaved.</p>}</section> : <section className="studio-inspector__card"><h3>Source &amp; claim lineage</h3><div className="studio-inspector__metrics"><span><b>{sourceBackedBlockCount(document)}</b> source-backed blocks</span><span><b>{authoredBlockCount(document)}</b> authored blocks</span></div><p>Snapshot: {snapshotState}</p>{version ? <div className="studio-inspector__lineage-list">{version.claims.length ? version.claims.map(claim => { const mappings = version.claimSourceMappings?.filter(mapping => mapping.claimId === claim.claimId) ?? []; return <article key={claim.claimId} className="studio-inspector__lineage-row"><strong>{claim.claimId}</strong><span>{claim.lineageState === "ORPHANED" ? "MISSING CITATION" : claim.lineageState}</span><small>{claim.claimText || "Authored claim text unavailable"}</small>{mappings.length ? mappings.map(mapping => { const source = activeSnapshots.find(snapshot => snapshot.snapshotId === mapping.sourceSnapshotId); return <dl key={mapping.mappingId}><dt>Source block</dt><dd>{mapping.sourceSnapshotId}</dd><dt>Canonical source</dt><dd>{source?.sourceIdentity ?? "Canonical identity unavailable"}</dd><dt>Provenance</dt><dd>{source?.resolutionStatus ?? "UNKNOWN"}</dd></dl>; }) : <em>No canonical claim/source mapping.</em>}</article>; }) : <p className="studio-inspector__empty-lineage">No authored claims are represented in this version.</p>}{activeSnapshots.length ? activeSnapshots.map(source => <div className="studio-inspector__source-row" key={source.snapshotId}><strong>{source.snapshotId}</strong><span>{source.sourceIdentity}</span><small>{source.sourceWorkspace} · {source.sourceKind} · {source.resolutionStatus}</small></div>) : <p className="studio-inspector__empty-lineage">No source-backed blocks are represented in this version.</p>}</div> : <p className="studio-inspector__empty-lineage">Lineage is empty until a canonical artifact version is saved.</p>}<p className="studio-inspector__boundary">Only canonical mappings are shown. Source presence records lineage; it does not establish scientific validity.</p></section>}

    <section className="studio-inspector__card"><h3>Canonical source &amp; child projections</h3><StudioArtifactFamily state={saveAction.state} dirty={dirty} /></section>
  </aside>;
}
