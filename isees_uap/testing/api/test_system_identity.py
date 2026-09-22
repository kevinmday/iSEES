import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from isees_uap.api import create_application
from isees_uap.system_identity import load_release_manifest, system_identity


def test_release_manifest_loads() -> None:
    manifest = load_release_manifest()
    assert manifest.version == "1.0.0"
    assert manifest.productName == "iSEES"


@pytest.mark.parametrize("change", [
    {"schemaVersion": "wrong/v1"},
    {"version": "1.0"},
    {"productId": "other"},
    {"unexpected": "field"},
])
def test_invalid_manifest_is_rejected(tmp_path: Path, change: dict[str, str]) -> None:
    source = json.loads(Path("release/isees-release.json").read_text(encoding="utf-8"))
    source.update(change)
    path = tmp_path / "release.json"
    path.write_text(json.dumps(source), encoding="utf-8")
    with pytest.raises(RuntimeError, match="Invalid iSEES release manifest"):
        load_release_manifest(path)


def test_manifest_missing_required_field_is_rejected(tmp_path: Path) -> None:
    source = json.loads(Path("release/isees-release.json").read_text(encoding="utf-8"))
    del source["descriptor"]
    path = tmp_path / "release.json"
    path.write_text(json.dumps(source), encoding="utf-8")
    with pytest.raises(RuntimeError, match="Invalid iSEES release manifest"):
        load_release_manifest(path)


def test_local_defaults_and_nullable_metadata() -> None:
    identity = system_identity({})
    assert identity.releaseChannel.value == "LOCAL"
    assert identity.runtimeEnvironment.value == "LOCAL"
    assert identity.sourceRevision is identity.deploymentRevision is identity.builtAt is None


def test_governed_metadata_is_distinct_and_deterministic() -> None:
    values = {
        "ISEES_RELEASE_CHANNEL": "CANDIDATE",
        "ISEES_RUNTIME_ENVIRONMENT": "HUGGING_FACE",
        "ISEES_SOURCE_REVISION": " source-abc ",
        "ISEES_DEPLOYMENT_REVISION": "deploy-xyz",
        "ISEES_BUILT_AT": "2026-09-22T12:34:56Z",
    }
    first = system_identity(values)
    second = system_identity(values)
    assert first == second
    assert first.sourceRevision == "source-abc"
    assert first.deploymentRevision == "deploy-xyz"


@pytest.mark.parametrize("values", [
    {"ISEES_RELEASE_CHANNEL": "candidate"},
    {"ISEES_RUNTIME_ENVIRONMENT": "CLOUD"},
    {"ISEES_SOURCE_REVISION": "secret\nvalue"},
    {"ISEES_DEPLOYMENT_REVISION": "x" * 201},
    {"ISEES_BUILT_AT": "2026-09-22T12:34:56-07:00"},
    {"ISEES_BUILT_AT": "not-a-time"},
])
def test_malformed_runtime_metadata_is_rejected(values: dict[str, str]) -> None:
    with pytest.raises(RuntimeError):
        system_identity(values)


def test_public_endpoint_is_complete_anonymous_redacted_and_deterministic(tmp_path: Path) -> None:
    environment = {
        "ISEES_RELEASE_CHANNEL": "PRODUCTION",
        "ISEES_RUNTIME_ENVIRONMENT": "GITHUB_SOURCE",
        "ISEES_SOURCE_REVISION": "abc123",
        "ISEES_DEPLOYMENT_REVISION": "platform456",
        "ISEES_BUILT_AT": "2026-09-22T19:00:00Z",
        "ISEES_RESEND_API_KEY": "must-not-leak",
    }
    client = TestClient(create_application(environment, tmp_path / "no-frontend"))
    first = client.get("/api/v1/system/identity")
    second = client.get("/api/v1/system/identity")
    assert first.status_code == 200
    assert first.json() == second.json()
    assert set(first.json()) == {
        "schemaVersion", "productId", "productName", "expandedName", "descriptor",
        "version", "frontendContract", "backendContract", "releaseChannel",
        "runtimeEnvironment", "sourceRevision", "deploymentRevision", "builtAt",
    }
    assert first.json()["sourceRevision"] != first.json()["deploymentRevision"]
    assert "must-not-leak" not in first.text
    assert not any(route.path == "/api/v1/system/identity" and route.dependant.dependencies
                   for route in client.app.routes)
