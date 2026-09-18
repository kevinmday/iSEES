"""Fail-closed, server-owned Web Discovery provider selection."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
import os
from typing import Mapping

from isees_uap.authentication.config import RedactedSecret

from .web_discovery import (
    CancellationBoundary, OperationReceipt, OUTCOME_SCHEMA_VERSION, RECEIPT_SCHEMA_VERSION,
    SearchOutcome, SearchRequest, SearchStatus, StableError, WebDiscoveryAdapter,
    WebDiscoveryErrorCode,
)
from .web_discovery_fixture import DeterministicWebDiscoveryFixture
from .web_discovery_tavily import TavilyWebDiscoveryAdapter


class WebDiscoveryMode(str, Enum):
    TAVILY = "TAVILY"
    OFFLINE_FIXTURE = "OFFLINE_FIXTURE"
    DISABLED = "DISABLED"


class WebDiscoveryRuntimeStatus(str, Enum):
    LIVE_WEB_DISCOVERY = "LIVE_WEB_DISCOVERY"
    OFFLINE_FIXTURE = "OFFLINE_FIXTURE"
    UNAVAILABLE = "UNAVAILABLE"


@dataclass(frozen=True, slots=True)
class WebDiscoverySettings:
    mode: WebDiscoveryMode
    tavily_api_key: RedactedSecret | None = field(default=None, repr=False)

    @classmethod
    def from_environment(cls, environment: Mapping[str, str] | None = None) -> "WebDiscoverySettings":
        values = os.environ if environment is None else environment
        raw_mode = values.get("ISEES_WEB_DISCOVERY_MODE", WebDiscoveryMode.DISABLED.value)
        try:
            mode = WebDiscoveryMode(raw_mode)
        except ValueError as error:
            raise RuntimeError("ISEES_WEB_DISCOVERY_MODE is invalid") from error
        raw_key = values.get("ISEES_TAVILY_API_KEY")
        key = None
        if raw_key is not None:
            if (raw_key != raw_key.strip() or not 8 <= len(raw_key) <= 512
                    or not raw_key.isascii() or any(character.isspace() for character in raw_key)):
                if mode is WebDiscoveryMode.TAVILY:
                    return cls(mode=WebDiscoveryMode.DISABLED)
            else:
                key = RedactedSecret(raw_key)
        if mode is WebDiscoveryMode.TAVILY and key is None:
            return cls(mode=WebDiscoveryMode.DISABLED)
        return cls(mode=mode, tavily_api_key=key if mode is WebDiscoveryMode.TAVILY else None)


class _UnavailableAdapter:
    adapter_id = "web-discovery-unavailable"
    adapter_version = "1.0.0"
    provider_attribution = "Web Discovery"

    def __init__(self):
        self.execution_count = 0

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
            ("METADATA_ONLY", "SESSION_EPHEMERAL"), (), StableError(code, "Web Discovery is unavailable"))


class WebDiscoveryProviderRegistry:
    """Build exactly one provider from validated server configuration."""

    def __init__(self, environment: Mapping[str, str] | None = None, *, settings=None, transport=None):
        if environment is not None and settings is not None:
            raise ValueError("environment and settings are mutually exclusive")
        self.settings = settings or WebDiscoverySettings.from_environment(environment)
        if self.settings.mode is WebDiscoveryMode.TAVILY:
            secret = self.settings.tavily_api_key
            assert secret is not None
            self.adapter: WebDiscoveryAdapter = TavilyWebDiscoveryAdapter(
                secret.get_secret_value(), transport=transport)
            self.runtime_status = WebDiscoveryRuntimeStatus.LIVE_WEB_DISCOVERY
        elif self.settings.mode is WebDiscoveryMode.OFFLINE_FIXTURE:
            self.adapter = DeterministicWebDiscoveryFixture()
            self.runtime_status = WebDiscoveryRuntimeStatus.OFFLINE_FIXTURE
        else:
            self.adapter = _UnavailableAdapter()
            self.runtime_status = WebDiscoveryRuntimeStatus.UNAVAILABLE
        self.mode = self.settings.mode.value
