// ============================================================
// tools/verification/VerifyGuestWorkspaceSessionLifecycle.ts
// P56D-I1-G2
// GUEST WORKSPACE SESSION LIFECYCLE VERIFICATION
//
// Purpose:
//
// Verify the operational lifecycle boundary:
//
//   Guest identity READY / SESSION
//               │
//               ▼
//   GuestWorkspaceSessionLifecycle
//               │
//       ┌───────┴────────┐
//       ▼                ▼
//    STARTUP           LIVE
//       │                │
//    restore          subscribe
//       │                │
//       ▼                ▼
// Workspace         runtime change
// Research               │
// Author                 ▼
//                    capture/save
//
// This verifier exercises the actual singleton lifecycle and
// singleton runtimes used by production integration.
//
// Browser sessionStorage is supplied by a deterministic in-memory
// test implementation.
//
// IMPORTANT:
//
// Guest identity is established through the canonical production
// identity path:
//
//   initialize()
//       -> READY
//
//   continueAsGuest()
//       -> READY / GUEST / SESSION
//
// The verifier does NOT manufacture Guest operator identity.
//
// Governing invariant:
//
//   Runtime(I,R,D)
//       -> Snapshot(I,R,D)
//       -> Runtime(I,R,D)
//
// Authentication changes ownership,
// not investigative identity.
//
// ============================================================

import {
  operatorIdentityRuntime,
} from "../../src/identity/runtime/OperatorIdentityRuntime";

import {
  workspaceRuntime,
} from "../../src/workspace/runtime/WorkspaceRuntime";

import {
  WorkspaceMode,
} from "../../src/workspace/runtime/WorkspaceRuntimeTypes";

import {
  researchBridgeRuntime,
} from "../../src/research/ResearchBridgeRuntime";

import {
  authorDocumentRuntime,
} from "../../src/author/runtime/AuthorDocumentRuntime";

import {
  guestWorkspaceSessionLifecycle,
} from "../../src/workspace/persistence/GuestWorkspaceSessionLifecycle";

import {
  GUEST_WORKSPACE_SESSION_STORAGE_KEY,
  clearGuestWorkspaceSession,
  restoreGuestWorkspaceSession,
} from "../../src/workspace/persistence/GuestWorkspaceSessionPersistence";

import type {
  GuestWorkspaceSessionSnapshot,
} from "../../src/workspace/persistence/GuestWorkspaceSessionPersistenceTypes";

import type {
  ComputationalAuthorDocument,
} from "../../src/author/model/AuthorDocument";

import {
  DEFAULT_INVESTIGATION,
} from "../../src/investigation/defaultInvestigation";


// ============================================================
// OUTPUT
// ============================================================

console.log("");

console.log(
  "============================================================",
);

console.log(
  "P56D-I1-G2 — GUEST WORKSPACE SESSION LIFECYCLE VERIFICATION",
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
// IN-MEMORY SESSION STORAGE
// ============================================================
//
// Identity persistence and Guest workspace persistence both use
// browser sessionStorage.
//
// The verifier therefore supplies one browser-like sessionStorage
// implementation shared by both production persistence paths.
//
// ============================================================

class VerificationSessionStorage {

  private readonly values =
    new Map<string, string>();


  get length():
    number {

    return this.values.size;

  }


  clear():
    void {

    this.values.clear();

  }


  getItem(
    key:
      string,
  ): string | null {

    return this.values.get(
      key,
    ) ?? null;

  }


  key(
    index:
      number,
  ): string | null {

    return Array.from(
      this.values.keys(),
    )[index] ?? null;

  }


  removeItem(
    key:
      string,
  ): void {

    this.values.delete(
      key,
    );

  }


  setItem(
    key:
      string,

    value:
      string,
  ): void {

    this.values.set(
      key,
      value,
    );

  }

}


// ============================================================
// INSTALL WINDOW
// ============================================================

const verificationStorage =
  new VerificationSessionStorage();


Object.defineProperty(
  globalThis,
  "window",
  {

    configurable:
      true,

    value: {

      sessionStorage:
        verificationStorage,

    },

  },
);


// ============================================================
// TEST INVESTIGATION
// ============================================================

const lifecycleInvestigation = {

  ...DEFAULT_INVESTIGATION,

  id:
    "INVESTIGATION-G2-LIFECYCLE",

  name:
    "G2 Lifecycle Investigation",

  workspace: {

    ...DEFAULT_INVESTIGATION.workspace,

    id:
      "WS-G2-LIFECYCLE",

    name:
      "G2 Lifecycle Workspace",

  },

};


// ============================================================
// AUTHOR DOCUMENT
// ============================================================

const lifecycleAuthorDocument = {

  identity:
    "author:g2-lifecycle-document",

  metadata: {

    title:
      "G2 Lifecycle Document",

    type:
      "DOCUMENT",

    status:
      "NEW",

  },

  nodes:
    [],

} as unknown as ComputationalAuthorDocument;


// ============================================================
// IDENTITY HELPERS
// ============================================================
//
// Verification uses the same public path as the real application.
//
// initialize()
//
//   With empty session storage:
//       -> READY / NONE
//
// continueAsGuest()
//
//       -> READY / GUEST / SESSION
//
// OperatorIdentityRuntime owns:
//
//   - Guest operatorId creation
//   - establishedAt creation
//   - Guest identity persistence
//
// ============================================================

function establishGuestIdentity():
  void {

  operatorIdentityRuntime.initialize();


  const initializedState =
    operatorIdentityRuntime.getState();


  assert(
    initializedState.status === "READY",
    "Operator identity runtime did not initialize to READY",
  );


  assert(
    initializedState.identity === null,
    "verification expected READY identity runtime without an identity",
  );


  operatorIdentityRuntime.continueAsGuest();


  const guestState =
    operatorIdentityRuntime.getState();


  assert(
    guestState.status === "READY",
    "Guest identity runtime is not READY",
  );


  assert(
    guestState.identity !== null,
    "continueAsGuest did not establish operator identity",
  );


  assert(
    guestState.identity.kind === "GUEST",
    "continueAsGuest did not establish Guest identity",
  );


  assert(
    guestState.persistence === "SESSION",
    "Guest identity does not use SESSION persistence",
  );

}


// ============================================================
// REQUIRE CURRENT GUEST
// ============================================================

function requireCurrentGuestIdentity() {

  const state =
    operatorIdentityRuntime.getState();


  assert(
    state.status === "READY",
    "operator identity runtime is not READY",
  );


  assert(
    state.identity !== null,
    "Guest identity is not established",
  );


  assert(
    state.identity.kind === "GUEST",
    "current operator identity is not Guest",
  );


  assert(
    state.persistence === "SESSION",
    "current Guest identity is not SESSION persistent",
  );


  return state.identity;

}


// ============================================================
// STORAGE HELPERS
// ============================================================

function readStoredSerializedSnapshot():
  string | null {

  return verificationStorage.getItem(
    GUEST_WORKSPACE_SESSION_STORAGE_KEY,
  );

}


function readStoredSnapshot():
  GuestWorkspaceSessionSnapshot {

  const result =
    restoreGuestWorkspaceSession();


  assert(
    result.status === "RESTORED",
    "expected persisted Guest workspace snapshot",
  );


  return result.snapshot;

}


// ============================================================
// CLEAN START
// ============================================================

guestWorkspaceSessionLifecycle.stop();

verificationStorage.clear();


// ============================================================
// PASS 1
// LIFECYCLE REQUIRES READY GUEST IDENTITY
// ============================================================

expectThrow(
  () => {

    guestWorkspaceSessionLifecycle.start();

  },
  "Guest lifecycle started without established Guest identity",
);


pass(
  "lifecycle rejects startup before Guest identity is established",
);


// ============================================================
// ESTABLISH GUEST IDENTITY THROUGH PRODUCTION API
// ============================================================

establishGuestIdentity();


const establishedGuestIdentity =
  requireCurrentGuestIdentity();


pass(
  "production identity path establishes READY Guest SESSION identity",
);


// ============================================================
// PREPARE FRESH RUNTIMES
// ============================================================

workspaceRuntime.initialize();

workspaceRuntime.activate(
  lifecycleInvestigation.workspace,
);

workspaceRuntime.setActiveInvestigation(
  lifecycleInvestigation,
);

workspaceRuntime.setActiveMode(
  WorkspaceMode.MANIFOLD,
);

workspaceRuntime.setFocusMode(
  false,
);

workspaceRuntime.setComputationalConfiguration({

  activeLayers: [
    "OBSERVABILITY",
    "TEMPORAL",
  ],

  temporalContext:
    undefined,

  investigativeScale:
    undefined,

});


researchBridgeRuntime.clearDesk();

authorDocumentRuntime.clearActiveDocument();

clearGuestWorkspaceSession();


// ============================================================
// PASS 3
// EMPTY STARTUP
// ============================================================

const emptyRestoreBeforeStart =
  restoreGuestWorkspaceSession();


assert(
  emptyRestoreBeforeStart.status ===
    "EMPTY",
  "fresh verification storage was not EMPTY",
);


guestWorkspaceSessionLifecycle.start();


assert(
  guestWorkspaceSessionLifecycle.getState().status ===
    "ACTIVE",
  "Guest lifecycle did not become ACTIVE",
);


assert(
  guestWorkspaceSessionLifecycle.getState().restored ===
    false,
  "EMPTY startup was incorrectly reported as restored",
);


pass(
  "EMPTY Guest workspace session starts fresh and becomes ACTIVE",
);


// ============================================================
// PASS 4
// EXPLICIT CAPTURE
// ============================================================

const explicitSnapshot =
  guestWorkspaceSessionLifecycle.captureNow();


assert(
  explicitSnapshot.ownership.operatorId ===
    establishedGuestIdentity.operatorId,
  "explicit lifecycle capture lost Guest identity",
);


assert(
  explicitSnapshot.workspace.investigation!.id ===
    lifecycleInvestigation.id,
  "explicit lifecycle capture lost Investigation identity",
);


assert(
  readStoredSerializedSnapshot() !==
    null,
  "explicit lifecycle capture did not write sessionStorage",
);


pass(
  "explicit lifecycle capture persists canonical Guest snapshot",
);


// ============================================================
// PASS 5
// WORKSPACE PUBLICATION AUTO-PERSISTS
// ============================================================

const workspaceBefore =
  readStoredSerializedSnapshot();


workspaceRuntime.setActiveMode(
  WorkspaceMode.RESEARCH,
);


const workspaceAfter =
  readStoredSerializedSnapshot();


assert(
  workspaceAfter !==
    null,
  "Workspace publication removed persisted snapshot",
);


assert(
  workspaceAfter !==
    workspaceBefore,
  "Workspace publication did not trigger persistence",
);


const workspaceSnapshot =
  readStoredSnapshot();


assert(
  workspaceSnapshot.workspace.operator.activeMode ===
    WorkspaceMode.RESEARCH,
  "Workspace mode publication was not persisted",
);


pass(
  "Workspace runtime publication automatically persists Guest state",
);


// ============================================================
// PASS 6
// RESEARCH PUBLICATION AUTO-PERSISTS
// ============================================================

const researchBefore =
  readStoredSerializedSnapshot();


researchBridgeRuntime.bridge({

  investigationId:
    lifecycleInvestigation.id,

  graph: {

    type:
      "NODE",

    id:
      "event:g2-lifecycle",

  },

  graphRevision:
    501,

});


const researchAfter =
  readStoredSerializedSnapshot();


assert(
  researchAfter !==
    null,
  "Research publication removed persisted snapshot",
);


assert(
  researchAfter !==
    researchBefore,
  "Research publication did not trigger persistence",
);


const researchSnapshot =
  readStoredSnapshot();


assert(
  researchSnapshot.research.desk.entries.length ===
    1,
  "Research Desk publication was not persisted",
);


assert(
  researchSnapshot.research.desk.entries[0]
    .anchor.anchorId ===
    [
      "research",
      lifecycleInvestigation.id,
      "NODE",
      "event:g2-lifecycle",
    ].join(":"),
  "Research Anchor identity changed during lifecycle persistence",
);


pass(
  "Research runtime publication automatically persists Guest state",
);


// ============================================================
// PASS 7
// AUTHOR PUBLICATION AUTO-PERSISTS
// ============================================================

const authorBefore =
  readStoredSerializedSnapshot();


authorDocumentRuntime.setActiveDocument(
  lifecycleAuthorDocument,
);


const authorAfter =
  readStoredSerializedSnapshot();


assert(
  authorAfter !==
    null,
  "Author publication removed persisted snapshot",
);


assert(
  authorAfter !==
    authorBefore,
  "Author publication did not trigger persistence",
);


const authorSnapshot =
  readStoredSnapshot();


assert(
  authorSnapshot.authoring.activeDocument !==
    undefined,
  "Author publication did not persist active document",
);


assert(
  JSON.stringify(
    authorSnapshot.authoring.activeDocument,
  ) ===
    JSON.stringify(
      lifecycleAuthorDocument,
    ),
  "Author document changed during lifecycle persistence",
);


pass(
  "Author runtime publication automatically persists Guest state",
);


// ============================================================
// CAPTURE CANONICAL PRE-RESTART SNAPSHOT
// ============================================================

const canonicalBeforeRestart =
  guestWorkspaceSessionLifecycle.captureNow();


const serializedBeforeStop =
  readStoredSerializedSnapshot();


assert(
  serializedBeforeStop !==
    null,
  "canonical pre-restart snapshot was not stored",
);


// ============================================================
// PASS 8
// STOP DETACHES LIVE SYNCHRONIZATION
// ============================================================

guestWorkspaceSessionLifecycle.stop();


assert(
  guestWorkspaceSessionLifecycle.getState().status ===
    "STOPPED",
  "Guest lifecycle did not enter STOPPED state",
);


const stoppedStorage =
  readStoredSerializedSnapshot();


workspaceRuntime.setActiveMode(
  WorkspaceMode.OVERVIEW,
);


assert(
  readStoredSerializedSnapshot() ===
    stoppedStorage,
  "Workspace publication persisted after lifecycle stop",
);


researchBridgeRuntime.clearDesk();


assert(
  readStoredSerializedSnapshot() ===
    stoppedStorage,
  "Research publication persisted after lifecycle stop",
);


authorDocumentRuntime.clearActiveDocument();


assert(
  readStoredSerializedSnapshot() ===
    stoppedStorage,
  "Author publication persisted after lifecycle stop",
);


pass(
  "stop detaches Workspace, Research, and Author persistence subscriptions",
);


// ============================================================
// DELIBERATELY DISTURB LIVE RUNTIMES
// ============================================================
//
// Storage still owns the canonical pre-stop snapshot.
//
// Live runtime state is now intentionally different.
//
// Restart must restore storage into the runtimes.
//
// ============================================================

workspaceRuntime.activate(
  DEFAULT_INVESTIGATION.workspace,
);

workspaceRuntime.setActiveInvestigation(
  DEFAULT_INVESTIGATION,
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


researchBridgeRuntime.clearDesk();

authorDocumentRuntime.clearActiveDocument();


// ============================================================
// PASS 9
// VALID SNAPSHOT RESTORES ON RESTART
// ============================================================

guestWorkspaceSessionLifecycle.start();


assert(
  guestWorkspaceSessionLifecycle.getState().status ===
    "ACTIVE",
  "restarted lifecycle did not become ACTIVE",
);


assert(
  guestWorkspaceSessionLifecycle.getState().restored ===
    true,
  "valid persisted snapshot was not reported as restored",
);


pass(
  "valid persisted Guest snapshot restores on lifecycle restart",
);


// ============================================================
// PASS 10
// INVESTIGATION IDENTITY SURVIVES RESTART
// ============================================================

const restoredWorkspaceState =
  workspaceRuntime.getState();


assert(
  restoredWorkspaceState.session.investigation !==
    undefined,
  "restart restoration produced no Investigation",
);


assert(
  restoredWorkspaceState.session.investigation.id ===
    lifecycleInvestigation.id,
  "restart restoration changed Investigation identity",
);


assert(
  restoredWorkspaceState.session.workspace?.id ===
    lifecycleInvestigation.workspace.id,
  "restart restoration changed Workspace identity",
);


pass(
  "Investigation and Workspace identity survive lifecycle restart",
);


// ============================================================
// PASS 11
// MODE / COMPUTATIONAL STATE SURVIVES RESTART
// ============================================================

assert(
  restoredWorkspaceState.operator.activeMode ===
    WorkspaceMode.RESEARCH,
  "Workspace mode did not survive lifecycle restart",
);


assert(
  JSON.stringify(
    restoredWorkspaceState.computational.activeLayers,
  ) ===
    JSON.stringify(
      canonicalBeforeRestart.workspace
        .computational.activeLayers,
    ),
  "computational configuration did not survive lifecycle restart",
);


pass(
  "Workspace mode and computational configuration survive restart",
);


// ============================================================
// PASS 12
// RESEARCH STATE SURVIVES RESTART
// ============================================================

const restoredDesk =
  researchBridgeRuntime.getDesk();


assert(
  restoredDesk.entries.length ===
    canonicalBeforeRestart.research.desk.entries.length,
  "Research Desk entry count did not survive restart",
);


assert(
  restoredDesk.entries[0]?.anchor.anchorId ===
    canonicalBeforeRestart.research.desk.entries[0]
      ?.anchor.anchorId,
  "Research Anchor identity did not survive restart",
);


pass(
  "Research Desk and Anchor identity survive lifecycle restart",
);


// ============================================================
// PASS 13
// AUTHOR STATE SURVIVES RESTART
// ============================================================

const restoredAuthorDocument =
  authorDocumentRuntime.getActiveDocument();


assert(
  restoredAuthorDocument !==
    undefined,
  "Author document did not survive lifecycle restart",
);


assert(
  JSON.stringify(
    restoredAuthorDocument,
  ) ===
    JSON.stringify(
      lifecycleAuthorDocument,
    ),
  "Author document changed across lifecycle restart",
);


pass(
  "active Author document survives lifecycle restart",
);


// ============================================================
// PASS 14
// RESTORE DOES NOT FEEDBACK-PERSIST INTERMEDIATE STATE
// ============================================================
//
// start() attaches runtime subscriptions only AFTER restoration.
//
// Therefore storage must still contain the canonical snapshot
// that existed before restart.
//
// Restore must not rewrite storage with intermediate:
//
//   Workspace restored
//   Research stale
//   Author stale
//
// state.
//
// ============================================================

const serializedAfterRestore =
  readStoredSerializedSnapshot();


assert(
  serializedAfterRestore ===
    serializedBeforeStop,
  "restoration rewrote persisted state during startup",
);


pass(
  "restoration does not persistence-feedback intermediate runtime state",
);


// ============================================================
// PASS 15
// POST-RESTORE LIVE SYNCHRONIZATION RESUMES
// ============================================================

const postRestoreBefore =
  readStoredSerializedSnapshot();


workspaceRuntime.setActiveMode(
  WorkspaceMode.TIMELINE,
);


const postRestoreAfter =
  readStoredSerializedSnapshot();


assert(
  postRestoreAfter !==
    null,
  "post-restore runtime publication removed persisted snapshot",
);


assert(
  postRestoreAfter !==
    postRestoreBefore,
  "live persistence did not resume after restoration",
);


assert(
  readStoredSnapshot().workspace.operator.activeMode ===
    WorkspaceMode.TIMELINE,
  "post-restore Workspace publication was not persisted",
);


pass(
  "live automatic persistence resumes after restoration",
);


// ============================================================
// PASS 16
// COMPLETE LIFECYCLE CLOSURE
// ============================================================
//
// PASS 15 intentionally changes active mode.
//
// Identity-bearing canonical state must nevertheless remain:
//
//   same Guest operator
//   same Investigation
//   same Research Desk
//   same Author document
//
// ============================================================

const finalSnapshot =
  guestWorkspaceSessionLifecycle.captureNow();


assert(
  finalSnapshot.ownership.operatorId ===
    canonicalBeforeRestart.ownership.operatorId,
  "lifecycle closure changed Guest ownership",
);


assert(
  finalSnapshot.workspace.investigation!.id ===
    canonicalBeforeRestart.workspace.investigation!.id,
  "lifecycle closure changed Investigation identity",
);


assert(
  JSON.stringify(
    finalSnapshot.research,
  ) ===
    JSON.stringify(
      canonicalBeforeRestart.research,
    ),
  "lifecycle closure changed Research state",
);


assert(
  JSON.stringify(
    finalSnapshot.authoring,
  ) ===
    JSON.stringify(
      canonicalBeforeRestart.authoring,
    ),
  "lifecycle closure changed Author state",
);


pass(
  "capture -> storage -> restore -> live persistence preserves identity-bearing canonical state",
);


// ============================================================
// CLEANUP
// ============================================================

guestWorkspaceSessionLifecycle.stop();

clearGuestWorkspaceSession();


// ============================================================
// FINAL
// ============================================================

console.log("");

console.log(
  "============================================================",
);

console.log(
  "P56D-I1-G2 GUEST WORKSPACE SESSION LIFECYCLE VERIFIED",
);

console.log(
  "============================================================",
);

console.log("");

console.log(
  "Verified:",
);

console.log(
  "  lifecycle rejects missing Guest identity",
);

console.log(
  "  production Guest identity establishment path",
);

console.log(
  "  READY / GUEST / SESSION identity",
);

console.log(
  "  EMPTY workspace startup behavior",
);

console.log(
  "  lifecycle activation",
);

console.log(
  "  explicit canonical capture",
);

console.log(
  "  Workspace-triggered automatic persistence",
);

console.log(
  "  Research-triggered automatic persistence",
);

console.log(
  "  Author-triggered automatic persistence",
);

console.log(
  "  lifecycle stop / unsubscribe behavior",
);

console.log(
  "  valid snapshot restoration on restart",
);

console.log(
  "  Investigation identity across restart",
);

console.log(
  "  Workspace identity across restart",
);

console.log(
  "  computational state across restart",
);

console.log(
  "  Research Anchor identity across restart",
);

console.log(
  "  Author document across restart",
);

console.log(
  "  restoration feedback suppression",
);

console.log(
  "  post-restore live synchronization",
);

console.log(
  "  complete Guest lifecycle closure",
);

console.log("");

console.log(
  "Governing invariant:",
);

console.log(
  "  Runtime(I,R,D) -> Storage(I,R,D) -> Runtime(I,R,D)",
);

console.log("");

console.log(
  "  Authentication changes ownership, not investigative identity.",
);

console.log("");
