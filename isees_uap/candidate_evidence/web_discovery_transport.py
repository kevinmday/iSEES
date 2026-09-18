"""Bounded, provider-neutral HTTP transport for Web Discovery.

This module transports JSON only to a server-configured HTTPS endpoint.  It has
no knowledge of provider schemas, Evidence, capture, persistence, or downstream
owners, and it never follows or fetches a search-result URL.
"""

from __future__ import annotations

from collections import defaultdict, deque
from contextlib import AbstractContextManager
from dataclasses import dataclass
from enum import Enum
import json
import logging
import threading
import time
from typing import Callable, Iterable, Mapping, Protocol
from urllib.parse import urlsplit

import httpx


MAX_REQUEST_BYTES = 8 * 1024
MAX_RESPONSE_BYTES = 256 * 1024
CONNECT_TIMEOUT_SECONDS = 3.0
READ_TIMEOUT_SECONDS = 8.0
TOTAL_DEADLINE_SECONDS = 10.0
MAX_CONCURRENCY = 4
DEFAULT_RATE_LIMIT = 30
RATE_WINDOW_SECONDS = 60.0
FAILURE_THRESHOLD = 5
CIRCUIT_WINDOW_SECONDS = 60.0
CIRCUIT_OPEN_SECONDS = 60.0


class CreditUsage(str, Enum):
    ZERO = "ZERO"
    ESTIMATED = "ESTIMATED"
    ACTUAL = "ACTUAL"
    UNKNOWN = "UNKNOWN"


class TransportErrorCode(str, Enum):
    INVALID_CONFIGURATION = "INVALID_CONFIGURATION"
    REQUEST_TOO_LARGE = "REQUEST_TOO_LARGE"
    RESPONSE_TOO_LARGE = "RESPONSE_TOO_LARGE"
    RATE_LIMITED = "RATE_LIMITED"
    CONCURRENCY_LIMITED = "CONCURRENCY_LIMITED"
    CIRCUIT_OPEN = "CIRCUIT_OPEN"
    CONNECT_TIMEOUT = "CONNECT_TIMEOUT"
    CONNECT_FAILURE = "CONNECT_FAILURE"
    READ_TIMEOUT = "READ_TIMEOUT"
    TOTAL_TIMEOUT = "TOTAL_TIMEOUT"
    CANCELLED = "CANCELLED"
    PROVIDER_FAILURE = "PROVIDER_FAILURE"


@dataclass(frozen=True, slots=True)
class TransportAccounting:
    provider_credits_consumed: int
    provider_credit_usage: CreditUsage
    monetary_cost: str = "0.00"
    researcher_charge: str = "0.00"
    billing_triggered: bool = False


ZERO_ACCOUNTING = TransportAccounting(0, CreditUsage.ZERO)


@dataclass(frozen=True, slots=True)
class TransportResult:
    status_code: int
    body: bytes
    accounting: TransportAccounting
    diagnostic: str = "request_completed"
    content_type: str | None = None


class TransportError(Exception):
    def __init__(self, code: TransportErrorCode, diagnostic: str,
                 accounting: TransportAccounting = ZERO_ACCOUNTING):
        super().__init__(code.value)
        self.code = code
        self.diagnostic = diagnostic
        self.accounting = accounting


class CancellationBoundary(Protocol):
    def is_cancelled(self) -> bool: ...


class StreamingResponse(Protocol):
    status_code: int
    headers: Mapping[str, str]
    def iter_bytes(self) -> Iterable[bytes]: ...


class HttpBackend(Protocol):
    def post_stream(self, *, url: str, content: bytes,
                    headers: Mapping[str, str]) -> AbstractContextManager[StreamingResponse]: ...


class AmbiguousDispatchError(Exception):
    """A backend could not determine whether its dispatched request was accepted."""


class HttpxBackend:
    """Production backend with verified TLS, no redirects, proxies, or retries."""

    def __init__(self) -> None:
        self._client = httpx.Client(
            verify=True, follow_redirects=False, trust_env=False,
            timeout=httpx.Timeout(READ_TIMEOUT_SECONDS, connect=CONNECT_TIMEOUT_SECONDS),
            transport=httpx.HTTPTransport(retries=0),
        )

    def post_stream(self, *, url: str, content: bytes,
                    headers: Mapping[str, str]) -> AbstractContextManager[StreamingResponse]:
        return self._client.stream("POST", url, content=content, headers=headers)


class _Circuit:
    def __init__(self) -> None:
        self.failures: deque[float] = deque()
        self.opened_at: float | None = None
        self.probe_active = False


class WebDiscoveryTransport:
    def __init__(self, *, endpoint: str, backend: HttpBackend | None = None,
                 clock: Callable[[], float] = time.monotonic,
                 rate_limit: int = DEFAULT_RATE_LIMIT,
                 logger: logging.Logger | None = None):
        self.endpoint = self._validate_endpoint(endpoint)
        if rate_limit < 1:
            raise ValueError("rate_limit must be positive")
        self._backend = backend or HttpxBackend()
        self._clock = clock
        self._rate_limit = rate_limit
        self._logger = logger or logging.getLogger(__name__)
        self._semaphore = threading.BoundedSemaphore(MAX_CONCURRENCY)
        self._lock = threading.Lock()
        self._global_dispatches: deque[float] = deque()
        self._principal_dispatches: dict[str, deque[float]] = defaultdict(deque)
        self._circuit = _Circuit()

    @staticmethod
    def _validate_endpoint(endpoint: str) -> str:
        try:
            parsed = urlsplit(endpoint)
            port = parsed.port
        except (TypeError, ValueError) as error:
            raise ValueError("provider endpoint is invalid") from error
        if (parsed.scheme != "https" or not parsed.hostname or parsed.username is not None
                or parsed.password is not None or parsed.query or parsed.fragment
                or port not in (None, 443)):
            raise ValueError("provider endpoint must be a fixed HTTPS destination")
        return endpoint

    def post_json(self, *, principal_id: str, payload: object,
                  secret_headers: Mapping[str, str] | None = None,
                  cancellation: CancellationBoundary | None = None) -> TransportResult:
        try:
            body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        except (TypeError, ValueError):
            raise TransportError(TransportErrorCode.INVALID_CONFIGURATION, "json_encoding_failed") from None
        if len(body) > MAX_REQUEST_BYTES:
            raise TransportError(TransportErrorCode.REQUEST_TOO_LARGE, "request_size_exceeded")
        if cancellation is not None and cancellation.is_cancelled():
            raise TransportError(TransportErrorCode.CANCELLED, "cancelled_before_dispatch")
        now = self._clock()
        probe = self._admit_circuit(now)
        if not self._semaphore.acquire(blocking=False):
            if probe:
                self._release_probe()
            raise TransportError(TransportErrorCode.CONCURRENCY_LIMITED, "concurrency_limit_reached")
        try:
            self._admit_rate(principal_id, now)
        except TransportError:
            self._semaphore.release()
            if probe:
                self._release_probe()
            raise
        accounting = TransportAccounting(1, CreditUsage.ESTIMATED)
        started = self._clock()
        headers = {"content-type": "application/json", "accept": "application/json"}
        headers.update(secret_headers or {})
        try:
            try:
                with self._backend.post_stream(url=self.endpoint, content=body, headers=headers) as response:
                    chunks: list[bytes] = []
                    size = 0
                    for chunk in response.iter_bytes():
                        if cancellation is not None and cancellation.is_cancelled():
                            raise TransportError(TransportErrorCode.CANCELLED, "cancelled_during_response", accounting)
                        if self._clock() - started > TOTAL_DEADLINE_SECONDS:
                            raise TransportError(TransportErrorCode.TOTAL_TIMEOUT, "total_deadline_exceeded", accounting)
                        size += len(chunk)
                        if size > MAX_RESPONSE_BYTES:
                            raise TransportError(TransportErrorCode.RESPONSE_TOO_LARGE, "response_size_exceeded", accounting)
                        chunks.append(chunk)
                    if self._clock() - started > TOTAL_DEADLINE_SECONDS:
                        raise TransportError(TransportErrorCode.TOTAL_TIMEOUT, "total_deadline_exceeded", accounting)
                    actual = TransportAccounting(1, CreditUsage.ACTUAL)
                    content_type = getattr(response, "headers", {}).get("content-type")
                    result = TransportResult(response.status_code, b"".join(chunks), actual,
                                             content_type=content_type)
                    if response.status_code == 429 or response.status_code >= 500:
                        raise TransportError(TransportErrorCode.PROVIDER_FAILURE,
                                             f"provider_status_{response.status_code}", actual)
            except httpx.ConnectTimeout:
                raise TransportError(TransportErrorCode.CONNECT_TIMEOUT, "connect_timeout", accounting) from None
            except (httpx.ConnectError, httpx.ProxyError):
                raise TransportError(TransportErrorCode.CONNECT_FAILURE, "connect_failure", accounting) from None
            except httpx.ReadTimeout:
                raise TransportError(TransportErrorCode.READ_TIMEOUT, "read_timeout", accounting) from None
            except AmbiguousDispatchError:
                unknown = TransportAccounting(1, CreditUsage.UNKNOWN)
                raise TransportError(TransportErrorCode.PROVIDER_FAILURE, "ambiguous_dispatch_failure", unknown) from None
            except TransportError:
                raise
            except Exception:
                raise TransportError(TransportErrorCode.PROVIDER_FAILURE, "provider_transport_failure", accounting) from None
        except TransportError as error:
            if error.code in (TransportErrorCode.RESPONSE_TOO_LARGE,
                              TransportErrorCode.CONNECT_TIMEOUT, TransportErrorCode.CONNECT_FAILURE,
                              TransportErrorCode.READ_TIMEOUT,
                              TransportErrorCode.TOTAL_TIMEOUT, TransportErrorCode.PROVIDER_FAILURE):
                self._record_failure(self._clock(), probe)
            elif probe:
                self._release_probe()
            self._logger.warning("web_discovery_transport_failure code=%s diagnostic=%s",
                                 error.code.value, error.diagnostic)
            raise
        else:
            self._record_success(probe)
            return result
        finally:
            self._semaphore.release()

    def _admit_rate(self, principal_id: str, now: float) -> None:
        with self._lock:
            principal = self._principal_dispatches[principal_id]
            for values in (self._global_dispatches, principal):
                while values and now - values[0] >= RATE_WINDOW_SECONDS:
                    values.popleft()
            if len(self._global_dispatches) >= self._rate_limit or len(principal) >= self._rate_limit:
                raise TransportError(TransportErrorCode.RATE_LIMITED, "dispatch_rate_limit_reached")
            self._global_dispatches.append(now)
            principal.append(now)

    def _admit_circuit(self, now: float) -> bool:
        with self._lock:
            circuit = self._circuit
            while circuit.failures and now - circuit.failures[0] >= CIRCUIT_WINDOW_SECONDS:
                circuit.failures.popleft()
            if circuit.opened_at is None:
                return False
            if now - circuit.opened_at < CIRCUIT_OPEN_SECONDS or circuit.probe_active:
                raise TransportError(TransportErrorCode.CIRCUIT_OPEN, "provider_circuit_open")
            circuit.probe_active = True
            return True

    def _record_failure(self, now: float, probe: bool) -> None:
        with self._lock:
            circuit = self._circuit
            if probe:
                circuit.probe_active = False
                circuit.opened_at = now
                return
            circuit.failures.append(now)
            while circuit.failures and now - circuit.failures[0] >= CIRCUIT_WINDOW_SECONDS:
                circuit.failures.popleft()
            if len(circuit.failures) >= FAILURE_THRESHOLD:
                circuit.opened_at = now

    def _record_success(self, probe: bool) -> None:
        with self._lock:
            if probe:
                self._circuit = _Circuit()

    def _release_probe(self) -> None:
        with self._lock:
            self._circuit.probe_active = False
