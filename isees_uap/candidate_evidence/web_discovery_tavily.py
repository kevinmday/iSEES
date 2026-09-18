"""Metadata-only Tavily Search adapter over the governed Web Discovery transport."""

from __future__ import annotations

import hashlib
import json
import unicodedata
from typing import Protocol

from .url_normalization import UrlNormalizationError, normalize_web_discovery_url
from .web_discovery import (
    CancellationBoundary, MAX_SNIPPET_LENGTH, MAX_TITLE_LENGTH, OperationReceipt,
    OUTCOME_SCHEMA_VERSION, ProviderCreditUsage, RECEIPT_SCHEMA_VERSION, SearchOutcome,
    SearchRequest, SearchResult, SearchStatus, StableError, WebDiscoveryError,
    WebDiscoveryErrorCode,
)
from .web_discovery_transport import (
    CreditUsage, TransportAccounting, TransportError, TransportErrorCode, TransportResult,
    WebDiscoveryTransport,
)


TAVILY_ENDPOINT = "https://api.tavily.com/search"
TAVILY_ADAPTER_ID = "tavily-search"
TAVILY_ADAPTER_VERSION = "1.0.0"
TAVILY_ATTRIBUTION = "Tavily Search"


class JsonTransport(Protocol):
    def post_json(self, *, principal_id: str, payload: object,
                  secret_headers: dict[str, str],
                  cancellation: CancellationBoundary | None = None) -> TransportResult: ...


def _strict_json(body: bytes) -> object:
    def pairs(values):
        result = {}
        for key, value in values:
            if key in result:
                raise ValueError("duplicate key")
            result[key] = value
        return result
    return json.loads(body.decode("utf-8"), object_pairs_hook=pairs,
                      parse_constant=lambda _value: (_ for _ in ()).throw(ValueError("invalid number")))


def _normalize_provider_text(value: object, maximum: int) -> tuple[str, bool]:
    if not isinstance(value, str):
        raise ValueError
    normalized = " ".join(unicodedata.normalize("NFKC", value).split())
    if not normalized:
        raise ValueError
    return normalized[:maximum], len(normalized) > maximum


class TavilyWebDiscoveryAdapter:
    adapter_id = TAVILY_ADAPTER_ID
    adapter_version = TAVILY_ADAPTER_VERSION
    provider_attribution = TAVILY_ATTRIBUTION

    def __init__(self, api_key: str, *, transport: JsonTransport | None = None):
        if not isinstance(api_key, str) or not api_key or api_key != api_key.strip():
            raise ValueError("Tavily API key is unavailable")
        self._api_key = api_key
        self._transport = transport or WebDiscoveryTransport(endpoint=TAVILY_ENDPOINT)
        self.execution_count = 0

    def search(self, request: SearchRequest, cancellation: CancellationBoundary) -> SearchOutcome:
        self.execution_count += 1
        payload = {
            "query": request.normalized_query, "topic": "general", "search_depth": "basic",
            "chunks_per_source": 1, "max_results": min(request.requested_result_limit, 10),
            "include_answer": False, "include_raw_content": False, "include_images": False,
            "include_image_descriptions": False, "include_favicon": False,
            "include_published_date": False, "auto_parameters": False, "include_usage": True,
        }
        try:
            response = self._transport.post_json(
                principal_id=request.principal_id, payload=payload,
                secret_headers={"Authorization": f"Bearer {self._api_key}"}, cancellation=cancellation)
        except TransportError as error:
            return self._transport_failure(request, error)
        accounting = response.accounting
        if response.status_code != 200:
            return self._http_failure(request, response.status_code, accounting)
        if not response.content_type or response.content_type.split(";", 1)[0].strip().casefold() != "application/json":
            return self._terminal(request, SearchStatus.FAILED, WebDiscoveryErrorCode.PROVIDER_FAILURE, accounting)
        try:
            document = _strict_json(response.body)
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError):
            return self._terminal(request, SearchStatus.FAILED, WebDiscoveryErrorCode.PROVIDER_FAILURE, accounting)
        if not isinstance(document, dict) or not isinstance(document.get("results"), list):
            return self._terminal(request, SearchStatus.FAILED, WebDiscoveryErrorCode.PROVIDER_FAILURE, accounting)
        usage = document.get("usage")
        credits = usage.get("credits") if isinstance(usage, dict) else None
        if isinstance(credits, bool) or (credits is not None and not isinstance(credits, int)) or (credits or 0) > 1:
            return self._terminal(request, SearchStatus.FAILED, WebDiscoveryErrorCode.PROVIDER_FAILURE, accounting)
        actual = TransportAccounting(credits, CreditUsage.ACTUAL) if credits in (0, 1) else TransportAccounting(
            1, CreditUsage.ESTIMATED)
        if actual.provider_credits_consumed == 0:
            actual = TransportAccounting(0, CreditUsage.ZERO)
        raw_results = document["results"]
        if not raw_results:
            return self._outcome(request, SearchStatus.ZERO_RESULTS, (), actual)
        results: list[SearchResult] = []
        seen_ids: set[str] = set()
        seen_urls: set[str] = set()
        discarded = 0
        for item in raw_results[:min(request.requested_result_limit, 10)]:
            try:
                if not isinstance(item, dict):
                    raise ValueError
                provider_id, raw_title, url, raw_snippet = (
                    item.get(name) for name in ("id", "title", "url", "content"))
                if (not isinstance(provider_id, str) or not provider_id.strip() or len(provider_id) > 500
                        or not isinstance(url, str)):
                    raise ValueError
                title, title_truncated = _normalize_provider_text(raw_title, MAX_TITLE_LENGTH)
                snippet, snippet_truncated = _normalize_provider_text(raw_snippet, MAX_SNIPPET_LENGTH)
                normalized = normalize_web_discovery_url(url)
                if provider_id in seen_ids or normalized.normalized_url in seen_urls:
                    raise ValueError
                seen_ids.add(provider_id); seen_urls.add(normalized.normalized_url)
                digest = hashlib.sha256(
                    f"{request.search_session_id}\0{len(results) + 1}\0{provider_id}\0{normalized.normalized_url}".encode()
                ).hexdigest()[:32]
                restrictions = ["SESSION_ONLY", "UNTRUSTED_PROVIDER_METADATA"]
                if title_truncated or snippet_truncated:
                    restrictions.append("TRUNCATED_PROVIDER_METADATA")
                results.append(SearchResult(
                    f"wdr-{digest}", request.search_session_id, provider_id, len(results) + 1,
                    title, url, normalized.normalized_url, normalized.normalized_url,
                    normalized.display_domain, snippet, None, TAVILY_ATTRIBUTION,
                    tuple(restrictions), (), request.created_at,
                    request.selected_object_context,
                ))
            except (ValueError, UrlNormalizationError, WebDiscoveryError):
                discarded += 1
        if not results:
            return self._terminal(request, SearchStatus.FAILED, WebDiscoveryErrorCode.PROVIDER_FAILURE, actual)
        warnings = ["Titles and snippets are untrusted provider metadata."]
        if discarded:
            warnings.append(f"Discarded {discarded} invalid or duplicate provider result(s).")
        return self._outcome(request, SearchStatus.COMPLETED, tuple(results), actual, tuple(warnings))

    def _transport_failure(self, request: SearchRequest, error: TransportError) -> SearchOutcome:
        if error.code == TransportErrorCode.CANCELLED:
            status, code = SearchStatus.CANCELLED, WebDiscoveryErrorCode.CANCELLED
        elif error.code == TransportErrorCode.RATE_LIMITED:
            status, code = SearchStatus.RATE_LIMITED, WebDiscoveryErrorCode.RATE_LIMITED
        elif error.code in (TransportErrorCode.CIRCUIT_OPEN, TransportErrorCode.CONNECT_TIMEOUT,
                            TransportErrorCode.CONNECT_FAILURE):
            status, code = SearchStatus.UNAVAILABLE, WebDiscoveryErrorCode.UNAVAILABLE
        elif error.diagnostic == "provider_status_429":
            status, code = SearchStatus.RATE_LIMITED, WebDiscoveryErrorCode.RATE_LIMITED
        else:
            status, code = SearchStatus.FAILED, WebDiscoveryErrorCode.PROVIDER_FAILURE
        return self._terminal(request, status, code, error.accounting)

    def _http_failure(self, request: SearchRequest, status_code: int,
                      accounting: TransportAccounting) -> SearchOutcome:
        if status_code == 429:
            return self._terminal(request, SearchStatus.RATE_LIMITED, WebDiscoveryErrorCode.RATE_LIMITED, accounting)
        if status_code in (401, 432, 433):
            warnings = ("Provider quota exhausted.",) if status_code in (432, 433) else ()
            return self._terminal(request, SearchStatus.UNAVAILABLE, WebDiscoveryErrorCode.UNAVAILABLE,
                                  accounting, warnings)
        return self._terminal(request, SearchStatus.FAILED, WebDiscoveryErrorCode.PROVIDER_FAILURE, accounting)

    def _terminal(self, request: SearchRequest, status: SearchStatus, code: WebDiscoveryErrorCode,
                  accounting: TransportAccounting, warnings: tuple[str, ...] = ()) -> SearchOutcome:
        return self._outcome(request, status, (), accounting, warnings, StableError(code, code.value))

    def _outcome(self, request: SearchRequest, status: SearchStatus, results: tuple[SearchResult, ...],
                 accounting: TransportAccounting, warnings: tuple[str, ...] = (),
                 error: StableError | None = None) -> SearchOutcome:
        usage = ProviderCreditUsage(accounting.provider_credit_usage.value)
        receipt = OperationReceipt(
            RECEIPT_SCHEMA_VERSION, request.operation_id, request.principal_id,
            request.investigation_id, request.manifold_revision_id, status,
            request.created_at, request.created_at,
            provider_credits_consumed=accounting.provider_credits_consumed,
            provider_credit_usage=usage,
        )
        return SearchOutcome(
            OUTCOME_SCHEMA_VERSION, request.search_session_id, request.operation_id,
            self.adapter_id, self.adapter_version, self.provider_attribution,
            request.created_at, request.created_at, status, results, receipt,
            ("METADATA_ONLY", "SESSION_EPHEMERAL"), warnings, error,
        )
