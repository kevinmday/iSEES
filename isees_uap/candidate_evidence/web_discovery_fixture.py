"""Offline, deterministic Web Discovery fixture adapter (no I/O)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import hashlib

from .url_normalization import normalize_web_discovery_url
from .web_discovery import (
    CancellationBoundary, OperationReceipt, OUTCOME_SCHEMA_VERSION, RECEIPT_SCHEMA_VERSION,
    SearchOutcome, SearchRequest, SearchResult, SearchStatus, StableError,
    WebDiscoveryError, WebDiscoveryErrorCode,
)


FIXTURE_ADAPTER_ID = "offline-web-discovery-fixture"
FIXTURE_ADAPTER_VERSION = "1.0.0"


@dataclass(frozen=True, slots=True)
class _FixtureItem:
    provider_id: str
    title: str
    url: str
    snippet: str
    media_type: str | None = None


class DeterministicWebDiscoveryFixture:
    adapter_id = FIXTURE_ADAPTER_ID
    adapter_version = FIXTURE_ADAPTER_VERSION
    provider_attribution = "Deterministic offline fixture"

    def __init__(self) -> None:
        self.execution_count = 0

    def search(self, request: SearchRequest, cancellation: CancellationBoundary) -> SearchOutcome:
        self.execution_count += 1
        query = request.normalized_query.casefold()
        if cancellation.is_cancelled() or query == "cancelled":
            return self._terminal(request, SearchStatus.CANCELLED, WebDiscoveryErrorCode.CANCELLED)
        if query == "unavailable":
            return self._terminal(request, SearchStatus.UNAVAILABLE, WebDiscoveryErrorCode.UNAVAILABLE)
        if query == "rate limited":
            return self._terminal(request, SearchStatus.RATE_LIMITED, WebDiscoveryErrorCode.RATE_LIMITED)
        if query == "provider failure":
            return self._terminal(request, SearchStatus.FAILED, WebDiscoveryErrorCode.PROVIDER_FAILURE)
        if query == "malformed metadata":
            normalized = normalize_web_discovery_url("https://example.test/valid")
            # Deliberately exercises the domain's fail-closed metadata validation.
            SearchResult("bad", request.search_session_id, None, 1, "Bad", "file:///bad",
                         normalized.normalized_url, normalized.normalized_url,
                         normalized.display_domain, "Bad metadata", None, self.provider_attribution)
            raise AssertionError("malformed fixture metadata was accepted")
        items = self._items(query)
        results = tuple(self._result(request, rank, item) for rank, item in enumerate(
            items[:request.requested_result_limit], start=1
        ))
        status = SearchStatus.COMPLETED if results else SearchStatus.ZERO_RESULTS
        return self._outcome(request, status, results)

    @staticmethod
    def _items(query: str) -> tuple[_FixtureItem, ...]:
        if query in ("zero", "zero results"):
            return ()
        if query in ("one", "one result"):
            return (_FixtureItem("provider-1", "Untrusted fixture title",
                                 "HTTPS://Example.COM:443/report?source=fixture#section",
                                 "Untrusted provider-attributed snippet.", "text/html"),)
        return (
            _FixtureItem("provider-1", "First untrusted title", "https://example.test/a?q=1",
                         "First untrusted snippet.", "text/html"),
            _FixtureItem("provider-2", "Second untrusted title", "http://research.example.test:80/b",
                         "Second untrusted snippet."),
            _FixtureItem("provider-3", "Third untrusted title", "https://archive.example.test/c",
                         "Third untrusted snippet.", "application/pdf"),
        )

    def _result(self, request: SearchRequest, rank: int, item: _FixtureItem) -> SearchResult:
        normalized = normalize_web_discovery_url(item.url)
        digest = hashlib.sha256(
            f"{self.adapter_version}\0{request.search_session_id}\0{item.provider_id}".encode()
        ).hexdigest()[:24]
        return SearchResult(
            result_id=f"wdr-{digest}", search_session_id=request.search_session_id,
            provider_result_id=item.provider_id, rank=rank, title=item.title,
            provider_returned_url=item.url, normalized_url=normalized.normalized_url,
            display_url=normalized.normalized_url, display_domain=normalized.display_domain,
            snippet=item.snippet, media_type=item.media_type,
            attribution=self.provider_attribution,
            retention_restrictions=("SESSION_ONLY", "UNTRUSTED_PROVIDER_METADATA"),
            provider_metadata=(("language", "en"),), result_at=request.created_at,
            selected_object_context=request.selected_object_context,
        )

    def _terminal(self, request: SearchRequest, status: SearchStatus,
                  code: WebDiscoveryErrorCode) -> SearchOutcome:
        return self._outcome(request, status, (), StableError(code, code.value))

    def _outcome(self, request: SearchRequest, status: SearchStatus,
                 results: tuple[SearchResult, ...], error: StableError | None = None) -> SearchOutcome:
        completed_at: datetime = request.created_at
        receipt = OperationReceipt(
            RECEIPT_SCHEMA_VERSION, request.operation_id, request.principal_id,
            request.investigation_id, request.manifold_revision_id, status,
            request.created_at, completed_at,
        )
        return SearchOutcome(
            OUTCOME_SCHEMA_VERSION, request.search_session_id, request.operation_id,
            self.adapter_id, self.adapter_version, self.provider_attribution,
            request.created_at, completed_at, status, results, receipt,
            restrictions=("METADATA_ONLY", "SESSION_EPHEMERAL"),
            warnings=("Titles and snippets are untrusted provider metadata.",), error=error,
        )
