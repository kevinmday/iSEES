from datetime import datetime, timezone

import pytest

from isees_uap.candidate_evidence.web_discovery_providers import (
    WebDiscoveryMode, WebDiscoveryProviderRegistry, WebDiscoveryRuntimeStatus,
)
from isees_uap.candidate_evidence.web_discovery_runtime import WebDiscoverySearchRuntime
from isees_uap.candidate_evidence.web_discovery_schemas import WebDiscoverySearchCommand
from isees_uap.candidate_evidence.web_discovery_transport import (
    CreditUsage, TransportAccounting, TransportError, TransportErrorCode, TransportResult,
)


def command(*, session="session-1", key="key-1", investigation="inv-1"):
    return WebDiscoverySearchCommand.model_validate({
        "schemaVersion": "web-discovery-search/v1", "investigationId": investigation,
        "expectedInvestigationRevision": 1, "manifoldRevisionId": "investigation-aggregate:1",
        "searchSessionId": session, "operationId": f"op-{session}", "query": "one",
        "resultLimit": 10, "idempotencyKey": key,
        "executionPolicy": {"metadataOnly": True, "aiAssistance": "NONE",
                            "rexExecution": "NONE", "authorizedSpend": 0}})


class NeverTransport:
    def __init__(self): self.calls = 0
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


def test_default_and_explicit_disabled_are_unavailable_without_provider_request():
    for environment in ({}, {"ISEES_WEB_DISCOVERY_MODE": "DISABLED"}):
        transport = NeverTransport()
        registry = WebDiscoveryProviderRegistry(environment, transport=transport)
        result = WebDiscoverySearchRuntime(provider_registry=registry).search(
            principal_id="p", command=command())
        assert registry.mode == "DISABLED"
        assert registry.runtime_status is WebDiscoveryRuntimeStatus.UNAVAILABLE
        assert result.status_code == 503 and result.response.runtimeStatus == "UNAVAILABLE"
        assert transport.calls == 0


def test_explicit_fixture_selects_only_fixture_and_zero_credit():
    transport = NeverTransport()
    registry = WebDiscoveryProviderRegistry(
        {"ISEES_WEB_DISCOVERY_MODE": "OFFLINE_FIXTURE"}, transport=transport)
    response = WebDiscoverySearchRuntime(provider_registry=registry).search(
        principal_id="p", command=command()).response
    assert registry.runtime_status is WebDiscoveryRuntimeStatus.OFFLINE_FIXTURE
    assert response.status == "COMPLETED" and response.runtimeStatus == "OFFLINE_FIXTURE"
    assert response.receipt.providerCreditsConsumed == 0 and transport.calls == 0


@pytest.mark.parametrize("key", [None, "", " ", "short", "contains whitespace", "é" * 12])
def test_tavily_missing_or_invalid_key_fails_closed_without_dispatch(key):
    environment = {"ISEES_WEB_DISCOVERY_MODE": "TAVILY"}
    if key is not None:
        environment["ISEES_TAVILY_API_KEY"] = key
    transport = NeverTransport()
    registry = WebDiscoveryProviderRegistry(environment, transport=transport)
    result = WebDiscoverySearchRuntime(provider_registry=registry).search(
        principal_id="p", command=command())
    assert registry.mode == WebDiscoveryMode.DISABLED.value
    assert result.status_code == 503 and result.response.runtimeStatus == "UNAVAILABLE"
    assert transport.calls == 0


@pytest.mark.parametrize("mode", ["", " ", "offline", "tavily", "UNKNOWN", " TAVILY"])
def test_invalid_mode_fails_closed_without_secret_in_diagnostic(mode):
    secret = "fake-secret-that-must-not-appear"
    with pytest.raises(RuntimeError) as raised:
        WebDiscoveryProviderRegistry(
            {"ISEES_WEB_DISCOVERY_MODE": mode, "ISEES_TAVILY_API_KEY": secret})
    assert secret not in str(raised.value) and secret not in repr(raised.value)


def test_explicit_tavily_selects_adapter_and_separates_credit_from_cost_and_charge():
    transport = SuccessfulTransport()
    secret = "fake-tavily-key-123"
    registry = WebDiscoveryProviderRegistry(
        {"ISEES_WEB_DISCOVERY_MODE": "TAVILY", "ISEES_TAVILY_API_KEY": secret},
        transport=transport)
    result = WebDiscoverySearchRuntime(provider_registry=registry).search(
        principal_id="p", command=command())
    body = result.response.model_dump(mode="json")
    assert transport.calls == 1 and body["runtimeStatus"] == "LIVE_WEB_DISCOVERY"
    assert body["receipt"]["providerCreditsConsumed"] == 1
    assert body["receipt"]["providerCreditUsage"] == "ACTUAL"
    assert body["receipt"]["monetaryCost"] == body["receipt"]["researcherCharge"] == "0.00"
    assert body["receipt"]["billingTriggered"] is False
    assert secret not in repr(registry.settings) and secret not in str(body)


def test_tavily_failure_never_invokes_fixture():
    transport = UnavailableTransport()
    registry = WebDiscoveryProviderRegistry(
        {"ISEES_WEB_DISCOVERY_MODE": "TAVILY",
         "ISEES_TAVILY_API_KEY": "fake-tavily-key-123"}, transport=transport)
    response = WebDiscoverySearchRuntime(provider_registry=registry).search(
        principal_id="p", command=command()).response
    assert transport.calls == 1 and response.status == "UNAVAILABLE"
    assert response.runtimeStatus == "LIVE_WEB_DISCOVERY" and response.resultCount == 0
    assert "fixture" not in str(response.model_dump(mode="json")).casefold()


def test_browser_provider_metadata_is_rejected_and_server_selection_does_not_execute():
    registry = WebDiscoveryProviderRegistry({"ISEES_WEB_DISCOVERY_MODE": "OFFLINE_FIXTURE"})
    with pytest.raises(Exception):
        WebDiscoverySearchCommand.model_validate({
            **command().model_dump(), "adapterId": "browser-choice", "adapterVersion": "1"})
    assert registry.adapter.execution_count == 0


def test_duplicate_replay_and_principal_investigation_capture_authority_are_preserved():
    registry = WebDiscoveryProviderRegistry({"ISEES_WEB_DISCOVERY_MODE": "OFFLINE_FIXTURE"})
    runtime = WebDiscoverySearchRuntime(provider_registry=registry)
    cmd = command()
    first = runtime.search(principal_id="p1", command=cmd).response
    replay = runtime.search(principal_id="p1", command=cmd).response
    assert replay == first and runtime.adapter_execution_count == 1
    result_id = first.results[0].resultId
    runtime.resolve_capture(principal_id="p1", investigation_id="inv-1",
                            expected_investigation_revision=1,
                            manifold_revision_id="investigation-aggregate:1",
                            search_session_id="session-1", result_id=result_id)
    for principal, investigation in (("p2", "inv-1"), ("p1", "inv-2")):
        with pytest.raises(Exception):
            runtime.resolve_capture(
                principal_id=principal, investigation_id=investigation,
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
