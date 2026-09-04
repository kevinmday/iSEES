from __future__ import annotations

import os
from pathlib import Path


def studio_database_path() -> Path:
    """Return the independently configured STUDIO database location."""
    configured = os.environ.get("ISEES_STUDIO_DB_PATH")
    path = Path(configured) if configured else Path("runtime/studio.sqlite3")
    return path.expanduser().resolve()
