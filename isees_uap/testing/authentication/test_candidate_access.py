from __future__ import annotations

import sqlite3
from dataclasses import replace

from fastapi.testclient import TestClient

from isees_uap.api import create_application
from isees_uap.api.v1.authentication import settings
from isees_uap.authentication.candidate_access import CandidateAccessPolicy
from isees_uap.authentication.config import AuthenticationSettings, authentication_settings
from isees_uap.authentication.principal import authentication_repository
from isees_uap.authentication.sqlite_repository import SQLiteAuthenticationRepository
from isees_uap.investigations.sqlite_repository import SQLiteInvestigationRepository

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


def _login(client: TestClient, email: str, password: str = PASSWORD):
    return client.post(
        "/api/v1/auth/sessions",
        json={"email": email, "password": password},
    )


def _replace_policy(client: TestClient, policy: CandidateAccessPolicy) -> None:
    current = client.app.dependency_overrides[settings]()
    client.app.dependency_overrides[settings] = lambda: replace(
        current, candidate_access=policy
    )


def test_candidate_mode_defaults_to_disabled():
    settings_value = authentication_settings({"ISEES_AUTH_ENV": "test"})
    assert settings_value.candidate_access == CandidateAccessPolicy()


def test_disabled_mode_preserves_unrestricted_registration(tmp_path):
    with _client(tmp_path, _policy(None, enabled=False)) as client:
        assert _register(client, "anyone@example.test").status_code == 201


def test_disabled_mode_preserves_valid_account_login(tmp_path):
    with _client(tmp_path, _policy(None, enabled=False)) as client:
        assert _register(client, "anyone@example.test").status_code == 201
        client.cookies.clear()
        assert _login(client, "anyone@example.test").status_code == 200


def test_enabled_mode_accepts_approved_normalized_email(tmp_path):
    with _client(tmp_path, _policy(" approved@example.test ")) as client:
        response = _register(client, "  APPROVED@EXAMPLE.TEST ")
    assert response.status_code == 201
    assert response.json()["email"] == "APPROVED@EXAMPLE.TEST"


def test_candidate_login_is_eligible_and_non_disclosing(tmp_path, caplog):
    configured = "approved@example.test"
    with _client(tmp_path, _policy(configured)) as client:
        assert _register(client, configured).status_code == 201
        client.cookies.clear()
        approved = _login(client, " APPROVED@EXAMPLE.TEST ")
        wrong_password = _login(client, configured, "wrong password")
        _replace_policy(client, _policy("other@example.test"))
        unapproved = _login(client, configured)
    assert approved.status_code == 200
    assert wrong_password.status_code == unapproved.status_code == 401
    assert wrong_password.json()["error"]["code"] == unapproved.json()["error"]["code"]
    assert wrong_password.json()["error"]["message"] == unapproved.json()["error"]["message"]
    assert configured not in wrong_password.text + unapproved.text + caplog.text


def test_all_ineligible_logins_have_the_same_generic_failure(tmp_path):
    configured = "approved@example.test"
    with _client(tmp_path, _policy(configured)) as client:
        account_id = _register(client, configured).json()["researcherId"]
        client.cookies.clear()
        wrong = _login(client, configured, "wrong password")
        missing = _login(client, "missing@example.test")
        _replace_policy(client, _policy("other@example.test"))
        unapproved = _login(client, configured)
        repository = client.app.dependency_overrides[authentication_repository]()
        with sqlite3.connect(repository.path) as connection:
            connection.execute(
                "UPDATE researcher_account SET status='DISABLED' WHERE account_id=?",
                (account_id,),
            )
        disabled = _login(client, configured)
    failures = [response.json()["error"] for response in (wrong, missing, unapproved, disabled)]
    assert all(response.status_code == 401 for response in (wrong, missing, unapproved, disabled))
    assert {(failure["code"], failure["message"]) for failure in failures} == {
        ("INVALID_CREDENTIALS", "Email or password is invalid")
    }


def test_removed_eligibility_rejects_restore_and_revokes_all_account_sessions(tmp_path):
    configured = "approved@example.test"
    with _client(tmp_path, _policy(configured)) as client:
        created = _register(client, configured)
        first_cookie = client.cookies.get("isees_session")
        client.cookies.clear()
        assert _login(client, configured).status_code == 200
        second_cookie = client.cookies.get("isees_session")
        _replace_policy(client, _policy("other@example.test"))
        assert client.get("/api/v1/auth/session").status_code == 401
        client.cookies.set("isees_session", first_cookie)
        assert client.get("/api/v1/auth/session").status_code == 401
        repository = client.app.dependency_overrides[authentication_repository]()
        with sqlite3.connect(repository.path) as connection:
            rows = connection.execute(
                "SELECT revoked_at FROM authenticated_session WHERE account_id=?",
                (created.json()["researcherId"],),
            ).fetchall()
    assert first_cookie != second_cookie
    assert len(rows) == 2 and all(row[0] is not None for row in rows)


def test_removed_account_does_not_affect_other_approved_sessions(tmp_path):
    first = "first@example.test"
    second = "second@example.test"
    with _client(tmp_path, _policy(f"{first},{second}")) as client:
        assert _register(client, first).status_code == 201
        client.cookies.clear()
        assert _register(client, second).status_code == 201
        second_cookie = client.cookies.get("isees_session")
        _replace_policy(client, _policy(second))
        client.cookies.clear()
        assert _login(client, first).status_code == 401
        client.cookies.set("isees_session", second_cookie)
        assert client.get("/api/v1/auth/session").status_code == 200


def test_disabled_account_cannot_login_or_restore_and_all_sessions_are_revoked(tmp_path):
    configured = "disabled@example.test"
    with _client(tmp_path, _policy(configured, enabled=False)) as client:
        created = _register(client, configured)
        repository = client.app.dependency_overrides[authentication_repository]()
        with sqlite3.connect(repository.path) as connection:
            connection.execute(
                "UPDATE researcher_account SET status='DISABLED' WHERE account_id=?",
                (created.json()["researcherId"],),
            )
        assert client.get("/api/v1/auth/session").status_code == 401
        client.cookies.clear()
        assert _login(client, configured).status_code == 401
        with sqlite3.connect(repository.path) as connection:
            assert connection.execute(
                "SELECT count(*) FROM authenticated_session "
                "WHERE account_id=? AND revoked_at IS NULL",
                (created.json()["researcherId"],),
            ).fetchone()[0] == 0


def test_invalid_policy_fails_closed_for_login_restore_and_registration(tmp_path):
    configured = "approved@example.test"
    with _client(tmp_path, _policy(configured)) as client:
        assert _register(client, configured).status_code == 201
        _replace_policy(client, _policy(None))
        assert client.get("/api/v1/auth/session").status_code == 401
        client.cookies.clear()
        assert _login(client, configured).status_code == 401
        assert _register(client, "new@example.test").status_code == 409


def test_removed_eligibility_retains_account_and_owned_investigation(tmp_path):
    configured = "owner@example.test"
    with _client(tmp_path, _policy(configured)) as client:
        created = _register(client, configured).json()
        investigations = SQLiteInvestigationRepository(tmp_path / "investigations.db")
        investigations.create(
            investigation_id="inv_retained",
            owner_principal_id=created["researcherId"],
            title="Retained synthetic record",
        )
        _replace_policy(client, _policy("other@example.test"))
        assert client.get("/api/v1/auth/session").status_code == 401
        repository = client.app.dependency_overrides[authentication_repository]()
        assert repository.find_account_by_normalized_email(configured) is not None
        assert investigations.get_owned(
            investigation_id="inv_retained",
            owner_principal_id=created["researcherId"],
        ) is not None


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
