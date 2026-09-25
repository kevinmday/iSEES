CREATE TABLE investigation_manifold_artifact_admission_receipt (
 receipt_id TEXT PRIMARY KEY, owner_principal_id TEXT NOT NULL, investigation_id TEXT NOT NULL REFERENCES investigation(investigation_id),
 studio_artifact_id TEXT NOT NULL, author_revision_id TEXT NOT NULL, projection_id TEXT NOT NULL, verified_output_hash TEXT NOT NULL,
 admitted_artifact_node_id TEXT NOT NULL, selected_relationship_declaration_ids_json TEXT NOT NULL, created_relationship_ids_json TEXT NOT NULL,
 previous_operational_revision_id TEXT, resulting_operational_revision_id TEXT NOT NULL, command_hash TEXT NOT NULL,
 idempotency_key TEXT NOT NULL, admitted_at TEXT NOT NULL, canon_effect TEXT NOT NULL CHECK(canon_effect='NONE'),
 manifold_effect TEXT NOT NULL CHECK(manifold_effect='REVISION_APPENDED'), rex_effect TEXT NOT NULL CHECK(rex_effect='NONE'),
 tavily_effect TEXT NOT NULL CHECK(tavily_effect='NONE'), candidate_evidence_effect TEXT NOT NULL CHECK(candidate_evidence_effect='NONE'),
 research_inbox_effect TEXT NOT NULL CHECK(research_inbox_effect='NONE'), billing_effect TEXT NOT NULL CHECK(billing_effect='NONE'),
 UNIQUE(owner_principal_id, investigation_id, idempotency_key), UNIQUE(owner_principal_id, investigation_id, projection_id)
);
CREATE TRIGGER investigation_manifold_admission_immutable_update BEFORE UPDATE ON investigation_manifold_artifact_admission_receipt
BEGIN SELECT RAISE(ABORT, 'manifold artifact admission receipt is immutable'); END;
CREATE TRIGGER investigation_manifold_admission_immutable_delete BEFORE DELETE ON investigation_manifold_artifact_admission_receipt
BEGIN SELECT RAISE(ABORT, 'manifold artifact admission receipt is immutable'); END;
