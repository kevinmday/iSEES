from __future__ import annotations

from isees_uap.authentication.sqlite_repository import SQLiteAuthenticationRepository
from isees_uap.authentication.config import authentication_settings
from isees_uap.authentication.service import AuthenticationService
from isees_uap.authentication.passwords import verify_password
from isees_uap.authentication.sqlite_repository import session_secret_digest
from isees_uap.operations.pilot_account import manage_account, parser
from isees_uap.operations.owner_password_reset_startup import (
    OWNER_EMAIL, run_owner_password_reset,
)


def arguments(path, action, *extra):
    return parser().parse_args([
        action, "--email", " Researcher@Example.test ",
        "--database-path", str(path), *extra,
    ])


def test_lookup_mutations_confirmation_and_safe_output(tmp_path):
    path = (tmp_path / "authentication.db").resolve()
    repository = SQLiteAuthenticationRepository(path)
    service = AuthenticationService(repository, session_ttl_seconds=3600)
    service.create_account(email="Researcher@Example.test", password="secret password")
    _, issued = service.login(email="researcher@example.test", password="secret password")

    lookup = manage_account(arguments(path, "lookup"), {})
    assert "email=researcher@example.test" in lookup and "status=ACTIVE" in lookup
    assert "secret password" not in lookup and issued.bearer_secret not in lookup

    try:
        manage_account(arguments(path, "disable"), {})
        assert False, "mutation without confirmation must fail"
    except ValueError:
        pass
    disabled = manage_account(arguments(
        path, "disable", "--confirm-email", "researcher@example.test",
        "--confirm-action", "disable"), {})
    assert "status=DISABLED" in disabled and "sessions_revoked=1" in disabled
    enabled = manage_account(arguments(
        path, "enable", "--confirm-email", "researcher@example.test",
        "--confirm-action", "enable"), {})
    assert "status=ACTIVE" in enabled


def test_missing_identity_and_relative_database_fail_closed(tmp_path):
    path = (tmp_path / "authentication.db").resolve()
    SQLiteAuthenticationRepository(path)
    try:
        manage_account(arguments(path, "lookup"), {})
        assert False, "missing identity must fail"
    except ValueError as error:
        assert "exactly one" in str(error)
    relative = parser().parse_args([
        "lookup", "--email", "researcher@example.test",
        "--database-path", "relative.db",
    ])
    try:
        manage_account(relative, {})
        assert False, "relative path must fail"
    except ValueError as error:
        assert "absolute" in str(error)
    nonexistent = parser().parse_args([
        "lookup", "--email", "researcher@example.test",
        "--database-path", str((tmp_path / "missing.db").resolve()),
    ])
    try:
        manage_account(nonexistent, {})
        assert False, "missing database must fail without creating it"
    except ValueError as error:
        assert "does not exist" in str(error)
    assert not (tmp_path / "missing.db").exists()


def test_owner_password_reset_changes_only_exact_account_and_revokes_sessions(tmp_path, caplog):
    path = (tmp_path / "authentication.db").resolve()
    repository = SQLiteAuthenticationRepository(path)
    service = AuthenticationService(repository, session_ttl_seconds=3600)
    target = service.create_account(
        email="Researcher@Example.test", password="old target password")
    other = service.create_account(
        email="researcher+other@example.test", password="other account password")
    _, target_session = service.login(
        email="researcher@example.test", password="old target password")
    _, other_session = service.login(
        email="researcher+other@example.test", password="other account password")
    other_hash = other.password_hash
    new_password = "new owner password"
    values = {
        "ISEES_OWNER_RESET_PASSWORD": new_password,
        "ISEES_OWNER_RESET_REQUEST_ID": "owner-reset-test-1",
    }
    result = manage_account(arguments(
        path, "reset-password", "--confirm-email", "researcher@example.test",
        "--confirm-action", "reset-password"), values)

    changed = repository.find_account_by_normalized_email("researcher@example.test")
    unchanged = repository.find_account_by_normalized_email(
        "researcher+other@example.test")
    assert changed.account_id == target.account_id
    assert verify_password(new_password, changed.password_hash)
    assert not verify_password("old target password", changed.password_hash)
    assert unchanged.password_hash == other_hash
    target_id, target_secret = target_session.bearer_secret.split(".", 1)
    other_id, other_secret = other_session.bearer_secret.split(".", 1)
    assert repository.resolve_session(
        session_id=target_id,
        secret_digest=session_secret_digest(target_secret),
        used_at=repository.clock(),
    ) is None
    assert repository.resolve_session(
        session_id=other_id,
        secret_digest=session_secret_digest(other_secret),
        used_at=repository.clock(),
    ) is not None
    assert "sessions_revoked=1" in result
    combined_logs = "\n".join(record.getMessage() for record in caplog.records)
    assert new_password not in combined_logs
    assert changed.password_hash not in combined_logs


def test_owner_password_reset_is_one_use_and_never_logs_secret_material(tmp_path, caplog):
    path = (tmp_path / "authentication.db").resolve()
    repository = SQLiteAuthenticationRepository(path)
    AuthenticationService(repository, session_ttl_seconds=3600).create_account(
        email="researcher@example.test", password="old target password")
    values = {
        "ISEES_OWNER_RESET_PASSWORD": "new owner password",
        "ISEES_OWNER_RESET_REQUEST_ID": "owner-reset-test-2",
    }
    reset = arguments(
        path, "reset-password", "--confirm-email", "researcher@example.test",
        "--confirm-action", "reset-password")
    manage_account(reset, values)
    stored_hash = repository.find_account_by_normalized_email(
        "researcher@example.test").password_hash
    try:
        manage_account(reset, values)
        assert False, "a consumed reset request must fail"
    except ValueError as error:
        assert "already consumed" in str(error)
    log_text = "\n".join(record.getMessage() for record in caplog.records)
    assert values["ISEES_OWNER_RESET_PASSWORD"] not in log_text
    assert stored_hash not in log_text


def test_startup_reset_targets_only_the_governed_owner_and_logs_safely(tmp_path, caplog):
    root = tmp_path.resolve()
    path = root / "databases" / "authentication.sqlite3"
    repository = SQLiteAuthenticationRepository(path)
    AuthenticationService(repository, session_ttl_seconds=3600).create_account(
        email=OWNER_EMAIL.upper(), password="old owner password")
    password = "replacement owner password"
    with caplog.at_level("WARNING"):
        output = run_owner_password_reset({
            "ISEES_PERSISTENT_ROOT": str(root),
            "ISEES_OWNER_RESET_PASSWORD": password,
            "ISEES_OWNER_RESET_REQUEST_ID": "owner-reset-startup-test",
        })
    account = repository.find_account_by_normalized_email(OWNER_EMAIL)
    assert verify_password(password, account.password_hash)
    assert f"email={OWNER_EMAIL}" in output
    log_text = "\n".join(record.getMessage() for record in caplog.records)
    assert "OWNER_PASSWORD_RESET_COMPLETED" in log_text
    assert password not in log_text
    assert account.password_hash not in log_text


def test_startup_reset_reuses_production_authentication_database(tmp_path):
    configured_path = (tmp_path / "authoritative" / "production-auth.sqlite3").resolve()
    values = {
        "ISEES_AUTH_ENV": "production",
        "ISEES_AUTH_DB_PATH": str(configured_path),
        "ISEES_OWNER_RESET_PASSWORD": "replacement owner password",
        "ISEES_OWNER_RESET_REQUEST_ID": "owner-reset-production-config-test",
    }
    settings = authentication_settings(values)
    production_repository = SQLiteAuthenticationRepository(settings.database_path)
    production_service = AuthenticationService(
        production_repository,
        session_ttl_seconds=settings.session_ttl_seconds,
        candidate_access=settings.candidate_access,
        login_max_failures=settings.login_max_failures,
        login_window_seconds=settings.login_window_seconds,
        login_lockout_seconds=settings.login_lockout_seconds,
    )
    production_service.create_account(
        email=OWNER_EMAIL, password="old owner password")

    run_owner_password_reset(values)

    account = production_repository.find_account_by_normalized_email(OWNER_EMAIL)
    assert verify_password(values["ISEES_OWNER_RESET_PASSWORD"], account.password_hash)
    guessed_path = tmp_path / "databases" / "authentication.sqlite3"
    assert not guessed_path.exists()
