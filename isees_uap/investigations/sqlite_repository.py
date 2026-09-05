from __future__ import annotations

import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

from .errors import (
    DuplicateInvestigationId,
    InvalidStoredInvestigation,
    RepositoryUnavailable,
)
from .models import Investigation, InvestigationLifecycle

SCHEMA_VERSION = 1


def _sql_statements(script: str):
    pending = ""
    for line in script.splitlines(keepends=True):
        pending += line
        if sqlite3.complete_statement(pending):
            statement = pending.strip()
            if statement:
                yield statement
            pending = ""
    if pending.strip():
        raise RuntimeError("Incomplete Investigation Library migration statement")


def _utc_text(value: datetime) -> str:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("Investigation timestamps must be timezone-aware")
    return value.astimezone(timezone.utc).isoformat(
        timespec="microseconds"
    ).replace("+00:00", "Z")


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SQLiteInvestigationRepository:
    """Connection-per-operation durable authority for parent Investigations."""

    def __init__(
        self,
        path: str | Path,
        *,
        clock: Callable[[], datetime] = _utc_now,
    ):
        self.path = Path(path).resolve()
        self.clock = clock
        try:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            self._migrate()
        except (OSError, sqlite3.Error) as error:
            raise RepositoryUnavailable(
                "Investigation repository is unavailable"
            ) from error

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=5, isolation_level=None)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA busy_timeout=5000")
        connection.execute("PRAGMA synchronous=FULL")
        connection.execute("PRAGMA journal_mode=WAL")
        return connection

    def _migrate(self) -> None:
        with closing(self._connect()) as connection:
            # Write serialization precedes both migration-history inspection and
            # decisions, preventing the stale-history cold-start race from I2K.
            connection.execute("BEGIN IMMEDIATE")
            try:
                connection.execute(
                    "CREATE TABLE IF NOT EXISTS investigation_schema_migrations "
                    "(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)"
                )
                versions = {
                    row[0] for row in connection.execute(
                        "SELECT version FROM investigation_schema_migrations"
                    )
                }
                if versions and max(versions) > SCHEMA_VERSION:
                    raise RepositoryUnavailable(
                        "Investigation database schema is newer than this application"
                    )
                for version in range(1, SCHEMA_VERSION + 1):
                    if version in versions:
                        continue
                    migration = Path(__file__).with_name("migrations").joinpath(
                        f"{version:03d}_investigations.sql"
                    ).read_text(encoding="utf-8")
                    for statement in _sql_statements(migration):
                        connection.execute(statement)
                    connection.execute(
                        "INSERT INTO investigation_schema_migrations VALUES (?, ?)",
                        (version, _utc_text(self.clock())),
                    )
                connection.commit()
            except Exception:
                connection.rollback()
                raise

    @staticmethod
    def _from_row(row: sqlite3.Row) -> Investigation:
        try:
            created_at = datetime.fromisoformat(row["created_at"].replace("Z", "+00:00"))
            modified_at = datetime.fromisoformat(row["modified_at"].replace("Z", "+00:00"))
            if (
                created_at.tzinfo is None
                or modified_at.tzinfo is None
                or created_at.utcoffset() is None
                or modified_at.utcoffset() is None
                or row["version"] < 0
                or not row["investigation_id"]
                or not row["owner_principal_id"]
                or not row["title"]
            ):
                raise ValueError("Invalid Investigation row")
            return Investigation(
                investigation_id=row["investigation_id"],
                owner_principal_id=row["owner_principal_id"],
                title=row["title"],
                objective=row["objective"],
                lifecycle=InvestigationLifecycle(row["lifecycle"]),
                created_at=created_at.astimezone(timezone.utc),
                modified_at=modified_at.astimezone(timezone.utc),
                version=row["version"],
            )
        except (KeyError, TypeError, ValueError) as error:
            raise InvalidStoredInvestigation(
                "Stored Investigation data is invalid"
            ) from error

    def list_owned(self, *, owner_principal_id: str) -> list[Investigation]:
        try:
            with closing(self._connect()) as connection:
                rows = connection.execute(
                    "SELECT * FROM investigation "
                    "WHERE owner_principal_id=? AND lifecycle=? "
                    "ORDER BY modified_at DESC, investigation_id ASC",
                    (owner_principal_id, InvestigationLifecycle.ACTIVE.value),
                ).fetchall()
                return [self._from_row(row) for row in rows]
        except sqlite3.Error as error:
            raise RepositoryUnavailable(
                "Investigation repository is unavailable"
            ) from error

    def get_owned(
        self, *, investigation_id: str, owner_principal_id: str
    ) -> Investigation | None:
        try:
            with closing(self._connect()) as connection:
                row = connection.execute(
                    "SELECT * FROM investigation "
                    "WHERE investigation_id=? AND owner_principal_id=?",
                    (investigation_id, owner_principal_id),
                ).fetchone()
                return self._from_row(row) if row is not None else None
        except sqlite3.Error as error:
            raise RepositoryUnavailable(
                "Investigation repository is unavailable"
            ) from error

    def create(
        self,
        *,
        investigation_id: str,
        owner_principal_id: str,
        title: str,
        objective: str | None = None,
    ) -> Investigation:
        occurred_at = _utc_text(self.clock())
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                try:
                    connection.execute(
                        "INSERT INTO investigation "
                        "(investigation_id,owner_principal_id,title,objective,lifecycle,"
                        "created_at,modified_at,version) VALUES (?,?,?,?,?,?,?,?)",
                        (
                            investigation_id,
                            owner_principal_id,
                            title,
                            objective,
                            InvestigationLifecycle.ACTIVE.value,
                            occurred_at,
                            occurred_at,
                            0,
                        ),
                    )
                    row = connection.execute(
                        "SELECT * FROM investigation WHERE investigation_id=?",
                        (investigation_id,),
                    ).fetchone()
                    connection.commit()
                    return self._from_row(row)
                except Exception:
                    connection.rollback()
                    raise
        except sqlite3.IntegrityError as error:
            if "investigation.investigation_id" in str(error):
                raise DuplicateInvestigationId(
                    "Investigation ID already exists"
                ) from error
            raise RepositoryUnavailable(
                "Investigation repository rejected the write"
            ) from error
        except sqlite3.Error as error:
            raise RepositoryUnavailable(
                "Investigation repository is unavailable"
            ) from error
