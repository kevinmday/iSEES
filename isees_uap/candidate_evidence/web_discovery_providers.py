"""Fail-closed, server-owned Web Discovery provider selection."""

from __future__ import annotations

from dataclasses import replace
import os
from typing import Mapping

from .web_discovery import (
    CancellationBoundary, OperationReceipt, OUTCOME_SCHEMA_VERSION, RECEIPT_SCHEMA_VERSION,
    SearchOutcome, SearchRequest, SearchStatus, StableError, WebDiscoveryAdapter,
    WebDiscoveryErrorCode,
)
from .web_discovery_fixture import DeterministicWebDiscoveryFixture
from .web_discovery_tavily import TavilyWebDiscoveryAdapter


FALLBACK_ADAPTER_ID = "tavily-explicit-offline-fallback"
FALLBACK_ADAPTER_VERSION = "1.0.0"
FALLBACK_ATTRIBUTION = "Deterministic offline fixture (explicit fallback)"


class _UnavailableAdapter:
    adapter_id = TavilyWebDiscoveryAdapter.adapter_id
    adapter_version = TavilyWebDiscoveryAdapter.adapter_version
    provider_attribution = TavilyWebDiscoveryAdapter.provider_attribution
    execution_count = 0

    def search(self, request: SearchRequest, cancellation: CancellationBoundary) -> SearchOutcome:
        self.execution_count += 1
        status = SearchStatus.CANCELLED if cancellation.is_cancelled() else SearchStatus.UNAVAILABLE
        code = WebDiscoveryErrorCode.CANCELLED if status == SearchStatus.CANCELLED else WebDiscoveryErrorCode.UNAVAILABLE
        receipt = OperationReceipt(
            RECEIPT_SCHEMA_VERSION, request.operation_id, request.principal_id,
            request.investigation_id, request.manifold_revision_id, status,
            request.created_at, request.created_at)
        return SearchOutcome(
            OUTCOME_SCHEMA_VERSION, request.search_session_id, request.operation_id,
            self.adapter_id, self.adapter_version, self.provider_attribution,
            request.created_at, request.created_at, status, (), receipt,
            ("METADATA_ONLY", "SESSION_EPHEMERAL"), (), StableError(code, code.value))


class ExplicitFallbackAdapter:
    adapter_id = FALLBACK_ADAPTER_ID
    adapter_version = FALLBACK_ADAPTER_VERSION
    provider_attribution = FALLBACK_ATTRIBUTION

    def __init__(self, primary: WebDiscoveryAdapter):
        self._primary = primary
        self._fixture = DeterministicWebDiscoveryFixture()

    @property
    def execution_count(self) -> int:
        return self._primary.execution_count + self._fixture.execution_count

    def search(self, request: SearchRequest, cancellation: CancellationBoundary) -> SearchOutcome:
        primary_request = replace(request, adapter_id=self._primary.adapter_id,
                                  adapter_version=self._primary.adapter_version)
        primary = self._primary.search(primary_request, cancellation)
        if primary.status != SearchStatus.UNAVAILABLE:
            return replace(primary, adapter_id=self.adapter_id, adapter_version=self.adapter_version)
        fixture_request = replace(request, adapter_id=self._fixture.adapter_id,
                                  adapter_version=self._fixture.adapter_version)
        fallback = self._fixture.search(fixture_request, cancellation)
        results = tuple(replace(result, attribution=self.provider_attribution) for result in fallback.results)
        receipt = replace(
            fallback.receipt,
            provider_credits_consumed=primary.receipt.provider_credits_consumed,
            provider_credit_usage=primary.receipt.provider_credit_usage,
        )
        return replace(
            fallback, adapter_id=self.adapter_id, adapter_version=self.adapter_version,
            provider_attribution=self.provider_attribution, results=results, receipt=receipt,
            warnings=fallback.warnings + ("Offline fixture used after Tavily became unavailable.",))


class WebDiscoveryProviderRegistry:
    """Build exactly one provider mode from server environment configuration."""

    def __init__(self, environment: Mapping[str, str] | None = None, *, transport=None):
        environment = os.environ if environment is None else environment
        mode = environment.get("ISEES_WEB_DISCOVERY_MODE", "offline")
        if mode not in ("offline", "tavily", "explicit-fallback"):
            raise RuntimeError("ISEES_WEB_DISCOVERY_MODE is invalid")
        key = environment.get("ISEES_TAVILY_API_KEY")
        if mode == "offline":
            self.adapter: WebDiscoveryAdapter = DeterministicWebDiscoveryFixture()
        else:
            primary: WebDiscoveryAdapter = (
                TavilyWebDiscoveryAdapter(key, transport=transport) if key else _UnavailableAdapter())
            self.adapter = ExplicitFallbackAdapter(primary) if mode == "explicit-fallback" else primary
        self.mode = mode
