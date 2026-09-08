from __future__ import annotations

from dataclasses import dataclass

from .errors import InvestigationNotFound
from .sqlite_repository import SQLiteInvestigationRepository


@dataclass(frozen=True)
class AccessResult:
    allowed: bool


class PersistedInvestigationAuthority:
    """Authorize only from the durable Investigation parent.

    Authentication and Investigation storage intentionally remain separate SQLite
    databases.  The caller must supply a server-authenticated account identifier;
    this adapter then requires an exact owner binding on the parent before any
    child store is consulted.
    """

    def __init__(self, repository: SQLiteInvestigationRepository):
        self.repository = repository

    def require_owned(self, *, account_id: str, investigation_id: str) -> None:
        parent = self.repository.get_owned(
            investigation_id=investigation_id,
            owner_principal_id=account_id,
        )
        if parent is None:
            raise InvestigationNotFound("Investigation was not found")

    def resolve_access(self, *, principal_id: str, investigation_id: str) -> AccessResult:
        parent = self.repository.get_owned(
            investigation_id=investigation_id,
            owner_principal_id=principal_id,
        )
        return AccessResult(allowed=parent is not None)
