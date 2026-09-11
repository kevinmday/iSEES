"""FastAPI deployment composition for the private STUDIO V1 lifecycle."""
from __future__ import annotations

from contextlib import asynccontextmanager
from os import environ
from typing import AsyncContextManager, Callable, Mapping

from fastapi import FastAPI

from isees_uap.studio.v1.application import STUDIO_V1_SCHEMA_VERSION
from isees_uap.studio.v1.lifecycle import (
    ENVIRONMENT_KEYS,
    PrivateStudioV1LifecycleOwner,
    StudioV1LifecycleConfiguration,
    configuration_from_environment,
)

Lifespan = Callable[[FastAPI], AsyncContextManager[None]]

_DISABLED_DEFAULTS = {
    ENVIRONMENT_KEYS[0]: "false",
    ENVIRONMENT_KEYS[2]: "studio-v1-disabled",
    ENVIRONMENT_KEYS[3]: "1",
    ENVIRONMENT_KEYS[4]: "1",
    ENVIRONMENT_KEYS[5]: str(STUDIO_V1_SCHEMA_VERSION),
    ENVIRONMENT_KEYS[6]: "LEAVE_EXPIRED",
}


def studio_v1_deployment_configuration(
    values: Mapping[str, str],
) -> StudioV1LifecycleConfiguration:
    """Resolve deployment policy through I4's sole strict parser."""
    supplied = {key: values[key] for key in ENVIRONMENT_KEYS if key in values}
    if ENVIRONMENT_KEYS[0] not in supplied:
        supplied[ENVIRONMENT_KEYS[0]] = "false"
    if supplied[ENVIRONMENT_KEYS[0]].strip().lower() == "false":
        supplied = {**_DISABLED_DEFAULTS, **supplied}
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
