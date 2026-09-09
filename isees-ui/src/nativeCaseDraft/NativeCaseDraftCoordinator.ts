import { NativeCaseDraftClientError } from "./NativeCaseDraftTypes.ts";
import type { NativeCaseDraftFormState, FieldValidationResult, NativeCaseDraftFieldName } from "./NativeCaseDraftFieldState.ts";
import { contentMatchesBaseline, createBlankNativeCaseDraftContent, createNativeCaseDraftCommand, firstInvalidField, mapFormStateToContent, restoreFormState, updateNativeCaseDraftCommand, validateNativeCaseDraftForm } from "./NativeCaseDraftFieldState.ts";
import type { NativeCaseDraftContent, NativeCaseDraftCreateCommand, NativeCaseDraftProjection, NativeCaseDraftReceipt, NativeCaseDraftUpdateCommand } from "./NativeCaseDraftTypes.ts";

export type NativeCaseDraftLifecycle = "NEW" | "DIRTY" | "SAVING" | "SAVED" | "VALIDATION_ERROR" | "SAVE_ERROR" | "REVISION_CONFLICT" | "RELOADING" | "DISCARDED";
export type NativeCaseDraftMutationCommand = NativeCaseDraftCreateCommand | NativeCaseDraftUpdateCommand;
export interface NativeCaseDraftApiDependency {
  create(command: NativeCaseDraftCreateCommand, signal?: AbortSignal): Promise<NativeCaseDraftReceipt>;
  get(candidateId: string, signal?: AbortSignal): Promise<NativeCaseDraftProjection>;
  update(candidateId: string, command: NativeCaseDraftUpdateCommand, signal?: AbortSignal): Promise<NativeCaseDraftReceipt>;
}
export interface NativeCaseDraftCoordinatorState {
  readonly lifecycle: NativeCaseDraftLifecycle;
  readonly form: NativeCaseDraftFormState;
  readonly baseline: NativeCaseDraftContent;
  readonly candidateId: string | null;
  readonly investigationId: string | null;
  readonly revision: number | null;
  readonly freshnessToken: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
  readonly dirty: boolean;
  readonly inFlight: boolean;
  readonly validation: readonly FieldValidationResult[];
  readonly firstInvalidField: NativeCaseDraftFieldName | null;
  readonly error: NativeCaseDraftClientError | null;
  readonly conflict: boolean;
  readonly latestServerProjection: NativeCaseDraftProjection | null;
  readonly pendingRetryIdentity: Readonly<{ idempotencyKey: string; command: NativeCaseDraftMutationCommand }> | null;
  readonly disposition: NativeCaseDraftReceipt["idempotencyDisposition"] | null;
  readonly statusAnnouncement: string;
}
export interface NativeCaseDraftCoordinatorOptions {
  readonly api: NativeCaseDraftApiDependency;
  readonly generateIdempotencyKey: () => string;
  readonly initialProjection?: NativeCaseDraftProjection;
  readonly investigationId?: string | null;
}

type Listener = (state: NativeCaseDraftCoordinatorState) => void;
const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const cloneForm = (form: NativeCaseDraftFormState): NativeCaseDraftFormState => freeze(Object.fromEntries(Object.entries(form).map(([field, entry]) => [field, freeze({ ...entry })]))) as NativeCaseDraftFormState;
const asClientError = (error: unknown): NativeCaseDraftClientError => error instanceof NativeCaseDraftClientError ? error : new NativeCaseDraftClientError("NETWORK", error instanceof Error ? error.message : "The draft could not be saved.", { domainCode: "UNEXPECTED_TRANSPORT_FAILURE", cause: error });
const isUncertain = (error: NativeCaseDraftClientError): boolean => error.kind === "NETWORK" || error.kind === "MALFORMED_RESPONSE" || error.kind === "HTTP" && (error.status === null || error.status >= 500);
const validateAssociation = (value: string | null): string | null => {
  if (value === null) return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > 500) throw new Error("Investigation identity is invalid.");
  return normalized;
};

export class NativeCaseDraftCoordinator {
  readonly #api: NativeCaseDraftApiDependency;
  readonly #key: () => string;
  readonly #listeners = new Set<Listener>();
  #state: NativeCaseDraftCoordinatorState;
  #controller: AbortController | null = null;
  #generation = 0;
  #disposed = false;

  constructor(options: NativeCaseDraftCoordinatorOptions) {
    this.#api = options.api;
    this.#key = options.generateIdempotencyKey;
    const projection = options.initialProjection;
    const investigationId = validateAssociation(options.investigationId === undefined ? projection?.investigationId ?? null : options.investigationId);
    const baseline = projection?.content ?? createBlankNativeCaseDraftContent();
    const form = projection ? restoreFormState(projection) : restoreFormState({ content: baseline } as NativeCaseDraftProjection);
    this.#state = freeze({ lifecycle: projection ? "SAVED" : "NEW", form, baseline, candidateId: projection?.candidateId ?? null, investigationId, revision: projection?.revision ?? null, freshnessToken: projection?.freshnessToken ?? null, createdAt: projection?.createdAt ?? null, updatedAt: projection?.updatedAt ?? null, dirty: false, inFlight: false, validation: freeze([]), firstInvalidField: null, error: null, conflict: false, latestServerProjection: null, pendingRetryIdentity: null, disposition: null, statusAnnouncement: projection ? "Draft loaded." : "New Candidate Knowledge draft." });
  }

  get state(): NativeCaseDraftCoordinatorState { return this.#state; }
  subscribe(listener: Listener): () => void { this.#listeners.add(listener); listener(this.#state); return () => this.#listeners.delete(listener); }

  updateField(field: NativeCaseDraftFieldName, entry: NativeCaseDraftFormState[NativeCaseDraftFieldName]): boolean {
    if (this.#state.inFlight || this.#disposed) return false;
    const form = cloneForm({ ...this.#state.form, [field]: freeze({ ...entry }) });
    let dirty = true;
    try { dirty = !contentMatchesBaseline(mapFormStateToContent(form), this.#state.baseline); } catch { /* invalid supplied input remains dirty */ }
    this.#set({ ...this.#state, form, dirty, lifecycle: dirty ? "DIRTY" : this.#state.candidateId ? "SAVED" : "NEW", validation: freeze([]), firstInvalidField: null, error: null, pendingRetryIdentity: null, disposition: null, statusAnnouncement: dirty ? "Draft has unsaved changes." : "Draft is unchanged." });
    return true;
  }

  async save(): Promise<boolean> {
    if (!this.#canOperate()) return false;
    const validation = validateNativeCaseDraftForm(this.#state.form);
    const invalid = firstInvalidField(this.#state.form);
    if (invalid) {
      this.#set({ ...this.#state, lifecycle: "VALIDATION_ERROR", validation, firstInvalidField: invalid.field, error: null, statusAnnouncement: "Draft has validation errors." });
      return false;
    }
    const key = this.#key();
    const command = this.#state.candidateId === null
      ? createNativeCaseDraftCommand(this.#state.form, this.#state.investigationId, key)
      : updateNativeCaseDraftCommand(this.#state.form, this.#state.investigationId, this.#requiredRevision(), key);
    return this.#sendFrozen(command);
  }

  async retrySave(): Promise<boolean> {
    if (!this.#canOperate() || !this.#state.pendingRetryIdentity) return false;
    return this.#sendFrozen(this.#state.pendingRetryIdentity.command);
  }

  discard(): boolean {
    if (!this.#canOperate()) return false;
    const form = this.#state.candidateId ? restoreFormState({ content: this.#state.baseline } as NativeCaseDraftProjection) : restoreFormState({ content: createBlankNativeCaseDraftContent() } as NativeCaseDraftProjection);
    const baseline = this.#state.candidateId ? this.#state.baseline : createBlankNativeCaseDraftContent();
    this.#set({ ...this.#state, lifecycle: "DISCARDED", form, baseline, dirty: false, validation: freeze([]), firstInvalidField: null, error: null, conflict: false, latestServerProjection: null, pendingRetryIdentity: null, disposition: null, statusAnnouncement: "Unsaved changes discarded." });
    return true;
  }

  async reloadLatest(): Promise<boolean> {
    if (!this.#canOperate() || !this.#state.candidateId || !this.#state.conflict) return false;
    const generation = this.#begin("RELOADING", "Loading the latest server revision.");
    try {
      const projection = await this.#api.get(this.#state.candidateId, this.#controller!.signal);
      if (!this.#isCurrent(generation)) return false;
      this.#finish({ ...this.#state, lifecycle: "REVISION_CONFLICT", inFlight: false, latestServerProjection: projection, statusAnnouncement: "Latest server revision loaded. Your edits have not been replaced." });
      return true;
    } catch (raw) {
      if (!this.#isCurrent(generation)) return false;
      const error = asClientError(raw);
      this.#finish({ ...this.#state, lifecycle: "REVISION_CONFLICT", inFlight: false, error: error.kind === "ABORTED" ? null : error, statusAnnouncement: error.kind === "ABORTED" ? "Reload cancelled." : "Latest revision could not be loaded." });
      return false;
    }
  }

  replaceWithLatest(): boolean {
    if (!this.#canOperate() || !this.#state.latestServerProjection) return false;
    this.#installProjection(this.#state.latestServerProjection, null, "Latest server revision replaced local edits.");
    return true;
  }

  keepEditsForComparison(): boolean {
    if (!this.#canOperate() || !this.#state.conflict) return false;
    this.#set({ ...this.#state, lifecycle: "REVISION_CONFLICT", statusAnnouncement: "Local edits retained for comparison with the latest server revision." });
    return true;
  }

  abort(): void { if (this.#controller) { this.#generation += 1; this.#controller.abort(); this.#controller = null; this.#set({ ...this.#state, inFlight: false, lifecycle: this.#state.dirty ? "DIRTY" : this.#state.candidateId ? "SAVED" : "NEW", statusAnnouncement: "Draft operation cancelled." }); } }
  dispose(): void { if (this.#disposed) return; this.#disposed = true; this.abort(); this.#listeners.clear(); }

  async #sendFrozen(command: NativeCaseDraftMutationCommand): Promise<boolean> {
    const generation = this.#begin("SAVING", "Saving Candidate Knowledge draft.");
    const identity = freeze({ idempotencyKey: command.idempotencyKey, command });
    try {
      const receipt = "expectedRevision" in command
        ? await this.#api.update(this.#state.candidateId!, command, this.#controller!.signal)
        : await this.#api.create(command, this.#controller!.signal);
      if (!this.#isCurrent(generation)) return false;
      this.#installProjection(receipt, receipt.idempotencyDisposition, `Draft saved. Revision ${receipt.revision}.`);
      return true;
    } catch (raw) {
      if (!this.#isCurrent(generation)) return false;
      const error = asClientError(raw);
      if (error.kind === "ABORTED") { this.#finish({ ...this.#state, inFlight: false, lifecycle: this.#state.dirty ? "DIRTY" : this.#state.candidateId ? "SAVED" : "NEW", error: null, statusAnnouncement: "Save cancelled." }); return false; }
      const conflict = error.kind === "REVISION_CONFLICT";
      this.#finish({ ...this.#state, inFlight: false, lifecycle: conflict ? "REVISION_CONFLICT" : "SAVE_ERROR", error, conflict, latestServerProjection: null, pendingRetryIdentity: isUncertain(error) ? identity : null, statusAnnouncement: conflict ? "The server has a newer revision. Local edits were preserved." : "Draft save failed. Local edits were preserved." });
      return false;
    }
  }

  #installProjection(projection: NativeCaseDraftProjection, disposition: NativeCaseDraftReceipt["idempotencyDisposition"] | null, announcement: string): void {
    this.#finish({ ...this.#state, lifecycle: "SAVED", form: restoreFormState(projection), baseline: projection.content, candidateId: projection.candidateId, investigationId: projection.investigationId, revision: projection.revision, freshnessToken: projection.freshnessToken, createdAt: projection.createdAt, updatedAt: projection.updatedAt, dirty: false, inFlight: false, validation: freeze([]), firstInvalidField: null, error: null, conflict: false, latestServerProjection: null, pendingRetryIdentity: null, disposition, statusAnnouncement: announcement });
  }
  #begin(lifecycle: "SAVING" | "RELOADING", announcement: string): number { const generation = ++this.#generation; this.#controller = new AbortController(); this.#set({ ...this.#state, lifecycle, inFlight: true, error: null, statusAnnouncement: announcement }); return generation; }
  #finish(state: NativeCaseDraftCoordinatorState): void { this.#controller = null; this.#set(state); }
  #isCurrent(generation: number): boolean { return !this.#disposed && generation === this.#generation; }
  #canOperate(): boolean { return !this.#disposed && !this.#state.inFlight; }
  #requiredRevision(): number { if (this.#state.revision === null) throw new Error("Saved draft revision is unavailable."); return this.#state.revision; }
  #set(state: NativeCaseDraftCoordinatorState): void { this.#state = freeze(state); for (const listener of this.#listeners) listener(this.#state); }
}
