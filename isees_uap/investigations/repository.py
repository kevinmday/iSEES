from __future__ import annotations

from typing import Protocol

from .models import AdoptionReceipt, Investigation, InvestigationAggregate


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

    def create_empty_owned(
        self, *, investigation_id: str, owner_principal_id: str, title: str,
        objective: str | None, idempotency_key: str, command_hash: str,
    ) -> tuple[Investigation, InvestigationAggregate, bool]: ...

    def get_empty_aggregate(
        self, *, investigation_id: str, owner_principal_id: str
    ) -> InvestigationAggregate | None: ...

    def adopt_guest_owned(self, *, investigation_id: str, owner_principal_id: str,
                          title: str, objective: str | None, idempotency_key: str,
                          command_hash: str, payload: dict) -> tuple[Investigation, InvestigationAggregate, AdoptionReceipt, bool]: ...

    def get_active_owned(self, *, owner_principal_id: str) -> tuple[Investigation, InvestigationAggregate] | None: ...

    def import_canon_event_owned(self, *, investigation_id: str, owner_principal_id: str,
                                 expected_revision: int, idempotency_key: str,
                                 command_hash: str, payload: dict) -> tuple[Investigation, InvestigationAggregate, bool, bool]: ...
