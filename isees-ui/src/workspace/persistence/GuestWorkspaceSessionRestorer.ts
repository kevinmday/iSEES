// ============================================================
// src/workspace/persistence/GuestWorkspaceSessionRestorer.ts
// P56D-I1-G2
// GUEST WORKSPACE SESSION RESTORER
//
// Deterministic restoration boundary:
//
//   validated GuestWorkspaceSessionSnapshot
//                    ↓
//            live runtime state
//
// Restoration uses runtime-owned public mutation APIs.
//
// It does NOT:
//
//   - mutate private runtime state
//   - reconstruct Investigation identity
//   - reconstruct Research Anchor identity
//   - reconstruct Author document identity
//   - restore runtime revision counters
//   - restore transient selection state
//   - authenticate an account
//   - perform Guest -> Account transition
//   - participate in Resolve computation
//
// Governing invariant:
//
//   restore(identity-bearing state)
//              ↓
//   same investigative identity
//
// Authentication changes ownership,
// not investigative identity.
//
// ============================================================

import type {
  OperatorIdentityState,
} from "../../identity/runtime/OperatorIdentityRuntimeTypes";

import type {
  WorkspaceRuntime,
} from "../runtime/WorkspaceRuntime";

import type {
  ResearchBridgeRuntime,
} from "../../research/ResearchBridgeRuntime";

import type {
  AuthorDocumentRuntime,
} from "../../author/runtime/AuthorDocumentRuntime";

import type {
  GuestWorkspaceSessionSnapshot,
} from "./GuestWorkspaceSessionPersistenceTypes";

import {
  rehydrateOperationalRevisionInvestigation,
} from "../../investigation/revision/OperationalGraphRevision";


// ============================================================
// RESTORATION DEPENDENCIES
// ============================================================
//
// Runtime instances are injected explicitly.
//
// The restorer does not import singleton instances.
//
// This keeps:
//
//   snapshot + runtimes
//          ↓
//      restoration
//
// independently verifiable.
//
// ============================================================

export interface GuestWorkspaceSessionRestorerDependencies {

  workspaceRuntime:
    WorkspaceRuntime;

  researchBridgeRuntime:
    ResearchBridgeRuntime;

  authorDocumentRuntime:
    AuthorDocumentRuntime;

}


// ============================================================
// RESTORE INPUT
// ============================================================

export interface GuestWorkspaceSessionRestoreInput
  extends GuestWorkspaceSessionRestorerDependencies {

  snapshot:
    GuestWorkspaceSessionSnapshot;

  identity:
    OperatorIdentityState;

}


// ============================================================
// RESTORE RESULT
// ============================================================
//
// Runtime revision numbers are deliberately not part of this
// result.
//
// Revisions are runtime publications caused by restoration,
// not persisted canonical state.
//
// ============================================================

export interface GuestWorkspaceSessionRestoreResult {

  restored:
    true;

  operatorId:
    string;

  investigationId?:
    string;

  researchEntryCount:
    number;

  authorDocumentRestored:
    boolean;

}


// ============================================================
// REQUIRE ACTIVE GUEST
// ============================================================
//
// A persisted Guest workspace may only be restored into the same
// established Guest identity.
//
// This prevents:
//
//   Guest A snapshot
//       ↓
//   Guest B runtime
//
// and prevents Guest persistence from being silently applied to
// an authenticated Account runtime.
//
// ============================================================

function requireMatchingGuestIdentity(
  snapshot:
    GuestWorkspaceSessionSnapshot,

  identityState:
    OperatorIdentityState,
) {

  const identity =
    identityState.identity;

  if (
    identity === null
  ) {
    throw new Error(
      "Cannot restore Guest workspace without an established operator identity.",
    );
  }

  if (
    identity.kind !== "GUEST"
  ) {
    throw new Error(
      "Cannot restore Guest workspace into a non-Guest operator.",
    );
  }

  if (
    identityState.persistence !== "SESSION"
  ) {
    throw new Error(
      "Guest workspace restoration requires SESSION persistence policy.",
    );
  }

  if (
    snapshot.ownership.kind !== "GUEST"
  ) {
    throw new Error(
      "Cannot restore workspace snapshot with non-Guest ownership.",
    );
  }

  if (
    snapshot.ownership.operatorId !==
    identity.operatorId
  ) {
    throw new Error(
      [
        "Guest workspace ownership mismatch.",
        `Snapshot=${snapshot.ownership.operatorId}`,
        `Runtime=${identity.operatorId}`,
      ].join(" "),
    );
  }

  return identity;

}


// ============================================================
// REQUIRE INVESTIGATION IDENTITY
// ============================================================

function validateOptionalSnapshotInvestigationIdentity(
  snapshot:
    GuestWorkspaceSessionSnapshot,
): string | undefined {

  const investigation =
    snapshot.workspace.investigation;

  if (investigation === undefined) {
    if (snapshot.workspace.workspace !== undefined) {
      throw new Error(
        "Cannot restore Guest workspace without its owning Investigation.",
      );
    }

    return undefined;
  }

  const investigationId =
    investigation.id;

  if (
    typeof investigationId !== "string" ||
    investigationId.length === 0
  ) {
    throw new Error(
      "Cannot restore Guest workspace with invalid Investigation identity.",
    );
  }

  return investigationId;

}


// ============================================================
// RESTORE WORKSPACE
// ============================================================
//
// Ordering matters.
//
// First:
//
//   activate persisted Workspace
//
// Then:
//
//   restore persisted Investigation
//
// Then:
//
//   restore operator presentation state
//
// Then:
//
//   restore computational configuration C = (L,T,S)
//
// We intentionally use the WorkspaceRuntime's existing public
// mutation APIs rather than assigning runtime state.
//
// ============================================================

function restoreWorkspace(
  snapshot:
    GuestWorkspaceSessionSnapshot,

  runtime:
    WorkspaceRuntime,
): void {

  const persisted =
    snapshot.workspace;

  const investigation =
    persisted.investigation;

  if (investigation === undefined) {
    if (persisted.workspace !== undefined) {
      throw new Error(
        "Cannot restore Guest workspace without its owning Investigation.",
      );
    }

    runtime.deactivate();
    runtime.setActiveMode("OVERVIEW");
    runtime.setFocusMode(false);
    runtime.setComputationalConfiguration({
      activeLayers: [],
      temporalContext: undefined,
      investigativeScale: undefined,
    });
    return;
  }

  // ----------------------------------------------------------
  // WORKSPACE
  // ----------------------------------------------------------

  if (
    persisted.workspace !== undefined
  ) {

    runtime.activate(
      persisted.workspace,
    );

  } else {

    // Investigation owns its canonical Workspace.
    //
    // If a future schema omits the redundant persisted Workspace
    // field, the Investigation remains sufficient to recover the
    // operational Workspace identity.

    runtime.activate(
      investigation.workspace,
    );

  }

  // ----------------------------------------------------------
  // INVESTIGATION
  // ----------------------------------------------------------

  const runtimeInvestigation =
    investigation.revisions.length > 0 ||
    investigation.currentRevisionId !== undefined
      ? rehydrateOperationalRevisionInvestigation(
          investigation,
        )
      : investigation;

  runtime.setActiveInvestigation(
    runtimeInvestigation,
  );

  // ----------------------------------------------------------
  // ACTIVE MODE
  // ----------------------------------------------------------

  runtime.setActiveMode(
    persisted.operator.activeMode,
  );

  // ----------------------------------------------------------
  // LAYOUT / FOCUS MODE
  // ----------------------------------------------------------
  //
  // WorkspaceRuntime currently exposes layout restoration through
  // setFocusMode rather than through direct layout assignment.
  //
  // NORMAL -> false
  // FOCUS  -> true
  //
  // This preserves runtime ownership of layout semantics.
  // ----------------------------------------------------------

  runtime.setFocusMode(
    persisted.operator.layoutMode ===
      "FOCUS",
  );

  // ----------------------------------------------------------
  // COMPUTATIONAL CONFIGURATION
  // ----------------------------------------------------------

  runtime.setComputationalConfiguration({

    activeLayers: [
      ...persisted.computational.activeLayers,
    ],

    temporalContext:
      persisted.computational.temporalContext,

    investigativeScale:
      persisted.computational.investigativeScale,

  });

}


// ============================================================
// RESTORE RESEARCH
// ============================================================
//
// Research state must be restored atomically.
//
// Do NOT replay bridge().
//
// bridge() creates a new Research Anchor from graph state.
//
// The persisted Desk already owns canonical Research Anchor
// identity and ordering.
//
// ============================================================

function restoreResearch(
  snapshot:
    GuestWorkspaceSessionSnapshot,

  runtime:
    ResearchBridgeRuntime,
): void {

  runtime.restoreDesk(
    snapshot.research.desk,
  );

}


// ============================================================
// RESTORE AUTHORING
// ============================================================
//
// AuthorDocumentRuntime already owns both:
//
//   setActiveDocument()
//   clearActiveDocument()
//
// Therefore no direct state mutation is required.
//
// Runtime revision state is intentionally not restored. Browser restoration is
// not canonical persistence proof, so the document is dirty until Studio
// reconciliation proves equality with the current canonical version.
//
// ============================================================

function restoreAuthoring(
  snapshot:
    GuestWorkspaceSessionSnapshot,

  runtime:
    AuthorDocumentRuntime,
): boolean {

  const document =
    snapshot.authoring.activeDocument;

  if (
    document === undefined
  ) {

    runtime.clearActiveDocument();

    return false;

  }

  runtime.restoreActiveDocument(
    document,
  );

  return true;

}


// ============================================================
// ASSERT RESTORED INVESTIGATION IDENTITY
// ============================================================
//
// This is the most important postcondition in G2.
//
// The runtime must emerge from restoration owning the exact
// Investigation identity persisted in the snapshot.
//
// ============================================================

function assertRestoredInvestigationIdentity(
  snapshot:
    GuestWorkspaceSessionSnapshot,

  runtime:
    WorkspaceRuntime,
): void {

  const restored =
    runtime.getState().session.investigation;

  const persisted =
    snapshot.workspace.investigation;

  if (
    restored === undefined &&
    persisted === undefined
  ) {
    return;
  }

  if (
    restored === undefined ||
    persisted === undefined ||
    restored.id !== persisted.id
  ) {
    throw new Error(
      [
        "Guest workspace restoration changed Investigation identity.",
        `Snapshot=${persisted?.id ?? "NONE"}`,
        `Runtime=${restored?.id ?? "NONE"}`,
      ].join(" "),
    );
  }

}


// ============================================================
// ASSERT RESTORED RESEARCH STATE
// ============================================================
//
// Research Anchor identity and operator ordering must survive.
//
// We compare the canonical persisted representation after the
// runtime has accepted the Desk.
//
// ============================================================

function assertRestoredResearchState(
  snapshot:
    GuestWorkspaceSessionSnapshot,

  runtime:
    ResearchBridgeRuntime,
): void {

  const restored =
    runtime.getDesk();

  if (
    restored.entries.length !==
    snapshot.research.desk.entries.length
  ) {
    throw new Error(
      "Guest workspace restoration changed Research Desk entry count.",
    );
  }

  for (
    let index = 0;
    index < snapshot.research.desk.entries.length;
    index++
  ) {

    const expected =
      snapshot.research.desk.entries[index];

    const actual =
      restored.entries[index];

    if (
      actual === undefined
    ) {
      throw new Error(
        "Guest workspace restoration lost Research Desk entry.",
      );
    }

    if (
      actual.anchor.anchorId !==
      expected.anchor.anchorId
    ) {
      throw new Error(
        [
          "Guest workspace restoration changed Research Anchor identity.",
          `Expected=${expected.anchor.anchorId}`,
          `Actual=${actual.anchor.anchorId}`,
        ].join(" "),
      );
    }

    if (
      actual.order !==
      expected.order
    ) {
      throw new Error(
        [
          "Guest workspace restoration changed Research Desk ordering.",
          `Expected=${expected.order}`,
          `Actual=${actual.order}`,
        ].join(" "),
      );
    }

  }

}


// ============================================================
// ASSERT RESTORED AUTHOR DOCUMENT
// ============================================================

function assertRestoredAuthoringState(
  snapshot:
    GuestWorkspaceSessionSnapshot,

  runtime:
    AuthorDocumentRuntime,
): void {

  const expected =
    snapshot.authoring.activeDocument;

  const actual =
    runtime.getActiveDocument();

  if (
    expected === undefined
  ) {

    if (
      actual !== undefined
    ) {
      throw new Error(
        "Guest workspace restoration retained an unexpected Author document.",
      );
    }

    return;

  }

  if (
    actual === undefined
  ) {
    throw new Error(
      "Guest workspace restoration lost the active Author document.",
    );
  }

  // ----------------------------------------------------------
  // We deliberately compare the canonical serialized document
  // rather than assuming a particular identity field here.
  //
  // Author document identity remains domain-owned.
  // ----------------------------------------------------------

  if (
    JSON.stringify(actual) !==
    JSON.stringify(expected)
  ) {
    throw new Error(
      "Guest workspace restoration changed the active Author document.",
    );
  }

}


// ============================================================
// RESTORE GUEST WORKSPACE SESSION
// ============================================================
//
// Restoration is deliberately explicit and ordered:
//
//   1. validate ownership
//   2. validate Investigation identity
//   3. restore Workspace/Investigation/configuration
//   4. restore Research Desk
//   5. restore Author document
//   6. assert identity-bearing postconditions
//
// No storage access occurs here.
//
// The caller is responsible for:
//
//   restoreGuestWorkspaceSession()
//       ↓
//   validated snapshot
//       ↓
//   restoreGuestWorkspaceSessionIntoRuntimes()
//
// ============================================================

export function restoreGuestWorkspaceSessionIntoRuntimes(
  input:
    GuestWorkspaceSessionRestoreInput,
): GuestWorkspaceSessionRestoreResult {

  const identity =
    requireMatchingGuestIdentity(
      input.snapshot,
      input.identity,
    );

  const investigationId =
    validateOptionalSnapshotInvestigationIdentity(
      input.snapshot,
    );

  restoreWorkspace(
    input.snapshot,
    input.workspaceRuntime,
  );

  restoreResearch(
    input.snapshot,
    input.researchBridgeRuntime,
  );

  const authorDocumentRestored =
    restoreAuthoring(
      input.snapshot,
      input.authorDocumentRuntime,
    );

  // ----------------------------------------------------------
  // POSTCONDITIONS
  // ----------------------------------------------------------

  assertRestoredInvestigationIdentity(
    input.snapshot,
    input.workspaceRuntime,
  );

  assertRestoredResearchState(
    input.snapshot,
    input.researchBridgeRuntime,
  );

  assertRestoredAuthoringState(
    input.snapshot,
    input.authorDocumentRuntime,
  );

  return {

    restored:
      true,

    operatorId:
      identity.operatorId,

    investigationId,

    researchEntryCount:
      input.snapshot.research.desk.entries.length,

    authorDocumentRestored,

  };

}


// ============================================================
// ARCHITECTURAL INVARIANTS
// ============================================================
//
// RESTORE MUST PRESERVE:
//
//   Guest operator ownership
//   Investigation identity
//   Workspace identity/state
//   active Workspace mode
//   layout/focus state
//   computational configuration C = (L,T,S)
//   Research Anchor identity
//   Research ordering
//   Research pin state
//   Author document identity/content
//
// RESTORE MUST NOT RESTORE:
//
//   WorkspaceRuntime.revision
//   ResearchBridgeRuntime.revision
//   AuthorDocumentRuntime.revision
//   AuthorDocumentRuntime.dirty
//   transient selection
//   listeners
//
// RESTORE MUST NOT:
//
//   manufacture Investigation identity
//   manufacture Research Anchor identity
//   manufacture Author document identity
//   replay Research bridge operations
//   alter Resolve mathematics
//   perform authentication
//
// Therefore:
//
//   Snapshot(I, R, D)
//          |
//          v
//   Runtime(I, R, D)
//
// and:
//
//   identity(I_snapshot)
//       ===
//   identity(I_runtime)
//
// ============================================================
