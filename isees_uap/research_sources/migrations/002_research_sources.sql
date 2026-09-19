CREATE TABLE IF NOT EXISTS research_candidate_evidence_source (
    anchor_id TEXT PRIMARY KEY, investigation_id TEXT NOT NULL, principal_id TEXT NOT NULL,
    candidate_id TEXT NOT NULL, display_title TEXT NOT NULL, display_summary TEXT NOT NULL,
    source_json TEXT NOT NULL, collected_at TEXT NOT NULL, created_at TEXT NOT NULL,
    UNIQUE(investigation_id, principal_id, candidate_id)
);
