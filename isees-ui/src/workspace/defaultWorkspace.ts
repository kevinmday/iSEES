// ============================================================
// DEFAULT WORKSPACE
// P23.2 WORKSPACE FOCUS FOUNDATION
// ============================================================

import type {
  Workspace,
} from "./workspaceTypes";

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

  active_layers: [

    "OBSERVABILITY",
    "NARRATIVE",
    "TEMPORAL",
  ],

  created_at:
    new Date().toISOString(),
};