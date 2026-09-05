from __future__ import annotations

import sqlite3
from concurrent.futures import ThreadPoolExecutor
from dataclasses import replace
from datetime import datetime, timezone

import pytest

from isees_uap.studio import sqlite_repository
from isees_uap.studio.errors import (AcceptanceFailure, IdempotencyConflict, PublicationFailure,
                                     RevisionConflict, UnresolvedProjectionReadiness)
from isees_uap.studio.ports import AcceptanceReceipt, AccessResult, PublicationReceipt, SourceResolutionResult
from isees_uap.studio.schemas import (
    AcceptStudioArtifact, CreateCandidateKnowledgeArtifact, CreateStudioDraft,
    PublishStudioCandidateNode, RecordMaterializedProjection, RejectStudioArtifact,
    ReturnStudioArtifact, SaveStudioArtifactVersion, SubmitStudioForReview,
    ValidateStudioProjection,
)
from isees_uap.studio.repository import IdempotencyRecord
from isees_uap.studio.service import StudioService
from isees_uap.studio.sqlite_repository import SQLiteStudioRepository

NOW = datetime(2026, 1, 2, tzinfo=timezone.utc)


class Access:
    def resolve_access(self, **_): return AccessResult(True)


class Sources:
    def resolve_source(self, **_): return SourceResolutionResult(True, {})


class Unused:
    def publish_candidate(self, **_): raise AssertionError("not expected")
    def accept_candidate(self, **_): raise AssertionError("not expected")


class Successful:
    def publish_candidate(self, **_):
        return PublicationReceipt("publication-1", "node-1", "2026-01-02T00:00:00Z")
    def accept_candidate(self, **_):
        return AcceptanceReceipt("acceptance-1", "knowledge-1", "2026-01-02T00:00:00Z")


class Failing:
    def publish_candidate(self, **_): raise RuntimeError("publication unavailable")
    def accept_candidate(self, **_): raise RuntimeError("acceptance unavailable")


def command(key="create", artifact="a1"):
    return CreateStudioDraft(
        investigationId="i1", principalId="p1", idempotencyKey=key,
        artifactId=artifact, versionId=f"{artifact}:v1", authorSchemaVersion="author/v1",
        document={"title": "Résumé"}, sourceSnapshots=[{
            "snapshotId": f"{artifact}:s1", "sourceIdentity": "note:1",
            "sourceInvestigationId": "i1", "sourceWorkspace": "STUDIO",
            "sourceKind": "OTHER", "classification": "RESEARCHER_GENERATED",
            "capturedAt": NOW, "representationSchemaVersion": "note/v1",
            "mediaType": "application/json", "capturedRepresentation": {"x": 1}}],
        claims=[{"claimId": "c1", "claimText": "claim"}],
        citations=[{"citationId": "cite1", "sourceSnapshotId": f"{artifact}:s1"}],
        claimSourceMappings=[{"mappingId": "m1", "claimId": "c1",
          "sourceSnapshotId": f"{artifact}:s1", "citationId": "cite1", "relationshipType": "SUPPORTS"}])


def make_service(repo):
    return StudioService(repo, Access(), Sources(), Unused(), Unused(), clock=lambda: NOW)


def lifecycle_service(repo, downstream=None):
    ports = downstream or Successful()
    return StudioService(repo, Access(), Sources(), ports, ports, clock=lambda: NOW)


def existing(cls, key, revision, **extra):
    return cls(investigationId="i1", principalId="p1", idempotencyKey=key,
               artifactId="a1", expectedRevision=revision, **extra)


def advance_to_review(svc):
    svc.create_draft("i1", command())
    svc.create_candidate("i1", existing(CreateCandidateKnowledgeArtifact, "candidate", 0,
                                         candidateArtifactId="candidate-1"))
    svc.publish_candidate("i1", existing(PublishStudioCandidateNode, "publish", 1,
                                          candidateArtifactId="candidate-1"))
    svc.submit_for_review("i1", existing(SubmitStudioForReview, "review", 2,
                                          candidateArtifactId="candidate-1"))


def test_migration_complete_idempotent_and_reopen(tmp_path):
    path = tmp_path / "studio.db"
    SQLiteStudioRepository(path).close()
    SQLiteStudioRepository(path).close()
    with sqlite3.connect(path) as connection:
        tables = {row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        assert {"studio_artifact", "studio_artifact_version", "studio_source_snapshot", "studio_claim",
                "studio_citation", "studio_claim_source_mapping", "studio_candidate_artifact",
                "studio_candidate_publication_receipt", "studio_acceptance_receipt",
                "studio_review_decision", "studio_projection", "studio_lifecycle_event",
                "studio_idempotency", "studio_schema_migrations"} <= tables
        assert connection.execute("SELECT count(*) FROM studio_schema_migrations").fetchone()[0] == 2


def test_concurrent_cold_start_serializes_schema_migrations(tmp_path):
    path = tmp_path / "concurrent-studio.db"

    with ThreadPoolExecutor(max_workers=2) as workers:
        repositories = list(workers.map(lambda _: SQLiteStudioRepository(path), range(2)))
    for repository in repositories:
        repository.close()

    with sqlite3.connect(path) as connection:
        assert connection.execute(
            "SELECT version, count(*) FROM studio_schema_migrations GROUP BY version ORDER BY version"
        ).fetchall() == [(1, 1), (2, 1)]
        columns = [row[1] for row in connection.execute("PRAGMA table_info(studio_source_snapshot)")]
        for column in ("anchor_id", "graph_identity", "graph_revision", "immutable_source_hash",
                       "insertion_state", "insertion_reason"):
            assert columns.count(column) == 1

    SQLiteStudioRepository(path).close()


def test_unexpected_malformed_pending_migration_fails_loudly(tmp_path, monkeypatch):
    path = tmp_path / "malformed.db"
    original_read_text = sqlite_repository.Path.read_text

    def malformed_second_migration(migration_path, *args, **kwargs):
        if migration_path.name == "002_studio.sql":
            return "ALTER TABLE studio_source_snapshot ADD COLUMN broken ("
        return original_read_text(migration_path, *args, **kwargs)

    monkeypatch.setattr(sqlite_repository.Path, "read_text", malformed_second_migration)
    with pytest.raises(RuntimeError, match="Incomplete STUDIO migration statement"):
        SQLiteStudioRepository(path)

    with sqlite3.connect(path) as connection:
        tables = {row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        assert tables == set()


def test_migration_refuses_newer_schema_without_resetting_data(tmp_path):
    path = tmp_path / "future.db"
    with sqlite3.connect(path) as connection:
        connection.execute("CREATE TABLE studio_schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)")
        connection.execute("INSERT INTO studio_schema_migrations VALUES (999, 'future')")
        connection.execute("CREATE TABLE sentinel (value TEXT)")
        connection.execute("INSERT INTO sentinel VALUES ('preserve-me')")
    with pytest.raises(RuntimeError, match="newer"):
        SQLiteStudioRepository(path)
    with sqlite3.connect(path) as connection:
        assert connection.execute("SELECT value FROM sentinel").fetchone()[0] == "preserve-me"


def test_full_version_round_trip_and_replay_survive_restart(tmp_path):
    path = tmp_path / "studio.db"
    repo = SQLiteStudioRepository(path); svc = make_service(repo)
    first = svc.create_draft("i1", command())
    before = repo.get(artifact_id="a1")
    repo.close()
    reopened = SQLiteStudioRepository(path); restored = reopened.get(artifact_id="a1")
    assert restored == before
    assert restored.versions[0].content_hash == before.versions[0].content_hash
    assert restored.source_snapshots[0].snapshot_hash == before.source_snapshots[0].snapshot_hash
    replay = make_service(reopened).create_draft("i1", command())
    assert replay.replayed and replay.artifactId == first.artifactId
    with pytest.raises(IdempotencyConflict):
        make_service(reopened).create_draft("i1", command(artifact="changed"))


def test_scoped_listing_and_atomic_stale_revision(tmp_path):
    repo = SQLiteStudioRepository(tmp_path / "studio.db"); svc = make_service(repo)
    svc.create_draft("i1", command())
    assert len(repo.list(investigation_id="i1", principal_id="p1")) == 1
    assert repo.list(investigation_id="other", principal_id="p1") == []
    assert repo.list(investigation_id="i1", principal_id="other") == []
    save = SaveStudioArtifactVersion(investigationId="i1", principalId="p1", idempotencyKey="save",
        artifactId="a1", expectedRevision=3, versionId="a1:v2", authorSchemaVersion="author/v1",
        document={"title": "changed"})
    with pytest.raises(RevisionConflict): svc.save_version("i1", save)
    restored = repo.get(artifact_id="a1")
    assert restored.artifact.revision == 0 and len(restored.versions) == 1

    svc.create_draft("i1", command(key="second", artifact="a0"))
    assert [item.artifact.artifact_id for item in repo.list(
        investigation_id="i1", principal_id="p1")] == ["a0", "a1"]


def test_complete_lifecycle_projection_and_replay_restore_after_restart(tmp_path):
    path = tmp_path / "complete.db"
    repo = SQLiteStudioRepository(path); svc = lifecycle_service(repo)
    advance_to_review(svc)
    svc.validate_projection("i1", existing(ValidateStudioProjection, "validate", 3,
        projectionId="projection-1", artifactVersionId="a1:v1", projectionFormat="PDF",
        citationStyleConfiguration={"style": "apa"}, validatorVersion="validator/v1"))
    svc.record_materialized_projection("i1", existing(RecordMaterializedProjection, "materialize", 4,
        projectionId="projection-1", artifactVersionId="a1:v1"))
    accepted = svc.accept("i1", existing(AcceptStudioArtifact, "accept", 5,
        candidateArtifactId="candidate-1", targetScope="ARTIFACT", reason="approved"))
    before = repo.get(artifact_id="a1"); events = repo.lifecycle_events(artifact_id="a1")
    repo.close()
    reopened = SQLiteStudioRepository(path); restored = reopened.get(artifact_id="a1")
    assert restored == before
    assert restored.artifact.lifecycle_state.value == "ACCEPTED_KNOWLEDGE"
    assert len(restored.versions) == len(restored.source_snapshots) == 1
    assert len(restored.versions[0].claims) == len(restored.versions[0].citations) == 1
    assert len(restored.versions[0].claim_source_mappings) == 1
    assert len(restored.candidates) == len(restored.publication_receipts) == 1
    assert len(restored.acceptance_receipts) == len(restored.review_decisions) == 1
    assert restored.projections[0].output_hash.startswith("sha256:")
    assert [event["sequence"] for event in events] == list(range(7))
    assert [(e["prior_revision"], e["resulting_revision"]) for e in events] == [(0, 0)] + [(i, i + 1) for i in range(6)]
    replay = lifecycle_service(reopened).accept("i1", existing(AcceptStudioArtifact, "accept", 5,
        candidateArtifactId="candidate-1", targetScope="ARTIFACT", reason="approved"))
    assert replay.replayed and replay.receiptId == accepted.receiptId


@pytest.mark.parametrize("command_type,method,state", [
    (ReturnStudioArtifact, "return_artifact", "RETURNED"),
    (RejectStudioArtifact, "reject", "REJECTED"),
])
def test_review_outcomes_restore_after_restart(tmp_path, command_type, method, state):
    path = tmp_path / f"{state}.db"; repo = SQLiteStudioRepository(path); svc = lifecycle_service(repo)
    advance_to_review(svc)
    getattr(svc, method)("i1", existing(command_type, state.lower(), 3,
        candidateArtifactId="candidate-1", targetScope="ARTIFACT", reason="review outcome"))
    repo.close(); restored = SQLiteStudioRepository(path).get(artifact_id="a1")
    assert restored.artifact.lifecycle_state.value == state
    assert restored.review_decisions[0].decision.value == ("RETURN" if state == "RETURNED" else "REJECT")


def test_failed_external_operations_and_identity_conflicts_are_atomic(tmp_path):
    path = tmp_path / "atomic.db"; repo = SQLiteStudioRepository(path); good = lifecycle_service(repo)
    good.create_draft("i1", command())
    good.create_candidate("i1", existing(CreateCandidateKnowledgeArtifact, "candidate", 0,
                                           candidateArtifactId="candidate-1"))
    before_publish = repo.get(artifact_id="a1")
    with pytest.raises(PublicationFailure):
        lifecycle_service(repo, Failing()).publish_candidate("i1", existing(
            PublishStudioCandidateNode, "failed-publish", 1, candidateArtifactId="candidate-1"))
    assert repo.get(artifact_id="a1") == before_publish
    good.publish_candidate("i1", existing(PublishStudioCandidateNode, "publish", 1,
                                           candidateArtifactId="candidate-1"))
    good.submit_for_review("i1", existing(SubmitStudioForReview, "review", 2,
                                           candidateArtifactId="candidate-1"))
    before_accept = repo.get(artifact_id="a1")
    with pytest.raises(AcceptanceFailure):
        lifecycle_service(repo, Failing()).accept("i1", existing(AcceptStudioArtifact, "failed-accept", 3,
            candidateArtifactId="candidate-1", targetScope="ARTIFACT", reason="approve"))
    assert repo.get(artifact_id="a1") == before_accept

    conflicting = replace(before_accept, candidates=(replace(before_accept.candidates[0],
        created_by_principal_id="attacker"),))
    with pytest.raises(RevisionConflict):
        repo.persist_command(record=replace(conflicting, artifact=replace(conflicting.artifact, revision=4)),
            expected_revision=3, scope=("p1", "i1", "TEST", "identity-conflict"),
            idempotency=IdempotencyRecord("hash", {"artifactId": "a1"}))
    assert repo.get(artifact_id="a1") == before_accept
    assert repo.get_idempotency(scope=("p1", "i1", "TEST", "identity-conflict")) is None


def test_failed_materialization_leaves_projection_and_replay_state_unchanged(tmp_path):
    path = tmp_path / "materialization.db"; repo = SQLiteStudioRepository(path); svc = lifecycle_service(repo)
    orphan = command().model_dump(mode="python")
    orphan.update({"claims": [{"claimId": "orphan", "claimText": "unresolved"}],
                   "citations": [], "claimSourceMappings": []})
    svc.create_draft("i1", CreateStudioDraft.model_validate(orphan))
    svc.validate_projection("i1", existing(ValidateStudioProjection, "validate", 0,
        projectionId="projection-1", artifactVersionId="a1:v1", projectionFormat="HTML",
        validatorVersion="validator/v1"))
    before = repo.get(artifact_id="a1")
    with pytest.raises(UnresolvedProjectionReadiness):
        svc.record_materialized_projection("i1", existing(RecordMaterializedProjection, "failed", 1,
            projectionId="projection-1", artifactVersionId="a1:v1"))
    assert repo.get(artifact_id="a1") == before
    assert repo.get_idempotency(scope=("p1", "i1", "MATERIALIZE_PROJECTION", "failed")) is None
