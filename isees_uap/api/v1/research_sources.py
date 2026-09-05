from __future__ import annotations

from functools import lru_cache
from typing import Annotated, Any, Literal
from fastapi import APIRouter, Depends, Header, HTTPException, Path
from pydantic import BaseModel, ConfigDict, Field, StringConstraints
from isees_uap.research_sources import SQLiteResearchSourceRepository, research_source_database_path
from isees_uap.research_sources.sqlite_repository import ResearchSourceConflict
from isees_uap.candidate_evidence.config import candidate_database_path
from isees_uap.studio.config import studio_database_path
from isees_uap.studio.investigation_authority import CandidateEvidenceInvestigationAuthority
from isees_uap.studio.sqlite_repository import SQLiteStudioRepository

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

def principal(x_isees_principal_id: str = Header(min_length=1)) -> str:
    return x_isees_principal_id.strip()

@router.post("")
def publish(investigation_id: IdentityPath, command: GraphPublication,
            owner: str = Depends(principal), repo: SQLiteResearchSourceRepository = Depends(repository)):
    if command.investigationId != investigation_id:
        raise HTTPException(status_code=412, detail="Investigation identity mismatch")
    studio_owned = SQLiteStudioRepository(studio_database_path()).list(
        investigation_id=investigation_id, principal_id=owner)
    if not studio_owned:
        try:
            allowed = CandidateEvidenceInvestigationAuthority(candidate_database_path()).resolve_access(
                principal_id=owner, investigation_id=investigation_id).allowed
        except Exception as exc:
            raise HTTPException(status_code=503, detail="Investigation authority unavailable") from exc
        if not allowed:
            raise HTTPException(status_code=404, detail="Investigation was not found")
    try:
        value, replayed = repo.publish(command.model_dump(mode="json"), owner)
    except ResearchSourceConflict as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"anchorId": value["anchorId"], "replayed": replayed}
