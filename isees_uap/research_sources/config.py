from __future__ import annotations

import os
from pathlib import Path


def research_source_database_path() -> Path:
    configured = os.environ.get("ISEES_RESEARCH_SOURCE_DB_PATH")
    return (Path(configured) if configured else Path("runtime/research_sources.sqlite3")).expanduser().resolve()
