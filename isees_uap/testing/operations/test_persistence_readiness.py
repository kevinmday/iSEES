from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from fastapi.testclient import TestClient

from isees_uap.api import create_application
from isees_uap.api.application import studio_v1_deployment_configuration
from isees_uap.persistence import (
    PreflightClassification, StoreSpec, database_path, inspect_store, output_path,
)


INDIVIDUAL = {
    "ISEES_AUTH_DB_PATH": "authentication.sqlite3",
    "ISEES_INVESTIGATION_DB_PATH": "investigations.sqlite3",
    "ISEES_CANDIDATE_DB_PATH": "candidate_evidence.sqlite3",
    "ISEES_RESEARCH_SOURCE_DB_PATH": "research_sources.sqlite3",
    "ISEES_STUDIO_DB_PATH": "studio.sqlite3",
    "ISEES_STUDIO_V1_DATABASE_PATH": "studio-v1.sqlite3",
}


def disabled() -> dict[str, str]:
    return {"ISEES_STUDIO_V1_ENABLED": "false"}


def test_local_defaults_and_persistent_derivation(tmp_path: Path) -> None:
    assert database_path("X", "x.sqlite3", "runtime/x.sqlite3", {}) == Path("runtime/x.sqlite3").resolve()
    assert output_path("X", "runtime/studio-outputs", {}) == Path("runtime/studio-outputs").resolve()
    root = tmp_path / "persistent"
    for variable, filename in INDIVIDUAL.items():
        assert database_path(variable, filename, "unused", {"ISEES_PERSISTENT_ROOT": str(root)}) == root / "databases" / filename
    assert output_path("ISEES_STUDIO_OUTPUT_ROOT", "unused", {"ISEES_PERSISTENT_ROOT": str(root)}) == root / "studio-outputs"


def test_individual_overrides_win_and_derived_paths_are_contained(tmp_path: Path) -> None:
    root, override = tmp_path / "root", tmp_path / "elsewhere" / "custom.db"
    values = {"ISEES_PERSISTENT_ROOT": str(root), "ISEES_AUTH_DB_PATH": str(override)}
    assert database_path("ISEES_AUTH_DB_PATH", "authentication.sqlite3", "unused", values) == override
    derived = database_path("MISSING", "safe.sqlite3", "unused", values)
    assert root.resolve() in derived.parents


def test_studio_v1_enabled_derives_path_and_disabled_does_not_require_one(tmp_path: Path) -> None:
    base = {
        "ISEES_STUDIO_V1_APPLICATION_INSTANCE_ID": "test", "ISEES_STUDIO_V1_PROJECTION_LEASE_SECONDS": "1",
        "ISEES_STUDIO_V1_MAXIMUM_PROJECTION_ATTEMPTS": "1", "ISEES_STUDIO_V1_EXPECTED_SCHEMA_VERSION": "1",
        "ISEES_STUDIO_V1_EXPIRED_LEASE_RECOVERY_POLICY": "LEAVE_EXPIRED",
    }
    (tmp_path / "databases").mkdir()
    enabled = studio_v1_deployment_configuration({**base, "ISEES_STUDIO_V1_ENABLED": "true",
                                                   "ISEES_PERSISTENT_ROOT": str(tmp_path)})
    assert enabled.database_path == tmp_path / "databases" / "studio-v1.sqlite3"
    assert studio_v1_deployment_configuration(disabled()).database_path is None


def test_preflight_classifications_and_future_schema_rejection(tmp_path: Path) -> None:
    path = tmp_path / "store.sqlite3"
    spec = StoreSpec("test", path, "schema_migrations", 2)
    assert inspect_store(spec) is PreflightClassification.ABSENT
    path.touch()
    assert inspect_store(spec) is PreflightClassification.EMPTY
    path.unlink()
    with sqlite3.connect(path) as db:
        db.execute("CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY)")
        db.execute("INSERT INTO schema_migrations VALUES(1)")
    assert inspect_store(spec) is PreflightClassification.MIGRATION_REQUIRED
    with sqlite3.connect(path) as db:
        db.execute("INSERT INTO schema_migrations VALUES(2)")
    assert inspect_store(spec) is PreflightClassification.COMPATIBLE
    with sqlite3.connect(path) as db:
        db.execute("INSERT INTO schema_migrations VALUES(3)")
    assert inspect_store(spec) is PreflightClassification.INCOMPATIBLE
    directory_spec = StoreSpec("bad", tmp_path, "schema_migrations", 1)
    assert inspect_store(directory_spec) is PreflightClassification.UNAVAILABLE


def test_health_and_readiness_are_non_mutating_and_redacted(tmp_path: Path, monkeypatch) -> None:
    root = tmp_path / "persistent"
    output = root / "studio-outputs"
    output.mkdir(parents=True)
    monkeypatch.setenv("ISEES_PERSISTENT_ROOT", str(root))
    app = create_application(disabled(), tmp_path / "no-frontend")
    before = sorted(str(path.relative_to(tmp_path)) for path in tmp_path.rglob("*"))
    with TestClient(app) as client:
        health = client.get("/health")
        ready = client.get("/ready")
    after = sorted(str(path.relative_to(tmp_path)) for path in tmp_path.rglob("*"))
    assert health.status_code == 200
    assert health.json() == {"schemaVersion": "isees-health/v1", "status": "live"}
    assert ready.status_code == 200
    assert ready.json()["status"] == "ready"
    serialized = json.dumps(ready.json())
    assert str(tmp_path) not in serialized and "sqlite3" not in serialized
    assert before == after


def test_readiness_fails_closed_without_mutation(tmp_path: Path, monkeypatch) -> None:
    root = tmp_path / "persistent"
    (root / "studio-outputs").mkdir(parents=True)
    database = root / "databases" / "authentication.sqlite3"
    database.parent.mkdir()
    with sqlite3.connect(database) as db:
        db.execute("CREATE TABLE authentication_schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT)")
        db.execute("INSERT INTO authentication_schema_migrations VALUES(99, 'future')")
    monkeypatch.setenv("ISEES_PERSISTENT_ROOT", str(root))
    before = database.read_bytes()
    with TestClient(create_application(disabled(), tmp_path / "no-frontend")) as client:
        response = client.get("/ready")
    assert response.status_code == 503
    assert response.json()["dependencies"]["authentication"] == "INCOMPATIBLE"
    assert database.read_bytes() == before


def test_health_and_ready_never_fall_through_spa(tmp_path: Path, monkeypatch) -> None:
    (tmp_path / "index.html").write_text("SPA", encoding="utf-8")
    root = tmp_path / "persistent"
    (root / "studio-outputs").mkdir(parents=True)
    monkeypatch.setenv("ISEES_PERSISTENT_ROOT", str(root))
    with TestClient(create_application(disabled(), tmp_path)) as client:
        assert client.get("/health").headers["content-type"].startswith("application/json")
        assert client.get("/ready").headers["content-type"].startswith("application/json")


def test_route_registration_is_unchanged_except_operational_routes(tmp_path: Path) -> None:
    routes = {(route.path, frozenset(route.methods or ())) for route in create_application(disabled(), tmp_path).routes}
    assert ("/health", frozenset({"GET"})) in routes and ("/ready", frozenset({"GET"})) in routes
    for expected in (("/run", frozenset({"GET"})), ("/clusters", frozenset({"GET"})),
                     ("/report", frozenset({"POST"})), ("/report/{event_id}", frozenset({"GET"}))):
        assert expected in routes
