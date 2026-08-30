// ============================================================
// P57-UI-A6-I2A
// CANONICAL EMPTY GUEST WORKSPACE VERIFICATION
// ============================================================

import {
  WorkspaceRuntime,
} from "../../src/workspace/runtime/WorkspaceRuntime";

import {
  WorkspaceMode,
} from "../../src/workspace/runtime/WorkspaceRuntimeTypes";

import type {
  OperatorIdentityState,
} from "../../src/identity/runtime/OperatorIdentityRuntimeTypes";

import type {
  ResearchDesk,
} from "../../src/research/researchBridgeTypes";

import {
  ResearchBridgeRuntime,
} from "../../src/research/ResearchBridgeRuntime";

import {
  AuthorDocumentRuntime,
} from "../../src/author/runtime/AuthorDocumentRuntime";

import {
  DEFAULT_INVESTIGATION,
} from "../../src/investigation/defaultInvestigation";

import {
  assertGuestWorkspaceInvestigationIdentity,
  createGuestWorkspaceSnapshotFromRuntimeState,
} from "../../src/workspace/persistence/GuestWorkspaceSessionSnapshotFactory";

import {
  isGuestWorkspaceSessionSnapshot,
} from "../../src/workspace/persistence/GuestWorkspaceSessionPersistence";

import {
  restoreGuestWorkspaceSessionIntoRuntimes,
} from "../../src/workspace/persistence/GuestWorkspaceSessionRestorer";

let passNumber = 0;

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(
      `VERIFICATION FAILED: ${message}`,
    );
  }
}

function expectThrow(
  operation: () => void,
  message: string,
): void {
  let threw = false;

  try {
    operation();
  } catch {
    threw = true;
  }

  assert(
    threw,
    message,
  );
}

function pass(
  message: string,
): void {
  passNumber += 1;
  console.log(
    `PASS ${passNumber} — ${message}`,
  );
}

const identity: OperatorIdentityState = {
  status:
    "READY",

  identity: {
    operatorId:
      "guest:p57-ui-a6-i2a-empty",

    kind:
      "GUEST",

    establishedAt:
      "2026-08-30T17:00:00.000Z",
  },

  persistence:
    "SESSION",

  revision:
    1,
};

function createEmptyWorkspaceRuntime():
  WorkspaceRuntime {
  const runtime =
    new WorkspaceRuntime();

  runtime.initialize();
  runtime.deactivate();
  runtime.setActiveMode(
    WorkspaceMode.OVERVIEW,
  );
  runtime.setFocusMode(
    false,
  );
  runtime.setComputationalConfiguration({
    activeLayers:
      [],

    temporalContext:
      undefined,

    investigativeScale:
      undefined,
  });

  return runtime;
}

function createResearchRuntime():
  ResearchBridgeRuntime {
  const runtime =
    new ResearchBridgeRuntime();

  runtime.restoreDesk({
    entries:
      [],
  });

  return runtime;
}

console.log("");
console.log(
  "============================================================",
);
console.log(
  "P57-UI-A6-I2A — CANONICAL EMPTY GUEST WORKSPACE",
);
console.log(
  "============================================================",
);
console.log("");

const sourceWorkspace =
  createEmptyWorkspaceRuntime();

const sourceResearch =
  createResearchRuntime();

const sourceAuthor =
  new AuthorDocumentRuntime();

const emptySnapshot =
  createGuestWorkspaceSnapshotFromRuntimeState({
    identity,

    workspace:
      sourceWorkspace.getState(),

    researchDesk:
      sourceResearch.getDesk() as ResearchDesk,

    authoring:
      sourceAuthor.getState(),

    createdAt:
      "2026-08-30T17:00:00.000Z",

    updatedAt:
      "2026-08-30T17:00:01.000Z",
  });

assert(
  emptySnapshot.workspace.investigation ===
    undefined,
  "empty capture manufactured an Investigation",
);

assert(
  emptySnapshot.workspace.workspace ===
    undefined,
  "empty capture manufactured a Workspace",
);

pass(
  "empty Guest runtime captures without manufacturing domain state",
);

assert(
  emptySnapshot.ownership.kind ===
    "GUEST" &&
  emptySnapshot.ownership.operatorId ===
    identity.identity?.operatorId,
  "empty capture lost Guest ownership",
);

pass(
  "empty capture preserves Guest ownership",
);

assert(
  emptySnapshot.workspace.operator.activeMode ===
    WorkspaceMode.OVERVIEW,
  "empty capture did not preserve OVERVIEW mode",
);

pass(
  "empty capture preserves OVERVIEW mode",
);

assert(
  isGuestWorkspaceSessionSnapshot(
    emptySnapshot,
  ),
  "canonical empty snapshot failed structural validation",
);

pass(
  "canonical empty version-1 snapshot passes structural validation",
);

const ownerlessWorkspaceSnapshot = {
  ...emptySnapshot,

  workspace: {
    ...emptySnapshot.workspace,

    workspace:
      DEFAULT_INVESTIGATION.workspace,
  },
};

assert(
  !isGuestWorkspaceSessionSnapshot(
    ownerlessWorkspaceSnapshot,
  ),
  "Workspace without owning Investigation passed validation",
);

pass(
  "Workspace without owning Investigation is rejected",
);

const targetWorkspace =
  new WorkspaceRuntime();

targetWorkspace.initialize();
targetWorkspace.activate(
  DEFAULT_INVESTIGATION.workspace,
);
targetWorkspace.setActiveInvestigation(
  DEFAULT_INVESTIGATION,
);
targetWorkspace.setActiveMode(
  WorkspaceMode.MANIFOLD,
);

const targetResearch =
  createResearchRuntime();

const targetAuthor =
  new AuthorDocumentRuntime();

const restoreResult =
  restoreGuestWorkspaceSessionIntoRuntimes({
    snapshot:
      emptySnapshot,

    identity,

    workspaceRuntime:
      targetWorkspace,

    researchBridgeRuntime:
      targetResearch,

    authorDocumentRuntime:
      targetAuthor,
  });

assert(
  restoreResult.restored ===
    true,
  "empty snapshot did not restore successfully",
);

pass(
  "empty Guest snapshot restores successfully",
);

const restoredState =
  targetWorkspace.getState();

assert(
  restoredState.session.investigation ===
    undefined &&
  restoredState.session.workspace ===
    undefined &&
  restoredState.session.focusedEvent ===
    undefined,
  "empty restoration retained or manufactured domain state",
);

pass(
  "empty restoration clears Investigation, Workspace, and focused event",
);

assert(
  restoredState.operator.activeMode ===
    WorkspaceMode.OVERVIEW &&
  restoredState.operator.layoutMode ===
    "NORMAL",
  "empty restoration did not return to normal OVERVIEW",
);

pass(
  "empty restoration returns to normal OVERVIEW",
);

assert(
  restoredState.computational.activeLayers.length ===
    0 &&
  restoredState.computational.temporalContext ===
    undefined &&
  restoredState.computational.investigativeScale ===
    undefined,
  "empty restoration retained computational configuration",
);

pass(
  "empty restoration clears computational configuration",
);

assert(
  restoreResult.investigationId ===
    undefined,
  "empty restoration reported a fabricated Investigation identity",
);

pass(
  "empty restoration reports no fabricated Investigation identity",
);

assertGuestWorkspaceInvestigationIdentity(
  emptySnapshot,
  targetWorkspace.getState(),
);

pass(
  "absent snapshot and runtime Investigation identities agree",
);

const populatedRuntime =
  new WorkspaceRuntime();

populatedRuntime.initialize();
populatedRuntime.activate(
  DEFAULT_INVESTIGATION.workspace,
);
populatedRuntime.setActiveInvestigation(
  DEFAULT_INVESTIGATION,
);

expectThrow(
  () =>
    assertGuestWorkspaceInvestigationIdentity(
      emptySnapshot,
      populatedRuntime.getState(),
    ),
  "absent snapshot versus populated runtime was accepted",
);

pass(
  "absent snapshot versus populated runtime is rejected",
);

const populatedSnapshot =
  createGuestWorkspaceSnapshotFromRuntimeState({
    identity,

    workspace:
      populatedRuntime.getState(),

    researchDesk:
      sourceResearch.getDesk() as ResearchDesk,

    authoring:
      sourceAuthor.getState(),

    createdAt:
      "2026-08-30T17:00:00.000Z",

    updatedAt:
      "2026-08-30T17:00:01.000Z",
  });

expectThrow(
  () =>
    assertGuestWorkspaceInvestigationIdentity(
      populatedSnapshot,
      targetWorkspace.getState(),
    ),
  "populated snapshot versus absent runtime was accepted",
);

pass(
  "populated snapshot versus absent runtime is rejected",
);

console.log("");
console.log(
  "============================================================",
);
console.log(
  `P57-UI-A6-I2A VERIFIED — ${passNumber} PASS`,
);
console.log(
  "============================================================",
);
console.log("");