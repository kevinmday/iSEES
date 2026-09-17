from __future__ import annotations

from pathlib import Path

from isees_uap.persistence import database_path, persistent_root


def candidate_database_path() -> Path:
    return database_path("ISEES_CANDIDATE_DB_PATH", "candidate_evidence.sqlite3",
                         "runtime/candidate_evidence.sqlite3")


def candidate_blob_root(values=None) -> Path:
    import os
    environment = os.environ if values is None else values
    override = environment.get("ISEES_CANDIDATE_BLOB_ROOT")
    if override and override.strip():
        return Path(override).expanduser().resolve()
    root = persistent_root(environment)
    if root is not None:
        result = (root / "candidate-evidence-blobs").resolve()
        if root != result and root not in result.parents:
            raise RuntimeError("Derived Candidate Evidence blob path escapes its configured root")
        return result
    return Path("runtime/candidate_evidence_blobs").resolve()
