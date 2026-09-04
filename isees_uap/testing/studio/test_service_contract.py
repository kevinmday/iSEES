from __future__ import annotations

from datetime import datetime, timezone

import pytest

from isees_uap.studio.errors import (
    AcceptanceFailure, ArtifactNotFound, IdempotencyConflict, InvalidClaimSourceMapping,
    InvalidLifecycleTransition, InvalidSourceSnapshot, PublicationFailure, RevisionConflict,
    UnavailableExternalAuthority, UnresolvedProjectionReadiness,
)
from isees_uap.studio.ports import (
    AcceptanceReceipt, AccessResult, PublicationReceipt, SourceResolutionResult,
)
from isees_uap.studio.repository import IdempotencyRecord
from isees_uap.studio.schemas import (
    AcceptStudioArtifact, CreateCandidateKnowledgeArtifact, CreateStudioDraft,
    PublishStudioCandidateNode, RecordMaterializedProjection, RejectStudioArtifact,
    ReturnStudioArtifact, SaveStudioArtifactVersion, SubmitStudioForReview,
    ValidateStudioProjection,
)
from isees_uap.studio.service import StudioService


NOW = datetime(2026, 1, 1, tzinfo=timezone.utc)


class Repo:
    """Deterministic, explicitly non-durable test fake."""
    def __init__(self): self.records, self.keys = {}, {}
    def get(self, *, artifact_id): return self.records.get(artifact_id)
    def list(self, *, investigation_id, principal_id):
        return [record for record in self.records.values()
                if record.artifact.investigation_id == investigation_id
                and record.artifact.owner_principal_id == principal_id]
    def create(self, *, record): self.records[record.artifact.artifact_id] = record
    def replace(self, *, record, expected_revision):
        current = self.records[record.artifact.artifact_id]
        if current.artifact.revision != expected_revision: raise RevisionConflict("stale")
        self.records[record.artifact.artifact_id] = record
    def get_idempotency(self, *, scope): return self.keys.get(scope)
    def put_idempotency(self, *, scope, record: IdempotencyRecord): self.keys[scope] = record


class Access:
    allowed = True
    fail = False
    def resolve_access(self, **_):
        if self.fail: raise RuntimeError("down")
        return AccessResult(self.allowed)


class Sources:
    available = True
    fail = False
    def resolve_source(self, **_):
        if self.fail: raise RuntimeError("down")
        return SourceResolutionResult(self.available, {})


class Publisher:
    fail = False
    calls = 0
    def publish_candidate(self, **_):
        self.calls += 1
        if self.fail: raise RuntimeError("down")
        return PublicationReceipt("publication:1", "node:1", NOW.isoformat())


class Acceptor:
    fail = False
    calls = 0
    def accept_candidate(self, **_):
        self.calls += 1
        if self.fail: raise RuntimeError("down")
        return AcceptanceReceipt("acceptance:1", "knowledge:1", NOW.isoformat())


@pytest.fixture
def env():
    repo, access, sources, publisher, acceptor = Repo(), Access(), Sources(), Publisher(), Acceptor()
    service = StudioService(repo, access, sources, publisher, acceptor, clock=lambda: NOW)
    return service, repo, access, sources, publisher, acceptor


def source(classification="CANONICAL", **changes):
    value = dict(snapshotId="s1", sourceIdentity="node:1", sourceInvestigationId="source-i",
                 sourceWorkspace="MANIFOLD", sourceKind="EVENT_NODE", classification=classification,
                 sourceRevisionId="r1", capturedAt=NOW.isoformat(),
                 representationSchemaVersion="source/v1", mediaType="application/json",
                 capturedRepresentation={"b": 2, "a": 1})
    value.update(changes)
    return value


def draft(key="create", claims=None, mappings=None, snapshots=None, artifact="a1"):
    return CreateStudioDraft(
        investigationId="i1", principalId="p1", idempotencyKey=key, artifactId=artifact,
        versionId="v1", authorSchemaVersion="author/v1", document={"title": "T"},
        sourceSnapshots=[source()] if snapshots is None else snapshots,
        claims=claims or [], claimSourceMappings=mappings or [])


def create(env, **kwargs):
    command = draft(**kwargs)
    return env[0].create_draft("i1", command)


def candidate_command(revision=0, key="candidate"):
    return CreateCandidateKnowledgeArtifact(investigationId="i1", principalId="p1",
        idempotencyKey=key, artifactId="a1", expectedRevision=revision, candidateArtifactId="candidate:1")


def publish_to_review(env):
    service = env[0]
    create(env)
    service.create_candidate("i1", candidate_command())
    service.publish_candidate("i1", PublishStudioCandidateNode(
        investigationId="i1", principalId="p1", idempotencyKey="publish", artifactId="a1",
        expectedRevision=1, candidateArtifactId="candidate:1"))
    service.submit_for_review("i1", SubmitStudioForReview(
        investigationId="i1", principalId="p1", idempotencyKey="review", artifactId="a1",
        expectedRevision=2, candidateArtifactId="candidate:1"))


def test_stale_revision_and_idempotency_contract(env):
    service = env[0]
    first = create(env)
    replay = service.create_draft("i1", draft())
    assert replay.artifactId == first.artifactId and replay.replayed
    with pytest.raises(IdempotencyConflict):
        service.create_draft("i1", draft(key="create", artifact="different"))
    service.create_candidate("i1", candidate_command())
    with pytest.raises(RevisionConflict):
        service.publish_candidate("i1", PublishStudioCandidateNode(
            investigationId="i1", principalId="p1", idempotencyKey="x", artifactId="a1",
            expectedRevision=0, candidateArtifactId="candidate:1"))


def test_cross_investigation_and_principal_do_not_disclose_existence(env):
    service = env[0]
    create(env)
    for investigation, principal in (("other", "p1"), ("i1", "other")):
        command = candidate_command()
        command = command.model_copy(update={"investigationId": investigation, "principalId": principal})
        with pytest.raises(ArtifactNotFound):
            service.create_candidate(investigation, command)


def test_source_identity_mapping_and_lineage(env):
    service, repo, *_ = env
    claims = [{"claimId": "c1", "claimText": "supported"},
              {"claimId": "c2", "claimText": "orphan"},
              {"claimId": "c3", "claimText": "unresolved"}]
    mappings = [{"mappingId": "m1", "claimId": "c1", "sourceSnapshotId": "s1", "relationshipType": "SUPPORTS"},
                {"mappingId": "m3", "claimId": "c3", "sourceSnapshotId": "s1", "relationshipType": "REQUIRES_RESOLUTION"}]
    create(env, claims=claims, mappings=mappings)
    version = repo.records["a1"].versions[0]
    assert [c.lineage_state.value for c in version.claims] == ["SUPPORTED", "ORPHANED", "UNRESOLVED"]
    assert repo.records["a1"].source_snapshots[0].source_investigation_id == "source-i"
    result = service.create_candidate("i1", candidate_command())
    assert result.readinessState == "READY_WITH_WARNINGS" and len(result.warnings) == 2
    assert env[4].calls == env[5].calls == 0


def test_incomplete_canonical_source_and_bad_mapping_are_rejected(env):
    with pytest.raises(InvalidSourceSnapshot):
        create(env, snapshots=[source(sourceRevisionId=None)])
    with pytest.raises(InvalidClaimSourceMapping):
        create(env, key="bad-map", artifact="a2", mappings=[{
            "mappingId": "m", "claimId": "absent", "sourceSnapshotId": "s1",
            "relationshipType": "SUPPORTS"}])


def test_publication_review_and_acceptance_are_separate(env):
    service, repo, *_, publisher, acceptor = env
    create(env)
    service.create_candidate("i1", candidate_command())
    assert publisher.calls == acceptor.calls == 0
    service.publish_candidate("i1", PublishStudioCandidateNode(
        investigationId="i1", principalId="p1", idempotencyKey="publish", artifactId="a1",
        expectedRevision=1, candidateArtifactId="candidate:1"))
    assert repo.records["a1"].artifact.lifecycle_state.value == "MANIFOLD_CANDIDATE_NODE"
    assert publisher.calls == 1 and acceptor.calls == 0
    with pytest.raises(InvalidLifecycleTransition):
        service.accept("i1", AcceptStudioArtifact(
            investigationId="i1", principalId="p1", idempotencyKey="early", artifactId="a1",
            expectedRevision=2, candidateArtifactId="candidate:1", targetScope="ARTIFACT", reason="ok"))


def test_claim_and_artifact_reviews_are_distinct_and_append_only(env):
    claims = [{"claimId": "c1", "claimText": "claim"}]
    create(env, claims=claims)
    service, repo = env[:2]
    service.create_candidate("i1", candidate_command())
    service.publish_candidate("i1", PublishStudioCandidateNode(investigationId="i1", principalId="p1",
        idempotencyKey="p", artifactId="a1", expectedRevision=1, candidateArtifactId="candidate:1"))
    service.submit_for_review("i1", SubmitStudioForReview(investigationId="i1", principalId="p1",
        idempotencyKey="s", artifactId="a1", expectedRevision=2, candidateArtifactId="candidate:1"))
    service.accept("i1", AcceptStudioArtifact(investigationId="i1", principalId="p1",
        idempotencyKey="claim", artifactId="a1", expectedRevision=3, candidateArtifactId="candidate:1",
        targetScope="CLAIM", claimId="c1", reason="supported"))
    assert repo.records["a1"].artifact.lifecycle_state.value == "REVIEW_TEST"
    service.accept("i1", AcceptStudioArtifact(investigationId="i1", principalId="p1",
        idempotencyKey="artifact", artifactId="a1", expectedRevision=4, candidateArtifactId="candidate:1",
        targetScope="ARTIFACT", reason="accepted"))
    assert [d.target_scope.value for d in repo.records["a1"].review_decisions] == ["CLAIM", "ARTIFACT"]
    assert len(repo.records["a1"].versions) == 1


@pytest.mark.parametrize(("kind", "state"), [("return", "RETURNED"), ("reject", "REJECTED")])
def test_return_and_rejection_preserve_history(env, kind, state):
    publish_to_review(env)
    service, repo = env[:2]
    cls, method = (ReturnStudioArtifact, service.return_artifact) if kind == "return" else (RejectStudioArtifact, service.reject)
    method("i1", cls(investigationId="i1", principalId="p1", idempotencyKey=kind,
        artifactId="a1", expectedRevision=3, candidateArtifactId="candidate:1",
        targetScope="ARTIFACT", reason="reason"))
    assert repo.records["a1"].artifact.lifecycle_state.value == state
    assert len(repo.records["a1"].versions) == 1 and len(repo.records["a1"].review_decisions) == 1


def test_return_requires_corrected_successor_before_republication(env):
    publish_to_review(env)
    service, repo = env[:2]
    service.return_artifact("i1", ReturnStudioArtifact(investigationId="i1", principalId="p1",
        idempotencyKey="return", artifactId="a1", expectedRevision=3, candidateArtifactId="candidate:1",
        targetScope="ARTIFACT", reason="correct"))
    with pytest.raises(InvalidLifecycleTransition):
        service.create_candidate("i1", candidate_command(revision=4, key="too-soon"))
    save = SaveStudioArtifactVersion(investigationId="i1", principalId="p1", idempotencyKey="save",
        artifactId="a1", expectedRevision=4, versionId="v2", authorSchemaVersion="author/v1",
        document={"corrected": True}, sourceSnapshots=[source()])
    service.save_version("i1", save)
    assert [v.version_number for v in repo.records["a1"].versions] == [1, 2]
    assert repo.records["a1"].versions[-1].parent_version_id == "v1"


def test_projection_validation_and_materialization_are_separate(env):
    create(env)
    service, repo = env[:2]
    validated = service.validate_projection("i1", ValidateStudioProjection(
        investigationId="i1", principalId="p1", idempotencyKey="validate", artifactId="a1",
        expectedRevision=0, artifactVersionId="v1", projectionId="projection:1",
        projectionFormat="PDF", validatorVersion="validator/v1"))
    assert repo.records["a1"].artifact.lifecycle_state.value == "DRAFT"
    assert repo.records["a1"].projections[0].materialization_state.value == "NOT_MATERIALIZED"
    service.record_materialized_projection("i1", RecordMaterializedProjection(
        investigationId="i1", principalId="p1", idempotencyKey="materialize", artifactId="a1",
        expectedRevision=1, projectionId=validated.projectionId, artifactVersionId="v1"))
    assert repo.records["a1"].projections[0].materialization_state.value == "MATERIALIZED"
    assert repo.records["a1"].artifact.lifecycle_state.value == "DRAFT"


def test_unresolved_required_lineage_blocks_materialization(env):
    create(env, claims=[{"claimId": "c", "claimText": "claim"}], mappings=[{
        "mappingId": "m", "claimId": "c", "sourceSnapshotId": "s1",
        "relationshipType": "REQUIRES_RESOLUTION"}])
    service = env[0]
    service.validate_projection("i1", ValidateStudioProjection(
        investigationId="i1", principalId="p1", idempotencyKey="v", artifactId="a1",
        expectedRevision=0, artifactVersionId="v1", projectionId="projection:1",
        projectionFormat="HTML", validatorVersion="v1"))
    with pytest.raises(UnresolvedProjectionReadiness):
        service.record_materialized_projection("i1", RecordMaterializedProjection(
            investigationId="i1", principalId="p1", idempotencyKey="m", artifactId="a1",
            expectedRevision=1, projectionId="projection:1", artifactVersionId="v1"))


def test_external_authorities_fail_closed(env):
    service, _, access, sources, publisher, acceptor = env
    access.fail = True
    with pytest.raises(UnavailableExternalAuthority): service.authorize_read("p1", "i1")
    # First creation establishes its own principal/Investigation ownership
    # boundary and therefore does not depend on pre-existing external state.
    service.create_draft("i1", draft())
    access.fail = False; sources.fail = True
    with pytest.raises(UnavailableExternalAuthority):
        service.create_draft("i1", draft(key="two", artifact="a2"))
    sources.fail = False
    service.create_candidate("i1", candidate_command())
    publisher.fail = True
    with pytest.raises(PublicationFailure): service.publish_candidate("i1", PublishStudioCandidateNode(
        investigationId="i1", principalId="p1", idempotencyKey="p", artifactId="a1",
        expectedRevision=1, candidateArtifactId="candidate:1"))


def test_acceptance_authority_failure_preserves_review_state(env):
    publish_to_review(env)
    service, repo, *_, acceptor = env
    acceptor.fail = True
    with pytest.raises(AcceptanceFailure): service.accept("i1", AcceptStudioArtifact(
        investigationId="i1", principalId="p1", idempotencyKey="accept", artifactId="a1",
        expectedRevision=3, candidateArtifactId="candidate:1", targetScope="ARTIFACT", reason="ok"))
    assert repo.records["a1"].artifact.lifecycle_state.value == "REVIEW_TEST"
