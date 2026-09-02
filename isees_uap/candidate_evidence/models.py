from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class Principal:
    principal_id: str


@dataclass(frozen=True)
class CandidateRecord:
    candidate_id: str
    investigation_id: str
    revision: int
    origin: str
    origin_identity: str
    lineage: dict[str, Any]
    source: dict[str, Any]
    association: dict[str, Any] | None
    lifecycle_state: str
    acquisition_state: str
    archive_state: str
    availability: str
    review_decision: dict[str, Any] | None
    created_at: str
    updated_at: str
    created_by_principal_id: str
