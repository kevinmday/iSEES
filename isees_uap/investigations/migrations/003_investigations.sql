CREATE TABLE investigation_aggregate_v3 (
    investigation_id TEXT PRIMARY KEY REFERENCES investigation(investigation_id) ON DELETE CASCADE,
    schema_version TEXT NOT NULL CHECK (schema_version = 'investigation-aggregate/v1'),
    state TEXT NOT NULL CHECK (state IN ('EMPTY', 'ADOPTED')),
    revision INTEGER NOT NULL CHECK (revision >= 0),
    payload_json TEXT,
    CHECK ((state = 'EMPTY' AND revision = 0 AND payload_json IS NULL) OR
           (state = 'ADOPTED' AND revision > 0 AND payload_json IS NOT NULL))
);
INSERT INTO investigation_aggregate_v3 (investigation_id,schema_version,state,revision)
SELECT investigation_id,schema_version,state,revision FROM investigation_aggregate;
DROP TABLE investigation_aggregate;
ALTER TABLE investigation_aggregate_v3 RENAME TO investigation_aggregate;

CREATE TABLE investigation_adoption_receipt (
    investigation_id TEXT PRIMARY KEY REFERENCES investigation(investigation_id) ON DELETE CASCADE,
    owner_principal_id TEXT NOT NULL,
    source_kind TEXT NOT NULL CHECK (source_kind = 'GUEST_SESSION'),
    source_guest_investigation_id TEXT NOT NULL,
    source_schema_version TEXT NOT NULL,
    source_snapshot_timestamp TEXT NOT NULL,
    payload_digest TEXT NOT NULL,
    adopted_at TEXT NOT NULL,
    resulting_revision INTEGER NOT NULL CHECK (resulting_revision > 0),
    payload_json TEXT NOT NULL
);

CREATE TABLE account_active_investigation (
    owner_principal_id TEXT PRIMARY KEY,
    investigation_id TEXT NOT NULL REFERENCES investigation(investigation_id) ON DELETE CASCADE,
    activated_at TEXT NOT NULL
);

CREATE TABLE investigation_research_inbox (
    investigation_id TEXT NOT NULL REFERENCES investigation(investigation_id) ON DELETE CASCADE,
    anchor_id TEXT NOT NULL,
    entry_order INTEGER NOT NULL CHECK (entry_order >= 0),
    title TEXT NOT NULL,
    canonical_source_id TEXT NOT NULL,
    PRIMARY KEY (investigation_id, anchor_id),
    UNIQUE (investigation_id, entry_order)
);

CREATE TABLE investigation_adopted_artifact (
    investigation_id TEXT NOT NULL REFERENCES investigation(investigation_id) ON DELETE CASCADE,
    artifact_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('DOCUMENT', 'NOTE')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    canonical_source_ids_json TEXT NOT NULL,
    PRIMARY KEY (investigation_id, artifact_id)
);

CREATE INDEX investigation_adoption_owner ON investigation_adoption_receipt(owner_principal_id);
CREATE TRIGGER investigation_adoption_receipt_immutable_update BEFORE UPDATE ON investigation_adoption_receipt
BEGIN SELECT RAISE(ABORT, 'adoption receipt is immutable'); END;
CREATE TRIGGER investigation_adoption_receipt_immutable_delete BEFORE DELETE ON investigation_adoption_receipt
BEGIN SELECT RAISE(ABORT, 'adoption receipt is immutable'); END;

CREATE TABLE investigation_adoption_idempotency (
    owner_principal_id TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    command_hash TEXT NOT NULL,
    investigation_id TEXT NOT NULL REFERENCES investigation(investigation_id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY (owner_principal_id, idempotency_key)
);
CREATE UNIQUE INDEX investigation_adoption_idempotency_result ON investigation_adoption_idempotency(investigation_id);
