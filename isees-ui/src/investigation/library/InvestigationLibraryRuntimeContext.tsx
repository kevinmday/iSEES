import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useOperatorIdentity } from "../../identity/runtime/OperatorIdentityRuntimeContext";
import { investigationLibraryApi } from "./InvestigationLibraryApi";
import {
  InvestigationLibraryRuntime,
  createInitialInvestigationLibraryState,
} from "./InvestigationLibraryRuntime";
import type { InvestigationLibraryState } from "./InvestigationLibraryTypes";
import { InvestigationLibraryStatus } from "../frontDoor/FrontDoorProjectionTypes";
import { normalizeInvestigationLibraryAuthority } from "../frontDoor/OverviewFrontDoorRuntimeProjection";

export interface InvestigationLibraryPublicState {
  readonly status: InvestigationLibraryStatus;
  readonly summaries: readonly Readonly<{
    readonly investigationId: string;
    readonly title: string;
  }>[];
}

export interface InvestigationLibraryRuntimeContextValue {
  readonly state: InvestigationLibraryPublicState;
  readonly refresh: () => void;
  readonly retry: () => void;
}

const InvestigationLibraryRuntimeContext = createContext<
  InvestigationLibraryRuntimeContextValue | undefined
>(undefined);

function isInvestigationLibraryStatus(value: unknown): value is InvestigationLibraryStatus {
  return typeof value === "string"
    && Object.values(InvestigationLibraryStatus).includes(value as InvestigationLibraryStatus);
}

export interface InvestigationLibraryAuthority {
  readonly kind: "GUEST" | "ACCOUNT";
  readonly principalId: string;
  readonly establishedAt: string;
  readonly revision: number;
}

export function resolveInvestigationLibraryAuthority(
  state: unknown,
): InvestigationLibraryAuthority | null {
  return normalizeInvestigationLibraryAuthority(state);
}

export function sameInvestigationLibraryAuthority(
  left: InvestigationLibraryAuthority | null,
  right: InvestigationLibraryAuthority | null,
): boolean {
  return left === right || (
    left !== null
    && right !== null
    && left.kind === right.kind
    && left.principalId === right.principalId
    && left.establishedAt === right.establishedAt
    && left.revision === right.revision
  );
}

export function reconcileInvestigationLibraryState(
  state: InvestigationLibraryState,
  stateAuthority: InvestigationLibraryAuthority | null,
  desiredAuthority: InvestigationLibraryAuthority | null,
): InvestigationLibraryState {
  if (
    sameInvestigationLibraryAuthority(stateAuthority, desiredAuthority)
    && state.principalId === (desiredAuthority?.principalId ?? null)
  ) return state;

  return Object.freeze({
    principalId: desiredAuthority?.principalId ?? null,
    status: InvestigationLibraryStatus.NOT_REQUESTED,
    summaries: Object.freeze([]),
    requestGeneration: 0,
  });
}

export function projectInvestigationLibraryPublicState(
  state: InvestigationLibraryState,
): InvestigationLibraryPublicState {
  try {
    const root = ownInvestigationLibraryStateValues(state);
    if (root === null) throw new Error();
    const status = root.status;
    if (!isInvestigationLibraryStatus(status)) throw new Error();
    const source: unknown = root.summaries;
    if (!Array.isArray(source)) throw new Error();
    if (Object.getPrototypeOf(source) !== Array.prototype) throw new Error();
    const sourceDescriptors = Object.getOwnPropertyDescriptors(source) as unknown as Record<PropertyKey, PropertyDescriptor>;
    const lengthDescriptor = sourceDescriptors["length"];
    const lengthValue = lengthDescriptor?.value;
    if (
      !Number.isSafeInteger(lengthValue)
      || (lengthValue as number) < 0
      || Reflect.ownKeys(sourceDescriptors).length !== (lengthValue as number) + 1
    ) throw new Error();
    const allowed = ["investigationId", "title", "objective", "lifecycle", "createdAt", "modifiedAt", "version"];
    const summaries: Array<Readonly<{ investigationId: string; title: string }>> = [];
    const investigationIds = new Set<string>();
    for (let index = 0; index < (lengthValue as number); index += 1) {
      const sourceDescriptor = sourceDescriptors[String(index)];
      if (sourceDescriptor === undefined || !("value" in sourceDescriptor)) throw new Error();
      const candidate = sourceDescriptor.value;
      if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) throw new Error();
      if (Object.getPrototypeOf(candidate) !== Object.prototype) throw new Error();
      if (Object.getOwnPropertySymbols(candidate).length !== 0) throw new Error();
      const descriptors = Object.getOwnPropertyDescriptors(candidate);
      if (Reflect.ownKeys(descriptors).length !== allowed.length) throw new Error();
      for (const key of allowed) {
        const descriptor = descriptors[key];
        if (descriptor === undefined || !("value" in descriptor)) throw new Error();
      }
      const investigationId = descriptors.investigationId.value;
      const title = descriptors.title.value;
      const objective = descriptors.objective.value;
      const lifecycle = descriptors.lifecycle.value;
      const createdAt = descriptors.createdAt.value;
      const modifiedAt = descriptors.modifiedAt.value;
      const version = descriptors.version.value;
      if (
        typeof investigationId !== "string" || investigationId.trim().length === 0
        || typeof title !== "string" || title.trim().length === 0
        || (objective !== null && typeof objective !== "string")
        || lifecycle !== "ACTIVE"
        || !isCanonicalInvestigationTimestamp(createdAt)
        || !isCanonicalInvestigationTimestamp(modifiedAt)
        || typeof version !== "number" || !Number.isSafeInteger(version) || version < 0
        || investigationIds.has(investigationId)
      ) throw new Error();
      investigationIds.add(investigationId);
      summaries.push(Object.freeze({ investigationId, title }));
    }
    if (
      (status === InvestigationLibraryStatus.READY && summaries.length === 0)
      || (status !== InvestigationLibraryStatus.READY
        && status !== InvestigationLibraryStatus.STALE
        && summaries.length !== 0)
    ) throw new Error();
    return Object.freeze({ status, summaries: Object.freeze(summaries) });
  } catch {
    // A malformed private snapshot is non-authoritative at the public boundary.
    return Object.freeze({ status: InvestigationLibraryStatus.NOT_REQUESTED, summaries: Object.freeze([]) });
  }
}

const INVESTIGATION_LIBRARY_STATE_REQUIRED_KEYS = Object.freeze([
  "principalId", "status", "summaries", "requestGeneration",
]);
const INVESTIGATION_LIBRARY_STATE_ALLOWED_KEYS = Object.freeze([
  ...INVESTIGATION_LIBRARY_STATE_REQUIRED_KEYS, "lastSuccessfulLoad", "error",
]);
const CANONICAL_INVESTIGATION_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function isCanonicalInvestigationTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !CANONICAL_INVESTIGATION_TIMESTAMP.test(value)) return false;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === value;
}

function ownInvestigationLibraryStateValues(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  try {
    if (Object.getPrototypeOf(value) !== Object.prototype) return null;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Reflect.ownKeys(descriptors);
    if (
      keys.some(key => typeof key !== "string" || !INVESTIGATION_LIBRARY_STATE_ALLOWED_KEYS.includes(key))
      || INVESTIGATION_LIBRARY_STATE_REQUIRED_KEYS.some(key => !keys.includes(key))
    ) return null;
    const result: Record<string, unknown> = Object.create(null);
    for (const key of keys) {
      if (typeof key !== "string") return null;
      const descriptor = descriptors[key];
      if (descriptor === undefined || !("value" in descriptor)) return null;
      result[key] = descriptor.value;
    }
    return result;
  } catch {
    return null;
  }
}

interface InvestigationLibraryAuthorityRuntime {
  setPrincipal(principalId: string | null): void;
  load(principalId: string): unknown;
}

export function createInvestigationLibraryAuthorityController(
  schedule: (task: () => void) => void = queueMicrotask,
) {
  let runtime: InvestigationLibraryAuthorityRuntime | null = null;
  let committedAuthority: InvestigationLibraryAuthority | null = null;
  let ticket = 0;

  const refresh = () => {
    schedule(() => {
      const authority = committedAuthority;
      const activeRuntime = runtime;
      if (activeRuntime !== null && authority !== null) void activeRuntime.load(authority.principalId);
    });
  };

  return Object.freeze({
    attach(nextRuntime: InvestigationLibraryAuthorityRuntime) {
      if (runtime === nextRuntime) return;
      const previousRuntime = runtime;
      const loadTicket = ++ticket;
      if (previousRuntime !== null) previousRuntime.setPrincipal(null);
      runtime = nextRuntime;
      const authority = committedAuthority;
      nextRuntime.setPrincipal(null);
      nextRuntime.setPrincipal(authority?.principalId ?? null);
      if (authority === null) return;
      schedule(() => {
        if (
          runtime === nextRuntime
          && ticket === loadTicket
          && sameInvestigationLibraryAuthority(committedAuthority, authority)
        ) void nextRuntime.load(authority.principalId);
      });
    },
    detach(expectedRuntime: InvestigationLibraryAuthorityRuntime) {
      if (runtime !== expectedRuntime) return;
      ticket += 1;
      expectedRuntime.setPrincipal(null);
      runtime = null;
    },
    commit(nextAuthority: InvestigationLibraryAuthority | null) {
      const previousAuthority = committedAuthority;
      committedAuthority = nextAuthority;
      const activeRuntime = runtime;
      const loadTicket = ++ticket;
      if (activeRuntime === null) return;
      if (!sameInvestigationLibraryAuthority(previousAuthority, nextAuthority)) {
        activeRuntime.setPrincipal(null);
      }
      activeRuntime.setPrincipal(nextAuthority?.principalId ?? null);
      if (nextAuthority === null) return;
      schedule(() => {
        if (
          runtime === activeRuntime
          && ticket === loadTicket
          && sameInvestigationLibraryAuthority(committedAuthority, nextAuthority)
        ) void activeRuntime.load(nextAuthority.principalId);
      });
    },
    getCommittedAuthority() {
      return committedAuthority;
    },
    refresh,
    retry: refresh,
  });
}

export function InvestigationLibraryRuntimeProvider({ children }: { readonly children: ReactNode }) {
  const identityState = useOperatorIdentity();
  const desiredAuthority = useMemo(
    () => resolveInvestigationLibraryAuthority(identityState),
    [identityState],
  );
  const [state, setState] = useState<InvestigationLibraryState>(
    createInitialInvestigationLibraryState,
  );
  const runtimeRef = useRef<InvestigationLibraryRuntime | null>(null);
  const authorityControllerRef = useRef<ReturnType<
    typeof createInvestigationLibraryAuthorityController
  > | null>(null);
  if (authorityControllerRef.current === null) {
    authorityControllerRef.current = createInvestigationLibraryAuthorityController();
  }
  const authorityController = authorityControllerRef.current;

  useLayoutEffect(() => {
    const runtime = new InvestigationLibraryRuntime(investigationLibraryApi);
    runtimeRef.current = runtime;
    const unsubscribe = runtime.subscribe(setState);
    authorityController.attach(runtime);
    setState(runtime.getState());

    return () => {
      authorityController.detach(runtime);
      if (runtimeRef.current === runtime) runtimeRef.current = null;
      unsubscribe();
      runtime.dispose();
    };
  }, [authorityController]);

  useLayoutEffect(() => {
    authorityController.commit(desiredAuthority);
  }, [authorityController, desiredAuthority]);

  const loadCurrentPrincipal = useCallback(() => {
    authorityController.refresh();
  }, [authorityController]);

  const exposedState = reconcileInvestigationLibraryState(
    state,
    authorityController.getCommittedAuthority(),
    desiredAuthority,
  );

  const publicState = useMemo(
    () => projectInvestigationLibraryPublicState(exposedState),
    [exposedState],
  );

  const value = useMemo<InvestigationLibraryRuntimeContextValue>(() => Object.freeze({
    state: publicState,
    refresh: loadCurrentPrincipal,
    retry: loadCurrentPrincipal,
  }), [publicState, loadCurrentPrincipal]);

  return (
    <InvestigationLibraryRuntimeContext.Provider value={value}>
      {children}
    </InvestigationLibraryRuntimeContext.Provider>
  );
}

export function useInvestigationLibraryRuntime(): InvestigationLibraryRuntimeContextValue {
  const context = useContext(InvestigationLibraryRuntimeContext);
  if (context === undefined) {
    throw new Error(
      "useInvestigationLibraryRuntime must be used inside InvestigationLibraryRuntimeProvider",
    );
  }
  return context;
}
