from __future__ import annotations

import base64
import hashlib
import sqlite3
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

from isees_uap.authentication.candidate_access import CandidateAccessPolicy
from isees_uap.authentication.errors import (
    AuthenticationRepositoryUnavailable, InvalidAccountInput, InvalidCredentials,
)
from isees_uap.authentication.models import (
    AccountStatus, AuthenticationAuditEvent, AuthenticationAuditEventType,
    PasswordResetCommand, RecoveryRequestInput,
)
from isees_uap.authentication.recovery_delivery import RecordingRecoveryDelivery
from isees_uap.authentication.service import AuthenticationService
from isees_uap.authentication.sqlite_repository import (
    SCHEMA_VERSION, SQLiteAuthenticationRepository, _statements,
)

OLD_PASSWORD = "correct horse battery staple"
NEW_PASSWORD = "a newly chosen secure password"


class Clock:
    def __init__(self) -> None:
        self.now = datetime(2026, 5, 1, 12, tzinfo=timezone.utc)

    def __call__(self) -> datetime:
        return self.now


@pytest.fixture
def recovery(tmp_path):
    clock = Clock()
    repository = SQLiteAuthenticationRepository(tmp_path / "authentication.db", clock=clock)
    delivery = RecordingRecoveryDelivery()
    service = AuthenticationService(
        repository, session_ttl_seconds=3600, clock=clock,
        recovery_delivery=delivery, recovery_entropy=lambda size: b"R" * size,
    )
    account = service.create_account(email="Researcher@Example.test", password=OLD_PASSWORD)
    return service, repository, delivery, clock, account


def _request(service, email="researcher@example.test"):
    service.request_password_recovery(RecoveryRequestInput(email=email, request_id="req_test"))


def _token(delivery):
    return delivery.records[-1].capability.raw_token


def _reset(service, token, password=NEW_PASSWORD):
    return service.reset_password(PasswordResetCommand(token=token, new_password=password))


def test_migration_two_to_three_is_additive_and_initialization_idempotent(tmp_path):
    path = tmp_path / "authentication.db"
    with sqlite3.connect(path) as connection:
        connection.execute(
            "CREATE TABLE authentication_schema_migrations "
            "(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)"
        )
        for version in (1, 2):
            script = Path(f"isees_uap/authentication/migrations/{version:03d}_" +
                          ("accounts_and_sessions.sql" if version == 1 else "login_throttling.sql"))
            for statement in _statements(script.read_text(encoding="utf-8")):
                connection.execute(statement)
            connection.execute(
                "INSERT INTO authentication_schema_migrations VALUES (?, 'before')", (version,)
            )
        connection.execute(
            "INSERT INTO researcher_account VALUES (?,?,?,?,?,?,?)",
            ("acct_existing", "old@example.test", "old@example.test", "old-hash",
             "ACTIVE", "2026-01-01T00:00:00Z", "2026-01-01T00:00:00Z"),
        )
        connection.execute(
            "INSERT INTO authenticated_session VALUES (?,?,?,?,?,?,?,?)",
            ("ses_existing", "acct_existing", b"secret", b"csrf",
             "2026-01-01T00:00:00Z", "2027-01-01T00:00:00Z", None,
             "2026-01-01T00:00:00Z"),
        )
    SQLiteAuthenticationRepository(path)
    SQLiteAuthenticationRepository(path)
    with sqlite3.connect(path) as connection:
        assert connection.execute(
            "SELECT version FROM authentication_schema_migrations ORDER BY version"
        ).fetchall() == [(1,), (2,), (SCHEMA_VERSION,)]
        assert connection.execute("SELECT account_id FROM researcher_account").fetchone()[0] == "acct_existing"
        assert connection.execute("SELECT session_id FROM authenticated_session").fetchone()[0] == "ses_existing"


def test_raw_token_never_persists_digest_does_and_entropy_is_256_bits(recovery):
    service, repository, delivery, _, _ = recovery
    _request(service)
    raw = _token(delivery)
    decoded = base64.urlsafe_b64decode(raw + "=" * (-len(raw) % 4))
    assert len(decoded) * 8 >= 256
    with sqlite3.connect(repository.path) as connection:
        row = connection.execute("SELECT token_digest FROM password_reset_token").fetchone()
        dump = "\n".join(connection.iterdump())
    assert row[0] == hashlib.sha256(raw.encode("ascii")).digest()
    assert raw not in dump
    assert raw not in repr(delivery.records[0])


def test_expiry_is_exact_and_expired_token_fails(recovery):
    service, _, delivery, clock, _ = recovery
    _request(service)
    raw = _token(delivery)
    clock.now += timedelta(minutes=30)
    assert _reset(service, raw).completed is False


def test_newer_token_invalidates_older_and_invalidated_token_fails(recovery):
    service, repository, delivery, clock, _ = recovery
    _request(service)
    old = _token(delivery)
    clock.now += timedelta(seconds=1)
    service.recovery_entropy = lambda size: b"N" * size
    _request(service)
    new = _token(delivery)
    assert _reset(service, old).completed is False
    assert _reset(service, new).completed is True
    with sqlite3.connect(repository.path) as connection:
        assert connection.execute(
            "SELECT invalidated_at IS NOT NULL FROM password_reset_token "
            "WHERE token_digest=?", (hashlib.sha256(old.encode()).digest(),)
        ).fetchone()[0] == 1


@pytest.mark.parametrize("token", ["", "not base64!", "c2hvcnQ", "A" * 300])
def test_malformed_tokens_fail_closed(recovery, token):
    service, _, _, _, _ = recovery
    assert _reset(service, token).completed is False


def test_unknown_disabled_and_ineligible_accounts_receive_nothing(tmp_path):
    clock = Clock()
    repository = SQLiteAuthenticationRepository(tmp_path / "authentication.db", clock=clock)
    delivery = RecordingRecoveryDelivery()
    service = AuthenticationService(
        repository, session_ttl_seconds=3600, clock=clock, recovery_delivery=delivery,
    )
    disabled = service.create_account(email="disabled@example.test", password=OLD_PASSWORD)
    repository.set_account_status(
        account_id=disabled.account_id, status=AccountStatus.DISABLED, occurred_at=clock.now,
    )
    eligible = service.create_account(email="excluded@example.test", password=OLD_PASSWORD)
    service.candidate_access = CandidateAccessPolicy(
        enabled=True, approved_emails=frozenset({"someone-else@example.test"})
    )
    outcomes = [service.request_password_recovery(RecoveryRequestInput(email=email))
                for email in ("missing@example.test", disabled.email, eligible.email)]
    assert all(outcome.accepted for outcome in outcomes)
    assert delivery.records == []
    with sqlite3.connect(repository.path) as connection:
        assert connection.execute("SELECT count(*) FROM password_reset_token").fetchone()[0] == 0


def test_unknown_identity_throttle_is_bounded_and_rate_limited(tmp_path):
    clock = Clock()
    repository = SQLiteAuthenticationRepository(tmp_path / "authentication.db", clock=clock)
    delivery = RecordingRecoveryDelivery()
    service = AuthenticationService(
        repository, session_ttl_seconds=3600, clock=clock, recovery_delivery=delivery,
        recovery_max_requests=2,
    )
    for index in range(10):
        service.request_password_recovery(RecoveryRequestInput(
            email=f"missing-{index}@example.test"
        ))
    with sqlite3.connect(repository.path) as connection:
        assert connection.execute("SELECT count(*) FROM recovery_throttle").fetchone()[0] == 1
        assert connection.execute(
            "SELECT count(*) FROM authentication_audit_event "
            "WHERE event_type='PASSWORD_RECOVERY_RATE_LIMITED'"
        ).fetchone()[0] == 8


def test_password_policy_cannot_be_bypassed(recovery):
    service, _, delivery, _, _ = recovery
    _request(service)
    with pytest.raises(InvalidAccountInput):
        _reset(service, _token(delivery), "short")


def test_success_changes_password_replays_fail_and_sessions_are_scoped(recovery):
    service, repository, delivery, _, account = recovery
    other = service.create_account(email="other@example.test", password=OLD_PASSWORD)
    service.login(email=account.email, password=OLD_PASSWORD)
    service.login(email=other.email, password=OLD_PASSWORD)
    _request(service)
    raw = _token(delivery)
    assert _reset(service, raw).completed is True
    assert _reset(service, raw).completed is False
    with pytest.raises(InvalidCredentials):
        service.login(email=account.email, password=OLD_PASSWORD)
    service.login(email=account.email, password=NEW_PASSWORD)
    with sqlite3.connect(repository.path) as connection:
        assert connection.execute(
            "SELECT count(*) FROM authenticated_session WHERE account_id=? AND revoked_at IS NULL",
            (other.account_id,),
        ).fetchone()[0] == 1
        assert connection.execute(
            "SELECT count(*) FROM authentication_audit_event "
            "WHERE event_type='PASSWORD_RESET_COMPLETED'"
        ).fetchone()[0] == 1


def test_two_simultaneous_submissions_have_exactly_one_success(recovery):
    service, repository, delivery, clock, _ = recovery
    _request(service)
    raw = _token(delivery)
    barrier = threading.Barrier(2)
    results = []

    def submit():
        contender = AuthenticationService(
            repository, session_ttl_seconds=3600, clock=clock,
            recovery_delivery=delivery,
        )
        barrier.wait()
        results.append(_reset(contender, raw).completed)

    threads = [threading.Thread(target=submit) for _ in range(2)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    assert sorted(results) == [False, True]


def test_success_unit_rolls_back_when_audit_insert_fails(recovery):
    service, repository, delivery, _, account = recovery
    service.login(email=account.email, password=OLD_PASSWORD)
    _request(service)
    raw = _token(delivery)
    with sqlite3.connect(repository.path) as connection:
        connection.execute(
            "CREATE TRIGGER fail_completion BEFORE INSERT ON authentication_audit_event "
            "WHEN NEW.event_type='PASSWORD_RESET_COMPLETED' BEGIN "
            "SELECT RAISE(ABORT, 'synthetic audit failure'); END"
        )
    with pytest.raises(AuthenticationRepositoryUnavailable):
        _reset(service, raw)
    service.login(email=account.email, password=OLD_PASSWORD)
    with sqlite3.connect(repository.path) as connection:
        assert connection.execute(
            "SELECT used_at FROM password_reset_token WHERE token_digest=?",
            (hashlib.sha256(raw.encode()).digest(),),
        ).fetchone()[0] is None
        assert connection.execute(
            "SELECT count(*) FROM authentication_audit_event "
            "WHERE event_type='PASSWORD_RESET_COMPLETED'"
        ).fetchone()[0] == 0


@pytest.mark.parametrize("key", [
    "token", "token_digest", "password", "reset_url", "cookie", "csrf", "provider_secret",
])
def test_audit_metadata_rejects_sensitive_keys(recovery, key):
    _, repository, _, clock, _ = recovery
    event = AuthenticationAuditEvent(
        event_id=f"aevt_{key}",
        event_type=AuthenticationAuditEventType.PASSWORD_RESET_REJECTED,
        occurred_at=clock.now, outcome="REJECTED", metadata={"nested": {key: "sensitive"}},
    )
    with pytest.raises(ValueError):
        repository.record_authentication_audit_event(event)


def test_persisted_audit_contains_no_recovery_secrets(recovery):
    service, repository, delivery, _, _ = recovery
    _request(service)
    raw = _token(delivery)
    _reset(service, raw)
    with sqlite3.connect(repository.path) as connection:
        persisted = "\n".join(
            "|".join("" if value is None else str(value) for value in row)
            for row in connection.execute("SELECT * FROM authentication_audit_event")
        )
    assert raw not in persisted
    for secret in (NEW_PASSWORD, "http://", "https://", "cookie", "csrf"):
        assert secret not in persisted.casefold()


def test_repository_failure_fails_closed(recovery, monkeypatch):
    service, repository, delivery, _, _ = recovery
    _request(service)
    raw = _token(delivery)
    monkeypatch.setattr(repository, "reset_password_atomically", lambda **kwargs: (_ for _ in ()).throw(
        AuthenticationRepositoryUnavailable("Authentication service is unavailable")
    ))
    with pytest.raises(AuthenticationRepositoryUnavailable):
        _reset(service, raw)
