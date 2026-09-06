import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import {
  InvestigationLibraryRuntime,
  createInitialInvestigationLibraryState,
} from "../../src/investigation/library/InvestigationLibraryRuntime.ts";
import {
  InvestigationLibraryError,
  InvestigationLibraryErrorCode,
  InvestigationLifecycle,
  type InvestigationListResult,
  type InvestigationSummary,
} from "../../src/investigation/library/InvestigationLibraryTypes.ts";
import {
  normalizeInvestigationLibraryAuthority,
  normalizeInvestigationLibraryPrincipal,
  resolveInvestigationLibraryPrincipal,
  resolveOverviewFrontDoorRuntimeProjection,
} from "../../src/investigation/frontDoor/OverviewFrontDoorRuntimeProjection.ts";
import {
  InvestigationLibraryStatus,
  OverviewFrontDoorManifestation,
} from "../../src/investigation/frontDoor/FrontDoorProjectionTypes.ts";
import type { OperatorIdentityState } from "../../src/identity/runtime/OperatorIdentityRuntimeTypes.ts";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`VERIFY FAILED: ${message}`);
}

function equal<T>(actual: T, expected: T, message: string): void {
  assert(actual === expected, `${message} Expected ${String(expected)}, received ${String(actual)}.`);
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function summary(id: string): InvestigationSummary {
  return Object.freeze({
    investigationId: id,
    title: id,
    objective: null,
    lifecycle: InvestigationLifecycle.ACTIVE,
    createdAt: "2026-09-05T00:00:00.000Z",
    modifiedAt: "2026-09-05T00:00:00.000Z",
    version: 1,
  });
}

function identity(
  status: "INITIALIZING" | "READY",
  kind?: "GUEST" | "ACCOUNT",
  operatorId = "operator:exact",
  revision = 1,
  establishedAt = "2026-09-05T00:00:00.000Z",
): OperatorIdentityState {
  return {
    status,
    identity: kind === undefined ? null : { kind, operatorId, establishedAt },
    persistence: kind === "GUEST" ? "SESSION" : kind === "ACCOUNT" ? "PERSISTENT" : "NONE",
    revision,
  };
}

function facts(identityState: OperatorIdentityState, status: InvestigationLibraryStatus) {
  return {
    identity: identityState,
    guestWorkspaceRestored: false,
    activeInvestigationId: null,
    library: Object.freeze({
      status,
      summaries: status === InvestigationLibraryStatus.READY
        ? Object.freeze([Object.freeze({ investigationId: "owned", title: "owned" })])
        : Object.freeze([]),
    }),
  };
}

let passCount = 0;
function pass(message: string): void {
  passCount += 1;
  console.log(`PASS ${passCount} — ${message}`);
}

let requests = 0;
const constructionRuntime = new InvestigationLibraryRuntime(Object.freeze({
  listInvestigations: async () => { requests += 1; return Object.freeze({ items: Object.freeze([]) }); },
  getInvestigation: async () => summary("unused"),
}));
equal(requests, 0, "Runtime construction issued a request.");
pass("construction causes no request");

equal(resolveInvestigationLibraryPrincipal(identity("INITIALIZING")), null, "Unsettled identity produced a principal.");
equal(resolveInvestigationLibraryPrincipal(identity("READY")), null, "READY/NONE produced a principal.");
pass("unsettled identity and settled NONE cannot load");

equal(resolveInvestigationLibraryPrincipal(identity("READY", "GUEST", "guest:exact")), "guest:exact", "Guest principal changed.");
equal(resolveInvestigationLibraryPrincipal(identity("READY", "ACCOUNT", "account:local")), "account:local", "Account-like principal changed.");
pass("Guest and represented Account use exact local/development operatorId");

for (const invalidId of ["", "   ", "\t\n", Object.freeze({ hostile: true }), 17, null]) {
  const invalidIdentity = identity("READY", "GUEST") as unknown as {
    identity: { kind: "GUEST"; operatorId: unknown; establishedAt: string };
  };
  invalidIdentity.identity.operatorId = invalidId;
  const invalidState = invalidIdentity as unknown as OperatorIdentityState;
  equal(normalizeInvestigationLibraryPrincipal(invalidId), null, "Shared normalization accepted invalid identity.");
  equal(resolveInvestigationLibraryPrincipal(invalidState), null, "Principal seam accepted invalid identity.");
  equal(
    resolveOverviewFrontDoorRuntimeProjection(facts(invalidState, InvestigationLibraryStatus.NOT_REQUESTED)),
    null,
    "OVERVIEW projection accepted invalid identity.",
  );
}
const paddedIdentity = identity("READY", "ACCOUNT", "  padded:operator  ");
equal(normalizeInvestigationLibraryPrincipal("  padded:operator  "), "padded:operator", "Shared normalization did not trim valid identity.");
equal(resolveInvestigationLibraryPrincipal(paddedIdentity), "padded:operator", "Principal seam normalized inconsistently.");
assert(resolveOverviewFrontDoorRuntimeProjection(facts(paddedIdentity, InvestigationLibraryStatus.EMPTY)) !== null, "OVERVIEW rejected normalized valid identity.");
pass("shared normalization fails closed through the actual OVERVIEW projection seam");

for (const [kind, persistence, accepted] of [
  ["GUEST", "SESSION", true],
  ["ACCOUNT", "PERSISTENT", true],
  ["GUEST", "PERSISTENT", false],
  ["ACCOUNT", "SESSION", false],
  ["GUEST", "ARBITRARY", false],
] as const) {
  const candidate = { ...identity("READY", kind), persistence } as unknown as OperatorIdentityState;
  equal(normalizeInvestigationLibraryAuthority(candidate) !== null, accepted, `${kind}/${persistence} persistence result differed.`);
}
let persistenceGetterCalls = 0;
const persistenceGetter = Object.defineProperty(identity("READY", "GUEST"), "persistence", {
  get: () => { persistenceGetterCalls += 1; return "SESSION"; },
});
equal(normalizeInvestigationLibraryAuthority(persistenceGetter), null, "Accessor persistence produced authority.");
equal(persistenceGetterCalls, 0, "Persistence getter executed.");
const inheritedPersistence = { status: "READY", identity: identity("READY", "GUEST").identity, revision: 1 };
Object.setPrototypeOf(inheritedPersistence, { persistence: "SESSION" });
equal(normalizeInvestigationLibraryAuthority(inheritedPersistence), null, "Inherited persistence produced authority.");
for (const trapped of [
  new Proxy(identity("READY", "GUEST"), { getPrototypeOf: () => { throw new Error("persistence trap"); } }),
  new Proxy(identity("READY", "GUEST"), { ownKeys: () => { throw new Error("persistence trap"); } }),
  new Proxy(identity("READY", "GUEST"), { getOwnPropertyDescriptor: () => { throw new Error("persistence trap"); } }),
]) equal(normalizeInvestigationLibraryAuthority(trapped), null, "Persistence proxy trap produced authority.");
pass("identity authority enforces canonical kind/persistence pairs without executing accessors or traps");

let subscribed = false;
const orderingRuntime = new InvestigationLibraryRuntime(Object.freeze({
  listInvestigations: async () => {
    assert(subscribed, "Load began before subscription.");
    return Object.freeze({ items: Object.freeze([]) });
  },
  getInvestigation: async () => summary("unused"),
}));
orderingRuntime.subscribe(() => undefined);
subscribed = true;
await orderingRuntime.load("ordered");
pass("subscription precedes load");

const transitions: string[] = [];
const transitionRuntime = new InvestigationLibraryRuntime(Object.freeze({
  listInvestigations: async () => Object.freeze({ items: Object.freeze([]) }),
  getInvestigation: async () => summary("unused"),
}));
transitionRuntime.subscribe(state => transitions.push(`${state.principalId}:${state.status}`));
transitionRuntime.setPrincipal("A");
transitionRuntime.setPrincipal("B");
equal(transitionRuntime.getState().principalId, "B", "Principal B was not published immediately.");
equal(transitionRuntime.getState().status, InvestigationLibraryStatus.NOT_REQUESTED, "A data survived transition to B.");
transitionRuntime.setPrincipal(null);
equal(transitionRuntime.getState().principalId, null, "Principal did not clear immediately.");
assert(transitions.includes("B:NOT_REQUESTED") && transitions.includes("null:NOT_REQUESTED"), "Synchronous clear publications were absent.");
pass("A to B and A to null clear immediately");

const lateA = deferred<InvestigationListResult>();
const b = deferred<InvestigationListResult>();
const isolationRuntime = new InvestigationLibraryRuntime(Object.freeze({
  listInvestigations: principal => principal === "A" ? lateA.promise : b.promise,
  getInvestigation: async () => summary("unused"),
}));
const loadA = isolationRuntime.load("A");
const loadB = isolationRuntime.load("B");
lateA.resolve(Object.freeze({ items: Object.freeze([summary("late-A")]) }));
await loadA;
equal(isolationRuntime.getState().principalId, "B", "Late A changed B authority.");
b.resolve(Object.freeze({ items: Object.freeze([summary("B")]) }));
await loadB;
equal(isolationRuntime.getState().summaries[0]?.investigationId, "B", "B result was not retained.");
pass("late A cannot publish into B");

const first = deferred<InvestigationListResult>();
const second = deferred<InvestigationListResult>();
let sameCalls = 0;
const overlapRuntime = new InvestigationLibraryRuntime(Object.freeze({
  listInvestigations: () => (++sameCalls === 1 ? first.promise : second.promise),
  getInvestigation: async () => summary("unused"),
}));
const firstLoad = overlapRuntime.load("same");
const secondLoad = overlapRuntime.load("same");
second.resolve(Object.freeze({ items: Object.freeze([summary("newest")]) }));
await secondLoad;
first.resolve(Object.freeze({ items: Object.freeze([summary("oldest")]) }));
await firstLoad;
equal(overlapRuntime.getState().summaries[0]?.investigationId, "newest", "Older generation won.");
pass("overlapping same-principal loads accept only newest generation");

const failureRuntime = new InvestigationLibraryRuntime(Object.freeze({
  listInvestigations: async () => { throw new InvestigationLibraryError(InvestigationLibraryErrorCode.TRANSPORT_FAILURE, "Frontend-owned failure."); },
  getInvestigation: async () => summary("unused"),
}));
await failureRuntime.load("failure");
equal(failureRuntime.getState().status, InvestigationLibraryStatus.ERROR, "Initial failure did not reach ERROR.");
assert(failureRuntime.getState().error instanceof InvestigationLibraryError, "Error was not typed.");
pass("initial failure exposes only typed ERROR state");

let refreshCalls = 0;
const refreshFailure = deferred<InvestigationListResult>();
const refreshRuntime = new InvestigationLibraryRuntime(Object.freeze({
  listInvestigations: async () => {
    refreshCalls += 1;
    if (refreshCalls === 1) return Object.freeze({ items: Object.freeze([summary("snapshot")]) });
    return refreshFailure.promise;
  },
  getInvestigation: async () => summary("unused"),
}));
await refreshRuntime.load("refresh");
const refresh = refreshRuntime.load("refresh");
equal(refreshRuntime.getState().status, InvestigationLibraryStatus.STALE, "Refresh did not enter STALE.");
equal(refreshRuntime.getState().summaries[0]?.investigationId, "snapshot", "STALE discarded prior snapshot.");
refreshFailure.reject(new InvestigationLibraryError(InvestigationLibraryErrorCode.TRANSPORT_FAILURE, "Frontend-owned failure."));
await refresh;
equal(refreshRuntime.getState().status, InvestigationLibraryStatus.STALE, "Refresh failure discarded STALE state.");
equal(refreshRuntime.getState().summaries[0]?.investigationId, "snapshot", "Refresh failure discarded snapshot.");

const emptyRefreshFailure = deferred<InvestigationListResult>();
let emptyRefreshCalls = 0;
const emptyRefreshRuntime = new InvestigationLibraryRuntime(Object.freeze({
  listInvestigations: async () => {
    emptyRefreshCalls += 1;
    if (emptyRefreshCalls === 1) return Object.freeze({ items: Object.freeze([]) });
    return emptyRefreshFailure.promise;
  },
  getInvestigation: async () => summary("unused"),
}));
await emptyRefreshRuntime.load("empty-refresh");
const emptyRefresh = emptyRefreshRuntime.load("empty-refresh");
equal(emptyRefreshRuntime.getState().status, InvestigationLibraryStatus.STALE, "EMPTY refresh did not enter STALE.");
equal(emptyRefreshRuntime.getState().summaries.length, 0, "EMPTY refresh manufactured a snapshot.");
emptyRefreshFailure.reject(new InvestigationLibraryError(InvestigationLibraryErrorCode.TRANSPORT_FAILURE, "Frontend-owned failure."));
await emptyRefresh;
equal(emptyRefreshRuntime.getState().status, InvestigationLibraryStatus.STALE, "EMPTY refresh failure discarded STALE state.");
pass("refresh from READY or EMPTY retains same-principal snapshot through STALE failure");

let currentPrincipal = "retry:A";
const retried: string[] = [];
const retryRuntime = new InvestigationLibraryRuntime(Object.freeze({
  listInvestigations: async principal => { retried.push(principal); return Object.freeze({ items: Object.freeze([]) }); },
  getInvestigation: async () => summary("unused"),
}));
const retry = () => retryRuntime.load(currentPrincipal);
await retry();
currentPrincipal = "retry:B";
await retry();
equal(retried.join(","), "retry:A,retry:B", "Retry retained an obsolete principal.");
pass("retry re-reads current principal authority");

const cleanupDeferred = deferred<InvestigationListResult>();
let cleanupPublications = 0;
const cleanupRuntime = new InvestigationLibraryRuntime(Object.freeze({
  listInvestigations: () => cleanupDeferred.promise,
  getInvestigation: async () => summary("unused"),
}));
const unsubscribe = cleanupRuntime.subscribe(() => { cleanupPublications += 1; });
const cleanupLoad = cleanupRuntime.load("cleanup");
unsubscribe();
const beforeDispose = cleanupRuntime.getState();
cleanupRuntime.dispose();
cleanupDeferred.resolve(Object.freeze({ items: Object.freeze([summary("late")]) }));
await cleanupLoad;
assert(cleanupRuntime.getState() === beforeDispose, "Disposed runtime accepted a late result.");
equal(cleanupPublications, 2, "Unexpected publication after unsubscribe/dispose.");
pass("cleanup unsubscribes, disposes, and rejects late publication");

const rehearsalDeferred = deferred<InvestigationListResult>();
const rehearsal = new InvestigationLibraryRuntime(Object.freeze({
  listInvestigations: () => rehearsalDeferred.promise,
  getInvestigation: async () => summary("unused"),
}));
const rehearsalLoad = rehearsal.load("strict");
rehearsal.dispose();
const committed = new InvestigationLibraryRuntime(Object.freeze({
  listInvestigations: async () => Object.freeze({ items: Object.freeze([summary("committed")]) }),
  getInvestigation: async () => summary("unused"),
}));
await committed.load("strict");
rehearsalDeferred.resolve(Object.freeze({ items: Object.freeze([summary("rehearsal")]) }));
await rehearsalLoad;
equal(committed.getState().summaries[0]?.investigationId, "committed", "Rehearsal contaminated committed lifecycle.");
pass("StrictMode rehearsal cannot publish into committed lifecycle");

for (const status of Object.values(InvestigationLibraryStatus)) {
  const projected = resolveOverviewFrontDoorRuntimeProjection(facts(identity("READY", "ACCOUNT"), status));
  assert(projected !== null, `${status} did not project.`);
  equal(projected.library.status, status, `${status} changed in adapter.`);
}
pass("all six library statuses reach front-door projection unchanged");

for (const status of Object.values(InvestigationLibraryStatus)) {
  const projected = resolveOverviewFrontDoorRuntimeProjection(facts(identity("READY", "ACCOUNT"), status));
  assert(projected !== null, "Account projection was absent.");
  equal(
    projected.manifestation === OverviewFrontDoorManifestation.NEW_ACCOUNT,
    status === InvestigationLibraryStatus.EMPTY,
    `${status} Account classification was incorrect.`,
  );
}
pass("EMPTY alone permits New Account classification");

for (const status of Object.values(InvestigationLibraryStatus)) {
  const projected = resolveOverviewFrontDoorRuntimeProjection(facts(identity("READY", "GUEST"), status));
  assert(projected !== null, "Guest projection was absent.");
  equal(projected.manifestation, OverviewFrontDoorManifestation.FRESH_GUEST, "Library semantics classified Guest.");
}
const returningGuestFacts = facts(identity("READY", "GUEST"), InvestigationLibraryStatus.ERROR);
const returningGuest = resolveOverviewFrontDoorRuntimeProjection({
  ...returningGuestFacts,
  guestWorkspaceRestored: true,
  activeInvestigationId: "restored",
});
equal(returningGuest?.manifestation, OverviewFrontDoorManifestation.RETURNING_GUEST, "Restored Guest was not returning.");
pass("Guest classification is independent of Account library state");

const root = fileURLToPath(new URL("../../", import.meta.url));
const contextSource = readFileSync(`${root}src/investigation/library/InvestigationLibraryRuntimeContext.tsx`, "utf8");
const adapterSource = readFileSync(`${root}src/investigation/frontDoor/OverviewFrontDoorRuntimeProjection.ts`, "utf8");
const overviewSource = readFileSync(`${root}src/workspace/surfaces/OverviewWorkspace.tsx`, "utf8");
const appSource = readFileSync(`${root}src/App.tsx`, "utf8");

function functionCalls(source: string, fileName: string, functionName: string): readonly string[] {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
  const declaration = sourceFile.statements.find(statement =>
    ts.isFunctionDeclaration(statement) && statement.name?.text === functionName
  );
  assert(declaration !== undefined, `${functionName} was not found exactly as an exported function declaration.`);
  const calls: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) calls.push(node.expression.getText(sourceFile));
    ts.forEachChild(node, visit);
  };
  visit(declaration);
  return calls;
}

assert(
  functionCalls(contextSource, "context.tsx", "resolveInvestigationLibraryAuthority")
    .includes("normalizeInvestigationLibraryAuthority"),
  "Provider authority resolver does not call the shared normalization seam.",
);
assert(
  functionCalls(adapterSource, "adapter.ts", "resolveInvestigationLibraryPrincipal")
    .includes("normalizeInvestigationLibraryAuthority"),
  "OVERVIEW principal resolver does not call the shared normalization seam.",
);
const providerCalls = functionCalls(
  contextSource,
  "context.tsx",
  "InvestigationLibraryRuntimeProvider",
);
for (const requiredCall of [
  "resolveInvestigationLibraryAuthority",
  "reconcileInvestigationLibraryState",
  "projectInvestigationLibraryPublicState",
  "authorityController.attach",
  "authorityController.commit",
  "authorityController.detach",
]) assert(providerCalls.includes(requiredCall), `Provider wiring omits exact seam ${requiredCall}.`);
pass("provider and OVERVIEW wiring structurally use the exact exported seams");

function loadProviderAuthoritySeams() {
  const sourceFile = ts.createSourceFile("context.tsx", contextSource, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
  const names = new Set([
    "resolveInvestigationLibraryAuthority",
    "sameInvestigationLibraryAuthority",
    "reconcileInvestigationLibraryState",
    "projectInvestigationLibraryPublicState",
    "createInvestigationLibraryAuthorityController",
    "isInvestigationLibraryStatus",
    "isCanonicalInvestigationTimestamp",
    "ownInvestigationLibraryStateValues",
  ]);
  const declarations = sourceFile.statements.filter(statement =>
    ts.isFunctionDeclaration(statement) && statement.name !== undefined && names.has(statement.name.text)
  );
  equal(declarations.length, names.size, "Provider authority seams and validators were not found exactly once.");
  const constantNames = new Set([
    "INVESTIGATION_LIBRARY_STATE_REQUIRED_KEYS",
    "INVESTIGATION_LIBRARY_STATE_ALLOWED_KEYS",
    "CANONICAL_INVESTIGATION_TIMESTAMP",
  ]);
  const constants = sourceFile.statements.filter(statement =>
    ts.isVariableStatement(statement)
    && statement.declarationList.declarations.some(declaration =>
      ts.isIdentifier(declaration.name) && constantNames.has(declaration.name.text)
    )
  );
  equal(constants.length, constantNames.size, "Provider validator constants were not found exactly once.");
  const executableSource = [...constants, ...declarations]
    .map(declaration => declaration.getText(sourceFile).replace(/^export\s+/, ""))
    .join("\n");
  const transpiled = ts.transpileModule(executableSource, {
    compilerOptions: { module: ts.ModuleKind.None, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function(
    "InvestigationLibraryStatus",
    "normalizeInvestigationLibraryAuthority",
    `${transpiled}; return { resolveInvestigationLibraryAuthority, sameInvestigationLibraryAuthority, reconcileInvestigationLibraryState, projectInvestigationLibraryPublicState, createInvestigationLibraryAuthorityController };`,
  )(InvestigationLibraryStatus, normalizeInvestigationLibraryAuthority) as {
    readonly resolveInvestigationLibraryAuthority: (state: OperatorIdentityState) => Authority | null;
    readonly reconcileInvestigationLibraryState: (
      state: ReturnType<typeof createInitialInvestigationLibraryState>,
      stateAuthority: Authority | null,
      desiredAuthority: Authority | null,
    ) => ReturnType<typeof createInitialInvestigationLibraryState>;
  readonly projectInvestigationLibraryPublicState: (
      state: ReturnType<typeof createInitialInvestigationLibraryState>,
    ) => Readonly<{ status: InvestigationLibraryStatus; summaries: readonly Pick<InvestigationSummary, "investigationId" | "title">[] }>;
    readonly createInvestigationLibraryAuthorityController: (
      schedule: (task: () => void) => void,
    ) => AuthorityController;
  };
}

type Authority = Readonly<{
  kind: "GUEST" | "ACCOUNT";
  principalId: string;
  establishedAt: string;
  revision: number;
}>;

type AuthorityRuntime = {
  setPrincipal(principal: string | null): void;
  load(principal: string): unknown;
};

type AuthorityController = {
  attach(runtime: AuthorityRuntime): void;
  detach(runtime: AuthorityRuntime): void;
  commit(authority: Authority | null): void;
  getCommittedAuthority(): Authority | null;
  refresh(): void;
  retry(): void;
};

const providerAuthority = loadProviderAuthoritySeams();
const authority = (
  kind: "GUEST" | "ACCOUNT",
  principalId: string,
  revision = 1,
  establishedAt = "2026-09-05T00:00:00Z",
): Authority => Object.freeze({ kind, principalId, revision, establishedAt });
const stateFor = (
  principalId: string | null,
  status: InvestigationLibraryStatus,
  options: { readonly withSummary?: boolean; readonly withError?: boolean } = {},
) => Object.freeze({
  principalId,
  status,
  summaries: Object.freeze(options.withSummary ? [summary(`${principalId}:owned`)] : []),
  requestGeneration: 41,
  lastSuccessfulLoad: Object.freeze({ loadedAt: "2026-09-05T00:00:00Z" }),
  ...(options.withError ? {
    error: new InvestigationLibraryError(
      InvestigationLibraryErrorCode.TRANSPORT_FAILURE,
      `${principalId}:private-error`,
    ),
  } : {}),
});

const readyA = stateFor("A", InvestigationLibraryStatus.READY, { withSummary: true });
const authorityA = authority("ACCOUNT", "A");
const authorityB = authority("ACCOUNT", "B");
const exposedB = providerAuthority.reconcileInvestigationLibraryState(readyA, authorityA, authorityB);
equal(exposedB.principalId, "B", "A-to-B reconciliation used the wrong authority.");
equal(exposedB.status, InvestigationLibraryStatus.NOT_REQUESTED, "A-to-B reconciliation was not safe.");
equal(exposedB.summaries.length, 0, "A summary crossed into B's render.");
const exposedNull = providerAuthority.reconcileInvestigationLibraryState(readyA, authorityA, null);
equal(exposedNull.principalId, null, "A-to-null reconciliation retained a principal.");
equal(exposedNull.summaries.length, 0, "A summary crossed into a null-identity render.");
pass("provider synchronously isolates READY A from B and null renders");

for (const status of [InvestigationLibraryStatus.ERROR, InvestigationLibraryStatus.STALE]) {
  const privateA = stateFor("A", status, { withSummary: true, withError: true });
  const safeB = providerAuthority.reconcileInvestigationLibraryState(privateA, authorityA, authorityB);
  equal(safeB.summaries.length, 0, `${status} A summaries crossed into B.`);
  assert(safeB.error === undefined, `${status} A error crossed into B.`);
  assert(safeB.lastSuccessfulLoad === undefined, `${status} A metadata crossed into B.`);
}
pass("provider mismatch exposes no ERROR or STALE principal data");

for (const status of Object.values(InvestigationLibraryStatus)) {
  const owned = stateFor("same", status, { withSummary: true, withError: true });
  assert(providerAuthority.reconcileInvestigationLibraryState(
    owned,
    authority("ACCOUNT", "same"),
    authority("ACCOUNT", "same"),
  ) === owned, `${status} was not preserved by matching authority.`);
}
pass("provider preserves all six matching-principal runtime statuses by identity");

const secondExposedB = providerAuthority.reconcileInvestigationLibraryState(readyA, authorityA, authorityB);
assert(exposedB !== readyA && exposedB !== secondExposedB, "Mismatch state was aliased to private or prior safe state.");
assert(Object.isFrozen(exposedB) && Object.isFrozen(exposedB.summaries), "Mismatch state was not recursively immutable.");
assert(!JSON.stringify(exposedB).includes("A"), "Mismatch state serialized prior authority data.");
pass("provider mismatch reconciliation is recursively immutable, fresh, and non-aliased");

let authorityRequests = 0;
let authorityMutations = 0;
const observedReadyA = new Proxy(readyA, {
  set: () => { authorityMutations += 1; return false; },
});
providerAuthority.reconcileInvestigationLibraryState(observedReadyA, authorityA, authorityB);
equal(authorityRequests, 0, "Render reconciliation issued a request.");
equal(authorityMutations, 0, "Render reconciliation mutated runtime state.");
pass("provider render reconciliation performs no request or mutation");

const actionLoads: string[] = [];
const actionPrincipals: Array<string | null> = [];
const queuedActions: Array<() => void> = [];
const flush = (queue: Array<() => void>) => { while (queue.length > 0) queue.shift()!(); };
const actionRuntime = {
  setPrincipal: (principal: string | null) => { actionPrincipals.push(principal); },
  load: (principal: string) => { actionLoads.push(principal); },
};
const controller = providerAuthority.createInvestigationLibraryAuthorityController(task => queuedActions.push(task));
controller.attach(actionRuntime);
controller.commit(authorityA);
const retainedARefresh = controller.refresh;
controller.commit(authorityB);
retainedARefresh();
flush(queuedActions);
equal(actionLoads.join(","), "B,B", "Retained A action did not load committed B authority.");
controller.commit(null);
retainedARefresh();
flush(queuedActions);
equal(actionLoads.join(","), "B,B", "Retained action loaded after authority became absent.");
controller.commit(authority("ACCOUNT", "A", 2));
const rapidA = controller.refresh;
controller.commit(authority("ACCOUNT", "B", 2));
const rapidB = controller.retry;
controller.commit(authority("ACCOUNT", "C", 2));
rapidA();
rapidB();
flush(queuedActions);
equal(actionLoads.join(","), "B,B,C,C,C", "Rapid retained actions loaded obsolete A or B authority.");
pass("provider retained refresh/retry actions consult only committed authority");

const commitOrderQueue: Array<() => void> = [];
const commitOrderLoads: string[] = [];
const commitOrderController = providerAuthority.createInvestigationLibraryAuthorityController(
  task => commitOrderQueue.push(task),
);
commitOrderController.attach({
  setPrincipal: () => undefined,
  load: principal => { commitOrderLoads.push(principal); },
});
commitOrderController.commit(authorityA);
flush(commitOrderQueue);
equal(commitOrderLoads.join(","), "A", "Initial committed authority did not load.");
const descendantRetainedAction = commitOrderController.refresh;
descendantRetainedAction();
equal(commitOrderLoads.join(","), "A", "Descendant layout action dispatched before provider commit.");
commitOrderController.commit(authorityB);
flush(commitOrderQueue);
equal(commitOrderLoads.join(","), "A,B,B", "Descendant-before-provider action did not reconcile to committed B.");
// A speculative C render queues no controller mutation. If that render is rejected,
// the retained action must continue to resolve against the actually committed B.
descendantRetainedAction();
flush(commitOrderQueue);
equal(commitOrderLoads.join(","), "A,B,B,B", "Rejected speculative render changed observable authority.");
commitOrderController.commit(authority("ACCOUNT", "C", 3, "2026-09-05T00:00:01.000Z"));
commitOrderController.retry();
flush(commitOrderQueue);
equal(commitOrderLoads.join(","), "A,B,B,B,C,C", "Retry after authority change used stale authority.");
pass("descendant-before-provider, rejected render, and retry ordering use only committed authority");

const beforeAttachQueue: Array<() => void> = [];
const beforeAttachLoads: string[] = [];
const beforeAttachPrincipals: Array<string | null> = [];
const beforeAttachRuntime = {
  setPrincipal: (principal: string | null) => { beforeAttachPrincipals.push(principal); },
  load: (principal: string) => { beforeAttachLoads.push(principal); },
};
const beforeAttach = providerAuthority.createInvestigationLibraryAuthorityController(task => beforeAttachQueue.push(task));
beforeAttach.commit(authorityA);
beforeAttach.attach(beforeAttachRuntime);
equal(beforeAttachPrincipals.join(","), ",A", "Commit-before-attach did not clear and bind A.");
flush(beforeAttachQueue);
equal(beforeAttachLoads.join(","), "A", "Commit-before-attach did not schedule A.");

const nullQueue: Array<() => void> = [];
const nullLoads: string[] = [];
const nullController = providerAuthority.createInvestigationLibraryAuthorityController(task => nullQueue.push(task));
nullController.commit(null);
nullController.attach({ setPrincipal: () => undefined, load: principal => { nullLoads.push(principal); } });
flush(nullQueue);
equal(nullLoads.length, 0, "Commit-null-before-attach issued a runtime request.");

const latestQueue: Array<() => void> = [];
const latestLoads: string[] = [];
const latestController = providerAuthority.createInvestigationLibraryAuthorityController(task => latestQueue.push(task));
latestController.commit(authorityA);
latestController.commit(authorityB);
latestController.attach({ setPrincipal: () => undefined, load: principal => { latestLoads.push(principal); } });
flush(latestQueue);
equal(latestLoads.join(","), "B", "Commit A then B before attach loaded obsolete A.");
pass("commit-before-attach binds and requests only current valid authority");

const remountQueue: Array<() => void> = [];
const oldLoads: string[] = [];
const newLoads: string[] = [];
const oldRuntime = { setPrincipal: () => undefined, load: (principal: string) => { oldLoads.push(principal); } };
const newRuntime = { setPrincipal: () => undefined, load: (principal: string) => { newLoads.push(principal); } };
const remountController = providerAuthority.createInvestigationLibraryAuthorityController(task => remountQueue.push(task));
remountController.attach(oldRuntime);
remountController.commit(authorityA);
remountController.detach(oldRuntime);
remountController.commit(authorityB);
remountController.attach(newRuntime);
remountController.attach(newRuntime);
flush(remountQueue);
equal(oldLoads.length, 0, "Detached runtime executed queued A work.");
equal(newLoads.join(","), "B", "Queued A work contaminated the reattached B runtime or attach duplicated B.");
remountController.detach(newRuntime);
remountController.detach(newRuntime);
flush(remountQueue);
equal(newLoads.join(","), "B", "Repeated detach resurrected obsolete work.");
pass("detach and repeated remount cancel runtime-scoped queued work without duplication");

const guestSame = authority("GUEST", "same", 1, "epoch-1");
const accountSame = authority("ACCOUNT", "same", 2, "epoch-2");
controller.commit(guestSame);
controller.commit(accountSame);
assert(actionPrincipals.slice(-4).join(",") === ",same,,same", "Same-text lifetime transition did not clear then rebind runtime.");
const privateSame = stateFor("same", InvestigationLibraryStatus.READY, { withSummary: true, withError: true });
for (const status of [InvestigationLibraryStatus.READY, InvestigationLibraryStatus.ERROR, InvestigationLibraryStatus.STALE]) {
  const guestState = stateFor("same", status, { withSummary: true, withError: true });
  const safeKind = providerAuthority.reconcileInvestigationLibraryState(guestState, guestSame, accountSame);
  equal(safeKind.status, InvestigationLibraryStatus.NOT_REQUESTED, `${status} Guest state crossed to Account with same ID.`);
  equal(safeKind.summaries.length, 0, `${status} Guest summaries crossed to Account with same ID.`);
  assert(safeKind.error === undefined && safeKind.lastSuccessfulLoad === undefined && safeKind.requestGeneration === 0, `${status} same-ID transition retained private metadata.`);
}
const epochTwo = authority("ACCOUNT", "same", 2, "epoch-1");
const safeEpoch = providerAuthority.reconcileInvestigationLibraryState(privateSame, authority("ACCOUNT", "same", 1, "epoch-1"), epochTwo);
equal(safeEpoch.status, InvestigationLibraryStatus.NOT_REQUESTED, "Earlier epoch state crossed revision boundary.");
pass("complete authority identity isolates same-text kind and epoch transitions");

const diagnosticState = Object.freeze({
  ...stateFor("safe", InvestigationLibraryStatus.ERROR, { withSummary: true }),
  error: new InvestigationLibraryError(
    InvestigationLibraryErrorCode.TRANSPORT_FAILURE,
    "frontend failure",
    { status: 503, requestId: "private-request", backendCode: "PRIVATE_BACKEND" },
  ),
  requestId: "private-request",
  backendCode: "PRIVATE_BACKEND",
  cause: new Error("private-cause"),
  rawPayload: Object.freeze({ secret: true }),
});
const publicState = providerAuthority.projectInvestigationLibraryPublicState(
  diagnosticState as unknown as ReturnType<typeof createInitialInvestigationLibraryState>,
);
equal(publicState.status, InvestigationLibraryStatus.NOT_REQUESTED, "Extra private root fields did not fail closed.");
equal(publicState.summaries.length, 0, "Rejected private root retained summaries.");
for (const forbidden of ["principalId", "requestGeneration", "lastSuccessfulLoad", "error", "statusCode", "requestId", "backendCode", "cause", "rawResponse", "rawPayload", "exception", "diagnosticMetadata"]) {
  assert(!Object.prototype.hasOwnProperty.call(publicState, forbidden), `Public context state exposed ${forbidden}.`);
}
assert(Object.isFrozen(publicState) && Object.isFrozen(publicState.summaries), "Public context projection is not immutable.");
equal(Object.keys(publicState).sort().join(","), "status,summaries", "Public context projection exposed an unexpected alias.");
pass("public context state rejects extra root fields and exposes no diagnostic metadata");

let rootGetterCalls = 0;
const validReadyRoot = stateFor("safe", InvestigationLibraryStatus.READY, { withSummary: true });
const rootAttacks: unknown[] = [
  Object.create(validReadyRoot),
  Object.defineProperty({ ...validReadyRoot }, "status", { get: () => { rootGetterCalls += 1; return InvestigationLibraryStatus.READY; } }),
  Object.defineProperty({ ...validReadyRoot }, "summaries", { get: () => { rootGetterCalls += 1; return validReadyRoot.summaries; } }),
  { status: InvestigationLibraryStatus.READY, summaries: validReadyRoot.summaries, requestGeneration: 1 },
  { ...validReadyRoot, extra: true },
  { ...validReadyRoot, [Symbol("root")]: true },
  Object.assign(Object.create(null), validReadyRoot),
  new Proxy(validReadyRoot, { getPrototypeOf: () => { throw new Error("root trap"); } }),
  new Proxy(validReadyRoot, { ownKeys: () => { throw new Error("root trap"); } }),
  new Proxy(validReadyRoot, { getOwnPropertyDescriptor: () => { throw new Error("root trap"); } }),
];
const revokedRoot = Proxy.revocable(validReadyRoot, {}); revokedRoot.revoke(); rootAttacks.push(revokedRoot.proxy);
for (const attacked of rootAttacks) {
  const safe = providerAuthority.projectInvestigationLibraryPublicState(
    attacked as ReturnType<typeof createInitialInvestigationLibraryState>,
  );
  equal(safe.status, InvestigationLibraryStatus.NOT_REQUESTED, "Hostile root did not fail closed.");
  equal(safe.summaries.length, 0, "Hostile root retained summaries.");
}
equal(rootGetterCalls, 0, "Root public-state getter executed.");
pass("root public state rejects inheritance, accessors, key drift, prototypes, traps, and revoked proxies without getter execution");

const hostileMessage = "HOSTILE_DIAGNOSTIC_MUST_NOT_ESCAPE";
const throwing = () => { throw new Error(hostileMessage); };
const revokedStateHandle = Proxy.revocable({}, {});
revokedStateHandle.revoke();
const revokedState = revokedStateHandle.proxy;
const hostileIdentities: unknown[] = [
  Object.defineProperty({}, "status", { get: throwing }),
  { status: "READY", get identity() { return throwing(); }, revision: 1 },
  { status: "READY", identity: Object.defineProperty({}, "kind", { get: throwing }), revision: 1 },
  { status: "READY", identity: Object.defineProperty({ kind: "GUEST" }, "operatorId", { get: throwing }), revision: 1 },
  { status: "READY", identity: Object.defineProperty({ kind: "GUEST", operatorId: "x" }, "establishedAt", { get: throwing }), revision: 1 },
  Object.defineProperty({ status: "READY", identity: { kind: "GUEST", operatorId: "x", establishedAt: "now" } }, "revision", { get: throwing }),
  new Proxy({}, { get: throwing }), revokedState,
  { status: "READY", identity: new Proxy({}, { get: throwing }), revision: 1 },
];
for (const primitive of [null, undefined, true, false, 0, 1, "READY", () => undefined]) hostileIdentities.push(primitive);
hostileIdentities.push(
  Object.create({ status: "READY", identity: { kind: "GUEST", operatorId: "x", establishedAt: "2026-09-05T00:00:00.000Z" }, persistence: "SESSION", revision: 1 }),
  Object.defineProperty({}, "status", { value: "READY" }),
  Object.assign(Object.create(null), identity("READY", "GUEST", "x")),
  new Proxy(identity("READY", "GUEST", "x"), { getPrototypeOf: throwing }),
  new Proxy(identity("READY", "GUEST", "x"), { ownKeys: throwing }),
  new Proxy(identity("READY", "GUEST", "x"), { getOwnPropertyDescriptor: throwing }),
  { ...identity("READY", "GUEST", "x"), identity: Object.create(identity("READY", "GUEST", "x").identity!) },
  { status: "READY", identity: { kind: "GUEST", operatorId: { toString: throwing }, establishedAt: "2026-09-05T00:00:00.000Z" }, persistence: "SESSION", revision: 1 },
);
const revokedIdentityHandle = Proxy.revocable({}, {});
revokedIdentityHandle.revoke();
hostileIdentities.push({ status: "READY", identity: revokedIdentityHandle.proxy, revision: 1 });
for (const kind of ["ADMIN", "", null, {}, [], () => undefined]) {
  hostileIdentities.push({ status: "READY", identity: { kind, operatorId: "x", establishedAt: "now" }, revision: 1 });
}
for (const establishedAt of [null, 1, {}, [], () => undefined, "", "now", "2026-09-05T00:00:00Z", "2026-02-30T00:00:00.000Z"]) {
  hostileIdentities.push({ status: "READY", identity: { kind: "GUEST", operatorId: "x", establishedAt }, revision: 1 });
}
for (const revision of [null, "1", -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, {}, [], () => undefined]) {
  hostileIdentities.push({ status: "READY", identity: { kind: "GUEST", operatorId: "x", establishedAt: "now" }, revision });
}
const hostileRequests: string[] = [];
const hostileController = providerAuthority.createInvestigationLibraryAuthorityController(task => task());
hostileController.attach({ setPrincipal: () => undefined, load: principal => { hostileRequests.push(principal); } });
for (const hostile of hostileIdentities) {
  let normalized: Authority | null = null;
  let projection: unknown = null;
  let escaped = "";
  try {
    normalized = normalizeInvestigationLibraryAuthority(hostile);
    projection = resolveOverviewFrontDoorRuntimeProjection({
      identity: hostile as OperatorIdentityState,
      guestWorkspaceRestored: false,
      activeInvestigationId: null,
      library: { status: InvestigationLibraryStatus.NOT_REQUESTED, summaries: [] },
    });
  } catch (error) { escaped = String(error); }
  equal(normalized, null, "Hostile identity produced authority.");
  equal(projection, null, "Hostile identity produced OVERVIEW projection.");
  equal(escaped, "", "Hostile identity escaped render preparation.");
  hostileController.commit(normalized);
  hostileController.refresh();
  assert(!JSON.stringify({ normalized, projection }).includes(hostileMessage), "Hostile diagnostic serialized.");
}
equal(hostileRequests.length, 0, "Hostile identity issued a request through the connected runtime spy.");
pass("total authority normalization rejects hostile access, kinds, epochs, and revisions without request or diagnostic escape");

function privateStateWith(candidate: unknown) {
  return { ...stateFor("safe", InvestigationLibraryStatus.READY), summaries: [candidate] } as unknown as ReturnType<typeof createInitialInvestigationLibraryState>;
}
const sourceSummary = summary("copied");
const copiedPublic = providerAuthority.projectInvestigationLibraryPublicState(privateStateWith(sourceSummary));
const copied = copiedPublic.summaries[0]!;
assert(copied !== sourceSummary, "Public summary retained its private source reference.");
equal(Reflect.ownKeys(copied).join(","), "investigationId,title", "Public summary keys differ from the OVERVIEW allowlist.");
equal(Object.getOwnPropertySymbols(copied).length, 0, "Public summary retained symbols.");
equal(Object.getPrototypeOf(copied), Object.prototype, "Public summary has an unsafe prototype.");
for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(copied))) {
  assert("value" in descriptor && descriptor.get === undefined && descriptor.set === undefined, "Public summary retained an accessor.");
  assert(descriptor.value === null || ["string", "number"].includes(typeof descriptor.value), "Public summary retained a non-primitive alias.");
}
assert(Object.isFrozen(copied) && Object.isFrozen(copiedPublic.summaries) && Object.isFrozen(copiedPublic), "Public summary graph is not frozen.");
assert(copiedPublic.summaries !== privateStateWith(sourceSummary).summaries, "Public summary array retained a private alias.");

const symbol = Symbol("hostile-symbol");
const hostileSummaries: unknown[] = [];
hostileSummaries.push({ ...sourceSummary, extra: hostileMessage });
const hidden = { ...sourceSummary }; Object.defineProperty(hidden, "extra", { value: hostileMessage }); hostileSummaries.push(hidden);
const symbolled = { ...sourceSummary, [symbol]: hostileMessage }; hostileSummaries.push(symbolled);
const getter = { ...sourceSummary }; Object.defineProperty(getter, "title", { get: () => "getter", enumerable: true }); hostileSummaries.push(getter);
const throwingGetter = { ...sourceSummary }; Object.defineProperty(throwingGetter, "title", { get: throwing, enumerable: true }); hostileSummaries.push(throwingGetter);
hostileSummaries.push(Object.assign(Object.create({ inherited: hostileMessage }), sourceSummary));
hostileSummaries.push(new Proxy(sourceSummary, { ownKeys: throwing }));
const revokedSummary = Proxy.revocable(sourceSummary, {}); revokedSummary.revoke(); hostileSummaries.push(revokedSummary.proxy);
for (const candidate of hostileSummaries) {
  const safe = providerAuthority.projectInvestigationLibraryPublicState(privateStateWith(candidate));
  equal(safe.status, InvestigationLibraryStatus.NOT_REQUESTED, "Rejected summary did not fail to the documented lifecycle.");
  equal(safe.summaries.length, 0, "Rejected summary preserved partial attacker data.");
  assert(Object.isFrozen(safe) && Object.isFrozen(safe.summaries), "Rejected summary fallback is mutable.");
  assert(!JSON.stringify(safe).includes(hostileMessage), "Summary diagnostic or metadata serialized.");
}
pass("public summary projection exact-copies primitive data and rejects aliases, accessors, traps, symbols, prototypes, and extra keys");

const hostileCollections: unknown[] = [
  Object.assign([], { map: throwing }),
  Object.defineProperty([sourceSummary], "0", { get: throwing }),
  Object.assign(new Array(2), { 1: sourceSummary }),
  Object.assign(Object.create(Array.prototype), { 0: sourceSummary, length: 1 }),
  new Proxy([sourceSummary], { getPrototypeOf: throwing }),
  new Proxy([sourceSummary], { ownKeys: throwing }),
  new Proxy([sourceSummary], { getOwnPropertyDescriptor: throwing }),
];
for (const summaries of hostileCollections) {
  const safe = providerAuthority.projectInvestigationLibraryPublicState({
    ...stateFor("safe", InvestigationLibraryStatus.READY), summaries,
  } as unknown as ReturnType<typeof createInitialInvestigationLibraryState>);
  equal(safe.status, InvestigationLibraryStatus.NOT_REQUESTED, "Hostile collection did not fail closed.");
  equal(safe.summaries.length, 0, "Hostile collection leaked summaries.");
}
const duplicatePublic = providerAuthority.projectInvestigationLibraryPublicState({
  ...stateFor("safe", InvestigationLibraryStatus.READY), summaries: [sourceSummary, sourceSummary],
} as unknown as ReturnType<typeof createInitialInvestigationLibraryState>);
equal(duplicatePublic.status, InvestigationLibraryStatus.NOT_REQUESTED, "Duplicate IDs were accepted.");
for (const [status, summaries] of [
  [InvestigationLibraryStatus.READY, []],
  [InvestigationLibraryStatus.EMPTY, [sourceSummary]],
] as const) {
  const safe = providerAuthority.projectInvestigationLibraryPublicState({
    ...stateFor("safe", status), summaries,
  } as unknown as ReturnType<typeof createInitialInvestigationLibraryState>);
  equal(safe.status, InvestigationLibraryStatus.NOT_REQUESTED, `${status} contradictory content was accepted.`);
}
pass("public collection validation rejects sparse, accessor, overridden, hostile, duplicate, and lifecycle-inconsistent input");

for (const status of [
  InvestigationLibraryStatus.NOT_REQUESTED,
  InvestigationLibraryStatus.LOADING,
  InvestigationLibraryStatus.ERROR,
  InvestigationLibraryStatus.EMPTY,
]) {
  const rejected = providerAuthority.projectInvestigationLibraryPublicState(
    stateFor("safe", status, { withSummary: true }) as ReturnType<typeof createInitialInvestigationLibraryState>,
  );
  equal(rejected.status, InvestigationLibraryStatus.NOT_REQUESTED, `${status} with summaries escaped.`);
  equal(rejected.summaries.length, 0, `${status} retained contradictory summaries.`);
}
equal(providerAuthority.projectInvestigationLibraryPublicState(
  stateFor("safe", InvestigationLibraryStatus.READY),
).status, InvestigationLibraryStatus.NOT_REQUESTED, "READY without summaries escaped.");
equal(providerAuthority.projectInvestigationLibraryPublicState(validReadyRoot).status, InvestigationLibraryStatus.READY, "READY snapshot was rejected.");
equal(providerAuthority.projectInvestigationLibraryPublicState(
  stateFor("safe", InvestigationLibraryStatus.STALE, { withSummary: true }),
).status, InvestigationLibraryStatus.STALE, "STALE retained READY snapshot was rejected.");
equal(providerAuthority.projectInvestigationLibraryPublicState(
  stateFor("safe", InvestigationLibraryStatus.STALE),
).status, InvestigationLibraryStatus.STALE, "STALE retained EMPTY snapshot was rejected.");
pass("public lifecycle permits only READY data and validated STALE retained READY/EMPTY snapshots");

for (const timestamp of ["2026-09-05T00:00:00.000Z", "2000-02-29T23:59:59.999Z"]) {
  const accepted = providerAuthority.projectInvestigationLibraryPublicState(privateStateWith({
    ...sourceSummary, createdAt: timestamp, modifiedAt: timestamp,
  }));
  equal(accepted.status, InvestigationLibraryStatus.READY, `Canonical timestamp ${timestamp} was rejected.`);
}
for (const timestamp of ["now", "2026-02-30T00:00:00.000Z", "2026-09-05T00:00:00", "2026-09-05T00:00:00.000+00:00", "2026-09-05T00:00:00Z"]) {
  const rejected = providerAuthority.projectInvestigationLibraryPublicState(privateStateWith({
    ...sourceSummary, createdAt: timestamp,
  }));
  equal(rejected.status, InvestigationLibraryStatus.NOT_REQUESTED, `Invalid timestamp ${timestamp} escaped.`);
}
for (const version of [0, 1, Number.MAX_SAFE_INTEGER]) {
  equal(providerAuthority.projectInvestigationLibraryPublicState(privateStateWith({ ...sourceSummary, version })).status,
    InvestigationLibraryStatus.READY, `Safe version ${version} was rejected.`);
}
for (const version of [Number.MAX_SAFE_INTEGER + 1, -1, 1.5, Infinity, NaN, "1", {}, null]) {
  equal(providerAuthority.projectInvestigationLibraryPublicState(privateStateWith({ ...sourceSummary, version })).status,
    InvestigationLibraryStatus.NOT_REQUESTED, `Invalid version ${String(version)} escaped.`);
}
pass("summary boundary enforces canonical UTC millisecond timestamps and non-negative safe-integer versions");

for (const invalidId of ["", "   ", "\t\n"]) {
  const invalid = providerAuthority.resolveInvestigationLibraryAuthority(identity("READY", "GUEST", invalidId));
  equal(invalid, null, "Blank identity produced authority.");
  const beforeLoads = actionLoads.length;
  controller.commit(invalid);
  controller.refresh();
  equal(actionLoads.length, beforeLoads, "Invalid identity issued a request.");
  const safeInvalid = providerAuthority.reconcileInvestigationLibraryState(privateSame, guestSame, invalid);
  equal(safeInvalid.principalId, null, "Invalid identity exposed a principal.");
  equal(safeInvalid.status, InvestigationLibraryStatus.NOT_REQUESTED, "Invalid identity exposed previous state.");
}
equal(providerAuthority.resolveInvestigationLibraryAuthority(identity("READY", "GUEST", "  normalized  "))?.principalId, "normalized", "Valid authority was not normalized.");
const malformedIdentity = identity("READY", "GUEST") as unknown as {
  identity: { kind: "GUEST"; operatorId: unknown; establishedAt: string };
};
malformedIdentity.identity.operatorId = Object.freeze({ hostile: true });
equal(
  providerAuthority.resolveInvestigationLibraryAuthority(malformedIdentity as unknown as OperatorIdentityState),
  null,
  "Malformed non-string identity produced authority.",
);
pass("blank and whitespace identities fail closed without request or effect error");

assert(contextSource.indexOf("runtime.subscribe(setState)") < contextSource.indexOf("authorityController.attach(runtime)"), "Provider source does not order subscription before attach.");
assert(providerCalls.includes("runtime.dispose"), "Provider cleanup does not dispose its runtime.");
assert(providerCalls.includes("authorityController.refresh"), "Provider callback does not delegate to committed-authority refresh.");
pass("provider AST/source wiring orders subscribe-first and connects cleanup and refresh");

for (const source of [contextSource, adapterSource, overviewSource]) {
  for (const forbidden of [
    "activateInvestigation", "importInvestigation", "setSelection", "setFocus", "setActiveMode",
    "publishResearch", "defaultInvestigation", "defaultWorkspace", "E-TICTAC", "Tic Tac", "Nimitz",
  ]) assert(!source.includes(forbidden), `Integration source contains forbidden ${forbidden}.`);
}
pass("no summary activates, installs, imports, selects, focuses, publishes, or changes mode");

for (const forbidden of ["react", "fetch(", "sessionStorage", "localStorage", "WorkspaceRuntime", "../federation", "../studio", "../author", "../research"]) {
  assert(!adapterSource.includes(forbidden), `Pure adapter contains forbidden dependency ${forbidden}.`);
}
pass("pure adapter has no React, transport, storage, Workspace, Federation, Studio, Author, or Research dependency");

for (const forbidden of ["response.body", "response.text", "backendCode", "requestId", "diagnosticMetadata"]) {
  assert(!contextSource.includes(forbidden) && !overviewSource.includes(forbidden), `Backend diagnostic rendering found: ${forbidden}.`);
}
pass("frontend integration renders no backend diagnostics");

const providerOpen = appSource.indexOf("<InvestigationLibraryRuntimeProvider>");
const operatorApplicationOpen = appSource.indexOf("function OperatorApplication");
const operatorApplicationClose = appSource.indexOf("function ModeAwarePrimarySurface");
const publicReport = appSource.indexOf('path="/report"');
assert(providerOpen > operatorApplicationClose, "Library provider remained application-wide.");
assert(publicReport > operatorApplicationOpen && publicReport < operatorApplicationClose, "Public route moved inside provider.");
assert(appSource.includes("mode === WorkspaceMode.OVERVIEW") && appSource.includes("center={\n                                <ModeAwarePrimarySurface />"), "OVERVIEW mode boundary is not the live primary surface.");
pass("provider placement is restricted to OVERVIEW and preserves public routes outside operator runtime");

const operationalModes = ["OVERVIEW", "MANIFOLD", "COMPARE", "NARRATIVE", "EVIDENCE", "TIMELINE", "LAYERS", "INTENTION", "STUDIO"] as const;
for (const mode of operationalModes) {
  const modeQueue: Array<() => void> = [];
  const modeLoads: string[] = [];
  const modeController = providerAuthority.createInvestigationLibraryAuthorityController(task => modeQueue.push(task));
  modeController.commit(authorityA);
  if (mode === "OVERVIEW") modeController.attach({ setPrincipal: () => undefined, load: principal => { modeLoads.push(principal); } });
  flush(modeQueue);
  equal(modeLoads.length, mode === "OVERVIEW" ? 1 : 0, `${mode} request containment differed.`);
}
const leaveQueue: Array<() => void> = [];
const leaveLoads: string[] = [];
const leavePrincipals: Array<string | null> = [];
const leaveRuntime = { setPrincipal: (principal: string | null) => { leavePrincipals.push(principal); }, load: (principal: string) => { leaveLoads.push(principal); } };
const leaveController = providerAuthority.createInvestigationLibraryAuthorityController(task => leaveQueue.push(task));
leaveController.commit(authorityA);
leaveController.attach(leaveRuntime);
leaveController.detach(leaveRuntime);
flush(leaveQueue);
equal(leaveLoads.length, 0, "Leaving OVERVIEW dispatched queued work.");
equal(leavePrincipals.at(-1), null, "Leaving OVERVIEW did not synchronously cancel principal authority.");
leaveController.commit(authorityB);
const returnRuntimeLoads: string[] = [];
leaveController.attach({ setPrincipal: () => undefined, load: principal => { returnRuntimeLoads.push(principal); } });
flush(leaveQueue);
equal(returnRuntimeLoads.join(","), "B", "Returning to OVERVIEW did not use current committed authority.");
const strictQueue: Array<() => void> = [];
const strictFirstLoads: string[] = [];
const strictCommittedLoads: string[] = [];
const strictController = providerAuthority.createInvestigationLibraryAuthorityController(task => strictQueue.push(task));
strictController.commit(authorityA);
const strictFirst = { setPrincipal: () => undefined, load: (principal: string) => { strictFirstLoads.push(principal); } };
const strictCommitted = { setPrincipal: () => undefined, load: (principal: string) => { strictCommittedLoads.push(principal); } };
strictController.attach(strictFirst);
strictController.detach(strictFirst);
strictController.attach(strictCommitted);
flush(strictQueue);
equal(strictFirstLoads.length, 0, "StrictMode rehearsal dispatched a request.");
equal(strictCommittedLoads.join(","), "A", "StrictMode committed mount duplicated or omitted its request.");
pass("mode boundary permits only OVERVIEW, cancels exit work, reconciles return authority, and survives StrictMode rehearsal");

for (const visible of [
  "<GuestWelcomeOverview />", 'className="overview-dashboard"', "Active Investigation",
  "Current Investigative Focus", "Active Layers", "No Event Selected",
]) assert(overviewSource.includes(visible), `Existing OVERVIEW structure missing ${visible}.`);
assert(overviewSource.includes("void frontDoorProjection"), "Live projection is not consumed non-visually.");
pass("existing OVERVIEW visible structure remains present with non-visual live projection");

assert(!JSON.stringify(returningGuest).includes("activateInvestigation"), "Projection exposed activation behavior.");
assert(Object.isFrozen(returningGuest) && Object.isFrozen(returningGuest?.library), "Projection is not recursively immutable.");
pass("projection is immutable and descriptor-only");

console.log("");
console.log(`All ${passCount} Investigation Library Runtime Integration invariants passed.`);
