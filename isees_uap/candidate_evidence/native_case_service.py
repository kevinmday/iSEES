from __future__ import annotations

from typing import Any

from .errors import NativeCaseDraftNotFound
from .native_case_repository import NativeCaseDraftRepository


class NativeCaseDraftService:
    def __init__(self, repository: NativeCaseDraftRepository):
        self.repository = repository

    def create(self, *, principal_id: str, command: dict[str, Any]):
        return self.repository.create(principal_id=principal_id, command=command)

    def get(self, *, principal_id: str, candidate_id: str) -> dict[str, Any]:
        draft = self.repository.get(principal_id=principal_id, candidate_id=candidate_id)
        if draft is None:
            raise NativeCaseDraftNotFound("Native case draft was not found")
        return draft

    def list(self, *, principal_id: str) -> list[dict[str, Any]]:
        return self.repository.list(principal_id=principal_id)

    def update(self, *, principal_id: str, candidate_id: str, command: dict[str, Any]):
        draft, replayed = self.repository.update(
            principal_id=principal_id, candidate_id=candidate_id, command=command)
        if draft is None:
            raise NativeCaseDraftNotFound("Native case draft was not found")
        return draft, replayed
