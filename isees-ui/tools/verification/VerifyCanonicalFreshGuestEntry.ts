// ============================================================
// P57-UI-A6-I2B
// CANONICAL FRESH GUEST ENTRY VERIFICATION
// ============================================================

import {
  EMPTY_WORKSPACE,
  DEFAULT_WORKSPACE,
} from "../../src/workspace/defaultWorkspace";

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
    `PASS ${passNumber} — ${message}`,
  );
}

console.log("");
console.log(
  "============================================================",
);
console.log(
  "P57-UI-A6-I2B — CANONICAL FRESH GUEST ENTRY",
);
console.log(
  "============================================================",
);
console.log("");

const runtime =
  new WorkspaceRuntime();

const initialState =
  runtime.getState();

assert(
  initialState.session.investigation ===
    undefined,
  "fresh runtime manufactured an Investigation",
);

pass(
  "fresh runtime has no active Investigation",
);

assert(
  initialState.session.workspace ===
    undefined,
  "fresh runtime manufactured a canonical Workspace",
);

pass(
  "fresh runtime has no canonical Workspace",
);

assert(
  initialState.session.focusedEvent ===
    undefined,
  "fresh runtime manufactured a focused event",
);

pass(
  "fresh runtime has no focused event",
);

assert(
  initialState.operator.activeMode ===
    WorkspaceMode.OVERVIEW,
  "fresh runtime did not enter OVERVIEW",
);

pass(
  "fresh runtime enters OVERVIEW",
);

assert(
  initialState.operator.selection ===
    undefined,
  "fresh runtime manufactured operator selection",
);

pass(
  "fresh runtime has no operator selection",
);

assert(
  EMPTY_WORKSPACE.imported_events.length ===
    0 &&
  EMPTY_WORKSPACE.focused_event_id ===
    null,
  "legacy empty shell contains a case or focus",
);

pass(
  "legacy compatibility shell has no case or focus",
);

assert(
  EMPTY_WORKSPACE.artifacts.length ===
    0 &&
  EMPTY_WORKSPACE.active_layers.length ===
    0,
  "legacy empty shell contains artifacts or layers",
);

pass(
  "legacy compatibility shell has no artifacts or layers",
);

assert(
  DEFAULT_WORKSPACE.focused_event_id ===
    "E-TICTAC-2004" &&
  DEFAULT_WORKSPACE.imported_events.some(
    reference =>
      reference.event_id ===
      "E-TICTAC-2004",
  ),
  "explicit Nimitz demonstration fixture was lost",
);

pass(
  "Nimitz remains available as an explicit demonstration fixture",
);

runtime.activate(
  DEFAULT_INVESTIGATION.workspace,
);

runtime.setActiveInvestigation(
  DEFAULT_INVESTIGATION,
);

assert(
  runtime.getActiveInvestigation()?.id ===
    DEFAULT_INVESTIGATION.id &&
  runtime.getWorkspace()?.focused_event_id ===
    "E-TICTAC-2004",
  "explicit canonical activation failed",
);

pass(
  "explicit activation still installs a real Investigation",
);

console.log("");
console.log(
  "============================================================",
);
console.log(
  `P57-UI-A6-I2B VERIFIED — ${passNumber} PASS`,
);
console.log(
  "============================================================",
);
console.log("");