from __future__ import annotations

from typing import Protocol

from .models import Investigation


class InvestigationRepository(Protocol):
    def list_owned(self, *, owner_principal_id: str) -> list[Investigation]: ...

    def get_owned(
        self, *, investigation_id: str, owner_principal_id: str
    ) -> Investigation | None: ...

    def create(
        self,
        *,
        investigation_id: str,
        owner_principal_id: str,
        title: str,
        objective: str | None = None,
    ) -> Investigation: ...
