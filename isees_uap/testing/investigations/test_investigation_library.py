from __future__ import annotations

import sqlite3
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from isees_uap.api import app
from isees_uap.api.v1.investigations import repository, service
from isees_uap.api.v1.authentication import settings
from isees_uap.authentication.config import AuthenticationSettings
from isees_uap.authentication.principal import authentication_repository
from isees_uap.authentication.sqlite_repository import SQLiteAuthenticationRepository
from isees_uap.candidate_evidence.sqlite_repository import (
    SQLiteCandidateEvidenceRepository,
)
from isees_uap.investigations.errors import (
    DuplicateInvestigationId,
    InvalidStoredInvestigation,
    RepositoryUnavailable,
)
from isees_uap.investigations.service import InvestigationLibraryService
from isees_uap.investigations.sqlite_repository import SQLiteInvestigationRepository


def _repo(tmp_path, name="investigations.db", clock=None):
    kwargs = {"clock": clock} if clock else {}
    return SQLiteInvestigationRepository(tmp_path / name, **kwargs)


def _authenticated_client(tmp_path, email: str):
    auth = SQLiteAuthenticationRepository(tmp_path / f"{email}.auth.db")
    config = AuthenticationSettings(database_path=auth.path, secure_cookies=False)
    app.dependency_overrides[authentication_repository] = lambda: auth
    app.dependency_overrides[settings] = lambda: config
    client = TestClient(app)
    created = client.post("/api/v1/auth/accounts", json={
        "email": f"{email}@example.com", "password": "correct horse battery staple",
    })
    assert created.status_code == 201
    return client, created.json()["researcherId"]


def test_empty_library_has_no_default_or_tic_tac(tmp_path):
    repo = _repo(tmp_path)
    assert repo.list_owned(owner_principal_id="guest:empty") == []
    with sqlite3.connect(repo.path) as connection:
        assert connection.execute("SELECT count(*) FROM investigation").fetchone()[0] == 0


def test_create_round_trip_restart_and_owner_isolation(tmp_path):
    path = tmp_path / "restart.db"
    created = SQLiteInvestigationRepository(path).create(
        investigation_id="INV-1", owner_principal_id="principal:one",
        title="First", objective="Establish the facts",
    )
    reopened = SQLiteInvestigationRepository(path)
    loaded = reopened.get_owned(
        investigation_id="INV-1", owner_principal_id="principal:one"
    )
    assert loaded == created
    assert loaded.version == 0
    assert loaded.created_at == loaded.modified_at
    assert loaded.created_at.tzinfo == timezone.utc
    assert reopened.get_owned(
        investigation_id="INV-1", owner_principal_id="principal:other"
    ) is None
    assert reopened.list_owned(owner_principal_id="principal:other") == []


def test_list_order_is_deterministic_and_lifecycle_aware(tmp_path):
    times = iter([
        datetime(2025, 12, 30, tzinfo=timezone.utc),
        datetime(2025, 12, 30, tzinfo=timezone.utc),
        datetime(2025, 12, 31, tzinfo=timezone.utc),
        datetime(2025, 12, 31, tzinfo=timezone.utc),
        datetime(2026, 1, 2, tzinfo=timezone.utc),
        datetime(2026, 1, 2, tzinfo=timezone.utc),
    ])
    repo = _repo(tmp_path, clock=lambda: next(times))
    for investigation_id in ("INV-old", "INV-z", "INV-a"):
        repo.create(investigation_id=investigation_id,
                    owner_principal_id="principal:one", title=investigation_id)
    assert [item.investigation_id for item in repo.list_owned(
        owner_principal_id="principal:one"
    )] == ["INV-a", "INV-z", "INV-old"]


def test_duplicate_investigation_id_is_rejected_across_owners(tmp_path):
    repo = _repo(tmp_path)
    repo.create(investigation_id="INV-1", owner_principal_id="one", title="One")
    with pytest.raises(DuplicateInvestigationId):
        repo.create(investigation_id="INV-1", owner_principal_id="two", title="Two")


def test_concurrent_cold_start_and_reinitialization_are_safe(tmp_path):
    path = tmp_path / "cold.db"
    with ThreadPoolExecutor(max_workers=12) as pool:
        repositories = list(pool.map(
            lambda _: SQLiteInvestigationRepository(path), range(24)
        ))
    assert all(item.list_owned(owner_principal_id="p") == [] for item in repositories)
    with sqlite3.connect(path) as connection:
        assert connection.execute(
            "SELECT version FROM investigation_schema_migrations"
            ).fetchall() == [(1,), (2,), (3,)]


def test_concurrent_create_has_one_winner_and_no_corruption(tmp_path):
    path = tmp_path / "create.db"
    repo = SQLiteInvestigationRepository(path)

    def create(_):
        try:
            repo.create(investigation_id="INV-race", owner_principal_id="p",
                        title="Race")
            return "created"
        except DuplicateInvestigationId:
            return "duplicate"

    with ThreadPoolExecutor(max_workers=12) as pool:
        results = list(pool.map(create, range(24)))
    assert results.count("created") == 1
    assert results.count("duplicate") == 23
    assert len(repo.list_owned(owner_principal_id="p")) == 1


def test_orphan_child_rows_are_preserved_and_not_promoted(tmp_path):
    child_path = tmp_path / "candidate.db"
    child = SQLiteCandidateEvidenceRepository(child_path)
    child.create(command={
        "schemaVersion": "candidate-evidence-command/v1",
        "investigationId": "ORPHAN-1", "idempotencyKey": "orphan",
        "submissionIdentity": "submission-1", "source": {"title": "Orphan"},
    }, principal_id="principal:child", origin="SUBMISSION")
    parent = _repo(tmp_path, "parents.db")
    assert parent.list_owned(owner_principal_id="principal:child") == []
    assert child.get(investigation_id="ORPHAN-1", candidate_id=child.list(
        investigation_id="ORPHAN-1", principal_id="principal:child",
        limit=10, cursor=None)[0][0]["candidateId"],
        principal_id="principal:child") is not None


def test_parent_aggregate_contains_no_workspace_or_mode_state(tmp_path):
    item = _repo(tmp_path).create(
        investigation_id="INV-minimal", owner_principal_id="p", title="Minimal"
    )
    assert set(item.__dataclass_fields__) == {
        "investigation_id", "owner_principal_id", "title", "objective",
        "lifecycle", "created_at", "modified_at", "version",
    }


def test_invalid_stored_data_is_a_controlled_domain_failure(tmp_path):
    repo = _repo(tmp_path)
    repo.create(investigation_id="INV-corrupt", owner_principal_id="p", title="Valid")
    with sqlite3.connect(repo.path) as connection:
        connection.execute(
            "UPDATE investigation SET title='' WHERE investigation_id=?", ("INV-corrupt",)
        )
    with pytest.raises(InvalidStoredInvestigation) as failure:
        repo.get_owned(investigation_id="INV-corrupt", owner_principal_id="p")
    assert str(failure.value) == "Stored Investigation data is invalid"


def test_service_returns_summaries_and_non_disclosing_not_found(tmp_path):
    repo = _repo(tmp_path)
    repo.create(investigation_id="INV-1", owner_principal_id="one", title="One")
    svc = InvestigationLibraryService(repo)
    assert [item.investigation_id for item in svc.list_owned("one")] == ["INV-1"]
    with pytest.raises(Exception) as missing:
        svc.get_owned("INV-1", "other")
    assert getattr(missing.value, "code", None) == "INVESTIGATION_NOT_FOUND"


def test_collection_and_detail_api_are_owner_scoped(tmp_path):
    repo = _repo(tmp_path)
    app.dependency_overrides[repository] = lambda: repo
    client, owner = _authenticated_client(tmp_path, "owner")
    try:
        empty = client.get("/api/v1/investigations")
        assert empty.status_code == 200 and empty.json() == {"items": []}
        repo.create(investigation_id="INV-one", owner_principal_id=owner, title="One")
        repo.create(investigation_id="INV-two", owner_principal_id="legacy-two", title="Two")
        owned = client.get("/api/v1/investigations")
        assert owned.status_code == 200
        assert [item["investigationId"] for item in owned.json()["items"]] == ["INV-one"]
        assert "ownerPrincipalId" not in owned.text
        detail = client.get("/api/v1/investigations/INV-one")
        assert detail.status_code == 200 and detail.json()["version"] == 0
        other, _ = _authenticated_client(tmp_path, "other")
        hidden = other.get("/api/v1/investigations/INV-one", headers={"X-Request-Id": "same"})
        absent = other.get("/api/v1/investigations/unknown", headers={"X-Request-Id": "same"})
        assert hidden.status_code == absent.status_code == 404
        assert hidden.json()["error"]["code"] == "INVESTIGATION_NOT_FOUND"
        assert hidden.json() == absent.json()
        other.close()
    finally:
        client.close()
        app.dependency_overrides.clear()


def test_invalid_principal_and_repository_failure_are_controlled(tmp_path):
    client = TestClient(app)
    blank = client.get("/api/v1/investigations",
                       headers={"X-ISEES-Principal-Id": "   ", "X-Request-Id": "r1"})
    assert blank.status_code == 401
    assert blank.json() == {"error": {
        "code": "AUTHENTICATION_REQUIRED",
        "message": "Authentication is required", "requestId": "r1",
    }}
    client.close()

    class Down:
        def list_owned(self, _):
            raise RepositoryUnavailable("Investigation repository is unavailable")

    app.dependency_overrides[service] = lambda: Down()
    client, _ = _authenticated_client(tmp_path, "failure")
    try:
        failed = client.get("/api/v1/investigations")
        assert failed.status_code == 503
        assert failed.json()["error"]["code"] == "INVESTIGATION_REPOSITORY_UNAVAILABLE"
        assert "sqlite" not in failed.text.lower() and ".db" not in failed.text
    finally:
        client.close()
        app.dependency_overrides.clear()


def test_existing_nested_routes_remain_mounted():
    routes = {(route.path, method) for route in app.routes
              for method in getattr(route, "methods", set())}
    assert ("/api/v1/investigations", "GET") in routes
    assert ("/api/v1/investigations", "POST") in routes
    assert ("/api/v1/investigations/{investigation_id}", "GET") in routes
    assert ("/api/v1/investigations/{investigation_id}/studio-artifacts", "GET") in routes
    assert ("/api/v1/investigations/{investigation_id}/research-sources", "POST") in routes
    assert ("/api/v1/investigations/{investigation_id}/candidate-evidence", "GET") in routes
