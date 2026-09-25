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
class OperationalGraphRevision:
    investigation_id: str
    operational_revision_id: str
    revision_number: int
    parent_operational_revision_id: str | None
    graph_snapshot: dict[str, Any]
    graph_fingerprint: str
    graph_schema_version: str
    algorithm_version: str
    actor_authority: str
    recorded_at: datetime
    mutation_kind: str
    source_identity: str | None = None


@dataclass(frozen=True)
class OperationalRevisionLineage:
    investigation_id: str
    current_operational_revision_id: str
    revisions: tuple[OperationalGraphRevision, ...]


@dataclass(frozen=True)
class InvestigationActivation:
    investigation: Investigation
    aggregate: InvestigationAggregate
    operational_lineage: OperationalRevisionLineage | None


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

@dataclass(frozen=True)
class ManifoldArtifactAdmissionReceipt:
    receipt_id: str
    owner_principal_id: str
    investigation_id: str
    studio_artifact_id: str
    author_revision_id: str
    projection_id: str
    verified_output_hash: str
    admitted_artifact_node_id: str
    selected_relationship_declaration_ids: tuple[str, ...]
    created_relationship_ids: tuple[str, ...]
    previous_operational_revision_id: str | None
    resulting_operational_revision_id: str
    command_hash: str
    idempotency_key: str
    admitted_at: datetime
    canon_effect: str = "NONE"
    manifold_effect: str = "REVISION_APPENDED"
    rex_effect: str = "NONE"
    tavily_effect: str = "NONE"
    candidate_evidence_effect: str = "NONE"
    research_inbox_effect: str = "NONE"
    billing_effect: str = "NONE"


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
