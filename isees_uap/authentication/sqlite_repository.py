from __future__ import annotations

import hashlib
import hmac
import json
import sqlite3
import uuid
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

from .errors import AuthenticationRepositoryUnavailable, DuplicateAccount
from .models import (
    AccountStatus, AuthenticatedSession, AuthenticationAuditEvent,
    AuthenticationAuditEventType, LoginThrottle, RecoveryTokenRecord,
    RecoveryThrottleScope, ResearcherAccount, GuestCredential, GuestIdentity,
    GuestSearchOperation, GuestSearchOperationState, GuestReservationState,
)

SCHEMA_VERSION = 4
_MIGRATION_NAMES = {
    1: "001_accounts_and_sessions.sql",
    2: "002_login_throttling.sql",
    3: "003_password_recovery.sql",
    4: "004_guest_authority.sql",
}

_FORBIDDEN_AUDIT_KEYS = frozenset({
    "token", "raw_token", "token_digest", "password", "reset_url", "url",
    "cookie", "csrf", "csrf_value", "provider_secret",
})


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


def _sanitized_metadata(metadata: object) -> str:
    def validate(value: object) -> None:
        if isinstance(value, dict):
            for key, child in value.items():
                normalized = str(key).strip().casefold().replace("-", "_")
                if normalized in _FORBIDDEN_AUDIT_KEYS:
                    raise ValueError("Authentication audit metadata contains a forbidden field")
                validate(child)
        elif isinstance(value, (list, tuple)):
            for child in value:
                validate(child)
        elif value is not None and not isinstance(value, (str, int, float, bool)):
            raise ValueError("Authentication audit metadata is not JSON-safe")
    validate(metadata)
    return json.dumps(metadata, sort_keys=True, separators=(",", ":"))


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

    def reset_owner_password_once(self, *, normalized_email: str, password_hash: str,
                                  request_id: str, occurred_at: datetime) -> tuple[str, int] | None:
        """Atomically reset one exact account once and revoke its active sessions."""
        now_text = _utc_text(occurred_at)
        metadata_json = _sanitized_metadata({"operation": "owner_password_reset"})
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                try:
                    if connection.execute(
                        "SELECT 1 FROM authentication_audit_event WHERE event_type=? "
                        "AND request_id=? LIMIT 1",
                        (AuthenticationAuditEventType.OWNER_PASSWORD_RESET_COMPLETED.value,
                         request_id),
                    ).fetchone() is not None:
                        connection.rollback()
                        return None
                    rows = connection.execute(
                        "SELECT account_id FROM researcher_account WHERE normalized_email=?",
                        (normalized_email,),
                    ).fetchall()
                    if len(rows) != 1:
                        connection.rollback()
                        raise ValueError("Account identity is missing or ambiguous")
                    account_id = rows[0]["account_id"]
                    updated = connection.execute(
                        "UPDATE researcher_account SET password_hash=?, updated_at=? "
                        "WHERE account_id=? AND normalized_email=?",
                        (password_hash, now_text, account_id, normalized_email),
                    )
                    if updated.rowcount != 1:
                        connection.rollback()
                        raise ValueError("Account identity is missing or ambiguous")
                    revoked = connection.execute(
                        "UPDATE authenticated_session SET revoked_at=? WHERE account_id=? "
                        "AND revoked_at IS NULL", (now_text, account_id),
                    ).rowcount
                    connection.execute(
                        "INSERT INTO authentication_audit_event VALUES (?,?,?,?,?,?,?,?)",
                        (f"aevt_{uuid.uuid4().hex}", account_id,
                         AuthenticationAuditEventType.OWNER_PASSWORD_RESET_COMPLETED.value,
                         now_text, request_id, None, "COMPLETED", metadata_json),
                    )
                    connection.commit()
                    return account_id, revoked
                except Exception:
                    connection.rollback()
                    raise
        except sqlite3.Error as error:
            raise AuthenticationRepositoryUnavailable(
                "Authentication service is unavailable") from error

    @staticmethod
    def _recovery_token(row: sqlite3.Row) -> RecoveryTokenRecord:
        return RecoveryTokenRecord(
            token_id=row["token_id"], account_id=row["account_id"],
            token_digest=row["token_digest"], created_at=_datetime(row["created_at"]),
            expires_at=_datetime(row["expires_at"]), used_at=_datetime(row["used_at"]),
            invalidated_at=_datetime(row["invalidated_at"]),
            requested_origin_digest=row["requested_origin_digest"],
        )

    def issue_recovery_token(self, *, token_id: str, account_id: str,
                             token_digest: bytes, created_at: datetime,
                             expires_at: datetime,
                             requested_origin_digest: bytes | None) -> RecoveryTokenRecord:
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                connection.execute(
                    "DELETE FROM password_reset_token WHERE expires_at<=?",
                    (_utc_text(created_at),),
                )
                connection.execute(
                    "UPDATE password_reset_token SET invalidated_at=? WHERE account_id=? "
                    "AND used_at IS NULL AND invalidated_at IS NULL AND expires_at>?",
                    (_utc_text(created_at), account_id, _utc_text(created_at)),
                )
                connection.execute(
                    "INSERT INTO password_reset_token VALUES (?,?,?,?,?,?,?,?)",
                    (token_id, account_id, token_digest, _utc_text(created_at),
                     _utc_text(expires_at), None, None, requested_origin_digest),
                )
                row = connection.execute(
                    "SELECT * FROM password_reset_token WHERE token_id=?", (token_id,)
                ).fetchone()
                connection.commit()
                return self._recovery_token(row)
        except sqlite3.Error as error:
            raise AuthenticationRepositoryUnavailable(
                "Authentication service is unavailable") from error

    def find_recovery_token(self, *, token_digest: bytes) -> RecoveryTokenRecord | None:
        try:
            with closing(self._connect()) as connection:
                row = connection.execute(
                    "SELECT * FROM password_reset_token WHERE token_digest=?", (token_digest,)
                ).fetchone()
                return self._recovery_token(row) if row else None
        except sqlite3.Error as error:
            raise AuthenticationRepositoryUnavailable(
                "Authentication service is unavailable") from error

    def allow_recovery_request(self, *, scope_type: RecoveryThrottleScope,
                               scope_digest: bytes, occurred_at: datetime,
                               max_requests: int, window_seconds: int,
                               block_seconds: int) -> bool:
        from datetime import timedelta
        now_text = _utc_text(occurred_at)
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                connection.execute(
                    "DELETE FROM recovery_throttle WHERE updated_at<? "
                    "AND (blocked_until IS NULL OR blocked_until<=?)",
                    (_utc_text(occurred_at - timedelta(
                        seconds=max(window_seconds, block_seconds))), now_text),
                )
                row = connection.execute(
                    "SELECT * FROM recovery_throttle WHERE scope_type=? AND scope_digest=?",
                    (scope_type.value, scope_digest),
                ).fetchone()
                if row is not None and row["blocked_until"] is not None \
                        and _datetime(row["blocked_until"]) > occurred_at:
                    connection.commit()
                    return False
                window_start = occurred_at
                count = 1
                if row is not None and _datetime(row["window_started_at"]) + timedelta(
                        seconds=window_seconds) > occurred_at:
                    window_start = _datetime(row["window_started_at"])
                    count = row["request_count"] + 1
                blocked_until = (occurred_at + timedelta(seconds=block_seconds)
                                 if count > max_requests else None)
                connection.execute(
                    "INSERT INTO recovery_throttle VALUES (?,?,?,?,?,?) "
                    "ON CONFLICT(scope_type,scope_digest) DO UPDATE SET "
                    "request_count=excluded.request_count, "
                    "window_started_at=excluded.window_started_at, "
                    "blocked_until=excluded.blocked_until, updated_at=excluded.updated_at",
                    (scope_type.value, scope_digest, count, _utc_text(window_start),
                     _utc_text(blocked_until) if blocked_until else None, now_text),
                )
                connection.commit()
                return blocked_until is None
        except sqlite3.Error as error:
            raise AuthenticationRepositoryUnavailable(
                "Authentication service is unavailable") from error

    def record_authentication_audit_event(self, event: AuthenticationAuditEvent) -> None:
        metadata_json = _sanitized_metadata(dict(event.metadata))
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                connection.execute(
                    "INSERT INTO authentication_audit_event VALUES (?,?,?,?,?,?,?,?)",
                    (event.event_id, event.account_id, event.event_type.value,
                     _utc_text(event.occurred_at), event.request_id, event.origin_digest,
                     event.outcome, metadata_json),
                )
                connection.commit()
        except sqlite3.Error as error:
            raise AuthenticationRepositoryUnavailable(
                "Authentication service is unavailable") from error

    def reset_password_atomically(self, *, token_digest: bytes, password_hash: str,
                                  occurred_at: datetime, request_id: str | None = None,
                                  origin_digest: bytes | None = None) -> bool:
        metadata_json = _sanitized_metadata({})
        now_text = _utc_text(occurred_at)
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                try:
                    row = connection.execute(
                        "SELECT * FROM password_reset_token WHERE token_digest=?",
                        (token_digest,),
                    ).fetchone()
                    valid = row is not None and row["used_at"] is None \
                        and row["invalidated_at"] is None \
                        and _datetime(row["expires_at"]) > occurred_at
                    if not valid:
                        connection.rollback()
                        return False
                    consumed = connection.execute(
                        "UPDATE password_reset_token SET used_at=? WHERE token_id=? "
                        "AND used_at IS NULL AND invalidated_at IS NULL AND expires_at>?",
                        (now_text, row["token_id"], now_text),
                    )
                    if consumed.rowcount != 1:
                        connection.rollback()
                        return False
                    account_id = row["account_id"]
                    if connection.execute(
                        "UPDATE researcher_account SET password_hash=?, updated_at=? "
                        "WHERE account_id=?", (password_hash, now_text, account_id),
                    ).rowcount != 1:
                        raise sqlite3.IntegrityError("Recovery account unavailable")
                    connection.execute(
                        "UPDATE authenticated_session SET revoked_at=? WHERE account_id=? "
                        "AND revoked_at IS NULL", (now_text, account_id),
                    )
                    connection.execute(
                        "UPDATE password_reset_token SET invalidated_at=? WHERE account_id=? "
                        "AND token_id<>? AND used_at IS NULL AND invalidated_at IS NULL",
                        (now_text, account_id, row["token_id"]),
                    )
                    connection.execute(
                        "INSERT INTO authentication_audit_event VALUES (?,?,?,?,?,?,?,?)",
                        (f"aevt_{uuid.uuid4().hex}", account_id,
                         AuthenticationAuditEventType.PASSWORD_RESET_COMPLETED.value,
                         now_text, request_id, origin_digest, "COMPLETED", metadata_json),
                    )
                    connection.commit()
                    return True
                except Exception:
                    connection.rollback()
                    raise
        except sqlite3.Error as error:
            raise AuthenticationRepositoryUnavailable(
                "Authentication service is unavailable") from error

    @staticmethod
    def _guest(row: sqlite3.Row) -> GuestIdentity:
        return GuestIdentity(row["guest_id"], _datetime(row["created_at"]),
                             _datetime(row["expires_at"]), _datetime(row["revoked_at"]))

    @staticmethod
    def _guest_credential(row: sqlite3.Row) -> GuestCredential:
        return GuestCredential(
            row["credential_id"], row["guest_id"], _datetime(row["created_at"]),
            _datetime(row["expires_at"]), _datetime(row["revoked_at"]),
            _datetime(row["last_used_at"]), row["csrf_digest"],
        )

    @staticmethod
    def _guest_operation(row: sqlite3.Row) -> GuestSearchOperation:
        return GuestSearchOperation(
            operation_id=row["operation_id"], guest_id=row["guest_id"],
            idempotency_key=row["idempotency_key"], request_fingerprint=row["request_fingerprint"],
            state=GuestSearchOperationState(row["state"]),
            reservation_state=GuestReservationState(row["reservation_state"]),
            reserved_units=row["reserved_units"], created_at=_datetime(row["created_at"]),
            updated_at=_datetime(row["updated_at"]),
        )

    def allow_guest_issuance(self, *, scope_digest: bytes, occurred_at: datetime,
                             max_requests: int, window_seconds: int,
                             block_seconds: int) -> bool:
        from datetime import timedelta
        now = _utc_text(occurred_at)
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                row = connection.execute(
                    "SELECT * FROM guest_issuance_throttle WHERE scope_digest=?", (scope_digest,)
                ).fetchone()
                if row and row["blocked_until"] and _datetime(row["blocked_until"]) > occurred_at:
                    connection.commit()
                    return False
                start, count = occurred_at, 1
                if row and _datetime(row["window_started_at"]) + timedelta(seconds=window_seconds) > occurred_at:
                    start, count = _datetime(row["window_started_at"]), row["request_count"] + 1
                blocked = occurred_at + timedelta(seconds=block_seconds) if count > max_requests else None
                connection.execute(
                    "INSERT INTO guest_issuance_throttle VALUES (?,?,?,?,?) "
                    "ON CONFLICT(scope_digest) DO UPDATE SET request_count=excluded.request_count, "
                    "window_started_at=excluded.window_started_at, blocked_until=excluded.blocked_until, "
                    "updated_at=excluded.updated_at",
                    (scope_digest, count, _utc_text(start), _utc_text(blocked) if blocked else None, now),
                )
                connection.commit()
                return blocked is None
        except sqlite3.Error as error:
            raise AuthenticationRepositoryUnavailable("Authentication service is unavailable") from error

    def create_guest(self, *, guest_id: str, credential_id: str, secret_digest: bytes,
                     csrf_digest: bytes, created_at: datetime,
                     expires_at: datetime,
                     revoke_guest_id: str | None = None) -> tuple[GuestIdentity, GuestCredential]:
        now = _utc_text(created_at)
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                if revoke_guest_id is not None:
                    if connection.execute(
                        "UPDATE guest_identity SET revoked_at=? WHERE guest_id=? AND revoked_at IS NULL",
                        (now, revoke_guest_id),
                    ).rowcount != 1:
                        raise sqlite3.IntegrityError("Guest rotation target is unavailable")
                    connection.execute(
                        "UPDATE guest_credential SET revoked_at=? WHERE guest_id=? AND revoked_at IS NULL",
                        (now, revoke_guest_id),
                    )
                connection.execute("INSERT INTO guest_identity VALUES (?,?,?,NULL)",
                                   (guest_id, now, _utc_text(expires_at)))
                connection.execute("INSERT INTO guest_credential VALUES (?,?,?,?,?,?,NULL,?)",
                                   (credential_id, guest_id, secret_digest, csrf_digest, now,
                                    _utc_text(expires_at), now))
                identity = connection.execute("SELECT * FROM guest_identity WHERE guest_id=?",
                                              (guest_id,)).fetchone()
                credential = connection.execute("SELECT * FROM guest_credential WHERE credential_id=?",
                                                (credential_id,)).fetchone()
                connection.commit()
                return self._guest(identity), self._guest_credential(credential)
        except sqlite3.Error as error:
            raise AuthenticationRepositoryUnavailable("Authentication service is unavailable") from error

    def resolve_guest(self, *, credential_id: str, secret_digest: bytes,
                      used_at: datetime) -> tuple[GuestIdentity, GuestCredential] | None:
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                row = connection.execute(
                    "SELECT c.*,g.created_at AS guest_created_at,g.expires_at AS guest_expires_at,"
                    "g.revoked_at AS guest_revoked_at FROM guest_credential c JOIN guest_identity g "
                    "ON g.guest_id=c.guest_id WHERE c.credential_id=? AND c.secret_digest=?",
                    (credential_id, secret_digest),
                ).fetchone()
                valid = row and row["revoked_at"] is None and row["guest_revoked_at"] is None \
                    and _datetime(row["expires_at"]) > used_at and _datetime(row["guest_expires_at"]) > used_at
                if not valid:
                    connection.rollback()
                    return None
                connection.execute("UPDATE guest_credential SET last_used_at=? WHERE credential_id=?",
                                   (_utc_text(used_at), credential_id))
                connection.commit()
                guest = GuestIdentity(row["guest_id"], _datetime(row["guest_created_at"]),
                                      _datetime(row["guest_expires_at"]), None)
                return guest, self._guest_credential(row)
        except sqlite3.Error as error:
            raise AuthenticationRepositoryUnavailable("Authentication service is unavailable") from error

    def revoke_guest(self, *, guest_id: str, revoked_at: datetime) -> bool:
        now = _utc_text(revoked_at)
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                changed = connection.execute(
                    "UPDATE guest_identity SET revoked_at=? WHERE guest_id=? AND revoked_at IS NULL",
                    (now, guest_id),
                ).rowcount
                connection.execute(
                    "UPDATE guest_credential SET revoked_at=? WHERE guest_id=? AND revoked_at IS NULL",
                    (now, guest_id),
                )
                connection.commit()
                return changed == 1
        except sqlite3.Error as error:
            raise AuthenticationRepositoryUnavailable("Authentication service is unavailable") from error

    def reserve_guest_search(self, *, operation_id: str, guest_id: str,
                             idempotency_key: str, request_fingerprint: bytes,
                             occurred_at: datetime, guest_allowance: int,
                             global_budget: int, units: int = 1) -> GuestSearchOperation:
        """Atomically replay or reserve. No provider call belongs inside this transaction."""
        now = _utc_text(occurred_at)
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                guest = connection.execute("SELECT * FROM guest_identity WHERE guest_id=?", (guest_id,)).fetchone()
                if not guest or guest["revoked_at"] or _datetime(guest["expires_at"]) <= occurred_at:
                    raise ValueError("GUEST_NOT_AUTHORIZED")
                by_operation = connection.execute(
                    "SELECT * FROM guest_search_operation WHERE operation_id=?",
                    (operation_id,),
                ).fetchone()
                if by_operation:
                    if (by_operation["guest_id"] != guest_id
                            or not hmac.compare_digest(
                                by_operation["request_fingerprint"], request_fingerprint)
                            or by_operation["idempotency_key"] != idempotency_key):
                        raise ValueError("IDEMPOTENCY_CONFLICT")
                    connection.commit()
                    return self._guest_operation(by_operation)
                by_key = connection.execute(
                    "SELECT * FROM guest_search_operation WHERE guest_id=? AND idempotency_key=?",
                    (guest_id, idempotency_key),
                ).fetchone()
                if by_key:
                    if not hmac.compare_digest(by_key["request_fingerprint"], request_fingerprint):
                        raise ValueError("IDEMPOTENCY_CONFLICT")
                    connection.commit()
                    return self._guest_operation(by_key)
                by_fingerprint = connection.execute(
                    "SELECT * FROM guest_search_operation WHERE guest_id=? AND request_fingerprint=?",
                    (guest_id, request_fingerprint),
                ).fetchone()
                if by_fingerprint:
                    connection.commit()
                    return self._guest_operation(by_fingerprint)
                used = connection.execute(
                    "SELECT COUNT(*) FROM guest_search_operation WHERE guest_id=? "
                    "AND reservation_state<>'RELEASED'", (guest_id,),
                ).fetchone()[0]
                if used + units > guest_allowance:
                    raise ValueError("GUEST_ALLOWANCE_EXHAUSTED")
                budget = connection.execute("SELECT * FROM guest_search_budget WHERE budget_id=1").fetchone()
                if budget is None:
                    connection.execute("INSERT INTO guest_search_budget VALUES (1,0,0,?)", (now,))
                    reserved = charged = 0
                else:
                    reserved, charged = budget["reserved_units"], budget["charged_units"]
                if reserved + charged + units > global_budget:
                    raise ValueError("GLOBAL_BUDGET_EXHAUSTED")
                connection.execute(
                    "INSERT INTO guest_search_operation VALUES (?,?,?,?,?,?,?,?,?)",
                    (operation_id, guest_id, idempotency_key, request_fingerprint,
                     GuestSearchOperationState.RESERVED.value, GuestReservationState.HELD.value,
                     units, now, now),
                )
                connection.execute(
                    "UPDATE guest_search_budget SET reserved_units=reserved_units+?,updated_at=? WHERE budget_id=1",
                    (units, now),
                )
                row = connection.execute("SELECT * FROM guest_search_operation WHERE operation_id=?",
                                         (operation_id,)).fetchone()
                connection.commit()
                return self._guest_operation(row)
        except ValueError:
            raise
        except sqlite3.Error as error:
            raise AuthenticationRepositoryUnavailable("Authentication service is unavailable") from error

    def transition_guest_search(self, *, operation_id: str, guest_id: str,
                                target: GuestSearchOperationState,
                                occurred_at: datetime) -> GuestSearchOperation:
        allowed = {
            GuestSearchOperationState.DISPATCHING: ({GuestSearchOperationState.RESERVED}, GuestReservationState.HELD),
            GuestSearchOperationState.DEFINITELY_UNDISPATCHED: ({GuestSearchOperationState.RESERVED}, GuestReservationState.RELEASED),
            GuestSearchOperationState.UNKNOWN: ({GuestSearchOperationState.DISPATCHING}, GuestReservationState.CHARGED),
            GuestSearchOperationState.COMPLETED: ({GuestSearchOperationState.DISPATCHING}, GuestReservationState.CHARGED),
        }
        if target not in allowed:
            raise ValueError("INVALID_OPERATION_TRANSITION")
        sources, reservation = allowed[target]
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                row = connection.execute(
                    "SELECT * FROM guest_search_operation WHERE operation_id=? AND guest_id=?",
                    (operation_id, guest_id),
                ).fetchone()
                if row is None:
                    raise ValueError("OPERATION_NOT_FOUND")
                if GuestSearchOperationState(row["state"]) is target:
                    connection.commit(); return self._guest_operation(row)
                if GuestSearchOperationState(row["state"]) not in sources:
                    raise ValueError("INVALID_OPERATION_TRANSITION")
                units = row["reserved_units"]
                if reservation is GuestReservationState.RELEASED:
                    connection.execute("UPDATE guest_search_budget SET reserved_units=reserved_units-?,updated_at=? WHERE budget_id=1",
                                       (units, _utc_text(occurred_at)))
                elif reservation is GuestReservationState.CHARGED:
                    connection.execute("UPDATE guest_search_budget SET reserved_units=reserved_units-?,charged_units=charged_units+?,updated_at=? WHERE budget_id=1",
                                       (units, units, _utc_text(occurred_at)))
                connection.execute(
                    "UPDATE guest_search_operation SET state=?,reservation_state=?,updated_at=? WHERE operation_id=?",
                    (target.value, reservation.value, _utc_text(occurred_at), operation_id),
                )
                row = connection.execute("SELECT * FROM guest_search_operation WHERE operation_id=?",
                                         (operation_id,)).fetchone()
                connection.commit(); return self._guest_operation(row)
        except ValueError:
            raise
        except sqlite3.Error as error:
            raise AuthenticationRepositoryUnavailable("Authentication service is unavailable") from error
