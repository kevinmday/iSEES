"""Provider-neutral, metadata-only Web Discovery domain.

This module deliberately has no Candidate Evidence, persistence, publication,
graph, Manifold, REX, agent, browser, or networking dependency.
"""

from __future__ import annotations

from collections import OrderedDict
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
import hashlib
import json
import unicodedata
from typing import Callable, Protocol, runtime_checkable

from .url_normalization import (
    URL_NORMALIZATION_VERSION, UrlNormalizationError, normalize_web_discovery_url,
)


SEARCH_SCHEMA_VERSION = "web-discovery-search/v1"
OUTCOME_SCHEMA_VERSION = "web-discovery-outcome/v1"
SESSION_SCHEMA_VERSION = "web-discovery-session/v1"
RECEIPT_SCHEMA_VERSION = "web-discovery-receipt/v1"
QUERY_NORMALIZATION_VERSION = "web-discovery-query-normalization/v1"
MAX_RESULT_LIMIT = 50
MAX_TITLE_LENGTH = 500
MAX_SNIPPET_LENGTH = 2_000
MAX_ATTRIBUTION_LENGTH = 500
MAX_RESTRICTION_COUNT = 20
MAX_RESTRICTION_LENGTH = 500
MAX_PROVIDER_METADATA_ENTRIES = 20
MAX_PROVIDER_METADATA_KEY_LENGTH = 100
MAX_PROVIDER_METADATA_VALUE_LENGTH = 500
MAX_OUTCOME_NOTE_COUNT = 20
MAX_OUTCOME_NOTE_LENGTH = 500
ALLOWED_PROVIDER_METADATA_KEYS = frozenset(
    {"language", "publishedAt", "sourceType", "thumbnailAvailable"}
)


def normalize_query(query: str) -> str:
    if not isinstance(query, str):
        raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_REQUEST, "query must be text")
    normalized = " ".join(unicodedata.normalize("NFKC", query).split())
    _require_text("normalized_query", normalized, 2_000)
    return normalized


class SearchStatus(str, Enum):
    COMPLETED = "COMPLETED"
    ZERO_RESULTS = "ZERO_RESULTS"
    CANCELLED = "CANCELLED"
    UNAVAILABLE = "UNAVAILABLE"
    RATE_LIMITED = "RATE_LIMITED"
    FAILED = "FAILED"


class WebDiscoveryErrorCode(str, Enum):
    UNAVAILABLE = "WEB_DISCOVERY_UNAVAILABLE"
    RATE_LIMITED = "WEB_DISCOVERY_RATE_LIMITED"
    PROVIDER_FAILURE = "WEB_DISCOVERY_PROVIDER_FAILURE"
    CANCELLED = "WEB_DISCOVERY_CANCELLED"
    SESSION_EXPIRED = "WEB_DISCOVERY_SESSION_EXPIRED"
    RESULT_NOT_FOUND = "WEB_DISCOVERY_RESULT_NOT_FOUND"
    RESULT_MISMATCH = "WEB_DISCOVERY_RESULT_MISMATCH"
    PRINCIPAL_MISMATCH = "WEB_DISCOVERY_PRINCIPAL_MISMATCH"
    INVESTIGATION_MISMATCH = "WEB_DISCOVERY_INVESTIGATION_MISMATCH"
    INVESTIGATION_REVISION_MISMATCH = "WEB_DISCOVERY_INVESTIGATION_REVISION_MISMATCH"
    MANIFOLD_REVISION_MISMATCH = "WEB_DISCOVERY_MANIFOLD_REVISION_MISMATCH"
    IDEMPOTENCY_CONFLICT = "WEB_DISCOVERY_IDEMPOTENCY_CONFLICT"
    INVALID_REQUEST = "WEB_DISCOVERY_INVALID_REQUEST"
    INVALID_PROVIDER_METADATA = "WEB_DISCOVERY_INVALID_PROVIDER_METADATA"


class WebDiscoveryError(Exception):
    def __init__(self, code: WebDiscoveryErrorCode, message: str):
        super().__init__(message)
        self.code = code


def _require_text(name: str, value: str, maximum: int = 500) -> None:
    if not isinstance(value, str) or not value or len(value) > maximum:
        raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_REQUEST, f"{name} is invalid")
    if any(ord(character) < 32 or ord(character) == 127 for character in value):
        raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_REQUEST, f"{name} contains control characters")


def _aware(value: datetime) -> bool:
    return value.tzinfo is not None and value.utcoffset() is not None


@dataclass(frozen=True, slots=True)
class SelectedObjectContext:
    object_type: str
    object_id: str
    object_revision: str | None = None

    def __post_init__(self) -> None:
        _require_text("object_type", self.object_type)
        _require_text("object_id", self.object_id)
        if self.object_revision is not None:
            _require_text("object_revision", self.object_revision)


@dataclass(frozen=True, slots=True)
class SearchRequest:
    schema_version: str
    search_session_id: str
    operation_id: str
    principal_id: str
    investigation_id: str
    expected_investigation_revision: int
    manifold_revision_id: str
    normalized_query: str
    query_normalization_version: str
    selected_object_context: SelectedObjectContext | None
    requested_result_limit: int
    adapter_id: str
    adapter_version: str
    idempotency_key: str
    metadata_only: bool
    zero_spend_authorized: bool
    created_at: datetime
    expires_at: datetime

    def __post_init__(self) -> None:
        if self.schema_version != SEARCH_SCHEMA_VERSION:
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_REQUEST, "unsupported search schema")
        for name in ("search_session_id", "operation_id", "principal_id", "investigation_id",
                     "manifold_revision_id", "normalized_query", "adapter_id", "adapter_version",
                     "idempotency_key"):
            _require_text(name, getattr(self, name))
        if self.query_normalization_version != QUERY_NORMALIZATION_VERSION:
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_REQUEST, "unsupported query normalization")
        if self.normalized_query != normalize_query(self.normalized_query):
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_REQUEST, "query is not normalized")
        if isinstance(self.expected_investigation_revision, bool) or self.expected_investigation_revision < 0:
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_REQUEST, "invalid Investigation revision")
        if not 1 <= self.requested_result_limit <= MAX_RESULT_LIMIT:
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_REQUEST, "result limit exceeds policy")
        if not self.metadata_only or not self.zero_spend_authorized:
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_REQUEST, "metadata-only zero-spend policy required")
        if not _aware(self.created_at) or not _aware(self.expires_at) or self.expires_at <= self.created_at:
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_REQUEST, "invalid search lifetime")


@dataclass(frozen=True, slots=True)
class SearchResult:
    result_id: str
    search_session_id: str
    provider_result_id: str | None
    rank: int
    title: str
    provider_returned_url: str
    normalized_url: str
    display_url: str
    display_domain: str
    snippet: str
    media_type: str | None
    attribution: str
    retention_restrictions: tuple[str, ...] = ()
    provider_metadata: tuple[tuple[str, str], ...] = ()
    result_at: datetime | None = None
    selected_object_context: SelectedObjectContext | None = None
    normalization_version: str = URL_NORMALIZATION_VERSION

    def __post_init__(self) -> None:
        for name, maximum in (("result_id", 500), ("search_session_id", 500),
                              ("title", MAX_TITLE_LENGTH), ("snippet", MAX_SNIPPET_LENGTH),
                              ("attribution", MAX_ATTRIBUTION_LENGTH)):
            _require_text(name, getattr(self, name), maximum)
        if self.provider_result_id is not None:
            _require_text("provider_result_id", self.provider_result_id, 500)
        if self.media_type is not None:
            _require_text("media_type", self.media_type, 200)
        if self.rank < 1:
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_PROVIDER_METADATA, "rank must be positive")
        try:
            normalized = normalize_web_discovery_url(self.provider_returned_url)
        except UrlNormalizationError as error:
            raise WebDiscoveryError(
                WebDiscoveryErrorCode.INVALID_PROVIDER_METADATA, "provider URL is invalid"
            ) from error
        if (self.normalized_url != normalized.normalized_url
                or self.display_domain != normalized.display_domain
                or self.display_url != normalized.normalized_url
                or self.normalization_version != normalized.normalization_version):
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_PROVIDER_METADATA, "URL metadata is inconsistent")
        if len(self.retention_restrictions) > MAX_RESTRICTION_COUNT or any(
            not value or len(value) > MAX_RESTRICTION_LENGTH for value in self.retention_restrictions
        ):
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_PROVIDER_METADATA, "retention restrictions exceed policy")
        if len(self.provider_metadata) > MAX_PROVIDER_METADATA_ENTRIES:
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_PROVIDER_METADATA, "provider metadata exceeds policy")
        keys = [key for key, _ in self.provider_metadata]
        if len(keys) != len(set(keys)) or any(
            key not in ALLOWED_PROVIDER_METADATA_KEYS or len(key) > MAX_PROVIDER_METADATA_KEY_LENGTH
            or not isinstance(value, str) or len(value) > MAX_PROVIDER_METADATA_VALUE_LENGTH
            for key, value in self.provider_metadata
        ):
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_PROVIDER_METADATA, "provider metadata is not allowlisted")
        if self.result_at is not None and not _aware(self.result_at):
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_PROVIDER_METADATA, "result timestamp must be timezone-aware")


@dataclass(frozen=True, slots=True)
class OperationReceipt:
    schema_version: str
    operation_id: str
    principal_id: str
    investigation_id: str
    manifold_revision_id: str
    status: SearchStatus
    created_at: datetime
    completed_at: datetime
    ai_assistance: str = "NONE"
    rex_execution: str = "NONE"
    estimated_provider_cost: int = 0
    actual_provider_cost: int = 0
    final_charge: int = 0
    research_inbox_effect: str = "NONE"
    publication_effect: str = "NONE"
    candidate_knowledge_effect: str = "NONE"
    canon_effect: str = "NONE"
    graph_effect: str = "NONE"
    manifold_effect: str = "NONE"
    resolve_effect: str = "NONE"

    def __post_init__(self) -> None:
        if self.schema_version != RECEIPT_SCHEMA_VERSION:
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_REQUEST, "unsupported receipt schema")
        zero = (self.estimated_provider_cost, self.actual_provider_cost, self.final_charge)
        effects = (self.ai_assistance, self.rex_execution, self.research_inbox_effect,
                   self.publication_effect, self.candidate_knowledge_effect, self.canon_effect,
                   self.graph_effect, self.manifold_effect, self.resolve_effect)
        if zero != (0, 0, 0) or any(value != "NONE" for value in effects):
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_REQUEST, "Web Discovery receipt must have zero effects")


@dataclass(frozen=True, slots=True)
class StableError:
    code: WebDiscoveryErrorCode
    message: str


@dataclass(frozen=True, slots=True)
class SearchOutcome:
    schema_version: str
    search_session_id: str
    operation_id: str
    adapter_id: str
    adapter_version: str
    provider_attribution: str
    started_at: datetime
    completed_at: datetime
    status: SearchStatus
    results: tuple[SearchResult, ...]
    receipt: OperationReceipt
    restrictions: tuple[str, ...] = ()
    warnings: tuple[str, ...] = ()
    error: StableError | None = None

    def __post_init__(self) -> None:
        if self.schema_version != OUTCOME_SCHEMA_VERSION:
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_PROVIDER_METADATA, "unsupported outcome schema")
        if len(self.results) > MAX_RESULT_LIMIT or any(
            result.search_session_id != self.search_session_id for result in self.results
        ):
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_PROVIDER_METADATA, "result/session mismatch")
        ranks = tuple(result.rank for result in self.results)
        if ranks != tuple(range(1, len(self.results) + 1)):
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_PROVIDER_METADATA, "results must have contiguous ranks")
        if len({result.result_id for result in self.results}) != len(self.results):
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_PROVIDER_METADATA, "result IDs must be unique")
        if self.status == SearchStatus.ZERO_RESULTS and self.results:
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_PROVIDER_METADATA, "zero-result outcome contains results")
        if self.status == SearchStatus.COMPLETED and not self.results:
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_PROVIDER_METADATA, "completed outcome contains no results")
        if self.status not in (SearchStatus.COMPLETED, SearchStatus.ZERO_RESULTS) and self.results:
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_PROVIDER_METADATA, "terminal error contains results")
        if self.receipt.status != self.status:
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_PROVIDER_METADATA, "receipt status mismatch")
        for values in (self.restrictions, self.warnings):
            if len(values) > MAX_OUTCOME_NOTE_COUNT or any(
                not value or len(value) > MAX_OUTCOME_NOTE_LENGTH for value in values
            ):
                raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_PROVIDER_METADATA, "outcome metadata exceeds policy")
        expected_error = self.status not in (SearchStatus.COMPLETED, SearchStatus.ZERO_RESULTS)
        if expected_error != (self.error is not None):
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_PROVIDER_METADATA, "outcome error/status mismatch")

    @property
    def result_count(self) -> int:
        return len(self.results)


@dataclass(frozen=True, slots=True)
class SessionProjection:
    schema_version: str
    search_session_id: str
    operation_id: str
    principal_id: str
    investigation_id: str
    expected_investigation_revision: int
    manifold_revision_id: str
    adapter_id: str
    adapter_version: str
    normalized_query: str
    query_normalization_version: str
    idempotency_key: str
    created_at: datetime
    expires_at: datetime
    selected_object_context: SelectedObjectContext | None
    status: SearchStatus
    result_count: int
    capture_count: int
    error: StableError | None
    receipt: OperationReceipt


@runtime_checkable
class CancellationBoundary(Protocol):
    def is_cancelled(self) -> bool: ...


@runtime_checkable
class WebDiscoveryAdapter(Protocol):
    adapter_id: str
    adapter_version: str

    def search(self, request: SearchRequest, cancellation: CancellationBoundary) -> SearchOutcome: ...


@dataclass(frozen=True, slots=True)
class Cancellation:
    cancelled: bool = False

    def is_cancelled(self) -> bool:
        return self.cancelled


@dataclass(slots=True)
class _SessionRecord:
    request: SearchRequest
    outcome: SearchOutcome
    fingerprint: str


class InMemoryWebDiscoverySessions:
    """Bounded, process-local authority for ephemeral selectable results."""

    def __init__(self, *, capacity: int, lifetime: timedelta,
                 clock: Callable[[], datetime] = lambda: datetime.now(timezone.utc)):
        if capacity < 1 or lifetime <= timedelta(0):
            raise ValueError("capacity and lifetime must be positive")
        self._capacity = capacity
        self._lifetime = lifetime
        self._clock = clock
        self._sessions: OrderedDict[str, _SessionRecord] = OrderedDict()
        self._idempotency: dict[tuple[str, str, str], tuple[str, str]] = {}

    @property
    def session_count(self) -> int:
        self._purge_expired()
        return len(self._sessions)

    def search(self, request: SearchRequest, adapter: WebDiscoveryAdapter,
               cancellation: CancellationBoundary) -> SearchOutcome:
        now = self._now()
        if request.created_at != now or request.expires_at != now + self._lifetime:
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_REQUEST, "lifetime must be configuration-owned")
        if request.adapter_id != adapter.adapter_id or request.adapter_version != adapter.adapter_version:
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_REQUEST, "adapter identity mismatch")
        self._purge_expired(now)
        key = (request.principal_id, request.investigation_id, request.idempotency_key)
        fingerprint = self._fingerprint(request)
        prior = self._idempotency.get(key)
        if prior is not None:
            prior_fingerprint, session_id = prior
            if prior_fingerprint != fingerprint:
                raise WebDiscoveryError(WebDiscoveryErrorCode.IDEMPOTENCY_CONFLICT, "idempotency key reused with changed input")
            record = self._sessions.get(session_id)
            if record is None:
                raise WebDiscoveryError(WebDiscoveryErrorCode.SESSION_EXPIRED, "idempotent session has expired")
            return record.outcome
        if request.search_session_id in self._sessions:
            raise WebDiscoveryError(WebDiscoveryErrorCode.RESULT_MISMATCH, "search session ID is already owned")
        outcome = adapter.search(request, cancellation)
        self._validate_outcome(request, outcome)
        self._sessions[request.search_session_id] = _SessionRecord(request, outcome, fingerprint)
        self._idempotency[key] = (fingerprint, request.search_session_id)
        while len(self._sessions) > self._capacity:
            session_id, evicted = self._sessions.popitem(last=False)
            evicted_key = (evicted.request.principal_id, evicted.request.investigation_id,
                           evicted.request.idempotency_key)
            self._idempotency.pop(evicted_key, None)
        return outcome

    def project(self, *, search_session_id: str, principal_id: str, investigation_id: str,
                expected_investigation_revision: int, manifold_revision_id: str) -> SessionProjection:
        record = self._authorize(search_session_id, principal_id, investigation_id,
                                 expected_investigation_revision, manifold_revision_id)
        request, outcome = record.request, record.outcome
        return SessionProjection(
            SESSION_SCHEMA_VERSION, request.search_session_id, request.operation_id,
            request.principal_id, request.investigation_id, request.expected_investigation_revision,
            request.manifold_revision_id, request.adapter_id, request.adapter_version,
            request.normalized_query, request.query_normalization_version, request.idempotency_key,
            request.created_at, request.expires_at, request.selected_object_context,
            outcome.status, outcome.result_count, 0, outcome.error, outcome.receipt,
        )

    def resolve_result(self, *, search_session_id: str, result_id: str, principal_id: str,
                       investigation_id: str, expected_investigation_revision: int,
                       manifold_revision_id: str) -> SearchResult:
        record = self._authorize(search_session_id, principal_id, investigation_id,
                                 expected_investigation_revision, manifold_revision_id)
        for result in record.outcome.results:
            if result.result_id == result_id:
                if result.search_session_id != search_session_id:
                    break
                return result
        if any(result.result_id == result_id for other_id, other in self._sessions.items()
               if other_id != search_session_id for result in other.outcome.results):
            raise WebDiscoveryError(WebDiscoveryErrorCode.RESULT_MISMATCH, "result belongs to another session")
        raise WebDiscoveryError(WebDiscoveryErrorCode.RESULT_NOT_FOUND, "result is not in the authoritative session")

    def _authorize(self, search_session_id: str, principal_id: str, investigation_id: str,
                   expected_investigation_revision: int, manifold_revision_id: str) -> _SessionRecord:
        self._purge_expired()
        record = self._sessions.get(search_session_id)
        if record is None:
            raise WebDiscoveryError(WebDiscoveryErrorCode.SESSION_EXPIRED, "session is absent or expired")
        request = record.request
        checks = (
            (request.principal_id == principal_id, WebDiscoveryErrorCode.PRINCIPAL_MISMATCH),
            (request.investigation_id == investigation_id, WebDiscoveryErrorCode.INVESTIGATION_MISMATCH),
            (request.expected_investigation_revision == expected_investigation_revision,
             WebDiscoveryErrorCode.INVESTIGATION_REVISION_MISMATCH),
            (request.manifold_revision_id == manifold_revision_id,
             WebDiscoveryErrorCode.MANIFOLD_REVISION_MISMATCH),
        )
        for valid, code in checks:
            if not valid:
                raise WebDiscoveryError(code, "session authority mismatch")
        return record

    def _purge_expired(self, now: datetime | None = None) -> None:
        now = now or self._now()
        for session_id, record in tuple(self._sessions.items()):
            if record.request.expires_at <= now:
                del self._sessions[session_id]
                # Retain the key tombstone so replay fails as expired, not as new work.

    def _now(self) -> datetime:
        now = self._clock()
        if not _aware(now):
            raise ValueError("clock must return a timezone-aware datetime")
        return now

    @staticmethod
    def _fingerprint(request: SearchRequest) -> str:
        governed = {
            name: getattr(request, name) for name in (
                "schema_version", "search_session_id", "operation_id", "principal_id",
                "investigation_id", "expected_investigation_revision", "manifold_revision_id",
                "normalized_query", "query_normalization_version", "selected_object_context",
                "requested_result_limit", "adapter_id", "adapter_version", "idempotency_key",
                "metadata_only", "zero_spend_authorized", "created_at", "expires_at")
        }
        encoded = json.dumps(governed, default=str, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(encoded.encode("utf-8")).hexdigest()

    @staticmethod
    def _validate_outcome(request: SearchRequest, outcome: SearchOutcome) -> None:
        if (outcome.search_session_id != request.search_session_id
                or outcome.operation_id != request.operation_id
                or outcome.adapter_id != request.adapter_id
                or outcome.adapter_version != request.adapter_version
                or outcome.result_count > request.requested_result_limit
                or outcome.receipt.operation_id != request.operation_id
                or outcome.receipt.principal_id != request.principal_id
                or outcome.receipt.investigation_id != request.investigation_id
                or outcome.receipt.manifold_revision_id != request.manifold_revision_id):
            raise WebDiscoveryError(WebDiscoveryErrorCode.INVALID_PROVIDER_METADATA, "adapter outcome violates request authority")
