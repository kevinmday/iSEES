from __future__ import annotations

import hashlib
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from pypdf import PdfReader

from isees_uap.api import app
from isees_uap.api.v1.studio import repository, service
from isees_uap.studio.pdf_materializer import PdfOutputStore
from isees_uap.studio.schemas import CreateStudioDraft, RecordMaterializedProjection, ValidateStudioProjection
from isees_uap.studio.service import StudioService
from isees_uap.studio.sqlite_repository import SQLiteStudioRepository
from isees_uap.testing.studio.test_service_contract import Access, Acceptor, Publisher, Sources


def command(key: str, revision: int, **extra):
    return dict(schemaVersion="studio-command/v1", investigationId="i1", principalId="p1",
                idempotencyKey=key, artifactId="a1", expectedRevision=revision, **extra)


def setup_service(tmp_path, *, document=None, claims=None, mappings=None):
    repo = SQLiteStudioRepository(tmp_path / "studio.db")
    output = PdfOutputStore(tmp_path / "outputs")
    svc = StudioService(repo, Access(), Sources(), Publisher(), Acceptor(), pdf_output_store=output)
    document = document if document is not None else {
        "identity": {"id": "author:1", "createdAt": "2026-01-01T00:00:00Z"},
        "metadata": {"title": "Canonical Report", "author": "Researcher", "description": "", "modifiedAt": "2026-01-01T00:00:00Z", "version": 1},
        "type": "REPORT", "status": "SAVED",
        "nodes": [{"id": "h", "type": "HEADING", "level": 1, "text": "First"},
                  {"id": "p", "type": "PARAGRAPH", "text": "Second authored statement"},
                  {"id": "c", "type": "CITATION", "citation": "Archive item 7"},
                  {"id": "r", "type": "REFERENCE", "title": "Primary source", "targetId": "node:7", "source": "Archive", "corpusId": "item:7"}],
    }
    svc.create_draft("i1", CreateStudioDraft(
        investigationId="i1", principalId="p1", idempotencyKey="create", artifactId="a1",
        versionId="v1", authorSchemaVersion="computational-author-document/v1", document=document,
        claims=claims or [], claimSourceMappings=mappings or []))
    svc.validate_projection("i1", ValidateStudioProjection(**command(
        "validate", 0, projectionId="pdf:1", artifactVersionId="v1",
        projectionFormat="PDF", validatorVersion="validator/v1")))
    return svc, repo, output


def materialize(svc, key="materialize", revision=1):
    return svc.record_materialized_projection("i1", RecordMaterializedProjection(**command(
        key, revision, projectionId="pdf:1", artifactVersionId="v1")))


def test_pdf_is_deterministic_stored_hashed_and_ordered(tmp_path):
    svc, repo, output = setup_service(tmp_path)
    result = materialize(svc)
    projection = repo.get(artifact_id="a1").projections[0]
    path = output.path_for_location(projection.output_location)
    content = path.read_bytes()
    assert content.startswith(b"%PDF-")
    assert projection.materialization_state.value == "MATERIALIZED"
    assert result.materializationState == "MATERIALIZED"
    assert projection.output_hash == "sha256:" + hashlib.sha256(content).hexdigest()
    text = "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(content)).pages)
    assert "Canonical Report" in text and text.index("First") < text.index("Second authored statement") < text.index("Archive item 7")
    assert "Provenance: Archive / item:7" in text
    assert "scientifically validated" not in text.lower()
    before = tuple((p.name, p.read_bytes()) for p in path.parent.iterdir())
    replay = materialize(svc)
    assert replay.replayed and tuple((p.name, p.read_bytes()) for p in path.parent.iterdir()) == before


def test_empty_document_is_honest_valid_pdf(tmp_path):
    svc, repo, output = setup_service(tmp_path, document={"metadata": {"title": "Empty"}, "nodes": []})
    materialize(svc)
    content = output.path_for_location(repo.get(artifact_id="a1").projections[0].output_location).read_bytes()
    assert content.startswith(b"%PDF-")
    assert "contains no authored blocks" in PdfReader(BytesIO(content)).pages[0].extract_text()


def test_storage_failure_never_records_materialized_or_exposes_partial(tmp_path, monkeypatch):
    svc, repo, output = setup_service(tmp_path)
    def fail(*_): raise OSError("disk full")
    monkeypatch.setattr(output, "store", fail)
    with pytest.raises(Exception): materialize(svc)
    assert repo.get(artifact_id="a1").projections[0].materialization_state.value == "NOT_MATERIALIZED"
    assert not list((tmp_path / "outputs").rglob("*.tmp"))


def test_authorized_download_exact_bytes_and_fail_closed(tmp_path, monkeypatch):
    monkeypatch.setenv("ISEES_STUDIO_OUTPUT_ROOT", str(tmp_path / "outputs"))
    svc, repo, output = setup_service(tmp_path)
    app.dependency_overrides[repository] = lambda: repo
    app.dependency_overrides[service] = lambda: svc
    client = TestClient(app); url = "/api/v1/investigations/i1/studio-artifacts/a1/projections/pdf:1/download"
    try:
        materialization = command("materialize-api", 1, projectionId="pdf:1", artifactVersionId="v1")
        created = client.post("/api/v1/investigations/i1/studio-artifacts/a1/projections/materializations",
                              json=materialization, headers={"X-ISEES-Principal-Id": "p1"})
        assert created.status_code == 200 and created.json()["materializationState"] == "MATERIALIZED"
        replay = client.post("/api/v1/investigations/i1/studio-artifacts/a1/projections/materializations",
                             json=materialization, headers={"X-ISEES-Principal-Id": "p1"})
        assert replay.status_code == 200 and replay.json()["replayed"] is True
        canonical = client.get("/api/v1/investigations/i1/studio-artifacts/a1",
                               headers={"X-ISEES-Principal-Id": "p1"}).json()
        assert canonical["projections"][0]["materializationState"] == "MATERIALIZED"
        response = client.get(url, headers={"X-ISEES-Principal-Id": "p1"})
        projection = repo.get(artifact_id="a1").projections[0]
        assert response.status_code == 200 and response.headers["content-type"] == "application/pdf"
        assert response.content == output.path_for_location(projection.output_location).read_bytes()
        assert "sha256:" + hashlib.sha256(response.content).hexdigest() == canonical["projections"][0]["outputHash"]
        assert "outputLocation" not in client.get("/api/v1/investigations/i1/studio-artifacts/a1", headers={"X-ISEES-Principal-Id": "p1"}).text
        assert client.get(url, headers={"X-ISEES-Principal-Id": "other"}).status_code == 404
        output.path_for_location(projection.output_location).unlink()
        assert client.get(url, headers={"X-ISEES-Principal-Id": "p1"}).status_code == 404
    finally: app.dependency_overrides.clear()
