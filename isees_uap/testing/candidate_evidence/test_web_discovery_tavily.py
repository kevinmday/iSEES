from datetime import datetime, timedelta, timezone
import json

import pytest

from isees_uap.candidate_evidence.web_discovery import (
    Cancellation, MAX_SNIPPET_LENGTH, MAX_TITLE_LENGTH, ProviderCreditUsage,
    QUERY_NORMALIZATION_VERSION, SEARCH_SCHEMA_VERSION, SearchRequest, SearchStatus,
)
from isees_uap.candidate_evidence.web_discovery_tavily import (
    TAVILY_ADAPTER_ID, TAVILY_ADAPTER_VERSION, TAVILY_ENDPOINT, TavilyWebDiscoveryAdapter,
)
from isees_uap.candidate_evidence.web_discovery_transport import (
    CreditUsage, TransportAccounting, TransportError, TransportErrorCode, TransportResult,
)


NOW = datetime(2026, 1, 2, tzinfo=timezone.utc)


def request(limit=10, session="session-1", principal="principal-1", investigation="investigation-1"):
    return SearchRequest(
        SEARCH_SCHEMA_VERSION, session, "operation-1", principal, investigation, 3,
        "investigation-aggregate:3", "normalized query", QUERY_NORMALIZATION_VERSION,
        None, limit, TAVILY_ADAPTER_ID, TAVILY_ADAPTER_VERSION, "key-1", True, True,
        NOW, NOW + timedelta(minutes=15))


class FakeTransport:
    def __init__(self, response=None, error=None):
        self.response = response or result({"results": [], "usage": {"credits": 1}})
        self.error = error
        self.calls = []

    def post_json(self, **kwargs):
        self.calls.append(kwargs)
        if self.error:
            raise self.error
        return self.response


def result(body, status=200, content_type="application/json"):
    encoded = body if isinstance(body, bytes) else json.dumps(body).encode()
    return TransportResult(status, encoded, TransportAccounting(1, CreditUsage.ACTUAL),
                           content_type=content_type)


def adapter(transport):
    return TavilyWebDiscoveryAdapter("server-secret", transport=transport)


def test_production_adapter_has_one_fixed_tavily_search_authority_and_zero_retries():
    live_boundary = TavilyWebDiscoveryAdapter("server-secret")
    assert live_boundary._transport.endpoint == TAVILY_ENDPOINT == "https://api.tavily.com/search"


def test_exact_request_shape_bearer_secret_and_no_result_fetch_or_retry():
    transport = FakeTransport(result({"results": [{
        "id": "provider-1", "title": "Title", "url": "https://example.com/a", "content": "Snippet"
    }], "usage": {"credits": 1}}))
    outcome = adapter(transport).search(request(limit=50), Cancellation())
    assert outcome.status == SearchStatus.COMPLETED and len(transport.calls) == 1
    call = transport.calls[0]
    assert call["secret_headers"] == {"Authorization": "Bearer server-secret"}
    assert call["principal_id"] == "principal-1"
    assert call["payload"] == {
        "query": "normalized query", "topic": "general", "search_depth": "basic",
        "chunks_per_source": 1, "max_results": 10, "include_answer": False,
        "include_raw_content": False, "include_images": False,
        "include_image_descriptions": False, "include_favicon": False,
        "include_published_date": False, "auto_parameters": False, "include_usage": True,
    }
    assert "api_key" not in call["payload"] and "answer" not in call["payload"]


def test_response_mapping_discards_metadata_score_and_uses_opaque_session_ids():
    transport = FakeTransport(result({"query": "untrusted", "request_id": "request-secret",
        "response_time": 1, "answer": "discard", "images": ["discard"],
        "results": [{"id": "tavily-id", "title": "Title", "url": "HTTPS://Example.COM:443/a#x",
                     "content": "Snippet", "score": 0.99, "raw_content": "discard",
                     "favicon": "discard", "published_date": "discard", "extra": "discard"}],
        "usage": {"credits": 1, "other": "discard"}}))
    outcome = adapter(transport).search(request(), Cancellation())
    item = outcome.results[0]
    assert item.provider_result_id == "tavily-id" and item.result_id.startswith("wdr-")
    assert "tavily-id" not in item.result_id and item.normalized_url == "https://example.com/a"
    assert item.provider_metadata == () and item.attribution == "Tavily Search"
    assert not hasattr(item, "score") and outcome.receipt.provider_credit_usage == ProviderCreditUsage.ACTUAL


def test_invalid_duplicates_are_individually_discarded_with_sanitized_count():
    body = {"results": [
        {"id": "one", "title": "One", "url": "https://example.com/a", "content": "ok"},
        {"id": "one", "title": "Duplicate id", "url": "https://example.com/b", "content": "bad"},
        {"id": "three", "title": "Duplicate url", "url": "https://EXAMPLE.com:443/a#x", "content": "bad"},
        {"id": "four", "title": "Unsafe", "url": "http://127.0.0.1", "content": "bad"},
    ], "usage": {"credits": 1}}
    outcome = adapter(FakeTransport(result(body))).search(request(), Cancellation())
    assert outcome.status == SearchStatus.COMPLETED and outcome.result_count == 1
    assert outcome.warnings[-1] == "Discarded 3 invalid or duplicate provider result(s)."


@pytest.mark.parametrize("body,status", [
    ({"results": [], "usage": {"credits": 1}}, SearchStatus.ZERO_RESULTS),
    ({"results": [{"id": "bad"}], "usage": {"credits": 1}}, SearchStatus.FAILED),
])
def test_empty_vs_all_invalid_results(body, status):
    assert adapter(FakeTransport(result(body))).search(request(), Cancellation()).status == status


@pytest.mark.parametrize("response", [
    result(b'{"results":[]', content_type="application/json"),
    result(b'{"results":[],"results":[]}', content_type="application/json"),
    result(b'{"results":[],"response_time":NaN}', content_type="application/json"),
    result({"results": []}, content_type="text/html"),
])
def test_wrong_content_type_malformed_truncated_and_duplicate_key_json_fail(response):
    outcome = adapter(FakeTransport(response)).search(request(), Cancellation())
    assert outcome.status == SearchStatus.FAILED and outcome.results == ()


@pytest.mark.parametrize("status,expected", [
    (401, SearchStatus.UNAVAILABLE), (400, SearchStatus.FAILED), (422, SearchStatus.FAILED),
    (429, SearchStatus.RATE_LIMITED), (432, SearchStatus.UNAVAILABLE),
    (433, SearchStatus.UNAVAILABLE), (500, SearchStatus.FAILED),
])
def test_stable_http_error_mapping_without_provider_body_exposure(status, expected):
    outcome = adapter(FakeTransport(result(b'SECRET provider body', status=status))).search(request(), Cancellation())
    assert outcome.status == expected and "SECRET" not in str(outcome)


@pytest.mark.parametrize("code,diagnostic,expected", [
    (TransportErrorCode.CONNECT_FAILURE, "connect_failure", SearchStatus.UNAVAILABLE),
    (TransportErrorCode.CONNECT_TIMEOUT, "connect_timeout", SearchStatus.UNAVAILABLE),
    (TransportErrorCode.READ_TIMEOUT, "read_timeout", SearchStatus.FAILED),
    (TransportErrorCode.TOTAL_TIMEOUT, "total_deadline_exceeded", SearchStatus.FAILED),
    (TransportErrorCode.CIRCUIT_OPEN, "provider_circuit_open", SearchStatus.UNAVAILABLE),
    (TransportErrorCode.RATE_LIMITED, "dispatch_rate_limit_reached", SearchStatus.RATE_LIMITED),
    (TransportErrorCode.CANCELLED, "cancelled_during_response", SearchStatus.CANCELLED),
])
def test_transport_error_mapping_and_accounting(code, diagnostic, expected):
    accounting = TransportAccounting(0, CreditUsage.ZERO) if code in (
        TransportErrorCode.CIRCUIT_OPEN, TransportErrorCode.RATE_LIMITED) else TransportAccounting(
            1, CreditUsage.ESTIMATED)
    outcome = adapter(FakeTransport(error=TransportError(code, diagnostic, accounting))).search(
        request(), Cancellation())
    assert outcome.status == expected
    assert outcome.receipt.provider_credits_consumed == accounting.provider_credits_consumed
    assert outcome.receipt.monetary_cost == outcome.receipt.researcher_charge == "0.00"
    assert outcome.receipt.billing_triggered is False


def test_more_than_one_credit_is_contract_failure_and_missing_usage_is_estimated():
    excessive = adapter(FakeTransport(result({"results": [], "usage": {"credits": 2}}))).search(
        request(), Cancellation())
    missing = adapter(FakeTransport(result({"results": []}))).search(request(), Cancellation())
    assert excessive.status == SearchStatus.FAILED
    assert missing.status == SearchStatus.ZERO_RESULTS
    assert missing.receipt.provider_credit_usage == ProviderCreditUsage.ESTIMATED


def test_oversized_normalized_title_is_truncated_retained_and_restricted():
    raw_title = "  \uff34itle\t" + "x" * MAX_TITLE_LENGTH
    body = {"results": [{"id": "title-1", "title": raw_title,
                          "url": "https://example.org/title", "content": "Snippet"}],
            "usage": {"credits": 1}}
    outcome = adapter(FakeTransport(result(body))).search(request(), Cancellation())
    item = outcome.results[0]
    assert outcome.status == SearchStatus.COMPLETED
    assert item.title == ("Title " + "x" * MAX_TITLE_LENGTH)[:MAX_TITLE_LENGTH]
    assert len(item.title) == MAX_TITLE_LENGTH
    assert item.retention_restrictions == (
        "SESSION_ONLY", "UNTRUSTED_PROVIDER_METADATA", "TRUNCATED_PROVIDER_METADATA")


def test_oversized_normalized_snippet_is_truncated_retained_and_restricted():
    raw_content = "  Content\n" + "y" * MAX_SNIPPET_LENGTH
    body = {"results": [{"id": "snippet-1", "title": "Title",
                          "url": "https://example.net/snippet", "content": raw_content}],
            "usage": {"credits": 1}}
    outcome = adapter(FakeTransport(result(body))).search(request(), Cancellation())
    item = outcome.results[0]
    assert outcome.status == SearchStatus.COMPLETED
    assert item.snippet == ("Content " + "y" * MAX_SNIPPET_LENGTH)[:MAX_SNIPPET_LENGTH]
    assert len(item.snippet) == MAX_SNIPPET_LENGTH
    assert item.retention_restrictions == (
        "SESSION_ONLY", "UNTRUSTED_PROVIDER_METADATA", "TRUNCATED_PROVIDER_METADATA")


def test_oversized_provider_identifier_remains_discarded():
    body = {"results": [{"id": "x" * 501, "title": "Title",
                          "url": "https://example.com", "content": "Snippet"}],
            "usage": {"credits": 1}}
    outcome = adapter(FakeTransport(result(body))).search(request(), Cancellation())
    assert outcome.status == SearchStatus.FAILED and outcome.results == ()
