from __future__ import annotations

from dataclasses import replace
from datetime import datetime

from .contracts import PROJECTION_FORMATS
from .hashing import canonical_sha256
from .persistence import (AuthoritativeStudioV1Store, FailureCode, ProjectionSpecification,
                          SaveCommand, SaveResult, StudioV1Failure)
from .schemas import ArtifactIdentity, AuthorRevision, FrozenResearchSourceSnapshot
from .validation import validate_revision, validate_snapshot


def projection_identity(command: SaveCommand, spec: ProjectionSpecification) -> str:
    digest = canonical_sha256({"artifactId": command.artifact.artifactId, "revisionId": command.revision.revisionId,
        "format": spec.format, "templateProfileVersion": spec.template_profile_version,
        "rendererVersion": spec.renderer_version, "configurationHash": spec.configuration_hash}).split(":", 1)[1]
    return f"studio-v1-projection-{digest}"


def request_fingerprint(command: SaveCommand) -> str:
    return canonical_sha256({
        "operation": command.operation, "artifact": command.artifact.model_dump(exclude_none=True),
        "revision": command.revision.model_dump(exclude_none=True),
        "snapshots": [x.model_dump(exclude_none=True) for x in command.snapshots],
        "projections": [vars(x) for x in command.projections],
        "expectedHeadRevisionId": command.expected_head_revision_id,
    })


class StudioV1SaveService:
    def __init__(self, store: AuthoritativeStudioV1Store): self._store = store

    def save(self, command: SaveCommand) -> SaveResult:
        try:
            artifact = ArtifactIdentity.model_validate(command.artifact)
            revision = validate_revision(command.revision)
            snapshots = tuple(validate_snapshot(x) for x in command.snapshots)
        except Exception as exc:
            raise StudioV1Failure(FailureCode.CONTENT_HASH_MISMATCH, "The proposed revision or snapshot is invalid.") from exc
        for value in (command.idempotency_key, command.request_fingerprint, command.command_timestamp):
            if not isinstance(value, str) or not value.strip():
                raise StudioV1Failure(FailureCode.REVISION_IDENTITY_CONFLICT, "A required command identity is blank.")
        try:
            parsed = datetime.fromisoformat(command.command_timestamp.replace("Z", "+00:00"))
            if not command.command_timestamp.endswith("Z") or parsed.utcoffset().total_seconds() != 0:
                raise ValueError
        except (ValueError, AttributeError) as exc:
            raise StudioV1Failure(FailureCode.REVISION_IDENTITY_CONFLICT, "Command timestamp must be UTC.") from exc
        if revision.artifactId != artifact.artifactId or revision.authorPrincipalId != artifact.authorPrincipalId:
            raise StudioV1Failure(FailureCode.REVISION_IDENTITY_CONFLICT, "Revision identity does not match the artifact.")
        if revision.profile != artifact.profile:
            raise StudioV1Failure(FailureCode.REVISION_IDENTITY_CONFLICT,
                                  "Revision profile does not match the artifact.")
        if artifact.currentSavedRevisionId != command.expected_head_revision_id:
            raise StudioV1Failure(FailureCode.REVISION_CONFLICT, "Artifact identity does not describe the expected head.")
        keys = [(x.format, x.template_profile_version, x.renderer_version, x.configuration_hash) for x in command.projections]
        if len(keys) != len(set(keys)):
            raise StudioV1Failure(FailureCode.DUPLICATE_PROJECTION_SPECIFICATION, "Projection specifications must be unique.")
        if any(x.format not in PROJECTION_FORMATS for x in command.projections):
            raise StudioV1Failure(FailureCode.DUPLICATE_PROJECTION_SPECIFICATION, "Projection format is not supported.")
        expected = request_fingerprint(command)
        if command.request_fingerprint != expected:
            raise StudioV1Failure(FailureCode.IDEMPOTENCY_KEY_REUSE, "Request fingerprint does not match the canonical command.")
        return self._store.append_revision_and_jobs(replace(command, artifact=artifact, revision=revision, snapshots=snapshots))
