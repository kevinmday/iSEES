"""Pure, one-way A16/A17 -> A23 conversion.

Field map: version.artifact_id -> artifactId, version.version_id -> revisionId,
version.version_number -> revisionNumber, version.parent_version_id -> parentRevisionId,
version.document -> semanticContent, version.created_* -> createdAt/authorPrincipalId.
The legacy content hash is not trusted; A23 computes its hash over semanticContent.
Legacy snapshots, claims, mappings, comparison context, and citation locator records have
no lossless A23 representation here. Callers must supply already-frozen A23 snapshot
references. Missing scholarly metadata is therefore rejected, never synthesized.
"""
from __future__ import annotations

from copy import deepcopy

from isees_uap.studio.models import StudioArtifactVersion

from .hashing import canonical_sha256
from .persistence import FailureCode, StudioV1Failure
from .schemas import AuthorRevision, SnapshotReference


def legacy_version_to_author_revision(version: StudioArtifactVersion, *, profile: str,
        profile_version: str, snapshot_references: tuple[SnapshotReference, ...]) -> AuthorRevision:
    try:
        document = deepcopy(dict(version.document))
        if version.citations or version.claim_source_mappings:
            raise ValueError("legacy citation records cannot be mapped without scholarly metadata")
        if tuple(version.source_snapshot_ids) != tuple(x.snapshotId for x in snapshot_references):
            raise ValueError("lossless frozen snapshot references were not supplied")
        return AuthorRevision.model_validate({
            "artifactId": version.artifact_id, "revisionId": version.version_id,
            "revisionNumber": version.version_number, "parentRevisionId": version.parent_version_id,
            "semanticContent": document, "contentHash": canonical_sha256(document),
            "sourceSnapshots": [x.model_dump() for x in snapshot_references], "profile": profile,
            "profileVersion": profile_version, "createdAt": version.created_at.strftime("%Y-%m-%dT%H:%M:%S.%f")[:23]+"Z",
            "authorPrincipalId": version.created_by_principal_id, "immutableStatus": "IMMUTABLE_SAVED_REVISION"})
    except Exception as exc:
        raise StudioV1Failure(FailureCode.LEGACY_ADAPTER_INCOMPATIBLE,
                              "Legacy Studio content cannot be represented losslessly as A23 V1.") from exc
