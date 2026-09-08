from __future__ import annotations

import unicodedata
import uuid
from datetime import datetime
from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, Body, Depends, Path, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator

from isees_uap.investigations.config import investigation_database_path
from isees_uap.authentication.principal import (
    AuthenticatedPrincipal, require_authenticated_principal,
    require_csrf_protected_principal,
)
from isees_uap.investigations.errors import (
    InvalidInvestigationInput, InvestigationLibraryError,
)
from isees_uap.investigations.models import (
    Investigation, InvestigationAggregate, InvestigationLifecycle,
)
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


class InvestigationDetailResponse(InvestigationResponse):
    aggregateSchemaVersion: str
    aggregateState: str
    aggregateRevision: int


class EmptyOperationalState(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: str = "EMPTY"
    workspaceId: str
    focusedEventId: None = None
    nodes: list[object] = Field(default_factory=list)
    edges: list[object] = Field(default_factory=list)


class InvestigationAccessProjection(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: str = "RESEARCHER_OWNED"


class InvestigationActivationResponse(InvestigationDetailResponse):
    activationSchemaVersion: str
    access: InvestigationAccessProjection
    operationalState: EmptyOperationalState
    freshnessToken: str


class CreateInvestigationCommand(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    objective: str | None = Field(default=None, max_length=2000)
    idempotencyKey: str = Field(min_length=1, max_length=200)

    @field_validator("title", "idempotencyKey", mode="before")
    @classmethod
    def normalize_required_text(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        return unicodedata.normalize("NFKC", value).strip()

    @field_validator("objective", mode="before")
    @classmethod
    def normalize_optional_text(cls, value: object) -> object:
        if value is None or not isinstance(value, str):
            return value
        normalized = unicodedata.normalize("NFKC", value).strip()
        return normalized or None

    @field_validator("title", "objective", "idempotencyKey")
    @classmethod
    def reject_control_characters(cls, value: str | None) -> str | None:
        if value is not None and any(unicodedata.category(char) == "Cc" for char in value):
            raise ValueError("control characters are not allowed")
        return value


class CreateInvestigationResponse(InvestigationDetailResponse):
    replayed: bool


@lru_cache(maxsize=1)
def repository() -> SQLiteInvestigationRepository:
    return SQLiteInvestigationRepository(investigation_database_path())


def service(
    repo: SQLiteInvestigationRepository = Depends(repository),
) -> InvestigationLibraryService:
    return InvestigationLibraryService(repo)


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


def _detail_response(
    item: Investigation, aggregate: InvestigationAggregate,
    *, replayed: bool | None = None,
) -> InvestigationDetailResponse | CreateInvestigationResponse:
    values = _response(item).model_dump()
    values.update({
        "aggregateSchemaVersion": aggregate.schema_version,
        "aggregateState": aggregate.state,
        "aggregateRevision": aggregate.revision,
    })
    if replayed is None:
        return InvestigationDetailResponse(**values)
    return CreateInvestigationResponse(**values, replayed=replayed)


@router.get("", response_model=InvestigationListResponse)
def list_investigations(
    principal: AuthenticatedPrincipal = Depends(require_authenticated_principal),
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
        for item in svc.list_owned(principal.account_id)
    ])


@router.post("", response_model=CreateInvestigationResponse, status_code=status.HTTP_201_CREATED)
def create_investigation(
    payload: object = Body(...),
    principal: AuthenticatedPrincipal = Depends(require_csrf_protected_principal),
    svc: InvestigationLibraryService = Depends(service),
) -> CreateInvestigationResponse:
    try:
        command = CreateInvestigationCommand.model_validate(payload)
    except ValidationError as error:
        raise InvalidInvestigationInput("Investigation input is invalid") from error
    item, aggregate, replayed = svc.create_empty_owned(
        principal_id=principal.account_id, title=command.title,
        objective=command.objective, idempotency_key=command.idempotencyKey,
    )
    return _detail_response(item, aggregate, replayed=replayed)


@router.get("/{investigation_id}", response_model=InvestigationDetailResponse)
def get_investigation(
    investigation_id: InvestigationPath,
    principal: AuthenticatedPrincipal = Depends(require_authenticated_principal),
    svc: InvestigationLibraryService = Depends(service),
) -> InvestigationDetailResponse:
    item, aggregate = svc.get_owned_detail(investigation_id, principal.account_id)
    return _detail_response(item, aggregate)


@router.get("/{investigation_id}/activation", response_model=InvestigationActivationResponse)
def get_investigation_activation(
    investigation_id: InvestigationPath,
    principal: AuthenticatedPrincipal = Depends(require_authenticated_principal),
    svc: InvestigationLibraryService = Depends(service),
) -> InvestigationActivationResponse:
    """Return an owner-authorized runtime projection without mutating server state."""
    item, aggregate = svc.get_owned_detail(investigation_id, principal.account_id)
    detail = _detail_response(item, aggregate).model_dump()
    return InvestigationActivationResponse(
        **detail,
        activationSchemaVersion="owned-investigation-activation/v1",
        access=InvestigationAccessProjection(),
        operationalState=EmptyOperationalState(
            workspaceId=f"workspace:{item.investigation_id}",
        ),
        freshnessToken=f"{item.version}:{aggregate.revision}",
    )


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
