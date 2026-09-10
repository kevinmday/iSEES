from __future__ import annotations

import dataclasses
import sqlite3
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from pathlib import Path
from threading import Event

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from isees_uap.studio.v1.application import STUDIO_V1_SCHEMA_VERSION
from isees_uap.studio.v1.lifecycle import (
    ExpiredLeaseRecoveryPolicy, LifecycleFailureCode, LifecycleState,
    PrivateStudioV1LifecycleOwner, StudioV1LifecycleConfiguration,
    StudioV1LifecycleFailure, configuration_from_environment, studio_v1_lifespan,
)


def config(tmp_path, **changes):
    values = dict(enabled=True, application_instance_id="deployment-instance-7",
                  database_path=tmp_path / "studio-v1.sqlite3",
                  projection_lease_duration=timedelta(seconds=30),
                  maximum_projection_attempts=3,
                  expected_schema_version=STUDIO_V1_SCHEMA_VERSION,
                  expired_lease_recovery_policy=ExpiredLeaseRecoveryPolicy.RECOVER_ON_START)
    values.update(changes)
    return StudioV1LifecycleConfiguration(**values)


def failure(code, call):
    with pytest.raises(StudioV1LifecycleFailure) as caught:
        call()
    assert caught.value.code is code
    return caught.value


def test_import_and_construction_have_no_side_effects(tmp_path, monkeypatch):
    before = dict(__import__("os").environ)
    path = tmp_path / "never-created.sqlite3"
    owner = PrivateStudioV1LifecycleOwner(config(tmp_path, database_path=path))
    assert owner.state is LifecycleState.CREATED and not path.exists()
    assert dict(__import__("os").environ) == before
    assert not any(x.name.startswith("studio") for x in tmp_path.iterdir())


def test_disabled_is_non_error_and_creates_no_database(tmp_path):
    path = tmp_path / "disabled.sqlite3"
    owner = PrivateStudioV1LifecycleOwner(config(tmp_path, enabled=False, database_path=path))
    ready = owner.start()
    assert ready.state is LifecycleState.DISABLED and not ready.ready
    assert ready.failure_code is None and ready.safe_message == "Studio V1 is disabled."
    assert not path.exists()
    failure(LifecycleFailureCode.NOT_READY, owner.facade)


def test_valid_enabled_configuration_starts_ready_and_has_one_facade(tmp_path):
    owner = PrivateStudioV1LifecycleOwner(config(tmp_path))
    ready = owner.start()
    assert ready.state is LifecycleState.READY and ready.ready
    assert owner.facade() is owner.facade()
    owner.stop()


@pytest.mark.parametrize(("changes", "message"), [
    ({"database_path": None}, "persistence"),
    ({"database_path": Path("relative.sqlite3")}, "absolute"),
    ({"projection_lease_duration": timedelta(0)}, "lease"),
    ({"maximum_projection_attempts": 0}, "attempts"),
    ({"expected_schema_version": 0}, "schema"),
])
def test_invalid_enabled_configuration_fails_closed(tmp_path, changes, message):
    owner = PrivateStudioV1LifecycleOwner(config(tmp_path, **changes))
    error = failure(LifecycleFailureCode.INVALID_CONFIGURATION, owner.start)
    assert message in error.safe_message.lower()
    assert owner.state is LifecycleState.FAILED
    failure(LifecycleFailureCode.NOT_READY, owner.facade)


def test_schema_incompatibility_remains_fail_closed(tmp_path):
    owner = PrivateStudioV1LifecycleOwner(config(tmp_path, expected_schema_version=999))
    failure(LifecycleFailureCode.START_FAILED, owner.start)
    assert owner.readiness().failure_code == "INCOMPATIBLE_SCHEMA_VERSION"
    assert not (tmp_path / "studio-v1.sqlite3").exists()


def test_readiness_never_contains_path_connection_or_sqlite_detail(tmp_path):
    path = tmp_path / "secret-location.sqlite3"
    owner = PrivateStudioV1LifecycleOwner(config(tmp_path, database_path=path))
    owner.start()
    text = repr(dataclasses.asdict(owner.readiness())).lower()
    assert str(path).lower() not in text and "sqlite" not in text and "connection" not in text
    owner.stop()


def test_repeated_start_and_stop_are_idempotent_and_stopped_is_terminal(tmp_path):
    owner = PrivateStudioV1LifecycleOwner(config(tmp_path))
    assert owner.start() is owner.start()
    first = owner.stop()
    assert owner.stop() is first
    failure(LifecycleFailureCode.TERMINAL, owner.start)


def test_facade_access_before_start_and_after_stop_is_rejected(tmp_path):
    owner = PrivateStudioV1LifecycleOwner(config(tmp_path))
    failure(LifecycleFailureCode.NOT_READY, owner.facade)
    owner.start(); owner.stop()
    failure(LifecycleFailureCode.NOT_READY, owner.facade)


class FakeApplication:
    def __init__(self, *, fail=False, block=None):
        self.fail, self.block = fail, block
        self.starts = self.closes = 0
        self.recovery = None

    def start(self, *, recover_expired_leases=False):
        self.starts += 1
        self.recovery = recover_expired_leases
        if self.block:
            self.block.wait(timeout=5)
        if self.fail:
            raise RuntimeError("path=/private raw sqlite connection detail")
        return type("Ready", (), {"recovered_expired_job_count": 4})()

    def close(self):
        self.closes += 1


class BlockingApplication(FakeApplication):
    def __init__(self):
        super().__init__()
        self.start_entered, self.start_release = Event(), Event()
        self.close_entered, self.close_release = Event(), Event()

    def start(self, *, recover_expired_leases=False):
        self.starts += 1
        self.start_entered.set()
        assert self.start_release.wait(timeout=5)
        return type("Ready", (), {"recovered_expired_job_count": 0})()

    def close(self):
        self.closes += 1
        self.close_entered.set()
        assert self.close_release.wait(timeout=5)


def test_startup_failure_is_safe_failed_and_releases_partial_resource(tmp_path):
    application = FakeApplication(fail=True)
    owner = PrivateStudioV1LifecycleOwner(config(tmp_path), application_composer=lambda _: application)
    error = failure(LifecycleFailureCode.START_FAILED, owner.start)
    assert owner.state is LifecycleState.FAILED and application.closes == 1
    assert "private" not in error.safe_message and "sqlite" not in error.safe_message
    failure(LifecycleFailureCode.NOT_READY, owner.facade)
    assert owner.stop().state is LifecycleState.STOPPED


def test_concurrent_starts_compose_once_and_identity_is_stable(tmp_path):
    application, composed = FakeApplication(), []
    def compose(settings):
        composed.append(settings.application_instance_id)
        return application
    owner = PrivateStudioV1LifecycleOwner(config(tmp_path), application_composer=compose)
    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(lambda _: owner.start(), range(8)))
    assert len(composed) == 1 and application.starts == 1
    assert {x.application_instance_id for x in results} == {"deployment-instance-7"}
    assert all(owner.facade() is application for _ in range(3))
    owner.stop()


def test_concurrent_stops_close_once_and_reject_access(tmp_path):
    application = FakeApplication()
    owner = PrivateStudioV1LifecycleOwner(config(tmp_path), application_composer=lambda _: application)
    owner.start()
    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(lambda _: owner.stop(), range(8)))
    assert application.closes == 1 and {x.state for x in results} == {LifecycleState.STOPPED}
    failure(LifecycleFailureCode.NOT_READY, owner.facade)


def test_access_during_starting_and_stopping_is_rejected(tmp_path):
    application = BlockingApplication()
    owner = PrivateStudioV1LifecycleOwner(config(tmp_path), application_composer=lambda _: application)
    with ThreadPoolExecutor(max_workers=1) as pool:
        starting = pool.submit(owner.start)
        assert application.start_entered.wait(timeout=5)
        assert owner.state is LifecycleState.STARTING
        failure(LifecycleFailureCode.NOT_READY, owner.facade)
        application.start_release.set()
        starting.result(timeout=5)
    with ThreadPoolExecutor(max_workers=1) as pool:
        stopping = pool.submit(owner.stop)
        assert application.close_entered.wait(timeout=5)
        assert owner.state is LifecycleState.STOPPING
        failure(LifecycleFailureCode.NOT_READY, owner.facade)
        application.close_release.set()
        stopping.result(timeout=5)


@pytest.mark.parametrize(("policy", "expected"), [
    (ExpiredLeaseRecoveryPolicy.RECOVER_ON_START, True),
    (ExpiredLeaseRecoveryPolicy.LEAVE_EXPIRED, False),
])
def test_expired_lease_recovery_policy_is_honored(tmp_path, policy, expected):
    application = FakeApplication()
    owner = PrivateStudioV1LifecycleOwner(config(tmp_path, expired_lease_recovery_policy=policy),
                                          application_composer=lambda _: application)
    assert owner.start().recovered_expired_job_count == 4
    assert application.recovery is expected
    owner.stop()


def test_environment_adapter_is_strict_isolated_and_testable(tmp_path):
    values = {
        "ISEES_STUDIO_V1_ENABLED": "true",
        "ISEES_STUDIO_V1_DATABASE_PATH": str(tmp_path / "configured.sqlite3"),
        "ISEES_STUDIO_V1_APPLICATION_INSTANCE_ID": "instance-from-deployment",
        "ISEES_STUDIO_V1_PROJECTION_LEASE_SECONDS": "45",
        "ISEES_STUDIO_V1_MAXIMUM_PROJECTION_ATTEMPTS": "5",
        "ISEES_STUDIO_V1_EXPECTED_SCHEMA_VERSION": str(STUDIO_V1_SCHEMA_VERSION),
        "ISEES_STUDIO_V1_EXPIRED_LEASE_RECOVERY_POLICY": "leave_expired",
    }
    parsed = configuration_from_environment(values)
    assert parsed.application_instance_id == "instance-from-deployment"
    assert parsed.database_path == tmp_path / "configured.sqlite3"
    assert parsed.expired_lease_recovery_policy is ExpiredLeaseRecoveryPolicy.LEAVE_EXPIRED
    failure(LifecycleFailureCode.INVALID_CONFIGURATION,
            lambda: configuration_from_environment({**values, "ISEES_STUDIO_V1_ENABLED": "yes"}))
    failure(LifecycleFailureCode.INVALID_CONFIGURATION,
            lambda: configuration_from_environment({k: v for k, v in values.items()
                                                    if k != "ISEES_STUDIO_V1_APPLICATION_INSTANCE_ID"}))


def test_lifespan_helper_stores_owner_not_facade_and_orders_shutdown(tmp_path):
    application = FakeApplication()
    owner = PrivateStudioV1LifecycleOwner(config(tmp_path), application_composer=lambda _: application)
    app = FastAPI(lifespan=studio_v1_lifespan(lambda: owner))
    route_count = len(app.routes)
    with TestClient(app):
        assert app.state.private_studio_v1_lifecycle_owner is owner
        assert owner.state is LifecycleState.READY and application.closes == 0
        assert len(app.routes) == route_count
    assert owner.state is LifecycleState.STOPPED and application.closes == 1


def test_live_api_has_no_private_v1_route_or_lifecycle_mount():
    from isees_uap.api import app
    assert not hasattr(app.state, "private_studio_v1_lifecycle_owner")
    assert not any("studio-v1" in route.path.lower() for route in app.routes)


def test_connection_factory_is_accepted_without_database_path(tmp_path):
    connections = []
    def factory():
        connection = sqlite3.connect(tmp_path / "factory-owned.sqlite3", check_same_thread=False)
        connections.append(connection)
        return connection
    owner = PrivateStudioV1LifecycleOwner(config(tmp_path, database_path=None,
                                                 connection_factory=factory))
    owner.start(); owner.stop()
    assert connections
    with pytest.raises(sqlite3.ProgrammingError):
        connections[0].execute("SELECT 1")
