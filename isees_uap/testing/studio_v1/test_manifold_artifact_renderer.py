from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from dataclasses import replace
import hashlib
import json

import pytest

from isees_uap.studio.v1.hashing import canonical_sha256
from isees_uap.studio.v1.manifold_artifact_renderer import (
    ALTERNATE_CONFIGURATION_HASH, ALTERNATE_CONFIGURATION_IDENTITY,
    ALTERNATE_CONFIGURATION_VERSION, CONFIGURATION_HASH, MEDIA_TYPE,
    RENDERER_VERSION, TEMPLATE_VERSION, ManifoldArtifactConfiguration,
    ManifoldArtifactFailureCode, ManifoldArtifactRenderFailure,
    render_manifold_artifact,
)
from isees_uap.studio.v1.output_store import OutputStoreFailure
from isees_uap.studio.v1.schemas import (AuthorRevision, FrozenResearchSourceSnapshot,
                                         SnapshotReference)
from isees_uap.testing.studio_v1.test_application import application
from isees_uap.testing.studio_v1.test_persistence import fixture_data, make_command, second


def authority():
    data = fixture_data()
    raw = deepcopy(data["scientificRevision"])
    raw["semanticContent"]["manifoldDeclarations"] = deepcopy(data["manifoldDeclarations"])
    raw["contentHash"] = canonical_sha256(raw["semanticContent"])
    command = make_command(projections=0, revision=raw)
    return command.artifact, command.revision, command.snapshots


def rendered(configuration=ManifoldArtifactConfiguration()):
    artifact, revision, snapshots = authority()
    return render_manifold_artifact(artifact, revision, snapshots,
                                    artifact.investigationId, configuration)


def test_exact_saved_authority_projects_only_explicit_structured_material():
    artifact, revision, snapshots = authority()
    value = json.loads(render_manifold_artifact(
        artifact, revision, snapshots, artifact.investigationId))
    assert value["source"] == {
        "artifactId": artifact.artifactId,
        "documentId": revision.semanticContent.documentId,
        "revisionId": revision.revisionId,
        "revisionNumber": revision.revisionNumber,
        "contentHash": revision.contentHash,
        "investigationId": artifact.investigationId,
    }
    assert value["canonEffect"] == "NONE"
    assert value["acceptedRelationshipReferences"] == []
    assert value["sourceKnowledgeIdentities"]
    assert all(item["kind"] == "KNOWLEDGE_OBJECT" for item in value["sourceKnowledgeIdentities"])
    assert {item["kind"] for item in value["evidenceReferences"]} == {"EVIDENCE"}
    assert "Measured orbital relation" not in value


def test_canonical_bytes_hash_and_build_time_are_deterministic():
    first = rendered(); second_bytes = rendered()
    assert first == second_bytes
    assert canonical_sha256(json.loads(first)) == "sha256:" + hashlib.sha256(first).hexdigest()
    assert not first.endswith(b"\n") and first.decode("utf-8").encode("utf-8") == first
    assert all(term not in first for term in (b"createdAt", b"exportTime", b"jobTime", b"requestId"))


def test_unordered_snapshot_input_is_normalized_and_authored_declaration_order_is_preserved():
    artifact, revision, snapshots = authority()
    base = snapshots[0].model_dump(exclude_none=True)
    other = deepcopy(base); other["snapshotId"] = "snapshot-other"
    other["snapshotHash"] = canonical_sha256({k: v for k, v in other.items() if k != "snapshotHash"})
    second_snapshot = FrozenResearchSourceSnapshot.model_validate(other)
    refs = (revision.sourceSnapshots[0], SnapshotReference(
        snapshotId=second_snapshot.snapshotId, snapshotHash=second_snapshot.snapshotHash))
    changed = revision.model_copy(update={"sourceSnapshots": refs})
    a = render_manifold_artifact(artifact, changed, (snapshots[0], second_snapshot), artifact.investigationId)
    b = render_manifold_artifact(artifact, changed, (second_snapshot, snapshots[0]), artifact.investigationId)
    assert a == b
    declarations = json.loads(a)["declarations"]
    assert [item["declarationId"] for item in declarations] == [
        item.declarationId for item in revision.semanticContent.manifoldDeclarations]


def test_changed_revision_and_supported_configuration_change_bytes_and_hashes():
    artifact, revision, snapshots = authority()
    raw = revision.model_dump(exclude_none=True)
    raw.update(revisionId="artifact-paper-1.r2", revisionNumber=2,
               parentRevisionId=revision.revisionId, createdAt="2026-09-10T18:05:00.000Z")
    raw["semanticContent"]["manifoldDeclarations"][0]["statement"] += " Saved change."
    raw["contentHash"] = canonical_sha256(raw["semanticContent"])
    newer = AuthorRevision.model_validate(raw)
    base = render_manifold_artifact(artifact, revision, snapshots, artifact.investigationId)
    revised = render_manifold_artifact(artifact, newer, snapshots, artifact.investigationId)
    alternate = render_manifold_artifact(artifact, revision, snapshots, artifact.investigationId,
        ManifoldArtifactConfiguration(ALTERNATE_CONFIGURATION_IDENTITY,
                                      ALTERNATE_CONFIGURATION_VERSION,
                                      ALTERNATE_CONFIGURATION_HASH))
    assert len({hashlib.sha256(item).hexdigest() for item in (base, revised, alternate)}) == 3


def test_absent_declarations_stay_empty_and_prose_is_never_inferred():
    command = make_command(projections=0)
    value = json.loads(render_manifold_artifact(command.artifact, command.revision,
        command.snapshots, command.artifact.investigationId))
    assert value["declarations"] == []
    assert value["sourceKnowledgeIdentities"] == []
    assert value["evidenceReferences"] == []
    assert value["acceptedRelationshipReferences"] == []


def test_hash_snapshot_authority_malformed_and_unsupported_configuration_fail_closed():
    artifact, revision, snapshots = authority()
    cases = [
        (revision.model_copy(update={"contentHash": "sha256:" + "0" * 64}), snapshots,
         ManifoldArtifactFailureCode.CONTENT_HASH_MISMATCH),
        (revision, (snapshots[0].model_copy(update={"snapshotHash": "sha256:" + "0" * 64}),),
         ManifoldArtifactFailureCode.SNAPSHOT_MISMATCH),
    ]
    for candidate_revision, candidate_snapshots, code in cases:
        with pytest.raises(ManifoldArtifactRenderFailure) as caught:
            render_manifold_artifact(artifact, candidate_revision, candidate_snapshots,
                                     artifact.investigationId)
        assert caught.value.code is code
    with pytest.raises(ManifoldArtifactRenderFailure) as unsupported:
        render_manifold_artifact(artifact, revision, snapshots, artifact.investigationId,
            ManifoldArtifactConfiguration("unknown", "9", "sha256:" + "9" * 64))
    assert unsupported.value.code is ManifoldArtifactFailureCode.CONFIGURATION_UNSUPPORTED
    malformed_declaration = revision.semanticContent.manifoldDeclarations[0].model_copy(
        update={"declarationId": " "})
    malformed_semantic = revision.semanticContent.model_copy(
        update={"manifoldDeclarations": (malformed_declaration,)})
    malformed = revision.model_copy(update={"semanticContent": malformed_semantic,
        "contentHash": canonical_sha256(malformed_semantic.model_dump(exclude_none=True))})
    with pytest.raises(ManifoldArtifactRenderFailure) as caught:
        render_manifold_artifact(artifact, malformed, snapshots, artifact.investigationId)
    assert caught.value.code is ManifoldArtifactFailureCode.MALFORMED_DECLARATION


def materialize(app, command, key="manifold-1", configuration_hash=CONFIGURATION_HASH):
    return app.create_export("principal-1", "investigation-1", command.artifact.artifactId,
        command.revision.revisionId, format="MANIFOLD_ARTIFACT",
        template_version=TEMPLATE_VERSION, renderer_version=RENDERER_VERSION,
        configuration_hash=configuration_hash, idempotency_key=key)


def test_durable_materialization_replay_integrity_and_isolation(tmp_path):
    app = application(tmp_path); app.start(); command = make_command(projections=0)
    app.save("principal-1", "investigation-1", command)
    first = materialize(app, command)
    replay = materialize(app, command)
    assert replay.projection_id == first.projection_id and replay.output_hash == first.output_hash
    assert first.media_type == MEDIA_TYPE and first.safe_filename.endswith(".manifold-artifact.projection")
    record, data = app.download_projection_materialization("principal-1", "investigation-1",
        command.artifact.artifactId, command.revision.revisionId, first.projection_id)
    assert record.byte_length == len(data)
    assert record.output_hash == "sha256:" + hashlib.sha256(data).hexdigest()
    before = app.get_revision("principal-1", "investigation-1", command.artifact.artifactId,
                              command.revision.revisionId)
    for owner, investigation in (("other", "investigation-1"), ("principal-1", "other")):
        with pytest.raises(Exception) as caught:
            app.download_projection_materialization(owner, investigation, command.artifact.artifactId,
                                                     command.revision.revisionId, first.projection_id)
        assert caught.value.code.value == "ARTIFACT_NOT_FOUND"
    assert app.get_revision("principal-1", "investigation-1", command.artifact.artifactId,
                            command.revision.revisionId) == before
    app.close()


def test_revision_configuration_and_concurrent_requests_have_distinct_or_single_identity(tmp_path):
    app = application(tmp_path); app.start(); one = make_command(projections=0)
    app.save("principal-1", "investigation-1", one)
    with ThreadPoolExecutor(max_workers=2) as pool:
        records = list(pool.map(lambda _: materialize(app, one, "same-key"), range(2)))
    assert len({item.projection_id for item in records}) == 1
    assert len({item.output_hash for item in records}) == 1
    alternate = materialize(app, one, "alternate", ALTERNATE_CONFIGURATION_HASH)
    assert alternate.projection_id != records[0].projection_id
    two = second(one); two = replace(two, projections=())
    app.save("principal-1", "investigation-1", two)
    newer = materialize(app, two, "newer")
    assert newer.projection_id != records[0].projection_id
    assert newer.output_hash != records[0].output_hash
    app.close()


def test_download_detects_tampered_stored_bytes(tmp_path):
    app = application(tmp_path); app.start(); command = make_command(projections=0)
    app.save("principal-1", "investigation-1", command); record = materialize(app, command)
    path = app._export_service.outputs._path(record.storage_key)
    path.write_bytes(b"tampered")
    with pytest.raises(Exception) as caught:
        app.download_projection_materialization("principal-1", "investigation-1",
            command.artifact.artifactId, command.revision.revisionId, record.projection_id)
    assert caught.value.code.value == "OUTPUT_INTEGRITY_FAILURE"
    app.close()
