-- Reconcile the existing receipt owner so metadata-only REX executions can have
-- a receipt without falsely creating a Candidate Knowledge bundle.  Rebuild is
-- required for databases which already applied migration 002.
DROP TRIGGER rex_no_receipt_update;
DROP TRIGGER rex_no_receipt_delete;
ALTER TABLE rex_execution_receipts RENAME TO rex_execution_receipts_v2_source;
CREATE TABLE rex_execution_receipts(
 execution_id TEXT PRIMARY KEY REFERENCES rex_search_executions(execution_id),
 payload BLOB NOT NULL, content_hash TEXT NOT NULL, completed_at TEXT NOT NULL,
 candidate_bundle_id TEXT UNIQUE REFERENCES rex_candidate_bundles(bundle_id));
INSERT INTO rex_execution_receipts SELECT * FROM rex_execution_receipts_v2_source;
DROP TABLE rex_execution_receipts_v2_source;
CREATE TRIGGER rex_no_receipt_update BEFORE UPDATE ON rex_execution_receipts BEGIN SELECT RAISE(ABORT,'immutable record'); END;
CREATE TRIGGER rex_no_receipt_delete BEFORE DELETE ON rex_execution_receipts BEGIN SELECT RAISE(ABORT,'immutable record'); END;

CREATE TABLE rex_proposal_execution_claims (
  proposal_id TEXT PRIMARY KEY REFERENCES rex_expansion_proposals(proposal_id),
  owner_subject_id TEXT NOT NULL,
  investigation_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  assignment_id TEXT NOT NULL REFERENCES rex_assignments(assignment_id),
  execution_id TEXT NOT NULL UNIQUE REFERENCES rex_search_executions(execution_id),
  job_id TEXT NOT NULL UNIQUE REFERENCES rex_jobs(job_id),
  claimed_at TEXT NOT NULL,
  UNIQUE(owner_subject_id, investigation_id, idempotency_key),
  UNIQUE(owner_subject_id, investigation_id, proposal_id)
);
CREATE TRIGGER rex_no_proposal_execution_claim_update BEFORE UPDATE ON rex_proposal_execution_claims BEGIN SELECT RAISE(ABORT, 'immutable rex proposal execution claim'); END;
CREATE TRIGGER rex_no_proposal_execution_claim_delete BEFORE DELETE ON rex_proposal_execution_claims BEGIN SELECT RAISE(ABORT, 'immutable rex proposal execution claim'); END;
