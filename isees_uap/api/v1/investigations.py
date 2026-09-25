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
    InvalidInvestigationInput, InvestigationLibraryError, InvestigationNotFound,
)
from isees_uap.investigations.models import (
    Investigation, InvestigationAggregate, InvestigationLifecycle,
)
from isees_uap.investigations.service import InvestigationLibraryService
from isees_uap.investigations.sqlite_repository import (SQLiteInvestigationRepository,
                                                        operational_graph_fingerprint)

router = APIRouter(prefix="/api/v1/investigations", tags=["investigations"])

class AdmitManifoldArtifactCommand(BaseModel):
    model_config=ConfigDict(extra="forbid")
    projectionId: str = Field(min_length=1,max_length=300)
    expectedOperationalHeadId: str | None = Field(default=None,max_length=300)
    selectedRelationshipDeclarationIds: tuple[str,...] = ()
    idempotencyKey: str = Field(min_length=1,max_length=200)

    @field_validator("projectionId","idempotencyKey")
    @classmethod
    def non_blank(cls,value):
        if value!=value.strip() or not value: raise ValueError("identity must be non-blank")
        return value
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
    operationalRevisionHead: dict | None = None
    operationalRevisionLineage: list[dict] = Field(default_factory=list)


class OperationalRevisionSubmission(BaseModel):
    model_config = ConfigDict(extra="forbid")
    expectedHeadId: str | None = Field(default=None, max_length=200)
    graph: dict
    fingerprint: str = Field(min_length=1)
    algorithmVersion: str = Field(min_length=1, max_length=200)
    recordedAt: datetime


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
    activeMode: Literal["OVERVIEW", "LIBRARY", "MANIFOLD", "COMPARE", "NARRATIVE", "EVIDENCE", "TIMELINE", "INTENTION", "RESEARCH", "STUDIO", "LAYERS"]
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
    operationalRevision: OperationalRevisionSubmission | None = None

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

class ImportCanonEventCommand(BaseModel):
    model_config = ConfigDict(extra="forbid")
    investigationId: str = Field(min_length=1, max_length=200)
    eventId: str = Field(min_length=1, max_length=200)
    eventTitle: str = Field(min_length=1, max_length=500)
    expectedAggregateRevision: int = Field(ge=0)
    idempotencyKey: str = Field(min_length=1, max_length=200)
    workspace: WorkspaceState
    viewState: ViewState
    operationalRevision: OperationalRevisionSubmission | None = None

class ImportCanonEventResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    investigationId: str; aggregateRevision: int; replayed: bool; duplicate: bool
    activation: InvestigationActivationResponse

CANON_EVENT_IDS = frozenset({"E-TICTAC-2004", "E-ROOSEVELT-2015", "E-RENDLESHAM-1980"})


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


def _revision_projection(revision) -> dict:
    return {"investigationId": revision.investigation_id,
            "revisionId": revision.operational_revision_id,
            "revisionNumber": revision.revision_number,
            "parentRevisionId": revision.parent_operational_revision_id,
            "graph": revision.graph_snapshot, "fingerprint": revision.graph_fingerprint,
            "graphSchemaVersion": revision.graph_schema_version,
            "algorithmVersion": revision.algorithm_version,
            "actorAuthority": revision.actor_authority,
            "recordedAt": revision.recorded_at.isoformat().replace("+00:00", "Z"),
            "mutationKind": revision.mutation_kind,
            "sourceIdentity": revision.source_identity}


def _activation_response(svc: InvestigationLibraryService, item: Investigation,
                         aggregate: InvestigationAggregate, principal_id: str):
    authority = svc.get_owned_activation(item.investigation_id, principal_id)
    revisions = ([_revision_projection(value) for value in authority.operational_lineage.revisions]
                 if authority.operational_lineage else [])
    detail = _detail_response(item, aggregate).model_dump()
    return InvestigationActivationResponse(
        **detail, activationSchemaVersion="owned-investigation-activation/v1",
        access=InvestigationAccessProjection(),
        operationalState=(EmptyOperationalState(workspaceId=f"workspace:{item.investigation_id}")
                          if aggregate.state == "EMPTY" else
                          {"kind": "ADOPTED", "workspaceId": f"workspace:{item.investigation_id}", **aggregate.payload}),
        freshnessToken=f"{item.version}:{aggregate.revision}",
        operationalRevisionHead=revisions[-1] if revisions else None,
        operationalRevisionLineage=revisions)


def _workspace_operational_submission(workspace: WorkspaceState, recorded_at: datetime,
                                      expected_head_id: str | None = None) -> dict:
    nodes = [{"id": node.id, "label": node.title,
              "type": "EVENT" if node.kind == "CANONICAL_EVENT" else
                      "HYPOTHESIS" if node.kind == "QUESTION" else "NARRATIVE",
              "metadata": ({"sourceId": node.canonicalEventId} if node.kind == "CANONICAL_EVENT"
                           else {"adoptedKind": node.kind})} for node in workspace.nodes]
    edges = [{"id": edge.id, "source": edge.sourceId, "target": edge.targetId,
              "relationship": "ASSOCIATED_WITH" if edge.kind == "RELATED" else edge.kind,
              "weight": 1, "rationale": ["Preserved guest adoption."]} for edge in workspace.edges]
    graph = {"nodes": nodes, "edges": edges,
             "statistics": {"nodeCount": len(nodes), "edgeCount": len(edges),
                "eventCount": sum(node.kind == "CANONICAL_EVENT" for node in workspace.nodes),
                "facilityCount": 0, "artifactCount": 0, "personCount": 0,
                "organizationCount": 0, "locationCount": 0,
                "narrativeCount": sum(node.kind == "NOTE" for node in workspace.nodes),
                "hypothesisCount": sum(node.kind == "QUESTION" for node in workspace.nodes)}}
    return {"expectedHeadId": expected_head_id, "graph": graph,
            "fingerprint": operational_graph_fingerprint(graph),
            "algorithmVersion": "COMPATIBILITY_WORKSPACE_PROJECTION_V1",
            "recordedAt": recorded_at}


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
    normalized = command.model_dump(mode="json", exclude={"idempotencyKey", "operationalRevision"})
    operational = (command.operationalRevision.model_dump(mode="python") if command.operationalRevision
                   else _workspace_operational_submission(command.workspace, command.source.snapshotUpdatedAt))
    item, aggregate, receipt, replayed = svc.adopt_guest_owned(
        principal_id=principal.account_id, title=command.title, objective=command.objective,
        idempotency_key=command.idempotencyKey, payload=normalized, operational=operational)
    activation = _activation_response(svc, item, aggregate, principal.account_id)
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
    return _activation_response(svc, item, aggregate, principal.account_id)


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
    """Return the owner-authorized aggregate and durable operational authority."""
    item, aggregate = svc.get_owned_detail(investigation_id, principal.account_id)
    return _activation_response(svc, item, aggregate, principal.account_id)

@router.post("/{investigation_id}/canon-events", response_model=ImportCanonEventResponse)
def import_canon_event(investigation_id: InvestigationPath, payload: object = Body(...),
                       principal: AuthenticatedPrincipal = Depends(require_csrf_protected_principal),
                       svc: InvestigationLibraryService = Depends(service)):
    try:
        command = ImportCanonEventCommand.model_validate(payload)
        if command.investigationId != investigation_id or command.eventId not in CANON_EVENT_IDS:
            raise ValueError("route or canonical event identity is invalid")
        canonical_nodes = [node for node in command.workspace.nodes if node.kind == "CANONICAL_EVENT" and node.canonicalEventId == command.eventId]
        if len(canonical_nodes) != 1 or command.viewState.focusedEventId != command.eventId:
            raise ValueError("focused canonical event is not represented exactly once")
    except (ValidationError, ValueError) as error:
        raise InvalidInvestigationInput("Canon event import is invalid") from error
    owned = svc.get_owned(investigation_id, principal.account_id)
    now = datetime.now().astimezone().isoformat()
    normalized = {"schemaVersion":"canon-event-import/v1","source":{"kind":"SYSTEM_CANON","eventId":command.eventId,"importedAt":now},"title":owned.title,"objective":owned.objective,"workspace":command.workspace.model_dump(mode="json"),"researchInbox":[],"artifacts":[],"viewState":command.viewState.model_dump(mode="json")}
    operational = (command.operationalRevision.model_dump(mode="python") if command.operationalRevision
                   else _workspace_operational_submission(command.workspace, datetime.fromisoformat(now)))
    expected_head_id = command.operationalRevision.expectedHeadId if command.operationalRevision else None
    item, aggregate, replayed, duplicate = svc.import_canon_event_owned(investigation_id=investigation_id, principal_id=principal.account_id, expected_revision=command.expectedAggregateRevision, idempotency_key=command.idempotencyKey, payload=normalized, operational=operational, expected_operational_head_id=expected_head_id)
    activation = _activation_response(svc, item, aggregate, principal.account_id)
    return ImportCanonEventResponse(investigationId=item.investigation_id, aggregateRevision=aggregate.revision, replayed=replayed, duplicate=duplicate, activation=activation)

@router.post("/{investigation_id}/manifold-artifact-admissions")
def admit_manifold_artifact(investigation_id: InvestigationPath, request: Request,
        payload: object=Body(...), principal: AuthenticatedPrincipal=Depends(require_csrf_protected_principal),
        svc: InvestigationLibraryService=Depends(service)):
    try: command=AdmitManifoldArtifactCommand.model_validate(payload)
    except ValidationError as error: raise InvalidInvestigationInput("Manifold artifact admission is invalid") from error
    from isees_uap.api.v1.studio_v1 import private_ready_facade
    from isees_uap.studio.v1.persistence import StudioV1Failure
    try:
        verified=private_ready_facade(request).load_verified_manifold_projection(
            principal.account_id,investigation_id,command.projectionId)
    except StudioV1Failure as error:
        raise InvestigationNotFound("Projection was not found") from error
    receipt,replayed,authority=svc.admit_manifold_artifact(investigation_id=investigation_id,
      principal_id=principal.account_id,verified_projection=verified,
      expected_operational_head_id=command.expectedOperationalHeadId,
      selected_relationship_declaration_ids=command.selectedRelationshipDeclarationIds,
      idempotency_key=command.idempotencyKey)
    activation=_activation_response(svc,authority.investigation,authority.aggregate,principal.account_id)
    return {"receipt":{"receiptId":receipt.receipt_id,"investigationId":receipt.investigation_id,
      "projectionId":receipt.projection_id,"verifiedOutputHash":receipt.verified_output_hash,
      "admittedArtifactNodeId":receipt.admitted_artifact_node_id,
      "selectedRelationshipDeclarationIds":receipt.selected_relationship_declaration_ids,
      "createdRelationshipIds":receipt.created_relationship_ids,
      "previousOperationalRevisionId":receipt.previous_operational_revision_id,
      "resultingOperationalRevisionId":receipt.resulting_operational_revision_id,
      "admittedAt":receipt.admitted_at.isoformat(),"effects":{"canon":"NONE","manifold":"REVISION_APPENDED",
      "rex":"NONE","tavily":"NONE","webDiscovery":"NONE","candidateEvidence":"NONE","researchInbox":"NONE","confidence":"NONE","billing":"NONE"}},
      "replayed":replayed,"authoritativeCurrentHead":receipt.resulting_operational_revision_id,
      "activation":activation.model_dump(mode="json")}


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
