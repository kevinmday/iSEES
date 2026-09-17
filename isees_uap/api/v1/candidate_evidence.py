from __future__ import annotations

import uuid
import os
from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Path, Query, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from isees_uap.candidate_evidence.blob_storage import DEFAULT_MAX_UPLOAD_BYTES, LocalContentAddressedBlobStore
from isees_uap.candidate_evidence.config import candidate_blob_root, candidate_database_path
from isees_uap.candidate_evidence.errors import CandidateEvidenceError, UploadTooLarge
from isees_uap.candidate_evidence.schemas import (
    CuratedRepositoryCreate, DiscoveryCreate, LifecycleTransition,
    NativeCaseDraftCreate, NativeCaseDraftList, NativeCaseDraftProjection,
    NativeCaseDraftReceipt, NativeCaseDraftUpdate, DirectUploadCreate,
    ResearcherIntakeCreate, SubmissionCreate,
)
from isees_uap.candidate_evidence.service import CandidateEvidenceService
from isees_uap.candidate_evidence.sqlite_repository import SQLiteCandidateEvidenceRepository
from isees_uap.candidate_evidence.native_case_service import NativeCaseDraftService
from isees_uap.candidate_evidence.sqlite_native_case_repository import SQLiteNativeCaseDraftRepository
from isees_uap.authentication.principal import (
    AuthenticatedPrincipal, require_authenticated_principal,
    require_csrf_protected_principal,
)
from isees_uap.investigations.authority import PersistedInvestigationAuthority
from isees_uap.api.v1.investigations import repository as investigation_repository
from isees_uap.candidate_evidence.upload_policy import sanitize_display_filename, validate_media

router = APIRouter(prefix="/api/v1/investigations/{investigation_id}/candidate-evidence", tags=["candidate-evidence"])
native_case_router = APIRouter(prefix="/api/v1/native-case-drafts", tags=["native-case-drafts"])
InvestigationPath = Annotated[str, Path(min_length=1, pattern=r".*\S.*")]
CandidatePath = Annotated[str, Path(min_length=1, pattern=r".*\S.*")]


@lru_cache(maxsize=1)
def repository() -> SQLiteCandidateEvidenceRepository:
    return SQLiteCandidateEvidenceRepository(candidate_database_path())


def service(repo: SQLiteCandidateEvidenceRepository = Depends(repository)) -> CandidateEvidenceService:
    return CandidateEvidenceService(repo)


@lru_cache(maxsize=1)
def blob_repository() -> LocalContentAddressedBlobStore:
    return LocalContentAddressedBlobStore(candidate_blob_root())


def maximum_upload_bytes() -> int:
    raw = os.environ.get("ISEES_CANDIDATE_MAX_UPLOAD_BYTES")
    if raw is None:
        return DEFAULT_MAX_UPLOAD_BYTES
    try:
        value = int(raw)
    except ValueError as error:
        raise RuntimeError("ISEES_CANDIDATE_MAX_UPLOAD_BYTES must be an integer") from error
    if value <= 0:
        raise RuntimeError("ISEES_CANDIDATE_MAX_UPLOAD_BYTES must be positive")
    return value


@lru_cache(maxsize=1)
def native_case_repository() -> SQLiteNativeCaseDraftRepository:
    return SQLiteNativeCaseDraftRepository(candidate_database_path())


def native_case_service(
    repo: SQLiteNativeCaseDraftRepository = Depends(native_case_repository),
) -> NativeCaseDraftService:
    return NativeCaseDraftService(repo)


def _require_optional_owned_investigation(
    investigation_id: str | None, principal_id: str, parent_repo,
) -> None:
    if investigation_id is not None:
        PersistedInvestigationAuthority(parent_repo).require_owned(
            account_id=principal_id, investigation_id=investigation_id)


def _owner(investigation_id: str, principal: AuthenticatedPrincipal,
           parent_repo) -> str:
    PersistedInvestigationAuthority(parent_repo).require_owned(
        account_id=principal.account_id, investigation_id=investigation_id)
    return principal.account_id


def owned_read_principal(investigation_id: InvestigationPath,
                         principal: AuthenticatedPrincipal = Depends(require_authenticated_principal),
                         parent_repo=Depends(investigation_repository)) -> str:
    return _owner(investigation_id, principal, parent_repo)


def owned_mutation_principal(investigation_id: InvestigationPath,
                             principal: AuthenticatedPrincipal = Depends(require_csrf_protected_principal),
                             parent_repo=Depends(investigation_repository)) -> str:
    return _owner(investigation_id, principal, parent_repo)


def _response(candidate: dict, replayed: bool) -> JSONResponse:
    return JSONResponse(status_code=200 if replayed else 201, content=candidate)


@router.post("/submissions")
def create_submission(investigation_id: InvestigationPath, command: SubmissionCreate, owner: str = Depends(owned_mutation_principal), svc: CandidateEvidenceService = Depends(service)):
    candidate, replayed = svc.create(investigation_id, command.model_dump(exclude_none=True), owner, "SUBMISSION")
    return _response(candidate, replayed)


@router.post("/researcher-intake")
def create_researcher_intake(
    investigation_id: InvestigationPath, command: ResearcherIntakeCreate,
    owner: str = Depends(owned_mutation_principal), svc: CandidateEvidenceService = Depends(service),
    parent_repo=Depends(investigation_repository),
):
    aggregate = parent_repo.get_empty_aggregate(
        investigation_id=investigation_id, owner_principal_id=owner)
    if aggregate is None:
        from isees_uap.investigations.errors import InvestigationNotFound
        raise InvestigationNotFound("Investigation was not found")
    values = command.model_dump(exclude_none=True)
    normalized = command.normalized_url()
    if normalized is not None:
        from urllib.parse import urlsplit
        values.update(normalizedUrl=normalized, sourceDomain=urlsplit(normalized).hostname)
    candidate, replayed = svc.intake(
        investigation_id, values, owner, aggregate.revision)
    return _response(candidate, replayed)


@router.post("/direct-uploads")
def create_direct_upload(
    request: Request,
    investigation_id: InvestigationPath,
    schemaVersion: Annotated[str, Form()],
    investigationId: Annotated[str, Form()],
    expectedInvestigationRevision: Annotated[int, Form()],
    manifoldRevisionId: Annotated[str, Form()],
    operationId: Annotated[str, Form()],
    idempotencyKey: Annotated[str, Form()],
    file: Annotated[UploadFile, File()],
    title: Annotated[str | None, Form()] = None,
    noteText: Annotated[str | None, Form()] = None,
    owner: str = Depends(owned_mutation_principal),
    svc: CandidateEvidenceService = Depends(service),
    parent_repo=Depends(investigation_repository),
    blobs: LocalContentAddressedBlobStore = Depends(blob_repository),
):
    try:
        command = DirectUploadCreate.model_validate({
            "schemaVersion": schemaVersion, "investigationId": investigationId,
            "expectedInvestigationRevision": expectedInvestigationRevision,
            "manifoldRevisionId": manifoldRevisionId, "operationId": operationId,
            "idempotencyKey": idempotencyKey, "title": title, "noteText": noteText,
        })
    except ValidationError as error:
        raise RequestValidationError(error.errors()) from error
    aggregate = parent_repo.get_empty_aggregate(
        investigation_id=investigation_id, owner_principal_id=owner)
    if aggregate is None:
        from isees_uap.investigations.errors import InvestigationNotFound
        raise InvestigationNotFound("Investigation was not found")
    limit = maximum_upload_bytes()
    content_length = request.headers.get("content-length")
    if content_length is not None:
        try:
            if int(content_length) > limit + 1024 * 1024:
                raise UploadTooLarge(f"Upload exceeds the {limit}-byte file limit")
        except ValueError:
            pass
    staged = blobs.stage(file.file, maximum_bytes=limit)
    stored = None
    try:
        policy = validate_media(staged, filename=file.filename, claimed_type=file.content_type)
        original, display = sanitize_display_filename(file.filename)
        stored = blobs.commit(staged, scope_identity=f"{owner}\0{investigation_id}")
        values = command.model_dump(exclude_none=True)
        values.update({
            "originalFilename": original, "displayFilename": display,
            "byteSize": stored.byte_size, "detectedMediaType": policy.media_type,
            "mediaCategory": policy.category, "contentSha256": stored.sha256,
            "objectReference": stored.object_reference,
            "storageIdentity": str(uuid.uuid5(uuid.NAMESPACE_URL, "\0".join((
                owner, investigation_id, command.idempotencyKey, stored.sha256,
            )))),
        })
        candidate, replayed = svc.direct_upload(
            investigation_id, values, owner, aggregate.revision)
        return _response(candidate, replayed)
    except Exception:
        if stored is None:
            blobs.discard(staged)
        elif stored.created:
            blobs.delete_for_cleanup(stored.object_reference)
        raise
    finally:
        file.file.close()


@router.post("/discovery-results")
def create_discovery(investigation_id: InvestigationPath, command: DiscoveryCreate, owner: str = Depends(owned_mutation_principal), svc: CandidateEvidenceService = Depends(service)):
    candidate, replayed = svc.create(investigation_id, command.model_dump(exclude_none=True), owner, "DISCOVERY")
    return _response(candidate, replayed)


@router.post("/curated-repository-references")
def create_curated_repository_reference(investigation_id: InvestigationPath, command: CuratedRepositoryCreate,
                                        owner: str = Depends(owned_mutation_principal), svc: CandidateEvidenceService = Depends(service)):
    candidate, replayed = svc.create(
        investigation_id, command.model_dump(exclude_none=False), owner, "CURATED_REPOSITORY"
    )
    return _response(candidate, replayed)


@router.get("")
def list_candidates(investigation_id: InvestigationPath, limit: int = Query(50, ge=1, le=100), cursor: str | None = None,
                    owner: str = Depends(owned_read_principal), svc: CandidateEvidenceService = Depends(service),
                    parent_repo=Depends(investigation_repository)):
    items, next_cursor = svc.list(investigation_id, owner, limit, cursor)
    aggregate = parent_repo.get_empty_aggregate(
        investigation_id=investigation_id, owner_principal_id=owner)
    if aggregate is None:
        from isees_uap.investigations.errors import InvestigationNotFound
        raise InvestigationNotFound("Investigation was not found")
    return {"investigationId": investigation_id,
            "investigationAggregateRevision": aggregate.revision,
            "manifoldRevisionId": f"investigation-aggregate:{aggregate.revision}",
            "items": items, "nextCursor": next_cursor}


@router.get("/{candidate_id}")
def get_candidate(investigation_id: InvestigationPath, candidate_id: CandidatePath, owner: str = Depends(owned_read_principal), svc: CandidateEvidenceService = Depends(service)):
    return svc.get(investigation_id, candidate_id, owner)


@router.post("/{candidate_id}/lifecycle-transitions")
def transition_candidate(investigation_id: InvestigationPath, candidate_id: CandidatePath, command: LifecycleTransition,
                         owner: str = Depends(owned_mutation_principal), svc: CandidateEvidenceService = Depends(service)):
    candidate, _ = svc.transition(investigation_id, candidate_id, command.model_dump(exclude_none=True), owner)
    return candidate


@native_case_router.post("", response_model=NativeCaseDraftReceipt, status_code=201)
def create_native_case_draft(
    command: NativeCaseDraftCreate,
    principal: AuthenticatedPrincipal = Depends(require_csrf_protected_principal),
    parent_repo=Depends(investigation_repository),
    svc: NativeCaseDraftService = Depends(native_case_service),
):
    _require_optional_owned_investigation(command.investigationId, principal.account_id, parent_repo)
    draft, replayed = svc.create(
        principal_id=principal.account_id, command=command.model_dump(exclude_none=False))
    return {**draft, "idempotencyDisposition": "REPLAYED" if replayed else "CREATED"}


@native_case_router.get("", response_model=NativeCaseDraftList)
def list_native_case_drafts(
    principal: AuthenticatedPrincipal = Depends(require_authenticated_principal),
    svc: NativeCaseDraftService = Depends(native_case_service),
):
    return {"schemaVersion": "native-case-draft-list/v1",
            "items": svc.list(principal_id=principal.account_id)}


@native_case_router.get("/{candidate_id}", response_model=NativeCaseDraftProjection)
def get_native_case_draft(
    candidate_id: CandidatePath,
    principal: AuthenticatedPrincipal = Depends(require_authenticated_principal),
    svc: NativeCaseDraftService = Depends(native_case_service),
):
    return svc.get(principal_id=principal.account_id, candidate_id=candidate_id)


@native_case_router.put("/{candidate_id}", response_model=NativeCaseDraftReceipt)
def update_native_case_draft(
    candidate_id: CandidatePath, command: NativeCaseDraftUpdate,
    principal: AuthenticatedPrincipal = Depends(require_csrf_protected_principal),
    parent_repo=Depends(investigation_repository),
    svc: NativeCaseDraftService = Depends(native_case_service),
):
    _require_optional_owned_investigation(command.investigationId, principal.account_id, parent_repo)
    draft, replayed = svc.update(
        principal_id=principal.account_id, candidate_id=candidate_id,
        command=command.model_dump(exclude_none=False))
    return {**draft, "idempotencyDisposition": "REPLAYED" if replayed else "UPDATED"}


async def candidate_error_handler(request: Request, error: CandidateEvidenceError) -> JSONResponse:
    request_id = request.headers.get("X-Request-Id") or str(uuid.uuid4())
    return JSONResponse(
        status_code=error.status_code,
        content={"error": {"code": error.code, "message": str(error), "requestId": request_id}},
        headers={"X-Request-Id": request_id},
    )
