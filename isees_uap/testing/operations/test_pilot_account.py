from __future__ import annotations

from isees_uap.authentication.sqlite_repository import SQLiteAuthenticationRepository
from isees_uap.authentication.service import AuthenticationService
from isees_uap.operations.pilot_account import manage_account, parser


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
