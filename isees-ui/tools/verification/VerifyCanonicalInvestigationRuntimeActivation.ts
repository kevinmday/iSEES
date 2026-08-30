// ============================================================
// P57-UI-A7-I1B
// CANONICAL INVESTIGATION RUNTIME ACTIVATION VERIFICATION
// ============================================================

import {
  SystemCanonAdapter,
} from "../../src/federation/adapters/SystemCanonAdapter";

import type {
  FederationAdapter,
} from "../../src/federation/adapters/FederationAdapter";

import {
  importInvestigationIntoWorkspace,
} from "../../src/federation/services/importInvestigation";

import {
  WorkspaceRuntime,
} from "../../src/workspace/runtime/WorkspaceRuntime";

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

async function verify(): Promise<void> {
  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "P57-UI-A7-I1B — CANONICAL INTAKE RUNTIME ACTIVATION",
  );
  console.log(
    "============================================================",
  );
  console.log("");

  const systemCanon =
    new SystemCanonAdapter();

  let placeholderImportCalled =
    false;

  const adapter:
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
      eventId =>
        systemCanon.preview(
          eventId,
        ),

    import:
      async () => {
        placeholderImportCalled =
          true;

        throw new Error(
          "placeholder adapter import must remain bypassed",
        );
      },
  };

  const runtime =
    new WorkspaceRuntime();

  let notificationCount =
    0;

  let observedPartialOwnership =
    false;

  const unsubscribe =
    runtime.subscribe(
      () => {
        notificationCount += 1;

        const state =
          runtime.getState();

        if (
          state.session.workspace !==
            undefined &&
          state.session.investigation ===
            undefined
        ) {
          observedPartialOwnership =
            true;
        }
      },
    );

  const result =
    await importInvestigationIntoWorkspace(
      adapter,
      "E-TICTAC-2004",
      runtime,
    );

  unsubscribe();

  assert(
    !placeholderImportCalled,
    "canonical intake called placeholder adapter import",
  );

  console.log(
    "PASS 1 — canonical bridge bypasses placeholder adapter import",
  );

  assert(
    runtime.getActiveInvestigation() ===
      result.investigation,
    "runtime did not install the exact canonical Investigation",
  );

  console.log(
    "PASS 2 — runtime installs the exact canonical Investigation",
  );

  assert(
    runtime.getWorkspace() ===
      result.investigation.workspace,
    "runtime did not activate the exact owning Workspace",
  );

  console.log(
    "PASS 3 — runtime activates the exact owning Workspace",
  );

  assert(
    runtime.getWorkspace()
      ?.focused_event_id ===
      "E-TICTAC-2004",
    "runtime did not preserve canonical event focus",
  );

  console.log(
    "PASS 4 — canonical runtime Workspace exposes event focus to MANIFOLD consumers",
  );

  assert(
    runtime.getSelection() ===
      undefined,
    "runtime activation manufactured operator selection",
  );

  console.log(
    "PASS 5 — runtime activation manufactures no operator selection",
  );

  assert(
    notificationCount === 1,
    `canonical activation published ${notificationCount} runtime notifications instead of one`,
  );

  assert(
    !observedPartialOwnership,
    "observer saw Workspace without its owning Investigation",
  );

  console.log(
    "PASS 6 — canonical Investigation and Workspace publish atomically",
  );

  console.log("");
  console.log(
    "P57-UI-A7-I1B VERIFIED — 6 PASS",
  );
  console.log("");
}

void verify().catch(
  error => {
    console.error(error);
    process.exitCode = 1;
  },
);
