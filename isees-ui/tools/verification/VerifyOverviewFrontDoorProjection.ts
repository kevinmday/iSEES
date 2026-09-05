import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { resolveOverviewFrontDoorProjection } from "../../src/investigation/frontDoor/FrontDoorProjection.ts";
import {
  FrontDoorActionId,
  FrontDoorActionIntent,
  FrontDoorIdentityKind,
  FrontDoorNoticeCode,
  FrontDoorPersistenceCapability,
  FrontDoorProjectionErrorCode,
  GuestRestorableWorkStatus,
  InvestigationLibraryStatus,
  OverviewFrontDoorManifestation,
  RepositoryCapabilityState,
  type OverviewFrontDoorProjection,
  type OverviewFrontDoorProjectionInput,
} from "../../src/investigation/frontDoor/FrontDoorProjectionTypes.ts";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`VERIFY FAILED: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  assert(actual === expected, `${message} Expected ${String(expected)}, received ${String(actual)}.`);
}

function assertManifestation(
  projection: OverviewFrontDoorProjection,
  expected: OverviewFrontDoorManifestation,
  message: string,
): void {
  assertEqual(projection.manifestation, expected, message);
}

function assertInvalid(
  projection: OverviewFrontDoorProjection,
  expectedCode: FrontDoorProjectionErrorCode,
): void {
  assert(projection.status === "INVALID", `Expected invalid projection for ${expectedCode}.`);
  assert(
    projection.errors.some(error => error.code === expectedCode),
    `Expected typed projection error ${expectedCode}.`,
  );
}

function assertMutationRejected(operation: () => void, message: string): void {
  let rejected = false;
  try {
    operation();
  } catch (error) {
    rejected = error instanceof TypeError;
  }
  assert(rejected, message);
}

let passCount = 0;

function pass(message: string): void {
  passCount += 1;
  console.log(`PASS ${passCount} — ${message}`);
}

function baseInput(): OverviewFrontDoorProjectionInput {
  return {
    identity: {
      kind: FrontDoorIdentityKind.GUEST,
      persistence: FrontDoorPersistenceCapability.SESSION,
    },
    library: {
      status: InvestigationLibraryStatus.NOT_REQUESTED,
      summaries: [],
    },
    guestRestorableWork: {
      status: GuestRestorableWorkStatus.NONE,
    },
    activeInvestigation: {
      claimsOwnedByIdentity: false,
    },
    caseGateway: {
      canonCards: [{
        canonCardId: "canon:one",
        title: "Canonical case",
        summary: "A source case for exploration.",
        sourceReference: "source:canon:one",
      }],
      repositories: [{
        repositoryId: "repository:one",
        label: "External repository",
        capability: RepositoryCapabilityState.REFERENCE_SUPPORTED,
      }],
    },
  };
}

function accountInput(
  status: InvestigationLibraryStatus,
  summaries: OverviewFrontDoorProjectionInput["library"]["summaries"] = [],
): OverviewFrontDoorProjectionInput {
  return {
    ...baseInput(),
    identity: {
      kind: FrontDoorIdentityKind.ACCOUNT,
      persistence: FrontDoorPersistenceCapability.PERSISTENT,
    },
    library: { status, summaries },
  };
}

const freshGuest = resolveOverviewFrontDoorProjection(baseInput());
assertManifestation(freshGuest, OverviewFrontDoorManifestation.FRESH_GUEST, "Guest without restorable work must be fresh.");
pass("Fresh Guest with no restorable work");

const restoredIdentityOnly = resolveOverviewFrontDoorProjection({
  ...baseInput(),
  identity: {
    kind: FrontDoorIdentityKind.GUEST,
    persistence: FrontDoorPersistenceCapability.SESSION,
  },
});
assertManifestation(restoredIdentityOnly, OverviewFrontDoorManifestation.FRESH_GUEST, "Restored identity alone must not imply work.");
pass("restored Guest identity alone remains Fresh Guest");

const activeOnly = resolveOverviewFrontDoorProjection({
  ...baseInput(),
  activeInvestigation: {
    investigationId: "investigation:active-only",
    claimsOwnedByIdentity: false,
  },
});
assertManifestation(activeOnly, OverviewFrontDoorManifestation.FRESH_GUEST, "Active Workspace alone must not imply restorable ownership.");
pass("active Workspace alone remains Fresh Guest");

const returningGuest = resolveOverviewFrontDoorProjection({
  ...baseInput(),
  guestRestorableWork: {
    status: GuestRestorableWorkStatus.VALIDATED,
    investigationId: "investigation:guest-restorable",
  },
});
assertManifestation(returningGuest, OverviewFrontDoorManifestation.RETURNING_GUEST, "Validated restorable Guest work must classify returning.");
pass("validated restorable owned work yields Returning Guest");

const newAccount = resolveOverviewFrontDoorProjection(accountInput(InvestigationLibraryStatus.EMPTY));
assertManifestation(newAccount, OverviewFrontDoorManifestation.NEW_ACCOUNT, "Authoritative EMPTY must yield New Account.");
pass("authoritative EMPTY library yields New Account");

const ownedSummaries = [{ investigationId: "investigation:owned", title: "Owned investigation" }] as const;
const returningAccount = resolveOverviewFrontDoorProjection(accountInput(InvestigationLibraryStatus.READY, ownedSummaries));
assertManifestation(returningAccount, OverviewFrontDoorManifestation.RETURNING_ACCOUNT, "READY owned summaries must yield Returning Account.");
pass("READY owned summaries yield Returning Account");

for (const status of [
  InvestigationLibraryStatus.NOT_REQUESTED,
  InvestigationLibraryStatus.LOADING,
  InvestigationLibraryStatus.STALE,
  InvestigationLibraryStatus.ERROR,
] as const) {
  const projection = resolveOverviewFrontDoorProjection(accountInput(status));
  assertManifestation(
    projection,
    OverviewFrontDoorManifestation.ACCOUNT_LIBRARY_UNRESOLVED,
    `${status} must remain unresolved.`,
  );
  assert(
    projection.notices.some(notice => notice.code === FrontDoorNoticeCode.ACCOUNT_LIBRARY_UNRESOLVED),
    `${status} must explain why it is not empty.`,
  );
  pass(`Account ${status} is neither new nor returning`);
}

assertInvalid(
  resolveOverviewFrontDoorProjection(accountInput(InvestigationLibraryStatus.READY)),
  FrontDoorProjectionErrorCode.READY_LIBRARY_EMPTY,
);
pass("READY with zero summaries is rejected");

assertInvalid(
  resolveOverviewFrontDoorProjection(accountInput(InvestigationLibraryStatus.EMPTY, ownedSummaries)),
  FrontDoorProjectionErrorCode.EMPTY_LIBRARY_NONEMPTY,
);
pass("EMPTY with summaries is rejected");

assertInvalid(
  resolveOverviewFrontDoorProjection(accountInput(InvestigationLibraryStatus.READY, [
    ...ownedSummaries,
    { investigationId: "investigation:owned", title: "Duplicate" },
  ])),
  FrontDoorProjectionErrorCode.DUPLICATE_INVESTIGATION_ID,
);
pass("duplicate investigation IDs are rejected");

assertInvalid(
  resolveOverviewFrontDoorProjection({
    ...accountInput(InvestigationLibraryStatus.READY, ownedSummaries),
    activeInvestigation: {
      investigationId: "investigation:absent",
      claimsOwnedByIdentity: true,
    },
  }),
  FrontDoorProjectionErrorCode.ACTIVE_OWNED_INVESTIGATION_ABSENT,
);
pass("claimed-owned active ID absent from READY library is rejected");

const guestWithAccountStyleLibrary = resolveOverviewFrontDoorProjection({
  ...baseInput(),
  library: {
    status: InvestigationLibraryStatus.READY,
    summaries: ownedSummaries,
  },
});
assertManifestation(
  guestWithAccountStyleLibrary,
  OverviewFrontDoorManifestation.FRESH_GUEST,
  "Account-style library data must not classify a Guest as returning.",
);
pass("Guest classification is not derived from Account-style library state");

assert(freshGuest.status === "VALID" && newAccount.status === "VALID", "Capability comparison requires valid projections.");
const investigativeActions = new Set([
  FrontDoorActionId.EXPLORE_CANON,
  FrontDoorActionId.READ_SOURCE,
  FrontDoorActionId.START_INVESTIGATION,
  FrontDoorActionId.IMPORT_CASE,
]);
for (const actionId of investigativeActions) {
  assert(freshGuest.primaryActions.some(action => action.actionId === actionId), `Guest must expose ${actionId}.`);
  assert(newAccount.primaryActions.some(action => action.actionId === actionId), `Account must expose ${actionId}.`);
}
pass("Guest investigative capability is not reduced relative to Account capability");

for (const actionId of [FrontDoorActionId.EXPLORE_CANON, FrontDoorActionId.READ_SOURCE]) {
  const action = freshGuest.primaryActions.find(candidate => candidate.actionId === actionId);
  assertEqual(action?.intent, FrontDoorActionIntent.READ_ONLY, `${actionId} must be non-mutating.`);
}
pass("Explore and Read actions remain non-mutating intents");

for (const actionId of [
  FrontDoorActionId.START_INVESTIGATION,
  FrontDoorActionId.IMPORT_CASE,
  FrontDoorActionId.RESUME_INVESTIGATION,
]) {
  const source = actionId === FrontDoorActionId.RESUME_INVESTIGATION ? returningGuest : freshGuest;
  const action = source.primaryActions.find(candidate => candidate.actionId === actionId);
  assertEqual(action?.intent, FrontDoorActionIntent.MUTATION, `${actionId} must express mutation intent.`);
}
pass("Start, Import, and Investigate/Resume actions are explicit mutation intents");

for (const capability of Object.values(RepositoryCapabilityState)) {
  const input = baseInput();
  const projection = resolveOverviewFrontDoorProjection({
    ...input,
    caseGateway: {
      ...input.caseGateway,
      repositories: [{ repositoryId: `repository:${capability}`, label: capability, capability }],
    },
  });
  assertEqual(projection.repositoryProjections[0]?.capability, capability, `${capability} must survive unchanged.`);
}
pass("all repository capability states survive without upgrading");

const invalidCapability = "PARTNERED" as RepositoryCapabilityState;
const invalidCapabilityInput = baseInput();
assertInvalid(
  resolveOverviewFrontDoorProjection({
    ...invalidCapabilityInput,
    caseGateway: {
      ...invalidCapabilityInput.caseGateway,
      repositories: [{ repositoryId: "repository:unknown", label: "Unknown", capability: invalidCapability }],
    },
  }),
  FrontDoorProjectionErrorCode.UNSUPPORTED_REPOSITORY_CAPABILITY,
);
pass("unsupported repository capability is rejected");

assert(
  freshGuest.notices.some(notice =>
    notice.code === FrontDoorNoticeCode.REPOSITORY_NON_ENDORSEMENT &&
    notice.message.includes("do not imply partnership or endorsement")
  ),
  "Repository presentation must include a non-endorsement boundary.",
);
pass("repository presentation includes a non-endorsement boundary");

assertEqual(freshGuest.library.summaries.length, 0, "Projection must not install a canonical event.");
assert(!JSON.stringify(freshGuest).includes("E-TICTAC"), "Projection must not activate a canonical event.");
pass("projection installs or activates no canonical event");

assert(!JSON.stringify(freshGuest).toLowerCase().includes("tic tac"), "Projection must fabricate no Tic Tac investigation.");
assert(!JSON.stringify(freshGuest).includes("DEFAULT_INVESTIGATION"), "Projection must fabricate no default investigation.");
pass("no Tic Tac or default investigation is fabricated");

const mutableInput = {
  ...baseInput(),
  library: {
    status: InvestigationLibraryStatus.READY,
    summaries: [{ investigationId: "investigation:mutable", title: "Before" }],
  },
  identity: {
    kind: FrontDoorIdentityKind.ACCOUNT,
    persistence: FrontDoorPersistenceCapability.PERSISTENT,
  },
};
const beforeResolution = JSON.stringify(mutableInput);
const immutableResult = resolveOverviewFrontDoorProjection(mutableInput);
assertEqual(JSON.stringify(mutableInput), beforeResolution, "Resolver must not mutate input.");
assert(immutableResult.library.summaries !== mutableInput.library.summaries, "Result must not alias input collections.");
assert(immutableResult.library.summaries[0] !== mutableInput.library.summaries[0], "Result must not alias nested input records.");
pass("inputs are neither mutated nor aliased");

assertEqual(
  JSON.stringify(resolveOverviewFrontDoorProjection(mutableInput)),
  JSON.stringify(resolveOverviewFrontDoorProjection(structuredClone(mutableInput))),
  "Structurally equivalent repeated inputs must produce equivalent output.",
);
pass("repeated resolution is structurally deterministic");

assert(Object.isFrozen(immutableResult), "Result root must be frozen.");
assert(Object.isFrozen(immutableResult.identity), "Nested identity must be frozen.");
assert(Object.isFrozen(immutableResult.library), "Nested library must be frozen.");
assert(Object.isFrozen(immutableResult.library.summaries), "Nested summary collection must be frozen.");
assert(Object.isFrozen(immutableResult.library.summaries[0]), "Nested summary record must be frozen.");
assert(Object.isFrozen(immutableResult.canon), "Canon collection must be frozen.");
assert(Object.isFrozen(immutableResult.repositoryProjections), "Repository collection must be frozen.");
assert(Object.isFrozen(immutableResult.primaryActions), "Action collection must be frozen.");
assert(Object.isFrozen(immutableResult.notices), "Notice collection must be frozen.");
assertMutationRejected(
  () => {
    Object.assign(immutableResult.library.summaries[0]!, { title: "After" });
  },
  "Frozen nested records must reject mutation.",
);
pass("result collections and nested records are recursively runtime-immutable");

const resolverPath = fileURLToPath(new URL(
  "../../src/investigation/frontDoor/FrontDoorProjection.ts",
  import.meta.url,
));
const resolverSource = readFileSync(resolverPath, "utf8");
for (const forbiddenDependency of [
  "react",
  "sessionStorage",
  "localStorage",
  "fetch(",
  "XMLHttpRequest",
  "WorkspaceRuntime",
  "FederationContext",
  "Studio",
  "ModeProvider",
  "Date.now",
  "Math.random",
  "randomUUID",
] as const) {
  assert(
    !resolverSource.includes(forbiddenDependency),
    `Resolver source must not depend on ${forbiddenDependency}.`,
  );
}
assertEqual(
  resolverSource.match(/^import .* from /gm)?.length ?? 0,
  0,
  "Resolver must have no single-line runtime imports.",
);
assert(
  resolverSource.includes('from "./FrontDoorProjectionTypes.ts"'),
  "Resolver may import only its domain type/enum contract.",
);
pass("resolver is isolated from React, browser, network, Workspace, Federation, Studio, and mode providers");

console.log("");
console.log(`All ${passCount} OVERVIEW Front-Door Projection invariants passed.`);
