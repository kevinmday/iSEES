from __future__ import annotations

from fastapi.testclient import TestClient
import pytest

from isees_uap.api import app
from isees_uap.api.v1.studio import repository, service
from isees_uap.candidate_evidence.sqlite_repository import SQLiteCandidateEvidenceRepository
from isees_uap.studio.config import studio_database_path
from isees_uap.studio.errors import (
    AcceptanceFailure, IdempotencyConflict, InvalidClaimSourceMapping,
    InvalidLifecycleTransition, InvalidSourceSnapshot, PublicationFailure,
    RevisionConflict, UnavailableExternalAuthority, UnresolvedProjectionReadiness,
)
from isees_uap.studio.ports import AcceptanceReceipt, AccessResult, PublicationReceipt, SourceResolutionResult
from isees_uap.studio.schemas import (
    CreateCandidateKnowledgeArtifact, CreateStudioDraft, PublishStudioCandidateNode,
    StudioCommandResult, SubmitStudioForReview,
)
from isees_uap.studio.service import StudioService
from isees_uap.studio.sqlite_repository import SQLiteStudioRepository


class Access:
    def resolve_access(self, **_): return AccessResult(True)
class Sources:
    def resolve_source(self, **_): return SourceResolutionResult(True, {})
class Down:
    def publish_candidate(self, **_): raise RuntimeError("down")
    def accept_candidate(self, **_): raise RuntimeError("down")


class Good:
    def publish_candidate(self, **_):
        return PublicationReceipt("pub-1", "node-1", "2026-01-02T00:00:00Z")
    def accept_candidate(self, **_):
        return AcceptanceReceipt("accept-1", "knowledge-1", "2026-01-02T00:00:00Z")


def payload(**changes):
    value = {"investigationId": "i1", "principalId": "p1", "idempotencyKey": "create",
             "artifactId": "a1", "versionId": "v1", "authorSchemaVersion": "author/v1",
             "document": {"title": "T"}}
    value.update(changes); return value


def mutation(key, revision, **changes):
    value = {"investigationId": "i1", "principalId": "p1", "idempotencyKey": key,
             "artifactId": "a1", "expectedRevision": revision}
    value.update(changes); return value


def test_route_inventory_is_investigation_qualified():
    routes = {(route.path, method) for route in app.routes for method in getattr(route, "methods", set())}
    base = "/api/v1/investigations/{investigation_id}/studio-artifacts"
    assert {(base, "POST"), (base, "GET"), (base + "/{artifact_id}", "GET"),
        (base + "/{artifact_id}/versions", "POST"),
        (base + "/{artifact_id}/candidate", "POST"),
        (base + "/{artifact_id}/candidate/publication", "POST"),
        (base + "/{artifact_id}/review-submissions", "POST"),
        (base + "/{artifact_id}/acceptance", "POST"),
        (base + "/{artifact_id}/returns", "POST"),
        (base + "/{artifact_id}/rejections", "POST"),
        (base + "/{artifact_id}/projections/validations", "POST"),
        (base + "/{artifact_id}/projections/materializations", "POST")} <= routes


def test_import_and_configuration_lookup_do_not_create_database(tmp_path, monkeypatch):
    path = tmp_path / "not-created-by-import.db"
    monkeypatch.setenv("ISEES_STUDIO_DB_PATH", str(path))
    assert studio_database_path() == path.resolve()
    assert not path.exists()


def test_all_mutation_routes_forward_path_and_header_owned_command():
    class Spy:
        calls = []
        def __getattr__(self, name):
            def call(path_id, command):
                self.calls.append((name, path_id, command.principalId, type(command).__name__))
                return StudioCommandResult(artifactId="a1", investigationId="i1", revision=1,
                    lifecycleState="DRAFT", currentVersionId="v1")
            return call
    spy = Spy(); app.dependency_overrides[service] = lambda: spy
    client = TestClient(app); h = {"X-ISEES-Principal-Id": "p1"}; base = "/api/v1/investigations/i1/studio-artifacts/a1"
    requests = [
        ("versions", payload(idempotencyKey="save", expectedRevision=0, artifactId="a1", versionId="v2"), "save_version"),
        ("candidate", mutation("candidate", 0), "create_candidate"),
        ("candidate/publication", mutation("publish", 0, candidateArtifactId="c1"), "publish_candidate"),
        ("review-submissions", mutation("review", 0, candidateArtifactId="c1"), "submit_for_review"),
        ("acceptance", mutation("accept", 0, candidateArtifactId="c1", targetScope="ARTIFACT", reason="ok"), "accept"),
        ("returns", mutation("return", 0, candidateArtifactId="c1", targetScope="ARTIFACT", reason="fix"), "return_artifact"),
        ("rejections", mutation("reject", 0, candidateArtifactId="c1", targetScope="ARTIFACT", reason="no"), "reject"),
        ("projections/validations", mutation("validate", 0, artifactVersionId="v1", projectionFormat="PDF", validatorVersion="v1"), "validate_projection"),
        ("projections/materializations", mutation("materialize", 0, projectionId="pr1", materializerVersion="m1", outputIdentity="o1", outputLocation="object/o1", outputHash="sha256:" + "a" * 64), "record_materialized_projection"),
    ]
    try:
        for suffix, body, _ in requests:
            assert client.post(f"{base}/{suffix}", json=body, headers=h).status_code == 200
        assert [(name, path, principal) for name, path, principal, _ in spy.calls] == [
            (expected, "i1", "p1") for _, _, expected in requests]
        mismatch = client.post(base + "/candidate", json=mutation("bad", 0, principalId="other"), headers=h)
        assert mismatch.status_code == 404 and not any(call[2] == "other" for call in spy.calls)
    finally:
        app.dependency_overrides.clear()


@pytest.mark.parametrize("error,code,status", [
    (RevisionConflict("stale"), "REVISION_CONFLICT", 409),
    (IdempotencyConflict("reuse"), "IDEMPOTENCY_KEY_REUSE", 409),
    (InvalidLifecycleTransition("lifecycle"), "INVALID_LIFECYCLE_TRANSITION", 409),
    (InvalidSourceSnapshot("snapshot"), "INVALID_SOURCE_SNAPSHOT", 422),
    (InvalidClaimSourceMapping("mapping"), "INVALID_CLAIM_SOURCE_MAPPING", 422),
    (UnresolvedProjectionReadiness("unresolved"), "UNRESOLVED_PROJECTION_READINESS", 409),
    (UnavailableExternalAuthority("authority"), "EXTERNAL_AUTHORITY_UNAVAILABLE", 503),
    (PublicationFailure("publication"), "PUBLICATION_FAILURE", 503),
    (AcceptanceFailure("acceptance"), "ACCEPTANCE_FAILURE", 503),
])
def test_stable_sanitized_error_mapping(error, code, status):
    class Raising:
        def create_candidate(self, *_): raise error
    app.dependency_overrides[service] = lambda: Raising()
    try:
        response = TestClient(app).post("/api/v1/investigations/i1/studio-artifacts/a1/candidate",
            json=mutation("error", 0), headers={"X-ISEES-Principal-Id": "p1", "X-Request-Id": "request-1"})
        assert response.status_code == status
        assert response.json() == {"error": {"code": code, "message": str(error), "requestId": "request-1"}}
        assert "Traceback" not in response.text and ".db" not in response.text and "sqlite" not in response.text.lower()
    finally:
        app.dependency_overrides.clear()


def test_api_complete_lifecycle_and_projection_commands(tmp_path):
    repo = SQLiteStudioRepository(tmp_path / "lifecycle.db"); good = Good()
    app.dependency_overrides[repository] = lambda: repo
    app.dependency_overrides[service] = lambda: StudioService(repo, Access(), Sources(), good, good)
    client = TestClient(app); h = {"X-ISEES-Principal-Id": "p1"}; root = "/api/v1/investigations/i1/studio-artifacts"
    try:
        assert client.post(root, json=payload(), headers=h).status_code == 201
        save = payload(idempotencyKey="save", artifactId="a1", expectedRevision=0, versionId="v2", document={"title": "saved"})
        assert client.post(root + "/a1/versions", json=save, headers=h).json()["revision"] == 1
        assert client.post(root + "/a1/candidate", json=mutation("candidate", 1, candidateArtifactId="c1"), headers=h).status_code == 200
        assert client.post(root + "/a1/candidate/publication", json=mutation("publish", 2, candidateArtifactId="c1"), headers=h).status_code == 200
        assert client.post(root + "/a1/review-submissions", json=mutation("review", 3, candidateArtifactId="c1"), headers=h).status_code == 200
        validation = mutation("validate", 4, projectionId="pr1", artifactVersionId="v2", projectionFormat="PDF", validatorVersion="v1")
        assert client.post(root + "/a1/projections/validations", json=validation, headers=h).json()["readinessState"] == "READY"
        materialize = mutation("materialize", 5, projectionId="pr1", materializerVersion="m1", outputIdentity="o1", outputLocation="objects/o1", outputHash="sha256:" + "b" * 64)
        assert client.post(root + "/a1/projections/materializations", json=materialize, headers=h).status_code == 200
        accepted = client.post(root + "/a1/acceptance", json=mutation("accept", 6, candidateArtifactId="c1", targetScope="ARTIFACT", reason="approved"), headers=h)
        assert accepted.status_code == 200 and accepted.json()["lifecycleState"] == "ACCEPTED_KNOWLEDGE"
    finally:
        app.dependency_overrides.clear()


def test_api_create_list_load_conflicts_and_strictness(tmp_path):
    repo = SQLiteStudioRepository(tmp_path / "api.db")
    svc = StudioService(repo, Access(), Sources(), Down(), Down())
    app.dependency_overrides[repository] = lambda: repo
    app.dependency_overrides[service] = lambda: svc
    client = TestClient(app); headers = {"X-ISEES-Principal-Id": "p1"}
    try:
        assert client.post("/api/v1/investigations/i1/studio-artifacts", json=payload(), headers=headers).status_code == 201
        replay = client.post("/api/v1/investigations/i1/studio-artifacts", json=payload(), headers=headers)
        assert replay.status_code == 200 and replay.json()["replayed"]
        assert len(client.get("/api/v1/investigations/i1/studio-artifacts", headers=headers).json()["items"]) == 1
        loaded = client.get("/api/v1/investigations/i1/studio-artifacts/a1", headers=headers)
        assert loaded.status_code == 200 and loaded.json()["artifact"]["revision"] == 0
        assert loaded.json()["currentVersion"]["versionId"] == "v1"
        assert client.get("/api/v1/investigations/i1/studio-artifacts/a1",
                          headers={"X-ISEES-Principal-Id": "other"}).status_code == 404
        assert client.get("/api/v1/investigations/other/studio-artifacts/a1",
                          headers=headers).status_code == 404
        assert client.post("/api/v1/investigations/i1/studio-artifacts", json=payload(unknown=True), headers=headers).status_code == 422
        conflict = client.post("/api/v1/investigations/i1/studio-artifacts", json=payload(document={"x": 2}), headers=headers)
        assert conflict.status_code == 409 and conflict.json()["error"]["code"] == "IDEMPOTENCY_KEY_REUSE"
        assert "api.db" not in conflict.text and "Traceback" not in conflict.text
    finally:
        app.dependency_overrides.clear()


def test_production_composition_uses_canonical_investigation_authority(tmp_path, monkeypatch):
    authority_path = tmp_path / "authority.db"
    studio_path = tmp_path / "production.db"
    monkeypatch.setenv("ISEES_CANDIDATE_DB_PATH", str(authority_path))
    monkeypatch.setenv("ISEES_STUDIO_DB_PATH", str(studio_path))
    repository.cache_clear()

    # Import/configuration and adapter composition are read-only until a route
    # actually asks the STUDIO repository to perform work.
    assert not authority_path.exists()
    assert not studio_path.exists()

    authority = SQLiteCandidateEvidenceRepository(authority_path)
    authority.create(command={
        "schemaVersion": "candidate-evidence-command/v1",
        "investigationId": "i1",
        "idempotencyKey": "authority-membership",
        "submissionIdentity": "submission-1",
        "source": {"title": "Authority seed"},
    }, principal_id="p1", origin="SUBMISSION")

    client = TestClient(app)
    try:
        response = client.get("/api/v1/investigations/i1/studio-artifacts",
                              headers={"X-ISEES-Principal-Id": "p1"})
        assert response.status_code == 200
        assert response.json() == {"investigationId": "i1", "items": []}
        assert studio_path.exists()

        for investigation_id, principal_id in (("unknown", "p1"), ("i1", "other")):
            denied = client.get(f"/api/v1/investigations/{investigation_id}/studio-artifacts",
                                headers={"X-ISEES-Principal-Id": principal_id})
            assert denied.status_code == 404
            assert denied.json()["error"]["code"] == "STUDIO_ARTIFACT_NOT_FOUND"

        created = client.post("/api/v1/investigations/i1/studio-artifacts", json=payload(),
                              headers={"X-ISEES-Principal-Id": "p1"})
        assert created.status_code == 201
        repo = repository()
        assert len(repo.list(investigation_id="i1", principal_id="p1")) == 1
    finally:
        repository.cache_clear()


def test_production_composition_fails_closed_when_authority_store_is_unavailable(
        tmp_path, monkeypatch):
    authority_path = tmp_path / "missing-authority.db"
    monkeypatch.setenv("ISEES_CANDIDATE_DB_PATH", str(authority_path))
    monkeypatch.setenv("ISEES_STUDIO_DB_PATH", str(tmp_path / "studio.db"))
    repository.cache_clear()
    try:
        response = TestClient(app).get(
            "/api/v1/investigations/i1/studio-artifacts",
            headers={"X-ISEES-Principal-Id": "p1"},
        )
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "EXTERNAL_AUTHORITY_UNAVAILABLE"
        assert not authority_path.exists()
    finally:
        repository.cache_clear()


@pytest.mark.parametrize("endpoint,body,expected", [
    ("candidate/publication", mutation("publish-down", 1, candidateArtifactId="c1"), "PUBLICATION_FAILURE"),
    ("acceptance", mutation("accept-down", 3, candidateArtifactId="c1", targetScope="ARTIFACT", reason="ok"), "ACCEPTANCE_FAILURE"),
])
def test_unavailable_publication_and_acceptance_fail_closed(tmp_path, endpoint, body, expected):
    repo = SQLiteStudioRepository(tmp_path / f"{expected}.db")
    setup = StudioService(repo, Access(), Sources(), Good(), Good())
    setup.create_draft("i1", CreateStudioDraft(**payload()))
    setup.create_candidate("i1", CreateCandidateKnowledgeArtifact(
        **mutation("candidate", 0, candidateArtifactId="c1")))
    if endpoint == "acceptance":
        setup.publish_candidate("i1", PublishStudioCandidateNode(
            **mutation("publish", 1, candidateArtifactId="c1")))
        setup.submit_for_review("i1", SubmitStudioForReview(
            **mutation("review", 2, candidateArtifactId="c1")))
    before = repo.get(artifact_id="a1")
    app.dependency_overrides[service] = lambda: StudioService(repo, Access(), Sources(), Down(), Down())
    try:
        response = TestClient(app).post(
            f"/api/v1/investigations/i1/studio-artifacts/a1/{endpoint}", json=body,
            headers={"X-ISEES-Principal-Id": "p1"})
        assert response.status_code == 503 and response.json()["error"]["code"] == expected
        assert repo.get(artifact_id="a1") == before
    finally:
        app.dependency_overrides.clear()
