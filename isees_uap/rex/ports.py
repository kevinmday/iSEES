from __future__ import annotations

from typing import Any, Protocol


class SourceAdapter(Protocol):
    adapter_identity: str
    adapter_version: str
    def retrieve(self, request: Any) -> Any: ...


class CandidateNormalizer(Protocol):
    normalizer_identity: str
    normalizer_version: str
    def normalize(self, request: Any) -> Any: ...


class QueryProposalProvider(Protocol):
    def propose_queries(self, context: Any) -> tuple[Any, ...]: ...
class EntityExtractionProvider(Protocol):
    def propose_entities(self, context: Any) -> tuple[Any, ...]: ...
class CandidateProposalProvider(Protocol):
    def propose_candidates(self, context: Any) -> tuple[Any, ...]: ...
class ResearchVectorProposalProvider(Protocol):
    def propose_vectors(self, context: Any) -> tuple[Any, ...]: ...


class NoAiProposalProvider:
    provider_identity = "NONE"
    model_identity = "NONE"
    model_class = "NONE"
    def propose_queries(self, context: Any) -> tuple[Any,...]: return ()
    def propose_entities(self, context: Any) -> tuple[Any,...]: return ()
    def propose_candidates(self, context: Any) -> tuple[Any,...]: return ()
    def propose_vectors(self, context: Any) -> tuple[Any,...]: return ()
