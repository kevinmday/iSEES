"""Shared persistent-path resolution and strictly read-only readiness preflight."""
from __future__ import annotations

import os
import sqlite3
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Mapping
from urllib.parse import quote


PERSISTENT_ROOT_ENV = "ISEES_PERSISTENT_ROOT"


def persistent_root(values: Mapping[str, str] | None = None) -> Path | None:
    environment = os.environ if values is None else values
    raw = environment.get(PERSISTENT_ROOT_ENV)
    return Path(raw).expanduser().resolve() if raw and raw.strip() else None


def database_path(variable: str, filename: str, local_default: str,
                  values: Mapping[str, str] | None = None) -> Path:
    environment = os.environ if values is None else values
    override = environment.get(variable)
    if override and override.strip():
        return Path(override).expanduser().resolve()
    root = persistent_root(environment)
    if root is not None:
        result = (root / "databases" / filename).resolve()
        if root != result and root not in result.parents:
            raise RuntimeError("Derived persistent path escapes its configured root")
        return result
    return Path(local_default).expanduser().resolve()


def output_path(variable: str, local_default: str,
                values: Mapping[str, str] | None = None) -> Path:
    environment = os.environ if values is None else values
    override = environment.get(variable)
    if override and override.strip():
        return Path(override).expanduser().resolve()
    root = persistent_root(environment)
    if root is not None:
        result = (root / "studio-outputs").resolve()
        if root != result and root not in result.parents:
            raise RuntimeError("Derived persistent path escapes its configured root")
        return result
    return Path(local_default).expanduser().resolve()


class PreflightClassification(str, Enum):
    ABSENT = "ABSENT"
    EMPTY = "EMPTY"
    COMPATIBLE = "COMPATIBLE"
    MIGRATION_REQUIRED = "MIGRATION_REQUIRED"
    INCOMPATIBLE = "INCOMPATIBLE"
    UNAVAILABLE = "UNAVAILABLE"


@dataclass(frozen=True)
class StoreSpec:
    name: str
    path: Path
    schema_table: str
    expected_version: int | None
    required_table: str | None = None
    schema_name: str | None = None


def _read_only_connection(path: Path) -> sqlite3.Connection:
    # mode=ro prevents database creation; query_only prevents accidental writes.
    uri = f"file:{quote(path.as_posix(), safe='/:')}?mode=ro"
    connection = sqlite3.connect(uri, uri=True, timeout=1, isolation_level=None)
    connection.execute("PRAGMA query_only=ON")
    return connection


def inspect_store(spec: StoreSpec) -> PreflightClassification:
    try:
        if not spec.path.exists():
            return PreflightClassification.ABSENT
        if not spec.path.is_file():
            return PreflightClassification.UNAVAILABLE
        if spec.path.stat().st_size == 0:
            return PreflightClassification.EMPTY
        with _read_only_connection(spec.path) as connection:
            tables = {row[0] for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            )}
            if not tables:
                return PreflightClassification.EMPTY
            if spec.expected_version is None:
                return (PreflightClassification.COMPATIBLE
                        if spec.required_table in tables else PreflightClassification.INCOMPATIBLE)
            if spec.schema_table not in tables:
                return PreflightClassification.INCOMPATIBLE
            if spec.schema_name is None:
                rows = connection.execute(
                    f'SELECT version FROM "{spec.schema_table}" ORDER BY version'
                ).fetchall()
                versions = [row[0] for row in rows]
            else:
                row = connection.execute(
                    f'SELECT schema_version FROM "{spec.schema_table}" WHERE schema_name=?',
                    (spec.schema_name,),
                ).fetchone()
                versions = [] if row is None else [row[0]]
            if not versions or any(type(version) is not int or version < 1 for version in versions):
                return PreflightClassification.INCOMPATIBLE
            highest = max(versions)
            if highest > spec.expected_version:
                return PreflightClassification.INCOMPATIBLE
            if highest < spec.expected_version:
                return PreflightClassification.MIGRATION_REQUIRED
            if spec.schema_name is None and set(versions) != set(range(1, spec.expected_version + 1)):
                return PreflightClassification.INCOMPATIBLE
            return PreflightClassification.COMPATIBLE
    except (OSError, sqlite3.Error):
        return PreflightClassification.UNAVAILABLE


def inspect_output_root(path: Path) -> PreflightClassification:
    try:
        if not path.exists():
            return PreflightClassification.ABSENT
        if not path.is_dir():
            return PreflightClassification.INCOMPATIBLE
        # access() is non-mutating and avoids probe files.
        return (PreflightClassification.COMPATIBLE if os.access(path, os.R_OK | os.W_OK | os.X_OK)
                else PreflightClassification.UNAVAILABLE)
    except OSError:
        return PreflightClassification.UNAVAILABLE


def readiness_report(*, studio_v1_enabled: bool, studio_v1_path: Path | None,
                     output_root: Path) -> tuple[bool, dict[str, str]]:
    from isees_uap.authentication.config import authentication_settings
    from isees_uap.authentication.sqlite_repository import SCHEMA_VERSION as AUTH_VERSION
    from isees_uap.candidate_evidence.config import candidate_database_path
    from isees_uap.candidate_evidence.sqlite_repository import SCHEMA_VERSION as CANDIDATE_VERSION
    from isees_uap.investigations.config import investigation_database_path
    from isees_uap.investigations.sqlite_repository import SCHEMA_VERSION as INVESTIGATION_VERSION
    from isees_uap.research_sources.config import research_source_database_path
    from isees_uap.studio.config import studio_database_path
    from isees_uap.studio.sqlite_repository import SCHEMA_VERSION as STUDIO_VERSION

    specs = [
        StoreSpec("authentication", authentication_settings().database_path,
                  "authentication_schema_migrations", AUTH_VERSION),
        StoreSpec("investigations", investigation_database_path(),
                  "investigation_schema_migrations", INVESTIGATION_VERSION),
        StoreSpec("candidate_evidence", candidate_database_path(), "schema_migrations", CANDIDATE_VERSION),
        StoreSpec("research_sources", research_source_database_path(), "", None,
                  required_table="research_graph_source"),
        StoreSpec("studio", studio_database_path(), "studio_schema_migrations", STUDIO_VERSION),
    ]
    if studio_v1_enabled and studio_v1_path is not None:
        specs.append(StoreSpec("studio_v1", studio_v1_path, "studio_v1_schema_identity", 1,
                               schema_name="STUDIO_V1"))
    results = {spec.name: inspect_store(spec).value for spec in specs}
    results["studio_outputs"] = inspect_output_root(output_root).value
    acceptable = {PreflightClassification.ABSENT.value, PreflightClassification.COMPATIBLE.value}
    return all(value in acceptable for value in results.values()), results
