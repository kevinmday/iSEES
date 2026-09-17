ALTER TABLE candidate_evidence ADD COLUMN investigation_aggregate_revision INTEGER;
ALTER TABLE candidate_evidence ADD COLUMN original_filename TEXT;
ALTER TABLE candidate_evidence ADD COLUMN display_filename TEXT;
ALTER TABLE candidate_evidence ADD COLUMN byte_size INTEGER;
ALTER TABLE candidate_evidence ADD COLUMN detected_media_type TEXT;
ALTER TABLE candidate_evidence ADD COLUMN media_category TEXT;
ALTER TABLE candidate_evidence ADD COLUMN content_sha256 TEXT;
ALTER TABLE candidate_evidence ADD COLUMN storage_identity TEXT;
ALTER TABLE candidate_evidence ADD COLUMN object_reference TEXT;

UPDATE candidate_evidence
SET investigation_aggregate_revision = CAST(
    substr(manifold_revision_id, length('investigation-aggregate:') + 1) AS INTEGER
)
WHERE investigation_aggregate_revision IS NULL
  AND manifold_revision_id LIKE 'investigation-aggregate:%'
  AND substr(manifold_revision_id, length('investigation-aggregate:') + 1) <> ''
  AND substr(manifold_revision_id, length('investigation-aggregate:') + 1) NOT GLOB '*[^0-9]*';
