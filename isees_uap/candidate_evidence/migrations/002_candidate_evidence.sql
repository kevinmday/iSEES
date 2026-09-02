CREATE TABLE candidate_evidence_v2 (
    candidate_id TEXT PRIMARY KEY,
    investigation_id TEXT NOT NULL,
    revision INTEGER NOT NULL CHECK (revision >= 0),
    origin TEXT NOT NULL CHECK (origin IN ('DISCOVERY','SUBMISSION','CURATED_REPOSITORY')),
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
    UNIQUE (created_by_principal_id, investigation_id, origin, origin_identity),
    UNIQUE (candidate_id, investigation_id)
);
INSERT INTO candidate_evidence_v2 SELECT * FROM candidate_evidence;
DROP TABLE candidate_evidence;
ALTER TABLE candidate_evidence_v2 RENAME TO candidate_evidence;
CREATE INDEX candidate_evidence_investigation_order
    ON candidate_evidence (investigation_id, created_at, candidate_id);
