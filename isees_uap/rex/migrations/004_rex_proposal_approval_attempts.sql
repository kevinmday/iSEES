CREATE TABLE rex_proposal_approval_attempts (
  owner_subject_id TEXT NOT NULL,
  investigation_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  proposal_id TEXT NOT NULL,
  response_payload BLOB NOT NULL,
  response_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (owner_subject_id, investigation_id, idempotency_key),
  FOREIGN KEY (proposal_id) REFERENCES rex_expansion_proposals(proposal_id)
);
CREATE TRIGGER rex_no_approval_attempt_update BEFORE UPDATE ON rex_proposal_approval_attempts BEGIN SELECT RAISE(ABORT, 'immutable rex approval attempt'); END;
CREATE TRIGGER rex_no_approval_attempt_delete BEFORE DELETE ON rex_proposal_approval_attempts BEGIN SELECT RAISE(ABORT, 'immutable rex approval attempt'); END;
