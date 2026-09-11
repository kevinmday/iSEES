from __future__ import annotations

import hashlib
import json
import uuid
from copy import deepcopy
from collections.abc import Callable

from .errors import (
    DuplicateInvestigationId, InvestigationNotFound, RepositoryUnavailable,
)
from .models import Investigation, InvestigationAggregate, InvestigationSummary, summarize
from .repository import InvestigationRepository


class InvestigationLibraryService:
    """Application service for authenticated, owner-scoped Investigations."""

    def __init__(
        self, repository: InvestigationRepository,
        *, id_generator: Callable[[], str] | None = None,
        collision_limit: int = 8,
    ):
        self.repository = repository
        self.id_generator = id_generator or (lambda: f"inv_{uuid.uuid4().hex}")
        self.collision_limit = collision_limit

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

    def get_owned_detail(
        self, investigation_id: str, principal_id: str
    ) -> tuple[Investigation, InvestigationAggregate]:
        investigation = self.get_owned(investigation_id, principal_id)
        aggregate = self.repository.get_empty_aggregate(
            investigation_id=investigation_id, owner_principal_id=principal_id
        )
        if aggregate is None:
            raise RepositoryUnavailable("Investigation aggregate is unavailable")
        return investigation, aggregate

    def create_empty_owned(
        self, *, principal_id: str, title: str, objective: str | None,
        idempotency_key: str,
    ) -> tuple[Investigation, InvestigationAggregate, bool]:
        canonical = json.dumps(
            {"objective": objective, "title": title},
            ensure_ascii=False, sort_keys=True, separators=(",", ":"),
        )
        command_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        for _ in range(self.collision_limit):
            try:
                return self.repository.create_empty_owned(
                    investigation_id=self.id_generator(),
                    owner_principal_id=principal_id, title=title, objective=objective,
                    idempotency_key=idempotency_key, command_hash=command_hash,
                )
            except DuplicateInvestigationId:
                continue
        raise RepositoryUnavailable("Investigation identity generation is unavailable")

    def adopt_guest_owned(self, *, principal_id: str, title: str, objective: str | None,
                          idempotency_key: str, payload: dict):
        canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        command_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        for _ in range(self.collision_limit):
            try:
                return self.repository.adopt_guest_owned(
                    investigation_id=self.id_generator(), owner_principal_id=principal_id,
                    title=title, objective=objective, idempotency_key=idempotency_key,
                    command_hash=command_hash, payload=payload)
            except DuplicateInvestigationId:
                continue
        raise RepositoryUnavailable("Investigation identity generation is unavailable")

    def get_active_owned(self, principal_id: str):
        return self.repository.get_active_owned(owner_principal_id=principal_id)

    def import_canon_event_owned(self, *, investigation_id: str, principal_id: str,
                                 expected_revision: int, idempotency_key: str, payload: dict):
        command_domain = deepcopy(payload); command_domain["source"].pop("importedAt", None)
        canonical = json.dumps(command_domain, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        return self.repository.import_canon_event_owned(
            investigation_id=investigation_id, owner_principal_id=principal_id,
            expected_revision=expected_revision, idempotency_key=idempotency_key,
            command_hash=hashlib.sha256(canonical.encode("utf-8")).hexdigest(), payload=payload)
