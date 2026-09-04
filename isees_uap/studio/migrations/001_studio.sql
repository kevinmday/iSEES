CREATE TABLE studio_artifact (
    artifact_id TEXT PRIMARY KEY,
    investigation_id TEXT NOT NULL,
    owner_principal_id TEXT NOT NULL,
    revision INTEGER NOT NULL CHECK (revision >= 0),
    lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('DRAFT','CANDIDATE_KNOWLEDGE_ARTIFACT','MANIFOLD_CANDIDATE_NODE','REVIEW_TEST','ACCEPTED_KNOWLEDGE','RETURNED','REJECTED')),
    current_version_number INTEGER NOT NULL CHECK (current_version_number >= 1),
    current_version_id TEXT NOT NULL,
    candidate_artifact_id TEXT,
    manifold_candidate_node_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (artifact_id, investigation_id, owner_principal_id)
);
CREATE INDEX studio_artifact_scope_order ON studio_artifact(investigation_id, owner_principal_id, created_at, artifact_id);

CREATE TABLE studio_artifact_version (
    version_id TEXT PRIMARY KEY,
    artifact_id TEXT NOT NULL,
    version_number INTEGER NOT NULL CHECK (version_number >= 1),
    parent_version_id TEXT,
    author_schema_version TEXT NOT NULL,
    document_json TEXT NOT NULL,
    comparison_context_json TEXT,
    content_hash TEXT NOT NULL,
    created_by_principal_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE (artifact_id, version_number),
    UNIQUE (version_id, artifact_id),
    FOREIGN KEY (artifact_id) REFERENCES studio_artifact(artifact_id),
    FOREIGN KEY (parent_version_id) REFERENCES studio_artifact_version(version_id)
);

CREATE TABLE studio_source_snapshot (
    snapshot_id TEXT NOT NULL,
    artifact_id TEXT NOT NULL,
    artifact_version_id TEXT NOT NULL,
    source_identity TEXT NOT NULL,
    source_investigation_id TEXT NOT NULL,
    source_workspace TEXT NOT NULL,
    source_kind TEXT NOT NULL,
    classification TEXT NOT NULL,
    captured_at TEXT NOT NULL,
    representation_schema_version TEXT NOT NULL,
    media_type TEXT NOT NULL,
    captured_representation_json TEXT NOT NULL,
    snapshot_hash TEXT NOT NULL,
    source_revision_id TEXT,
    source_execution_id TEXT,
    source_projection_id TEXT,
    resolution_status TEXT NOT NULL,
    resolution_metadata_json TEXT NOT NULL,
    PRIMARY KEY (artifact_version_id, snapshot_id),
    FOREIGN KEY (artifact_version_id, artifact_id) REFERENCES studio_artifact_version(version_id, artifact_id)
);

CREATE TABLE studio_claim (
    claim_id TEXT NOT NULL,
    artifact_id TEXT NOT NULL,
    artifact_version_id TEXT NOT NULL,
    review_state TEXT NOT NULL,
    lineage_state TEXT NOT NULL,
    claim_text TEXT,
    span_identity TEXT,
    PRIMARY KEY (artifact_version_id, claim_id),
    CHECK ((claim_text IS NULL) <> (span_identity IS NULL)),
    FOREIGN KEY (artifact_version_id, artifact_id) REFERENCES studio_artifact_version(version_id, artifact_id)
);
CREATE TABLE studio_citation (
    citation_id TEXT NOT NULL,
    artifact_id TEXT NOT NULL,
    artifact_version_id TEXT NOT NULL,
    source_snapshot_id TEXT NOT NULL,
    locator_metadata_json TEXT,
    PRIMARY KEY (artifact_version_id, citation_id),
    FOREIGN KEY (artifact_version_id, artifact_id) REFERENCES studio_artifact_version(version_id, artifact_id),
    FOREIGN KEY (artifact_version_id, source_snapshot_id) REFERENCES studio_source_snapshot(artifact_version_id, snapshot_id)
);
CREATE TABLE studio_claim_source_mapping (
    mapping_id TEXT NOT NULL,
    artifact_id TEXT NOT NULL,
    artifact_version_id TEXT NOT NULL,
    claim_id TEXT NOT NULL,
    source_snapshot_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL,
    citation_id TEXT,
    contradiction_origin TEXT,
    attributed_actor_id TEXT,
    attributed_process TEXT,
    PRIMARY KEY (artifact_version_id, mapping_id),
    FOREIGN KEY (artifact_version_id, artifact_id) REFERENCES studio_artifact_version(version_id, artifact_id),
    FOREIGN KEY (artifact_version_id, claim_id) REFERENCES studio_claim(artifact_version_id, claim_id),
    FOREIGN KEY (artifact_version_id, source_snapshot_id) REFERENCES studio_source_snapshot(artifact_version_id, snapshot_id),
    FOREIGN KEY (artifact_version_id, citation_id) REFERENCES studio_citation(artifact_version_id, citation_id)
);

CREATE TABLE studio_candidate_artifact (
    candidate_artifact_id TEXT PRIMARY KEY,
    artifact_id TEXT NOT NULL,
    artifact_version_id TEXT NOT NULL UNIQUE,
    readiness_state TEXT NOT NULL,
    validation_warnings_json TEXT NOT NULL,
    created_by_principal_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (artifact_version_id, artifact_id) REFERENCES studio_artifact_version(version_id, artifact_id)
);
CREATE TABLE studio_candidate_publication_receipt (
    receipt_id TEXT PRIMARY KEY,
    artifact_id TEXT NOT NULL,
    candidate_artifact_id TEXT NOT NULL UNIQUE,
    candidate_node_id TEXT NOT NULL UNIQUE,
    published_at TEXT NOT NULL,
    FOREIGN KEY (candidate_artifact_id) REFERENCES studio_candidate_artifact(candidate_artifact_id)
);
CREATE TABLE studio_acceptance_receipt (
    receipt_id TEXT PRIMARY KEY,
    artifact_id TEXT NOT NULL,
    candidate_artifact_id TEXT NOT NULL UNIQUE,
    accepted_knowledge_id TEXT NOT NULL UNIQUE,
    accepted_at TEXT NOT NULL,
    FOREIGN KEY (candidate_artifact_id) REFERENCES studio_candidate_artifact(candidate_artifact_id)
);
CREATE TABLE studio_review_decision (
    decision_id TEXT PRIMARY KEY,
    artifact_id TEXT NOT NULL,
    candidate_artifact_id TEXT NOT NULL,
    target_scope TEXT NOT NULL,
    claim_id TEXT,
    decision TEXT NOT NULL,
    reason TEXT NOT NULL,
    actor_principal_id TEXT NOT NULL,
    prior_revision INTEGER NOT NULL,
    resulting_revision INTEGER NOT NULL,
    decided_at TEXT NOT NULL,
    FOREIGN KEY (artifact_id) REFERENCES studio_artifact(artifact_id),
    FOREIGN KEY (candidate_artifact_id) REFERENCES studio_candidate_artifact(candidate_artifact_id)
);
CREATE INDEX studio_review_order ON studio_review_decision(artifact_id, resulting_revision, decided_at, decision_id);

CREATE TABLE studio_projection (
    projection_id TEXT PRIMARY KEY,
    artifact_id TEXT NOT NULL,
    artifact_version_id TEXT NOT NULL,
    projection_format TEXT NOT NULL,
    citation_style_configuration_json TEXT NOT NULL,
    readiness_state TEXT NOT NULL,
    validation_warnings_json TEXT NOT NULL,
    materialization_state TEXT NOT NULL,
    validator_version TEXT NOT NULL,
    validated_at TEXT NOT NULL,
    materializer_version TEXT,
    output_identity TEXT UNIQUE,
    output_location TEXT,
    output_hash TEXT,
    materialized_at TEXT,
    FOREIGN KEY (artifact_version_id, artifact_id) REFERENCES studio_artifact_version(version_id, artifact_id)
);
CREATE TABLE studio_lifecycle_event (
    event_id TEXT PRIMARY KEY,
    artifact_id TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    prior_revision INTEGER NOT NULL,
    resulting_revision INTEGER NOT NULL,
    prior_state TEXT,
    resulting_state TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    UNIQUE (artifact_id, sequence),
    FOREIGN KEY (artifact_id) REFERENCES studio_artifact(artifact_id)
);
CREATE TABLE studio_idempotency (
    principal_id TEXT NOT NULL,
    investigation_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    command_hash TEXT NOT NULL,
    artifact_id TEXT NOT NULL,
    result_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (principal_id, investigation_id, operation, idempotency_key),
    FOREIGN KEY (artifact_id) REFERENCES studio_artifact(artifact_id)
);
