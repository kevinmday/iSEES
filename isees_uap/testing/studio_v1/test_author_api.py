from __future__ import annotations

from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from isees_uap.api import create_application
from isees_uap.api.v1.authentication import settings
from isees_uap.api.v1.investigations import repository as investigation_repository
from isees_uap.authentication.config import AuthenticationSettings
from isees_uap.authentication.principal import authentication_repository
from isees_uap.authentication.sqlite_repository import SQLiteAuthenticationRepository
from isees_uap.investigations.sqlite_repository import SQLiteInvestigationRepository
from isees_uap.studio.v1.hashing import canonical_sha256
from isees_uap.studio.v1.schemas import SemanticDocument
from isees_uap.testing.studio_v1.test_api_composition import enabled_config
from isees_uap.testing.studio_v1.test_persistence import make_command, second


def wire(command):
    artifact = command.artifact.model_dump(exclude={"authorPrincipalId"}, exclude_none=False)
    revision = command.revision.model_dump(exclude={"authorPrincipalId"}, exclude_none=False)
    return {
        "artifact": artifact, "revision": revision,
        "snapshots": [x.model_dump(exclude_none=True) for x in command.snapshots],
        "projections": [{
            "format": x.format, "templateProfileVersion": x.template_profile_version,
            "rendererVersion": x.renderer_version, "configurationHash": x.configuration_hash,
            **({"priorSuccessfulProjectionId": x.prior_successful_projection_id}
               if x.prior_successful_projection_id else {}),
        } for x in command.projections],
        "expectedHeadRevisionId": command.expected_head_revision_id,
        "idempotencyKey": command.idempotency_key,
    }


@pytest.fixture
def api(tmp_path):
    auth = SQLiteAuthenticationRepository(tmp_path / "auth.db")
    investigations = SQLiteInvestigationRepository(tmp_path / "investigations.db")
    application = create_application(enabled_config(tmp_path))
    application.dependency_overrides[authentication_repository] = lambda: auth
    application.dependency_overrides[settings] = lambda: AuthenticationSettings(
        database_path=auth.path, secure_cookies=False)
    application.dependency_overrides[investigation_repository] = lambda: investigations
    lifecycle = TestClient(application)
    lifecycle.__enter__()
    clients = []

    def account(name):
        client = TestClient(application)
        clients.append(client)
        response = client.post("/api/v1/auth/accounts", json={
            "email": f"{name}@example.test", "password": "correct horse battery staple"})
        assert response.status_code == 201
        return client, response.json()["researcherId"]

    try:
        yield application, investigations, account, tmp_path
    finally:
        for client in clients:
            client.close()
        lifecycle.__exit__(None, None, None)
        application.dependency_overrides.clear()


def csrf(client):
    return {"X-ISEES-CSRF": client.cookies.get("isees_csrf")}


def prepare(api, name="owner"):
    application, investigations, account, _ = api
    client, owner = account(name)
    investigations.create(investigation_id="investigation-1", owner_principal_id=owner, title="Study")
    base = "/api/v1/investigations/investigation-1/studio-v1/artifacts"
    return application, investigations, client, owner, base


def test_exact_route_surface_and_no_worker_or_publication_mutations(api):
    application, _, _, _ = api
    paths = application.openapi()["paths"]
    studio = {path: set(methods) for path, methods in paths.items() if "/studio-v1/" in path}
    assert len(studio) == 5
    assert sum(len(methods) for methods in studio.values()) == 6
    assert all(not any(word in path for word in ("claim", "complete", "fail", "retry", "publish"))
               for path in studio)


def test_anonymous_and_csrf_fail_before_lifecycle_access(api):
    application, _, _, _ = api
    with TestClient(application) as anonymous:
        url = "/api/v1/investigations/investigation-1/studio-v1/artifacts"
        assert anonymous.get(url + "/missing").status_code == 401
        assert anonymous.post(url, json={}).status_code == 401
    _, _, client, _, base = prepare(api)
    denied = client.post(base, json=wire(make_command()))
    assert denied.status_code == 403 and denied.json()["error"]["code"] == "CSRF_REJECTED"


def test_owner_create_read_list_revision_and_safe_projections(api):
    _, _, client, _, base = prepare(api)
    command = make_command()
    created = client.post(base, json=wire(command), headers=csrf(client))
    assert created.status_code == 201 and created.json()["replayed"] is False
    artifact = base + "/" + command.artifact.artifactId
    assert client.get(artifact).json()["currentRevisionId"] == command.revision.revisionId
    listing = client.get(artifact + "/revisions").json()
    assert [x["revisionNumber"] for x in listing["items"]] == [1]
    revision = client.get(artifact + "/revisions/" + command.revision.revisionId)
    assert revision.status_code == 200 and revision.json()["revision"]["contentHash"] == command.revision.contentHash
    projections = client.get(artifact + "/revisions/" + command.revision.revisionId + "/projections")
    assert projections.status_code == 200
    forbidden = ("lease", "worker", "attempt", "job")
    assert not any(term in projections.text.lower() for term in forbidden)


def test_next_revision_concurrency_replay_and_key_reuse(api):
    _, _, client, _, base = prepare(api)
    one = make_command()
    assert client.post(base, json=wire(one), headers=csrf(client)).status_code == 201
    two = second(one)
    url = base + "/" + one.artifact.artifactId + "/revisions"
    saved = client.post(url, json=wire(two), headers=csrf(client))
    assert saved.status_code == 201
    replay = client.post(url, json=wire(two), headers=csrf(client))
    assert replay.status_code == 201 and replay.json()["replayed"] is True
    changed = wire(two)
    changed["revision"]["semanticContent"]["title"] = "different"
    changed["revision"]["contentHash"] = canonical_sha256(
        SemanticDocument.model_validate(changed["revision"]["semanticContent"]).model_dump(exclude_none=True))
    reused = client.post(url, json=changed, headers=csrf(client))
    assert reused.status_code == 409, reused.text
    stale = deepcopy(changed)
    stale["idempotencyKey"] = "stale"
    stale["expectedHeadRevisionId"] = one.revision.revisionId
    assert client.post(url, json=stale, headers=csrf(client)).status_code in (409, 422)


def test_strict_identity_hash_and_unknown_fields(api):
    _, _, client, _, base = prepare(api)
    original = wire(make_command())
    cases = []
    unknown = deepcopy(original); unknown["ownerId"] = "foreign"; cases.append(unknown)
    nested = deepcopy(original); nested["artifact"]["authorPrincipalId"] = "foreign"; cases.append(nested)
    mismatch = deepcopy(original); mismatch["artifact"]["investigationId"] = "other"; cases.append(mismatch)
    bad_hash = deepcopy(original); bad_hash["revision"]["contentHash"] = "sha256:" + "0" * 64; cases.append(bad_hash)
    bad_snapshot = deepcopy(original); bad_snapshot["snapshots"][0]["snapshotHash"] = "sha256:" + "0" * 64; cases.append(bad_snapshot)
    for payload in cases:
        response = client.post(base, json=payload, headers=csrf(client))
        assert response.status_code == 422


def test_foreign_scope_and_unknown_entities_are_non_disclosing(api):
    application, investigations, owner_client, owner, base = prepare(api)
    command = make_command()
    assert owner_client.post(base, json=wire(command), headers=csrf(owner_client)).status_code == 201
    foreign, foreign_id = api[2]("foreign")
    investigations.create(investigation_id="foreign-investigation", owner_principal_id=foreign_id, title="Foreign")
    existing = foreign.get(base + "/" + command.artifact.artifactId)
    absent = foreign.get(base + "/missing")
    assert existing.status_code == absent.status_code == 404
    assert existing.json()["error"]["code"] == absent.json()["error"]["code"] == "INVESTIGATION_NOT_FOUND"
    missing_revision = owner_client.get(base + "/" + command.artifact.artifactId + "/revisions/missing")
    assert missing_revision.status_code == 404


def test_disabled_lifecycle_is_safe_after_authorization(tmp_path):
    auth = SQLiteAuthenticationRepository(tmp_path / "auth.db")
    parents = SQLiteInvestigationRepository(tmp_path / "parents.db")
    application = create_application({})
    application.dependency_overrides[authentication_repository] = lambda: auth
    application.dependency_overrides[settings] = lambda: AuthenticationSettings(database_path=auth.path, secure_cookies=False)
    application.dependency_overrides[investigation_repository] = lambda: parents
    with TestClient(application) as client:
        created = client.post("/api/v1/auth/accounts", json={"email": "a@example.test", "password": "correct horse battery staple"})
        parents.create(investigation_id="i", owner_principal_id=created.json()["researcherId"], title="I")
        response = client.get("/api/v1/investigations/i/studio-v1/artifacts/a")
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "STUDIO_V1_UNAVAILABLE"
        assert not any(term in response.text.lower() for term in ("sqlite", str(tmp_path).lower(), "traceback"))
