from __future__ import annotations

from typing import Any

from isees_uap.research_sources.sqlite_repository import SQLiteResearchSourceRepository

from .ports import SourceResolutionResult


class UnsupportedSourceRoute(Exception):
    pass


class ManifoldResearchSourceResolution:
    def __init__(self, repository: SQLiteResearchSourceRepository):
        self.repository = repository

    def resolve_source(self, *, snapshot: Any, principal_id: str,
                       investigation_id: str) -> SourceResolutionResult:
        canonical = self.repository.resolve(anchor_id=snapshot.anchor_id,
            investigation_id=investigation_id, principal_id=principal_id)
        return SourceResolutionResult(canonical is not None, canonical or {})


class CandidateEvidenceSourceResolution:
    """Candidate Evidence remains a distinct route; unsupported shapes fail closed."""
    def resolve_source(self, **_: Any) -> SourceResolutionResult:
        raise RuntimeError("Candidate Evidence source resolution is not configured")


class RoutedStudioSourceResolution:
    def __init__(self, manifold: ManifoldResearchSourceResolution,
                 candidate_evidence: CandidateEvidenceSourceResolution):
        self.manifold = manifold
        self.candidate_evidence = candidate_evidence

    def resolve_source(self, *, snapshot: Any, principal_id: str,
                       investigation_id: str) -> SourceResolutionResult:
        if snapshot.source_workspace == "MANIFOLD" and snapshot.source_kind.value in ("EVENT_NODE", "CORRESPONDENCE_EDGE"):
            return self.manifold.resolve_source(snapshot=snapshot, principal_id=principal_id,
                                                investigation_id=investigation_id)
        if snapshot.source_workspace == "EVIDENCE" and snapshot.source_kind.value == "EVIDENCE":
            return self.candidate_evidence.resolve_source(snapshot=snapshot, principal_id=principal_id,
                                                          investigation_id=investigation_id)
        raise UnsupportedSourceRoute(f"Unsupported source route {snapshot.source_workspace}/{snapshot.source_kind.value}")
