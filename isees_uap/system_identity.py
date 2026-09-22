"""Authoritative, public iSEES product and release identity."""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Mapping

from pydantic import BaseModel, ConfigDict, field_validator

RELEASE_MANIFEST_PATH = Path(__file__).resolve().parents[1] / "release" / "isees-release.json"
_SEMANTIC_VERSION = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$")
_SAFE_REVISION = re.compile(r"^[\x21-\x7e]{1,200}$")
_UTC_TIMESTAMP = re.compile(
    r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$"
)


class ReleaseChannel(str, Enum):
    LOCAL = "LOCAL"
    CANDIDATE = "CANDIDATE"
    PRODUCTION = "PRODUCTION"


class RuntimeEnvironment(str, Enum):
    LOCAL = "LOCAL"
    GITHUB_SOURCE = "GITHUB_SOURCE"
    HUGGING_FACE = "HUGGING_FACE"


class ReleaseManifest(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    schemaVersion: str
    productId: str
    productName: str
    expandedName: str
    descriptor: str
    version: str
    frontendContract: str
    backendContract: str

    @field_validator("schemaVersion")
    @classmethod
    def validate_schema(cls, value: str) -> str:
        if value != "isees-release-manifest/v1":
            raise ValueError("unsupported release manifest schema")
        return value

    @field_validator("productId")
    @classmethod
    def validate_product(cls, value: str) -> str:
        if value != "isees":
            raise ValueError("unexpected release product identity")
        return value

    @field_validator("productName", "expandedName", "descriptor")
    @classmethod
    def validate_identity_text(cls, value: str) -> str:
        if not value or value != value.strip() or any(ord(character) < 32 for character in value):
            raise ValueError("invalid release identity text")
        return value

    @field_validator("version")
    @classmethod
    def validate_version(cls, value: str) -> str:
        if not _SEMANTIC_VERSION.fullmatch(value):
            raise ValueError("version must be a stable semantic version")
        return value

    @field_validator("frontendContract")
    @classmethod
    def validate_frontend_contract(cls, value: str) -> str:
        if value != "isees-web/v1":
            raise ValueError("unexpected frontend contract identity")
        return value

    @field_validator("backendContract")
    @classmethod
    def validate_backend_contract(cls, value: str) -> str:
        if value != "isees-api/v1":
            raise ValueError("unexpected backend contract identity")
        return value


class SystemIdentity(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    schemaVersion: str
    productId: str
    productName: str
    expandedName: str
    descriptor: str
    version: str
    frontendContract: str
    backendContract: str
    releaseChannel: ReleaseChannel
    runtimeEnvironment: RuntimeEnvironment
    sourceRevision: str | None
    deploymentRevision: str | None
    builtAt: str | None

    @field_validator("sourceRevision", "deploymentRevision")
    @classmethod
    def validate_revision(cls, value: str | None) -> str | None:
        if value is not None and not _SAFE_REVISION.fullmatch(value):
            raise ValueError("revision metadata must be safe single-line printable ASCII")
        return value

    @field_validator("builtAt")
    @classmethod
    def validate_built_at(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not _UTC_TIMESTAMP.fullmatch(value):
            raise ValueError("builtAt must be a valid UTC timestamp")
        try:
            datetime.fromisoformat(value[:-1] + "+00:00")
        except ValueError as error:
            raise ValueError("builtAt must be a valid UTC timestamp") from error
        return value


def load_release_manifest(path: Path = RELEASE_MANIFEST_PATH) -> ReleaseManifest:
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise RuntimeError(f"Unable to load the iSEES release manifest: {error}") from error
    try:
        return ReleaseManifest.model_validate(raw)
    except ValueError as error:
        raise RuntimeError(f"Invalid iSEES release manifest: {error}") from error


def _enum(values: Mapping[str, str], name: str, enum_type, default: str):
    raw = values.get(name, default).strip()
    try:
        return enum_type(raw)
    except ValueError as error:
        raise RuntimeError(f"{name} must be one of: {', '.join(item.value for item in enum_type)}") from error


def _revision(values: Mapping[str, str], name: str) -> str | None:
    value = values.get(name, "").strip()
    if not value:
        return None
    if not _SAFE_REVISION.fullmatch(value):
        raise RuntimeError(f"{name} must be a single-line printable ASCII value of at most 200 characters")
    return value


def _built_at(values: Mapping[str, str]) -> str | None:
    value = values.get("ISEES_BUILT_AT", "").strip()
    if not value:
        return None
    if not _UTC_TIMESTAMP.fullmatch(value):
        raise RuntimeError("ISEES_BUILT_AT must be a UTC timestamp ending in Z")
    try:
        parsed = datetime.fromisoformat(value[:-1] + "+00:00")
    except ValueError as error:
        raise RuntimeError("ISEES_BUILT_AT must be a valid UTC timestamp") from error
    if parsed.tzinfo != timezone.utc:
        raise RuntimeError("ISEES_BUILT_AT must be a valid UTC timestamp")
    return value


def system_identity(
    environment: Mapping[str, str] | None = None,
    manifest_path: Path = RELEASE_MANIFEST_PATH,
) -> SystemIdentity:
    values = os.environ if environment is None else environment
    manifest = load_release_manifest(manifest_path)
    return SystemIdentity(
        **manifest.model_dump(),
        releaseChannel=_enum(values, "ISEES_RELEASE_CHANNEL", ReleaseChannel, "LOCAL"),
        runtimeEnvironment=_enum(values, "ISEES_RUNTIME_ENVIRONMENT", RuntimeEnvironment, "LOCAL"),
        sourceRevision=_revision(values, "ISEES_SOURCE_REVISION"),
        deploymentRevision=_revision(values, "ISEES_DEPLOYMENT_REVISION"),
        builtAt=_built_at(values),
    )
