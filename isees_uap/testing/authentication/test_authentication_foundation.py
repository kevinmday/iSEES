from __future__ import annotations

import hashlib
import sqlite3
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from isees_uap.api import app
from isees_uap.api.v1.authentication import settings
from isees_uap.authentication.config import AuthenticationSettings
from isees_uap.authentication.principal import authentication_repository
from isees_uap.authentication.sqlite_repository import (
    SQLiteAuthenticationRepository, session_secret_digest,
)
from isees_uap.investigations.sqlite_repository import SQLiteInvestigationRepository

PASSWORD = "correct horse battery staple"


@pytest.fixture
def authentication(tmp_path):
    repository = SQLiteAuthenticationRepository(tmp_path / "authentication.db")
    config = AuthenticationSettings(
        database_path=repository.path, secure_cookies=False, session_ttl_seconds=3600
    )
    app.dependency_overrides[authentication_repository] = lambda: repository
    app.dependency_overrides[settings] = lambda: config
    with TestClient(app) as client:
        yield client, repository, tmp_path
    app.dependency_overrides.clear()


def _create(client: TestClient, email="Researcher@Example.test"):
    return client.post("/api/v1/auth/accounts", json={"email": email, "password": PASSWORD})


def test_account_creation_normalization_hashing_and_empty_research_state(authentication):
    client, repository, tmp_path = authentication
    response = _create(client)
    assert response.status_code == 201
    assert set(response.json()) == {"researcherId", "email", "sessionExpiresAt"}
    assert response.json()["researcherId"].startswith("acct_")
    with sqlite3.connect(repository.path) as connection:
        row = connection.execute(
            "SELECT normalized_email,password_hash FROM researcher_account"
        ).fetchone()
        assert row[0] == "researcher@example.test"
        assert row[1].startswith("scrypt$") and PASSWORD not in row[1]
        assert connection.execute("SELECT count(*) FROM authenticated_session").fetchone()[0] == 1
        secret = client.cookies.get("isees_session").split(".", 1)[1]
        stored = connection.execute("SELECT secret_digest FROM authenticated_session").fetchone()[0]
        assert stored == session_secret_digest(secret) and secret.encode() not in stored
    investigations = SQLiteInvestigationRepository(tmp_path / "investigations.db")
    assert investigations.list_owned(
        owner_principal_id=response.json()["researcherId"]
    ) == []
    with sqlite3.connect(investigations.path) as connection:
        assert connection.execute("SELECT count(*) FROM investigation").fetchone()[0] == 0


def test_duplicate_normalized_identity_is_safe(authentication):
    client, _, _ = authentication
    assert _create(client).status_code == 201
    duplicate = _create(client, "  researcher@example.TEST ")
    assert duplicate.status_code == 409
    assert duplicate.json()["error"]["code"] == "ACCOUNT_UNAVAILABLE"
    assert "email" not in duplicate.json()["error"]["message"].lower()


def test_login_is_valid_and_invalid_login_is_non_disclosing(authentication):
    client, _, _ = authentication
    _create(client)
    client.cookies.clear()
    valid = client.post("/api/v1/auth/sessions", json={
        "email": "researcher@example.test", "password": PASSWORD,
    })
    assert valid.status_code == 200 and client.cookies.get("isees_session")
    client.cookies.clear()
    wrong_account = client.post("/api/v1/auth/sessions", json={
        "email": "missing@example.test", "password": "wrong password",
    })
    wrong_password = client.post("/api/v1/auth/sessions", json={
        "email": "researcher@example.test", "password": "wrong password",
    })
    assert wrong_account.status_code == wrong_password.status_code == 401
    assert wrong_account.json()["error"]["code"] == wrong_password.json()["error"]["code"]
    assert wrong_account.json()["error"]["message"] == wrong_password.json()["error"]["message"]


def test_restore_uses_server_principal_and_cannot_be_overridden(authentication):
    client, _, _ = authentication
    created = _create(client)
    restored = client.get(
        "/api/v1/auth/session",
        headers={"X-ISEES-Principal-Id": "acct_attacker"},
    )
    assert restored.status_code == 200
    assert restored.json()["researcherId"] == created.json()["researcherId"]
    assert "password" not in restored.text.lower() and "sessionId" not in restored.text
    stolen_claim = TestClient(app).get(
        "/api/v1/auth/session", headers={"X-ISEES-Principal-Id": created.json()["researcherId"]}
    )
    assert stolen_claim.status_code == 401


def test_missing_expired_and_revoked_sessions_are_rejected(authentication):
    client, repository, _ = authentication
    assert client.get("/api/v1/auth/session").status_code == 401
    created = _create(client)
    cookie = client.cookies.get("isees_session")
    session_id = cookie.split(".", 1)[0]
    repository.revoke_session(session_id=session_id, revoked_at=datetime.now(timezone.utc))
    assert client.get("/api/v1/auth/session").status_code == 401

    account = repository.find_account_by_normalized_email("researcher@example.test")
    raw = "expired-secret"
    repository.create_session(
        session_id="ses_expired", account_id=account.account_id,
        secret_digest=session_secret_digest(raw),
        csrf_digest=hashlib.sha256(b"csrf").digest(),
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=1),
    )
    with sqlite3.connect(repository.path) as connection:
        connection.execute(
            "UPDATE authenticated_session SET created_at=?, expires_at=? WHERE session_id=?",
            ((datetime.now(timezone.utc) - timedelta(seconds=2)).isoformat(),
             (datetime.now(timezone.utc) - timedelta(seconds=1)).isoformat(), "ses_expired"),
        )
    client.cookies.set("isees_session", f"ses_expired.{raw}")
    assert client.get("/api/v1/auth/session").status_code == 401


def test_logout_requires_csrf_and_revokes_only_active_session(authentication):
    client, repository, _ = authentication
    created = _create(client)
    session_cookie = client.cookies.get("isees_session")
    csrf = client.cookies.get("isees_csrf")
    rejected = client.post("/api/v1/auth/logout", headers={"X-ISEES-CSRF": "invalid"})
    assert rejected.status_code == 403
    assert client.get("/api/v1/auth/session").status_code == 200
    logged_out = client.post("/api/v1/auth/logout", headers={"X-ISEES-CSRF": csrf})
    assert logged_out.status_code == 200 and logged_out.json() == {"status": "logged_out"}
    client.cookies.set("isees_session", session_cookie)
    assert client.get("/api/v1/auth/session").status_code == 401
    with sqlite3.connect(repository.path) as connection:
        assert connection.execute(
            "SELECT revoked_at IS NOT NULL FROM authenticated_session "
            "WHERE account_id=?", (created.json()["researcherId"],)
        ).fetchone()[0] == 1


def test_cookie_policy_is_explicit_for_development_and_production(authentication):
    client, _, _ = authentication
    response = _create(client)
    cookies = response.headers.get_list("set-cookie")
    session = next(value for value in cookies if value.startswith("isees_session="))
    csrf = next(value for value in cookies if value.startswith("isees_csrf="))
    assert "HttpOnly" in session and "SameSite=strict" in session and "Path=/" in session
    assert "HttpOnly" not in csrf and "Secure" not in session
    production = AuthenticationSettings(database_path=__import__("pathlib").Path("unused"), secure_cookies=True)
    assert production.secure_cookies is True


def test_endpoint_inventory_is_mounted():
    routes = {(route.path, method) for route in app.routes
              for method in getattr(route, "methods", set())}
    assert {
        ("/api/v1/auth/accounts", "POST"),
        ("/api/v1/auth/sessions", "POST"),
        ("/api/v1/auth/session", "GET"),
        ("/api/v1/auth/logout", "POST"),
    } <= routes
