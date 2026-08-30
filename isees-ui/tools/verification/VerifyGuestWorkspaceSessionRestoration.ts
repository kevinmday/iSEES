// ============================================================
// tools/verification/VerifyGuestWorkspaceSessionRestoration.ts
// P56D-I1-G2
// GUEST WORKSPACE SESSION RESTORATION VERIFICATION
//
// Purpose:
//
// Verify the complete deterministic restoration path:
//
//   Guest runtime state
//          ↓
//       capture
//          ↓
//       Snapshot S
//          ↓
//       restore
//          ↓
//       Runtime B
//          ↓
//       recapture
//          ↓
//       Snapshot S'
//
// Governing requirement:
//
//   canonical_state(S) === canonical_state(S')
//
// and:
//
//   Investigation I -> I
//
// This verifier intentionally uses fresh runtime instances.
// Production singleton runtimes are NOT mutated.
//
// ============================================================

import type {
  OperatorIdentityState,
} from "../../src/identity/runtime/OperatorIdentityRuntimeTypes";

import {
  WorkspaceRuntime,
} from "../../src/workspace/runtime/WorkspaceRuntime";

import {
  WorkspaceLayoutMode,
  WorkspaceMode,
} from "../../src/workspace/runtime/WorkspaceRuntimeTypes";

import {
  ResearchBridgeRuntime,
} from "../../src/research/ResearchBridgeRuntime";

import {
  AuthorDocumentRuntime,
} from "../../src/author/runtime/AuthorDocumentRuntime";

import type {
  ResearchDesk,
} from "../../src/research/researchBridgeTypes";

import type {
  ComputationalAuthorDocument,
} from "../../src/author/model/AuthorDocument";

import {
  DEFAULT_INVESTIGATION,
} from "../../src/investigation/defaultInvestigation";

import {
  createGuestWorkspaceSnapshotFromRuntimeState,
} from "../../src/workspace/persistence/GuestWorkspaceSessionSnapshotFactory";

import {
  restoreGuestWorkspaceSessionIntoRuntimes,
} from "../../src/workspace/persistence/GuestWorkspaceSessionRestorer";


// ============================================================
// OUTPUT
// ============================================================

console.log("");

console.log(
  "============================================================",
);

console.log(
  "P56D-I1-G2 — GUEST WORKSPACE SESSION RESTORATION VERIFICATION",
);

console.log(
  "============================================================",
);

console.log("");


// ============================================================
// ASSERT
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

  passNumber++;

  console.log(
    `PASS ${passNumber} — ${message}`,
  );

}


// ============================================================
// FIXED VERIFICATION VALUES
// ============================================================

const TEST_OPERATOR_ID =
  "guest:g2-restoration-verification";

const TEST_ESTABLISHED_AT =
  "2026-08-16T14:00:00.000Z";

const TEST_CREATED_AT =
  "2026-08-16T14:01:00.000Z";

const TEST_UPDATED_AT =
  "2026-08-16T14:02:00.000Z";

const TEST_RECAPTURE_AT =
  "2026-08-16T14:03:00.000Z";


// ============================================================
// IDENTITY
// ============================================================

function createGuestIdentity():
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
      10,

  };

}


function createWrongGuestIdentity():
  OperatorIdentityState {

  return {

    status:
      "READY",

    identity: {

      operatorId:
        "guest:g2-wrong-owner",

      kind:
        "GUEST",

      establishedAt:
        TEST_ESTABLISHED_AT,

    },

    persistence:
      "SESSION",

    revision:
      11,

  };

}


function createAccountIdentity():
  OperatorIdentityState {

  return {

    status:
      "READY",

    identity: {

      operatorId:
        "account:g2-verification",

      kind:
        "ACCOUNT",

      establishedAt:
        TEST_ESTABLISHED_AT,

    },

    persistence:
      "PERSISTENT",

    revision:
      12,

  };

}


// ============================================================
// SOURCE INVESTIGATION
// ============================================================

const sourceInvestigation = {

  ...DEFAULT_INVESTIGATION,

  id:
    "INVESTIGATION-G2-RESTORE",

  workspace: {

    ...DEFAULT_INVESTIGATION.workspace,

    id:
      "WS-G2-RESTORE",

    name:
      "G2 Restoration Workspace",

  },

};


// ============================================================
// DIFFERENT INITIAL RUNTIME INVESTIGATION
// ============================================================
//
// Runtime B deliberately begins with a different Investigation.
//
// Restoration must replace this operational state with the
// persisted Investigation without manufacturing a new identity.
//
// ============================================================

const initialTargetInvestigation = {

  ...DEFAULT_INVESTIGATION,

  id:
    "INVESTIGATION-BEFORE-RESTORE",

  workspace: {

    ...DEFAULT_INVESTIGATION.workspace,

    id:
      "WS-BEFORE-RESTORE",

    name:
      "Pre-Restoration Workspace",

  },

};


// ============================================================
// AUTHOR DOCUMENTS
// ============================================================

const sourceAuthorDocument = {

  identity:
    "author:g2-restored-document",

  metadata: {

    title:
      "Persisted G2 Document",

    type:
      "DOCUMENT",

    status:
      "NEW",

  },

  nodes:
    [],

} as unknown as ComputationalAuthorDocument;


const preExistingAuthorDocument = {

  identity:
    "author:g2-preexisting-document",

  metadata: {

    title:
      "Pre-existing Runtime Document",

    type:
      "DOCUMENT",

    status:
      "NEW",

  },

  nodes:
    [],

} as unknown as ComputationalAuthorDocument;


// ============================================================
// RESEARCH DESK
// ============================================================
//
// A real non-empty persisted Desk is important here.
//
// createdAt is a Date because ResearchAnchor owns Date metadata.
// JSON persistence later converts it to a string; this restoration
// verifier operates on the already-validated snapshot contract.
//
// ============================================================

const sourceResearchDesk = {

  entries: [

    {

      anchor: {

        anchorId:
          "research:INVESTIGATION-G2-RESTORE:NODE:event:g2-001",

        investigationId:
          "INVESTIGATION-G2-RESTORE",

        graph: {

          type:
            "NODE",

          id:
            "event:g2-001",

        },

        graphRevision:
          101,

        createdAt:
          new Date(
            "2026-08-16T14:00:10.000Z",
          ),

        pinned:
          true,

      },

      order:
        7,

    },

    {

      anchor: {

        anchorId:
          "research:INVESTIGATION-G2-RESTORE:NODE:event:g2-002",

        investigationId:
          "INVESTIGATION-G2-RESTORE",

        graph: {

          type:
            "NODE",

          id:
            "event:g2-002",

        },

        graphRevision:
          102,

        createdAt:
          new Date(
            "2026-08-16T14:00:20.000Z",
          ),

        pinned:
          false,

      },

      order:
        3,

    },

  ],

} as ResearchDesk;


// ============================================================
// SOURCE RUNTIMES
// ============================================================

const identity =
  createGuestIdentity();

const sourceWorkspaceRuntime =
  new WorkspaceRuntime();

const sourceResearchRuntime =
  new ResearchBridgeRuntime();

const sourceAuthorRuntime =
  new AuthorDocumentRuntime();


// ============================================================
// INITIALIZE SOURCE WORKSPACE
// ============================================================

sourceWorkspaceRuntime.initialize();

sourceWorkspaceRuntime.activate(
  sourceInvestigation.workspace,
);

sourceWorkspaceRuntime.setActiveInvestigation(
  sourceInvestigation,
);

sourceWorkspaceRuntime.setActiveMode(
  WorkspaceMode.RESEARCH,
);

sourceWorkspaceRuntime.setFocusMode(
  true,
);

sourceWorkspaceRuntime.setComputationalConfiguration({

  activeLayers: [
    "OBSERVABILITY",
    "TEMPORAL",
  ],

  temporalContext:
    undefined,

  investigativeScale:
    undefined,

});


// ============================================================
// INITIALIZE SOURCE RESEARCH / AUTHOR
// ============================================================

sourceResearchRuntime.restoreDesk(
  sourceResearchDesk,
);

sourceAuthorRuntime.setActiveDocument(
  sourceAuthorDocument,
);


// ============================================================
// CAPTURE SOURCE SNAPSHOT
// ============================================================

const snapshot =
  createGuestWorkspaceSnapshotFromRuntimeState({

    identity,

    workspace:
      sourceWorkspaceRuntime.getState(),

    researchDesk:
      sourceResearchRuntime.getDesk() as ResearchDesk,

    authoring:
      sourceAuthorRuntime.getState(),

    createdAt:
      TEST_CREATED_AT,

    updatedAt:
      TEST_UPDATED_AT,

  });


// ============================================================
// TARGET RUNTIMES
// ============================================================
//
// These deliberately begin with different operational state.
//
// ============================================================

function createTargetRuntimes() {

  const workspaceRuntime =
    new WorkspaceRuntime();

  const researchRuntime =
    new ResearchBridgeRuntime();

  const authorRuntime =
    new AuthorDocumentRuntime();

  workspaceRuntime.initialize();

  workspaceRuntime.activate(
    initialTargetInvestigation.workspace,
  );

  workspaceRuntime.setActiveInvestigation(
    initialTargetInvestigation,
  );

  workspaceRuntime.setActiveMode(
    WorkspaceMode.OVERVIEW,
  );

  workspaceRuntime.setFocusMode(
    false,
  );

  workspaceRuntime.setComputationalConfiguration({

    activeLayers:
      [],

    temporalContext:
      undefined,

    investigativeScale:
      undefined,

  });

  researchRuntime.restoreDesk({

    entries:
      [],

  });

  authorRuntime.setActiveDocument(
    preExistingAuthorDocument,
  );

  return {

    workspaceRuntime,

    researchRuntime,

    authorRuntime,

  };

}


// ============================================================
// PASS 1
// MATCHING GUEST RESTORES
// ============================================================

const target =
  createTargetRuntimes();

const restoreResult =
  restoreGuestWorkspaceSessionIntoRuntimes({

    snapshot,

    identity,

    workspaceRuntime:
      target.workspaceRuntime,

    researchBridgeRuntime:
      target.researchRuntime,

    authorDocumentRuntime:
      target.authorRuntime,

  });

assert(
  restoreResult.restored ===
    true,
  "matching Guest snapshot did not restore",
);

assert(
  restoreResult.operatorId ===
    TEST_OPERATOR_ID,
  "restore result lost Guest operator identity",
);

assert(
  restoreResult.investigationId ===
    sourceInvestigation.id,
  "restore result lost Investigation identity",
);

pass(
  "matching Guest snapshot restores successfully",
);


// ============================================================
// PASS 2
// WRONG GUEST REJECTED BEFORE MUTATION
// ============================================================

const wrongGuestTarget =
  createTargetRuntimes();

const wrongGuestBefore =
  JSON.stringify(
    wrongGuestTarget.workspaceRuntime.getState(),
  );

expectThrow(
  () => {

    restoreGuestWorkspaceSessionIntoRuntimes({

      snapshot,

      identity:
        createWrongGuestIdentity(),

      workspaceRuntime:
        wrongGuestTarget.workspaceRuntime,

      researchBridgeRuntime:
        wrongGuestTarget.researchRuntime,

      authorDocumentRuntime:
        wrongGuestTarget.authorRuntime,

    });

  },
  "wrong Guest ownership was accepted",
);

const wrongGuestAfter =
  JSON.stringify(
    wrongGuestTarget.workspaceRuntime.getState(),
  );

assert(
  wrongGuestBefore ===
    wrongGuestAfter,
  "wrong Guest rejection occurred after Workspace mutation",
);

pass(
  "wrong Guest ownership is rejected before mutation",
);


// ============================================================
// PASS 3
// ACCOUNT IDENTITY REJECTED
// ============================================================

const accountTarget =
  createTargetRuntimes();

const accountBefore =
  JSON.stringify(
    accountTarget.workspaceRuntime.getState(),
  );

expectThrow(
  () => {

    restoreGuestWorkspaceSessionIntoRuntimes({

      snapshot,

      identity:
        createAccountIdentity(),

      workspaceRuntime:
        accountTarget.workspaceRuntime,

      researchBridgeRuntime:
        accountTarget.researchRuntime,

      authorDocumentRuntime:
        accountTarget.authorRuntime,

    });

  },
  "Account identity was accepted by Guest restoration",
);

assert(
  accountBefore ===
    JSON.stringify(
      accountTarget.workspaceRuntime.getState(),
    ),
  "Account rejection occurred after Workspace mutation",
);

pass(
  "Account identity is rejected by Guest restoration boundary",
);


// ============================================================
// PASS 4
// INVESTIGATION IDENTITY
// ============================================================

const restoredWorkspaceState =
  target.workspaceRuntime.getState();

assert(
  restoredWorkspaceState.session.investigation !==
    undefined,
  "restoration produced no active Investigation",
);

assert(
  restoredWorkspaceState.session.investigation.id ===
    sourceInvestigation.id,
  "restoration changed Investigation identity",
);

assert(
  restoredWorkspaceState.session.investigation.id !==
    initialTargetInvestigation.id,
  "pre-restoration Investigation survived unexpectedly",
);

pass(
  "persisted Investigation identity is restored exactly",
);


// ============================================================
// PASS 5
// WORKSPACE
// ============================================================

assert(
  restoredWorkspaceState.session.workspace !==
    undefined,
  "restoration produced no active Workspace",
);

assert(
  restoredWorkspaceState.session.workspace.id ===
    sourceInvestigation.workspace.id,
  "persisted Workspace identity was not restored",
);

assert(
  restoredWorkspaceState.session.workspace.name ===
    sourceInvestigation.workspace.name,
  "persisted Workspace state was not restored",
);

pass(
  "persisted Workspace is restored",
);


// ============================================================
// PASS 6
// MODE + LAYOUT
// ============================================================

assert(
  restoredWorkspaceState.operator.activeMode ===
    WorkspaceMode.RESEARCH,
  "persisted Workspace mode was not restored",
);

assert(
  restoredWorkspaceState.operator.layoutMode ===
    WorkspaceLayoutMode.FOCUS,
  "persisted Workspace layout was not restored",
);

pass(
  "Workspace mode and layout are restored",
);


// ============================================================
// PASS 7
// COMPUTATIONAL CONFIGURATION
// ============================================================

assert(
  JSON.stringify(
    restoredWorkspaceState.computational.activeLayers,
  ) ===
    JSON.stringify(
      snapshot.workspace.computational.activeLayers,
    ),
  "computational active layers changed during restoration",
);

assert(
  restoredWorkspaceState.computational.temporalContext ===
    snapshot.workspace.computational.temporalContext,
  "temporal context changed during restoration",
);

assert(
  restoredWorkspaceState.computational.investigativeScale ===
    snapshot.workspace.computational.investigativeScale,
  "investigative scale changed during restoration",
);

pass(
  "computational L/T/S configuration is restored",
);


// ============================================================
// PASS 8
// RESEARCH ANCHOR IDENTITIES
// ============================================================

const restoredDesk =
  target.researchRuntime.getDesk();

assert(
  restoredDesk.entries.length ===
    sourceResearchDesk.entries.length,
  "Research Desk entry count changed",
);

for (
  let index = 0;
  index < sourceResearchDesk.entries.length;
  index++
) {

  assert(
    restoredDesk.entries[index].anchor.anchorId ===
      sourceResearchDesk.entries[index].anchor.anchorId,
    "Research Anchor identity changed during restoration",
  );

}

pass(
  "Research Anchor identities survive restoration",
);


// ============================================================
// PASS 9
// RESEARCH ORDER + PIN STATE
// ============================================================

for (
  let index = 0;
  index < sourceResearchDesk.entries.length;
  index++
) {

  const expected =
    sourceResearchDesk.entries[index];

  const actual =
    restoredDesk.entries[index];

  assert(
    actual.order ===
      expected.order,
    "Research Desk operator order changed during restoration",
  );

  assert(
    actual.anchor.pinned ===
      expected.anchor.pinned,
    "Research Anchor pin state changed during restoration",
  );

}

pass(
  "Research order and pin state survive restoration",
);


// ============================================================
// PASS 10
// AUTHOR DOCUMENT
// ============================================================

const restoredDocument =
  target.authorRuntime.getActiveDocument();

assert(
  restoredDocument !==
    undefined,
  "active Author document was lost during restoration",
);

assert(
  JSON.stringify(
    restoredDocument,
  ) ===
    JSON.stringify(
      sourceAuthorDocument,
    ),
  "active Author document changed during restoration",
);

pass(
  "active Author document survives restoration",
);


// ============================================================
// PASS 11
// ABSENT AUTHOR DOCUMENT CLEARS RUNTIME
// ============================================================

const noDocumentTarget =
  createTargetRuntimes();

const noDocumentSnapshot = {

  ...snapshot,

  authoring: {

    activeDocument:
      undefined,

  },

};

restoreGuestWorkspaceSessionIntoRuntimes({

  snapshot:
    noDocumentSnapshot,

  identity,

  workspaceRuntime:
    noDocumentTarget.workspaceRuntime,

  researchBridgeRuntime:
    noDocumentTarget.researchRuntime,

  authorDocumentRuntime:
    noDocumentTarget.authorRuntime,

});

assert(
  noDocumentTarget.authorRuntime.getActiveDocument() ===
    undefined,
  "absent persisted Author document did not clear runtime document",
);

pass(
  "absent Author document clears existing runtime document",
);


// ============================================================
// PASS 12
// RUNTIME REVISIONS ARE GENERATED, NOT IMPORTED
// ============================================================
//
// Snapshot does not own runtime revision counters.
//
// Restoration must produce runtime publications naturally.
//
// ============================================================

const revisionTarget =
  createTargetRuntimes();

const workspaceRevisionBefore =
  revisionTarget.workspaceRuntime.getState().revision;

const researchRevisionBefore =
  revisionTarget.researchRuntime.getRevision();

const authorRevisionBefore =
  revisionTarget.authorRuntime.getRevision();

restoreGuestWorkspaceSessionIntoRuntimes({

  snapshot,

  identity,

  workspaceRuntime:
    revisionTarget.workspaceRuntime,

  researchBridgeRuntime:
    revisionTarget.researchRuntime,

  authorDocumentRuntime:
    revisionTarget.authorRuntime,

});

const workspaceRevisionAfter =
  revisionTarget.workspaceRuntime.getState().revision;

const researchRevisionAfter =
  revisionTarget.researchRuntime.getRevision();

const authorRevisionAfter =
  revisionTarget.authorRuntime.getRevision();

assert(
  workspaceRevisionAfter >
    workspaceRevisionBefore,
  "Workspace runtime revision did not advance during restoration",
);

assert(
  researchRevisionAfter >
    researchRevisionBefore,
  "Research runtime revision did not advance during restoration",
);

assert(
  authorRevisionAfter >
    authorRevisionBefore,
  "Author runtime revision did not advance during restoration",
);

assert(
  !Object.prototype.hasOwnProperty.call(
    snapshot.workspace,
    "revision",
  ),
  "persisted Workspace unexpectedly contains runtime revision",
);

assert(
  !Object.prototype.hasOwnProperty.call(
    snapshot.research,
    "revision",
  ),
  "persisted Research state unexpectedly contains runtime revision",
);

assert(
  !Object.prototype.hasOwnProperty.call(
    snapshot.authoring,
    "revision",
  ),
  "persisted Author state unexpectedly contains runtime revision",
);

pass(
  "runtime revisions are generated by restoration, not imported",
);


// ============================================================
// PASS 13
// TRANSIENT SELECTION IS NOT RESTORED
// ============================================================
//
// Selection was intentionally excluded from the persistence
// contract.
//
// Restoration therefore must not manufacture a persisted
// selection.
//
// ============================================================

assert(
  !Object.prototype.hasOwnProperty.call(
    snapshot.workspace,
    "selection",
  ),
  "snapshot unexpectedly contains transient selection",
);

assert(
  !JSON.stringify(
    snapshot,
  ).includes(
    '"selection"',
  ),
  "serialized snapshot unexpectedly contains selection state",
);

pass(
  "transient selection remains outside restored canonical state",
);


// ============================================================
// PASS 14
// SNAPSHOT IMMUTABILITY
// ============================================================

const immutableTarget =
  createTargetRuntimes();

const snapshotBeforeRestore =
  JSON.stringify(
    snapshot,
  );

restoreGuestWorkspaceSessionIntoRuntimes({

  snapshot,

  identity,

  workspaceRuntime:
    immutableTarget.workspaceRuntime,

  researchBridgeRuntime:
    immutableTarget.researchRuntime,

  authorDocumentRuntime:
    immutableTarget.authorRuntime,

});

const snapshotAfterRestore =
  JSON.stringify(
    snapshot,
  );

assert(
  snapshotBeforeRestore ===
    snapshotAfterRestore,
  "restoration mutated persisted snapshot",
);

pass(
  "restoration does not mutate persisted snapshot",
);


// ============================================================
// PASS 15
// CAPTURE -> RESTORE -> RECAPTURE
// ============================================================
//
// This is the primary G2 closure test.
//
// Timestamps are metadata rather than investigative state.
//
// We preserve original createdAt and deliberately supply a new
// updatedAt during recapture.
//
// Canonical operational state must otherwise remain equivalent.
//
// ============================================================

const recapturedSnapshot =
  createGuestWorkspaceSnapshotFromRuntimeState({

    identity,

    workspace:
      target.workspaceRuntime.getState(),

    researchDesk:
      target.researchRuntime.getDesk() as ResearchDesk,

    authoring:
      target.authorRuntime.getState(),

    createdAt:
      snapshot.createdAt,

    updatedAt:
      TEST_RECAPTURE_AT,

  });

function canonicalOperationalState(
  value:
    typeof snapshot,
) {

  return {

    ownership:
      value.ownership,

    workspace:
      value.workspace,

    research:
      value.research,

    authoring:
      value.authoring,

  };

}

assert(
  JSON.stringify(
    canonicalOperationalState(
      snapshot,
    ),
  ) ===
    JSON.stringify(
      canonicalOperationalState(
        recapturedSnapshot,
      ),
    ),
  "capture -> restore -> recapture changed canonical operational state",
);

assert(
  recapturedSnapshot.workspace.investigation!.id ===
    snapshot.workspace.investigation!.id,
  "capture -> restore -> recapture changed Investigation identity",
);

assert(
  recapturedSnapshot.createdAt ===
    snapshot.createdAt,
  "recapture changed snapshot creation identity",
);

assert(
  recapturedSnapshot.updatedAt ===
    TEST_RECAPTURE_AT,
  "recapture did not advance update metadata",
);

pass(
  "capture -> restore -> recapture preserves canonical operational state",
);


// ============================================================
// FINAL
// ============================================================

console.log("");

console.log(
  "============================================================",
);

console.log(
  "P56D-I1-G2 GUEST WORKSPACE SESSION RESTORATION VERIFIED",
);

console.log(
  "============================================================",
);

console.log("");

console.log(
  "Verified:",
);

console.log(
  "  matching Guest restoration",
);

console.log(
  "  ownership rejection before mutation",
);

console.log(
  "  Account rejection",
);

console.log(
  "  Investigation identity preservation",
);

console.log(
  "  Workspace restoration",
);

console.log(
  "  Workspace mode/layout restoration",
);

console.log(
  "  computational L/T/S restoration",
);

console.log(
  "  Research Anchor identity preservation",
);

console.log(
  "  Research order and pin-state preservation",
);

console.log(
  "  Author document restoration",
);

console.log(
  "  absent Author document clearing",
);

console.log(
  "  runtime revision regeneration",
);

console.log(
  "  transient-state exclusion",
);

console.log(
  "  snapshot immutability",
);

console.log(
  "  capture -> restore -> recapture closure",
);

console.log("");

console.log(
  "Governing invariant:",
);

console.log(
  "  Runtime(I,R,D) -> Snapshot(I,R,D) -> Runtime(I,R,D)",
);

console.log("");

console.log(
  "  Authentication changes ownership, not investigative identity.",
);

console.log("");
