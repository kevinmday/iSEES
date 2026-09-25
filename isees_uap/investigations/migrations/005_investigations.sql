CREATE TABLE investigation_operational_revision (
    investigation_id TEXT NOT NULL REFERENCES investigation(investigation_id) ON DELETE CASCADE,
    operational_revision_id TEXT NOT NULL,
    revision_number INTEGER NOT NULL CHECK (revision_number > 0),
    parent_operational_revision_id TEXT,
    graph_snapshot_json TEXT NOT NULL,
    graph_fingerprint TEXT NOT NULL,
    graph_schema_version TEXT NOT NULL,
    algorithm_version TEXT NOT NULL,
    actor_authority TEXT NOT NULL,
    recorded_at TEXT NOT NULL,
    mutation_kind TEXT NOT NULL,
    source_identity TEXT,
    PRIMARY KEY (investigation_id, operational_revision_id),
    UNIQUE (investigation_id, revision_number),
    FOREIGN KEY (investigation_id, parent_operational_revision_id)
      REFERENCES investigation_operational_revision(investigation_id, operational_revision_id),
    CHECK ((revision_number = 1 AND parent_operational_revision_id IS NULL) OR
           (revision_number > 1 AND parent_operational_revision_id IS NOT NULL))
);

CREATE TABLE investigation_operational_head (
    investigation_id TEXT PRIMARY KEY REFERENCES investigation(investigation_id) ON DELETE CASCADE,
    operational_revision_id TEXT NOT NULL,
    FOREIGN KEY (investigation_id, operational_revision_id)
      REFERENCES investigation_operational_revision(investigation_id, operational_revision_id)
);

CREATE TRIGGER investigation_operational_revision_immutable_update
BEFORE UPDATE ON investigation_operational_revision
BEGIN SELECT RAISE(ABORT, 'operational revision is immutable'); END;

CREATE TRIGGER investigation_operational_revision_immutable_delete
BEFORE DELETE ON investigation_operational_revision
BEGIN SELECT RAISE(ABORT, 'operational revision is immutable'); END;
