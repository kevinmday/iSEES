CREATE TABLE IF NOT EXISTS research_graph_source (
    anchor_id TEXT PRIMARY KEY, investigation_id TEXT NOT NULL, principal_id TEXT NOT NULL,
    source_workspace TEXT NOT NULL, source_kind TEXT NOT NULL, source_identity TEXT NOT NULL,
    graph_identity TEXT NOT NULL, graph_type TEXT NOT NULL, graph_id TEXT NOT NULL,
    graph_revision INTEGER NOT NULL, classification TEXT NOT NULL, insertion_state TEXT NOT NULL,
    insertion_reason TEXT NOT NULL, representation_schema_version TEXT NOT NULL,
    display_title TEXT NOT NULL, display_summary TEXT NOT NULL,
    media_type TEXT NOT NULL, captured_representation_json TEXT NOT NULL,
    collected_at TEXT NOT NULL, created_at TEXT NOT NULL, immutable_source_hash TEXT NOT NULL,
    UNIQUE(investigation_id, principal_id, source_workspace, source_kind, source_identity)
);
