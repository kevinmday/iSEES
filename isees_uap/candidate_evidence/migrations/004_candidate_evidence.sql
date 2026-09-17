ALTER TABLE candidate_evidence ADD COLUMN manifold_revision_id TEXT;
ALTER TABLE candidate_evidence ADD COLUMN intake_pathway TEXT NOT NULL DEFAULT 'LEGACY';
ALTER TABLE candidate_evidence ADD COLUMN publication_state TEXT NOT NULL DEFAULT 'NOT_REQUESTED';
ALTER TABLE candidate_evidence ADD COLUMN operation_id TEXT;
ALTER TABLE candidate_evidence ADD COLUMN normalization_version TEXT;
