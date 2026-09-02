CREATE TABLE candidate_evidence (
    candidate_id TEXT PRIMARY KEY,
    investigation_id TEXT NOT NULL,
    revision INTEGER NOT NULL CHECK (revision >= 0),
    origin TEXT NOT NULL CHECK (origin IN ('DISCOVERY','SUBMISSION')),
    origin_identity TEXT NOT NULL,
    lineage_json TEXT NOT NULL,
    source_json TEXT NOT NULL,
    association_json TEXT,
    lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('DISCOVERED','SUBMITTED','REFERENCED','ACQUIRED','IN_REVIEW','ADMITTED','DEFERRED','EXCLUDED')),
    acquisition_state TEXT NOT NULL DEFAULT 'NOT_REQUESTED' CHECK (acquisition_state IN ('NOT_REQUESTED','QUEUED','ACQUIRING','ACQUIRED','FAILED','BLOCKED')),
    archive_state TEXT NOT NULL DEFAULT 'NOT_REQUESTED' CHECK (archive_state IN ('NOT_REQUESTED','QUEUED','ARCHIVED','FAILED','PROHIBITED')),
    availability TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK (availability IN ('AVAILABLE','UNAVAILABLE','MISSING','REDACTED','UNKNOWN')),
    review_decision_json TEXT,
    admission_receipt_identity TEXT UNIQUE,
    admitted_artifact_id TEXT UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by_principal_id TEXT NOT NULL,
    create_fingerprint TEXT NOT NULL,
    UNIQUE (investigation_id, origin, origin_identity),
    UNIQUE (candidate_id, investigation_id)
);
CREATE INDEX candidate_evidence_investigation_order
    ON candidate_evidence (investigation_id, created_at, candidate_id);

CREATE TABLE candidate_query_specification (
    query_specification_id TEXT PRIMARY KEY,
    investigation_id TEXT NOT NULL,
    schema_version TEXT NOT NULL,
    target_connector TEXT NOT NULL,
    exact_query TEXT NOT NULL,
    clauses_json TEXT NOT NULL,
    lineage_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    created_by_principal_id TEXT NOT NULL
);

CREATE TABLE candidate_provenance_event (
    event_id TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL,
    investigation_id TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    action TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    actor_kind TEXT NOT NULL CHECK (actor_kind IN ('HUMAN','AUTOMATION','SYSTEM')),
    occurred_at TEXT NOT NULL,
    prior_revision INTEGER NOT NULL,
    resulting_revision INTEGER NOT NULL,
    prior_lifecycle_state TEXT NOT NULL,
    resulting_lifecycle_state TEXT NOT NULL,
    UNIQUE (candidate_id, sequence),
    FOREIGN KEY (candidate_id, investigation_id)
        REFERENCES candidate_evidence(candidate_id, investigation_id)
);
CREATE INDEX candidate_provenance_investigation_candidate
    ON candidate_provenance_event (investigation_id, candidate_id, sequence);

CREATE TABLE candidate_idempotency (
    principal_id TEXT NOT NULL,
    investigation_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    candidate_id TEXT NOT NULL,
    response_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (principal_id, investigation_id, operation, idempotency_key),
    FOREIGN KEY (candidate_id, investigation_id)
        REFERENCES candidate_evidence(candidate_id, investigation_id)
);
