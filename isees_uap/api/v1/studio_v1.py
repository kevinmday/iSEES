"""Governed authenticated HTTP boundary for authoritative STUDIO V1 revisions."""
from __future__ import annotations

import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Body, Depends, Path, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from isees_uap.api.v1.investigations import repository as investigation_repository
from isees_uap.authentication.principal import (
    AuthenticatedPrincipal, require_authenticated_principal,
    require_csrf_protected_principal,
)
from isees_uap.investigations.authority import PersistedInvestigationAuthority
from isees_uap.studio.v1.application import PrivateStudioV1Application
from isees_uap.studio.v1.lifecycle import LifecycleState, PrivateStudioV1LifecycleOwner
from isees_uap.studio.v1.persistence import (
    FailureCode, ProjectionSpecification, SaveCommand, StudioV1Failure,
)
from isees_uap.studio.v1.schemas import (
    ArtifactIdentity, AuthorRevision, FrozenResearchSourceSnapshot, Identity,
    SemanticDocument, Sha256, SnapshotReference, UtcTimestamp, WorkingDraftState,
)

router = APIRouter(
    prefix="/api/v1/investigations/{investigation_id}/studio-v1/artifacts",
    tags=["studio-v1-author"],
)
IdentityPath = Annotated[str, Path(min_length=1, max_length=300, pattern=r".*\S.*")]


class StudioV1ApiError(Exception):
    def __init__(self, code: str, message: str, status_code: int):
        super().__init__(message)
        self.code, self.status_code = code, status_code


class StrictRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ArtifactInput(StrictRequest):
    artifactId: Identity
    investigationId: Identity
    profile: Literal[
        "INVESTIGATION_REPORT", "EXECUTIVE_BRIEF", "SCIENTIFIC_PAPER",
        "INTENTION_HYPOTHESIS_ASSESSMENT",
    ]
    profileCapability: Literal["ADMITTED_UNVERIFIED", "VERIFIED_AVAILABLE"]
    lifecycleClassification: Literal["CANDIDATE_KNOWLEDGE"]
    createdAt: UtcTimestamp
    currentSavedRevisionId: Identity | None = None
    workingDraft: WorkingDraftState


class RevisionInput(StrictRequest):
    artifactId: Identity
    revisionId: Identity
    revisionNumber: int = Field(ge=1)
    parentRevisionId: Identity | None = None
    semanticContent: SemanticDocument
    contentHash: Sha256
    sourceSnapshots: tuple[SnapshotReference, ...] = Field(max_length=2000)
    profile: Literal[
        "INVESTIGATION_REPORT", "EXECUTIVE_BRIEF", "SCIENTIFIC_PAPER",
        "INTENTION_HYPOTHESIS_ASSESSMENT",
    ]
    profileVersion: Identity
    createdAt: UtcTimestamp
    immutableStatus: Literal["IMMUTABLE_SAVED_REVISION"]


class ProjectionInput(StrictRequest):
    format: Literal[
        "PDF", "DOCX", "HTML", "LATEX", "BIBLIOGRAPHY_MANIFEST",
        "SOURCE_PROVENANCE_MANIFEST",
    ]
    templateProfileVersion: Identity
    rendererVersion: Identity
    configurationHash: Sha256
    priorSuccessfulProjectionId: Identity | None = None


class SaveAuthorRequest(StrictRequest):
    artifact: ArtifactInput
    revision: RevisionInput
    snapshots: tuple[FrozenResearchSourceSnapshot, ...] = Field(max_length=2000)
    projections: tuple[ProjectionInput, ...] = Field(max_length=100)
    expectedHeadRevisionId: Identity | None = None
    idempotencyKey: str = Field(min_length=1, max_length=200)


class SaveAuthorResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    artifactId: str
    revisionId: str
    revisionNumber: int
    projectionIds: list[str]
    replayed: bool


class ArtifactHeadResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    artifactId: str
    currentRevisionId: str | None
    currentRevisionNumber: int | None
    contentHash: str | None
    savedAt: str | None


class ArtifactDiscoveryItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    artifactId: str
    investigationId: str
    ownerPrincipalId: str
    profile: str
    lifecycleClassification: str
    createdAt: str
    currentRevisionId: str | None
    currentRevisionNumber: int | None
    contentHash: str | None
    savedAt: str | None


class ArtifactDiscoveryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    items: list[ArtifactDiscoveryItem]


class RevisionMetadata(BaseModel):
    model_config = ConfigDict(extra="forbid")
    revisionId: str
    revisionNumber: int
    parentRevisionId: str | None
    contentHash: str
    savedAt: str
    sourceSnapshots: list[dict[str, str]]


class RevisionListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    artifactId: str
    items: list[RevisionMetadata]


class RevisionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    artifactId: str
    revision: AuthorRevision


class ProjectionStatus(BaseModel):
    model_config = ConfigDict(extra="forbid")
    projectionId: str
    format: str
    parentRevisionId: str
    state: str
    failureCategory: str | None = None
    outputHash: str | None = None


class ProjectionStatusResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    artifactId: str
    revisionId: str
    items: list[ProjectionStatus]


def _owned(investigation_id: str, principal: AuthenticatedPrincipal, parent_repo) -> str:
    PersistedInvestigationAuthority(parent_repo).require_owned(
        account_id=principal.account_id, investigation_id=investigation_id)
    return principal.account_id


def owned_read_principal(
    investigation_id: IdentityPath,
    principal: AuthenticatedPrincipal = Depends(require_authenticated_principal),
    parent_repo=Depends(investigation_repository),
) -> str:
    return _owned(investigation_id, principal, parent_repo)


def owned_mutation_principal(
    investigation_id: IdentityPath,
    principal: AuthenticatedPrincipal = Depends(require_csrf_protected_principal),
    parent_repo=Depends(investigation_repository),
) -> str:
    return _owned(investigation_id, principal, parent_repo)


def private_ready_facade(request: Request) -> PrivateStudioV1Application:
    owner = getattr(request.app.state, "private_studio_v1_lifecycle_owner", None)
    if not isinstance(owner, PrivateStudioV1LifecycleOwner) or owner.state is not LifecycleState.READY:
        raise StudioV1ApiError("STUDIO_V1_UNAVAILABLE", "Studio V1 is unavailable", 503)
    try:
        return owner.facade()
    except Exception as exc:
        raise StudioV1ApiError("STUDIO_V1_UNAVAILABLE", "Studio V1 is unavailable", 503) from exc


def _parse(payload: object, owner: str, investigation_id: str,
           route_artifact_id: str | None) -> SaveCommand:
    try:
        value = SaveAuthorRequest.model_validate(payload)
        if value.artifact.investigationId != investigation_id:
            raise StudioV1ApiError("ROUTE_PAYLOAD_MISMATCH", "Request identity does not match the route", 422)
        if route_artifact_id is not None and value.artifact.artifactId != route_artifact_id:
            raise StudioV1ApiError("ROUTE_PAYLOAD_MISMATCH", "Request identity does not match the route", 422)
        if value.revision.artifactId != value.artifact.artifactId:
            raise StudioV1ApiError("ROUTE_PAYLOAD_MISMATCH", "Request identity does not match the route", 422)
        artifact = ArtifactIdentity.model_validate({**value.artifact.model_dump(),
                                                     "authorPrincipalId": owner})
        revision = AuthorRevision.model_validate({**value.revision.model_dump(),
                                                   "authorPrincipalId": owner})
        if any(snapshot.investigationId != investigation_id for snapshot in value.snapshots):
            raise StudioV1ApiError("ROUTE_PAYLOAD_MISMATCH", "Request identity does not match the route", 422)
        return SaveCommand(
            artifact=artifact, revision=revision, snapshots=value.snapshots,
            projections=tuple(ProjectionSpecification(
                format=item.format,
                template_profile_version=item.templateProfileVersion,
                renderer_version=item.rendererVersion,
                configuration_hash=item.configurationHash,
                prior_successful_projection_id=item.priorSuccessfulProjectionId,
            ) for item in value.projections),
            expected_head_revision_id=value.expectedHeadRevisionId,
            idempotency_key=value.idempotencyKey, request_fingerprint="server-owned",
            command_timestamp="server-owned",
        )
    except StudioV1ApiError:
        raise
    except ValidationError as exc:
        locations = {tuple(str(part) for part in error["loc"]) for error in exc.errors()}
        if any("snapshotHash" in location for location in locations):
            code, message = "STUDIO_V1_SNAPSHOT_HASH_MISMATCH", "Studio V1 snapshot hash is invalid"
        elif any("contentHash" in location for location in locations):
            code, message = "STUDIO_V1_CONTENT_HASH_MISMATCH", "Studio V1 content hash is invalid"
        else:
            code, message = "INVALID_STUDIO_V1_CONTRACT", "Studio V1 request is invalid"
        raise StudioV1ApiError(code, message, 422) from exc
    except (ValueError, TypeError) as exc:
        raise StudioV1ApiError("INVALID_STUDIO_V1_CONTRACT", "Studio V1 request is invalid", 422) from exc


def _save(payload, owner, investigation_id, artifact_id, facade, *, initial):
    command = _parse(payload, owner, investigation_id, artifact_id)
    if initial and (command.expected_head_revision_id is not None or command.revision.revisionNumber != 1):
        raise StudioV1ApiError("INVALID_STUDIO_V1_CONTRACT", "Initial revision contract is invalid", 422)
    if not initial and command.expected_head_revision_id is None:
        raise StudioV1ApiError("EXPECTED_HEAD_REQUIRED", "Expected head revision is required", 422)
    result = facade.save(owner, investigation_id, command)
    return SaveAuthorResponse(
        artifactId=result.artifact_id, revisionId=result.revision_id,
        revisionNumber=result.revision_number,
        projectionIds=[job_id.removeprefix("job-") for job_id in result.job_ids],
        replayed=result.replayed,
    )


@router.post("", response_model=SaveAuthorResponse, status_code=status.HTTP_201_CREATED)
def create_author_artifact(
    investigation_id: IdentityPath, payload: object = Body(...),
    owner: str = Depends(owned_mutation_principal),
    facade: PrivateStudioV1Application = Depends(private_ready_facade),
):
    return _save(payload, owner, investigation_id, None, facade, initial=True)


@router.get("", response_model=ArtifactDiscoveryResponse)
def discover_author_artifacts(
    investigation_id: IdentityPath,
    owner: str = Depends(owned_read_principal),
    facade: PrivateStudioV1Application = Depends(private_ready_facade),
):
    items = []
    for identity in facade.list_artifact_identities(owner, investigation_id):
        head = facade.get_artifact_head(owner, investigation_id, identity.artifactId)
        items.append(ArtifactDiscoveryItem(
            artifactId=identity.artifactId, investigationId=identity.investigationId,
            ownerPrincipalId=identity.authorPrincipalId, profile=identity.profile,
            lifecycleClassification=identity.lifecycleClassification, createdAt=identity.createdAt,
            currentRevisionId=head.revisionId if head else None,
            currentRevisionNumber=head.revisionNumber if head else None,
            contentHash=head.contentHash if head else None,
            savedAt=head.createdAt if head else None,
        ))
    return ArtifactDiscoveryResponse(items=items)


@router.post("/{artifact_id}/revisions", response_model=SaveAuthorResponse,
             status_code=status.HTTP_201_CREATED)
def save_author_revision(
    investigation_id: IdentityPath, artifact_id: IdentityPath, payload: object = Body(...),
    owner: str = Depends(owned_mutation_principal),
    facade: PrivateStudioV1Application = Depends(private_ready_facade),
):
    return _save(payload, owner, investigation_id, artifact_id, facade, initial=False)


def _metadata(revision: AuthorRevision) -> RevisionMetadata:
    return RevisionMetadata(
        revisionId=revision.revisionId, revisionNumber=revision.revisionNumber,
        parentRevisionId=revision.parentRevisionId, contentHash=revision.contentHash,
        savedAt=revision.createdAt,
        sourceSnapshots=[item.model_dump() for item in revision.sourceSnapshots],
    )


@router.get("/{artifact_id}", response_model=ArtifactHeadResponse)
def get_author_artifact(
    investigation_id: IdentityPath, artifact_id: IdentityPath,
    owner: str = Depends(owned_read_principal),
    facade: PrivateStudioV1Application = Depends(private_ready_facade),
):
    identity = facade.get_artifact_identity(owner, investigation_id, artifact_id)
    head = facade.get_artifact_head(owner, investigation_id, artifact_id)
    return ArtifactHeadResponse(
        artifactId=identity.artifactId,
        currentRevisionId=head.revisionId if head else None,
        currentRevisionNumber=head.revisionNumber if head else None,
        contentHash=head.contentHash if head else None,
        savedAt=head.createdAt if head else None,
    )


@router.get("/{artifact_id}/revisions", response_model=RevisionListResponse)
def list_author_revisions(
    investigation_id: IdentityPath, artifact_id: IdentityPath,
    owner: str = Depends(owned_read_principal),
    facade: PrivateStudioV1Application = Depends(private_ready_facade),
):
    return RevisionListResponse(artifactId=artifact_id, items=[
        _metadata(item) for item in facade.list_revisions(owner, investigation_id, artifact_id)])


@router.get("/{artifact_id}/revisions/{revision_id}", response_model=RevisionResponse,
            response_model_exclude_none=True)
def get_author_revision(
    investigation_id: IdentityPath, artifact_id: IdentityPath, revision_id: IdentityPath,
    owner: str = Depends(owned_read_principal),
    facade: PrivateStudioV1Application = Depends(private_ready_facade),
):
    try:
        revision = facade.get_revision(owner, investigation_id, artifact_id, revision_id)
    except StudioV1Failure as exc:
        if exc.code is FailureCode.REVISION_IDENTITY_CONFLICT:
            raise StudioV1ApiError("STUDIO_V1_REVISION_NOT_FOUND",
                                   "Studio V1 revision was not found", 404) from exc
        raise
    return RevisionResponse(artifactId=artifact_id, revision=revision)


@router.get("/{artifact_id}/revisions/{revision_id}/source-snapshots/{snapshot_id}",
            response_model=FrozenResearchSourceSnapshot)
def get_revision_source_snapshot(
    investigation_id: IdentityPath, artifact_id: IdentityPath, revision_id: IdentityPath,
    snapshot_id: IdentityPath,
    owner: str = Depends(owned_read_principal),
    facade: PrivateStudioV1Application = Depends(private_ready_facade),
):
    revision = facade.get_revision(owner, investigation_id, artifact_id, revision_id)
    if snapshot_id not in {reference.snapshotId for reference in revision.sourceSnapshots}:
        raise StudioV1ApiError("STUDIO_V1_SNAPSHOT_NOT_FOUND",
                               "Studio V1 source snapshot was not found", 404)
    return facade.get_frozen_snapshot(owner, investigation_id, snapshot_id)


@router.get("/{artifact_id}/revisions/{revision_id}/projections",
            response_model=ProjectionStatusResponse)
def get_projection_statuses(
    investigation_id: IdentityPath, artifact_id: IdentityPath, revision_id: IdentityPath,
    owner: str = Depends(owned_read_principal),
    facade: PrivateStudioV1Application = Depends(private_ready_facade),
):
    jobs = facade.list_projection_jobs(owner, investigation_id, artifact_id, revision_id)
    return ProjectionStatusResponse(artifactId=artifact_id, revisionId=revision_id, items=[
        ProjectionStatus(
            projectionId=job.projection_id, format=job.format,
            parentRevisionId=job.revision_id, state=job.state,
            failureCategory=job.failure_code, outputHash=job.output_hash,
        ) for job in jobs])


_FAILURES = {
    FailureCode.ARTIFACT_NOT_FOUND: (404, "STUDIO_V1_ARTIFACT_NOT_FOUND", "Studio V1 artifact was not found"),
    FailureCode.REVISION_IDENTITY_CONFLICT: (422, "INVALID_STUDIO_V1_CONTRACT", "Studio V1 revision contract is invalid"),
    FailureCode.REVISION_CONFLICT: (409, "STUDIO_V1_REVISION_CONFLICT", "Expected head revision is stale"),
    FailureCode.IDEMPOTENCY_KEY_REUSE: (409, "IDEMPOTENCY_KEY_REUSE", "Idempotency key was used for a different request"),
    FailureCode.CONTENT_HASH_MISMATCH: (422, "STUDIO_V1_HASH_MISMATCH", "Studio V1 content or snapshot hash is invalid"),
    FailureCode.SNAPSHOT_HASH_MISMATCH: (422, "STUDIO_V1_SNAPSHOT_HASH_MISMATCH", "Studio V1 snapshot hash is invalid"),
    FailureCode.SNAPSHOT_NOT_FOUND: (422, "STUDIO_V1_SNAPSHOT_NOT_FOUND", "Referenced Studio V1 snapshot was not found"),
    FailureCode.SNAPSHOT_IMMUTABILITY_CONFLICT: (409, "STUDIO_V1_SNAPSHOT_IMMUTABLE", "Frozen snapshot identity conflicts"),
    FailureCode.DUPLICATE_PROJECTION_SPECIFICATION: (422, "INVALID_STUDIO_V1_CONTRACT", "Projection specification is invalid"),
    FailureCode.PERSISTENCE_UNAVAILABLE: (503, "STUDIO_V1_PERSISTENCE_UNAVAILABLE", "Studio V1 persistence is unavailable"),
    FailureCode.INCOMPATIBLE_SCHEMA_VERSION: (503, "STUDIO_V1_INCOMPATIBLE_SCHEMA", "Studio V1 schema is incompatible"),
    FailureCode.APPLICATION_NOT_STARTED: (503, "STUDIO_V1_UNAVAILABLE", "Studio V1 is unavailable"),
    FailureCode.APPLICATION_CLOSED: (503, "STUDIO_V1_UNAVAILABLE", "Studio V1 is unavailable"),
}


async def studio_v1_error_handler(request: Request, error: Exception) -> JSONResponse:
    request_id = request.headers.get("X-Request-Id") or str(uuid.uuid4())
    if isinstance(error, StudioV1ApiError):
        status_code, code, message = error.status_code, error.code, str(error)
    elif isinstance(error, StudioV1Failure):
        status_code, code, message = _FAILURES.get(
            error.code, (500, "STUDIO_V1_INTERNAL_FAILURE", "Studio V1 request failed"))
    else:
        status_code, code, message = 500, "STUDIO_V1_INTERNAL_FAILURE", "Studio V1 request failed"
    return JSONResponse(status_code=status_code, content={"error": {
        "code": code, "message": message, "requestId": request_id,
    }}, headers={"X-Request-Id": request_id})
