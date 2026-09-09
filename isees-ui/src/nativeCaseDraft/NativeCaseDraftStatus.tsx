import type { NativeCaseDraftCoordinatorState } from "./NativeCaseDraftCoordinator.ts";

export interface NativeCaseDraftStatusProps {
  readonly state: NativeCaseDraftCoordinatorState;
  readonly onReloadLatest: () => void;
  readonly onKeepEdits: () => void;
  readonly onReplaceWithLatest: () => void;
}

export function NativeCaseDraftStatus({ state, onReloadLatest, onKeepEdits, onReplaceWithLatest }: NativeCaseDraftStatusProps) {
  const errorRole = state.error ? "alert" : undefined;
  return <aside className={`native-case-draft__status native-case-draft__status--${state.lifecycle.toLowerCase()}`} aria-label="Draft status">
    <div className="native-case-draft__badges"><span>Candidate Knowledge</span><span>Draft</span><span>{statusLabel(state)}</span></div>
    <p className="native-case-draft__announcement" role="status" aria-live="polite">{state.statusAnnouncement}</p>
    <dl className="native-case-draft__receipt">
      <div><dt>Association</dt><dd>{state.investigationId ?? "Unassigned Candidate Knowledge"}</dd></div>
      {state.candidateId && <div><dt>Candidate identity</dt><dd>{state.candidateId}</dd></div>}
      {state.revision !== null && <div><dt>Revision</dt><dd>{state.revision}</dd></div>}
      {state.freshnessToken && <div><dt>Freshness token</dt><dd>{state.freshnessToken}</dd></div>}
      {state.updatedAt && <div><dt>Updated</dt><dd><time dateTime={state.updatedAt}>{state.updatedAt}</time></dd></div>}
      {state.createdAt && <div><dt>Created</dt><dd><time dateTime={state.createdAt}>{state.createdAt}</time></dd></div>}
      {state.disposition && <div><dt>Receipt</dt><dd>{state.disposition}</dd></div>}
    </dl>
    {state.error && <div className="native-case-draft__message native-case-draft__message--error" role={errorRole}><strong>{errorHeading(state)}</strong><p>{state.error.message}</p>{state.error.requestId && <p>Request ID: <code>{state.error.requestId}</code></p>}</div>}
    {state.conflict && <div className="native-case-draft__message native-case-draft__message--conflict" role="alert"><strong>A newer server revision exists.</strong><p>Your local edits remain in the form. Load the latest revision for comparison, then choose whether to replace them.</p><div className="native-case-draft__actions"><button type="button" onClick={onReloadLatest} disabled={state.inFlight}>Reload Latest</button><button type="button" onClick={onKeepEdits} disabled={state.inFlight}>Keep My Edits for Comparison</button>{state.latestServerProjection && <button type="button" onClick={onReplaceWithLatest} disabled={state.inFlight}>Replace with Latest</button>}</div>{state.latestServerProjection && <p>Latest server revision: {state.latestServerProjection.revision}; updated {state.latestServerProjection.updatedAt}.</p>}</div>}
    <p className="native-case-draft__warning">Saving creates or updates private Candidate Knowledge in Draft state. It does not submit, activate, analyze, publish, materialize a workspace, or change System Canon.</p>
  </aside>;
}

function statusLabel(state: NativeCaseDraftCoordinatorState): string {
  if (state.lifecycle === "SAVING") return "Saving";
  if (state.lifecycle === "RELOADING") return "Reloading";
  if (state.lifecycle === "REVISION_CONFLICT") return "Conflict";
  if (state.lifecycle === "SAVE_ERROR" || state.lifecycle === "VALIDATION_ERROR") return "Error";
  if (state.lifecycle === "SAVED") return "Saved";
  return state.dirty ? "Unsaved" : "New / unsaved";
}
function errorHeading(state: NativeCaseDraftCoordinatorState): string { return state.conflict ? "Revision conflict" : state.error?.kind === "VALIDATION" ? "Server validation failed" : "Draft operation failed"; }
