from __future__ import annotations

import os
from pathlib import Path


# P57-UI-A17-I1 conservative drafting bounds. This is the backend authority;
# frontend constants mirror only limits needed before transport.
STUDIO_DRAFTING_MAX_SOURCES = 64
STUDIO_DRAFTING_MAX_SOURCE_BYTES = 128_000
STUDIO_DRAFTING_MAX_CONTEXT_BYTES = 1_000_000
STUDIO_DRAFTING_MAX_NOTES = 64
STUDIO_DRAFTING_MAX_NOTE_BYTES = 32_000
STUDIO_DRAFTING_MAX_INSTRUCTION_CHARS = 8_000
STUDIO_DRAFTING_MAX_PROPOSAL_BLOCKS = 64
STUDIO_DRAFTING_MAX_GENERATED_TEXT_BYTES = 256_000


def studio_database_path() -> Path:
    """Return the independently configured STUDIO database location."""
    configured = os.environ.get("ISEES_STUDIO_DB_PATH")
    path = Path(configured) if configured else Path("runtime/studio.sqlite3")
    return path.expanduser().resolve()
