from __future__ import annotations

from fastapi.testclient import TestClient

from isees_uap.api import create_application
from isees_uap.api.v1.authentication import settings
from isees_uap.authentication.candidate_access import CandidateAccessPolicy
from isees_uap.authentication.config import AuthenticationSettings, authentication_settings
from isees_uap.authentication.principal import authentication_repository
from isees_uap.authentication.sqlite_repository import SQLiteAuthenticationRepository

PASSWORD = "synthetic candidate password"


def _policy(raw: str | None, *, enabled: bool = True) -> CandidateAccessPolicy:
    environment = {"ISEES_CANDIDATE_ACCESS_MODE": "enabled"} if enabled else {}
    if raw is not None:
        environment["ISEES_APPROVED_TESTER_EMAILS"] = raw
    return CandidateAccessPolicy.from_environment(environment)


def _client(tmp_path, policy: CandidateAccessPolicy) -> TestClient:
    tmp_path.mkdir(parents=True, exist_ok=True)
    repository = SQLiteAuthenticationRepository(tmp_path / "authentication.db")
    application = create_application({}, tmp_path / "no-frontend")
    config = AuthenticationSettings(
        database_path=repository.path,
        secure_cookies=False,
        candidate_access=policy,
    )
    application.dependency_overrides[authentication_repository] = lambda: repository
    application.dependency_overrides[settings] = lambda: config
    return TestClient(application)


def _register(client: TestClient, email: str):
    return client.post(
        "/api/v1/auth/accounts",
        json={"email": email, "password": PASSWORD},
    )


def test_candidate_mode_defaults_to_disabled():
    settings_value = authentication_settings({"ISEES_AUTH_ENV": "test"})
    assert settings_value.candidate_access == CandidateAccessPolicy()


def test_disabled_mode_preserves_unrestricted_registration(tmp_path):
    with _client(tmp_path, _policy(None, enabled=False)) as client:
        assert _register(client, "anyone@example.test").status_code == 201


def test_enabled_mode_accepts_approved_normalized_email(tmp_path):
    with _client(tmp_path, _policy(" approved@example.test ")) as client:
        response = _register(client, "  APPROVED@EXAMPLE.TEST ")
    assert response.status_code == 201
    assert response.json()["email"] == "APPROVED@EXAMPLE.TEST"


def test_candidate_configuration_is_captured_at_application_startup(tmp_path, monkeypatch):
    monkeypatch.setenv("ISEES_CANDIDATE_ACCESS_MODE", "enabled")
    monkeypatch.setenv("ISEES_APPROVED_TESTER_EMAILS", "startup@example.test")
    repository = SQLiteAuthenticationRepository(tmp_path / "authentication.db")
    application = create_application({}, tmp_path / "no-frontend")
    application.dependency_overrides[authentication_repository] = lambda: repository
    monkeypatch.setenv("ISEES_APPROVED_TESTER_EMAILS", "changed@example.test")
    with TestClient(application) as client:
        assert _register(client, "startup@example.test").status_code == 201
        assert _register(client, "changed@example.test").status_code == 409


def test_enabled_mode_rejects_unapproved_email_without_disclosure(tmp_path, caplog):
    configured = "approved@example.test"
    with _client(tmp_path, _policy(configured)) as client:
        response = _register(client, "unapproved@example.test")
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "ACCOUNT_UNAVAILABLE"
    assert configured not in response.text
    assert configured not in caplog.text


def test_missing_and_invalid_configuration_fail_closed(tmp_path):
    invalid_values = [
        None,
        "",
        "approved@example.test, ",
        "malformed",
        f"{'x' * 243}@example.test",
        "duplicate@example.test,DUPLICATE@example.test",
        ",".join(f"tester{number}@example.test" for number in range(11)),
    ]
    for number, raw in enumerate(invalid_values):
        with _client(tmp_path / str(number), _policy(raw)) as client:
            assert _register(client, "approved@example.test").status_code == 409


def test_tenth_unique_address_is_allowed_and_eleventh_is_rejected():
    ten = ",".join(f"tester{number}@example.test" for number in range(10))
    eleven = f"{ten},tester10@example.test"
    assert _policy(ten).configuration_valid is True
    assert _policy(eleven).configuration_valid is False
    assert _policy(eleven).approved_emails == frozenset()


def test_invalid_candidate_configuration_does_not_block_guest_spa(tmp_path, monkeypatch):
    frontend = tmp_path / "frontend"
    frontend.mkdir()
    (frontend / "index.html").write_text("guest entry", encoding="utf-8")
    monkeypatch.setenv("ISEES_CANDIDATE_ACCESS_MODE", "enabled")
    monkeypatch.delenv("ISEES_APPROVED_TESTER_EMAILS", raising=False)
    with TestClient(create_application({}, frontend)) as client:
        response = client.get("/")
    assert response.status_code == 200
    assert "guest entry" in response.text
