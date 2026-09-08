from __future__ import annotations

import uuid
from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Request
from fastapi.responses import JSONResponse

from isees_uap.candidate_evidence.config import candidate_database_path
from isees_uap.candidate_evidence.errors import CandidateEvidenceError
from isees_uap.candidate_evidence.schemas import CuratedRepositoryCreate, DiscoveryCreate, LifecycleTransition, SubmissionCreate
from isees_uap.candidate_evidence.service import CandidateEvidenceService
from isees_uap.candidate_evidence.sqlite_repository import SQLiteCandidateEvidenceRepository
from isees_uap.authentication.principal import (
    AuthenticatedPrincipal, require_authenticated_principal,
    require_csrf_protected_principal,
)
from isees_uap.investigations.authority import PersistedInvestigationAuthority
from isees_uap.api.v1.investigations import repository as investigation_repository

router = APIRouter(prefix="/api/v1/investigations/{investigation_id}/candidate-evidence", tags=["candidate-evidence"])
InvestigationPath = Annotated[str, Path(min_length=1, pattern=r".*\S.*")]
CandidatePath = Annotated[str, Path(min_length=1, pattern=r".*\S.*")]


@lru_cache(maxsize=1)
def repository() -> SQLiteCandidateEvidenceRepository:
    return SQLiteCandidateEvidenceRepository(candidate_database_path())


def service(repo: SQLiteCandidateEvidenceRepository = Depends(repository)) -> CandidateEvidenceService:
    return CandidateEvidenceService(repo)


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
                    owner: str = Depends(owned_read_principal), svc: CandidateEvidenceService = Depends(service)):
    items, next_cursor = svc.list(investigation_id, owner, limit, cursor)
    return {"investigationId": investigation_id, "items": items, "nextCursor": next_cursor}


@router.get("/{candidate_id}")
def get_candidate(investigation_id: InvestigationPath, candidate_id: CandidatePath, owner: str = Depends(owned_read_principal), svc: CandidateEvidenceService = Depends(service)):
    return svc.get(investigation_id, candidate_id, owner)


@router.post("/{candidate_id}/lifecycle-transitions")
def transition_candidate(investigation_id: InvestigationPath, candidate_id: CandidatePath, command: LifecycleTransition,
                         owner: str = Depends(owned_mutation_principal), svc: CandidateEvidenceService = Depends(service)):
    candidate, _ = svc.transition(investigation_id, candidate_id, command.model_dump(exclude_none=True), owner)
    return candidate


async def candidate_error_handler(request: Request, error: CandidateEvidenceError) -> JSONResponse:
    request_id = request.headers.get("X-Request-Id") or str(uuid.uuid4())
    return JSONResponse(
        status_code=error.status_code,
        content={"error": {"code": error.code, "message": str(error), "requestId": request_id}},
        headers={"X-Request-Id": request_id},
    )
