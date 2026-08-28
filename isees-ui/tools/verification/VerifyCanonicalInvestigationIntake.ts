// ============================================================
// tools/verification/VerifyCanonicalInvestigationIntake.ts
// P57-UI-A4-I1
// CANONICAL INVESTIGATION INTAKE VERIFICATION
// ============================================================

import {
  SystemCanonAdapter,
} from "../../src/federation/adapters/SystemCanonAdapter";

import type {
  FederationAdapter,
  FederationRepository,
} from "../../src/federation/adapters/FederationAdapter";

import {
  createCanonicalInvestigationFromCorpusEvent,
  importInvestigation,
} from "../../src/federation/services/importInvestigation";

// ============================================================
// ASSERTIONS
// ============================================================

function assert(
  condition: unknown,
  message: string,
): asserts condition {

  if (!condition) {

    throw new Error(
      `FAIL: ${message}`,
    );

  }

}

async function assertRejects(
  action: () => Promise<unknown> | unknown,
  expectedMessage: string,
): Promise<void> {

  let rejected = false;

  try {

    await action();

  }
  catch (error) {

    rejected = true;

    assert(
      error instanceof Error,
      "rejection must produce an Error",
    );

    assert(
      error.message.includes(
        expectedMessage,
      ),
      `rejection must include: ${expectedMessage}`,
    );

  }

  assert(
    rejected,
    "operation must reject",
  );

}

function pass(
  number: number,
  message: string,
): void {

  console.log(
    `PASS ${number} — ${message}`,
  );

}

// ============================================================
// VERIFICATION
// ============================================================

async function verify(): Promise<void> {

  console.log(`
============================================================
P57-UI-A4-I1 — CANONICAL INVESTIGATION INTAKE VERIFICATION
============================================================
`);

  const systemCanon =
    new SystemCanonAdapter();

  const eventId =
    "E-TICTAC-2004";

  const preview =
    await systemCanon.preview(
      eventId,
    );

  assert(
    preview.event
      .canonical_event
      .event_id === eventId,
    "System Canon must resolve the Nimitz event",
  );

  pass(
    1,
    "System Canon resolves E-TICTAC-2004 as a real CorpusEvent",
  );

  const sourceBefore =
    JSON.stringify(
      preview.event,
    );

  const investigation =
    createCanonicalInvestigationFromCorpusEvent(
      systemCanon.repository,
      preview.event,
    );

  assert(
    investigation.id ===
      "INV-SYSTEM_CANON-E-TICTAC-2004",
    "investigation identity must be deterministic",
  );

  assert(
    investigation.name ===
      "Nimitz Tic Tac Encounter",
    "canonical event name must survive intake",
  );

  assert(
    investigation.status ===
      "ACTIVE",
    "imported investigation must be active",
  );

  pass(
    2,
    "Nimitz becomes a canonical active Investigation",
  );

  assert(
    investigation.createdAt ===
      preview.event.created_at,
    "created_at must survive exactly",
  );

  assert(
    investigation.updatedAt ===
      preview.event.updated_at,
    "updated_at must survive exactly",
  );

  assert(
    investigation.createdBy ===
      systemCanon.repository.authority,
    "repository authority must survive intake",
  );

  pass(
    3,
    "source timestamps and repository authority survive exactly",
  );

  assert(
    investigation.workspace
      .imported_events.length === 1,
    "workspace must contain exactly one imported reference",
  );

  const importedReference =
    investigation.workspace
      .imported_events[0];

  assert(
    importedReference !== undefined,
    "imported reference must exist",
  );

  assert(
    importedReference.event_id ===
      eventId,
    "workspace reference must preserve canonical event identity",
  );

  assert(
    importedReference.source ===
      "SYSTEM_CANON",
    "workspace reference must preserve System Canon ownership",
  );

  assert(
    investigation.workspace
      .focused_event_id === eventId,
    "imported event must become the workspace focus",
  );

  pass(
    4,
    "workspace reference and focus preserve canonical event ownership",
  );

  assert(
    JSON.stringify(
      preview.event,
    ) === sourceBefore,
    "intake must not mutate the source CorpusEvent",
  );

  pass(
    5,
    "canonical construction leaves the source CorpusEvent unchanged",
  );

  const repeated =
    createCanonicalInvestigationFromCorpusEvent(
      systemCanon.repository,
      preview.event,
    );

  assert(
    JSON.stringify(
      repeated,
    ) ===
    JSON.stringify(
      investigation,
    ),
    "equivalent input must produce byte-identical Investigation output",
  );

  pass(
    6,
    "repeated canonical construction is byte-identical",
  );

  const serializedInvestigation =
    JSON.stringify(
      investigation,
    ).toLowerCase();

  assert(
    !serializedInvestigation.includes(
      "observability",
    ),
    "intake must not manufacture observability state",
  );

  assert(
    !serializedInvestigation.includes(
      '"confidence"',
    ),
    "intake must not manufacture confidence values",
  );

  assert(
    !serializedInvestigation.includes(
      '"reports"',
    ),
    "intake must not manufacture report counts",
  );

  assert(
    !serializedInvestigation.includes(
      '"clusters"',
    ),
    "intake must not manufacture cluster counts",
  );

  pass(
    7,
    "Nimitz intake manufactures no observability or numerical defaults",
  );

  let adapterImportCalled =
    false;

  const truthfulAdapter:
    FederationAdapter = {

    repository:
      systemCanon.repository,

    load:
      () => systemCanon.load(),

    search:
      request =>
        systemCanon.search(
          request,
        ),

    preview:
      requestedEventId =>
        systemCanon.preview(
          requestedEventId,
        ),

    import:
      async () => {

        adapterImportCalled =
          true;

        throw new Error(
          "placeholder adapter import must not be called",
        );

      },

  };

  const imported =
    await importInvestigation(
      truthfulAdapter,
      eventId,
    );

  assert(
    !adapterImportCalled,
    "canonical intake must not call the placeholder adapter import",
  );

  assert(
    imported.investigation.id ===
      investigation.id,
    "adapter intake must return the canonical Investigation",
  );

  assert(
    imported.repositoryId ===
      "SYSTEM_CANON",
    "adapter intake must preserve repository identity",
  );

  assert(
    imported.eventId ===
      eventId,
    "adapter intake must preserve requested event identity",
  );

  pass(
    8,
    "intake retrieves through preview and bypasses false placeholder imports",
  );

  const unsupportedRepository:
    FederationRepository = {

    ...systemCanon.repository,

    id:
      "AARO",

    name:
      "AARO",

    authority:
      "United States Department of Defense",

  };

  await assertRejects(

    () =>
      createCanonicalInvestigationFromCorpusEvent(
        unsupportedRepository,
        preview.event,
      ),

    "canonical external-repository provenance is not implemented",

  );

  pass(
    9,
    "external repositories fail closed until provenance is canonical",
  );

  const mismatchedAdapter:
    FederationAdapter = {

    ...truthfulAdapter,

    preview:
      async requestedEventId => {

        const result =
          await systemCanon.preview(
            requestedEventId,
          );

        return {

          ...result,

          repositoryId:
            "RESEARCH_CANON",

        };

      },

  };

  await assertRejects(

    () =>
      importInvestigation(
        mismatchedAdapter,
        eventId,
      ),

    "preview repository identity does not match",

  );

  pass(
    10,
    "repository identity mismatch is rejected before installation",
  );

  console.log(`
============================================================
P57-UI-A4-I1 CANONICAL INVESTIGATION INTAKE VERIFIED
============================================================

Verified:
  Federation adapter -> real CorpusEvent retrieval
  CorpusEvent -> canonical Investigation construction
  deterministic Investigation and Workspace identities
  exact event identity and timestamp preservation
  repository authority preservation
  source immutability
  byte-identical repeated construction
  no manufactured observability values
  no manufactured numerical defaults
  placeholder adapter imports are bypassed
  unsupported external provenance fails closed
  repository identity mismatch fails closed

Canonical installation owner:
  WorkspaceRuntime.setActiveInvestigation()

Availability owner:
  Resolve feature extraction

Nimitz invariant:
  Missing observation data remains missing until Resolve assigns
  canonical UNAVAILABLE status.
`);

}

// ============================================================
// ENTRY
// ============================================================

void verify().catch(
  error => {

    console.error(error);

    process.exitCode = 1;

  },
);

