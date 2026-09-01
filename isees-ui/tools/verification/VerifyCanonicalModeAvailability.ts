// ============================================================
// P57-UI-A8-I0
// CANONICAL WORKSPACE MODE AVAILABILITY VERIFICATION
// ============================================================

import {
  WorkspaceRuntime,
} from "../../src/workspace/runtime/WorkspaceRuntime";

import {
  WorkspaceMode,
} from "../../src/workspace/runtime/WorkspaceRuntimeTypes";

import {
  DEFAULT_INVESTIGATION,
} from "../../src/investigation/defaultInvestigation";

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

function pass(
  message: string,
): void {

  passNumber += 1;

  console.log(
    `PASS ${passNumber} ? ${message}`,
  );

}

console.log("");
console.log(
  "============================================================",
);
console.log(
  "P57-UI-A8-I0 ? CANONICAL MODE AVAILABILITY",
);
console.log(
  "============================================================",
);
console.log("");

const runtime =
  new WorkspaceRuntime();

const caseDependentModes = [

  WorkspaceMode.MANIFOLD,
  WorkspaceMode.COMPARE,
  WorkspaceMode.NARRATIVE,
  WorkspaceMode.EVIDENCE,
  WorkspaceMode.TIMELINE,
  WorkspaceMode.LAYERS,
  WorkspaceMode.INTENTION,
  WorkspaceMode.RESEARCH,

] as const;

assert(
  runtime.getModeAvailability(
    WorkspaceMode.OVERVIEW,
  ).available,
  "fresh runtime made OVERVIEW unavailable",
);

pass(
  "OVERVIEW is available in a canonical empty workspace",
);

for (
  const mode
  of caseDependentModes
) {

  const availability =
    runtime.getModeAvailability(
      mode,
    );

  assert(
    availability.available === false,
    `fresh runtime made ${mode} available`,
  );

  assert(
    availability.reason !== undefined &&
    availability.reason.length > 0,
    `${mode} has no unavailable reason`,
  );

}

pass(
  "all case-dependent modes are unavailable without an Investigation",
);

const revisionBeforeRejectedTransitions =
  runtime.getState().revision;

let notifications = 0;

const unsubscribe =
  runtime.subscribe(
    () => {

      notifications += 1;

    },
  );

for (
  const mode
  of caseDependentModes
) {

  runtime.setActiveMode(
    mode,
  );

}

unsubscribe();

assert(
  runtime.getActiveMode() ===
    WorkspaceMode.OVERVIEW,
  "rejected mode transition changed active mode",
);

assert(
  runtime.getState().revision ===
    revisionBeforeRejectedTransitions,
  "rejected mode transition incremented runtime revision",
);

assert(
  notifications === 0,
  "rejected mode transition notified persistence observers",
);

pass(
  "invalid empty-workspace transitions produce no mutation or notification",
);

runtime.setActiveInvestigation(
  DEFAULT_INVESTIGATION,
);

for (
  const mode
  of caseDependentModes
) {

  assert(
    runtime.getModeAvailability(
      mode,
    ).available,
    `${mode} remained unavailable after Investigation activation`,
  );

}

pass(
  "activating an Investigation enables every case-dependent mode",
);

const revisionBeforeValidTransition =
  runtime.getState().revision;

runtime.setActiveMode(
  WorkspaceMode.MANIFOLD,
);

assert(
  runtime.getActiveMode() ===
    WorkspaceMode.MANIFOLD,
  "valid MANIFOLD transition was rejected",
);

assert(
  runtime.getState().revision ===
    revisionBeforeValidTransition + 1,
  "valid MANIFOLD transition did not publish one revision",
);

pass(
  "valid case-dependent transition publishes exactly one revision",
);

runtime.setActiveMode(
  WorkspaceMode.OVERVIEW,
);

assert(
  runtime.getActiveMode() ===
    WorkspaceMode.OVERVIEW,
  "OVERVIEW could not be restored",
);

pass(
  "OVERVIEW remains available after Investigation activation",
);

console.log("");
console.log(
  "============================================================",
);
console.log(
  `P57-UI-A8-I0 VERIFIED ? ${passNumber} PASS`,
);
console.log(
  "============================================================",
);
console.log("");
