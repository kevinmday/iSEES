// ============================================================
// tools/verification/VerifyGuestWorkspaceRuntimeSnapshot.ts
// P56D-I1-G2
// GUEST WORKSPACE LIVE-RUNTIME SNAPSHOT VERIFICATION
//
// Purpose:
//
// Verify:
//
//   live runtime-shaped state
//           ↓
//   GuestWorkspaceSessionSnapshot
//
// before implementing:
//
//   persisted snapshot
//           ↓
//   live runtime restoration
//
// This verifier proves that snapshot capture:
//
//   - requires a real Guest identity
//   - requires SESSION persistence
//   - preserves Investigation identity
//   - preserves Workspace operator configuration
//   - preserves computational L / T / S configuration
//   - preserves Research state
//   - preserves Author document identity
//   - excludes runtime-only state
//   - does not mutate source state
//   - remains deterministic for equivalent input
//   - preserves createdAt during updates
//   - detects ownership mismatch
//   - detects Investigation identity mismatch
//
// No singleton runtime is mutated.
//
// ============================================================

import type {
  OperatorIdentityState,
} from "../../src/identity/runtime/OperatorIdentityRuntimeTypes";

import type {
  WorkspaceRuntimeState,
} from "../../src/workspace/runtime/WorkspaceRuntimeTypes";

import {
  WorkspaceLayoutMode,
  WorkspaceMode,
} from "../../src/workspace/runtime/WorkspaceRuntimeTypes";

import type {
  ResearchDesk,
} from "../../src/research/researchBridgeTypes";

import type {
  AuthorDocumentRuntimeState,
} from "../../src/author/runtime/AuthorDocumentRuntimeTypes";

import type {
  ComputationalAuthorDocument,
} from "../../src/author/model/AuthorDocument";

import {
  DEFAULT_INVESTIGATION,
} from "../../src/investigation/defaultInvestigation";

import {
  assertGuestWorkspaceInvestigationIdentity,
  assertGuestWorkspaceOwnership,
  createGuestWorkspaceSnapshotFromRuntimeState,
  updateGuestWorkspaceSnapshotFromRuntimeState,
} from "../../src/workspace/persistence/GuestWorkspaceSessionSnapshotFactory";


// ============================================================
// OUTPUT
// ============================================================

console.log("");

console.log(
  "============================================================",
);

console.log(
  "P56D-I1-G2 — GUEST WORKSPACE LIVE-RUNTIME SNAPSHOT VERIFICATION",
);

console.log(
  "============================================================",
);

console.log("");


// ============================================================
// ASSERTION
// ============================================================

function assert(
  condition:
    unknown,
  message:
    string,
): asserts condition {

  if (
    !condition
  ) {
    throw new Error(
      `VERIFICATION FAILED: ${message}`,
    );
  }

}


// ============================================================
// EXPECT THROW
// ============================================================

function expectThrow(
  operation:
    () => void,
  message:
    string,
): void {

  let threw =
    false;

  try {

    operation();

  } catch {

    threw =
      true;

  }

  assert(
    threw,
    message,
  );

}


// ============================================================
// PASS
// ============================================================

let passNumber =
  0;

function pass(
  message:
    string,
): void {

  passNumber += 1;

  console.log(
    `PASS ${passNumber} — ${message}`,
  );

}


// ============================================================
// FIXED VERIFICATION METADATA
// ============================================================
//
// Fixed values eliminate clock/UUID nondeterminism.
//
// ============================================================

const TEST_OPERATOR_ID =
  "guest:g2-runtime-verification";

const TEST_ESTABLISHED_AT =
  "2026-08-16T13:00:00.000Z";

const TEST_CREATED_AT =
  "2026-08-16T13:01:00.000Z";

const TEST_UPDATED_AT =
  "2026-08-16T13:02:00.000Z";

const TEST_UPDATED_AGAIN_AT =
  "2026-08-16T13:03:00.000Z";


// ============================================================
// GUEST IDENTITY STATE
// ============================================================

function createGuestIdentityState():
  OperatorIdentityState {

  return {

    status:
      "READY",

    identity: {

      operatorId:
        TEST_OPERATOR_ID,

      kind:
        "GUEST",

      establishedAt:
        TEST_ESTABLISHED_AT,

    },

    persistence:
      "SESSION",

    revision:
      17,

  };

}


// ============================================================
// ACCOUNT IDENTITY STATE
// ============================================================

function createAccountIdentityState():
  OperatorIdentityState {

  return {

    status:
      "READY",

    identity: {

      operatorId:
        "account:verification",

      kind:
        "ACCOUNT",

      establishedAt:
        TEST_ESTABLISHED_AT,

    },

    persistence:
      "PERSISTENT",

    revision:
      99,

  };

}


// ============================================================
// NONE IDENTITY STATE
// ============================================================

function createNoIdentityState():
  OperatorIdentityState {

  return {

    status:
      "READY",

    identity:
      null,

    persistence:
      "NONE",

    revision:
      5,

  };

}


// ============================================================
// TEST INVESTIGATION
// ============================================================

const testInvestigation = {

  ...DEFAULT_INVESTIGATION,

  id:
    "INVESTIGATION-G2-RUNTIME-VERIFY",

};


// ============================================================
// TEST WORKSPACE RUNTIME STATE
// ============================================================
//
// This is runtime-shaped state, not a persistence-shaped fixture.
//
// status/revision/selection are intentionally populated so we can
// prove that capture excludes runtime-only material.
//
// ============================================================

function createWorkspaceRuntimeState():
  WorkspaceRuntimeState {

  return {

    status:
      "ACTIVE",

    session: {

      workspace:
        testInvestigation.workspace,

      investigation:
        testInvestigation,

      focusedEvent:
        undefined,

      artifacts:
        [],

    },

    operator: {

      activeMode:
        WorkspaceMode.MANIFOLD,

      layoutMode:
        WorkspaceLayoutMode.NORMAL,

      selection: {
        type:
          "NONE",
      },

    },

    computational: {

      activeLayers: [
        "OBSERVABILITY",
        "NARRATIVE",
        "TEMPORAL",
      ],

      temporalContext:
        undefined,

      investigativeScale:
        undefined,

    },

    revision:
      41,

  };

}


// ============================================================
// TEST RESEARCH DESK
// ============================================================

function createResearchDesk():
  ResearchDesk {

  return {

    entries:
      [],

  };

}


// ============================================================
// TEST AUTHOR DOCUMENT
// ============================================================
//
// The persistence/capture boundary must preserve the supplied
// canonical artifact rather than manufacture another.
//
// ============================================================

const testAuthorDocument = {

  identity:
    "author:g2-runtime-verification",

  metadata: {

    title:
      "G2 Runtime Snapshot Verification",

    type:
      "DOCUMENT",

    status:
      "NEW",

  },

  nodes:
    [],

} as unknown as ComputationalAuthorDocument;


// ============================================================
// TEST AUTHOR RUNTIME STATE
// ============================================================

function createAuthorRuntimeState():
  AuthorDocumentRuntimeState {

  return {

    activeDocument:
      testAuthorDocument,

    dirty:
      true,

    revision:
      73,

  };

}


// ============================================================
// BASE INPUTS
// ============================================================

const guestIdentityState =
  createGuestIdentityState();

const workspaceRuntimeState =
  createWorkspaceRuntimeState();

const researchDesk =
  createResearchDesk();

const authorRuntimeState =
  createAuthorRuntimeState();


// ============================================================
// PASS 1
// GUEST RUNTIME STATE -> SNAPSHOT
// ============================================================

const snapshot =
  createGuestWorkspaceSnapshotFromRuntimeState({

    identity:
      guestIdentityState,

    workspace:
      workspaceRuntimeState,

    researchDesk,

    authoring:
      authorRuntimeState,

    createdAt:
      TEST_CREATED_AT,

    updatedAt:
      TEST_UPDATED_AT,

  });

assert(
  snapshot.ownership.kind ===
    "GUEST",
  "captured snapshot does not have Guest ownership",
);

assert(
  snapshot.ownership.operatorId ===
    TEST_OPERATOR_ID,
  "captured snapshot lost Guest operator identity",
);

pass(
  "Guest identity state produces canonical workspace snapshot",
);


// ============================================================
// PASS 2
// NON-GUEST IDENTITY REJECTION
// ============================================================

expectThrow(
  () => {

    createGuestWorkspaceSnapshotFromRuntimeState({

      identity:
        createAccountIdentityState(),

      workspace:
        workspaceRuntimeState,

      researchDesk,

      authoring:
        authorRuntimeState,

      createdAt:
        TEST_CREATED_AT,

      updatedAt:
        TEST_UPDATED_AT,

    });

  },
  "Account identity was incorrectly accepted by Guest snapshot factory",
);

expectThrow(
  () => {

    createGuestWorkspaceSnapshotFromRuntimeState({

      identity:
        createNoIdentityState(),

      workspace:
        workspaceRuntimeState,

      researchDesk,

      authoring:
        authorRuntimeState,

      createdAt:
        TEST_CREATED_AT,

      updatedAt:
        TEST_UPDATED_AT,

    });

  },
  "NONE identity was incorrectly accepted by Guest snapshot factory",
);

pass(
  "non-Guest identity is rejected",
);


// ============================================================
// PASS 3
// SESSION PERSISTENCE REQUIRED
// ============================================================

const invalidGuestPersistence:
  OperatorIdentityState = {

  ...guestIdentityState,

  persistence:
    "NONE",

};

expectThrow(
  () => {

    createGuestWorkspaceSnapshotFromRuntimeState({

      identity:
        invalidGuestPersistence,

      workspace:
        workspaceRuntimeState,

      researchDesk,

      authoring:
        authorRuntimeState,

      createdAt:
        TEST_CREATED_AT,

      updatedAt:
        TEST_UPDATED_AT,

    });

  },
  "Guest snapshot capture accepted non-SESSION persistence",
);

pass(
  "Guest snapshot capture requires SESSION persistence policy",
);


// ============================================================
// PASS 4
// INVESTIGATION IDENTITY PRESERVATION
// ============================================================

assert(
  snapshot.workspace.investigation!.id ===
    testInvestigation.id,
  "runtime Investigation identity changed during capture",
);

assertGuestWorkspaceInvestigationIdentity(
  snapshot,
  workspaceRuntimeState,
);

pass(
  "runtime Investigation identity is preserved",
);


// ============================================================
// PASS 5
// WORKSPACE OPERATOR CONFIGURATION
// ============================================================

assert(
  snapshot.workspace.operator.activeMode ===
    workspaceRuntimeState.operator.activeMode,
  "active Workspace mode changed during capture",
);

assert(
  snapshot.workspace.operator.layoutMode ===
    workspaceRuntimeState.operator.layoutMode,
  "Workspace layout mode changed during capture",
);

assert(
  snapshot.workspace.workspace ===
    workspaceRuntimeState.session.workspace,
  "active Workspace was replaced during capture",
);

pass(
  "Workspace operational configuration is captured",
);


// ============================================================
// PASS 6
// COMPUTATIONAL L / T / S
// ============================================================

assert(
  JSON.stringify(
    snapshot.workspace.computational.activeLayers,
  ) ===
    JSON.stringify(
      workspaceRuntimeState.computational.activeLayers,
    ),
  "active computational layers changed during capture",
);

assert(
  snapshot.workspace.computational.temporalContext ===
    workspaceRuntimeState.computational.temporalContext,
  "temporal context changed during capture",
);

assert(
  snapshot.workspace.computational.investigativeScale ===
    workspaceRuntimeState.computational.investigativeScale,
  "investigative scale changed during capture",
);

pass(
  "computational L/T/S configuration is captured",
);


// ============================================================
// PASS 7
// RESEARCH DESK
// ============================================================

assert(
  snapshot.research.desk ===
    researchDesk,
  "Research Desk was replaced during capture",
);

assert(
  snapshot.research.desk.entries.length ===
    researchDesk.entries.length,
  "Research Desk entry count changed during capture",
);

pass(
  "Research Desk state is captured",
);


// ============================================================
// PASS 8
// AUTHOR DOCUMENT
// ============================================================

assert(
  snapshot.authoring.activeDocument ===
    testAuthorDocument,
  "active Author document was replaced during capture",
);

assert(
  JSON.stringify(
    snapshot.authoring.activeDocument,
  ).includes(
    "author:g2-runtime-verification",
  ),
  "Author document identity was lost during capture",
);

pass(
  "active Author document identity is captured",
);


// ============================================================
// PASS 9
// RUNTIME-ONLY STATE EXCLUSION
// ============================================================

const serializedSnapshot =
  JSON.stringify(
    snapshot,
  );

assert(
  !Object.prototype.hasOwnProperty.call(
    snapshot.workspace,
    "status",
  ),
  "WorkspaceRuntime.status leaked into persisted workspace state",
);

assert(
  !Object.prototype.hasOwnProperty.call(
    snapshot.workspace,
    "revision",
  ),
  "WorkspaceRuntime.revision leaked into persisted workspace state",
);

assert(
  !Object.prototype.hasOwnProperty.call(
    snapshot.authoring,
    "dirty",
  ),
  "Author dirty state leaked into persisted authoring state",
);

assert(
  !Object.prototype.hasOwnProperty.call(
    snapshot.authoring,
    "revision",
  ),
  "Author runtime revision leaked into persisted authoring state",
);

assert(
  !serializedSnapshot.includes(
    '"selection"',
  ),
  "Workspace selection leaked into persisted snapshot",
);

pass(
  "runtime-only status, revision, dirty, and selection state are excluded",
);


// ============================================================
// PASS 10
// CAPTURE DOES NOT MUTATE SOURCE STATE
// ============================================================

const sourceBeforeCapture =
  JSON.stringify({

    identity:
      guestIdentityState,

    workspace:
      workspaceRuntimeState,

    researchDesk,

    authoring:
      authorRuntimeState,

  });

createGuestWorkspaceSnapshotFromRuntimeState({

  identity:
    guestIdentityState,

  workspace:
    workspaceRuntimeState,

  researchDesk,

  authoring:
    authorRuntimeState,

  createdAt:
    TEST_CREATED_AT,

  updatedAt:
    TEST_UPDATED_AT,

});

const sourceAfterCapture =
  JSON.stringify({

    identity:
      guestIdentityState,

    workspace:
      workspaceRuntimeState,

    researchDesk,

    authoring:
      authorRuntimeState,

  });

assert(
  sourceBeforeCapture ===
    sourceAfterCapture,
  "snapshot capture mutated supplied runtime state",
);

pass(
  "snapshot capture does not mutate source runtime state",
);


// ============================================================
// PASS 11
// DETERMINISTIC EQUIVALENT CAPTURE
// ============================================================

const equivalentSnapshot =
  createGuestWorkspaceSnapshotFromRuntimeState({

    identity:
      createGuestIdentityState(),

    workspace:
      createWorkspaceRuntimeState(),

    researchDesk:
      createResearchDesk(),

    authoring:
      createAuthorRuntimeState(),

    createdAt:
      TEST_CREATED_AT,

    updatedAt:
      TEST_UPDATED_AT,

  });

assert(
  JSON.stringify(
    snapshot,
  ) ===
    JSON.stringify(
      equivalentSnapshot,
    ),
  "equivalent runtime state produced different snapshots",
);

pass(
  "equivalent runtime state produces equivalent snapshot",
);


// ============================================================
// PASS 12
// UPDATE PRESERVES CREATED AT
// ============================================================

const updatedSnapshot =
  updateGuestWorkspaceSnapshotFromRuntimeState(
    snapshot,
    {

      identity:
        guestIdentityState,

      workspace:
        workspaceRuntimeState,

      researchDesk,

      authoring:
        authorRuntimeState,

      updatedAt:
        TEST_UPDATED_AGAIN_AT,

    },
  );

assert(
  updatedSnapshot.createdAt ===
    snapshot.createdAt,
  "snapshot update replaced original createdAt",
);

assert(
  updatedSnapshot.updatedAt ===
    TEST_UPDATED_AGAIN_AT,
  "snapshot update did not apply new updatedAt",
);

pass(
  "snapshot update preserves original createdAt",
);


// ============================================================
// PASS 13
// OWNERSHIP MISMATCH DETECTION
// ============================================================

assertGuestWorkspaceOwnership(
  snapshot,
  guestIdentityState,
);

const differentGuestIdentity:
  OperatorIdentityState = {

  ...guestIdentityState,

  identity: {

    operatorId:
      "guest:different-verification-operator",

    kind:
      "GUEST",

    establishedAt:
      TEST_ESTABLISHED_AT,

  },

};

expectThrow(
  () => {

    assertGuestWorkspaceOwnership(
      snapshot,
      differentGuestIdentity,
    );

  },
  "Guest ownership mismatch was not detected",
);

pass(
  "Guest ownership assertion detects wrong Guest identity",
);


// ============================================================
// PASS 14
// INVESTIGATION IDENTITY MISMATCH DETECTION
// ============================================================

const differentInvestigationWorkspaceState:
  WorkspaceRuntimeState = {

  ...workspaceRuntimeState,

  session: {

    ...workspaceRuntimeState.session,

    investigation: {

      ...testInvestigation,

      id:
        "INVESTIGATION-G2-DIFFERENT",

    },

  },

};

expectThrow(
  () => {

    assertGuestWorkspaceInvestigationIdentity(
      snapshot,
      differentInvestigationWorkspaceState,
    );

  },
  "Investigation identity replacement was not detected",
);

pass(
  "Investigation assertion detects identity replacement",
);


// ============================================================
// FINAL
// ============================================================

console.log("");

console.log(
  "============================================================",
);

console.log(
  "P56D-I1-G2 GUEST WORKSPACE LIVE-RUNTIME SNAPSHOT VERIFIED",
);

console.log(
  "============================================================",
);

console.log("");

console.log(
  "Verified:",
);

console.log(
  "  Guest-only runtime capture",
);

console.log(
  "  SESSION persistence enforcement",
);

console.log(
  "  Investigation identity preservation",
);

console.log(
  "  Workspace configuration capture",
);

console.log(
  "  computational L/T/S capture",
);

console.log(
  "  Research Desk capture",
);

console.log(
  "  Author document identity capture",
);

console.log(
  "  runtime-only state exclusion",
);

console.log(
  "  source-state immutability",
);

console.log(
  "  deterministic equivalent capture",
);

console.log(
  "  stable snapshot creation identity",
);

console.log(
  "  Guest ownership mismatch detection",
);

console.log(
  "  Investigation identity mismatch detection",
);

console.log("");

console.log(
  "Governing invariant:",
);

console.log(
  "  Authentication changes ownership, not investigative identity.",
);

console.log("");
