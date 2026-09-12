from __future__ import annotations

import hashlib
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

from .errors import AuthenticationRepositoryUnavailable, DuplicateAccount
from .models import AccountStatus, AuthenticatedSession, LoginThrottle, ResearcherAccount

SCHEMA_VERSION = 2
_MIGRATION_NAMES = {
    1: "001_accounts_and_sessions.sql",
    2: "002_login_throttling.sql",
}


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
                        _MIGRATION_NAMES[version]).read_text(encoding="utf-8")
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

    def login_throttle(self, *, normalized_email: str) -> LoginThrottle | None:
        try:
            with closing(self._connect()) as connection:
                row = connection.execute(
                    "SELECT * FROM login_throttle WHERE normalized_email=?",
                    (normalized_email,),
                ).fetchone()
                return LoginThrottle(
                    normalized_email=row["normalized_email"],
                    failure_count=row["failure_count"],
                    window_started_at=_datetime(row["window_started_at"]),
                    locked_until=_datetime(row["locked_until"]),
                    updated_at=_datetime(row["updated_at"]),
                ) if row else None
        except sqlite3.Error as error:
            raise AuthenticationRepositoryUnavailable(
                "Authentication service is unavailable") from error

    def record_login_failure(self, *, normalized_email: str, occurred_at: datetime,
                             max_failures: int, window_seconds: int,
                             lockout_seconds: int) -> LoginThrottle:
        from datetime import timedelta
        now_text = _utc_text(occurred_at)
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                connection.execute(
                    "DELETE FROM login_throttle WHERE updated_at < ?",
                    (_utc_text(occurred_at - timedelta(
                        seconds=max(window_seconds, lockout_seconds))),),
                )
                row = connection.execute(
                    "SELECT * FROM login_throttle WHERE normalized_email=?",
                    (normalized_email,),
                ).fetchone()
                window_start = occurred_at
                count = 1
                locked_until = None
                if row and _datetime(row["window_started_at"]) + timedelta(
                        seconds=window_seconds) > occurred_at:
                    window_start = _datetime(row["window_started_at"])
                    count = row["failure_count"] + 1
                if count >= max_failures:
                    locked_until = occurred_at + timedelta(seconds=lockout_seconds)
                connection.execute(
                    "INSERT INTO login_throttle VALUES (?,?,?,?,?) "
                    "ON CONFLICT(normalized_email) DO UPDATE SET "
                    "failure_count=excluded.failure_count, "
                    "window_started_at=excluded.window_started_at, "
                    "locked_until=excluded.locked_until, updated_at=excluded.updated_at",
                    (normalized_email, count, _utc_text(window_start),
                     _utc_text(locked_until) if locked_until else None, now_text),
                )
                connection.commit()
                return self.login_throttle(normalized_email=normalized_email)
        except sqlite3.Error as error:
            raise AuthenticationRepositoryUnavailable(
                "Authentication service is unavailable") from error

    def clear_login_throttle(self, *, normalized_email: str) -> None:
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                connection.execute("DELETE FROM login_throttle WHERE normalized_email=?",
                                   (normalized_email,))
                connection.commit()
        except sqlite3.Error as error:
            raise AuthenticationRepositoryUnavailable(
                "Authentication service is unavailable") from error

    def set_account_status(self, *, account_id: str, status: AccountStatus,
                           occurred_at: datetime) -> ResearcherAccount:
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                cursor = connection.execute(
                    "UPDATE researcher_account SET status=?, updated_at=? WHERE account_id=?",
                    (status.value, _utc_text(occurred_at), account_id),
                )
                if cursor.rowcount != 1:
                    connection.rollback()
                    raise ValueError("Account identity is missing or ambiguous")
                row = connection.execute(
                    "SELECT * FROM researcher_account WHERE account_id=?", (account_id,)
                ).fetchone()
                connection.commit()
                return self._account(row)
        except sqlite3.Error as error:
            raise AuthenticationRepositoryUnavailable(
                "Authentication service is unavailable") from error
