CREATE TABLE investigation_idempotency_v4 (
    owner_principal_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('CREATE', 'IMPORT_CANON')),
    idempotency_key TEXT NOT NULL,
    command_hash TEXT NOT NULL,
    investigation_id TEXT NOT NULL REFERENCES investigation(investigation_id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY (owner_principal_id, operation, idempotency_key)
);
INSERT INTO investigation_idempotency_v4 SELECT * FROM investigation_idempotency;
DROP TABLE investigation_idempotency;
ALTER TABLE investigation_idempotency_v4 RENAME TO investigation_idempotency;
