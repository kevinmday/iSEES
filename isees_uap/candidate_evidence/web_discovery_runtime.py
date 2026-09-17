"""Application runtime for metadata-only Web Discovery searches.

The process-local authority defaults to a 15-minute lifetime and 256 sessions.
Operators may set ``ISEES_WEB_DISCOVERY_SESSION_LIFETIME_SECONDS`` and
``ISEES_WEB_DISCOVERY_SESSION_CAPACITY`` to positive integers. Invalid values
fail closed during runtime construction.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from collections import OrderedDict
import os
from typing import Callable

from .web_discovery import (
    Cancellation, InMemoryWebDiscoverySessions, QUERY_NORMALIZATION_VERSION,
    SEARCH_SCHEMA_VERSION, SearchRequest, SelectedObjectContext,
    WebDiscoveryError, WebDiscoveryErrorCode, normalize_query,
)
from .web_discovery_fixture import (
    DeterministicWebDiscoveryFixture, FIXTURE_ADAPTER_ID, FIXTURE_ADAPTER_VERSION,
)
from .web_discovery_schemas import WebDiscoverySearchCommand, WebDiscoverySearchResponse


DEFAULT_SESSION_LIFETIME_SECONDS = 900
DEFAULT_SESSION_CAPACITY = 256


class WebDiscoveryRuntimeError(Exception):
    def __init__(self, code: str, message: str, status_code: int):
        super().__init__(message)
        self.code = code
        self.status_code = status_code


def _positive_environment_integer(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None:
        return default
    try:
        value = int(raw)
    except ValueError as error:
        raise RuntimeError(f"{name} must be a positive integer") from error
    if value <= 0:
        raise RuntimeError(f"{name} must be a positive integer")
    return value


@dataclass(frozen=True, slots=True)
class RuntimeSearchResult:
    response: WebDiscoverySearchResponse
    status_code: int


class WebDiscoverySearchRuntime:
    """Reusable search service isolated from Candidate Evidence persistence."""

    def __init__(self, *, lifetime_seconds: int | None = None, capacity: int | None = None,
                 clock: Callable[[], datetime] = lambda: datetime.now(timezone.utc),
                 adapter: DeterministicWebDiscoveryFixture | None = None):
        lifetime_seconds = lifetime_seconds if lifetime_seconds is not None else _positive_environment_integer(
            "ISEES_WEB_DISCOVERY_SESSION_LIFETIME_SECONDS", DEFAULT_SESSION_LIFETIME_SECONDS)
        capacity = capacity if capacity is not None else _positive_environment_integer(
            "ISEES_WEB_DISCOVERY_SESSION_CAPACITY", DEFAULT_SESSION_CAPACITY)
        if lifetime_seconds <= 0 or capacity <= 0:
            raise ValueError("Web Discovery lifetime and capacity must be positive")
        self._clock = clock
        self._lifetime = timedelta(seconds=lifetime_seconds)
        self._capacity = capacity
        self._authority_now = datetime(1970, 1, 1, tzinfo=timezone.utc)
        self._sessions = InMemoryWebDiscoverySessions(
            capacity=capacity, lifetime=self._lifetime, clock=lambda: self._authority_now)
        self._adapter = adapter or DeterministicWebDiscoveryFixture()
        self._requests: OrderedDict[tuple[str, str, str], SearchRequest] = OrderedDict()

    @property
    def session_count(self) -> int:
        self._authority_now = self._clock()
        return self._sessions.session_count

    @property
    def adapter_execution_count(self) -> int:
        return self._adapter.execution_count

    def search(self, *, principal_id: str, command: WebDiscoverySearchCommand) -> RuntimeSearchResult:
        if (command.adapterId, command.adapterVersion) != (FIXTURE_ADAPTER_ID, FIXTURE_ADAPTER_VERSION):
            raise WebDiscoveryRuntimeError(
                "WEB_DISCOVERY_UNSUPPORTED_ADAPTER", "The requested Web Discovery adapter is not authorized", 422)
        key = (principal_id, command.investigationId, command.idempotencyKey)
        now = self._clock()
        if now.tzinfo is None or now.utcoffset() is None:
            raise RuntimeError("Web Discovery clock must be timezone-aware")
        prior = self._requests.get(key)
        if prior is not None and prior.expires_at <= now:
            raise WebDiscoveryRuntimeError(
                "WEB_DISCOVERY_SESSION_EXPIRED", "The idempotent search session has expired", 410)
        created_at = prior.created_at if prior is not None else now
        context = command.selectedObjectContext
        request = SearchRequest(
            schema_version=SEARCH_SCHEMA_VERSION,
            search_session_id=command.searchSessionId,
            operation_id=command.operationId,
            principal_id=principal_id,
            investigation_id=command.investigationId,
            expected_investigation_revision=command.expectedInvestigationRevision,
            manifold_revision_id=command.manifoldRevisionId,
            normalized_query=normalize_query(command.query),
            query_normalization_version=QUERY_NORMALIZATION_VERSION,
            selected_object_context=SelectedObjectContext(
                context.objectType, context.objectId, context.objectRevision) if context else None,
            requested_result_limit=command.resultLimit,
            adapter_id=command.adapterId,
            adapter_version=command.adapterVersion,
            idempotency_key=command.idempotencyKey,
            metadata_only=command.executionPolicy.metadataOnly,
            zero_spend_authorized=command.executionPolicy.authorizedSpend == 0,
            created_at=created_at,
            expires_at=created_at + self._lifetime,
        )
        self._authority_now = created_at
        if prior is None:
            self._requests[key] = request
            while len(self._requests) > self._capacity:
                self._requests.popitem(last=False)
        try:
            outcome = self._sessions.search(request, self._adapter, Cancellation())
        except WebDiscoveryError as error:
            if key in self._requests and self._sessions.session_count == 0:
                self._requests.pop(key, None)
            raise self._translate(error) from error
        response = self._response(request, outcome)
        status_codes = {"UNAVAILABLE": 503, "RATE_LIMITED": 429, "FAILED": 502, "CANCELLED": 409}
        return RuntimeSearchResult(response, status_codes.get(outcome.status.value, 200))

    @staticmethod
    def _translate(error: WebDiscoveryError) -> WebDiscoveryRuntimeError:
        statuses = {
            WebDiscoveryErrorCode.IDEMPOTENCY_CONFLICT: ("IDEMPOTENCY_CONFLICT", 409),
            WebDiscoveryErrorCode.INVALID_REQUEST: ("WEB_DISCOVERY_INVALID_REQUEST", 422),
            WebDiscoveryErrorCode.SESSION_EXPIRED: (error.code.value, 410),
        }
        code, status = statuses.get(error.code, (error.code.value, 409))
        return WebDiscoveryRuntimeError(code, str(error), status)

    @staticmethod
    def _response(request, outcome) -> WebDiscoverySearchResponse:
        results = [{
            "resultId": item.result_id, "providerResultId": item.provider_result_id,
            "rank": item.rank, "title": item.title,
            "providerReturnedUrl": item.provider_returned_url,
            "normalizedUrl": item.normalized_url, "displayUrl": item.display_url,
            "displayDomain": item.display_domain, "snippet": item.snippet,
            "mediaType": item.media_type, "attribution": item.attribution,
            "retentionRestrictions": list(item.retention_restrictions),
            "providerMetadata": dict(item.provider_metadata),
        } for item in outcome.results]
        receipt = outcome.receipt
        return WebDiscoverySearchResponse.model_validate({
            "schemaVersion": outcome.schema_version,
            "searchSessionId": outcome.search_session_id, "operationId": outcome.operation_id,
            "investigationId": request.investigation_id,
            "expectedInvestigationRevision": request.expected_investigation_revision,
            "manifoldRevisionId": request.manifold_revision_id,
            "normalizedQuery": request.normalized_query,
            "queryNormalizationVersion": request.query_normalization_version,
            "adapterId": outcome.adapter_id, "adapterVersion": outcome.adapter_version,
            "status": outcome.status.value, "startedAt": outcome.started_at,
            "completedAt": outcome.completed_at, "expiresAt": request.expires_at,
            "resultCount": outcome.result_count, "results": results,
            "providerAttribution": outcome.provider_attribution,
            "restrictions": list(outcome.restrictions), "warnings": list(outcome.warnings),
            "error": ({"code": outcome.error.code.value, "message": outcome.error.message}
                      if outcome.error else None),
            "receipt": {
                "schemaVersion": receipt.schema_version, "operationId": receipt.operation_id,
                "investigationId": receipt.investigation_id,
                "manifoldRevisionId": receipt.manifold_revision_id, "status": receipt.status.value,
                "createdAt": receipt.created_at, "completedAt": receipt.completed_at,
                "aiAssistance": receipt.ai_assistance, "rexExecution": receipt.rex_execution,
                "estimatedProviderCost": receipt.estimated_provider_cost,
                "actualProviderCost": receipt.actual_provider_cost, "finalCharge": receipt.final_charge,
                "researchInboxEffect": receipt.research_inbox_effect,
                "publicationEffect": receipt.publication_effect,
                "candidateKnowledgeEffect": receipt.candidate_knowledge_effect,
                "canonEffect": receipt.canon_effect, "graphEffect": receipt.graph_effect,
                "manifoldEffect": receipt.manifold_effect, "resolveEffect": receipt.resolve_effect,
            },
        })
