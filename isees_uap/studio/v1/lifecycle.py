"""Private STUDIO V1 process lifecycle and deployment configuration.

This module is deliberately not mounted by the public API.  It has no import-time
configuration reads and owns no module-global application or database resource.
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from enum import Enum
from pathlib import Path
from threading import Condition, RLock
from typing import Callable, Mapping, Protocol

from .application import (STUDIO_V1_CONTRACT_VERSION, PrivateStudioV1Application,
                          StudioV1ApplicationSettings,
                          compose_private_studio_v1_application)
from .persistence import FailureCode, StudioV1Failure
from .sqlite_store import ConnectionFactory


class LifecycleState(str, Enum):
    CREATED = "CREATED"
    DISABLED = "DISABLED"
    STARTING = "STARTING"
    READY = "READY"
    STOPPING = "STOPPING"
    STOPPED = "STOPPED"
    FAILED = "FAILED"


class ExpiredLeaseRecoveryPolicy(str, Enum):
    RECOVER_ON_START = "RECOVER_ON_START"
    LEAVE_EXPIRED = "LEAVE_EXPIRED"


class LifecycleFailureCode(str, Enum):
    INVALID_CONFIGURATION = "INVALID_CONFIGURATION"
    START_FAILED = "START_FAILED"
    NOT_READY = "NOT_READY"
    TERMINAL = "TERMINAL"


class StudioV1LifecycleFailure(Exception):
    def __init__(self, code: LifecycleFailureCode, safe_message: str):
        super().__init__(safe_message)
        self.code = code
        self.safe_message = safe_message


@dataclass(frozen=True)
class StudioV1LifecycleConfiguration:
    enabled: bool
    application_instance_id: str
    projection_lease_duration: timedelta
    maximum_projection_attempts: int
    expected_schema_version: int
    expired_lease_recovery_policy: ExpiredLeaseRecoveryPolicy
    database_path: Path | None = None
    connection_factory: ConnectionFactory | None = None

    def validate(self) -> None:
        if type(self.enabled) is not bool:
            _configuration_error("Studio V1 enabled state must be explicit.")
        if not isinstance(self.application_instance_id, str) or not self.application_instance_id.strip():
            _configuration_error("Studio V1 application instance identity is required.")
        if (not isinstance(self.projection_lease_duration, timedelta)
                or self.projection_lease_duration <= timedelta(0)):
            _configuration_error("Studio V1 projection lease duration must be positive.")
        if type(self.maximum_projection_attempts) is not int or self.maximum_projection_attempts < 1:
            _configuration_error("Studio V1 maximum projection attempts must be positive.")
        if type(self.expected_schema_version) is not int or self.expected_schema_version < 1:
            _configuration_error("Studio V1 expected schema version must be positive.")
        if not isinstance(self.expired_lease_recovery_policy, ExpiredLeaseRecoveryPolicy):
            _configuration_error("Studio V1 expired lease recovery policy is invalid.")
        if not self.enabled:
            return
        if (self.database_path is None) == (self.connection_factory is None):
            _configuration_error("Studio V1 requires exactly one approved persistence configuration.")
        if self.database_path is not None:
            path = Path(self.database_path)
            if not path.is_absolute():
                _configuration_error("Studio V1 database path must be absolute.")
            if not path.parent.is_dir():
                _configuration_error("Studio V1 database parent directory is unavailable.")
            if path.exists() and not path.is_file():
                _configuration_error("Studio V1 database target is invalid.")
        if self.connection_factory is not None and not callable(self.connection_factory):
            _configuration_error("Studio V1 connection factory is invalid.")

    def application_settings(self) -> StudioV1ApplicationSettings:
        self.validate()
        if not self.enabled:
            _configuration_error("Disabled Studio V1 configuration has no application settings.")
        return StudioV1ApplicationSettings(
            application_instance_id=self.application_instance_id,
            maximum_projection_attempts=self.maximum_projection_attempts,
            projection_lease_duration=self.projection_lease_duration,
            database_path=self.database_path,
            connection_factory=self.connection_factory,
            expected_schema_version=self.expected_schema_version,
        )


ENVIRONMENT_KEYS = (
    "ISEES_STUDIO_V1_ENABLED", "ISEES_STUDIO_V1_DATABASE_PATH",
    "ISEES_STUDIO_V1_APPLICATION_INSTANCE_ID", "ISEES_STUDIO_V1_PROJECTION_LEASE_SECONDS",
    "ISEES_STUDIO_V1_MAXIMUM_PROJECTION_ATTEMPTS", "ISEES_STUDIO_V1_EXPECTED_SCHEMA_VERSION",
    "ISEES_STUDIO_V1_EXPIRED_LEASE_RECOVERY_POLICY",
)


def configuration_from_environment(values: Mapping[str, str]) -> StudioV1LifecycleConfiguration:
    """Parse an injected environment mapping without reading or mutating os.environ."""
    try:
        enabled_text = _required(values, ENVIRONMENT_KEYS[0]).lower()
        if enabled_text not in ("true", "false"):
            raise ValueError
        enabled = enabled_text == "true"
        raw_path = values.get(ENVIRONMENT_KEYS[1])
        path = Path(raw_path) if raw_path and raw_path.strip() else None
        configuration = StudioV1LifecycleConfiguration(
            enabled=enabled,
            database_path=path,
            application_instance_id=_required(values, ENVIRONMENT_KEYS[2]),
            projection_lease_duration=timedelta(seconds=int(_required(values, ENVIRONMENT_KEYS[3]))),
            maximum_projection_attempts=int(_required(values, ENVIRONMENT_KEYS[4])),
            expected_schema_version=int(_required(values, ENVIRONMENT_KEYS[5])),
            expired_lease_recovery_policy=ExpiredLeaseRecoveryPolicy(
                _required(values, ENVIRONMENT_KEYS[6]).upper()),
        )
        configuration.validate()
        return configuration
    except StudioV1LifecycleFailure:
        raise
    except (TypeError, ValueError, OverflowError) as exc:
        raise StudioV1LifecycleFailure(
            LifecycleFailureCode.INVALID_CONFIGURATION,
            "Studio V1 deployment configuration is invalid.",
        ) from exc


def _required(values: Mapping[str, str], key: str) -> str:
    value = values.get(key)
    if not isinstance(value, str) or not value.strip():
        _configuration_error("Studio V1 deployment configuration is incomplete.")
    return value.strip()


def _configuration_error(message: str):
    raise StudioV1LifecycleFailure(LifecycleFailureCode.INVALID_CONFIGURATION, message)


@dataclass(frozen=True)
class StudioV1LifecycleReadiness:
    state: LifecycleState
    enabled: bool
    ready: bool
    contract_version: str
    expected_schema_version: int
    application_instance_id: str
    recovered_expired_job_count: int | None = None
    failure_code: str | None = None
    safe_message: str | None = None


class _StudioApplication(Protocol):
    def start(self, *, recover_expired_leases: bool = False): ...
    def close(self) -> None: ...


ApplicationComposer = Callable[[StudioV1ApplicationSettings], _StudioApplication]


def _default_composer(settings: StudioV1ApplicationSettings) -> PrivateStudioV1Application:
    return compose_private_studio_v1_application(
        settings, clock=lambda: datetime.now(timezone.utc))


class PrivateStudioV1LifecycleOwner:
    """Own exactly one application. STOPPED is terminal; use a new owner to restart."""

    def __init__(self, configuration: StudioV1LifecycleConfiguration, *,
                 application_composer: ApplicationComposer = _default_composer):
        self._configuration = configuration
        self._application_composer = application_composer
        self._state = LifecycleState.CREATED
        self._application: _StudioApplication | None = None
        self._lock = RLock()
        self._condition = Condition(self._lock)
        self._readiness = self._snapshot()

    @property
    def state(self) -> LifecycleState:
        with self._lock:
            return self._state

    def readiness(self) -> StudioV1LifecycleReadiness:
        with self._lock:
            return self._readiness

    def start(self) -> StudioV1LifecycleReadiness:
        with self._lock:
            while self._state is LifecycleState.STARTING:
                self._condition.wait()
            if self._state in (LifecycleState.READY, LifecycleState.DISABLED):
                return self._readiness
            if self._state is LifecycleState.STOPPED:
                raise StudioV1LifecycleFailure(LifecycleFailureCode.TERMINAL,
                                               "Studio V1 lifecycle is stopped.")
            if self._state is not LifecycleState.CREATED:
                raise StudioV1LifecycleFailure(LifecycleFailureCode.START_FAILED,
                                               self._readiness.safe_message or
                                               "Studio V1 lifecycle cannot start.")
            self._state = LifecycleState.STARTING
            self._readiness = self._snapshot()
        try:
            self._configuration.validate()
            if not self._configuration.enabled:
                with self._lock:
                    self._state = LifecycleState.DISABLED
                    self._readiness = self._snapshot(safe_message="Studio V1 is disabled.")
                    self._condition.notify_all()
                    return self._readiness
            application = self._application_composer(self._configuration.application_settings())
            with self._lock:
                self._application = application
            result = application.start(recover_expired_leases=(
                self._configuration.expired_lease_recovery_policy
                is ExpiredLeaseRecoveryPolicy.RECOVER_ON_START))
            with self._lock:
                self._state = LifecycleState.READY
                self._readiness = self._snapshot(
                    recovered=getattr(result, "recovered_expired_job_count", None))
                self._condition.notify_all()
                return self._readiness
        except Exception as exc:
            with self._lock:
                self._release_application()
                self._state = LifecycleState.FAILED
                code, message = self._safe_start_failure(exc)
                self._readiness = self._snapshot(failure_code=code, safe_message=message)
                self._condition.notify_all()
            if isinstance(exc, StudioV1LifecycleFailure):
                raise
            raise StudioV1LifecycleFailure(LifecycleFailureCode.START_FAILED, message) from exc

    def stop(self) -> StudioV1LifecycleReadiness:
        with self._lock:
            while self._state in (LifecycleState.STARTING, LifecycleState.STOPPING):
                self._condition.wait()
            if self._state is LifecycleState.STOPPED:
                return self._readiness
            self._state = LifecycleState.STOPPING
            self._readiness = self._snapshot()
            application, self._application = self._application, None
        if application is not None:
            try:
                application.close()
            except Exception:
                pass
        with self._lock:
            self._state = LifecycleState.STOPPED
            self._readiness = self._snapshot()
            self._condition.notify_all()
            return self._readiness

    def facade(self) -> PrivateStudioV1Application:
        with self._lock:
            if self._state is not LifecycleState.READY or self._application is None:
                raise StudioV1LifecycleFailure(LifecycleFailureCode.NOT_READY,
                                               "Studio V1 is not ready.")
            return self._application  # type: ignore[return-value]

    def _release_application(self) -> None:
        application, self._application = self._application, None
        if application is not None:
            try:
                application.close()
            except Exception:
                pass

    def _snapshot(self, *, recovered: int | None = None, failure_code: str | None = None,
                  safe_message: str | None = None) -> StudioV1LifecycleReadiness:
        return StudioV1LifecycleReadiness(
            state=self._state, enabled=self._configuration.enabled,
            ready=self._state is LifecycleState.READY,
            contract_version=STUDIO_V1_CONTRACT_VERSION,
            expected_schema_version=self._configuration.expected_schema_version,
            application_instance_id=self._configuration.application_instance_id,
            recovered_expired_job_count=recovered, failure_code=failure_code,
            safe_message=safe_message,
        )

    @staticmethod
    def _safe_start_failure(exc: Exception) -> tuple[str, str]:
        if isinstance(exc, StudioV1LifecycleFailure):
            return exc.code.value, exc.safe_message
        if isinstance(exc, StudioV1Failure):
            if exc.code is FailureCode.INCOMPATIBLE_SCHEMA_VERSION:
                return exc.code.value, "Studio V1 schema is incompatible."
            if exc.code is FailureCode.INVALID_APPLICATION_CONFIGURATION:
                return LifecycleFailureCode.INVALID_CONFIGURATION.value, "Studio V1 configuration is invalid."
        return LifecycleFailureCode.START_FAILED.value, "Studio V1 startup failed."


def studio_v1_lifespan(owner_factory: Callable[[], PrivateStudioV1LifecycleOwner]):
    """Return an injectable FastAPI lifespan; the application state stores only the owner."""
    @asynccontextmanager
    async def lifespan(app):
        owner = owner_factory()
        app.state.private_studio_v1_lifecycle_owner = owner
        owner.start()
        try:
            yield
        finally:
            owner.stop()
    return lifespan
