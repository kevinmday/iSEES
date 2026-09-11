from __future__ import annotations

from pathlib import Path

from isees_uap.persistence import database_path


def research_source_database_path() -> Path:
    return database_path("ISEES_RESEARCH_SOURCE_DB_PATH", "research_sources.sqlite3",
                         "runtime/research_sources.sqlite3")
