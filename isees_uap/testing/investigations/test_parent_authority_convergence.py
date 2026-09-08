from __future__ import annotations

import sqlite3
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from isees_uap.api import app
from isees_uap.api.v1.authentication import settings
from isees_uap.api.v1.candidate_evidence import repository as candidate_repository
from isees_uap.api.v1.investigations import repository as investigation_repository
from isees_uap.authentication.config import AuthenticationSettings
from isees_uap.authentication.principal import authentication_repository
from isees_uap.authentication.sqlite_repository import SQLiteAuthenticationRepository
from isees_uap.candidate_evidence.sqlite_repository import SQLiteCandidateEvidenceRepository
from isees_uap.investigations.sqlite_repository import SQLiteInvestigationRepository

PASSWORD = "correct horse battery staple"


def submission(investigation_id: str, key: str = "create-1") -> dict:
    return {
        "schemaVersion": "candidate-evidence-command/v1",
        "investigationId": investigation_id,
        "submissionIdentity": f"submission-{key}",
        "source": {"title": "Descriptive metadata"},
        "idempotencyKey": key,
    }


@pytest.fixture
def authority_environment(tmp_path):
    auth = SQLiteAuthenticationRepository(tmp_path / "authentication.db")
    parents = SQLiteInvestigationRepository(tmp_path / "investigations.db")
    children = SQLiteCandidateEvidenceRepository(tmp_path / "candidate.db")
    config = AuthenticationSettings(
        database_path=auth.path, secure_cookies=False, session_ttl_seconds=3600
    )
    app.dependency_overrides[authentication_repository] = lambda: auth
    app.dependency_overrides[settings] = lambda: config
    app.dependency_overrides[investigation_repository] = lambda: parents
    app.dependency_overrides[candidate_repository] = lambda: children
    clients = [TestClient(app), TestClient(app)]
    try:
        identities = []
        for index, client in enumerate(clients):
            response = client.post("/api/v1/auth/accounts", json={
                "email": f"researcher{index}@example.com", "password": PASSWORD,
            })
            assert response.status_code == 201
            identities.append(response.json()["researcherId"])
        yield clients[0], clients[1], identities[0], identities[1], auth, parents, children
    finally:
        for client in clients:
            client.close()
        app.dependency_overrides.clear()


def csrf(client: TestClient) -> dict[str, str]:
    return {"X-ISEES-CSRF": client.cookies.get("isees_csrf")}


def test_two_real_sessions_isolate_library_and_parent_mutations(authority_environment):
    account_a, account_b, owner_a, owner_b, _, parents, _ = authority_environment
    parents.create(investigation_id="INV-A", owner_principal_id=owner_a, title="A")
    parents.create(investigation_id="INV-B", owner_principal_id=owner_b, title="B")

    assert [item["investigationId"] for item in account_a.get(
        "/api/v1/investigations").json()["items"]] == ["INV-A"]
    assert account_a.get("/api/v1/investigations/INV-A").status_code == 200
    foreign = account_b.get("/api/v1/investigations/INV-A", headers={"X-Request-Id": "same"})
    absent = account_b.get("/api/v1/investigations/ABSENT", headers={"X-Request-Id": "same"})
    assert foreign.status_code == absent.status_code == 404
    assert foreign.json() == absent.json()

    created = account_a.post(
        "/api/v1/investigations/INV-A/candidate-evidence/submissions",
        json=submission("INV-A"), headers=csrf(account_a),
    )
    assert created.status_code == 201
    denied = account_b.post(
        "/api/v1/investigations/INV-A/candidate-evidence/submissions",
        json=submission("INV-A", "foreign"), headers=csrf(account_b),
    )
    assert denied.status_code == 404


def test_authentication_csrf_and_spoofed_identity_are_enforced(authority_environment):
    account_a, account_b, owner_a, _, _, parents, _ = authority_environment
    parents.create(investigation_id="INV-A", owner_principal_id=owner_a, title="A")
    anonymous = TestClient(app)
    try:
        assert anonymous.get("/api/v1/investigations").status_code == 401
        assert anonymous.get(
            "/api/v1/investigations/INV-A/candidate-evidence").status_code == 401
        assert anonymous.post(
            "/api/v1/investigations/INV-A/candidate-evidence/submissions",
            json=submission("INV-A")).status_code == 401
    finally:
        anonymous.close()

    assert account_a.post(
        "/api/v1/investigations/INV-A/candidate-evidence/submissions",
        json=submission("INV-A"), headers={"X-ISEES-CSRF": "invalid"},
    ).status_code == 403
    spoof = account_b.get(
        "/api/v1/investigations/INV-A/candidate-evidence?researcherId=" + owner_a,
        headers={"X-ISEES-Principal-Id": owner_a},
    )
    assert spoof.status_code == 404


def test_missing_expired_and_revoked_sessions_fail_on_owner_route(authority_environment):
    account_a, _, owner_a, _, auth, parents, _ = authority_environment
    parents.create(investigation_id="INV-A", owner_principal_id=owner_a, title="A")
    session_id = account_a.cookies.get("isees_session").split(".", 1)[0]
    auth.revoke_session(session_id=session_id, revoked_at=datetime.now(timezone.utc))
    assert account_a.get("/api/v1/investigations").status_code == 401

    login = account_a.post("/api/v1/auth/sessions", json={
        "email": "researcher0@example.com", "password": PASSWORD,
    })
    assert login.status_code == 200
    current = account_a.cookies.get("isees_session").split(".", 1)[0]
    with sqlite3.connect(auth.path) as connection:
        connection.execute(
            "UPDATE authenticated_session SET created_at=?, expires_at=? WHERE session_id=?",
            ((datetime.now(timezone.utc) - timedelta(seconds=2)).isoformat(),
             (datetime.now(timezone.utc) - timedelta(seconds=1)).isoformat(), current),
        )
    assert account_a.get("/api/v1/investigations").status_code == 401


def test_child_metadata_or_orphan_cannot_grant_parent_access(authority_environment):
    account_a, account_b, owner_a, owner_b, _, parents, children = authority_environment
    parents.create(investigation_id="INV-A", owner_principal_id=owner_a, title="A")
    child, _ = children.create(
        command=submission("INV-A"), principal_id=owner_b, origin="SUBMISSION")
    orphan, _ = children.create(
        command=submission("ORPHAN", "orphan"), principal_id=owner_b, origin="SUBMISSION")

    assert account_b.get(
        f"/api/v1/investigations/INV-A/candidate-evidence/{child['candidateId']}").status_code == 404
    assert account_b.get(
        f"/api/v1/investigations/ORPHAN/candidate-evidence/{orphan['candidateId']}").status_code == 404
    with sqlite3.connect(parents.path) as connection:
        connection.execute("DELETE FROM investigation WHERE investigation_id='INV-A'")
    assert account_a.get(
        "/api/v1/investigations/INV-A/candidate-evidence").status_code == 404


def test_migration_and_accounts_do_not_claim_or_canonicalize_legacy_rows(authority_environment):
    account_a, account_b, owner_a, owner_b, _, parents, _ = authority_environment
    parents.create(
        investigation_id="LEGACY", owner_principal_id="legacy-ambiguous", title="Legacy")
    assert account_a.get("/api/v1/investigations").json() == {"items": []}
    assert account_b.get("/api/v1/investigations").json() == {"items": []}
    with sqlite3.connect(parents.path) as connection:
        row = connection.execute(
            "SELECT owner_principal_id FROM investigation WHERE investigation_id='LEGACY'"
        ).fetchone()
        assert row == ("legacy-ambiguous",)
        assert connection.execute("SELECT count(*) FROM investigation").fetchone()[0] == 1
    assert owner_a != owner_b
