from __future__ import annotations

import os
from pathlib import Path


def investigation_database_path() -> Path:
    """Return the independently configured Investigation Library database."""
    configured = os.environ.get("ISEES_INVESTIGATION_DB_PATH")
    path = Path(configured) if configured else Path("runtime/investigations.sqlite3")
    return path.expanduser().resolve()
