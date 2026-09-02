from __future__ import annotations

import os
from pathlib import Path


def candidate_database_path() -> Path:
    configured = os.environ.get("ISEES_CANDIDATE_DB_PATH")
    path = Path(configured) if configured else Path("runtime/candidate_evidence.sqlite3")
    return path.expanduser().resolve()
