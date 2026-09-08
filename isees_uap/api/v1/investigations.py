from __future__ import annotations

import unicodedata
import uuid
from datetime import datetime
from functools import lru_cache
from typing import Annotated, Literal

from fastapi import APIRouter, Body, Depends, Path, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator, model_validator

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


class AdoptionOwnershipProjection(InvestigationAccessProjection):
    researcherId: str


class InvestigationActivationResponse(InvestigationDetailResponse):
    activationSchemaVersion: str
    access: InvestigationAccessProjection
    operationalState: EmptyOperationalState | dict
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


class GuestSource(BaseModel):
    model_config = ConfigDict(extra="forbid")
    kind: Literal["GUEST_SESSION"]
    guestInvestigationId: str = Field(min_length=1, max_length=200)
    snapshotCreatedAt: datetime
    snapshotUpdatedAt: datetime


class WorkspaceNode(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1, max_length=200)
    kind: Literal["CANONICAL_EVENT", "NOTE", "QUESTION"]
    canonicalEventId: str | None = Field(default=None, min_length=1, max_length=200)
    title: str = Field(min_length=1, max_length=500)

    @field_validator("canonicalEventId")
    @classmethod
    def canonical_identity_matches_kind(cls, value, info):
        kind = info.data.get("kind")
        if (kind == "CANONICAL_EVENT") != (value is not None):
            raise ValueError("canonicalEventId is required only for canonical events")
        return value


class WorkspaceEdge(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1, max_length=200)
    sourceId: str = Field(min_length=1, max_length=200)
    targetId: str = Field(min_length=1, max_length=200)
    kind: Literal["RELATED", "SUPPORTS", "CONTRADICTS"]


class WorkspaceState(BaseModel):
    model_config = ConfigDict(extra="forbid")
    sourceWorkspaceId: str = Field(min_length=1, max_length=200)
    nodes: list[WorkspaceNode] = Field(max_length=2000)
    edges: list[WorkspaceEdge] = Field(max_length=5000)


class InboxEntry(BaseModel):
    model_config = ConfigDict(extra="forbid")
    anchorId: str = Field(min_length=1, max_length=200)
    order: int = Field(ge=0)
    title: str = Field(min_length=1, max_length=500)
    canonicalSourceId: str = Field(min_length=1, max_length=300)


class ArtifactState(BaseModel):
    model_config = ConfigDict(extra="forbid")
    artifactId: str = Field(min_length=1, max_length=200)
    kind: Literal["DOCUMENT", "NOTE"]
    title: str = Field(min_length=1, max_length=500)
    content: str = Field(max_length=100000)
    canonicalSourceIds: list[str] = Field(default_factory=list, max_length=1000)


class ViewState(BaseModel):
    model_config = ConfigDict(extra="forbid")
    activeMode: Literal["OVERVIEW", "RESEARCH", "STUDIO", "LAYERS"]
    focusedEventId: str | None = Field(default=None, max_length=200)
    activeLayers: list[str] = Field(max_length=100)
    temporalContext: str | None = Field(default=None, max_length=200)
    investigativeScale: str | None = Field(default=None, max_length=200)


class AdoptGuestCommand(BaseModel):
    model_config = ConfigDict(extra="forbid")
    schemaVersion: Literal["guest-investigation-adoption/v1"]
    idempotencyKey: str = Field(min_length=1, max_length=200)
    source: GuestSource
    title: str = Field(min_length=1, max_length=200)
    objective: str | None = Field(default=None, max_length=2000)
    workspace: WorkspaceState
    researchInbox: list[InboxEntry] = Field(default_factory=list, max_length=2000)
    artifacts: list[ArtifactState] = Field(default_factory=list, max_length=200)
    viewState: ViewState

    @field_validator("title", "idempotencyKey", mode="before")
    @classmethod
    def normalize_text(cls, value):
        return unicodedata.normalize("NFKC", value).strip() if isinstance(value, str) else value

    @model_validator(mode="after")
    def reject_ambiguous_subordinate_identity(self):
        orders = [entry.order for entry in self.researchInbox]
        anchors = [entry.anchorId for entry in self.researchInbox]
        artifacts = [artifact.artifactId for artifact in self.artifacts]
        if len(orders) != len(set(orders)) or len(anchors) != len(set(anchors)) or len(artifacts) != len(set(artifacts)):
            raise ValueError("subordinate identities and inbox ordering must be unique")
        return self


class AdoptionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    adoptionSchemaVersion: str
    investigationId: str
    ownership: AdoptionOwnershipProjection
    version: int
    aggregateRevision: int
    createdAt: datetime
    modifiedAt: datetime
    activeInvestigation: bool
    payloadDigest: str
    adoptedAt: datetime
    sourceKind: str
    sourceGuestInvestigationId: str
    idempotencyDisposition: Literal["CREATED", "REPLAYED"]
    activation: InvestigationActivationResponse


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


@router.post("/adoptions", response_model=AdoptionResponse, status_code=status.HTTP_201_CREATED)
def adopt_guest_investigation(
    payload: object = Body(...),
    principal: AuthenticatedPrincipal = Depends(require_csrf_protected_principal),
    svc: InvestigationLibraryService = Depends(service),
) -> AdoptionResponse:
    try:
        command = AdoptGuestCommand.model_validate(payload)
        if command.source.snapshotUpdatedAt < command.source.snapshotCreatedAt:
            raise ValueError("snapshot timestamps are reversed")
        node_ids = {node.id for node in command.workspace.nodes}
        if len(node_ids) != len(command.workspace.nodes):
            raise ValueError("workspace node identities must be unique")
        if any(edge.sourceId not in node_ids or edge.targetId not in node_ids for edge in command.workspace.edges):
            raise ValueError("workspace edges must reference included nodes")
        canonical_ids = {node.canonicalEventId for node in command.workspace.nodes if node.canonicalEventId}
        if command.viewState.focusedEventId and command.viewState.focusedEventId not in canonical_ids:
            raise ValueError("focused event must retain an included canonical identity")
    except (ValidationError, ValueError) as error:
        raise InvalidInvestigationInput("Guest adoption input is invalid") from error
    normalized = command.model_dump(mode="json", exclude={"idempotencyKey"})
    item, aggregate, receipt, replayed = svc.adopt_guest_owned(
        principal_id=principal.account_id, title=command.title, objective=command.objective,
        idempotency_key=command.idempotencyKey, payload=normalized)
    detail = _detail_response(item, aggregate).model_dump()
    activation = InvestigationActivationResponse(
        **detail, activationSchemaVersion="owned-investigation-activation/v1",
        access=InvestigationAccessProjection(),
        operationalState={"kind": "ADOPTED", "workspaceId": f"workspace:{item.investigation_id}", **aggregate.payload},
        freshnessToken=f"{item.version}:{aggregate.revision}")
    return AdoptionResponse(
        adoptionSchemaVersion="guest-investigation-adoption-receipt/v1",
        investigationId=item.investigation_id,
        ownership=AdoptionOwnershipProjection(researcherId=principal.account_id),
        version=item.version, aggregateRevision=aggregate.revision, createdAt=item.created_at,
        modifiedAt=item.modified_at, activeInvestigation=True, payloadDigest=receipt.payload_digest,
        adoptedAt=receipt.adopted_at, sourceKind="GUEST_SESSION",
        sourceGuestInvestigationId=receipt.source_guest_investigation_id,
        idempotencyDisposition="REPLAYED" if replayed else "CREATED", activation=activation)


@router.get("/active/activation", response_model=InvestigationActivationResponse)
def get_active_investigation_activation(
    principal: AuthenticatedPrincipal = Depends(require_authenticated_principal),
    svc: InvestigationLibraryService = Depends(service),
) -> InvestigationActivationResponse:
    active = svc.get_active_owned(principal.account_id)
    if active is None:
        from isees_uap.investigations.errors import InvestigationNotFound
        raise InvestigationNotFound("Investigation was not found")
    item, aggregate = active
    detail = _detail_response(item, aggregate).model_dump()
    return InvestigationActivationResponse(
        **detail, activationSchemaVersion="owned-investigation-activation/v1",
        access=InvestigationAccessProjection(),
        operationalState={"kind": "ADOPTED", "workspaceId": f"workspace:{item.investigation_id}", **aggregate.payload},
        freshnessToken=f"{item.version}:{aggregate.revision}")


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
        operationalState=(EmptyOperationalState(workspaceId=f"workspace:{item.investigation_id}")
                          if aggregate.state == "EMPTY" else
                          {"kind": "ADOPTED", "workspaceId": f"workspace:{item.investigation_id}", **aggregate.payload}),
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
