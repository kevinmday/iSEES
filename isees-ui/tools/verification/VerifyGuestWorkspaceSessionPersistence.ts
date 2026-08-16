// ============================================================
// tools/verification/VerifyGuestWorkspaceSessionPersistence.ts
// P56D-I1-G2
// GUEST WORKSPACE SESSION PERSISTENCE VERIFICATION
//
// Purpose:
//
// Verify the deterministic Guest workspace persistence contract
// before any live WorkspaceRuntime integration occurs.
//
// This verifier proves:
//
//   1. canonical Guest snapshot construction
//   2. Guest operator identity preservation
//   3. Investigation identity preservation
//   4. computational configuration preservation
//   5. Research Desk preservation
//   6. Author document identity preservation
//   7. valid snapshot structural acceptance
//   8. malformed snapshot rejection
//   9. incompatible schema rejection
//  10. runtime-only status/revision exclusion
//  11. deterministic equivalent representation
//  12. Investigation identity serialization round-trip
//
// IMPORTANT:
//
// This verifier does NOT:
//
//   - mutate WorkspaceRuntime
//   - mutate ResearchBridgeRuntime
//   - mutate AuthorDocumentRuntime
//   - mutate KnowledgeObjectRuntime
//   - access browser sessionStorage
//   - authenticate an account
//   - perform Guest -> Account transition
//
// ============================================================

import {
  GUEST_WORKSPACE_SESSION_SCHEMA_VERSION,
  preservesInvestigationIdentity,
} from "../../src/workspace/persistence/GuestWorkspaceSessionPersistenceTypes";

import type {
  GuestWorkspaceSessionSnapshot,
} from "../../src/workspace/persistence/GuestWorkspaceSessionPersistenceTypes";

import {
  createGuestWorkspaceSessionSnapshot,
  isGuestWorkspaceSessionSnapshot,
} from "../../src/workspace/persistence/GuestWorkspaceSessionPersistence";

import {
  DEFAULT_INVESTIGATION,
} from "../../src/investigation/defaultInvestigation";

import {
  WorkspaceLayoutMode,
  WorkspaceMode,
} from "../../src/workspace/runtime/WorkspaceRuntimeTypes";

import type {
  ComputationalAuthorDocument,
} from "../../src/author/model/AuthorDocument";

import type {
  ResearchDesk,
} from "../../src/research/researchBridgeTypes";


// ============================================================
// OUTPUT
// ============================================================

console.log("");
console.log(
  "============================================================",
);

console.log(
  "P56D-I1-G2 — GUEST WORKSPACE SESSION PERSISTENCE VERIFICATION",
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
// CANONICAL TEST IDENTITIES
// ============================================================
//
// Fixed values are intentional.
//
// Verification must not depend upon:
//
//   crypto.randomUUID()
//   current time
//   browser state
//
// ============================================================

const TEST_OPERATOR_ID =
  "guest:verification-operator";

const TEST_ESTABLISHED_AT =
  "2026-08-16T12:00:00.000Z";

const TEST_CREATED_AT =
  "2026-08-16T12:01:00.000Z";

const TEST_UPDATED_AT =
  "2026-08-16T12:02:00.000Z";


// ============================================================
// TEST INVESTIGATION
// ============================================================
//
// Reuse the canonical Investigation contract already accepted by
// the live WorkspaceRuntime.
//
// Clone the object so the verifier cannot accidentally mutate the
// imported default singleton object.
//
// ============================================================

const testInvestigation = {
  ...DEFAULT_INVESTIGATION,
};


// ============================================================
// TEST RESEARCH DESK
// ============================================================
//
// Empty Research state is sufficient for the persistence boundary
// contract itself.
//
// Research Anchor identity behavior is verified elsewhere by the
// Research Bridge.
//
// G2 runtime integration can later add a non-empty restore test.
//
// ============================================================

const testResearchDesk:
  ResearchDesk = {

  entries: [],

};


// ============================================================
// TEST AUTHOR DOCUMENT
// ============================================================
//
// The Author model may contain richer canonical content.
//
// For this boundary verifier we need a real structurally typed
// document only to prove that the artifact identity survives the
// snapshot representation.
//
// The verifier intentionally derives the exact object shape from
// the canonical TypeScript contract rather than changing that
// contract.
//
// ============================================================

const testAuthorDocument = {

  identity:
    "author:verification-document",

  metadata: {

    title:
      "G2 Verification Document",

    type:
      "DOCUMENT",

    status:
      "NEW",

  },

  nodes:
    [],

} as unknown as ComputationalAuthorDocument;


// ============================================================
// CANONICAL SNAPSHOT INPUT
// ============================================================

function createVerificationSnapshot():
  GuestWorkspaceSessionSnapshot {

  return createGuestWorkspaceSessionSnapshot({

    ownership: {

      kind:
        "GUEST",

      operatorId:
        TEST_OPERATOR_ID,

      establishedAt:
        TEST_ESTABLISHED_AT,

    },

    createdAt:
      TEST_CREATED_AT,

    updatedAt:
      TEST_UPDATED_AT,

    workspace: {

      investigation:
        testInvestigation,

      operator: {

        activeMode:
          WorkspaceMode.MANIFOLD,

        layoutMode:
          WorkspaceLayoutMode.NORMAL,

      },

      computational: {

        activeLayers:
          [],

        temporalContext:
          undefined,

        investigativeScale:
          undefined,

      },

    },

    research: {

      desk:
        testResearchDesk,

    },

    authoring: {

      activeDocument:
        testAuthorDocument,

    },

  });

}


// ============================================================
// SNAPSHOT
// ============================================================

const snapshot =
  createVerificationSnapshot();


// ============================================================
// PASS 1
// CANONICAL SNAPSHOT CONSTRUCTION
// ============================================================

assert(
  snapshot.schemaVersion ===
    GUEST_WORKSPACE_SESSION_SCHEMA_VERSION,
  "canonical Guest workspace snapshot did not receive schema version",
);

assert(
  snapshot.createdAt ===
    TEST_CREATED_AT,
  "canonical snapshot did not preserve supplied createdAt",
);

assert(
  snapshot.updatedAt ===
    TEST_UPDATED_AT,
  "canonical snapshot did not preserve supplied updatedAt",
);

pass(
  "canonical Guest workspace snapshot can be constructed",
);


// ============================================================
// PASS 2
// GUEST OPERATOR IDENTITY
// ============================================================

assert(
  snapshot.ownership.kind ===
    "GUEST",
  "snapshot ownership is not GUEST",
);

assert(
  snapshot.ownership.operatorId ===
    TEST_OPERATOR_ID,
  "Guest operator identity changed during snapshot construction",
);

assert(
  snapshot.ownership.establishedAt ===
    TEST_ESTABLISHED_AT,
  "Guest identity establishment metadata changed",
);

pass(
  "snapshot preserves Guest operator identity",
);


// ============================================================
// PASS 3
// INVESTIGATION IDENTITY
// ============================================================

assert(
  snapshot.workspace.investigation.id ===
    testInvestigation.id,
  "Investigation identity changed during snapshot construction",
);

assert(
  preservesInvestigationIdentity(
    testInvestigation,
    snapshot.workspace.investigation,
  ),
  "Investigation identity helper rejected preserved identity",
);

pass(
  "snapshot preserves Investigation identity",
);


// ============================================================
// PASS 4
// COMPUTATIONAL CONFIGURATION
// ============================================================

assert(
  Array.isArray(
    snapshot.workspace.computational.activeLayers,
  ),
  "activeLayers did not survive snapshot construction",
);

assert(
  snapshot.workspace.computational.activeLayers.length ===
    0,
  "activeLayers changed during snapshot construction",
);

assert(
  snapshot.workspace.computational.temporalContext ===
    undefined,
  "temporalContext changed during snapshot construction",
);

assert(
  snapshot.workspace.computational.investigativeScale ===
    undefined,
  "investigativeScale changed during snapshot construction",
);

assert(
  snapshot.workspace.operator.activeMode ===
    WorkspaceMode.MANIFOLD,
  "Workspace active mode changed during snapshot construction",
);

assert(
  snapshot.workspace.operator.layoutMode ===
    WorkspaceLayoutMode.NORMAL,
  "Workspace layout mode changed during snapshot construction",
);

pass(
  "snapshot preserves Workspace computational configuration",
);


// ============================================================
// PASS 5
// RESEARCH DESK
// ============================================================

assert(
  Array.isArray(
    snapshot.research.desk.entries,
  ),
  "Research Desk entries were not preserved",
);

assert(
  snapshot.research.desk.entries.length ===
    testResearchDesk.entries.length,
  "Research Desk entry count changed",
);

pass(
  "snapshot preserves Research Desk state",
);


// ============================================================
// PASS 6
// AUTHOR DOCUMENT IDENTITY
// ============================================================
//
// Because the exact canonical Author document identity field is
// domain-owned, compare the serialized artifact representation.
//
// The important persistence invariant here is that construction
// does not manufacture or replace the supplied document.
//
// ============================================================

assert(
  snapshot.authoring.activeDocument ===
    testAuthorDocument,
  "Author document reference was replaced during snapshot construction",
);

const serializedAuthorDocument =
  JSON.stringify(
    snapshot.authoring.activeDocument,
  );

assert(
  serializedAuthorDocument.includes(
    "author:verification-document",
  ),
  "Author document identity did not survive snapshot representation",
);

pass(
  "snapshot preserves Author document identity",
);


// ============================================================
// PASS 7
// VALID SNAPSHOT ACCEPTANCE
// ============================================================

assert(
  isGuestWorkspaceSessionSnapshot(
    snapshot,
  ),
  "valid canonical snapshot failed structural validation",
);

pass(
  "valid Guest workspace snapshot passes structural validation",
);


// ============================================================
// PASS 8
// MALFORMED SNAPSHOT REJECTION
// ============================================================

const malformedSnapshot:
  unknown = {

  schemaVersion:
    GUEST_WORKSPACE_SESSION_SCHEMA_VERSION,

  ownership: {

    kind:
      "GUEST",

    operatorId:
      TEST_OPERATOR_ID,

    establishedAt:
      TEST_ESTABLISHED_AT,

  },

  createdAt:
    TEST_CREATED_AT,

  updatedAt:
    TEST_UPDATED_AT,

  workspace: {

    // Investigation intentionally missing.

    operator: {

      activeMode:
        WorkspaceMode.MANIFOLD,

      layoutMode:
        WorkspaceLayoutMode.NORMAL,

    },

    computational: {

      activeLayers:
        [],

    },

  },

  research: {

    desk: {

      entries:
        [],

    },

  },

  authoring: {},

};

assert(
  !isGuestWorkspaceSessionSnapshot(
    malformedSnapshot,
  ),
  "malformed snapshot was incorrectly accepted",
);

pass(
  "malformed Guest workspace snapshot is rejected",
);


// ============================================================
// PASS 9
// INCOMPATIBLE SCHEMA REJECTION
// ============================================================

const incompatibleSchemaSnapshot:
  unknown = {

  ...snapshot,

  schemaVersion:
    999,

};

assert(
  !isGuestWorkspaceSessionSnapshot(
    incompatibleSchemaSnapshot,
  ),
  "incompatible persistence schema was incorrectly accepted",
);

pass(
  "incompatible Guest workspace schema version is rejected",
);


// ============================================================
// PASS 10
// RUNTIME-ONLY STATE EXCLUSION
// ============================================================
//
// Runtime lifecycle state must not accidentally become canonical
// persistence state.
//
// The persistence contract deliberately excludes:
//
//   WorkspaceRuntime.status
//   WorkspaceRuntime.revision
//
// ============================================================

const persistedWorkspaceKeys =
  Object.keys(
    snapshot.workspace,
  );

assert(
  !persistedWorkspaceKeys.includes(
    "status",
  ),
  "Workspace runtime status leaked into persisted state",
);

assert(
  !persistedWorkspaceKeys.includes(
    "revision",
  ),
  "Workspace runtime revision leaked into persisted state",
);

const snapshotKeys =
  Object.keys(
    snapshot,
  );

assert(
  !snapshotKeys.includes(
    "revision",
  ),
  "runtime revision leaked into canonical snapshot root",
);

assert(
  !snapshotKeys.includes(
    "status",
  ),
  "runtime status leaked into canonical snapshot root",
);

pass(
  "runtime status and revision remain outside persisted contract",
);


// ============================================================
// PASS 11
// DETERMINISTIC REPRESENTATION
// ============================================================
//
// Equivalent canonical inputs with fixed metadata must serialize
// identically.
//
// ============================================================

const snapshotAgain =
  createVerificationSnapshot();

const serializedSnapshot =
  JSON.stringify(
    snapshot,
  );

const serializedSnapshotAgain =
  JSON.stringify(
    snapshotAgain,
  );

assert(
  serializedSnapshot ===
    serializedSnapshotAgain,
  "equivalent Guest workspace snapshots serialized differently",
);

pass(
  "equivalent Guest workspace input produces deterministic representation",
);


// ============================================================
// PASS 12
// SERIALIZATION ROUND-TRIP
// ============================================================
//
// This simulates the essential JSON boundary used by
// sessionStorage without requiring a browser.
//
// ============================================================

const roundTripUnknown:
  unknown =
    JSON.parse(
      serializedSnapshot,
    );

assert(
  isGuestWorkspaceSessionSnapshot(
    roundTripUnknown,
  ),
  "serialized Guest workspace snapshot failed restoration validation",
);

const roundTripSnapshot =
  roundTripUnknown;

assert(
  roundTripSnapshot.workspace.investigation.id ===
    snapshot.workspace.investigation.id,
  "Investigation identity changed across JSON serialization round-trip",
);

assert(
  preservesInvestigationIdentity(
    snapshot.workspace.investigation,
    roundTripSnapshot.workspace.investigation,
  ),
  "Investigation identity invariant failed across serialization round-trip",
);

pass(
  "Investigation identity survives Guest workspace serialization round-trip",
);


// ============================================================
// FINAL
// ============================================================

console.log("");

console.log(
  "============================================================",
);

console.log(
  "P56D-I1-G2 GUEST WORKSPACE SESSION PERSISTENCE VERIFIED",
);

console.log(
  "============================================================",
);

console.log("");

console.log(
  "Verified:",
);

console.log(
  "  canonical Guest workspace snapshot construction",
);

console.log(
  "  Guest operator identity preservation",
);

console.log(
  "  Investigation identity preservation",
);

console.log(
  "  Workspace computational configuration preservation",
);

console.log(
  "  Research Desk preservation",
);

console.log(
  "  Author document preservation",
);

console.log(
  "  structural validation",
);

console.log(
  "  malformed snapshot rejection",
);

console.log(
  "  incompatible schema rejection",
);

console.log(
  "  runtime-only state exclusion",
);

console.log(
  "  deterministic equivalent serialization",
);

console.log(
  "  Investigation identity JSON round-trip preservation",
);

console.log("");

console.log(
  "Governing invariant:",
);

console.log(
  "  Authentication changes ownership, not investigative identity.",
);

console.log("");
