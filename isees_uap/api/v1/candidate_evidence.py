from __future__ import annotations

import hashlib
import json
import uuid
import os
from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Path, Query, Request, UploadFile
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from isees_uap.candidate_evidence.blob_storage import DEFAULT_MAX_UPLOAD_BYTES, LocalContentAddressedBlobStore
from isees_uap.candidate_evidence.config import candidate_blob_root, candidate_database_path
from isees_uap.candidate_evidence.errors import CandidateEvidenceError, UploadTooLarge, WebDiscoveryAlreadyCaptured
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
    AuthenticatedPrincipal, GuestPrincipal, authentication_repository, settings,
    require_authenticated_principal, require_csrf_protected_guest,
    require_csrf_protected_principal,
)
from isees_uap.authentication.config import AuthenticationSettings
from isees_uap.authentication.guest import GuestAuthority
from isees_uap.authentication.models import GuestSearchOperationState
from isees_uap.investigations.authority import PersistedInvestigationAuthority
from isees_uap.api.v1.investigations import repository as investigation_repository
from isees_uap.candidate_evidence.upload_policy import sanitize_display_filename, validate_media
from isees_uap.candidate_evidence.web_discovery_runtime import (
    WebDiscoveryRuntimeError, WebDiscoverySearchRuntime,
)
from isees_uap.candidate_evidence.web_discovery import normalize_query
from isees_uap.candidate_evidence.web_discovery_capture import WebDiscoveryCaptureService
from isees_uap.research_sources import SQLiteResearchSourceRepository, research_source_database_path
from isees_uap.research_sources.sqlite_repository import ResearchSourceConflict
from isees_uap.candidate_evidence.web_discovery_schemas import (
    GuestWebDiscoverySearchCommand,
    WebDiscoveryCaptureCommand, WebDiscoveryCaptureResponse,
    WebDiscoverySearchCommand, WebDiscoverySearchResponse,
)

router = APIRouter(prefix="/api/v1/investigations/{investigation_id}/candidate-evidence", tags=["candidate-evidence"])
native_case_router = APIRouter(prefix="/api/v1/native-case-drafts", tags=["native-case-drafts"])
guest_web_discovery_router = APIRouter(
    prefix="/api/v1/guest/web-discovery", tags=["guest-web-discovery"])
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


@lru_cache(maxsize=1)
def web_discovery_runtime() -> WebDiscoverySearchRuntime:
    """Process-owned ephemeral search authority; overrideable/resettable in tests."""
    return WebDiscoverySearchRuntime()

@lru_cache(maxsize=1)
def web_discovery_research_repository() -> SQLiteResearchSourceRepository:
    return SQLiteResearchSourceRepository(research_source_database_path())


def web_discovery_capture_service(
    svc: CandidateEvidenceService = Depends(service),
    runtime: WebDiscoverySearchRuntime = Depends(web_discovery_runtime),
    research_sources: SQLiteResearchSourceRepository = Depends(web_discovery_research_repository),
) -> WebDiscoveryCaptureService:
    return WebDiscoveryCaptureService(svc, runtime, research_sources)


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


@router.post("/web-discovery/searches", response_model=WebDiscoverySearchResponse)
def search_web_discovery(
    investigation_id: InvestigationPath,
    command: WebDiscoverySearchCommand,
    owner: str = Depends(owned_mutation_principal),
    parent_repo=Depends(investigation_repository),
    runtime: WebDiscoverySearchRuntime = Depends(web_discovery_runtime),
):
    if command.investigationId != investigation_id:
        return _web_discovery_error("INVESTIGATION_MISMATCH", "Path and command Investigation IDs differ", 412)
    aggregate = parent_repo.get_empty_aggregate(
        investigation_id=investigation_id, owner_principal_id=owner)
    if aggregate is None:
        from isees_uap.investigations.errors import InvestigationNotFound
        raise InvestigationNotFound("Investigation was not found")
    expected_manifold = f"investigation-aggregate:{aggregate.revision}"
    if command.expectedInvestigationRevision != aggregate.revision:
        return _web_discovery_error("REVISION_CONFLICT", "Expected Investigation revision is stale", 409)
    if command.manifoldRevisionId != expected_manifold:
        return _web_discovery_error("REVISION_CONFLICT", "Manifold revision is stale", 409)
    try:
        result = runtime.search(principal_id=owner, command=command)
    except WebDiscoveryRuntimeError as error:
        return _web_discovery_error(error.code, str(error), error.status_code)
    return JSONResponse(
        status_code=result.status_code,
        content=result.response.model_dump(mode="json", exclude_none=False),
    )


@router.post("/web-discovery/captures", response_model=WebDiscoveryCaptureResponse)
def capture_web_discovery(
    investigation_id: InvestigationPath,
    command: WebDiscoveryCaptureCommand,
    owner: str = Depends(owned_mutation_principal),
    parent_repo=Depends(investigation_repository),
    capture_service: WebDiscoveryCaptureService = Depends(web_discovery_capture_service),
):
    if command.investigationId != investigation_id:
        return _web_discovery_error("INVESTIGATION_MISMATCH", "Path and command Investigation IDs differ", 412)
    aggregate = parent_repo.get_empty_aggregate(
        investigation_id=investigation_id, owner_principal_id=owner)
    if aggregate is None:
        from isees_uap.investigations.errors import InvestigationNotFound
        raise InvestigationNotFound("Investigation was not found")
    if command.expectedInvestigationRevision != aggregate.revision:
        return _web_discovery_error("REVISION_CONFLICT", "Expected Investigation revision is stale", 409)
    if command.manifoldRevisionId != f"investigation-aggregate:{aggregate.revision}":
        return _web_discovery_error("REVISION_CONFLICT", "Manifold revision is stale", 409)
    try:
        result, replayed = capture_service.capture(principal_id=owner, command=command)
    except WebDiscoveryAlreadyCaptured as error:
        return _web_discovery_error(
            error.code, str(error),
            409, existing_candidate_id=error.existing_candidate_id,
        )
    except WebDiscoveryRuntimeError as error:
        return _web_discovery_error(error.code, str(error), error.status_code)
    except (ResearchSourceConflict, OSError) as error:
        return _web_discovery_error("RESEARCH_INBOX_PUBLICATION_FAILED", str(error), 503)
    return JSONResponse(
        status_code=200 if replayed else 201,
        content=result.model_dump(mode="json", exclude_none=False),
    )


def _web_discovery_error(
    code: str, message: str, status_code: int, *, existing_candidate_id: str | None = None,
) -> JSONResponse:
    error = {"code": code, "message": message}
    if existing_candidate_id is not None:
        error["existingCandidateId"] = existing_candidate_id
    return JSONResponse(status_code=status_code, content={"error": error})


def _guest_fingerprint(command: GuestWebDiscoverySearchCommand) -> bytes:
    # Client correlation identifiers are deliberately excluded: equivalent work
    # cannot evade the duplicate-dispatch guard by changing a key or operation ID.
    governed = {
        "queryNormalizationVersion": "web-discovery-query-normalization/v1",
        "normalizedQuery": normalize_query(command.query),
        "resultLimit": command.resultLimit,
        "executionPolicy": command.executionPolicy.model_dump(mode="json"),
    }
    encoded = json.dumps(governed, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(encoded.encode("utf-8")).digest()


def _guest_operation_id(guest_id: str, client_operation_id: str) -> str:
    digest = hashlib.sha256(
        (guest_id + "\0" + client_operation_id).encode("utf-8")
    ).hexdigest()
    return f"gws_{digest[:40]}"


def _guest_operation_response(operation, *, status_code: int | None = None) -> JSONResponse:
    if status_code is None:
        status_code = 503 if operation.state is GuestSearchOperationState.UNKNOWN else 202
    return JSONResponse(status_code=status_code, content={
        "schemaVersion": "guest-web-discovery-outcome/v1",
        "operationId": operation.operation_id,
        "operationState": operation.state.value,
        "status": "PENDING" if operation.state in {
            GuestSearchOperationState.RESERVED, GuestSearchOperationState.DISPATCHING,
        } else operation.state.value,
        "resultCount": 0,
        "results": [],
        "researcherCharge": "0.00",
        "billingTriggered": False,
        "providerCreditsConsumed": 1 if operation.state in {
            GuestSearchOperationState.DISPATCHING, GuestSearchOperationState.UNKNOWN,
            GuestSearchOperationState.COMPLETED,
        } else 0,
        "providerCreditUsage": (
            "UNKNOWN" if operation.state is GuestSearchOperationState.UNKNOWN
            else "ACTUAL" if operation.state is GuestSearchOperationState.COMPLETED
            else "ESTIMATED" if operation.state is GuestSearchOperationState.DISPATCHING
            else "ZERO"
        ),
        "effects": {name: "NONE" for name in (
            "candidateEvidence", "researchInbox", "candidateKnowledge", "canon",
            "graph", "manifold", "resolve", "rex",
        )},
    })


@guest_web_discovery_router.post("/searches")
def search_guest_web_discovery(
    request: Request,
    command: GuestWebDiscoverySearchCommand,
    guest: GuestPrincipal = Depends(require_csrf_protected_guest),
    repo=Depends(authentication_repository),
    config: AuthenticationSettings = Depends(settings),
    runtime: WebDiscoverySearchRuntime = Depends(web_discovery_runtime),
):
    # Origin is independently checked for this cost-bearing operation.  Browsers
    # that omit it do not receive authority merely from possession of cookies.
    if config.public_app_origin is None or request.headers.get("origin") != config.public_app_origin:
        from isees_uap.authentication.errors import CsrfRejected
        raise CsrfRejected("Request origin is not permitted")
    if not config.guest_provider_dispatch_enabled or not runtime.guest_dispatch_available:
        return _web_discovery_error(
            "GUEST_SEARCH_UNAVAILABLE", "Guest Basic Search is unavailable", 503)
    authority = GuestAuthority(repo, config)
    try:
        operation = authority.reserve(
            guest_id=guest.guest_id,
            operation_id=_guest_operation_id(guest.guest_id, command.operationId),
            idempotency_key=command.idempotencyKey,
            request_fingerprint=_guest_fingerprint(command),
        )
    except ValueError as error:
        mapping = {
            "IDEMPOTENCY_CONFLICT": (409, "IDEMPOTENCY_CONFLICT"),
            "GUEST_ALLOWANCE_EXHAUSTED": (429, "GUEST_ALLOWANCE_EXHAUSTED"),
            "GLOBAL_BUDGET_EXHAUSTED": (503, "GUEST_GLOBAL_BUDGET_EXHAUSTED"),
            "GUEST_NOT_AUTHORIZED": (401, "AUTHENTICATION_REQUIRED"),
        }
        status_code, code = mapping.get(str(error), (503, "GUEST_SEARCH_UNAVAILABLE"))
        return _web_discovery_error(code, "Guest Basic Search is unavailable", status_code)

    if operation.state is not GuestSearchOperationState.RESERVED:
        if operation.state is GuestSearchOperationState.COMPLETED:
            try:
                replay = runtime.search_guest(
                    guest_id=guest.guest_id, operation_id=operation.operation_id, command=command)
            except WebDiscoveryRuntimeError:
                return _guest_operation_response(operation, status_code=410)
            return _project_guest_search(replay, operation.state)
        return _guest_operation_response(operation)

    try:
        operation = authority.mark_dispatching(operation.operation_id, guest.guest_id)
    except ValueError:
        # Another worker claimed the durable reservation.  It alone may dispatch.
        return _guest_operation_response(operation)
    try:
        result = runtime.search_guest(
            guest_id=guest.guest_id, operation_id=operation.operation_id, command=command)
    except Exception:
        # Once DISPATCHING is durable, provider execution is ambiguous.  Retain the
        # charge and prohibit automatic retry under either this or another key.
        unknown = authority.mark_unknown(operation.operation_id, guest.guest_id)
        return _guest_operation_response(unknown, status_code=503)
    completed = authority.mark_completed(operation.operation_id, guest.guest_id)
    return _project_guest_search(result, completed.state)


def _project_guest_search(result, operation_state: GuestSearchOperationState) -> JSONResponse:
    source = (result.response.model_dump(mode="json", exclude_none=False)
              if hasattr(result.response, "model_dump") else result.response)
    receipt = source["receipt"]
    return JSONResponse(status_code=result.status_code, content=jsonable_encoder({
        "schemaVersion": "guest-web-discovery-outcome/v1",
        "operationId": source["operationId"],
        "operationState": operation_state.value,
        "status": source["status"],
        "normalizedQuery": source["normalizedQuery"],
        "queryNormalizationVersion": source["queryNormalizationVersion"],
        "runtimeStatus": source["runtimeStatus"],
        "adapterId": source["adapterId"], "adapterVersion": source["adapterVersion"],
        "startedAt": source["startedAt"], "completedAt": source["completedAt"],
        "expiresAt": source["expiresAt"], "resultCount": source["resultCount"],
        "results": source["results"], "providerAttribution": source["providerAttribution"],
        "restrictions": source["restrictions"], "warnings": source["warnings"],
        "error": source["error"], "researcherCharge": receipt["researcherCharge"],
        "billingTriggered": receipt["billingTriggered"],
        "providerCreditsConsumed": receipt["providerCreditsConsumed"],
        "providerCreditUsage": receipt["providerCreditUsage"],
        "effects": {
            "candidateEvidence": "NONE", "researchInbox": receipt["researchInboxEffect"],
            "candidateKnowledge": receipt["candidateKnowledgeEffect"],
            "canon": receipt["canonEffect"], "graph": receipt["graphEffect"],
            "manifold": receipt["manifoldEffect"], "resolve": receipt["resolveEffect"],
            "rex": receipt["rexExecution"],
        },
    }))


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
