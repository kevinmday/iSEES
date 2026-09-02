from __future__ import annotations

from typing import Any

from .errors import InvestigationMismatch, NotFound
from .repository import CandidateEvidenceRepository


class CandidateEvidenceService:
    def __init__(self, repository: CandidateEvidenceRepository):
        self.repository = repository

    @staticmethod
    def require_investigation(path_id: str, body_id: str) -> None:
        if path_id != body_id:
            raise InvestigationMismatch("Path and body Investigation identities must agree")

    def create(self, path_id: str, command: dict[str, Any], principal_id: str, origin: str):
        self.require_investigation(path_id, command["investigationId"])
        if origin == "DISCOVERY" and command["querySpecification"]["investigationId"] != path_id:
            raise InvestigationMismatch("Query and command Investigation identities must agree")
        return self.repository.create(command=command, principal_id=principal_id, origin=origin)

    def get(self, investigation_id: str, candidate_id: str, principal_id: str) -> dict[str, Any]:
        candidate = self.repository.get(investigation_id=investigation_id, candidate_id=candidate_id, principal_id=principal_id)
        if candidate is None:
            raise NotFound("Candidate was not found in this Investigation")
        return candidate

    def list(self, investigation_id: str, principal_id: str, limit: int, cursor: str | None):
        return self.repository.list(
            investigation_id=investigation_id,
            principal_id=principal_id,
            limit=limit,
            cursor=cursor,
        )

    def transition(self, path_id: str, candidate_id: str, command: dict[str, Any], principal_id: str):
        self.require_investigation(path_id, command["investigationId"])
        candidate, replayed = self.repository.transition(
            investigation_id=path_id, candidate_id=candidate_id, principal_id=principal_id, command=command
        )
        if not candidate:
            raise NotFound("Candidate was not found in this Investigation")
        return candidate, replayed
