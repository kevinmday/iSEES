from __future__ import annotations

import sqlite3

import pytest
from fastapi.testclient import TestClient

from isees_uap.api import app
from isees_uap.api.v1.authentication import settings
from isees_uap.api.v1.investigations import repository
from isees_uap.authentication.config import AuthenticationSettings
from isees_uap.authentication.principal import authentication_repository
from isees_uap.authentication.sqlite_repository import SQLiteAuthenticationRepository
from isees_uap.investigations.errors import RepositoryUnavailable
from isees_uap.investigations.service import InvestigationLibraryService
from isees_uap.investigations.sqlite_repository import SQLiteInvestigationRepository


@pytest.fixture
def environment(tmp_path):
    auth = SQLiteAuthenticationRepository(tmp_path / "auth.db")
    investigations = SQLiteInvestigationRepository(tmp_path / "investigations.db")
    config = AuthenticationSettings(database_path=auth.path, secure_cookies=False)
    app.dependency_overrides[authentication_repository] = lambda: auth
    app.dependency_overrides[settings] = lambda: config
    app.dependency_overrides[repository] = lambda: investigations
    clients: list[TestClient] = []

    def account(name: str):
        client = TestClient(app)
        clients.append(client)
        response = client.post("/api/v1/auth/accounts", json={
            "email": f"{name}@example.test",
            "password": "correct horse battery staple",
        })
        assert response.status_code == 201
        return client, response.json()["researcherId"]

    try:
        yield investigations, auth, account
    finally:
        for client in clients:
            client.close()
        app.dependency_overrides.clear()


def csrf(client: TestClient) -> dict[str, str]:
    return {"X-ISEES-CSRF": client.cookies.get("isees_csrf")}


def create(client: TestClient, key: str, **extra):
    payload = {"title": "  Field Study  ", "objective": " Establish facts ",
               "idempotencyKey": key, **extra}
    return client.post("/api/v1/investigations", json=payload, headers=csrf(client))


def test_fresh_account_is_empty_and_account_creation_creates_no_investigation(environment):
    investigations, _, account = environment
    client, _ = account("fresh")
    assert client.get("/api/v1/investigations").json() == {"items": []}
    with sqlite3.connect(investigations.path) as connection:
        assert connection.execute("SELECT count(*) FROM investigation").fetchone()[0] == 0
        assert connection.execute("SELECT count(*) FROM investigation_aggregate").fetchone()[0] == 0


def test_creation_requires_authentication_and_csrf_and_validates_strict_input(environment):
    _, _, account = environment
    anonymous = TestClient(app)
    assert anonymous.get("/api/v1/investigations").json()["error"]["code"] == "AUTHENTICATION_REQUIRED"
    assert anonymous.post("/api/v1/investigations", json={}).json()["error"]["code"] == "AUTHENTICATION_REQUIRED"
    anonymous.close()
    client, _ = account("validation")
    rejected = client.post("/api/v1/investigations", json={
        "title": "Study", "idempotencyKey": "key",
    }, headers={"X-ISEES-CSRF": "invalid"})
    assert rejected.status_code == 403 and rejected.json()["error"]["code"] == "CSRF_REJECTED"
    for payload in (
        {"title": "   ", "idempotencyKey": "key"},
        {"title": "x" * 201, "idempotencyKey": "key"},
        {"title": "Study", "idempotencyKey": "key", "ownerId": "acct_foreign"},
        {"title": "Study", "idempotencyKey": "key", "investigationId": "chosen"},
        {"title": "Study", "idempotencyKey": "key", "lifecycle": "SYSTEM"},
    ):
        response = client.post("/api/v1/investigations", json=payload, headers=csrf(client))
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "INVALID_INVESTIGATION_INPUT"


def test_create_is_server_owned_empty_and_does_not_seed_or_activate(environment):
    investigations, _, account = environment
    client, owner = account("owner")
    response = create(client, "create-1", ownerId="acct_foreign")
    assert response.status_code == 422
    response = create(client, "create-1", headersIgnored=True)
    assert response.status_code == 422
    response = client.post(
        "/api/v1/investigations",
        json={"title": "  Field Study  ", "objective": " Establish facts ",
              "idempotencyKey": "create-1"},
        headers={**csrf(client), "X-ISEES-Principal-Id": "acct_foreign"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["investigationId"].startswith("inv_") and len(body["investigationId"]) == 36
    assert body["title"] == "Field Study" and body["objective"] == "Establish facts"
    assert body["lifecycle"] == "ACTIVE" and body["version"] == 0
    assert body["aggregateSchemaVersion"] == "investigation-aggregate/v1"
    assert body["aggregateState"] == "EMPTY" and body["aggregateRevision"] == 0
    assert "owner" not in response.text.lower() and "principal" not in response.text.lower()
    with sqlite3.connect(investigations.path) as connection:
        connection.row_factory = sqlite3.Row
        parents = connection.execute("SELECT * FROM investigation").fetchall()
        aggregates = connection.execute("SELECT * FROM investigation_aggregate").fetchall()
        assert len(parents) == len(aggregates) == 1
        assert parents[0]["owner_principal_id"] == owner
        assert set(aggregates[0].keys()) == {"investigation_id", "schema_version", "state", "revision", "payload_json"}
        assert aggregates[0]["payload_json"] is None
        assert connection.execute("SELECT count(*) FROM investigation_research_inbox").fetchone()[0] == 0
        assert connection.execute("SELECT count(*) FROM investigation_adopted_artifact").fetchone()[0] == 0
    assert not any(term in response.text.lower() for term in ("nimitz", "tic tac", "canonical", "workspace"))


def test_idempotency_is_account_scoped_and_changed_payload_conflicts(environment):
    investigations, _, account = environment
    a, owner_a = account("a")
    first = create(a, "shared")
    replay = create(a, "shared")
    assert first.status_code == replay.status_code == 201
    assert replay.json()["replayed"] is True
    assert replay.json()["investigationId"] == first.json()["investigationId"]
    changed = a.post("/api/v1/investigations", json={
        "title": "Changed", "idempotencyKey": "shared",
    }, headers=csrf(a))
    assert changed.status_code == 409 and changed.json()["error"]["code"] == "IDEMPOTENCY_KEY_REUSE"
    b, owner_b = account("b")
    independent = create(b, "shared")
    assert independent.status_code == 201
    assert independent.json()["investigationId"] != first.json()["investigationId"]
    assert {item.investigation_id for item in investigations.list_owned(owner_principal_id=owner_a)} == {first.json()["investigationId"]}
    assert {item.investigation_id for item in investigations.list_owned(owner_principal_id=owner_b)} == {independent.json()["investigationId"]}


def test_two_real_sessions_list_and_read_only_their_owned_parents(environment):
    _, _, account = environment
    a, _ = account("reader-a")
    b, _ = account("reader-b")
    a1 = create(a, "a1").json()
    a2 = create(a, "a2").json()
    b1 = create(b, "b1").json()
    assert [item["investigationId"] for item in a.get("/api/v1/investigations").json()["items"]] == [a2["investigationId"], a1["investigationId"]]
    assert [item["investigationId"] for item in b.get("/api/v1/investigations").json()["items"]] == [b1["investigationId"]]
    assert a.get(f"/api/v1/investigations/{a1['investigationId']}").status_code == 200
    foreign = b.get(f"/api/v1/investigations/{a1['investigationId']}", headers={"X-Request-Id": "same"})
    absent = b.get("/api/v1/investigations/inv_absent", headers={"X-Request-Id": "same"})
    assert foreign.status_code == absent.status_code == 404
    assert foreign.json() == absent.json()


def test_creation_rolls_back_parent_aggregate_and_idempotency_on_failure(tmp_path):
    repo = SQLiteInvestigationRepository(tmp_path / "atomic.db")
    with sqlite3.connect(repo.path) as connection:
        connection.execute(
            "CREATE TRIGGER fail_aggregate BEFORE INSERT ON investigation_aggregate "
            "BEGIN SELECT RAISE(FAIL, 'injected aggregate failure'); END"
        )
    with pytest.raises(RepositoryUnavailable):
        repo.create_empty_owned(
            investigation_id="inv_atomic", owner_principal_id="acct_a", title="Atomic",
            objective=None, idempotency_key="retry", command_hash="hash",
        )
    with sqlite3.connect(repo.path) as connection:
        assert connection.execute("SELECT count(*) FROM investigation").fetchone()[0] == 0
        assert connection.execute("SELECT count(*) FROM investigation_aggregate").fetchone()[0] == 0
        assert connection.execute("SELECT count(*) FROM investigation_idempotency").fetchone()[0] == 0
        connection.execute("DROP TRIGGER fail_aggregate")
    created, _, replayed = repo.create_empty_owned(
        investigation_id="inv_atomic", owner_principal_id="acct_a", title="Atomic",
        objective=None, idempotency_key="retry", command_hash="hash",
    )
    assert created.investigation_id == "inv_atomic" and replayed is False


def test_collision_retry_never_duplicates_or_transfers_ownership(tmp_path):
    repo = SQLiteInvestigationRepository(tmp_path / "collision.db")
    repo.create(investigation_id="inv_collision", owner_principal_id="acct_foreign", title="Foreign")
    identities = iter(["inv_collision", "inv_safe"])
    service = InvestigationLibraryService(repo, id_generator=lambda: next(identities))
    created, _, _ = service.create_empty_owned(
        principal_id="acct_owner", title="Owned", objective=None, idempotency_key="collision"
    )
    assert created.investigation_id == "inv_safe"
    assert repo.get_owned(investigation_id="inv_collision", owner_principal_id="acct_foreign") is not None
    assert repo.get_owned(investigation_id="inv_collision", owner_principal_id="acct_owner") is None
