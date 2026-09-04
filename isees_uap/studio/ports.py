from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol


@dataclass(frozen=True)
class AccessResult:
    allowed: bool


@dataclass(frozen=True)
class SourceResolutionResult:
    available: bool
    metadata: dict[str, Any]


@dataclass(frozen=True)
class PublicationReceipt:
    receipt_id: str
    candidate_node_id: str
    published_at: str


@dataclass(frozen=True)
class AcceptanceReceipt:
    receipt_id: str
    accepted_knowledge_id: str
    accepted_at: str


class InvestigationAccessPort(Protocol):
    def resolve_access(self, *, principal_id: str, investigation_id: str) -> AccessResult: ...


class StudioSourceResolutionPort(Protocol):
    def resolve_source(self, *, source_identity: str, source_investigation_id: str,
                       source_workspace: str, source_kind: str) -> SourceResolutionResult: ...


class ManifoldCandidatePublicationPort(Protocol):
    def publish_candidate(self, *, investigation_id: str, artifact_id: str,
                          artifact_version_id: str, candidate_artifact_id: str,
                          principal_id: str) -> PublicationReceipt: ...


class AcceptedKnowledgePort(Protocol):
    def accept_candidate(self, *, investigation_id: str, artifact_id: str,
                         artifact_version_id: str, candidate_artifact_id: str,
                         principal_id: str) -> AcceptanceReceipt: ...


class StudioDraftingProvider(Protocol):
    """Provider-neutral, bounded drafting port. Implementations receive no credentials or URL."""

    provider_id: str
    model_id: str

    def generate_proposal(self, *, request: Any) -> Any: ...
