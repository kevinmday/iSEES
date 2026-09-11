from __future__ import annotations

import hashlib
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

from .errors import AuthenticationRepositoryUnavailable, DuplicateAccount
from .models import AccountStatus, AuthenticatedSession, ResearcherAccount

SCHEMA_VERSION = 1


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _utc_text(value: datetime) -> str:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("Authentication timestamps must be timezone-aware")
    return value.astimezone(timezone.utc).isoformat(timespec="microseconds").replace(
        "+00:00", "Z"
    )


def _datetime(value: str | None) -> datetime | None:
    if value is None:
        return None
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError("Stored authentication timestamp is invalid")
    return parsed.astimezone(timezone.utc)


def _statements(script: str):
    pending = ""
    for line in script.splitlines(keepends=True):
        pending += line
        if sqlite3.complete_statement(pending):
            statement = pending.strip()
            if statement:
                yield statement
            pending = ""
    if pending.strip():
        raise RuntimeError("Incomplete authentication migration")


def session_secret_digest(secret: str) -> bytes:
    return hashlib.sha256(secret.encode("ascii")).digest()


class SQLiteAuthenticationRepository:
    def __init__(self, path: str | Path, *, clock: Callable[[], datetime] = _utc_now):
        self.path = Path(path).resolve()
        self.clock = clock
        try:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            self._migrate()
        except (OSError, sqlite3.Error) as error:
            raise AuthenticationRepositoryUnavailable(
                "Authentication service is unavailable"
            ) from error

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=5, isolation_level=None)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute("PRAGMA busy_timeout=5000")
        connection.execute("PRAGMA synchronous=FULL")
        connection.execute("PRAGMA journal_mode=WAL")
        return connection

    def _migrate(self) -> None:
        with closing(self._connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            try:
                connection.execute(
                    "CREATE TABLE IF NOT EXISTS authentication_schema_migrations "
                    "(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)"
                )
                versions = {row[0] for row in connection.execute(
                    "SELECT version FROM authentication_schema_migrations"
                )}
                if versions and max(versions) > SCHEMA_VERSION:
                    raise AuthenticationRepositoryUnavailable(
                        "Authentication service is unavailable"
                    )
                for version in range(1, SCHEMA_VERSION + 1):
                    if version in versions:
                        continue
                    migration = Path(__file__).with_name("migrations").joinpath(
                        f"{version:03d}_accounts_and_sessions.sql"
                    ).read_text(encoding="utf-8")
                    for statement in _statements(migration):
                        connection.execute(statement)
                    connection.execute(
                        "INSERT INTO authentication_schema_migrations VALUES (?, ?)",
                        (version, _utc_text(self.clock())),
                    )
                connection.commit()
            except Exception:
                connection.rollback()
                raise

    @staticmethod
    def _account(row: sqlite3.Row) -> ResearcherAccount:
        return ResearcherAccount(
            account_id=row["account_id"], email=row["email"],
            normalized_email=row["normalized_email"],
            password_hash=row["password_hash"], status=AccountStatus(row["status"]),
            created_at=_datetime(row["created_at"]), updated_at=_datetime(row["updated_at"]),
        )

    @staticmethod
    def _session(row: sqlite3.Row) -> AuthenticatedSession:
        return AuthenticatedSession(
            session_id=row["session_id"], account_id=row["account_id"],
            created_at=_datetime(row["created_at"]), expires_at=_datetime(row["expires_at"]),
            revoked_at=_datetime(row["revoked_at"]), last_used_at=_datetime(row["last_used_at"]),
        )

    def create_account(self, *, account_id: str, email: str,
                       normalized_email: str, password_hash: str) -> ResearcherAccount:
        occurred_at = _utc_text(self.clock())
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                try:
                    connection.execute(
                        "INSERT INTO researcher_account VALUES (?,?,?,?,?,?,?)",
                        (account_id, email, normalized_email, password_hash,
                         AccountStatus.ACTIVE.value, occurred_at, occurred_at),
                    )
                    row = connection.execute(
                        "SELECT * FROM researcher_account WHERE account_id=?", (account_id,)
                    ).fetchone()
                    connection.commit()
                    return self._account(row)
                except Exception:
                    connection.rollback()
                    raise
        except sqlite3.IntegrityError as error:
            if "normalized_email" in str(error):
                raise DuplicateAccount("Account cannot be created") from error
            raise AuthenticationRepositoryUnavailable(
                "Authentication service is unavailable"
            ) from error
        except sqlite3.Error as error:
            raise AuthenticationRepositoryUnavailable(
                "Authentication service is unavailable"
            ) from error

    def find_account_by_normalized_email(self, normalized_email: str) -> ResearcherAccount | None:
        try:
            with closing(self._connect()) as connection:
                row = connection.execute(
                    "SELECT * FROM researcher_account WHERE normalized_email=?",
                    (normalized_email,),
                ).fetchone()
                return self._account(row) if row else None
        except sqlite3.Error as error:
            raise AuthenticationRepositoryUnavailable(
                "Authentication service is unavailable"
            ) from error

    def create_session(self, *, session_id: str, account_id: str,
                       secret_digest: bytes, csrf_digest: bytes,
                       expires_at: datetime) -> AuthenticatedSession:
        occurred_at = _utc_text(self.clock())
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                connection.execute(
                    "INSERT INTO authenticated_session VALUES (?,?,?,?,?,?,?,?)",
                    (session_id, account_id, secret_digest, csrf_digest, occurred_at,
                     _utc_text(expires_at), None, occurred_at),
                )
                row = connection.execute(
                    "SELECT * FROM authenticated_session WHERE session_id=?", (session_id,)
                ).fetchone()
                connection.commit()
                return self._session(row)
        except sqlite3.Error as error:
            raise AuthenticationRepositoryUnavailable(
                "Authentication service is unavailable"
            ) from error

    def resolve_session(self, *, session_id: str, secret_digest: bytes,
                        used_at: datetime) -> tuple[AuthenticatedSession, ResearcherAccount, bytes] | None:
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                row = connection.execute(
                    "SELECT s.*, a.email, a.normalized_email, a.password_hash, "
                    "a.status, a.created_at AS account_created_at, "
                    "a.updated_at AS account_updated_at FROM authenticated_session s "
                    "JOIN researcher_account a ON a.account_id=s.account_id "
                    "WHERE s.session_id=? AND s.secret_digest=?",
                    (session_id, secret_digest),
                ).fetchone()
                if row is None or row["revoked_at"] is not None or _datetime(row["expires_at"]) <= used_at:
                    connection.rollback()
                    return None
                connection.execute(
                    "UPDATE authenticated_session SET last_used_at=? WHERE session_id=?",
                    (_utc_text(used_at), session_id),
                )
                connection.commit()
                session = AuthenticatedSession(
                    session_id=row["session_id"], account_id=row["account_id"],
                    created_at=_datetime(row["created_at"]), expires_at=_datetime(row["expires_at"]),
                    revoked_at=None, last_used_at=used_at,
                )
                account = ResearcherAccount(
                    account_id=row["account_id"], email=row["email"],
                    normalized_email=row["normalized_email"], password_hash=row["password_hash"],
                    status=AccountStatus(row["status"]),
                    created_at=_datetime(row["account_created_at"]),
                    updated_at=_datetime(row["account_updated_at"]),
                )
                return session, account, row["csrf_digest"]
        except sqlite3.Error as error:
            raise AuthenticationRepositoryUnavailable(
                "Authentication service is unavailable"
            ) from error

    def revoke_session(self, *, session_id: str, revoked_at: datetime) -> bool:
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                cursor = connection.execute(
                    "UPDATE authenticated_session SET revoked_at=? "
                    "WHERE session_id=? AND revoked_at IS NULL",
                    (_utc_text(revoked_at), session_id),
                )
                connection.commit()
                return cursor.rowcount == 1
        except sqlite3.Error as error:
            raise AuthenticationRepositoryUnavailable(
                "Authentication service is unavailable"
            ) from error

    def revoke_all_sessions(self, *, account_id: str, revoked_at: datetime) -> int:
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                cursor = connection.execute(
                    "UPDATE authenticated_session SET revoked_at=? "
                    "WHERE account_id=? AND revoked_at IS NULL",
                    (_utc_text(revoked_at), account_id),
                )
                connection.commit()
                return cursor.rowcount
        except sqlite3.Error as error:
            raise AuthenticationRepositoryUnavailable(
                "Authentication service is unavailable"
            ) from error
