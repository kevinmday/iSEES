from copy import deepcopy

import pytest

from isees_uap.studio.v1.hashing import canonical_sha256
from isees_uap.studio.v1.render_model import (MAX_NODES, RenderModelFailure,
                                               RenderModelFailureCode, build_render_model)
from isees_uap.studio.v1.schemas import AuthorRevision
from isees_uap.testing.studio_v1.test_persistence import fixture_data, make_command


def revision_with(mutator):
    raw = deepcopy(fixture_data()["scientificRevision"])
    mutator(raw["semanticContent"])
    raw["contentHash"] = canonical_sha256(raw["semanticContent"])
    return AuthorRevision.model_validate(raw)


def test_exact_node_order_identity_provenance_and_every_supported_policy():
    revision = make_command(projections=0).revision
    model = build_render_model(revision, "investigation-1")
    assert model.node_order == revision.semanticContent.nodeOrder
    assert tuple(x.node_id for x in model.blocks) == model.node_order
    assert (model.revision_id, model.revision_number, model.content_hash, model.artifact_id,
            model.author_principal_id, model.profile, model.profile_version) == (
        revision.revisionId, revision.revisionNumber, revision.contentHash, revision.artifactId,
        revision.authorPrincipalId, revision.profile, revision.profileVersion)
    assert model.snapshot_references == tuple((x.snapshotId, x.snapshotHash) for x in revision.sourceSnapshots)
    policies = {x.kind: x.placeholder_reason for x in model.blocks}
    assert policies["HEADING"] is None and policies["CLAIM"] is None and policies["TABLE"] is None
    assert policies["EQUATION"] and policies["FIGURE"]
    assert model.citations and model.citations[0].source_snapshot_id


def test_unsafe_urls_control_characters_and_oversize_fail_typed_before_render():
    with pytest.raises(RenderModelFailure) as unsafe:
        build_render_model(revision_with(lambda semantic: semantic["citations"][0].update(url="file:///secret")), "investigation-1")
    assert unsafe.value.code is RenderModelFailureCode.UNSAFE_URI
    with pytest.raises(RenderModelFailure) as control:
        build_render_model(revision_with(lambda semantic: semantic["nodes"][0].update(text="bad\x01text")), "investigation-1")
    assert control.value.code is RenderModelFailureCode.INVALID_CHARACTER
    revision = make_command(projections=0).revision
    semantic = revision.semanticContent.model_copy(update={"nodeOrder": tuple(f"n{x}" for x in range(MAX_NODES + 1))})
    oversized = revision.model_copy(update={"semanticContent": semantic})
    with pytest.raises(RenderModelFailure) as limit: build_render_model(oversized, "investigation-1")
    assert limit.value.code is RenderModelFailureCode.LIMIT_EXCEEDED


def test_unknown_nodes_never_disappear_silently():
    revision = make_command(projections=0).revision
    unknown = type("Unknown", (), {"id":"unknown", "type":"UNKNOWN"})()
    semantic = revision.semanticContent.model_copy(update={"nodeOrder": ("unknown",), "nodes": (unknown,)})
    with pytest.raises(RenderModelFailure) as failure:
        build_render_model(revision.model_copy(update={"semanticContent": semantic}), "investigation-1")
    assert failure.value.code is RenderModelFailureCode.UNSUPPORTED_CONTENT
