CREATE TABLE password_reset_token (
    token_id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES researcher_account(account_id) ON DELETE CASCADE,
    token_digest BLOB NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    invalidated_at TEXT,
    requested_origin_digest BLOB,
    CHECK (expires_at > created_at),
    CHECK (used_at IS NULL OR used_at >= created_at),
    CHECK (invalidated_at IS NULL OR invalidated_at >= created_at)
);

CREATE INDEX password_reset_token_expiry_idx
ON password_reset_token(expires_at);

CREATE INDEX password_reset_token_account_active_idx
ON password_reset_token(account_id, used_at, invalidated_at, expires_at);

CREATE TABLE recovery_throttle (
    scope_type TEXT NOT NULL CHECK (scope_type IN ('ACCOUNT', 'ORIGIN', 'GLOBAL')),
    scope_digest BLOB NOT NULL,
    request_count INTEGER NOT NULL CHECK (request_count > 0),
    window_started_at TEXT NOT NULL,
    blocked_until TEXT,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (scope_type, scope_digest)
);

CREATE INDEX recovery_throttle_cleanup_idx
ON recovery_throttle(updated_at, blocked_until);

CREATE TABLE authentication_audit_event (
    event_id TEXT PRIMARY KEY,
    account_id TEXT REFERENCES researcher_account(account_id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    request_id TEXT,
    origin_digest BLOB,
    outcome TEXT NOT NULL,
    metadata_json TEXT NOT NULL
);

CREATE INDEX authentication_audit_account_time_idx
ON authentication_audit_event(account_id, occurred_at);

CREATE INDEX authentication_audit_type_time_idx
ON authentication_audit_event(event_type, occurred_at);
