import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { NativeCaseDraftProjection } from "./NativeCaseDraftTypes.ts";
import type { NativeCaseDraftApiDependency, NativeCaseDraftCoordinatorState } from "./NativeCaseDraftCoordinator.ts";
import { NativeCaseDraftCoordinator } from "./NativeCaseDraftCoordinator.ts";
import { NativeCaseDraftStatus } from "./NativeCaseDraftStatus.tsx";
import { StructuredObservationForm, nativeCaseDraftFieldControlId } from "./StructuredObservationForm.tsx";
import "./NativeCaseDraft.css";

export interface NativeCaseDraftEditorProps {
  readonly api: NativeCaseDraftApiDependency;
  readonly initialProjection?: NativeCaseDraftProjection;
  readonly investigationId?: string | null;
  readonly generateIdempotencyKey?: () => string;
  readonly confirmDiscard?: () => boolean | Promise<boolean>;
  readonly onSaved?: (state: NativeCaseDraftCoordinatorState) => void;
  readonly onStateChange?: (state: NativeCaseDraftCoordinatorState) => void;
}
const defaultKey = () => globalThis.crypto.randomUUID();
const defaultConfirmDiscard = () => false;

export function NativeCaseDraftEditor({ api, initialProjection, investigationId, generateIdempotencyKey = defaultKey, confirmDiscard = defaultConfirmDiscard, onSaved, onStateChange }: NativeCaseDraftEditorProps) {
  const coordinator = useMemo(() => new NativeCaseDraftCoordinator({ api, initialProjection, investigationId, generateIdempotencyKey }), [api, initialProjection, investigationId, generateIdempotencyKey]);
  const state = useSyncExternalStore(callback => coordinator.subscribe(callback), () => coordinator.state, () => coordinator.state);

  useEffect(() => () => coordinator.dispose(), [coordinator]);
  useEffect(() => { onStateChange?.(state); }, [onStateChange, state]);
  useEffect(() => { if (state.lifecycle === "SAVED" && state.disposition) onSaved?.(state); }, [onSaved, state]);
  useEffect(() => {
    if (!state.firstInvalidField) return;
    document.getElementById(nativeCaseDraftFieldControlId(state.firstInvalidField))?.focus();
  }, [state.firstInvalidField]);

  const discard = async () => { if (!state.dirty || await confirmDiscard()) coordinator.discard(); };
  return <article className="native-case-draft" aria-labelledby="native-case-draft-title">
    <header className="native-case-draft__header"><p className="native-case-draft__eyebrow">Private research intake</p><h1 id="native-case-draft-title">Structured Observation Draft</h1><p>Record a structured observation as Candidate Knowledge. Each unanswered field remains explicitly marked as not answered.</p></header>
    <NativeCaseDraftStatus state={state} onReloadLatest={() => void coordinator.reloadLatest()} onKeepEdits={() => coordinator.keepEditsForComparison()} onReplaceWithLatest={() => coordinator.replaceWithLatest()} />
    <StructuredObservationForm form={state.form} validation={state.validation} busy={state.inFlight} onFieldChange={(field, entry) => coordinator.updateField(field, entry)} onSubmit={() => void coordinator.save()} actions={<>
      {state.pendingRetryIdentity && <button className="native-case-draft__button" type="button" disabled={state.inFlight} onClick={() => void coordinator.retrySave()}>Retry Save</button>}
      <button className="native-case-draft__button" type="button" disabled={state.inFlight || !state.dirty} onClick={() => void discard()}>Discard Unsaved Changes</button>
    </>} />
  </article>;
}
