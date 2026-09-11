from __future__ import annotations

import os
from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from isees_uap.api import app, create_application
from isees_uap.api.application import studio_v1_deployment_configuration
from isees_uap.studio.v1.application import STUDIO_V1_SCHEMA_VERSION
from isees_uap.studio.v1.lifecycle import (
    ExpiredLeaseRecoveryPolicy,
    LifecycleState,
    PrivateStudioV1LifecycleOwner,
    StudioV1LifecycleConfiguration,
    StudioV1LifecycleFailure,
)


def enabled_config(tmp_path, **changes):
    values = dict(
        enabled=True,
        database_path=tmp_path / "studio-v1.sqlite3",
        connection_factory=None,
        application_instance_id="pytest-api-instance",
        projection_lease_duration=timedelta(seconds=30),
        maximum_projection_attempts=3,
        expected_schema_version=STUDIO_V1_SCHEMA_VERSION,
        expired_lease_recovery_policy=ExpiredLeaseRecoveryPolicy.RECOVER_ON_START,
    )
    values.update(changes)
    return StudioV1LifecycleConfiguration(**values)


def enabled_mapping(tmp_path):
    return {
        "ISEES_STUDIO_V1_ENABLED": "true",
        "ISEES_PERSISTENT_ROOT": str(tmp_path),
        "ISEES_STUDIO_V1_DATABASE_PATH": str(tmp_path / "mapped.sqlite3"),
        "ISEES_STUDIO_V1_APPLICATION_INSTANCE_ID": "pytest-mapped-instance",
        "ISEES_STUDIO_V1_PROJECTION_LEASE_SECONDS": "30",
        "ISEES_STUDIO_V1_MAXIMUM_PROJECTION_ATTEMPTS": "3",
        "ISEES_STUDIO_V1_EXPECTED_SCHEMA_VERSION": str(STUDIO_V1_SCHEMA_VERSION),
        "ISEES_STUDIO_V1_EXPIRED_LEASE_RECOVERY_POLICY": "RECOVER_ON_START",
    }


def route_methods(application):
    return {(route.path, method) for route in application.routes
            for method in getattr(route, "methods", set())}


def test_module_app_and_factory_are_available_without_import_database(tmp_path):
    assert app is not None and callable(create_application)
    assert not list(tmp_path.iterdir())


@pytest.mark.parametrize("values", [{}, {"ISEES_STUDIO_V1_ENABLED": "false"}])
def test_missing_or_explicit_disabled_is_inert(values, tmp_path):
    before = dict(os.environ)
    application = create_application(values)
    assert dict(os.environ) == before
    assert not list(tmp_path.iterdir())
    with TestClient(application):
        owner = application.state.private_studio_v1_lifecycle_owner
        assert isinstance(owner, PrivateStudioV1LifecycleOwner)
        assert owner.state is LifecycleState.DISABLED
        assert not list(tmp_path.iterdir())
    assert owner.state is LifecycleState.STOPPED


def test_enabled_mapping_and_configuration_object_reach_ready_and_stop(tmp_path):
    for configuration in (enabled_mapping(tmp_path),
                          enabled_config(tmp_path, database_path=tmp_path / "object.sqlite3")):
        application = create_application(configuration)
        with TestClient(application):
            owner = application.state.private_studio_v1_lifecycle_owner
            assert owner.state is LifecycleState.READY
            assert owner.readiness().ready
        assert owner.state is LifecycleState.STOPPED


def test_application_state_exposes_only_private_owner(tmp_path):
    application = create_application(enabled_config(tmp_path))
    with TestClient(application):
        state = vars(application.state).get("_state", {})
        assert set(state) == {"private_studio_v1_lifecycle_owner"}
        assert isinstance(state["private_studio_v1_lifecycle_owner"],
                          PrivateStudioV1LifecycleOwner)
        forbidden = ("facade", "store", "service", "connection", "configuration", "environment")
        assert not any(token in key.lower() for key in state for token in forbidden)


@pytest.mark.parametrize(("key", "value"), [
    ("ISEES_STUDIO_V1_DATABASE_PATH", "relative.sqlite3"),
    ("ISEES_STUDIO_V1_APPLICATION_INSTANCE_ID", None),
    ("ISEES_STUDIO_V1_PROJECTION_LEASE_SECONDS", "0"),
    ("ISEES_STUDIO_V1_MAXIMUM_PROJECTION_ATTEMPTS", "0"),
    ("ISEES_STUDIO_V1_EXPECTED_SCHEMA_VERSION", "0"),
    ("ISEES_STUDIO_V1_EXPIRED_LEASE_RECOVERY_POLICY", "sometimes"),
])
def test_invalid_enabled_mapping_fails_closed(tmp_path, key, value):
    values = enabled_mapping(tmp_path)
    if value is None:
        values.pop(key)
    else:
        values[key] = value
    with pytest.raises(StudioV1LifecycleFailure) as caught:
        create_application(values)
    assert "sqlite3" not in caught.value.safe_message.lower()
    assert str(tmp_path).lower() not in caught.value.safe_message.lower()


def test_enabled_mapping_without_database_path_or_persistent_root_fails_closed(tmp_path):
    values = enabled_mapping(tmp_path)
    values.pop("ISEES_STUDIO_V1_DATABASE_PATH")
    values.pop("ISEES_PERSISTENT_ROOT")
    with pytest.raises(StudioV1LifecycleFailure) as caught:
        create_application(values)
    assert "sqlite3" not in caught.value.safe_message.lower()
    assert str(tmp_path).lower() not in caught.value.safe_message.lower()


def test_enabled_mapping_without_database_path_rejects_relative_persistent_root(tmp_path):
    values = enabled_mapping(tmp_path)
    values.pop("ISEES_STUDIO_V1_DATABASE_PATH")
    values["ISEES_PERSISTENT_ROOT"] = "relative-persistent-root"
    with pytest.raises(StudioV1LifecycleFailure):
        create_application(values)


def test_incompatible_schema_startup_is_sanitized_and_cleans_up(tmp_path):
    application = create_application(enabled_config(tmp_path, expected_schema_version=999))
    with pytest.raises(StudioV1LifecycleFailure) as caught:
        with TestClient(application):
            pass
    owner = application.state.private_studio_v1_lifecycle_owner
    assert owner.state is LifecycleState.FAILED
    assert str(tmp_path).lower() not in caught.value.safe_message.lower()
    assert owner.stop().state is LifecycleState.STOPPED


def test_repeated_lifespans_use_fresh_owners_and_release_connections(tmp_path):
    application = create_application(enabled_config(tmp_path))
    owners = []
    for _ in range(2):
        with TestClient(application):
            owners.append(application.state.private_studio_v1_lifecycle_owner)
            assert owners[-1].state is LifecycleState.READY
        assert owners[-1].state is LifecycleState.STOPPED
    assert owners[0] is not owners[1]


def test_routes_openapi_middleware_handlers_and_dependencies_are_unchanged():
    fresh = create_application({})
    assert route_methods(fresh) == route_methods(app)
    assert fresh.openapi()["paths"] == app.openapi()["paths"]
    studio_paths = {path for path in fresh.openapi()["paths"] if "/studio-v1/" in path}
    assert studio_paths == {
        "/api/v1/investigations/{investigation_id}/studio-v1/artifacts",
        "/api/v1/investigations/{investigation_id}/studio-v1/artifacts/{artifact_id}",
        "/api/v1/investigations/{investigation_id}/studio-v1/artifacts/{artifact_id}/revisions",
        "/api/v1/investigations/{investigation_id}/studio-v1/artifacts/{artifact_id}/revisions/{revision_id}",
        "/api/v1/investigations/{investigation_id}/studio-v1/artifacts/{artifact_id}/revisions/{revision_id}/source-snapshots/{snapshot_id}",
        "/api/v1/investigations/{investigation_id}/studio-v1/artifacts/{artifact_id}/revisions/{revision_id}/projections",
    }
    assert [middleware.cls for middleware in fresh.user_middleware] == [
        middleware.cls for middleware in app.user_middleware]
    assert set(fresh.exception_handlers) == set(app.exception_handlers)
    dependencies = repr([getattr(route, "dependant", None) for route in fresh.routes
                         if "/studio-v1/" in route.path]).lower()
    assert "sqlitestudiov1store" not in dependencies and "connection_factory" not in dependencies


@pytest.mark.parametrize("origin", [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
])
def test_local_authenticated_mutation_preflight_is_exact(origin):
    with TestClient(create_application({})) as client:
        response = client.options(
            "/api/v1/investigations/investigation-1/studio-v1/artifacts",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": (
                    "content-type,x-isees-csrf,x-isees-principal-id,x-request-id"
                ),
            },
        )
    assert response.status_code == 200
    assert response.text == "OK"
    assert response.headers["access-control-allow-origin"] == origin
    assert response.headers["access-control-allow-credentials"] == "true"
    assert "POST" in response.headers["access-control-allow-methods"]
    allowed_headers = response.headers["access-control-allow-headers"].lower()
    for header in ("content-type", "x-isees-csrf", "x-isees-principal-id", "x-request-id"):
        assert header in allowed_headers


def test_unauthorized_cors_origin_remains_rejected():
    with TestClient(create_application({})) as client:
        response = client.options(
            "/api/v1/investigations/investigation-1/studio-v1/artifacts",
            headers={
                "Origin": "http://malicious.invalid:5173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type,x-isees-csrf",
            },
        )
    assert response.status_code == 400
    assert response.text == "Disallowed CORS origin"
    assert "access-control-allow-origin" not in response.headers


def test_deployment_adapter_does_not_mutate_environment(tmp_path):
    before = dict(os.environ)
    parsed = studio_v1_deployment_configuration(enabled_mapping(tmp_path))
    assert parsed.enabled and dict(os.environ) == before
