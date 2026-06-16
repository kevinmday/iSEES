// ============================================================
// WORKSPACE DOMAIN MODEL
// P23 FOUNDATION
// ============================================================

export type WorkspaceReferenceSource =
  | "SYSTEM_CANON"
  | "RESEARCH_CANON"
  | "LIVE_EVENT";

export type WorkspaceReference = {

  event_id: string;

  source:
    WorkspaceReferenceSource;
};

export type WorkspaceInvestigation = {

  id: string;

  title: string;

  created_at: string;

  notes: string[];
};

export type Workspace = {

  id: string;

  name: string;

  description: string;

  imported_events:
    WorkspaceReference[];

  focused_event_id:
    string | null;

  investigations:
    WorkspaceInvestigation[];

  active_layers:
    string[];

  created_at: string;
};