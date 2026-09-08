import {
  InvestigationLibraryStatus,
  type InvestigationLibraryProjection,
} from "../frontDoor/FrontDoorProjectionTypes.ts";
import {
  normalizeInvestigationPrincipal,
  type InvestigationLibraryApi,
} from "./InvestigationLibraryApi.ts";
import {
  InvestigationLibraryError,
  InvestigationLibraryErrorCode,
  type InvestigationLibraryLoadMetadata,
  type InvestigationLibraryState,
  type InvestigationSummary,
} from "./InvestigationLibraryTypes.ts";

type Subscriber = (state: InvestigationLibraryState) => void;

function freezeState(value: {
  readonly principalId: string | null;
  readonly status: InvestigationLibraryStatus;
  readonly summaries: readonly InvestigationSummary[];
  readonly requestGeneration: number;
  readonly lastSuccessfulLoad?: InvestigationLibraryLoadMetadata;
  readonly error?: InvestigationLibraryError;
}): InvestigationLibraryState {
  const summaries = Object.freeze(value.summaries.map(item => Object.freeze({ ...item })));
  const metadata = value.lastSuccessfulLoad === undefined
    ? undefined
    : Object.freeze({ ...value.lastSuccessfulLoad });
  return Object.freeze({ ...value, summaries, lastSuccessfulLoad: metadata });
}

export function createInitialInvestigationLibraryState(): InvestigationLibraryState {
  return freezeState({
    principalId: null,
    status: InvestigationLibraryStatus.NOT_REQUESTED,
    summaries: [],
    requestGeneration: 0,
  });
}

export function toFrontDoorInvestigationLibraryProjection(
  state: InvestigationLibraryState,
): InvestigationLibraryProjection {
  const status = state.status === InvestigationLibraryStatus.READY && state.summaries.length === 0
    ? InvestigationLibraryStatus.ERROR
    : state.status === InvestigationLibraryStatus.EMPTY && state.summaries.length !== 0
      ? InvestigationLibraryStatus.ERROR
      : state.status;
  return Object.freeze({
    status,
    summaries: Object.freeze(state.summaries.map(summary => Object.freeze({
      investigationId: summary.investigationId,
      title: summary.title,
    }))),
  });
}

export class InvestigationLibraryRuntime {
  readonly #api: InvestigationLibraryApi;
  readonly #subscribers = new Set<Subscriber>();
  #state = createInitialInvestigationLibraryState();
  #generation = 0;
  #disposed = false;
  #controller: AbortController | undefined;

  constructor(api: InvestigationLibraryApi) {
    this.#api = api;
  }

  getState(): InvestigationLibraryState {
    return this.#state;
  }

  subscribe(subscriber: Subscriber): () => void {
    if (this.#disposed) return () => undefined;
    this.#subscribers.add(subscriber);
    return () => this.#subscribers.delete(subscriber);
  }

  #publish(state: InvestigationLibraryState): void {
    if (this.#disposed) return;
    this.#state = state;
    for (const subscriber of this.#subscribers) {
      try {
        subscriber(state);
      } catch {
        // A listener is observational and cannot participate in runtime authority.
      }
    }
  }

  setPrincipal(principalId: string | null): void {
    if (this.#disposed) return;
    const normalized = principalId === null ? null : normalizeInvestigationPrincipal(principalId);
    if (normalized === this.#state.principalId) return;
    this.#controller?.abort();
    this.#generation += 1;
    this.#publish(freezeState({
      principalId: normalized,
      status: InvestigationLibraryStatus.NOT_REQUESTED,
      summaries: [],
      requestGeneration: this.#generation,
    }));
  }

  async load(
    principalId: string,
    lastSuccessfulLoad?: InvestigationLibraryLoadMetadata,
  ): Promise<InvestigationLibraryState> {
    if (this.#disposed) return this.#state;
    let principal: string;
    try {
      principal = normalizeInvestigationPrincipal(principalId);
    } catch (error: unknown) {
      const typed = error instanceof InvestigationLibraryError ? error : new InvestigationLibraryError(
        InvestigationLibraryErrorCode.INVALID_PRINCIPAL,
        "The local/development ownership principal is invalid.",
      );
      this.#generation += 1;
      this.#publish(freezeState({
        principalId: null,
        status: InvestigationLibraryStatus.ERROR,
        summaries: [],
        requestGeneration: this.#generation,
        error: typed,
      }));
      return this.#state;
    }

    if (this.#state.principalId !== principal) this.setPrincipal(principal);
    const before = this.#state;
    const hasSnapshot = before.status === InvestigationLibraryStatus.READY
      || before.status === InvestigationLibraryStatus.EMPTY
      || before.status === InvestigationLibraryStatus.STALE;
    this.#controller?.abort();
    const controller = new AbortController();
    this.#controller = controller;
    const generation = ++this.#generation;
    this.#publish(freezeState({
      principalId: principal,
      status: hasSnapshot ? InvestigationLibraryStatus.STALE : InvestigationLibraryStatus.LOADING,
      summaries: hasSnapshot ? before.summaries : [],
      requestGeneration: generation,
      lastSuccessfulLoad: before.lastSuccessfulLoad,
    }));

    try {
      const result = await this.#api.listInvestigations(principal, controller.signal);
      if (this.#disposed || generation !== this.#generation || this.#state.principalId !== principal) return this.#state;
      this.#publish(freezeState({
        principalId: principal,
        status: result.items.length === 0 ? InvestigationLibraryStatus.EMPTY : InvestigationLibraryStatus.READY,
        summaries: result.items,
        requestGeneration: generation,
        lastSuccessfulLoad,
      }));
    } catch (error: unknown) {
      if (this.#disposed || generation !== this.#generation || this.#state.principalId !== principal) return this.#state;
      const typed = error instanceof InvestigationLibraryError ? error : new InvestigationLibraryError(
        InvestigationLibraryErrorCode.TRANSPORT_FAILURE,
        "The Investigation Library request failed.",
      );
      if (typed.code === InvestigationLibraryErrorCode.REQUEST_ABORTED) {
        this.#publish(freezeState({ ...before, requestGeneration: generation }));
      } else {
        this.#publish(freezeState({
          principalId: principal,
          status: hasSnapshot ? InvestigationLibraryStatus.STALE : InvestigationLibraryStatus.ERROR,
          summaries: hasSnapshot ? before.summaries : [],
          requestGeneration: generation,
          lastSuccessfulLoad: before.lastSuccessfulLoad,
          error: typed,
        }));
      }
    }
    return this.#state;
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#generation += 1;
    this.#controller?.abort();
    this.#subscribers.clear();
  }

  clearAccountState(): void {
    this.setPrincipal(null);
  }
}
