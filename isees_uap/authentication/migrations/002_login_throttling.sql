CREATE TABLE login_throttle (
    normalized_email TEXT PRIMARY KEY,
    failure_count INTEGER NOT NULL CHECK (failure_count > 0),
    window_started_at TEXT NOT NULL,
    locked_until TEXT,
    updated_at TEXT NOT NULL
);

CREATE INDEX login_throttle_updated_idx ON login_throttle(updated_at);
