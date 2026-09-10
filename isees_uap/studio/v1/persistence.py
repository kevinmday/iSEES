from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol, Sequence

from .schemas import ArtifactIdentity, AuthorRevision, FrozenResearchSourceSnapshot


class FailureCode(str, Enum):
    ARTIFACT_NOT_FOUND = "ARTIFACT_NOT_FOUND"
    AUTHORITY_MISMATCH = "AUTHORITY_MISMATCH"
    INVESTIGATION_MISMATCH = "INVESTIGATION_MISMATCH"
    REVISION_CONFLICT = "REVISION_CONFLICT"
    REVISION_IDENTITY_CONFLICT = "REVISION_IDENTITY_CONFLICT"
    CONTENT_HASH_MISMATCH = "CONTENT_HASH_MISMATCH"
    SNAPSHOT_NOT_FOUND = "SNAPSHOT_NOT_FOUND"
    SNAPSHOT_HASH_MISMATCH = "SNAPSHOT_HASH_MISMATCH"
    SNAPSHOT_IMMUTABILITY_CONFLICT = "SNAPSHOT_IMMUTABILITY_CONFLICT"
    DUPLICATE_PROJECTION_SPECIFICATION = "DUPLICATE_PROJECTION_SPECIFICATION"
    IDEMPOTENCY_KEY_REUSE = "IDEMPOTENCY_KEY_REUSE"
    ILLEGAL_PROJECTION_TRANSITION = "ILLEGAL_PROJECTION_TRANSITION"
    LEASE_CONFLICT = "LEASE_CONFLICT"
    LEASE_EXPIRED = "LEASE_EXPIRED"
    ATTEMPT_LIMIT_REACHED = "ATTEMPT_LIMIT_REACHED"
    PERSISTENCE_UNAVAILABLE = "PERSISTENCE_UNAVAILABLE"
    LEGACY_ADAPTER_INCOMPATIBLE = "LEGACY_ADAPTER_INCOMPATIBLE"


class StudioV1Failure(Exception):
    def __init__(self, code: FailureCode, safe_message: str):
        super().__init__(safe_message)
        self.code, self.safe_message = code, safe_message


@dataclass(frozen=True)
class ProjectionSpecification:
    format: str
    template_profile_version: str
    renderer_version: str
    configuration_hash: str
    prior_successful_projection_id: str | None = None


@dataclass(frozen=True)
class SaveCommand:
    artifact: ArtifactIdentity
    revision: AuthorRevision
    snapshots: tuple[FrozenResearchSourceSnapshot, ...]
    projections: tuple[ProjectionSpecification, ...]
    expected_head_revision_id: str | None
    idempotency_key: str
    request_fingerprint: str
    command_timestamp: str
    operation: str = "APPEND_AUTHOR_REVISION"


@dataclass(frozen=True)
class SaveResult:
    artifact_id: str
    revision_id: str
    revision_number: int
    job_ids: tuple[str, ...]
    replayed: bool = False


@dataclass(frozen=True)
class ProjectionJob:
    job_id: str
    projection_id: str
    artifact_id: str
    revision_id: str
    parent_content_hash: str
    format: str
    template_profile_version: str
    renderer_version: str
    configuration_hash: str
    state: str
    created_at: str
    attempt_count: int
    max_attempts: int
    lease_id: str | None
    lease_owner: str | None
    lease_expires_at: str | None
    failure_code: str | None
    safe_failure_message: str | None
    output_hash: str | None
    prior_successful_projection_id: str | None


class AuthoritativeStudioV1Store(Protocol):
    def initialize_schema(self) -> None: ...
    def append_revision_and_jobs(self, command: SaveCommand) -> SaveResult: ...
    def locate_artifact(self, owner_id: str, investigation_id: str, artifact_id: str) -> ArtifactIdentity: ...
    def get_idempotency_result(self, owner_id: str, investigation_id: str, operation: str, idempotency_key: str, request_fingerprint: str) -> SaveResult | None: ...
    def get_artifact_head(self, owner_id: str, investigation_id: str, artifact_id: str) -> AuthorRevision | None: ...
    def get_revision(self, owner_id: str, investigation_id: str, artifact_id: str, revision_id: str) -> AuthorRevision: ...
    def list_revisions(self, owner_id: str, investigation_id: str, artifact_id: str) -> Sequence[AuthorRevision]: ...
    def get_snapshot(self, owner_id: str, investigation_id: str, snapshot_id: str) -> FrozenResearchSourceSnapshot: ...
    def list_projection_jobs(self, owner_id: str, investigation_id: str, artifact_id: str | None = None) -> Sequence[ProjectionJob]: ...
    def claim_projection_job(self, job_id: str, worker_id: str, lease_id: str, now: str, lease_expires_at: str) -> ProjectionJob: ...
    def complete_projection_job(self, job_id: str, lease_id: str, now: str, output_hash: str) -> ProjectionJob: ...
    def fail_projection_job(self, job_id: str, lease_id: str, now: str, failure_code: str, safe_message: str) -> ProjectionJob: ...
    def retry_projection_job(self, job_id: str, now: str) -> ProjectionJob: ...
    def recover_expired_jobs(self, now: str) -> int: ...
