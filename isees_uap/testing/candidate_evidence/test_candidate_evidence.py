from __future__ import annotations

import sqlite3
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from isees_uap.api import app
from isees_uap.api.v1.candidate_evidence import repository
from isees_uap.candidate_evidence.errors import IdempotencyConflict, OriginConflict, ProhibitedTransition, RevisionConflict
from isees_uap.candidate_evidence.sqlite_repository import SQLiteCandidateEvidenceRepository


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
def client(repo):
    app.dependency_overrides[repository] = lambda: repo
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def headers(principal="principal-1"):
    return {"X-ISEES-Principal-Id": principal}


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


def test_api_composition_creation_isolation_and_identity(client):
    assert client.get("/").status_code == 200
    assert client.post("/api/v1/investigations/investigation-a/candidate-evidence/submissions", json=submission()).status_code == 422
    assert client.post("/api/v1/investigations/investigation-a/candidate-evidence/submissions", json=submission(), headers=headers("   ")).status_code == 422
    blank_investigation = submission(investigation="   ")
    assert client.post("/api/v1/investigations/investigation-a/candidate-evidence/submissions", json=blank_investigation, headers=headers()).status_code == 422
    created = client.post("/api/v1/investigations/investigation-a/candidate-evidence/submissions", json=submission(), headers=headers())
    assert created.status_code == 201
    candidate = created.json()
    assert candidate["lifecycleState"] == "SUBMITTED"
    discovered = client.post("/api/v1/investigations/investigation-a/candidate-evidence/discovery-results", json=discovery(), headers=headers())
    assert discovered.status_code == 201 and discovered.json()["origin"] == "DISCOVERY"
    assert discovered.json()["lifecycleState"] == "DISCOVERED"
    curated_response = client.post(
        "/api/v1/investigations/investigation-a/candidate-evidence/curated-repository-references",
        json=curated(), headers=headers(),
    )
    assert curated_response.status_code == 201
    curated_candidate = curated_response.json()
    assert curated_candidate["origin"] == "CURATED_REPOSITORY"
    assert curated_candidate["lifecycleState"] == "REFERENCED"
    listed = client.get("/api/v1/investigations/investigation-a/candidate-evidence", headers=headers()).json()
    assert {item["candidateId"] for item in listed["items"]} == {
        candidate["candidateId"], discovered.json()["candidateId"], curated_candidate["candidateId"]
    }
    assert client.get("/api/v1/investigations/investigation-b/candidate-evidence", headers=headers()).json()["items"] == []
    invalid_cursor = client.get(
        "/api/v1/investigations/investigation-a/candidate-evidence?cursor=invalid", headers=headers()
    )
    assert invalid_cursor.status_code == 400
    assert invalid_cursor.json()["error"]["code"] == "INVALID_CURSOR"
    assert client.get(f"/api/v1/investigations/investigation-b/candidate-evidence/{candidate['candidateId']}", headers=headers()).status_code == 404
    cross_transition = {
        "schemaVersion": "candidate-evidence-command/v1", "investigationId": "investigation-b",
        "expectedRevision": 0, "to": "REFERENCED", "idempotencyKey": "cross-investigation",
    }
    assert client.post(
        f"/api/v1/investigations/investigation-b/candidate-evidence/{candidate['candidateId']}/lifecycle-transitions",
        json=cross_transition, headers=headers(),
    ).status_code == 404
    unchanged = client.get(
        f"/api/v1/investigations/investigation-a/candidate-evidence/{candidate['candidateId']}", headers=headers()
    ).json()
    assert unchanged["revision"] == 0 and unchanged["lifecycleState"] == "SUBMITTED"
    assert client.get(f"/api/v1/investigations/investigation-a/candidate-evidence/{candidate['candidateId']}", headers=headers("another-owner")).status_code == 404
    assert client.get(
        "/api/v1/investigations/investigation-a/candidate-evidence", headers=headers("another-owner")
    ).json()["items"] == []
    mismatch = client.post("/api/v1/investigations/investigation-b/candidate-evidence/submissions", json=submission(), headers=headers())
    assert mismatch.status_code == 412 and mismatch.json()["error"]["code"] == "INVESTIGATION_MISMATCH"


def test_lifecycle_revision_review_and_replay(client):
    candidate = client.post("/api/v1/investigations/investigation-a/candidate-evidence/submissions", json=submission(), headers=headers()).json()
    url = f"/api/v1/investigations/investigation-a/candidate-evidence/{candidate['candidateId']}/lifecycle-transitions"
    def command(revision, target, key, decision=None):
        value = {"schemaVersion": "candidate-evidence-command/v1", "investigationId": "investigation-a",
                 "expectedRevision": revision, "to": target, "idempotencyKey": key}
        if decision:
            value["reviewDecision"] = decision
        return value
    referenced = client.post(url, json=command(0, "REFERENCED", "t1"), headers=headers())
    assert referenced.status_code == 200 and referenced.json()["revision"] == 1
    assert client.post(url, json=command(0, "IN_REVIEW", "stale"), headers=headers()).status_code == 409
    reviewed = client.post(url, json=command(1, "IN_REVIEW", "t2"), headers=headers())
    assert reviewed.status_code == 200
    excluded_command = command(2, "EXCLUDED", "t3", {"decision": "EXCLUDED", "reason": "Human decision"})
    excluded = client.post(url, json=excluded_command, headers=headers())
    assert excluded.status_code == 200 and excluded.json()["reviewDecision"]["reviewerId"] == "principal-1"
    replay = client.post(url, json=excluded_command, headers=headers())
    assert replay.status_code == 200 and replay.json() == excluded.json()
    admitted = {**command(3, "EXCLUDED", "bad"), "to": "ADMITTED"}
    assert client.post(url, json=admitted, headers=headers()).status_code == 422


def test_database_constraints_and_wal(repo):
    with sqlite3.connect(repo.path) as connection:
        assert connection.execute("PRAGMA journal_mode").fetchone()[0].lower() == "wal"
        assert [row[0] for row in connection.execute("SELECT version FROM schema_migrations ORDER BY version")] == [1, 2]
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


def test_curated_api_strictness_association_and_isolation(client):
    url = "/api/v1/investigations/investigation-a/candidate-evidence/curated-repository-references"
    missing_required_unknown = curated()
    del missing_required_unknown["provenance"]
    assert client.post(url, json=missing_required_unknown, headers=headers()).status_code == 422
    invalid_association = curated(key="bad-association")
    invalid_association["association"] = {
        "kind": "NODE", "canonicalIdentity": "node-1", "basis": "INFERRED_SIMILARITY"
    }
    assert client.post(url, json=invalid_association, headers=headers()).status_code == 422

    associated = curated(key="associated", artifact="associated-artifact")
    associated["association"] = {
        "kind": "INVESTIGATION", "canonicalIdentity": "investigation-a", "basis": "EXACT_CANONICAL_ID"
    }
    response = client.post(url, json=associated, headers=headers())
    assert response.status_code == 201 and response.json()["association"] == associated["association"]
    candidate_id = response.json()["candidateId"]
    assert client.get(
        f"/api/v1/investigations/investigation-b/candidate-evidence/{candidate_id}", headers=headers()
    ).status_code == 404
    assert client.get(
        f"/api/v1/investigations/investigation-a/candidate-evidence/{candidate_id}", headers=headers("other")
    ).status_code == 404
    transition_url = (
        f"/api/v1/investigations/investigation-a/candidate-evidence/{candidate_id}/lifecycle-transitions"
    )
    direct_admission = {
        "schemaVersion": "candidate-evidence-command/v1", "investigationId": "investigation-a",
        "expectedRevision": 0, "to": "ADMITTED", "idempotencyKey": "admit-curated",
    }
    assert client.post(transition_url, json=direct_admission, headers=headers()).status_code == 422


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
        assert [row[0] for row in connection.execute("SELECT version FROM schema_migrations ORDER BY version")] == [1, 2]
        assert connection.execute("PRAGMA foreign_key_check").fetchall() == []
        assert connection.execute(
            "SELECT origin,lifecycle_state FROM candidate_evidence WHERE candidate_id='legacy-candidate'"
        ).fetchone() == ("SUBMISSION", "SUBMITTED")
    created, _ = version_one.create(command=curated(), principal_id="p", origin="CURATED_REPOSITORY")
    assert created["origin"] == "CURATED_REPOSITORY"
