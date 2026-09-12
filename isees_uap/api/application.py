"""FastAPI deployment composition for the private STUDIO V1 lifecycle."""
from __future__ import annotations

from contextlib import asynccontextmanager
from ipaddress import ip_address
from os import environ
from pathlib import Path
import re
from typing import AsyncContextManager, Callable, Mapping

from fastapi import FastAPI

from isees_uap.studio.v1.application import STUDIO_V1_SCHEMA_VERSION
from isees_uap.studio.v1.lifecycle import (
    ENVIRONMENT_KEYS,
    PrivateStudioV1LifecycleOwner,
    StudioV1LifecycleConfiguration,
    configuration_from_environment,
)
from isees_uap.persistence import database_path

Lifespan = Callable[[FastAPI], AsyncContextManager[None]]

_DISABLED_DEFAULTS = {
    ENVIRONMENT_KEYS[0]: "false",
    ENVIRONMENT_KEYS[2]: "studio-v1-disabled",
    ENVIRONMENT_KEYS[3]: "1",
    ENVIRONMENT_KEYS[4]: "1",
    ENVIRONMENT_KEYS[5]: str(STUDIO_V1_SCHEMA_VERSION),
    ENVIRONMENT_KEYS[6]: "LEAVE_EXPIRED",
}

TRUSTED_HOSTS_ENVIRONMENT_KEY = "ISEES_TRUSTED_HOSTS"
_HOST_PATTERN = re.compile(
    r"^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*"
    r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$"
)


def trusted_hosts_from_environment(values: Mapping[str, str]) -> tuple[str, ...]:
    """Return a strict deployment host allowlist without exposing it diagnostically."""
    environment_name = values.get("ISEES_AUTH_ENV", "development").strip().lower()
    if environment_name not in {"production", "development", "test"}:
        raise RuntimeError("ISEES_AUTH_ENV must be production, development, or test")
    raw = values.get(TRUSTED_HOSTS_ENVIRONMENT_KEY)
    if raw is None:
        if environment_name == "production":
            raise RuntimeError("Production trusted-host configuration is required")
        return ("testserver", "localhost", "127.0.0.1")
    entries = raw.split(",")
    if not entries or any(entry != entry.strip() or not entry for entry in entries):
        raise RuntimeError("Trusted-host configuration is malformed")
    hosts = tuple(entry.lower() for entry in entries)
    if len(hosts) != len(set(hosts)) or any("*" in host for host in hosts):
        raise RuntimeError("Trusted-host configuration is unsafe")
    if any(not _HOST_PATTERN.fullmatch(host) for host in hosts):
        raise RuntimeError("Trusted-host configuration is malformed")
    def local_or_loopback(host: str) -> bool:
        if host in {"localhost", "testserver"}:
            return True
        try:
            return ip_address(host).is_loopback
        except ValueError:
            return False

    if environment_name == "production" and any(local_or_loopback(host) for host in hosts):
        raise RuntimeError("Production trusted-host configuration is unsafe")
    return hosts


def studio_v1_deployment_configuration(
    values: Mapping[str, str],
) -> StudioV1LifecycleConfiguration:
    """Resolve deployment policy through I4's sole strict parser."""
    supplied = {key: values[key] for key in ENVIRONMENT_KEYS if key in values}
    if ENVIRONMENT_KEYS[0] not in supplied:
        supplied[ENVIRONMENT_KEYS[0]] = "false"
    if supplied[ENVIRONMENT_KEYS[0]].strip().lower() == "false":
        supplied = {**_DISABLED_DEFAULTS, **supplied}
    elif ENVIRONMENT_KEYS[1] not in supplied:
        persistent_root = values.get("ISEES_PERSISTENT_ROOT")
        if (isinstance(persistent_root, str) and persistent_root.strip()
                and Path(persistent_root).is_absolute()):
            supplied[ENVIRONMENT_KEYS[1]] = str(database_path(
                ENVIRONMENT_KEYS[1], "studio-v1.sqlite3", "runtime/studio-v1.sqlite3", values))
    return configuration_from_environment(supplied)


def studio_v1_application_lifespan(
    configuration: StudioV1LifecycleConfiguration,
    *,
    existing_lifespan: Lifespan | None = None,
) -> Lifespan:
    """Run existing startup first, then STUDIO; unwind in reverse order."""
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        owner = PrivateStudioV1LifecycleOwner(configuration)
        state = vars(app.state).setdefault("_state", {})
        missing = object()
        previous_owner = state.get("private_studio_v1_lifecycle_owner", missing)
        app.state.private_studio_v1_lifecycle_owner = owner

        @asynccontextmanager
        async def existing_context():
            if existing_lifespan is None:
                yield
            else:
                async with existing_lifespan(app):
                    yield

        async with existing_context():
            owner.start()
            try:
                yield
            finally:
                owner.stop()
                if previous_owner is missing:
                    state.pop("private_studio_v1_lifecycle_owner", None)
                else:
                    app.state.private_studio_v1_lifecycle_owner = previous_owner

    return lifespan


def process_studio_v1_configuration() -> StudioV1LifecycleConfiguration:
    """Read the process environment once for one application composition."""
    return studio_v1_deployment_configuration(environ)
