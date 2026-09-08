from __future__ import annotations

from functools import lru_cache
from typing import Annotated, Any, Literal
from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel, ConfigDict, Field, StringConstraints
from isees_uap.research_sources import SQLiteResearchSourceRepository, research_source_database_path
from isees_uap.research_sources.sqlite_repository import ResearchSourceConflict
from isees_uap.authentication.principal import AuthenticatedPrincipal, require_csrf_protected_principal
from isees_uap.investigations.authority import PersistedInvestigationAuthority
from isees_uap.api.v1.investigations import repository as investigation_repository

router = APIRouter(prefix="/api/v1/investigations/{investigation_id}/research-sources", tags=["research"])
Identity = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
IdentityPath = Annotated[str, Path(min_length=1, pattern=r".*\S.*")]

class GraphPublication(BaseModel):
    model_config = ConfigDict(extra="forbid")
    schemaVersion: Literal["research-source-publication/v1"]
    anchorId: Identity; investigationId: Identity
    sourceWorkspace: Literal["MANIFOLD"]; sourceKind: Literal["GRAPH"]
    sourceIdentity: Identity; sourceRevisionId: Identity; graphIdentity: Identity
    graphType: Literal["NODE", "EDGE"]; graphId: Identity; graphRevision: int = Field(ge=1)
    classification: Literal["CANONICAL"]; insertionState: Literal["INSERTABLE"]
    insertionReason: str; displayTitle: str; displaySummary: str
    representationSchemaVersion: Literal["research-graph/v1"]; mediaType: Literal["application/json"]
    capturedRepresentation: dict[str, Any]; collectedAt: str; createdAt: str
    immutableSourceHash: Annotated[str, StringConstraints(pattern=r"^sha256:[0-9a-f]{64}$")]

@lru_cache(maxsize=1)
def repository() -> SQLiteResearchSourceRepository:
    return SQLiteResearchSourceRepository(research_source_database_path())

@router.post("")
def publish(investigation_id: IdentityPath, command: GraphPublication,
            principal: AuthenticatedPrincipal = Depends(require_csrf_protected_principal),
            repo: SQLiteResearchSourceRepository = Depends(repository),
            parent_repo=Depends(investigation_repository)):
    owner = principal.account_id
    PersistedInvestigationAuthority(parent_repo).require_owned(
        account_id=owner, investigation_id=investigation_id)
    if command.investigationId != investigation_id:
        raise HTTPException(status_code=412, detail="Investigation identity mismatch")
    try:
        value, replayed = repo.publish(command.model_dump(mode="json"), owner)
    except ResearchSourceConflict as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"anchorId": value["anchorId"], "replayed": replayed}
