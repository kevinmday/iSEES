from __future__ import annotations

import json
import uuid
from functools import lru_cache
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header, HTTPException, Path, Request
from fastapi.responses import JSONResponse

from isees_uap.candidate_evidence.config import candidate_database_path
from isees_uap.studio.config import studio_database_path
from isees_uap.studio.errors import ArtifactNotFound, OwnershipAccessFailure, StudioError
from isees_uap.studio.hashing import canonical_json
from isees_uap.studio.investigation_authority import CandidateEvidenceInvestigationAuthority
from isees_uap.studio.schemas import (
    AcceptStudioArtifact, CreateCandidateKnowledgeArtifact, CreateStudioDraft,
    PublishStudioCandidateNode, RecordMaterializedProjection, RejectStudioArtifact,
    ReturnStudioArtifact, SaveStudioArtifactVersion, SubmitStudioForReview,
    ValidateStudioProjection,
)
from isees_uap.studio.service import StudioService
from isees_uap.studio.sqlite_repository import SQLiteStudioRepository

router = APIRouter(prefix="/api/v1/investigations/{investigation_id}/studio-artifacts", tags=["studio"])
IdentityPath = Annotated[str, Path(min_length=1, pattern=r".*\S.*")]


class _UnavailableSourceResolution:
    def resolve_source(self, **_: Any):
        raise RuntimeError("authoritative source resolution is not configured")


class _UnavailablePublication:
    def publish_candidate(self, **_: Any):
        raise RuntimeError("MANIFOLD candidate publication is not configured")


class _UnavailableAcceptance:
    def accept_candidate(self, **_: Any):
        raise RuntimeError("accepted Knowledge persistence is not configured")


@lru_cache(maxsize=1)
def repository() -> SQLiteStudioRepository:
    return SQLiteStudioRepository(studio_database_path())


def service(repo: SQLiteStudioRepository = Depends(repository)) -> StudioService:
    authority = CandidateEvidenceInvestigationAuthority(candidate_database_path())
    return StudioService(repo, authority, _UnavailableSourceResolution(),
                         _UnavailablePublication(), _UnavailableAcceptance())


def principal(x_isees_principal_id: str = Header(min_length=1)) -> str:
    """Local ownership claim only; this header is not completed authentication."""
    if not x_isees_principal_id.strip():
        raise HTTPException(status_code=422, detail={
            "code": "INVALID_PRINCIPAL", "message": "X-ISEES-Principal-Id must not be blank"})
    return x_isees_principal_id.strip()


def _ownership(command: Any, owner: str) -> None:
    if command.principalId != owner:
        raise OwnershipAccessFailure("Studio artifact was not found")


def _projection(record: Any, lifecycle_events: list[dict[str, Any]]) -> dict[str, Any]:
    # canonical_json safely thaws immutable MappingProxyType and UTC datetimes.
    def camel(key: str) -> str:
        head, *tail = key.split("_")
        return head + "".join(part.title() for part in tail)
    def transport(item: Any) -> Any:
        if isinstance(item, dict): return {camel(key): transport(value) for key, value in item.items()}
        if isinstance(item, list): return [transport(value) for value in item]
        return item
    value = transport(json.loads(canonical_json(record)))
    a = value["artifact"]
    return {
        "artifact": a,
        "currentVersion": next(v for v in value["versions"] if v["versionId"] == a["currentVersionId"]),
        "versionHistory": value["versions"],
        "sourceSnapshots": value["sourceSnapshots"],
        "candidateArtifacts": value["candidates"],
        "candidatePublicationReceipts": value["publicationReceipts"],
        "acceptanceReceipts": value["acceptanceReceipts"],
        "reviewDecisions": value["reviewDecisions"],
        "projections": value["projections"],
        "lifecycleEvents": transport(lifecycle_events),
    }


@router.post("")
def create_draft(investigation_id: IdentityPath, command: CreateStudioDraft,
                 owner: str = Depends(principal), svc: StudioService = Depends(service)):
    _ownership(command, owner)
    result = svc.create_draft(investigation_id, command)
    return JSONResponse(status_code=200 if result.replayed else 201,
                        content=result.model_dump(mode="json"))


@router.get("")
def list_artifacts(investigation_id: IdentityPath, owner: str = Depends(principal),
                   repo: SQLiteStudioRepository = Depends(repository),
                   svc: StudioService = Depends(service)):
    svc.authorize_read(owner, investigation_id)
    return {"investigationId": investigation_id, "items": [
        _projection(item, repo.lifecycle_events(artifact_id=item.artifact.artifact_id))
        for item in repo.list(investigation_id=investigation_id, principal_id=owner)]}


@router.get("/{artifact_id}")
def load_artifact(investigation_id: IdentityPath, artifact_id: IdentityPath,
                  owner: str = Depends(principal), repo: SQLiteStudioRepository = Depends(repository),
                  svc: StudioService = Depends(service)):
    svc.authorize_read(owner, investigation_id)
    record = repo.get_scoped(investigation_id=investigation_id, artifact_id=artifact_id, principal_id=owner)
    if record is None:
        raise ArtifactNotFound("Studio artifact was not found")
    return _projection(record, repo.lifecycle_events(artifact_id=artifact_id))


def _mutate(method: str, investigation_id: str, command: Any, owner: str, svc: StudioService):
    _ownership(command, owner)
    return getattr(svc, method)(investigation_id, command)


@router.post("/{artifact_id}/versions")
def save_version(investigation_id: IdentityPath, artifact_id: IdentityPath,
                 command: SaveStudioArtifactVersion, owner: str = Depends(principal),
                 svc: StudioService = Depends(service)):
    if artifact_id != command.artifactId: raise ArtifactNotFound("Studio artifact was not found")
    return _mutate("save_version", investigation_id, command, owner, svc)


@router.post("/{artifact_id}/candidate")
def create_candidate(investigation_id: IdentityPath, artifact_id: IdentityPath,
                     command: CreateCandidateKnowledgeArtifact, owner: str = Depends(principal),
                     svc: StudioService = Depends(service)):
    if artifact_id != command.artifactId: raise ArtifactNotFound("Studio artifact was not found")
    return _mutate("create_candidate", investigation_id, command, owner, svc)


@router.post("/{artifact_id}/candidate/publication")
def publish_candidate(investigation_id: IdentityPath, artifact_id: IdentityPath,
                      command: PublishStudioCandidateNode, owner: str = Depends(principal),
                      svc: StudioService = Depends(service)):
    if artifact_id != command.artifactId: raise ArtifactNotFound("Studio artifact was not found")
    return _mutate("publish_candidate", investigation_id, command, owner, svc)


@router.post("/{artifact_id}/review-submissions")
def submit_review(investigation_id: IdentityPath, artifact_id: IdentityPath,
                  command: SubmitStudioForReview, owner: str = Depends(principal),
                  svc: StudioService = Depends(service)):
    if artifact_id != command.artifactId: raise ArtifactNotFound("Studio artifact was not found")
    return _mutate("submit_for_review", investigation_id, command, owner, svc)


def _review(method: str, investigation_id: str, artifact_id: str, command: Any,
            owner: str, svc: StudioService):
    if artifact_id != command.artifactId: raise ArtifactNotFound("Studio artifact was not found")
    return _mutate(method, investigation_id, command, owner, svc)


@router.post("/{artifact_id}/acceptance")
def accept(investigation_id: IdentityPath, artifact_id: IdentityPath, command: AcceptStudioArtifact,
           owner: str = Depends(principal), svc: StudioService = Depends(service)):
    return _review("accept", investigation_id, artifact_id, command, owner, svc)


@router.post("/{artifact_id}/returns")
def return_artifact(investigation_id: IdentityPath, artifact_id: IdentityPath, command: ReturnStudioArtifact,
                    owner: str = Depends(principal), svc: StudioService = Depends(service)):
    return _review("return_artifact", investigation_id, artifact_id, command, owner, svc)


@router.post("/{artifact_id}/rejections")
def reject(investigation_id: IdentityPath, artifact_id: IdentityPath, command: RejectStudioArtifact,
           owner: str = Depends(principal), svc: StudioService = Depends(service)):
    return _review("reject", investigation_id, artifact_id, command, owner, svc)


@router.post("/{artifact_id}/projections/validations")
def validate_projection(investigation_id: IdentityPath, artifact_id: IdentityPath,
                        command: ValidateStudioProjection, owner: str = Depends(principal),
                        svc: StudioService = Depends(service)):
    return _review("validate_projection", investigation_id, artifact_id, command, owner, svc)


@router.post("/{artifact_id}/projections/materializations")
def materialize_projection(investigation_id: IdentityPath, artifact_id: IdentityPath,
                           command: RecordMaterializedProjection, owner: str = Depends(principal),
                           svc: StudioService = Depends(service)):
    return _review("record_materialized_projection", investigation_id, artifact_id, command, owner, svc)


async def studio_error_handler(request: Request, error: StudioError) -> JSONResponse:
    request_id = request.headers.get("X-Request-Id") or str(uuid.uuid4())
    return JSONResponse(status_code=error.status_code,
        content={"error": {"code": error.code, "message": str(error), "requestId": request_id}},
        headers={"X-Request-Id": request_id})
