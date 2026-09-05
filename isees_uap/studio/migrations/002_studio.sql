ALTER TABLE studio_source_snapshot ADD COLUMN anchor_id TEXT;
ALTER TABLE studio_source_snapshot ADD COLUMN graph_identity TEXT;
ALTER TABLE studio_source_snapshot ADD COLUMN graph_revision INTEGER;
ALTER TABLE studio_source_snapshot ADD COLUMN immutable_source_hash TEXT;
ALTER TABLE studio_source_snapshot ADD COLUMN insertion_state TEXT;
ALTER TABLE studio_source_snapshot ADD COLUMN insertion_reason TEXT;
