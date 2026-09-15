CREATE TABLE rex_execution_receipts(
 execution_id TEXT PRIMARY KEY REFERENCES rex_search_executions(execution_id),
 payload BLOB NOT NULL, content_hash TEXT NOT NULL, completed_at TEXT NOT NULL,
 candidate_bundle_id TEXT NOT NULL UNIQUE REFERENCES rex_candidate_bundles(bundle_id));
CREATE TRIGGER rex_no_receipt_update BEFORE UPDATE ON rex_execution_receipts BEGIN SELECT RAISE(ABORT,'immutable record'); END;
CREATE TRIGGER rex_no_receipt_delete BEFORE DELETE ON rex_execution_receipts BEGIN SELECT RAISE(ABORT,'immutable record'); END;
