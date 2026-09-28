CREATE TABLE guest_identity (
    guest_id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    CHECK (expires_at > created_at),
    CHECK (revoked_at IS NULL OR revoked_at >= created_at)
);

CREATE TABLE guest_credential (
    credential_id TEXT PRIMARY KEY,
    guest_id TEXT NOT NULL REFERENCES guest_identity(guest_id) ON DELETE CASCADE,
    secret_digest BLOB NOT NULL UNIQUE,
    csrf_digest BLOB NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    last_used_at TEXT NOT NULL,
    CHECK (expires_at > created_at),
    CHECK (revoked_at IS NULL OR revoked_at >= created_at)
);

CREATE INDEX guest_credential_guest_idx
ON guest_credential(guest_id, expires_at);

CREATE TABLE guest_issuance_throttle (
    scope_digest BLOB PRIMARY KEY,
    request_count INTEGER NOT NULL CHECK (request_count > 0),
    window_started_at TEXT NOT NULL,
    blocked_until TEXT,
    updated_at TEXT NOT NULL
);

CREATE TABLE guest_search_budget (
    budget_id INTEGER PRIMARY KEY CHECK (budget_id = 1),
    reserved_units INTEGER NOT NULL DEFAULT 0 CHECK (reserved_units >= 0),
    charged_units INTEGER NOT NULL DEFAULT 0 CHECK (charged_units >= 0),
    updated_at TEXT NOT NULL
);

CREATE TABLE guest_search_operation (
    operation_id TEXT PRIMARY KEY,
    guest_id TEXT NOT NULL REFERENCES guest_identity(guest_id) ON DELETE RESTRICT,
    idempotency_key TEXT NOT NULL,
    request_fingerprint BLOB NOT NULL,
    state TEXT NOT NULL CHECK (state IN
        ('RESERVED', 'DISPATCHING', 'COMPLETED', 'DEFINITELY_UNDISPATCHED', 'UNKNOWN')),
    reservation_state TEXT NOT NULL CHECK (reservation_state IN ('HELD', 'RELEASED', 'CHARGED')),
    reserved_units INTEGER NOT NULL CHECK (reserved_units > 0),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (guest_id, idempotency_key),
    UNIQUE (guest_id, request_fingerprint)
);

CREATE INDEX guest_search_operation_guest_state_idx
ON guest_search_operation(guest_id, reservation_state, created_at);
