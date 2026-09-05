from __future__ import annotations

from .errors import InvestigationNotFound
from .models import Investigation, InvestigationSummary, summarize
from .repository import InvestigationRepository


class InvestigationLibraryService:
    """Read-only application service for caller-owned parent Investigations."""

    def __init__(self, repository: InvestigationRepository):
        self.repository = repository

    def list_owned(self, principal_id: str) -> list[InvestigationSummary]:
        return [summarize(item) for item in self.repository.list_owned(
            owner_principal_id=principal_id
        )]

    def get_owned(self, investigation_id: str, principal_id: str) -> Investigation:
        investigation = self.repository.get_owned(
            investigation_id=investigation_id, owner_principal_id=principal_id
        )
        if investigation is None:
            # Deliberately non-disclosing: absence and another owner's record agree.
            raise InvestigationNotFound("Investigation was not found")
        return investigation
