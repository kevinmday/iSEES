from __future__ import annotations

import sqlite3
from datetime import datetime, timedelta, timezone

import pytest

from isees_uap.authentication.errors import (
    AuthenticationRepositoryUnavailable, InvalidCredentials,
)
from isees_uap.authentication.service import AuthenticationService
from isees_uap.authentication.sqlite_repository import (
    SCHEMA_VERSION, SQLiteAuthenticationRepository,
)

PASSWORD = "correct horse battery staple"


class Clock:
    def __init__(self):
        self.now = datetime(2026, 1, 1, tzinfo=timezone.utc)

    def __call__(self):
        return self.now


@pytest.fixture
def authority(tmp_path):
    clock = Clock()
    repository = SQLiteAuthenticationRepository(tmp_path / "authentication.db", clock=clock)
    service = AuthenticationService(
        repository, session_ttl_seconds=3600, clock=clock,
        login_max_failures=5, login_window_seconds=900, login_lockout_seconds=900,
    )
    service.create_account(email="Researcher@Example.test", password=PASSWORD)
    return service, repository, clock


def fail(service, email="researcher@example.test"):
    with pytest.raises(InvalidCredentials) as error:
        service.login(email=email, password="wrong password")
    assert str(error.value) == "Email or password is invalid"


def test_failures_below_threshold_and_threshold_lockout(authority):
    service, repository, _ = authority
    for _ in range(4):
        fail(service)
    assert repository.login_throttle(
        normalized_email="researcher@example.test").locked_until is None
    fail(service)
    state = repository.login_throttle(normalized_email="researcher@example.test")
    assert state.failure_count == 5 and state.locked_until is not None
    with pytest.raises(InvalidCredentials):
        service.login(email="researcher@example.test", password=PASSWORD)


def test_existing_and_nonexistent_identity_have_generic_failure(authority):
    service, _, _ = authority
    messages = []
    for email in ("researcher@example.test", "missing@example.test"):
        with pytest.raises(InvalidCredentials) as error:
            service.login(email=email, password="wrong password")
        messages.append((error.value.code, str(error.value)))
    assert messages[0] == messages[1]


def test_arbitrary_missing_identities_have_bounded_persistent_state(authority):
    service, repository, _ = authority
    for index in range(100):
        fail(service, f"missing-{index}@example.test")
    with sqlite3.connect(repository.path) as connection:
        rows = connection.execute(
            "SELECT normalized_email FROM login_throttle ORDER BY normalized_email"
        ).fetchall()
    assert rows == [("__unknown_identity__",)]


def test_success_resets_and_expired_lockout_recovers(authority):
    service, repository, clock = authority
    fail(service)
    service.login(email="researcher@example.test", password=PASSWORD)
    assert repository.login_throttle(normalized_email="researcher@example.test") is None
    for _ in range(5):
        fail(service)
    clock.now += timedelta(seconds=901)
    service.login(email="researcher@example.test", password=PASSWORD)
    assert repository.login_throttle(normalized_email="researcher@example.test") is None


def test_migration_is_idempotent_and_versioned(tmp_path):
    path = tmp_path / "authentication.db"
    SQLiteAuthenticationRepository(path)
    SQLiteAuthenticationRepository(path)
    with sqlite3.connect(path) as connection:
        assert connection.execute(
            "SELECT version FROM authentication_schema_migrations ORDER BY version"
        ).fetchall() == [(1,), (SCHEMA_VERSION,)]
        assert connection.execute(
            "SELECT count(*) FROM sqlite_master WHERE name='login_throttle'"
        ).fetchone()[0] == 1


def test_repository_unavailable_fails_closed(authority, monkeypatch):
    service, repository, _ = authority
    def unavailable(**_kwargs):
        raise AuthenticationRepositoryUnavailable("Authentication service is unavailable")
    monkeypatch.setattr(repository, "login_throttle", unavailable)
    with pytest.raises(AuthenticationRepositoryUnavailable):
        service.login(email="researcher@example.test", password=PASSWORD)
