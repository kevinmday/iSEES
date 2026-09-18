from contextlib import contextmanager
import logging
import threading

import httpx
import pytest

from isees_uap.candidate_evidence.web_discovery_transport import (
    AmbiguousDispatchError, CreditUsage, HttpxBackend, MAX_CONCURRENCY,
    MAX_RESPONSE_BYTES, TransportError, TransportErrorCode, WebDiscoveryTransport,
)


class Clock:
    def __init__(self): self.value = 0.0
    def __call__(self): return self.value
    def advance(self, seconds): self.value += seconds


class Cancellation:
    def __init__(self, value=False): self.value = value
    def is_cancelled(self): return self.value


class Response:
    def __init__(self, chunks=(b'{}',), status=200, action=None):
        self.chunks, self.status_code, self.action = chunks, status, action
    def iter_bytes(self):
        for chunk in self.chunks:
            if self.action: self.action()
            yield chunk


class Backend:
    def __init__(self, responses=None, error=None):
        self.responses = list(responses or [Response()])
        self.error = error
        self.calls = []
    @contextmanager
    def post_stream(self, **kwargs):
        self.calls.append(kwargs)
        if self.error: raise self.error
        yield self.responses.pop(0) if len(self.responses) > 1 else self.responses[0]


def error_code(code, call):
    with pytest.raises(TransportError) as raised: call()
    assert raised.value.code == code
    return raised.value


def test_fixed_https_destination_and_httpx_security_configuration(monkeypatch):
    for endpoint in ("http://api.example.com/search", "https://user:x@api.example.com/search",
                     "https://api.example.com:8443/search", "https://api.example.com/search?q=x"):
        with pytest.raises(ValueError): WebDiscoveryTransport(endpoint=endpoint, backend=Backend())
    captured = {}
    transport_options = {}
    monkeypatch.setattr(httpx, "HTTPTransport", lambda **kwargs: transport_options.update(kwargs) or object())
    monkeypatch.setattr(httpx, "Client", lambda **kwargs: captured.update(kwargs) or object())
    HttpxBackend()
    assert captured["verify"] is True and captured["follow_redirects"] is False
    assert captured["trust_env"] is False and transport_options["retries"] == 0


def test_exact_destination_json_and_secret_free_diagnostics(caplog):
    backend = Backend(error=RuntimeError("api-key=SECRET raw query"))
    transport = WebDiscoveryTransport(endpoint="https://api.example.com/search", backend=backend)
    with caplog.at_level(logging.WARNING):
        error = error_code(TransportErrorCode.PROVIDER_FAILURE, lambda: transport.post_json(
            principal_id="p", payload={"query": "sensitive raw query"},
            secret_headers={"Authorization": "Bearer SECRET"}))
    assert backend.calls[0]["url"] == "https://api.example.com/search"
    assert error.diagnostic == "provider_transport_failure"
    exposed = str(error) + caplog.text
    assert "SECRET" not in exposed and "sensitive" not in exposed


def test_request_limit_rejects_before_dispatch_and_zero_accounting():
    backend = Backend()
    error = error_code(TransportErrorCode.REQUEST_TOO_LARGE, lambda: WebDiscoveryTransport(
        endpoint="https://api.example.com/search", backend=backend).post_json(
            principal_id="p", payload={"query": "x" * 9000}))
    assert not backend.calls and error.accounting.provider_credit_usage == CreditUsage.ZERO


def test_streamed_response_limit_aborts_with_one_estimated_credit():
    error = error_code(TransportErrorCode.RESPONSE_TOO_LARGE, lambda: WebDiscoveryTransport(
        endpoint="https://api.example.com/search",
        backend=Backend([Response((b"x" * MAX_RESPONSE_BYTES, b"x"))])).post_json(
            principal_id="p", payload={}))
    assert error.accounting.provider_credits_consumed == 1
    assert error.accounting.provider_credit_usage == CreditUsage.ESTIMATED


@pytest.mark.parametrize("exception,code", [
    (httpx.ConnectTimeout("secret"), TransportErrorCode.CONNECT_TIMEOUT),
    (httpx.ReadTimeout("secret"), TransportErrorCode.READ_TIMEOUT),
])
def test_connect_and_read_timeout_mapping(exception, code):
    error = error_code(code, lambda: WebDiscoveryTransport(
        endpoint="https://api.example.com/search", backend=Backend(error=exception)).post_json(
            principal_id="p", payload={}))
    assert str(exception) not in str(error)


def test_total_deadline_and_caller_cancellation_client_disconnect_seam():
    clock = Clock()
    backend = Backend([Response(action=lambda: clock.advance(11))])
    error_code(TransportErrorCode.TOTAL_TIMEOUT, lambda: WebDiscoveryTransport(
        endpoint="https://api.example.com/search", backend=backend, clock=clock).post_json(
            principal_id="p", payload={}))
    cancellation = Cancellation()
    backend = Backend([Response(action=lambda: setattr(cancellation, "value", True))])
    error_code(TransportErrorCode.CANCELLED, lambda: WebDiscoveryTransport(
        endpoint="https://api.example.com/search", backend=backend).post_json(
            principal_id="p", payload={}, cancellation=cancellation))


def test_zero_retries_and_credit_accounting_variants():
    backend = Backend(error=AmbiguousDispatchError("unknown SECRET"))
    error = error_code(TransportErrorCode.PROVIDER_FAILURE, lambda: WebDiscoveryTransport(
        endpoint="https://api.example.com/search", backend=backend).post_json(
            principal_id="p", payload={}))
    assert len(backend.calls) == 1 and error.accounting.provider_credit_usage == CreditUsage.UNKNOWN
    success_backend = Backend()
    result = WebDiscoveryTransport(endpoint="https://api.example.com/search",
                                   backend=success_backend).post_json(principal_id="p", payload={})
    assert result.accounting.provider_credit_usage == CreditUsage.ACTUAL
    assert result.accounting.monetary_cost == result.accounting.researcher_charge == "0.00"
    assert result.accounting.billing_triggered is False


def test_process_concurrency_limit_is_four():
    entered = threading.Event(); release = threading.Event()
    class Blocking(Response):
        def iter_bytes(self):
            entered.set(); release.wait(2); yield b'{}'
    backend = Backend([Blocking() for _ in range(MAX_CONCURRENCY)])
    transport = WebDiscoveryTransport(endpoint="https://api.example.com/search", backend=backend)
    threads = [threading.Thread(target=lambda n=n: transport.post_json(principal_id=f"p{n}", payload={}))
               for n in range(MAX_CONCURRENCY)]
    for thread in threads: thread.start()
    assert entered.wait(1)
    error_code(TransportErrorCode.CONCURRENCY_LIMITED,
               lambda: transport.post_json(principal_id="overflow", payload={}))
    release.set()
    for thread in threads: thread.join()


def test_global_and_per_principal_rate_limits_are_predispatch():
    per = WebDiscoveryTransport(endpoint="https://api.example.com/search", backend=Backend(), rate_limit=2)
    per.post_json(principal_id="a", payload={}); per.post_json(principal_id="a", payload={})
    error = error_code(TransportErrorCode.RATE_LIMITED,
                       lambda: per.post_json(principal_id="a", payload={}))
    assert error.accounting.provider_credit_usage == CreditUsage.ZERO
    global_limit = WebDiscoveryTransport(endpoint="https://api.example.com/search", backend=Backend(), rate_limit=2)
    global_limit.post_json(principal_id="a", payload={}); global_limit.post_json(principal_id="b", payload={})
    error_code(TransportErrorCode.RATE_LIMITED,
               lambda: global_limit.post_json(principal_id="c", payload={}))


def test_circuit_closed_open_half_open_success_and_failure_accounting():
    clock = Clock()
    responses = [Response(status=500) for _ in range(5)] + [Response(), Response(status=500)]
    backend = Backend(responses)
    transport = WebDiscoveryTransport(endpoint="https://api.example.com/search", backend=backend,
                                      clock=clock, rate_limit=30)
    for _ in range(5): error_code(TransportErrorCode.PROVIDER_FAILURE,
                                  lambda: transport.post_json(principal_id="p", payload={}))
    error_code(TransportErrorCode.CIRCUIT_OPEN,
               lambda: transport.post_json(principal_id="p", payload={}))
    assert len(backend.calls) == 5
    clock.advance(60)
    assert transport.post_json(principal_id="p", payload={}).status_code == 200
    for _ in range(5):
        error_code(TransportErrorCode.PROVIDER_FAILURE,
                   lambda: transport.post_json(principal_id="p", payload={}))
    clock.advance(60)
    error_code(TransportErrorCode.PROVIDER_FAILURE,
               lambda: transport.post_json(principal_id="p", payload={}))
    error_code(TransportErrorCode.CIRCUIT_OPEN,
               lambda: transport.post_json(principal_id="p", payload={}))
