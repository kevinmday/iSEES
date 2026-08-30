// ============================================================
// DEFAULT WORKSPACE
// P24.1 ARTIFACT FOUNDATION
// ============================================================

import type {
  Workspace,
} from "./workspaceTypes";

// ============================================================
// EMPTY WORKSPACE SHELL
// ============================================================
//
// Compatibility state for legacy WorkspaceContext consumers.
//
// This is not an Investigation and contains no imported case,
// focused event, artifact, or computational layer.
//
// Canonical Investigation ownership remains exclusively inside
// WorkspaceRuntime.
// ============================================================

export const EMPTY_WORKSPACE:
  Workspace = {

  id:
    "WS-UNESTABLISHED",

  name:
    "Workspace Ready",

  description:
    "No active investigation.",

  imported_events:
    [],

  focused_event_id:
    null,

  investigations:
    [],

  artifacts:
    [],

  active_layers:
    [],

  created_at:
    new Date().toISOString(),

};


// ============================================================
// EXPLICIT NIMITZ DEMONSTRATION WORKSPACE
// ============================================================
export const DEFAULT_WORKSPACE:
  Workspace = {

  id:
    "WS-NIMITZ-001",

  name:
    "Nimitz Investigation",

  description:
    "Default workspace seeded from System Canon.",

  imported_events: [

    {
      event_id:
        "E-TICTAC-2004",

      source:
        "SYSTEM_CANON",
    },
  ],

  focused_event_id:
    "E-TICTAC-2004",

  investigations: [],

  artifacts: [],

  active_layers: [

    "OBSERVABILITY",
    "NARRATIVE",
    "TEMPORAL",
  ],

  created_at:
    new Date().toISOString(),
};