-- Existing Studio, Research Source, and Candidate Evidence rows are deliberately
-- not inspected, migrated, constrained, or used to infer parent ownership here.
CREATE TABLE investigation (
    investigation_id TEXT PRIMARY KEY,
    owner_principal_id TEXT NOT NULL,
    title TEXT NOT NULL,
    objective TEXT,
    lifecycle TEXT NOT NULL CHECK (lifecycle IN ('ACTIVE')),
    created_at TEXT NOT NULL,
    modified_at TEXT NOT NULL,
    version INTEGER NOT NULL CHECK (version >= 0)
);

CREATE INDEX investigation_owner_library_order
ON investigation(owner_principal_id, lifecycle, modified_at DESC, investigation_id ASC);
