"""Pure, provider-independent REX domain contracts.

This package is intentionally not composed into the production application.
"""

from .sqlite_repository import SCHEMA_VERSION, SQLiteREXRepository, SQLiteRexRepository

__all__ = ("SCHEMA_VERSION", "SQLiteREXRepository", "SQLiteRexRepository")
