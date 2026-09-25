from __future__ import annotations

from typing import Protocol

from .models import (AdoptionReceipt, Investigation, InvestigationAggregate,
                     OperationalGraphRevision, OperationalRevisionLineage)


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
                          command_hash: str, payload: dict,
                          operational_revision: OperationalGraphRevision) -> tuple[Investigation, InvestigationAggregate, AdoptionReceipt, bool]: ...

    def get_active_owned(self, *, owner_principal_id: str) -> tuple[Investigation, InvestigationAggregate] | None: ...

    def import_canon_event_owned(self, *, investigation_id: str, owner_principal_id: str,
                                 expected_revision: int, idempotency_key: str,
                                 command_hash: str, payload: dict,
                                 operational_revision: OperationalGraphRevision,
                                 expected_operational_head_id: str | None) -> tuple[Investigation, InvestigationAggregate, bool, bool]: ...

    def get_current_operational_revision(self, *, investigation_id: str,
                                         owner_principal_id: str) -> OperationalGraphRevision | None: ...

    def get_operational_revision_lineage(self, *, investigation_id: str,
                                         owner_principal_id: str) -> OperationalRevisionLineage | None: ...

    def append_operational_revision_owned(self, *, investigation_id: str,
            owner_principal_id: str, expected_operational_head_id: str | None,
            revision: OperationalGraphRevision, aggregate_payload: dict,
            expected_aggregate_revision: int) -> tuple[Investigation, InvestigationAggregate, OperationalGraphRevision]: ...

    def materialize_compatibility_baseline_owned(self, *, investigation_id: str,
            owner_principal_id: str) -> OperationalRevisionLineage | None: ...

    def admit_manifold_artifact_owned(self, **kwargs): ...
    def get_manifold_admission_replay(self, **kwargs): ...
