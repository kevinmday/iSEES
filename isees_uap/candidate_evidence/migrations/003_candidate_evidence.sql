CREATE TABLE native_case_draft (
    candidate_id TEXT PRIMARY KEY,
    owner_principal_id TEXT NOT NULL,
    investigation_id TEXT,
    revision INTEGER NOT NULL CHECK (revision >= 0),
    content_schema_version TEXT NOT NULL CHECK (content_schema_version = 'native-case-draft-content/v1'),
    content_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    CHECK (length(candidate_id) > 0),
    CHECK (length(owner_principal_id) > 0)
);
CREATE INDEX native_case_draft_owner_order
    ON native_case_draft (owner_principal_id, created_at, candidate_id);
CREATE TABLE native_case_draft_idempotency (
    principal_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    candidate_id TEXT NOT NULL,
    response_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (principal_id, operation, idempotency_key),
    FOREIGN KEY (candidate_id) REFERENCES native_case_draft(candidate_id)
);
