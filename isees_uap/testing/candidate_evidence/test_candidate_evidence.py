from __future__ import annotations

import sqlite3
import hashlib
import json
from pathlib import Path
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from isees_uap.api import app
from isees_uap.api.v1.candidate_evidence import blob_repository, repository
from isees_uap.candidate_evidence.blob_storage import LocalContentAddressedBlobStore
from isees_uap.candidate_evidence.errors import IdempotencyConflict, OriginConflict, ProhibitedTransition, RevisionConflict
from isees_uap.candidate_evidence.sqlite_repository import SQLiteCandidateEvidenceRepository
from isees_uap.testing.authenticated_route_support import authenticated_route_session


def submission(investigation="investigation-a", key="create-1", identity="submission-1"):
    return {
        "schemaVersion": "candidate-evidence-command/v1",
        "investigationId": investigation,
        "submissionIdentity": identity,
        "source": {"title": "Declared metadata only"},
        "idempotencyKey": key,
    }


def discovery(investigation="investigation-a"):
    return {
        "schemaVersion": "candidate-evidence-command/v1", "investigationId": investigation,
        "source": {"citation": "Provider-declared citation"}, "idempotencyKey": "discovery-1",
        "connector": "LOCAL_FIXTURE", "connectorVersion": "1", "providerResultId": "result-1",
        "querySpecification": {
            "schemaVersion": "candidate-evidence-query/v1", "investigationId": investigation,
            "targetConnector": "LOCAL_FIXTURE", "query": "event:\"x\"", "clauses": [],
            "lineage": {"investigationId": investigation},
        },
    }


def intake(pathway="DIRECT_URL", key="intake-1", operation="operation-1",
           investigation="investigation-a", revision=0):
    value = {
        "schemaVersion": "candidate-evidence-intake/v1", "investigationId": investigation,
        "expectedInvestigationRevision": revision, "manifoldRevisionId": f"investigation-aggregate:{revision}",
        "pathway": pathway, "operationId": operation, "idempotencyKey": key,
        "title": "Research lead",
    }
    if pathway == "RESEARCHER_NOTE":
        value["noteText"] = "Researcher-authored observation."
    else:
        value["submittedUrl"] = "HTTPS://Example.COM:443/a/../source?q=1#fragment"
    return value


def curated(investigation="investigation-a", key="curated-1", repository="SYSTEM_CANON",
            artifact="artifact-1", version=None):
    return {
        "schemaVersion": "candidate-evidence-command/v1", "investigationId": investigation,
        "source": {}, "idempotencyKey": key,
        "repositoryReference": {
            "repositoryIdentity": repository, "artifactIdentity": artifact,
            "artifactVersion": version, "contentHash": None, "sourceLocator": None,
        },
        "provenance": None, "custody": None, "availability": "UNKNOWN",
    }


@pytest.fixture
def repo(tmp_path):
    return SQLiteCandidateEvidenceRepository(tmp_path / "candidate.sqlite3")


@pytest.fixture
def blob_store(tmp_path):
    return LocalContentAddressedBlobStore(tmp_path / "candidate-blobs")


@pytest.fixture
def route_session(repo, blob_store, tmp_path):
    app.dependency_overrides[repository] = lambda: repo
    app.dependency_overrides[blob_repository] = lambda: blob_store
    try:
        with authenticated_route_session(
            tmp_path / "route", investigation_ids=("investigation-a", "investigation-b")
        ) as session:
            yield session
    finally:
        app.dependency_overrides.pop(repository, None)
        app.dependency_overrides.pop(blob_repository, None)


def headers(route_session, principal=None):
    value = route_session.csrf_headers
    if principal is not None:
        value["X-ISEES-Principal-Id"] = principal
    return value


def upload_data(key="upload-1", operation="upload-operation", investigation="investigation-a", revision=0,
                **changes):
    value = {
        "schemaVersion": "candidate-evidence-upload/v1", "investigationId": investigation,
        "expectedInvestigationRevision": str(revision),
        "manifoldRevisionId": f"investigation-aggregate:{revision}",
        "operationId": operation, "idempotencyKey": key, "title": "Field recording",
        "noteText": "Researcher context only.",
    }
    value.update(changes)
    return value


def upload(client, route_session, *, content=b"%PDF-1.4\npassive evidence\n%%EOF\n",
           filename="evidence.pdf", media_type="application/pdf", data=None):
    return client.post(
        "/api/v1/investigations/investigation-a/candidate-evidence/direct-uploads",
        data=data or upload_data(), files={"file": (filename, content, media_type)},
        headers=headers(route_session),
    )


def test_persistence_restoration_unknown_and_idempotency(repo, tmp_path):
    created, replayed = repo.create(command=submission(), principal_id="p", origin="SUBMISSION")
    assert not replayed
    assert created["availability"] == "UNKNOWN"
    restored = SQLiteCandidateEvidenceRepository(tmp_path / "candidate.sqlite3")
    actual = restored.get(investigation_id="investigation-a", candidate_id=created["candidateId"], principal_id="p")
    assert actual == created
    same, replayed = restored.create(command=submission(), principal_id="p", origin="SUBMISSION")
    assert replayed and same == created
    with pytest.raises(IdempotencyConflict):
        restored.create(command=submission(identity="different"), principal_id="p", origin="SUBMISSION")
    deterministic, replayed = restored.create(command=submission(key="new-key"), principal_id="p", origin="SUBMISSION")
    assert replayed and deterministic["candidateId"] == created["candidateId"]
    with pytest.raises(OriginConflict):
        restored.create(command={**submission(key="third"), "source": {"title": "changed"}}, principal_id="p", origin="SUBMISSION")


def test_api_composition_creation_isolation_and_identity(route_session):
    client = route_session.client
    assert client.get("/").status_code == 200
    assert client.post("/api/v1/investigations/investigation-a/candidate-evidence/submissions", json=submission()).status_code == 403
    blank_investigation = submission(investigation="   ")
    assert client.post("/api/v1/investigations/investigation-a/candidate-evidence/submissions", json=blank_investigation, headers=headers(route_session)).status_code == 422
    created = client.post("/api/v1/investigations/investigation-a/candidate-evidence/submissions", json=submission(), headers=headers(route_session))
    assert created.status_code == 201
    candidate = created.json()
    assert candidate["lifecycleState"] == "SUBMITTED"
    discovered = client.post("/api/v1/investigations/investigation-a/candidate-evidence/discovery-results", json=discovery(), headers=headers(route_session))
    assert discovered.status_code == 201 and discovered.json()["origin"] == "DISCOVERY"
    assert discovered.json()["lifecycleState"] == "DISCOVERED"
    curated_response = client.post(
        "/api/v1/investigations/investigation-a/candidate-evidence/curated-repository-references",
        json=curated(), headers=headers(route_session),
    )
    assert curated_response.status_code == 201
    curated_candidate = curated_response.json()
    assert curated_candidate["origin"] == "CURATED_REPOSITORY"
    assert curated_candidate["lifecycleState"] == "REFERENCED"
    listed = client.get("/api/v1/investigations/investigation-a/candidate-evidence").json()
    assert {item["candidateId"] for item in listed["items"]} == {
        candidate["candidateId"], discovered.json()["candidateId"], curated_candidate["candidateId"]
    }
    assert client.get("/api/v1/investigations/investigation-b/candidate-evidence").json()["items"] == []
    invalid_cursor = client.get(
        "/api/v1/investigations/investigation-a/candidate-evidence?cursor=invalid"
    )
    assert invalid_cursor.status_code == 400
    assert invalid_cursor.json()["error"]["code"] == "INVALID_CURSOR"
    assert client.get(f"/api/v1/investigations/investigation-b/candidate-evidence/{candidate['candidateId']}").status_code == 404
    cross_transition = {
        "schemaVersion": "candidate-evidence-command/v1", "investigationId": "investigation-b",
        "expectedRevision": 0, "to": "REFERENCED", "idempotencyKey": "cross-investigation",
    }
    assert client.post(
        f"/api/v1/investigations/investigation-b/candidate-evidence/{candidate['candidateId']}/lifecycle-transitions",
        json=cross_transition, headers=headers(route_session),
    ).status_code == 404
    unchanged = client.get(
        f"/api/v1/investigations/investigation-a/candidate-evidence/{candidate['candidateId']}"
    ).json()
    assert unchanged["revision"] == 0 and unchanged["lifecycleState"] == "SUBMITTED"
    assert client.get(f"/api/v1/investigations/investigation-a/candidate-evidence/{candidate['candidateId']}", headers=headers(route_session, "another-owner")).status_code == 200
    mismatch = client.post("/api/v1/investigations/investigation-b/candidate-evidence/submissions", json=submission(), headers=headers(route_session))
    assert mismatch.status_code == 412 and mismatch.json()["error"]["code"] == "INVESTIGATION_MISMATCH"


def test_lifecycle_revision_review_and_replay(route_session):
    client = route_session.client
    h = headers(route_session)
    candidate = client.post("/api/v1/investigations/investigation-a/candidate-evidence/submissions", json=submission(), headers=h).json()
    url = f"/api/v1/investigations/investigation-a/candidate-evidence/{candidate['candidateId']}/lifecycle-transitions"
    def command(revision, target, key, decision=None):
        value = {"schemaVersion": "candidate-evidence-command/v1", "investigationId": "investigation-a",
                 "expectedRevision": revision, "to": target, "idempotencyKey": key}
        if decision:
            value["reviewDecision"] = decision
        return value
    referenced = client.post(url, json=command(0, "REFERENCED", "t1"), headers=h)
    assert referenced.status_code == 200 and referenced.json()["revision"] == 1
    assert client.post(url, json=command(0, "IN_REVIEW", "stale"), headers=h).status_code == 409
    reviewed = client.post(url, json=command(1, "IN_REVIEW", "t2"), headers=h)
    assert reviewed.status_code == 200
    excluded_command = command(2, "EXCLUDED", "t3", {"decision": "EXCLUDED", "reason": "Human decision"})
    excluded = client.post(url, json=excluded_command, headers=h)
    assert excluded.status_code == 200 and excluded.json()["reviewDecision"]["reviewerId"] == route_session.account_id
    replay = client.post(url, json=excluded_command, headers=h)
    assert replay.status_code == 200 and replay.json() == excluded.json()
    admitted = {**command(3, "EXCLUDED", "bad"), "to": "ADMITTED"}
    assert client.post(url, json=admitted, headers=h).status_code == 422


def test_database_constraints_and_wal(repo):
    with sqlite3.connect(repo.path) as connection:
        assert connection.execute("PRAGMA journal_mode").fetchone()[0].lower() == "wal"
        assert [row[0] for row in connection.execute("SELECT version FROM schema_migrations ORDER BY version")] == [1, 2, 3, 4, 5]
        tables = {row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        assert {"candidate_evidence", "candidate_query_specification", "candidate_provenance_event", "candidate_idempotency"} <= tables


def test_discovery_result_identity_is_unambiguous(repo):
    first = discovery()
    first.update({"connector": "a:b", "providerResultId": "c", "idempotencyKey": "first"})
    second = discovery()
    second.update({"connector": "a", "providerResultId": "b:c", "idempotencyKey": "second"})
    created_first, _ = repo.create(command=first, principal_id="p", origin="DISCOVERY")
    created_second, _ = repo.create(command=second, principal_id="p", origin="DISCOVERY")
    assert created_first["candidateId"] != created_second["candidateId"]
    assert created_first["originIdentity"] != created_second["originIdentity"]


def test_curated_reference_identity_ownership_unknowns_and_conflicts(repo):
    created, replayed = repo.create(command=curated(), principal_id="p", origin="CURATED_REPOSITORY")
    assert not replayed
    assert created["lifecycleState"] == "REFERENCED"
    assert created["availability"] == "UNKNOWN"
    reference = created["lineage"]["repositoryReference"]
    assert reference == {
        "repositoryIdentity": "SYSTEM_CANON", "artifactIdentity": "artifact-1",
        "artifactVersion": None, "contentHash": None, "sourceLocator": None,
    }
    assert created["lineage"]["provenance"] is None
    assert created["lineage"]["custody"] is None
    assert created["lineage"]["ownership"] == "CURATED_REPOSITORY"
    assert "admittedArtifactId" not in created and "admissionReceiptIdentity" not in created

    same, replayed = repo.create(command=curated(), principal_id="p", origin="CURATED_REPOSITORY")
    assert replayed and same == created
    equivalent, replayed = repo.create(command=curated(key="curated-2"), principal_id="p", origin="CURATED_REPOSITORY")
    assert replayed and equivalent["originIdentity"] == created["originIdentity"]
    with pytest.raises(IdempotencyConflict):
        repo.create(command=curated(key="curated-1", artifact="other"), principal_id="p", origin="CURATED_REPOSITORY")
    changed = curated(key="curated-3")
    changed["availability"] = "AVAILABLE"
    with pytest.raises(OriginConflict):
        repo.create(command=changed, principal_id="p", origin="CURATED_REPOSITORY")

    other_version, _ = repo.create(command=curated(key="v2", version="2"), principal_id="p", origin="CURATED_REPOSITORY")
    assert other_version["originIdentity"] != created["originIdentity"]
    other_principal, replayed = repo.create(
        command=curated(key="curated-1"), principal_id="other-principal", origin="CURATED_REPOSITORY"
    )
    assert not replayed and other_principal["candidateId"] != created["candidateId"]
    assert repo.get(
        investigation_id="investigation-a", candidate_id=other_principal["candidateId"], principal_id="p"
    ) is None


def test_curated_api_strictness_association_and_isolation(route_session):
    client = route_session.client
    h = headers(route_session)
    url = "/api/v1/investigations/investigation-a/candidate-evidence/curated-repository-references"
    missing_required_unknown = curated()
    del missing_required_unknown["provenance"]
    assert client.post(url, json=missing_required_unknown, headers=h).status_code == 422
    invalid_association = curated(key="bad-association")
    invalid_association["association"] = {
        "kind": "NODE", "canonicalIdentity": "node-1", "basis": "INFERRED_SIMILARITY"
    }
    assert client.post(url, json=invalid_association, headers=h).status_code == 422

    associated = curated(key="associated", artifact="associated-artifact")
    associated["association"] = {
        "kind": "INVESTIGATION", "canonicalIdentity": "investigation-a", "basis": "EXACT_CANONICAL_ID"
    }
    response = client.post(url, json=associated, headers=h)
    assert response.status_code == 201 and response.json()["association"] == associated["association"]
    candidate_id = response.json()["candidateId"]
    assert client.get(
        f"/api/v1/investigations/investigation-b/candidate-evidence/{candidate_id}"
    ).status_code == 404
    assert client.get(
        f"/api/v1/investigations/investigation-a/candidate-evidence/{candidate_id}", headers={"X-ISEES-Principal-Id": "other"}
    ).status_code == 200
    transition_url = (
        f"/api/v1/investigations/investigation-a/candidate-evidence/{candidate_id}/lifecycle-transitions"
    )
    direct_admission = {
        "schemaVersion": "candidate-evidence-command/v1", "investigationId": "investigation-a",
        "expectedRevision": 0, "to": "ADMITTED", "idempotencyKey": "admit-curated",
    }
    assert client.post(transition_url, json=direct_admission, headers=h).status_code == 422


def test_migrates_existing_version_one_database_without_data_loss(tmp_path):
    path = tmp_path / "v1.sqlite3"
    with sqlite3.connect(path) as connection:
        connection.executescript(
            "CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);"
            "INSERT INTO schema_migrations VALUES (1, 'then');" +
            Path("isees_uap/candidate_evidence/migrations/001_candidate_evidence.sql").read_text(encoding="utf-8")
        )
        connection.execute(
            "INSERT INTO candidate_evidence "
            "(candidate_id,investigation_id,revision,origin,origin_identity,lineage_json,source_json,"
            "lifecycle_state,created_at,updated_at,created_by_principal_id,create_fingerprint) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            ("legacy-candidate", "legacy-investigation", 0, "SUBMISSION", "legacy-submission",
             '{"kind":"SUBMISSION"}', '{}', "SUBMITTED", "then", "then", "legacy-principal", "fingerprint"),
        )
    version_one = SQLiteCandidateEvidenceRepository(path)
    with sqlite3.connect(path) as connection:
        assert [row[0] for row in connection.execute("SELECT version FROM schema_migrations ORDER BY version")] == [1, 2, 3, 4, 5]
        assert connection.execute("PRAGMA foreign_key_check").fetchall() == []
        assert connection.execute(
            "SELECT origin,lifecycle_state FROM candidate_evidence WHERE candidate_id='legacy-candidate'"
        ).fetchone() == ("SUBMISSION", "SUBMITTED")
    created, _ = version_one.create(command=curated(), principal_id="p", origin="CURATED_REPOSITORY")
    assert created["origin"] == "CURATED_REPOSITORY"


def test_migrates_i2_database_preserving_candidate_kinds_and_truthful_revision_identity(tmp_path):
    path = tmp_path / "i2.sqlite3"
    with sqlite3.connect(path) as connection:
        connection.execute(
            "CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)"
        )
        for version in range(1, 5):
            sql = Path(
                f"isees_uap/candidate_evidence/migrations/{version:03d}_candidate_evidence.sql"
            ).read_text(encoding="utf-8")
            if version == 2:
                connection.execute("PRAGMA foreign_keys=OFF")
            connection.executescript(sql)
            connection.execute("INSERT INTO schema_migrations VALUES (?, 'before-i3')", (version,))
            if version == 2:
                connection.execute("PRAGMA foreign_keys=ON")
        rows = [
            ("url-candidate", "SUBMISSION", "url-origin", "DIRECT_URL", "investigation-aggregate:7"),
            ("note-candidate", "SUBMISSION", "note-origin", "RESEARCHER_NOTE", "investigation-aggregate:7"),
            ("web-candidate", "DISCOVERY", "web-origin", "WEB_DISCOVERY", "investigation-aggregate:7"),
            ("legacy-candidate", "SUBMISSION", "legacy-origin", "LEGACY", None),
        ]
        for candidate_id, origin, origin_identity, pathway, manifold_revision_id in rows:
            connection.execute(
                "INSERT INTO candidate_evidence "
                "(candidate_id,investigation_id,revision,origin,origin_identity,lineage_json,source_json,"
                "lifecycle_state,created_at,updated_at,created_by_principal_id,create_fingerprint,"
                "manifold_revision_id,intake_pathway) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (candidate_id, "investigation-a", 0, origin, origin_identity,
                 '{\"kind\":\"SUBMISSION\"}', '{}',
                 "DISCOVERED" if origin == "DISCOVERY" else "SUBMITTED",
                 "then", "then", "principal", f"fingerprint-{candidate_id}",
                 manifold_revision_id, pathway),
            )

    upgraded = SQLiteCandidateEvidenceRepository(path)
    listed, cursor = upgraded.list(
        investigation_id="investigation-a", principal_id="principal", limit=100, cursor=None
    )
    assert cursor is None
    assert {candidate["candidateId"] for candidate in listed} == {
        "url-candidate", "note-candidate", "web-candidate", "legacy-candidate"
    }
    by_id = {candidate["candidateId"]: candidate for candidate in listed}
    for candidate_id in ("url-candidate", "note-candidate", "web-candidate"):
        assert by_id[candidate_id]["manifoldRevisionId"] == "investigation-aggregate:7"
        assert by_id[candidate_id]["investigationAggregateRevision"] == 7
    assert by_id["legacy-candidate"]["manifoldRevisionId"] is None
    assert by_id["legacy-candidate"]["investigationAggregateRevision"] is None
    with sqlite3.connect(path) as connection:
        assert connection.execute("SELECT count(*) FROM candidate_evidence").fetchone()[0] == 4
        assert [row[0] for row in connection.execute(
            "SELECT version FROM schema_migrations ORDER BY version"
        )] == [1, 2, 3, 4, 5]

    reopened = SQLiteCandidateEvidenceRepository(path)
    assert reopened.get(
        investigation_id="investigation-a", candidate_id="url-candidate", principal_id="principal"
    )["investigationAggregateRevision"] == 7


def test_researcher_url_note_and_web_discovery_intake_foundation(route_session, tmp_path):
    client, h = route_session.client, headers(route_session)
    endpoint = "/api/v1/investigations/investigation-a/candidate-evidence/researcher-intake"
    with sqlite3.connect(route_session.investigations.path) as db:
        aggregate_before = db.execute(
            "SELECT revision,payload_json FROM investigation_aggregate WHERE investigation_id=?",
            ("investigation-a",)).fetchone()

    url_response = client.post(endpoint, json=intake(), headers=h)
    assert url_response.status_code == 201, url_response.text
    url_candidate = url_response.json()
    assert url_candidate["origin"] == "SUBMISSION"
    assert url_candidate["intakePathway"] == "DIRECT_URL"
    assert url_candidate["source"]["originalLocator"].endswith("#fragment")
    assert url_candidate["source"]["normalizedUrl"] == "https://example.com/a/../source?q=1"
    assert url_candidate["manifoldRevisionId"] == "investigation-aggregate:0"
    assert url_candidate["lifecycleState"] == "SUBMITTED"
    assert url_candidate["acquisitionState"] == "NOT_REQUESTED"
    assert url_candidate["publicationState"] == "NOT_REQUESTED"
    assert url_candidate["lineage"]["intakeProvenance"]["zeroExternalFetch"] is True

    note_response = client.post(endpoint, json=intake("RESEARCHER_NOTE", "note-1", "note-operation"), headers=h)
    assert note_response.status_code == 201
    note = note_response.json()
    assert note["origin"] == "SUBMISSION" and note["intakePathway"] == "RESEARCHER_NOTE"
    assert note["lineage"]["intakeProvenance"]["researcherAuthored"] is True
    assert note["lineage"]["intakeProvenance"]["noteText"] == "Researcher-authored observation."

    web_response = client.post(endpoint, json=intake("WEB_DISCOVERY", "web-1", "web-operation"), headers=h)
    assert web_response.status_code == 201
    web = web_response.json()
    assert web["origin"] == "DISCOVERY" and web["intakePathway"] == "WEB_DISCOVERY"
    assert web["lifecycleState"] == "DISCOVERED"
    assert web["lineage"]["connector"] == "LOCAL_FIXTURE"
    assert web["lineage"]["querySpecification"]["lineage"]["zeroLiveProvider"] is True

    replay = client.post(endpoint, json=intake(), headers=h)
    assert replay.status_code == 200 and replay.json() == url_candidate
    stale = intake(key="stale", operation="stale-operation", revision=9)
    assert client.post(endpoint, json=stale, headers=h).status_code == 409
    mismatched_revision = intake(key="wrong-revision", operation="wrong-revision")
    mismatched_revision["manifoldRevisionId"] = "investigation-aggregate:99"
    assert client.post(endpoint, json=mismatched_revision, headers=h).status_code == 409
    for invalid in ("file:///tmp/a", "javascript:alert(1)", "data:text/plain,x",
                    "https://user:secret@example.com/a", "not a url"):
        request = intake(key=f"invalid-{len(invalid)}", operation=f"invalid-{len(invalid)}")
        request["submittedUrl"] = invalid
        assert client.post(endpoint, json=request, headers=h).status_code == 422

    restored = SQLiteCandidateEvidenceRepository(tmp_path / "candidate.sqlite3")
    assert restored.get(investigation_id="investigation-a", candidate_id=url_candidate["candidateId"],
                        principal_id=route_session.account_id) == url_candidate
    with sqlite3.connect(route_session.investigations.path) as db:
        assert db.execute("SELECT revision,payload_json FROM investigation_aggregate WHERE investigation_id=?",
                          ("investigation-a",)).fetchone() == aggregate_before


def test_authenticated_direct_upload_is_review_only_and_durable(route_session, repo, blob_store, tmp_path):
    client = route_session.client
    endpoint = "/api/v1/investigations/investigation-a/candidate-evidence/direct-uploads"
    before_candidates = client.get("/api/v1/investigations/investigation-a/candidate-evidence").json()["items"]
    with sqlite3.connect(route_session.investigations.path) as db:
        aggregate_before = db.execute(
            "SELECT revision,payload_json FROM investigation_aggregate WHERE investigation_id='investigation-a'"
        ).fetchone()
    payload = b"%PDF-1.4\nunique governed bytes 57\n%%EOF\n"
    assert client.post(endpoint, data=upload_data(),
                       files={"file": ("../../field evidence.pdf", payload, "application/pdf")}).status_code == 403
    response = upload(client, route_session, content=payload, filename="../../field evidence.pdf")
    assert response.status_code == 201, response.text
    candidate = response.json()
    after_candidates = client.get("/api/v1/investigations/investigation-a/candidate-evidence").json()["items"]
    assert len(after_candidates) == len(before_candidates) + 1
    assert candidate["origin"] == "SUBMISSION" and candidate["intakePathway"] == "DIRECT_UPLOAD"
    assert candidate["lifecycleState"] == "SUBMITTED" and candidate["acquisitionState"] == "ACQUIRED"
    assert candidate["publicationState"] == "NOT_REQUESTED" and candidate["admitted"] is False
    assert candidate["canonicalMaterialization"] is None
    assert candidate["graphEffect"] == "NONE" and candidate["researchInboxEffect"] == "NONE"
    assert candidate["principalOwnership"] == route_session.account_id
    assert candidate["investigationId"] == "investigation-a"
    assert candidate["investigationAggregateRevision"] == 0
    assert candidate["manifoldRevisionId"] == "investigation-aggregate:0"
    assert candidate["upload"]["originalFilename"] == "../../field evidence.pdf"
    assert candidate["upload"]["displayFilename"] == "field evidence.pdf"
    assert candidate["upload"]["byteSize"] == len(payload)
    assert candidate["upload"]["detectedMediaType"] == "application/pdf"
    assert candidate["upload"]["contentHash"] == {
        "algorithm": "SHA-256", "digest": hashlib.sha256(payload).hexdigest()}
    UUID(candidate["upload"]["storageIdentity"])
    serialized = json.dumps(candidate)
    assert str(blob_store.root) not in serialized and str(tmp_path) not in serialized
    with sqlite3.connect(repo.path) as db:
        row = db.execute(
            "SELECT object_reference,content_sha256 FROM candidate_evidence WHERE candidate_id=?",
            (candidate["candidateId"],)).fetchone()
        assert row[0].startswith("candidate-content:") and row[1] == hashlib.sha256(payload).hexdigest()
    assert payload not in repo.path.read_bytes()
    assert blob_store.exists(row[0]) and blob_store.get(row[0]).read() == payload
    restored = SQLiteCandidateEvidenceRepository(repo.path)
    assert restored.get(investigation_id="investigation-a", candidate_id=candidate["candidateId"],
                        principal_id=route_session.account_id) == candidate
    reconstructed_blobs = LocalContentAddressedBlobStore(blob_store.root)
    assert reconstructed_blobs.stat(row[0]) == (len(payload), hashlib.sha256(payload).hexdigest())
    with sqlite3.connect(route_session.investigations.path) as db:
        assert db.execute(
            "SELECT revision,payload_json FROM investigation_aggregate WHERE investigation_id='investigation-a'"
        ).fetchone() == aggregate_before


def test_direct_upload_rejects_empty_oversized_unsupported_and_spoofed_content(
        route_session, monkeypatch):
    client = route_session.client
    assert upload(client, route_session, content=b"").status_code == 422
    monkeypatch.setenv("ISEES_CANDIDATE_MAX_UPLOAD_BYTES", "8")
    assert upload(client, route_session, content=b"%PDF-1.4\nlarge", data=upload_data(
        key="oversized", operation="oversized")).status_code == 413
    monkeypatch.delenv("ISEES_CANDIDATE_MAX_UPLOAD_BYTES")
    cases = [
        (b"MZ\x90\x00executable", "malware.exe", "application/octet-stream"),
        (b"<html><script>alert(1)</script></html>", "page.html", "text/html"),
        (b"<script>alert(1)</script>", "page.txt", "text/plain"),
        (b"ambiguous\x00binary", "unknown.bin", "application/octet-stream"),
        (b"plain text only", "spoof.pdf", "application/pdf"),
        (b"%PDF-1.4\ncontent", "spoof.txt", "text/plain"),
        (b"%PDF-1.4\ncontent", "evidence.pdf", "text/plain"),
    ]
    for index, (content, filename, media_type) in enumerate(cases):
        response = upload(client, route_session, content=content, filename=filename,
                          media_type=media_type, data=upload_data(
                              key=f"rejected-{index}", operation=f"rejected-{index}"))
        assert response.status_code == 422, (filename, response.text)
    missing = client.post(
        "/api/v1/investigations/investigation-a/candidate-evidence/direct-uploads",
        data=upload_data(key="missing", operation="missing"), headers=headers(route_session))
    assert missing.status_code == 422
    malformed_headers = {**headers(route_session), "Content-Type": "multipart/form-data; boundary=broken"}
    malformed = client.post(
        "/api/v1/investigations/investigation-a/candidate-evidence/direct-uploads",
        content=b"this is not multipart", headers=malformed_headers)
    assert malformed.status_code == 400


@pytest.mark.parametrize(("filename", "media_type", "content", "category"), [
    ("evidence.pdf", "application/pdf", b"%PDF-1.4\n%%EOF\n", "PDF"),
    ("evidence.txt", "text/plain", b"passive UTF-8 evidence\n", "PLAIN_TEXT"),
    ("evidence.png", "image/png", b"\x89PNG\r\n\x1a\nIHDRpassive", "PNG"),
    ("evidence.jpg", "image/jpeg", b"\xff\xd8\xff\xe0passive\xff\xd9", "JPEG"),
    ("evidence.webp", "image/webp", b"RIFF\x08\x00\x00\x00WEBPpassive", "WEBP"),
    ("evidence.mp3", "audio/mpeg", b"ID3\x04\x00\x00passive", "MP3"),
    ("evidence.wav", "audio/wav", b"RIFF\x08\x00\x00\x00WAVEpassive", "WAV"),
    ("evidence.m4a", "audio/mp4", b"\x00\x00\x00\x18ftypM4A passive", "M4A"),
    ("evidence.mp4", "video/mp4", b"\x00\x00\x00\x18ftypisompassive", "MP4"),
    ("evidence.webm", "video/webm", b"\x1a\x45\xdf\xa3webmpassive", "WEBM"),
    ("evidence.mov", "video/quicktime", b"\x00\x00\x00\x18ftypqt  passive", "MOV"),
])
def test_direct_upload_conservative_supported_media(route_session, filename, media_type, content, category):
    identity = filename.replace(".", "-")
    response = upload(route_session.client, route_session, filename=filename,
                      media_type=media_type, content=content,
                      data=upload_data(key=identity, operation=identity))
    assert response.status_code == 201, response.text
    assert response.json()["upload"]["mediaCategory"] == category


def test_direct_upload_revision_isolation_and_idempotency(route_session):
    client = route_session.client
    content = b"%PDF-1.4\nidempotent\n"
    first = upload(client, route_session, content=content)
    assert first.status_code == 201
    exact = upload(client, route_session, content=content)
    assert exact.status_code == 200 and exact.json() == first.json()
    conflict = upload(client, route_session, content=b"%PDF-1.4\ndifferent\n")
    assert conflict.status_code == 409
    stale = upload(client, route_session, data=upload_data(
        key="stale-upload", operation="stale-upload", revision=9))
    assert stale.status_code == 409
    mismatch = upload_data(key="manifold-mismatch", operation="manifold-mismatch")
    mismatch["manifoldRevisionId"] = "investigation-aggregate:99"
    assert upload(client, route_session, data=mismatch).status_code == 409
    cross = client.post(
        "/api/v1/investigations/investigation-b/candidate-evidence/direct-uploads",
        data=upload_data(key="cross", operation="cross"),
        files={"file": ("evidence.pdf", content, "application/pdf")}, headers=headers(route_session))
    assert cross.status_code == 412
    candidate_id = first.json()["candidateId"]
    assert client.get(
        f"/api/v1/investigations/investigation-b/candidate-evidence/{candidate_id}").status_code == 404
    with TestClient(app) as other_client:
        account = other_client.post("/api/v1/auth/accounts", json={
            "email": "other-upload-owner@example.test", "password": "correct horse battery staple"})
        assert account.status_code == 201
        denied = other_client.post(
            "/api/v1/investigations/investigation-a/candidate-evidence/direct-uploads",
            data=upload_data(key="other-owner", operation="other-owner"),
            files={"file": ("evidence.pdf", content, "application/pdf")},
            headers={"X-ISEES-CSRF": other_client.cookies.get("isees_csrf")})
        assert denied.status_code == 404


def test_direct_upload_metadata_failure_removes_new_blob(route_session, repo, blob_store, monkeypatch):
    content = b"%PDF-1.4\norphan sentinel\n"
    original = repo.create

    def fail_create(**kwargs):
        raise RuntimeError("injected metadata persistence failure")

    monkeypatch.setattr(repo, "create", fail_create)
    with pytest.raises(RuntimeError, match="injected metadata"):
        upload(route_session.client, route_session, content=content,
               data=upload_data(key="failure", operation="failure"))
    monkeypatch.setattr(repo, "create", original)
    assert not any(path.is_file() for path in blob_store.objects.rglob("*"))
