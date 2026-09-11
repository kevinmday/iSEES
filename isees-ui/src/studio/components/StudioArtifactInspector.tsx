import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthorDocument, useAuthorDocumentDirty } from "../../author/runtime/AuthorDocumentRuntimeContext";
import { useOperatorIdentity } from "../../identity/runtime/OperatorIdentityRuntimeContext";
import { useActiveInvestigation } from "../../workspace/runtime/WorkspaceRuntimeContext";
import { authoredBlockCount, sourceBackedBlockCount } from "../api/StudioAuthorDocumentAdapter";
import { studioApi, StudioApiError, type ProjectionFormat, type StudioArtifactProjection, type StudioLifecycle, type StudioScope } from "../api/StudioApi";
import { canMaterializeProjection, hasDurableArtifactVersion, isExpectedUnsavedArtifact, selectCurrentProjection, STUDIO_ARTIFACT_EMPTY_ACTION, STUDIO_ARTIFACT_EMPTY_MESSAGE, STUDIO_PROJECTION_EMPTY_MESSAGE } from "./StudioArtifactInspectorSemantics";
import "./StudioArtifactInspector.css";
import { useStudioSaveAction } from "../runtime/StudioSaveActionContext.ts";

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
  const [preview, setPreview] = useState<ProjectionFormat>();
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
    setPreview(undefined);
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

  const validate = (format: ProjectionFormat) => {
    if (!scope || !activeArtifact || inFlight) return;
    const a = activeArtifact.artifact;
    void mutate(`Validate ${format}`, `/${encodeURIComponent(a.artifactId)}/projections/validations`, { schemaVersion: "studio-command/v1", investigationId: scope.investigationId, principalId: scope.principalId, artifactId: a.artifactId, expectedRevision: a.revision, idempotencyKey: idempotency(`validate-${format}`), artifactVersionId: a.currentVersionId, projectionFormat: format, citationStyleConfiguration: {}, validatorVersion: "studio-ui-i2e/v1" });
  };

  const materialize = (projectionId: string, artifactVersionId: string) => {
    if (!scope || !activeArtifact || inFlight) return;
    const a = activeArtifact.artifact;
    void mutate("Materialize PDF", `/${encodeURIComponent(a.artifactId)}/projections/materializations`, {
      schemaVersion: "studio-command/v1", investigationId: scope.investigationId,
      principalId: scope.principalId, artifactId: a.artifactId, expectedRevision: a.revision,
      idempotencyKey: idempotency("materialize-pdf"), projectionId, artifactVersionId,
    });
  };

  const downloadPdf = async (projectionId: string) => {
    if (!scope || !activeArtifact || inFlight) return;
    setInFlight("Download PDF"); setMessage("Downloading authoritative PDF…");
    try {
      const result = await studioApi.downloadPdf(scope, activeArtifact.artifact.artifactId, projectionId);
      const url = URL.createObjectURL(result.blob);
      const anchor = window.document.createElement("a"); anchor.href = url; anchor.download = result.filename;
      window.document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
      setState("SUCCESS"); setMessage("Authoritative PDF downloaded for the saved canonical version.");
    } catch (error) { handleError(error); }
    finally { setInFlight(undefined); }
  };

  const current = activeArtifact?.artifact;
  const version = activeArtifact?.currentVersion;
  const durableVersionExists = hasDurableArtifactVersion(current?.artifactId, current?.currentVersionId, version?.versionId);
  const contentConsistent = saveAction.state.headRevisionId ? !dirty : undefined;
  const activeSnapshots = activeArtifact?.sourceSnapshots.filter(snapshot => version?.sourceSnapshotIds.includes(snapshot.snapshotId)) ?? [];
  const snapshotState = !activeArtifact ? "Not yet captured" : activeSnapshots.some(item => item.resolutionStatus === "STALE") ? "Stale" : activeSnapshots.some(item => ["MISSING", "UNAVAILABLE", "REDACTED"].includes(item.resolutionStatus)) ? "Unavailable" : activeSnapshots.length ? (activeSnapshots.every(item => item.resolutionStatus === "AVAILABLE") ? "Consistent" : "Not yet resolved") : "No snapshots";
  const actionReason = (operation: keyof typeof actionTarget) => !activeArtifact ? "Create and save a draft first." : current?.lifecycleState !== actionTarget[operation] ? `Requires ${labels[actionTarget[operation]]}.` : (["accept", "return", "reject"].includes(operation) && !reviewReason.trim()) ? "A review reason is required." : undefined;
  const saveReason = !scope ? "Select an Investigation and establish an operator identity." : !document ? "Create or restore a canonical author draft." : inFlight ? `${inFlight} is in progress.` : activeArtifact && !dirty ? "The canonical draft has no unsaved changes." : current && !["DRAFT", "RETURNED"].includes(current.lifecycleState) ? "Versions may be saved only in Draft or Returned." : undefined;
  const saveAvailable = !saveReason && saveAction.state.canSave;
  const v1SaveFailed = ["FAILED", "UNAVAILABLE", "UNAUTHENTICATED", "CONFLICT"].includes(saveAction.state.status);
  const v1Durable = Boolean(saveAction.state.artifactId && saveAction.state.headRevisionId && saveAction.state.revisionNumber);
  const serviceAvailability = saveAction.state.status === "UNAVAILABLE" ? "Unavailable" : saveAction.state.status === "LOADING" ? "Restoring" : operator.identity?.kind === "ACCOUNT" ? "Available" : "Not yet established";

  return <aside className="studio-inspector" data-permanent="true" aria-label="Artifact Inspector">
    <header className="studio-inspector__header"><div className="studio-inspector__kicker">STUDIO V1 / AUTHORITATIVE</div><h2>Artifact Inspector</h2><span className={`studio-inspector__state studio-inspector__state--${saveAction.state.status.toLowerCase()}`}>{saveAction.state.status.replaceAll("_", " ")}</span></header>
    <p className="studio-inspector__message" role={v1SaveFailed ? "alert" : "status"}>{saveAction.state.message}</p>
    <p className="studio-inspector__message" role="status">Studio V1 author service: {serviceAvailability}.</p>
    <section className="studio-inspector__card"><h3>Artifact identity</h3><dl className="studio-inspector__facts">
      <dt>Artifact ID</dt><dd>{saveAction.state.artifactId ?? "Not yet created"}</dd><dt>Immutable revision</dt><dd>{saveAction.state.revisionNumber ? `Revision ${saveAction.state.revisionNumber}` : "Not yet created"}</dd><dt>Durable head</dt><dd>{saveAction.state.headRevisionId ?? "Not yet created"}</dd><dt>Author / principal</dt><dd>{saveAction.state.ownerPrincipalId ?? "Not yet created"}</dd><dt>Investigation</dt><dd>{saveAction.state.investigationId ?? investigation?.id ?? "Not yet created"}</dd><dt>Created</dt><dd>{saveAction.state.artifactCreatedAt ? formatTime(saveAction.state.artifactCreatedAt) : "Not yet created"}</dd><dt>Modified / saved</dt><dd>{saveAction.state.savedAt ? formatTime(saveAction.state.savedAt) : "Not yet created"}</dd><dt>Lifecycle / save state</dt><dd>{saveAction.state.lifecycleClassification ?? (v1Durable ? "Saved revision" : "Not yet created")}</dd><dt>Draft state</dt><dd>{dirty ? "Dirty · unsaved changes" : v1Durable ? "Saved · clean" : "Not yet saved"}</dd><dt>Source snapshots</dt><dd>{saveAction.state.sourceSnapshotCount ?? "Not yet created"}</dd><dt>Citations</dt><dd>{saveAction.state.citationCount ?? "Not yet created"}</dd><dt>Claims</dt><dd>{saveAction.state.claimCount ?? "Not yet created"}</dd><dt>Projection status</dt><dd>{saveAction.state.projections ? saveAction.state.projections.items.length ? "Authoritative statuses available" : "Not validated · not materialized" : "Not yet available"}</dd>
    </dl>{dirty && v1Durable && <p className="studio-inspector__historical-note">Saved revision {saveAction.state.revisionNumber} remains authoritative; projections do not include these unsaved changes.</p>}{v1SaveFailed && <div className="studio-inspector__operation-error" role="alert"><strong>Studio V1 operation requires attention</strong><span>{saveAction.state.message} Your unsaved draft is preserved.</span>{saveAction.state.status === "CONFLICT" && saveAction.state.artifactId && <button className="studio-inspector__button" onClick={() => void saveAction.reloadHead()}>Reload saved head</button>}</div>}<button className="studio-inspector__button studio-inspector__button--primary" disabled={!saveAvailable} aria-describedby={saveReason ? "studio-save-reason" : undefined} onClick={() => void save()}>{inFlight === "Save Draft" ? "Saving Draft…" : saveAction.state.retryable ? "Retry Save" : "Save Draft"}</button>{saveReason && <p id="studio-save-reason" className="studio-inspector__disabled-reason">{saveReason}</p>}</section>

    <p className="studio-inspector__message" role={state === "UNAVAILABLE_BACKEND" ? "alert" : "status"}>Legacy lifecycle/artifact service (secondary): {message}{state === "NOT_CREATED" && <> {STUDIO_ARTIFACT_EMPTY_ACTION}</>}</p>

    <section className="studio-inspector__card"><h3>Knowledge lifecycle</h3><ol className="studio-inspector__lifecycle">{lifecycle.map(item => <li key={item} className={current?.lifecycleState === item ? "is-current" : ""}>{labels[item]}</li>)}</ol>{current && ["RETURNED", "REJECTED"].includes(current.lifecycleState) && <div className={`studio-inspector__terminal studio-inspector__terminal--${current.lifecycleState.toLowerCase()}`}>{labels[current.lifecycleState]}</div>}
      <div className="studio-inspector__actions">{(["candidate", "publication", "review"] as const).map(action => { const reason = dirty ? "Save current changes before advancing lifecycle." : actionReason(action); const label = action === "candidate" ? "Save as Candidate Knowledge" : action === "publication" ? "Publish Candidate to Manifold" : "Submit for Review"; return <div className="studio-inspector__action" key={action}><button className="studio-inspector__button" disabled={Boolean(reason || inFlight)} aria-describedby={reason ? `studio-${action}-reason` : undefined} onClick={() => lifecycleAction(action)}>{inFlight === label ? `${label}…` : label}</button>{reason && <span id={`studio-${action}-reason`}>{reason}</span>}</div>; })}</div>
      <label className="studio-inspector__reason">Review reason<input value={reviewReason} onChange={event => setReviewReason(event.target.value)} placeholder="Required for a decision" /></label><div className="studio-inspector__review-actions">{(["accept", "return", "reject"] as const).map(action => { const reason = actionReason(action); return <button key={action} className={`studio-inspector__button studio-inspector__button--${action === "accept" ? "primary" : action === "reject" ? "danger" : "secondary"}`} disabled={Boolean(reason || inFlight)} aria-label={`${action === "return" ? "Return candidate for revision" : action === "reject" ? "Reject candidate knowledge" : "Accept candidate as knowledge"}${reason ? `. Unavailable: ${reason}` : ""}`} onClick={() => lifecycleAction(action)}>{action === "accept" ? "Accept as Knowledge" : action === "return" ? "Return for Revision" : "Reject Candidate"}</button>; })}</div><p className="studio-inspector__boundary"><strong>Candidate boundary:</strong> publication creates a candidate node only. It does not create accepted knowledge or an accepted relationship.</p>
    </section>

    <section className="studio-inspector__card"><h3>Source &amp; claim lineage</h3><div className="studio-inspector__metrics"><span><b>{sourceBackedBlockCount(document)}</b> source-backed blocks</span><span><b>{authoredBlockCount(document)}</b> authored blocks</span></div><p>Snapshot: {snapshotState}</p>{version ? <div className="studio-inspector__lineage-list">{version.claims.length ? version.claims.map(claim => { const mappings = version.claimSourceMappings?.filter(mapping => mapping.claimId === claim.claimId) ?? []; return <article key={claim.claimId} className="studio-inspector__lineage-row"><strong>{claim.claimId}</strong><span>{claim.lineageState === "ORPHANED" ? "MISSING CITATION" : claim.lineageState}</span><small>{claim.claimText || "Authored claim text unavailable"}</small>{mappings.length ? mappings.map(mapping => { const source = activeSnapshots.find(snapshot => snapshot.snapshotId === mapping.sourceSnapshotId); return <dl key={mapping.mappingId}><dt>Source block</dt><dd>{mapping.sourceSnapshotId}</dd><dt>Canonical source</dt><dd>{source?.sourceIdentity ?? "Canonical identity unavailable"}</dd><dt>Provenance</dt><dd>{source?.resolutionStatus ?? "UNKNOWN"}</dd></dl>; }) : <em>No canonical claim/source mapping.</em>}</article>; }) : <p className="studio-inspector__empty-lineage">No authored claims are represented in this version.</p>}{activeSnapshots.length ? activeSnapshots.map(source => <div className="studio-inspector__source-row" key={source.snapshotId}><strong>{source.snapshotId}</strong><span>{source.sourceIdentity}</span><small>{source.sourceWorkspace} · {source.sourceKind} · {source.resolutionStatus}</small></div>) : <p className="studio-inspector__empty-lineage">No source-backed blocks are represented in this version.</p>}</div> : <p className="studio-inspector__empty-lineage">Lineage is empty until a canonical artifact version is saved.</p>}<p className="studio-inspector__boundary">Only canonical mappings are shown. Source presence records lineage; it does not establish scientific validity.</p></section>

    <section className="studio-inspector__card"><h3>Output projections</h3>{!durableVersionExists && <p className="studio-inspector__disabled-reason">{STUDIO_PROJECTION_EMPTY_MESSAGE}</p>}<div className="studio-inspector__projections">{(["PDF", "DOCX", "HTML"] as ProjectionFormat[]).map(format => { const latest = selectCurrentProjection(activeArtifact?.projections ?? [], current?.currentVersionId, format); const canMaterialize = canMaterializeProjection({ durableVersionExists, synchronized: contentConsistent === true, dirty, inFlight: Boolean(inFlight), owned: Boolean(scope && current?.ownerPrincipalId === scope.principalId), currentVersionId: current?.currentVersionId, format, projection: latest }); const downloadable = format === "PDF" && latest?.materializationState === "MATERIALIZED" && Boolean(latest.outputIdentity); return <article className="studio-inspector__projection" key={format}><div><strong>{format}</strong><span>{latest ? latest.readinessState.replaceAll("_", " ") : "NOT VALIDATED"}</span></div><dl><dt>Consistency</dt><dd>{contentConsistent === undefined ? "Unavailable" : contentConsistent ? "Current" : "Draft changed"}</dd><dt>Validation</dt><dd>{latest ? `${latest.validatorVersion} · ${formatTime(latest.validatedAt)}` : "Not yet run"}</dd><dt>Materialization</dt><dd>{latest?.materializationState === "MATERIALIZED" ? `Materialized · ${latest.outputIdentity ?? "canonical output"}` : "Not materialized"}</dd>{downloadable && <><dt>Saved output</dt><dd>Canonical v{current?.currentVersionNumber}</dd></>}</dl><div className="studio-inspector__projection-actions"><button className="studio-inspector__button" disabled={!durableVersionExists || dirty || Boolean(inFlight)} title={dirty ? "Save the current draft before validation." : undefined} onClick={() => validate(format)}>Validate</button><button className="studio-inspector__button" disabled={!durableVersionExists} onClick={() => setPreview(preview === format ? undefined : format)}>Preview</button><button className="studio-inspector__button" disabled={!canMaterialize} title={canMaterialize ? "Projection is eligible for authoritative materialization." : "Save and validate the current version before materialization."} onClick={() => latest && materialize(latest.projectionId, latest.artifactVersionId)}>{inFlight === "Materialize PDF" && format === "PDF" ? "Materializing…" : "Materialize"}</button>{downloadable && <button className="studio-inspector__button studio-inspector__button--primary" disabled={Boolean(inFlight)} onClick={() => void downloadPdf(latest!.projectionId)}>Download PDF</button>}</div>{durableVersionExists && preview === format && <p className="studio-inspector__preview">Browser-only content preview. This is not an authoritative exported {format} file. {document?.metadata.title}</p>}{latest?.validationWarnings.map(warning => <p className="studio-inspector__warning" key={warning}>{warning}</p>)}</article>; })}</div></section>
  </aside>;
}
