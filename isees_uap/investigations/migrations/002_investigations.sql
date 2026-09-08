CREATE TABLE investigation_aggregate (
    investigation_id TEXT PRIMARY KEY REFERENCES investigation(investigation_id) ON DELETE CASCADE,
    schema_version TEXT NOT NULL CHECK (schema_version = 'investigation-aggregate/v1'),
    state TEXT NOT NULL CHECK (state = 'EMPTY'),
    revision INTEGER NOT NULL CHECK (revision = 0)
);

-- Migration 001 parents contain metadata only, so their only truthful aggregate
-- projection is EMPTY. This does not infer ownership or create research content.
INSERT INTO investigation_aggregate
SELECT investigation_id, 'investigation-aggregate/v1', 'EMPTY', 0
FROM investigation;

CREATE TABLE investigation_idempotency (
    owner_principal_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation = 'CREATE'),
    idempotency_key TEXT NOT NULL,
    command_hash TEXT NOT NULL,
    investigation_id TEXT NOT NULL REFERENCES investigation(investigation_id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY (owner_principal_id, operation, idempotency_key)
);

CREATE UNIQUE INDEX investigation_idempotency_result
ON investigation_idempotency(investigation_id);
