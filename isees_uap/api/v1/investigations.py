from __future__ import annotations

import uuid
from datetime import datetime
from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, Depends, Header, Path, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict

from isees_uap.investigations.config import investigation_database_path
from isees_uap.investigations.errors import (
    InvalidPrincipal,
    InvestigationLibraryError,
)
from isees_uap.investigations.models import Investigation, InvestigationLifecycle
from isees_uap.investigations.service import InvestigationLibraryService
from isees_uap.investigations.sqlite_repository import SQLiteInvestigationRepository

router = APIRouter(prefix="/api/v1/investigations", tags=["investigations"])
InvestigationPath = Annotated[str, Path(min_length=1, pattern=r".*\S.*")]


class InvestigationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    investigationId: str
    title: str
    objective: str | None
    lifecycle: InvestigationLifecycle
    createdAt: datetime
    modifiedAt: datetime
    version: int


class InvestigationListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[InvestigationResponse]


@lru_cache(maxsize=1)
def repository() -> SQLiteInvestigationRepository:
    return SQLiteInvestigationRepository(investigation_database_path())


def service(
    repo: SQLiteInvestigationRepository = Depends(repository),
) -> InvestigationLibraryService:
    return InvestigationLibraryService(repo)


def principal(x_isees_principal_id: str = Header(min_length=1)) -> str:
    """Local/development ownership claim; it is not authenticated identity."""
    owner = x_isees_principal_id.strip()
    if not owner:
        raise InvalidPrincipal("X-ISEES-Principal-Id must not be blank")
    return owner


def _response(item: Investigation) -> InvestigationResponse:
    return InvestigationResponse(
        investigationId=item.investigation_id,
        title=item.title,
        objective=item.objective,
        lifecycle=item.lifecycle,
        createdAt=item.created_at,
        modifiedAt=item.modified_at,
        version=item.version,
    )


@router.get("", response_model=InvestigationListResponse)
def list_investigations(
    owner: str = Depends(principal),
    svc: InvestigationLibraryService = Depends(service),
) -> InvestigationListResponse:
    return InvestigationListResponse(items=[
        InvestigationResponse(
            investigationId=item.investigation_id,
            title=item.title,
            objective=item.objective,
            lifecycle=item.lifecycle,
            createdAt=item.created_at,
            modifiedAt=item.modified_at,
            version=item.version,
        )
        for item in svc.list_owned(owner)
    ])


@router.get("/{investigation_id}", response_model=InvestigationResponse)
def get_investigation(
    investigation_id: InvestigationPath,
    owner: str = Depends(principal),
    svc: InvestigationLibraryService = Depends(service),
) -> InvestigationResponse:
    return _response(svc.get_owned(investigation_id, owner))


def investigation_error_handler(
    request: Request, error: InvestigationLibraryError
) -> JSONResponse:
    request_id = request.headers.get("X-Request-Id", str(uuid.uuid4()))
    return JSONResponse(
        status_code=error.status_code,
        content={"error": {
            "code": error.code,
            "message": str(error),
            "requestId": request_id,
        }},
    )
