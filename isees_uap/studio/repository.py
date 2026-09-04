from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol

from .models import (
    CandidateKnowledgeArtifact, StudioArtifact, StudioArtifactVersion,
    StudioProjectionRecord, StudioReviewDecision, StudioSourceSnapshot,
)


IdempotencyScope = tuple[str, str, str, str]


@dataclass(frozen=True)
class StudioAggregateRecord:
    artifact: StudioArtifact
    versions: tuple[StudioArtifactVersion, ...]
    source_snapshots: tuple[StudioSourceSnapshot, ...]
    candidates: tuple[CandidateKnowledgeArtifact, ...] = ()
    projections: tuple[StudioProjectionRecord, ...] = ()
    review_decisions: tuple[StudioReviewDecision, ...] = ()
    publication_receipts: tuple[dict[str, Any], ...] = ()
    acceptance_receipts: tuple[dict[str, Any], ...] = ()


@dataclass(frozen=True)
class IdempotencyRecord:
    command_hash: str
    result: dict[str, Any]


class StudioRepository(Protocol):
    """Persistence seam. Implementations decide durability and atomicity strategy."""

    def get(self, *, artifact_id: str) -> StudioAggregateRecord | None: ...
    def create(self, *, record: StudioAggregateRecord) -> None: ...
    def replace(self, *, record: StudioAggregateRecord, expected_revision: int) -> None: ...
    def get_idempotency(self, *, scope: IdempotencyScope) -> IdempotencyRecord | None: ...
    def put_idempotency(self, *, scope: IdempotencyScope, record: IdempotencyRecord) -> None: ...
