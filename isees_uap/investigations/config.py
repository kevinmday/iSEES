from __future__ import annotations

from pathlib import Path

from isees_uap.persistence import database_path


def investigation_database_path() -> Path:
    """Return the independently configured Investigation Library database."""
    return database_path("ISEES_INVESTIGATION_DB_PATH", "investigations.sqlite3",
                         "runtime/investigations.sqlite3")
