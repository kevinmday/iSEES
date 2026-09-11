from __future__ import annotations

from pathlib import Path

from isees_uap.persistence import database_path


def candidate_database_path() -> Path:
    return database_path("ISEES_CANDIDATE_DB_PATH", "candidate_evidence.sqlite3",
                         "runtime/candidate_evidence.sqlite3")
