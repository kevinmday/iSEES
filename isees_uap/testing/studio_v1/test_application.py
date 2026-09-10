from __future__ import annotations

import importlib
import json
import sqlite3
from copy import deepcopy
from dataclasses import replace
from datetime import datetime, timedelta, timezone

import pytest

from isees_uap.studio.v1.application import (ApplicationState, StudioV1ApplicationSettings,
                                             compose_private_studio_v1_application)
from isees_uap.studio.v1.hashing import canonical_sha256
from isees_uap.studio.v1.persistence import FailureCode, StudioV1Failure
from isees_uap.studio.v1.save_service import request_fingerprint
from isees_uap.testing.studio_v1.test_persistence import make_command

NOW = datetime(2026, 9, 10, 18, 0, tzinfo=timezone.utc)


class Clock:
    def __init__(self, value=NOW): self.value = value
    def __call__(self): return self.value


def settings(path, *, identity="studio-instance-a", attempts=2, schema=1):
    return StudioV1ApplicationSettings(identity, attempts, timedelta(minutes=5),
                                       database_path=path.resolve(), expected_schema_version=schema)


def application(tmp_path, **kwargs):
    return compose_private_studio_v1_application(settings(tmp_path / "studio-v1.sqlite3", **kwargs),
                                                  clock=Clock())


def assert_code(code, action):
    with pytest.raises(StudioV1Failure) as caught: action()
    assert caught.value.code is code
    assert "sqlite" not in caught.value.safe_message.lower()


def test_explicit_configuration_and_import_have_no_side_effects(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    before = set(tmp_path.iterdir())
    importlib.import_module("isees_uap.studio.v1.application")
    assert set(tmp_path.iterdir()) == before
    assert_code(FailureCode.INVALID_APPLICATION_CONFIGURATION,
                lambda: StudioV1ApplicationSettings("i", 1, timedelta(seconds=1)).validate())
    assert_code(FailureCode.INVALID_APPLICATION_CONFIGURATION,
                lambda: StudioV1ApplicationSettings(" ", 0, timedelta(0),
                    database_path=tmp_path / "relative.db").validate())


def test_composition_is_lazy_owned_and_lifecycle_is_fail_closed(tmp_path):
    path = tmp_path / "studio-v1.sqlite3"
    app = application(tmp_path)
    assert app.state is ApplicationState.CREATED and not path.exists()
    assert app._save_service._store is app._store
    assert_code(FailureCode.APPLICATION_NOT_STARTED,
                lambda: app.list_revisions("principal-1", "investigation-1", "a"))
    ready = app.start()
    assert path.exists() and ready.state is ApplicationState.READY
    assert app.start() == ready
    safe = json.dumps(ready.__dict__, default=str)
    assert str(path) not in safe and "sqlite" not in safe.lower()
    app.close(); app.close()
    assert app.state is ApplicationState.CLOSED
    assert_code(FailureCode.APPLICATION_CLOSED,
                lambda: app.get_artifact_identity("p", "i", "a"))


def test_facade_save_queries_restart_and_idempotency(tmp_path):
    path = tmp_path / "studio-v1.sqlite3"; command = make_command(); app = application(tmp_path); app.start()
    first = app.save("principal-1", "investigation-1", command)
    assert app.get_artifact_identity("principal-1", "investigation-1", first.artifact_id).currentSavedRevisionId == first.revision_id
    assert app.get_artifact_head("principal-1", "investigation-1", first.artifact_id).revisionId == first.revision_id
    assert [x.revisionId for x in app.list_revisions("principal-1", "investigation-1", first.artifact_id)] == [first.revision_id]
    assert app.get_frozen_snapshot("principal-1", "investigation-1", command.snapshots[0].snapshotId).snapshotHash == command.snapshots[0].snapshotHash
    assert len(app.list_projection_jobs("principal-1", "investigation-1", first.artifact_id, first.revision_id)) == 2
    timed = replace(command, command_timestamp="2026-09-10T18:00:00.000Z")
    fingerprint = request_fingerprint(timed)
    assert app.get_idempotency_result("principal-1", "investigation-1", command.operation,
                                      command.idempotency_key, fingerprint).revision_id == first.revision_id
    app.close(); reopened = compose_private_studio_v1_application(settings(path), clock=Clock()); reopened.start()
    replay = reopened.save("principal-1", "investigation-1", command)
    assert replay.replayed and replay.revision_id == first.revision_id
    different = replace(command, expected_head_revision_id=first.revision_id,
                        artifact=command.artifact.model_copy(update={"currentSavedRevisionId": first.revision_id}))
    raw = different.revision.model_dump(exclude_none=True); raw["semanticContent"]["title"] = "different"
    raw["contentHash"] = canonical_sha256(raw["semanticContent"])
    different = replace(different, revision=different.revision.model_validate(raw))
    assert_code(FailureCode.IDEMPOTENCY_KEY_REUSE,
                lambda: reopened.save("principal-1", "investigation-1", different))
    reopened.close()


def test_cross_scope_queries_do_not_leak_existence(tmp_path):
    app = application(tmp_path); app.start(); command = make_command(); app.save("principal-1", "investigation-1", command)
    assert_code(FailureCode.ARTIFACT_NOT_FOUND,
                lambda: app.get_artifact_identity("other", "investigation-1", command.artifact.artifactId))
    assert_code(FailureCode.ARTIFACT_NOT_FOUND,
                lambda: app.get_artifact_head("principal-1", "other", command.artifact.artifactId))
    assert_code(FailureCode.SNAPSHOT_NOT_FOUND,
                lambda: app.get_frozen_snapshot("other", "investigation-1", command.snapshots[0].snapshotId))
    app.close()


def test_two_instances_save_and_claim_exclusively(tmp_path):
    path = tmp_path / "studio-v1.sqlite3"
    one = compose_private_studio_v1_application(settings(path, identity="one"), clock=Clock())
    two = compose_private_studio_v1_application(settings(path, identity="two"), clock=Clock())
    one.start(); two.start(); command = make_command(projections=1)
    saved = one.save("principal-1", "investigation-1", command)
    assert two.save("principal-1", "investigation-1", command).replayed
    claimed = one.claim_next_projection_job("principal-1", "investigation-1", "worker-one", "lease-one")
    assert claimed.job_id == saved.job_ids[0]
    assert two.claim_next_projection_job("principal-1", "investigation-1", "worker-two", "lease-two") is None
    assert_code(FailureCode.LEASE_CONFLICT,
                lambda: two.complete_projection_job("principal-1", "investigation-1", claimed.job_id,
                                                    "wrong", "sha256:" + "a" * 64))
    one.close(); two.close()


def test_projection_failure_recovery_attempt_limit_and_parent_isolation(tmp_path):
    path = tmp_path / "studio-v1.sqlite3"; clock = Clock(); app = compose_private_studio_v1_application(settings(path), clock=clock)
    app.start(); command = make_command(); result = app.save("principal-1", "investigation-1", command)
    claimed = app.claim_next_projection_job("principal-1", "investigation-1", "worker", "lease-1")
    parent = app.get_artifact_head("principal-1", "investigation-1", command.artifact.artifactId)
    failed = app.fail_projection_job("principal-1", "investigation-1", claimed.job_id, "lease-1",
                                     "RENDER_FAILED", "Projection generation failed.")
    sibling = next(x for x in app.list_projection_jobs("principal-1", "investigation-1",
                   command.artifact.artifactId, command.revision.revisionId) if x.job_id != failed.job_id)
    assert failed.state == "FAILED" and sibling.state == "QUEUED"
    assert app.get_artifact_head("principal-1", "investigation-1", command.artifact.artifactId) == parent
    app.retry_projection_job("principal-1", "investigation-1", failed.job_id)
    again = app.claim_next_projection_job("principal-1", "investigation-1", "worker", "lease-2")
    app.fail_projection_job("principal-1", "investigation-1", again.job_id, "lease-2",
                            "RENDER_FAILED", "Projection generation failed.")
    assert_code(FailureCode.ATTEMPT_LIMIT_REACHED,
                lambda: app.retry_projection_job("principal-1", "investigation-1", again.job_id))
    app.close()

    recovery_clock = Clock(NOW + timedelta(minutes=10))
    reopened = compose_private_studio_v1_application(settings(path, identity="restart"), clock=recovery_clock)
    ready = reopened.start(recover_expired_leases=True)
    assert ready.recovered_expired_job_count == 0
    reopened.close()


def test_expired_lease_recovery_after_restart(tmp_path):
    path = tmp_path / "studio-v1.sqlite3"; app = compose_private_studio_v1_application(settings(path), clock=Clock())
    app.start(); app.save("principal-1", "investigation-1", make_command(projections=1))
    app.claim_next_projection_job("principal-1", "investigation-1", "worker", "lease"); app.close()
    later = compose_private_studio_v1_application(settings(path, identity="restart"),
                                                   clock=Clock(NOW + timedelta(minutes=6)))
    assert later.start(recover_expired_leases=True).recovered_expired_job_count == 1
    later.close()


def test_incompatible_schema_and_legacy_tables_are_untouched(tmp_path):
    path = tmp_path / "studio-v1.sqlite3"
    with sqlite3.connect(path) as db:
        db.execute("CREATE TABLE legacy_studio(value TEXT)")
        db.execute("INSERT INTO legacy_studio VALUES('preserve-byte-logical-content')")
        db.execute("CREATE TABLE studio_v1_schema_identity(schema_name TEXT PRIMARY KEY, schema_version INTEGER NOT NULL)")
        db.execute("INSERT INTO studio_v1_schema_identity VALUES('STUDIO_V1',999)")
    app = compose_private_studio_v1_application(settings(path), clock=Clock())
    assert_code(FailureCode.INCOMPATIBLE_SCHEMA_VERSION, app.start)
    with sqlite3.connect(path) as db:
        assert db.execute("SELECT value FROM legacy_studio").fetchone()[0] == "preserve-byte-logical-content"
        assert db.execute("SELECT schema_version FROM studio_v1_schema_identity").fetchone()[0] == 999
        assert not db.execute("SELECT name FROM sqlite_master WHERE name='studio_v1_artifacts'").fetchone()


def test_unsupported_expected_schema_creates_no_database(tmp_path):
    path = tmp_path / "unsupported.sqlite3"
    assert_code(FailureCode.INCOMPATIBLE_SCHEMA_VERSION,
                lambda: compose_private_studio_v1_application(settings(path, schema=2), clock=Clock()))
    assert not path.exists()
