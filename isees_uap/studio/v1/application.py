"""Private STUDIO V1 application composition; deliberately not mounted by the API."""
from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import datetime, timedelta, timezone
from enum import Enum
from pathlib import Path
from threading import RLock
from typing import Callable

from .legacy_adapter import legacy_version_to_author_revision
from .persistence import (FailureCode, ProjectionJob, SaveCommand, SaveResult,
                          StudioV1Failure)
from .save_service import StudioV1SaveService, request_fingerprint
from .sqlite_store import ConnectionFactory, SQLiteStudioV1Store

STUDIO_V1_CONTRACT_VERSION = "studio-v1"
STUDIO_V1_SCHEMA_VERSION = 1


class ApplicationState(str, Enum):
    CREATED = "CREATED"
    STARTING = "STARTING"
    READY = "READY"
    CLOSING = "CLOSING"
    CLOSED = "CLOSED"
    FAILED = "FAILED"


@dataclass(frozen=True)
class StudioV1ApplicationSettings:
    application_instance_id: str
    maximum_projection_attempts: int
    projection_lease_duration: timedelta
    database_path: Path | None = None
    connection_factory: ConnectionFactory | None = None
    expected_schema_version: int = STUDIO_V1_SCHEMA_VERSION

    def validate(self) -> None:
        if not isinstance(self.application_instance_id, str) or not self.application_instance_id.strip():
            _invalid("Application instance identity is required.")
        if type(self.maximum_projection_attempts) is not int or self.maximum_projection_attempts < 1:
            _invalid("Maximum projection attempts must be a positive integer.")
        if not isinstance(self.projection_lease_duration, timedelta) or self.projection_lease_duration <= timedelta(0):
            _invalid("Projection lease duration must be positive.")
        if type(self.expected_schema_version) is not int or self.expected_schema_version < 1:
            _invalid("Expected schema version must be a positive integer.")
        if self.expected_schema_version != STUDIO_V1_SCHEMA_VERSION:
            raise StudioV1Failure(FailureCode.INCOMPATIBLE_SCHEMA_VERSION,
                                  "The requested Studio V1 schema version is incompatible.")
        if (self.database_path is None) == (self.connection_factory is None):
            _invalid("Provide exactly one database path or approved connection factory.")
        if self.database_path is not None:
            path = Path(self.database_path)
            if not path.is_absolute():
                _invalid("Studio database path must be absolute.")
            if not path.parent.exists() or not path.parent.is_dir():
                _invalid("Studio database parent directory must already exist.")
            if path.exists() and not path.is_file():
                _invalid("Studio database path must identify a file.")
        if self.connection_factory is not None and not callable(self.connection_factory):
            _invalid("Studio connection factory must be callable.")


@dataclass(frozen=True)
class StudioV1Readiness:
    state: ApplicationState
    contract_version: str
    schema_version: int
    persistence_ready: bool
    projection_outbox_ready: bool
    application_instance_id: str
    recovered_expired_job_count: int | None = None


def _invalid(message: str):
    raise StudioV1Failure(FailureCode.INVALID_APPLICATION_CONFIGURATION, message)


def _timestamp(value: datetime) -> str:
    if not isinstance(value, datetime) or value.tzinfo is None:
        raise StudioV1Failure(FailureCode.APPLICATION_START_FAILED,
                              "The application clock must return a timezone-aware datetime.")
    return value.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


class PrivateStudioV1Application:
    def __init__(self, settings: StudioV1ApplicationSettings, clock: Callable[[], datetime],
                 store: SQLiteStudioV1Store, save_service: StudioV1SaveService):
        self._settings, self._clock = settings, clock
        self._store, self._save_service = store, save_service
        self._state, self._lock = ApplicationState.CREATED, RLock()
        self._readiness = self._status(False, None)

    @property
    def state(self): return self._state

    def _status(self, ready, recovered):
        return StudioV1Readiness(self._state, STUDIO_V1_CONTRACT_VERSION,
            self._settings.expected_schema_version, ready, ready,
            self._settings.application_instance_id, recovered)

    def readiness(self):
        return self._readiness

    def start(self, *, recover_expired_leases: bool = False):
        with self._lock:
            if self._state is ApplicationState.READY:
                return self._readiness
            if self._state is ApplicationState.CLOSED:
                self._closed()
            if self._state is not ApplicationState.CREATED:
                raise StudioV1Failure(FailureCode.APPLICATION_START_FAILED,
                                      "Studio application cannot start from its current state.")
            self._state = ApplicationState.STARTING
            try:
                self._settings.validate()
                self._store.initialize_schema()
                self._store.verify_schema_version(self._settings.expected_schema_version)
                recovered = self._store.recover_expired_jobs(self._now()) if recover_expired_leases else None
                self._state = ApplicationState.READY
                self._readiness = self._status(True, recovered)
                return self._readiness
            except StudioV1Failure:
                self._state = ApplicationState.FAILED
                self._readiness = self._status(False, None)
                self._store.close()
                raise
            except Exception as exc:
                self._state = ApplicationState.FAILED
                self._readiness = self._status(False, None)
                self._store.close()
                raise StudioV1Failure(FailureCode.APPLICATION_START_FAILED,
                                      "Studio application startup failed.") from exc

    def close(self):
        with self._lock:
            if self._state is ApplicationState.CLOSED: return
            self._state = ApplicationState.CLOSING
            self._store.close()
            self._state = ApplicationState.CLOSED
            self._readiness = self._status(False, None)

    def _now(self): return _timestamp(self._clock())
    def _require_ready(self):
        if self._state is ApplicationState.CLOSED: self._closed()
        if self._state is not ApplicationState.READY:
            raise StudioV1Failure(FailureCode.APPLICATION_NOT_STARTED,
                                  "Studio application is not ready.")
    @staticmethod
    def _closed():
        raise StudioV1Failure(FailureCode.APPLICATION_CLOSED, "Studio application is closed.")

    @staticmethod
    def _scope_failure(exc):
        if exc.code in (FailureCode.AUTHORITY_MISMATCH, FailureCode.INVESTIGATION_MISMATCH):
            raise StudioV1Failure(FailureCode.ARTIFACT_NOT_FOUND, "Artifact was not found.") from exc
        raise exc

    def save(self, owner_id, investigation_id, command: SaveCommand) -> SaveResult:
        self._require_ready()
        if command.artifact.authorPrincipalId != owner_id or command.artifact.investigationId != investigation_id:
            raise StudioV1Failure(FailureCode.ARTIFACT_NOT_FOUND, "Artifact was not found.")
        timed = replace(command, command_timestamp=self._now())
        timed = replace(timed, request_fingerprint=request_fingerprint(timed))
        return self._save_service.save(timed)

    def get_artifact_identity(self, owner_id, investigation_id, artifact_id):
        self._require_ready()
        try: return self._store.locate_artifact(owner_id, investigation_id, artifact_id)
        except StudioV1Failure as exc: self._scope_failure(exc)
    def get_artifact_head(self, owner_id, investigation_id, artifact_id):
        self._require_ready()
        try: return self._store.get_artifact_head(owner_id, investigation_id, artifact_id)
        except StudioV1Failure as exc: self._scope_failure(exc)
    def get_revision(self, owner_id, investigation_id, artifact_id, revision_id):
        self._require_ready()
        try: return self._store.get_revision(owner_id, investigation_id, artifact_id, revision_id)
        except StudioV1Failure as exc: self._scope_failure(exc)
    def list_revisions(self, owner_id, investigation_id, artifact_id):
        self._require_ready()
        try: return tuple(self._store.list_revisions(owner_id, investigation_id, artifact_id))
        except StudioV1Failure as exc: self._scope_failure(exc)
    def get_frozen_snapshot(self, owner_id, investigation_id, snapshot_id):
        self._require_ready(); return self._store.get_snapshot(owner_id, investigation_id, snapshot_id)
    def get_idempotency_result(self, owner_id, investigation_id, operation, key, fingerprint):
        self._require_ready()
        return self._store.get_idempotency_result(owner_id, investigation_id, operation, key, fingerprint)
    def list_projection_jobs(self, owner_id, investigation_id, artifact_id, revision_id):
        self._require_ready()
        self.get_revision(owner_id, investigation_id, artifact_id, revision_id)
        return tuple(x for x in self._store.list_projection_jobs(owner_id, investigation_id, artifact_id)
                     if x.revision_id == revision_id)

    def claim_next_projection_job(self, owner_id, investigation_id, worker_id, lease_id):
        self._require_ready()
        if not worker_id.strip() or not lease_id.strip():
            raise StudioV1Failure(FailureCode.LEASE_CONFLICT, "Active lease identity is required.")
        now_dt = self._clock(); now = _timestamp(now_dt)
        expires = _timestamp(now_dt + self._settings.projection_lease_duration)
        candidates = self._store.list_projection_jobs(owner_id, investigation_id)
        for job in candidates:
            if job.state in ("QUEUED", "FAILED", "REBUILDING"):
                try: return self._store.claim_projection_job(job.job_id, worker_id, lease_id, now, expires)
                except StudioV1Failure as exc:
                    if exc.code in (FailureCode.LEASE_CONFLICT, FailureCode.ATTEMPT_LIMIT_REACHED): continue
                    raise
        return None

    def _scoped_job(self, owner_id, investigation_id, job_id) -> ProjectionJob:
        jobs = self._store.list_projection_jobs(owner_id, investigation_id)
        match = next((x for x in jobs if x.job_id == job_id), None)
        if match is None:
            raise StudioV1Failure(FailureCode.ARTIFACT_NOT_FOUND, "Projection job was not found.")
        return match
    def complete_projection_job(self, owner_id, investigation_id, job_id, lease_id, output_hash):
        self._require_ready(); self._scoped_job(owner_id, investigation_id, job_id)
        return self._store.complete_projection_job(job_id, lease_id, self._now(), output_hash)
    def fail_projection_job(self, owner_id, investigation_id, job_id, lease_id, code, safe_message):
        self._require_ready(); self._scoped_job(owner_id, investigation_id, job_id)
        return self._store.fail_projection_job(job_id, lease_id, self._now(), code, safe_message)
    def retry_projection_job(self, owner_id, investigation_id, job_id):
        self._require_ready(); self._scoped_job(owner_id, investigation_id, job_id)
        return self._store.retry_projection_job(job_id, self._now())
    def recover_expired_projection_jobs(self):
        self._require_ready(); return self._store.recover_expired_jobs(self._now())

    def convert_legacy_version(self, version, *, profile, profile_version, snapshot_references):
        self._require_ready()
        return legacy_version_to_author_revision(version, profile=profile,
            profile_version=profile_version, snapshot_references=tuple(snapshot_references))


def compose_private_studio_v1_application(settings: StudioV1ApplicationSettings, *,
        clock: Callable[[], datetime]) -> PrivateStudioV1Application:
    if not isinstance(settings, StudioV1ApplicationSettings) or not callable(clock):
        _invalid("Typed Studio settings and an injected clock are required.")
    settings.validate()
    store = SQLiteStudioV1Store(settings.database_path,
        connection_factory=settings.connection_factory,
        max_attempts=settings.maximum_projection_attempts)
    return PrivateStudioV1Application(settings, clock, store, StudioV1SaveService(store))
