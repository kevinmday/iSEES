from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any


class InvestigationLifecycle(str, Enum):
    ACTIVE = "ACTIVE"


@dataclass(frozen=True)
class Investigation:
    investigation_id: str
    owner_principal_id: str
    title: str
    objective: str | None
    lifecycle: InvestigationLifecycle
    created_at: datetime
    modified_at: datetime
    version: int


@dataclass(frozen=True)
class InvestigationSummary:
    investigation_id: str
    title: str
    objective: str | None
    lifecycle: InvestigationLifecycle
    created_at: datetime
    modified_at: datetime
    version: int


@dataclass(frozen=True)
class InvestigationAggregate:
    investigation_id: str
    schema_version: str
    state: str
    revision: int
    payload: dict[str, Any] | None = None


@dataclass(frozen=True)
class AdoptionReceipt:
    investigation_id: str
    owner_principal_id: str
    source_guest_investigation_id: str
    source_schema_version: str
    source_snapshot_timestamp: datetime
    payload_digest: str
    adopted_at: datetime
    resulting_revision: int
    payload: dict[str, Any]


def summarize(investigation: Investigation) -> InvestigationSummary:
    return InvestigationSummary(
        investigation_id=investigation.investigation_id,
        title=investigation.title,
        objective=investigation.objective,
        lifecycle=investigation.lifecycle,
        created_at=investigation.created_at,
        modified_at=investigation.modified_at,
        version=investigation.version,
    )
