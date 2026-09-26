CREATE TABLE rex_expansion_proposals(
 proposal_id TEXT PRIMARY KEY,
 owner_subject_id TEXT NOT NULL,
 investigation_id TEXT NOT NULL,
 target_kind TEXT NOT NULL CHECK(target_kind IN ('NODE','EDGE')),
 target_id TEXT NOT NULL,
 operational_revision_id TEXT NOT NULL,
 operational_revision_hash TEXT NOT NULL,
 request_hash TEXT NOT NULL,
 payload BLOB NOT NULL,
 content_hash TEXT NOT NULL,
 created_at TEXT NOT NULL,
 UNIQUE(owner_subject_id,investigation_id,request_hash));
CREATE INDEX rex_expansion_proposal_scope ON rex_expansion_proposals(owner_subject_id,investigation_id,proposal_id);
CREATE TRIGGER rex_no_proposal_update BEFORE UPDATE ON rex_expansion_proposals BEGIN SELECT RAISE(ABORT,'immutable record'); END;
CREATE TRIGGER rex_no_proposal_delete BEFORE DELETE ON rex_expansion_proposals BEGIN SELECT RAISE(ABORT,'immutable record'); END;
