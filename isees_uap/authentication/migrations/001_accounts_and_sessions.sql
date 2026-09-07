CREATE TABLE researcher_account (
    account_id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    normalized_email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'DISABLED')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE authenticated_session (
    session_id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES researcher_account(account_id) ON DELETE CASCADE,
    secret_digest BLOB NOT NULL UNIQUE,
    csrf_digest BLOB NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    last_used_at TEXT NOT NULL,
    CHECK (expires_at > created_at),
    CHECK (revoked_at IS NULL OR revoked_at >= created_at)
);

CREATE INDEX authenticated_session_account_idx
ON authenticated_session(account_id, expires_at);
