from datetime import datetime, timezone

import pytest

from isees_uap.candidate_evidence.web_discovery import SearchStatus
from isees_uap.candidate_evidence.web_discovery_fixture import FIXTURE_ADAPTER_ID, FIXTURE_ADAPTER_VERSION
from isees_uap.candidate_evidence.web_discovery_providers import (
    FALLBACK_ADAPTER_ID, FALLBACK_ATTRIBUTION, WebDiscoveryProviderRegistry,
)
from isees_uap.candidate_evidence.web_discovery_runtime import WebDiscoverySearchRuntime
from isees_uap.candidate_evidence.web_discovery_schemas import WebDiscoverySearchCommand
from isees_uap.candidate_evidence.web_discovery_tavily import TAVILY_ADAPTER_ID, TAVILY_ADAPTER_VERSION
from isees_uap.candidate_evidence.web_discovery_transport import (
    CreditUsage, TransportAccounting, TransportError, TransportErrorCode, TransportResult,
)


def command(adapter_id, adapter_version, *, session="session-1", key="key-1", investigation="inv-1"):
    return WebDiscoverySearchCommand.model_validate({
        "schemaVersion": "web-discovery-search/v1", "investigationId": investigation,
        "expectedInvestigationRevision": 1, "manifoldRevisionId": "investigation-aggregate:1",
        "searchSessionId": session, "operationId": f"op-{session}", "query": "one",
        "resultLimit": 10, "adapterId": adapter_id, "adapterVersion": adapter_version,
        "idempotencyKey": key, "executionPolicy": {"metadataOnly": True, "aiAssistance": "NONE",
        "rexExecution": "NONE", "authorizedSpend": 0}})


class NeverTransport:
    calls = 0
    def post_json(self, **kwargs):
        self.calls += 1
        raise AssertionError("network dispatch was not authorized")


class UnavailableTransport:
    def __init__(self): self.calls = 0
    def post_json(self, **kwargs):
        self.calls += 1
        raise TransportError(TransportErrorCode.CIRCUIT_OPEN, "provider_circuit_open",
                             TransportAccounting(0, CreditUsage.ZERO))


class SuccessfulTransport:
    def __init__(self): self.calls = 0
    def post_json(self, **kwargs):
        import json
        self.calls += 1
        body = json.dumps({"results": [{"id": "provider-1", "title": "Title",
            "url": "https://example.com/source", "content": "Snippet"}],
            "usage": {"credits": 1}}).encode()
        return TransportResult(200, body, TransportAccounting(1, CreditUsage.ACTUAL),
                               content_type="application/json")


class QuotaTransport:
    def post_json(self, **kwargs):
        return TransportResult(432, b'provider body is never exposed',
                               TransportAccounting(1, CreditUsage.ACTUAL),
                               content_type="text/plain")


def test_default_offline_mode_is_deterministic_zero_credit_regression():
    transport = NeverTransport()
    registry = WebDiscoveryProviderRegistry({}, transport=transport)
    runtime = WebDiscoverySearchRuntime(provider_registry=registry)
    outcome = runtime.search(principal_id="p1", command=command(FIXTURE_ADAPTER_ID, FIXTURE_ADAPTER_VERSION)).response
    assert registry.mode == "offline" and outcome.status == "COMPLETED"
    assert outcome.receipt.providerCreditsConsumed == 0 and transport.calls == 0


@pytest.mark.parametrize("mode", ["", " ", "Offline", "TAVILY", "unknown", " tavily", "tavily "])
def test_unknown_blank_padded_and_case_mismatched_modes_fail_closed(mode):
    with pytest.raises(RuntimeError):
        WebDiscoveryProviderRegistry({"ISEES_WEB_DISCOVERY_MODE": mode})


def test_tavily_missing_key_is_unavailable_without_silent_fallback_or_dispatch():
    registry = WebDiscoveryProviderRegistry({"ISEES_WEB_DISCOVERY_MODE": "tavily"})
    result = WebDiscoverySearchRuntime(provider_registry=registry).search(
        principal_id="p", command=command(TAVILY_ADAPTER_ID, TAVILY_ADAPTER_VERSION))
    assert result.status_code == 503 and result.response.status == "UNAVAILABLE"
    assert result.response.providerAttribution == "Tavily Search" and result.response.resultCount == 0


def test_tavily_mode_uses_only_server_selected_provider_and_actual_credit():
    transport = SuccessfulTransport()
    registry = WebDiscoveryProviderRegistry({"ISEES_WEB_DISCOVERY_MODE": "tavily",
                                              "ISEES_TAVILY_API_KEY": "server-secret"}, transport=transport)
    response = WebDiscoverySearchRuntime(provider_registry=registry).search(
        principal_id="p", command=command(TAVILY_ADAPTER_ID, TAVILY_ADAPTER_VERSION)).response
    assert transport.calls == 1 and response.providerAttribution == "Tavily Search"
    assert response.receipt.providerCreditsConsumed == 1
    assert response.receipt.providerCreditUsage == "ACTUAL"


def test_explicit_fallback_missing_credentials_is_clear_offline_only_and_zero_credit():
    registry = WebDiscoveryProviderRegistry({"ISEES_WEB_DISCOVERY_MODE": "explicit-fallback"})
    result = WebDiscoverySearchRuntime(provider_registry=registry).search(
        principal_id="p", command=command(FALLBACK_ADAPTER_ID, "1.0.0")).response
    assert result.status == "COMPLETED" and result.providerAttribution == FALLBACK_ATTRIBUTION
    assert {item.attribution for item in result.results} == {FALLBACK_ATTRIBUTION}
    assert result.receipt.providerCreditsConsumed == 0
    assert any("offline fixture" in warning.casefold() for warning in result.warnings)


def test_explicit_fallback_after_circuit_open_never_mixes_providers():
    transport = UnavailableTransport()
    registry = WebDiscoveryProviderRegistry({"ISEES_WEB_DISCOVERY_MODE": "explicit-fallback",
                                              "ISEES_TAVILY_API_KEY": "secret"}, transport=transport)
    response = WebDiscoverySearchRuntime(provider_registry=registry).search(
        principal_id="p", command=command(FALLBACK_ADAPTER_ID, "1.0.0")).response
    assert transport.calls == 1 and response.status == "COMPLETED"
    assert all(item.attribution == FALLBACK_ATTRIBUTION for item in response.results)


def test_explicit_fallback_preserves_credit_spent_before_quota_response():
    registry = WebDiscoveryProviderRegistry({"ISEES_WEB_DISCOVERY_MODE": "explicit-fallback",
                                              "ISEES_TAVILY_API_KEY": "secret"}, transport=QuotaTransport())
    response = WebDiscoverySearchRuntime(provider_registry=registry).search(
        principal_id="p", command=command(FALLBACK_ADAPTER_ID, "1.0.0")).response
    assert response.status == "COMPLETED" and response.receipt.providerCreditsConsumed == 1
    assert response.receipt.providerCreditUsage == "ACTUAL"


def test_browser_adapter_identity_cannot_override_server_selection():
    runtime = WebDiscoverySearchRuntime(provider_registry=WebDiscoveryProviderRegistry({}))
    with pytest.raises(Exception) as raised:
        runtime.search(principal_id="p", command=command(TAVILY_ADAPTER_ID, TAVILY_ADAPTER_VERSION))
    assert getattr(raised.value, "code", None) == "WEB_DISCOVERY_UNSUPPORTED_ADAPTER"
    assert runtime.adapter_execution_count == 0


def test_duplicate_replay_and_principal_investigation_capture_authority_are_preserved():
    runtime = WebDiscoverySearchRuntime(provider_registry=WebDiscoveryProviderRegistry({}))
    cmd = command(FIXTURE_ADAPTER_ID, FIXTURE_ADAPTER_VERSION)
    first = runtime.search(principal_id="p1", command=cmd).response
    replay = runtime.search(principal_id="p1", command=cmd).response
    assert replay == first and runtime.adapter_execution_count == 1
    result_id = first.results[0].resultId
    runtime.resolve_capture(principal_id="p1", investigation_id="inv-1",
                            expected_investigation_revision=1, manifold_revision_id="investigation-aggregate:1",
                            search_session_id="session-1", result_id=result_id)
    for principal, investigation in (("p2", "inv-1"), ("p1", "inv-2")):
        with pytest.raises(Exception):
            runtime.resolve_capture(principal_id=principal, investigation_id=investigation,
                                    expected_investigation_revision=1,
                                    manifold_revision_id="investigation-aggregate:1",
                                    search_session_id="session-1", result_id=result_id)


def test_registry_modules_do_not_import_candidate_persistence_or_downstream_owners():
    from pathlib import Path
    sources = "".join(Path(path).read_text(encoding="utf-8") for path in (
        "isees_uap/candidate_evidence/web_discovery_tavily.py",
        "isees_uap/candidate_evidence/web_discovery_providers.py"))
    imports = "\n".join(line for line in sources.splitlines() if line.startswith(("import ", "from ")))
    assert all(term not in imports.casefold() for term in (
        "repository", "publication", "research_sources", "rex", "graph", "manifold", "browser"))
