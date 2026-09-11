from __future__ import annotations

from pathlib import Path

from isees_uap.persistence import database_path, output_path


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
    return database_path("ISEES_STUDIO_DB_PATH", "studio.sqlite3", "runtime/studio.sqlite3")


def studio_output_root() -> Path:
    """Backend-owned root for durable Studio projection outputs."""
    return output_path("ISEES_STUDIO_OUTPUT_ROOT", "runtime/studio-outputs")
